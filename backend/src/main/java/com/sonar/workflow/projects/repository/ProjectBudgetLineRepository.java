package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectBudgetLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectBudgetLineRepository extends JpaRepository<ProjectBudgetLine, UUID> {

    List<ProjectBudgetLine> findByProjectIdOrderBySortOrder(UUID projectId);

    @Query("SELECT COALESCE(SUM(b.estimatedAmount), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumEstimatedByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.actualAmount), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumActualByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.committedAmount), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumCommittedByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.approvedAmount), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumApprovedByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.forecastAmount), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumForecastByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(b.originalEstimate), 0) FROM ProjectBudgetLine b WHERE b.project.id = :projectId")
    BigDecimal sumOriginalEstimateByProjectId(@Param("projectId") UUID projectId);
}
