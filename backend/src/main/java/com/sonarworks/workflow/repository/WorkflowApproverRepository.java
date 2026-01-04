package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.WorkflowApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowApproverRepository extends JpaRepository<WorkflowApprover, UUID> {

    @Query("SELECT a FROM WorkflowApprover a WHERE a.workflow.id = :workflowId ORDER BY a.level, a.displayOrder")
    List<WorkflowApprover> findByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT a FROM WorkflowApprover a WHERE a.workflow.id = :workflowId AND a.level = :level")
    List<WorkflowApprover> findByWorkflowIdAndLevel(@Param("workflowId") UUID workflowId, @Param("level") Integer level);

    @Query("SELECT a FROM WorkflowApprover a WHERE a.user.id = :userId AND a.workflow.id = :workflowId")
    Optional<WorkflowApprover> findByUserIdAndWorkflowId(@Param("userId") UUID userId, @Param("workflowId") UUID workflowId);

    @Query("SELECT a FROM WorkflowApprover a WHERE a.approverEmail = :email AND a.workflow.id = :workflowId")
    Optional<WorkflowApprover> findByEmailAndWorkflowId(@Param("email") String email, @Param("workflowId") UUID workflowId);

    @Query("SELECT a FROM WorkflowApprover a WHERE a.workflow.id = :workflowId AND a.level = :level AND " +
            "(a.isUnlimited = true OR a.approvalLimit >= :amount)")
    List<WorkflowApprover> findEligibleApprovers(
            @Param("workflowId") UUID workflowId,
            @Param("level") Integer level,
            @Param("amount") BigDecimal amount);

    @Query("SELECT MAX(a.level) FROM WorkflowApprover a WHERE a.workflow.id = :workflowId")
    Integer findMaxLevelByWorkflowId(@Param("workflowId") UUID workflowId);
}
