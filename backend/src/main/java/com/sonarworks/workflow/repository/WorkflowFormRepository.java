package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.WorkflowForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowFormRepository extends JpaRepository<WorkflowForm, UUID> {

    @Query("SELECT f FROM WorkflowForm f WHERE f.workflow.id = :workflowId ORDER BY f.displayOrder")
    List<WorkflowForm> findByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT f FROM WorkflowForm f WHERE f.workflow.id = :workflowId AND f.isMainForm = true")
    WorkflowForm findMainFormByWorkflowId(@Param("workflowId") UUID workflowId);
}
