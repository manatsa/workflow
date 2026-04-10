package com.sonar.workflow.repository;

import com.sonar.workflow.entity.WorkflowInstance;
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

    @Query("SELECT i FROM WorkflowInstance i WHERE i.workflow.id = :workflowId AND i.isActive = true ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByWorkflowId(@Param("workflowId") UUID workflowId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.initiator.id = :userId AND i.isActive = true ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByInitiatorId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.status = :status AND i.isActive = true ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findByStatus(@Param("status") WorkflowInstance.Status status, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i LEFT JOIN i.currentApprover ca LEFT JOIN ca.user u WHERE " +
            "i.status = 'PENDING' AND i.isActive = true AND (u.id = :userId OR ca.approverEmail = :email) " +
            "ORDER BY i.submittedAt ASC")
    Page<WorkflowInstance> findPendingApprovalsByUserIdOrEmail(
            @Param("userId") UUID userId,
            @Param("email") String email,
            Pageable pageable);

    @Query("SELECT COUNT(i) FROM WorkflowInstance i LEFT JOIN i.currentApprover ca LEFT JOIN ca.user u WHERE " +
            "i.status = 'PENDING' AND i.isActive = true AND (u.id = :userId OR ca.approverEmail = :email)")
    long countPendingApprovalsByUserIdOrEmail(
            @Param("userId") UUID userId,
            @Param("email") String email);

    @Query("SELECT COUNT(i) FROM WorkflowInstance i WHERE i.initiator.id = :userId AND i.isActive = true")
    long countByInitiatorId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(i) FROM WorkflowInstance i WHERE i.initiator.id = :userId AND i.isActive = true AND i.status = 'PENDING'")
    long countPendingByInitiatorId(@Param("userId") UUID userId);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.currentApprover.approverEmail = :email AND i.status = 'PENDING' AND i.isActive = true ORDER BY i.submittedAt ASC")
    List<WorkflowInstance> findPendingApprovalsByEmail(@Param("email") String email);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.sbu.id = :sbuId AND i.isActive = true ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findBySbuId(@Param("sbuId") UUID sbuId, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.sbu.id IN :sbuIds AND i.isActive = true ORDER BY i.createdAt DESC")
    Page<WorkflowInstance> findBySbuIds(@Param("sbuIds") List<UUID> sbuIds, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.isActive = true AND i.createdAt BETWEEN :startDate AND :endDate ORDER BY i.createdAt DESC")
    List<WorkflowInstance> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(i) FROM WorkflowInstance i WHERE i.workflow.id = :workflowId AND i.isActive = true")
    long countByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.isActive = true AND " +
            "(LOWER(i.referenceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<WorkflowInstance> searchInstances(@Param("search") String search, Pageable pageable);

    @Query("SELECT i FROM WorkflowInstance i WHERE i.parentInstance.id = :parentInstanceId AND i.isActive = true ORDER BY i.createdAt ASC")
    List<WorkflowInstance> findChildInstances(@Param("parentInstanceId") UUID parentInstanceId);

    @Query("SELECT i FROM WorkflowInstance i JOIN FETCH i.workflow w JOIN FETCH i.initiator " +
           "WHERE i.status = 'PENDING' AND i.isActive = true AND w.reminderEnabled = true")
    List<WorkflowInstance> findPendingWithRemindersEnabled();
}
