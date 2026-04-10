package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectIssueRepository extends JpaRepository<ProjectIssue, UUID> {

    List<ProjectIssue> findByProjectId(UUID projectId);

    List<ProjectIssue> findByProjectIdAndStatus(UUID projectId, ProjectIssue.IssueStatus status);

    long countByProjectIdAndStatusNot(UUID projectId, ProjectIssue.IssueStatus status);
}
