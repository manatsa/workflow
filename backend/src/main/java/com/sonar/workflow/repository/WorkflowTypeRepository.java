package com.sonar.workflow.repository;

import com.sonar.workflow.entity.WorkflowType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTypeRepository extends JpaRepository<WorkflowType, UUID> {

    Optional<WorkflowType> findByName(String name);

    Optional<WorkflowType> findByCode(String code);

    boolean existsByName(String name);

    boolean existsByCode(String code);

    List<WorkflowType> findByIsActiveTrue();
}
