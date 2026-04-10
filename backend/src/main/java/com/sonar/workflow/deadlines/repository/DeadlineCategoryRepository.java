package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeadlineCategoryRepository extends JpaRepository<DeadlineCategory, UUID> {

    Optional<DeadlineCategory> findByCode(String code);

    Optional<DeadlineCategory> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<DeadlineCategory> findByIsActiveTrue();

    List<DeadlineCategory> findByIsActiveTrueOrderByNameAsc();
}
