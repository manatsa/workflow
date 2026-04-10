package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectChecklistItemRepository extends JpaRepository<ProjectChecklistItem, UUID> {

    List<ProjectChecklistItem> findByChecklistIdOrderBySortOrder(UUID checklistId);

    long countByChecklistId(UUID checklistId);

    long countByChecklistIdAndIsCompletedTrue(UUID checklistId);
}
