package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, UUID> {

    List<ProjectTask> findByProjectIdOrderBySortOrder(UUID projectId);

    List<ProjectTask> findByProjectIdAndIsActiveTrue(UUID projectId);

    List<ProjectTask> findByAssigneeId(UUID assigneeId);

    List<ProjectTask> findByProjectIdAndStatus(UUID projectId, ProjectTask.TaskStatus status);

    List<ProjectTask> findByProjectIdAndPhaseId(UUID projectId, UUID phaseId);

    List<ProjectTask> findByProjectIdAndMilestoneId(UUID projectId, UUID milestoneId);

    List<ProjectTask> findByParentTaskId(UUID parentTaskId);

    long countByProjectIdAndIsActiveTrue(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, ProjectTask.TaskStatus status);
}
