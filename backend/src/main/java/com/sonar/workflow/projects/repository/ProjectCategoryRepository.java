package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectCategoryRepository extends JpaRepository<ProjectCategory, UUID> {

    Optional<ProjectCategory> findByCode(String code);

    Optional<ProjectCategory> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<ProjectCategory> findByIsActiveTrue();

    List<ProjectCategory> findByIsActiveTrueOrderByNameAsc();
}
