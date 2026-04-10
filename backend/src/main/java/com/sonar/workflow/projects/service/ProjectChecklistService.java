package com.sonar.workflow.projects.service;

import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.ProjectChecklistDTO;
import com.sonar.workflow.projects.dto.ProjectChecklistItemDTO;
import com.sonar.workflow.projects.entity.*;
import com.sonar.workflow.projects.repository.*;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectChecklistService {

    private final ProjectRepository projectRepository;
    private final ProjectChecklistRepository checklistRepository;
    private final ProjectChecklistItemRepository checklistItemRepository;
    private final UserRepository userRepository;

    // ==================== CHECKLISTS ====================

    @Transactional(readOnly = true)
    public List<ProjectChecklistDTO> getChecklists(UUID projectId) {
        return checklistRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectChecklistDTO> getTemplateChecklists() {
        return checklistRepository.findByIsTemplateTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectChecklistDTO getChecklistById(UUID checklistId) {
        ProjectChecklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new BusinessException("Checklist not found"));
        return toDTO(checklist);
    }

    @Transactional
    public ProjectChecklistDTO createChecklist(UUID projectId, ProjectChecklistDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectChecklist checklist = ProjectChecklist.builder()
                .project(project)
                .name(dto.getName())
                .description(dto.getDescription())
                .type(dto.getType() != null ? ProjectChecklist.ChecklistType.valueOf(dto.getType()) : ProjectChecklist.ChecklistType.CUSTOM)
                .isTemplate(dto.getIsTemplate() != null ? dto.getIsTemplate() : false)
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        ProjectChecklist saved = checklistRepository.save(checklist);
        log.info("Checklist '{}' created for project {}", saved.getName(), projectId);
        return toDTO(saved);
    }

    @Transactional
    public ProjectChecklistDTO updateChecklist(UUID checklistId, ProjectChecklistDTO dto) {
        ProjectChecklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new BusinessException("Checklist not found"));

        if (dto.getName() != null) checklist.setName(dto.getName());
        if (dto.getDescription() != null) checklist.setDescription(dto.getDescription());
        if (dto.getType() != null) checklist.setType(ProjectChecklist.ChecklistType.valueOf(dto.getType()));
        if (dto.getSortOrder() != null) checklist.setSortOrder(dto.getSortOrder());

        ProjectChecklist saved = checklistRepository.save(checklist);
        return toDTO(saved);
    }

    @Transactional
    public void deleteChecklist(UUID checklistId) {
        checklistRepository.deleteById(checklistId);
    }

    @Transactional
    public ProjectChecklistDTO applyTemplate(UUID projectId, UUID templateId) {
        ProjectChecklist template = checklistRepository.findById(templateId)
                .orElseThrow(() -> new BusinessException("Template checklist not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectChecklist newChecklist = ProjectChecklist.builder()
                .project(project)
                .name(template.getName())
                .description(template.getDescription())
                .type(template.getType())
                .isTemplate(false)
                .sortOrder(template.getSortOrder())
                .build();

        ProjectChecklist saved = checklistRepository.save(newChecklist);

        // Copy items from template
        List<ProjectChecklistItem> templateItems = checklistItemRepository.findByChecklistIdOrderBySortOrder(templateId);
        for (ProjectChecklistItem templateItem : templateItems) {
            ProjectChecklistItem newItem = ProjectChecklistItem.builder()
                    .checklist(saved)
                    .name(templateItem.getName())
                    .description(templateItem.getDescription())
                    .isMandatory(templateItem.getIsMandatory())
                    .sortOrder(templateItem.getSortOrder())
                    .build();
            checklistItemRepository.save(newItem);
        }

        log.info("Template '{}' applied to project {}", template.getName(), projectId);
        return toDTO(checklistRepository.findById(saved.getId()).orElse(saved));
    }

    // ==================== CHECKLIST ITEMS ====================

    @Transactional(readOnly = true)
    public List<ProjectChecklistItemDTO> getChecklistItems(UUID checklistId) {
        return checklistItemRepository.findByChecklistIdOrderBySortOrder(checklistId).stream()
                .map(this::toItemDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectChecklistItemDTO addChecklistItem(UUID checklistId, ProjectChecklistItemDTO dto) {
        ProjectChecklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new BusinessException("Checklist not found"));

        ProjectChecklistItem item = ProjectChecklistItem.builder()
                .checklist(checklist)
                .name(dto.getName())
                .description(dto.getDescription())
                .isMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : false)
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        ProjectChecklistItem saved = checklistItemRepository.save(item);
        return toItemDTO(saved);
    }

    @Transactional
    public ProjectChecklistItemDTO updateChecklistItem(UUID itemId, ProjectChecklistItemDTO dto) {
        ProjectChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException("Checklist item not found"));

        if (dto.getName() != null) item.setName(dto.getName());
        if (dto.getDescription() != null) item.setDescription(dto.getDescription());
        if (dto.getIsMandatory() != null) item.setIsMandatory(dto.getIsMandatory());
        if (dto.getSortOrder() != null) item.setSortOrder(dto.getSortOrder());

        ProjectChecklistItem saved = checklistItemRepository.save(item);
        return toItemDTO(saved);
    }

    @Transactional
    public ProjectChecklistItemDTO toggleChecklistItem(UUID itemId, UUID completedById) {
        ProjectChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException("Checklist item not found"));

        item.setIsCompleted(!item.getIsCompleted());
        if (item.getIsCompleted()) {
            item.setCompletedAt(LocalDateTime.now());
            if (completedById != null) {
                User user = userRepository.findById(completedById).orElse(null);
                item.setCompletedBy(user);
            }
        } else {
            item.setCompletedAt(null);
            item.setCompletedBy(null);
        }

        ProjectChecklistItem saved = checklistItemRepository.save(item);
        return toItemDTO(saved);
    }

    @Transactional
    public void deleteChecklistItem(UUID itemId) {
        checklistItemRepository.deleteById(itemId);
    }

    // ==================== HELPERS ====================

    private ProjectChecklistDTO toDTO(ProjectChecklist c) {
        long totalItems = checklistItemRepository.countByChecklistId(c.getId());
        long completedItems = checklistItemRepository.countByChecklistIdAndIsCompletedTrue(c.getId());
        double completionPct = totalItems > 0 ? (double) completedItems / totalItems * 100 : 0;

        List<ProjectChecklistItemDTO> items = checklistItemRepository.findByChecklistIdOrderBySortOrder(c.getId())
                .stream().map(this::toItemDTO).collect(Collectors.toList());

        return ProjectChecklistDTO.builder()
                .id(c.getId())
                .projectId(c.getProject().getId())
                .name(c.getName())
                .description(c.getDescription())
                .type(c.getType() != null ? c.getType().name() : null)
                .isTemplate(c.getIsTemplate())
                .sortOrder(c.getSortOrder())
                .totalItems((int) totalItems)
                .completedItems((int) completedItems)
                .completionPercentage(completionPct)
                .items(items)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ProjectChecklistItemDTO toItemDTO(ProjectChecklistItem i) {
        return ProjectChecklistItemDTO.builder()
                .id(i.getId())
                .checklistId(i.getChecklist().getId())
                .name(i.getName())
                .description(i.getDescription())
                .isCompleted(i.getIsCompleted())
                .isMandatory(i.getIsMandatory())
                .completedById(i.getCompletedBy() != null ? i.getCompletedBy().getId() : null)
                .completedByName(i.getCompletedBy() != null ? i.getCompletedBy().getFullName() : null)
                .completedAt(i.getCompletedAt())
                .sortOrder(i.getSortOrder())
                .build();
    }
}
