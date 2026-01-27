package com.sonar.workflow.repository;

import com.sonar.workflow.entity.Workflow;
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
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {

    Optional<Workflow> findByName(String name);

    Optional<Workflow> findByCode(String code);

    boolean existsByName(String name);

    boolean existsByCode(String code);

    List<Workflow> findByIsPublishedTrue();

    List<Workflow> findByIsActiveTrue();

    @Query("SELECT w FROM Workflow w WHERE w.isPublished = true AND w.isActive = true ORDER BY w.displayOrder")
    List<Workflow> findActivePublishedWorkflows();

    @Query("SELECT w FROM Workflow w JOIN w.sbus s WHERE s.id IN :sbuIds AND w.isPublished = true AND w.isActive = true")
    List<Workflow> findBySbuIds(@Param("sbuIds") List<UUID> sbuIds);

    @Query("SELECT w FROM Workflow w WHERE w.workflowType.id = :typeId")
    List<Workflow> findByWorkflowTypeId(@Param("typeId") UUID typeId);

    @Query("SELECT w FROM Workflow w WHERE " +
            "(LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Workflow> searchWorkflows(@Param("search") String search, Pageable pageable);
}
