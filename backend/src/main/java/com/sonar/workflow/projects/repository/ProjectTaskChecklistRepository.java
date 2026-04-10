package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectTaskChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTaskChecklistRepository extends JpaRepository<ProjectTaskChecklist, UUID> {

    List<ProjectTaskChecklist> findByTaskIdOrderBySortOrder(UUID taskId);

    long countByTaskId(UUID taskId);

    long countByTaskIdAndIsCompletedTrue(UUID taskId);
}
