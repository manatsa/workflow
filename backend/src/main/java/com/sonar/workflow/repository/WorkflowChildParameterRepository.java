package com.sonar.workflow.repository;

import com.sonar.workflow.entity.WorkflowChildParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowChildParameterRepository extends JpaRepository<WorkflowChildParameter, UUID> {

    @Query("SELECT wcp FROM WorkflowChildParameter wcp WHERE wcp.childWorkflow.id = :childWorkflowId AND wcp.isActive = true ORDER BY wcp.displayOrder ASC")
    List<WorkflowChildParameter> findByChildWorkflowId(@Param("childWorkflowId") UUID childWorkflowId);

    @Query("SELECT wcp FROM WorkflowChildParameter wcp WHERE wcp.childWorkflow.id = :childWorkflowId AND wcp.isActive = true AND wcp.sourceField = :sourceField")
    List<WorkflowChildParameter> findByChildWorkflowIdAndSourceField(@Param("childWorkflowId") UUID childWorkflowId, @Param("sourceField") String sourceField);

    void deleteByChildWorkflowId(UUID childWorkflowId);
}
