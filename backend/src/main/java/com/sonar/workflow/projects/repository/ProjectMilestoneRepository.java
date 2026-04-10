package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, UUID> {

    List<ProjectMilestone> findByProjectIdOrderBySortOrder(UUID projectId);

    List<ProjectMilestone> findByProjectIdAndStatus(UUID projectId, ProjectMilestone.MilestoneStatus status);
}
