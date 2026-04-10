package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.RiskIssueCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskIssueCategoryRepository extends JpaRepository<RiskIssueCategory, UUID> {

    List<RiskIssueCategory> findByIsActiveTrueOrderByNameAsc();

    List<RiskIssueCategory> findByTypeAndIsActiveTrueOrderByNameAsc(RiskIssueCategory.CategoryType type);

    List<RiskIssueCategory> findByTypeInAndIsActiveTrueOrderByNameAsc(List<RiskIssueCategory.CategoryType> types);

    Optional<RiskIssueCategory> findByCode(String code);

    boolean existsByCode(String code);
}
