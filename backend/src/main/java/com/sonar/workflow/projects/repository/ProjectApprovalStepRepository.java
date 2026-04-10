package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectApprovalStep;
import com.sonar.workflow.projects.entity.ProjectApprovalStep.StepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectApprovalStepRepository extends JpaRepository<ProjectApprovalStep, UUID> {

    List<ProjectApprovalStep> findByProjectIdOrderByLevelAscDisplayOrderAsc(UUID projectId);

    Optional<ProjectApprovalStep> findByProjectIdAndStatus(UUID projectId, StepStatus status);

    @Query("SELECT MAX(s.level) FROM ProjectApprovalStep s WHERE s.project.id = :projectId")
    Integer findMaxLevelByProjectId(@Param("projectId") UUID projectId);

    List<ProjectApprovalStep> findByProjectIdAndLevelAndStatus(UUID projectId, Integer level, StepStatus status);
}
