package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.WorkflowInstance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, UUID> {

    Optional<WorkflowInstance> findByReferenceNumber(String referenceNumber);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.workflow.id = :workflowId ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByWorkflowId(@Param("workflowId") UUID workflowId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.initiator.id = :userId ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByInitiatorId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.status = :status ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByStatus(@Param("status") WorkflowInstance.Status status, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.currentApprover.user.id = :userId AND i.status = 'PENDING' ORDER BY i.submittedAt ASC")
    Page<WorkflowInstance> findPendingApprovalsByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.currentApprover.approverEmail = :email AND i.status = 'PENDING' ORDER BY i.submittedAt ASC")
    List<WorkflowInstance> findPendingApprovalsByEmail(@Param("email") String email);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.sbu.id = :sbuId ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findBySbuId(@Param("sbuId") UUID sbuId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.sbu.id IN :sbuIds ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findBySbuIds(@Param("sbuIds") List<UUID> sbuIds, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.createdAt BETWEEN :startDate AND :endDate ORDER BY i.createdAt DESC")
    List<WorkflowInstance> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(i) FROM WorkflowInstance i WHERE i.workflow.id = :workflowId")
    long countByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT i FROM WorkflowInstance i WHERE " +
            "(LOWER(i.referenceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<WorkflowInstance> searchInstances(@Param("search") String search, Pageable pageable);
}
