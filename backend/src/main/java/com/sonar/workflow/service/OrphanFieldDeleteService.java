package com.sonar.workflow.service;

import com.sonar.workflow.dto.WorkflowFieldDTO;
import com.sonar.workflow.dto.WorkflowFormDTO;
import com.sonar.workflow.entity.WorkflowField;
import com.sonar.workflow.repository.WorkflowFieldRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;

/**
 * Deletes orphan fields in an isolated transaction that commits BEFORE the
 * main workflow-update transaction continues. This avoids every Hibernate
 * state conflict we've seen (StaleObjectStateException, "no collection snapshot",
 * "detached entity passed to persist") because:
 *   - The delete transaction ends before the update transaction reads state
 *   - The update transaction's PC has no stale references to the deleted rows
 *
 * The nested PROPAGATION.REQUIRES_NEW suspends the outer transaction for the
 * duration of this call.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrphanFieldDeleteService {

    @PersistenceContext
    private EntityManager entityManager;

    private final WorkflowFieldRepository workflowFieldRepository;

    /**
     * Returns true if any orphan fields were actually deleted. Callers can use this
     * to decide whether a PC clear + refetch is needed.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean deleteOrphans(UUID workflowId, List<WorkflowFormDTO> formDtos) {
        // Collect field IDs being KEPT according to incoming DTOs
        Set<UUID> incomingFieldIds = new HashSet<>();
        for (WorkflowFormDTO formDto : formDtos) {
            if (formDto.getFields() != null) {
                for (WorkflowFieldDTO f : formDto.getFields()) {
                    UUID id = tryParseUuid(f.getId());
                    if (id != null) incomingFieldIds.add(id);
                }
            }
        }

        // Find orphans
        List<WorkflowField> existingFields = workflowFieldRepository.findByWorkflowId(workflowId);
        List<UUID> orphanIds = new ArrayList<>();
        List<String> orphanNames = new ArrayList<>();
        for (WorkflowField f : existingFields) {
            if (!incomingFieldIds.contains(f.getId())) {
                orphanIds.add(f.getId());
                orphanNames.add(f.getName());
            }
        }

        if (orphanIds.isEmpty()) return false;

        log.info("[OrphanFieldDeleteService] Deleting {} orphan field(s) for workflow {}: {}",
                orphanIds.size(), workflowId, orphanNames);

        // Pure native SQL — no JPA lifecycle interference.
        for (UUID fieldId : orphanIds) {
            int v = entityManager.createNativeQuery("DELETE FROM workflow_field_values WHERE field_id = ?1")
                    .setParameter(1, fieldId).executeUpdate();
            int o = entityManager.createNativeQuery("DELETE FROM field_options WHERE field_id = ?1")
                    .setParameter(1, fieldId).executeUpdate();
            int f = entityManager.createNativeQuery("DELETE FROM workflow_fields WHERE id = ?1")
                    .setParameter(1, fieldId).executeUpdate();
            log.info("[OrphanFieldDeleteService] Deleted field {} (values={}, options={}, field={})",
                    fieldId, v, o, f);
        }
        // Transaction commits here — rows are gone from DB before returning.
        return true;
    }

    private static UUID tryParseUuid(String s) {
        if (s == null || s.isBlank()) return null;
        try { return UUID.fromString(s.trim()); } catch (Exception e) { return null; }
    }
}
