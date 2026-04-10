package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectBudgetAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectBudgetAdjustmentRepository extends JpaRepository<ProjectBudgetAdjustment, UUID> {

    List<ProjectBudgetAdjustment> findByBudgetLineIdOrderByAdjustedAtDesc(UUID budgetLineId);

    List<ProjectBudgetAdjustment> findByBudgetLineProjectIdOrderByAdjustedAtDesc(UUID projectId);

    long countByBudgetLineId(UUID budgetLineId);
}
