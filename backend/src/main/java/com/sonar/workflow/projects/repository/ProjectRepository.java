package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByIsActiveTrueOrderByCreatedAtDesc();

    Optional<Project> findByCode(String code);

    boolean existsByCode(String code);

    List<Project> findByStatus(Project.ProjectStatus status);

    List<Project> findByManagerId(UUID managerId);

    List<Project> findBySbuId(UUID sbuId);

    @Query("SELECT p FROM Project p WHERE p.isActive = true AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchProjects(@Param("search") String search, Pageable pageable);

    long countByStatus(Project.ProjectStatus status);

    long countByIsActiveTrue();

    @Query("SELECT p FROM Project p WHERE p.isActive = true AND p.endDate < CURRENT_DATE AND p.status NOT IN (com.sonar.workflow.projects.entity.Project.ProjectStatus.COMPLETED, com.sonar.workflow.projects.entity.Project.ProjectStatus.CANCELLED, com.sonar.workflow.projects.entity.Project.ProjectStatus.ARCHIVED)")
    List<Project> findOverdueProjects();

    boolean existsByCategoryId(UUID categoryId);

    long countByCodeStartingWith(String codePrefix);
}
