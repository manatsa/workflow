package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRiskRepository extends JpaRepository<ProjectRisk, UUID> {

    List<ProjectRisk> findByProjectId(UUID projectId);

    List<ProjectRisk> findByProjectIdAndStatus(UUID projectId, ProjectRisk.RiskStatus status);

    long countByProjectIdAndStatusNot(UUID projectId, ProjectRisk.RiskStatus status);
}
