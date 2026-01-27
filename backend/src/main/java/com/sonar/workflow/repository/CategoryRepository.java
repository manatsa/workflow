package com.sonar.workflow.repository;

import com.sonar.workflow.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByCode(String code);

    Optional<Category> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<Category> findByIsActiveTrue();

    List<Category> findByIsActiveTrueOrderByNameAsc();
}
