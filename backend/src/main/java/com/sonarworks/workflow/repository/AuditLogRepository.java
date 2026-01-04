package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.actionDate DESC")
    List<AuditLog> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT a FROM AuditLog a WHERE a.username = :username ORDER BY a.actionDate DESC")
    Page<AuditLog> findByUsername(@Param("username") String username, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.workflowInstance.id = :instanceId ORDER BY a.actionDate DESC")
    List<AuditLog> findByWorkflowInstanceId(@Param("instanceId") UUID instanceId);

    @Query("SELECT a FROM AuditLog a WHERE a.actionDate BETWEEN :startDate AND :endDate ORDER BY a.actionDate DESC")
    List<AuditLog> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a FROM AuditLog a WHERE a.action = :action ORDER BY a.actionDate DESC")
    Page<AuditLog> findByAction(@Param("action") AuditLog.AuditAction action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.module = :module ORDER BY a.actionDate DESC")
    Page<AuditLog> findByModule(@Param("module") String module, Pageable pageable);

    @Query("SELECT a FROM AuditLog a ORDER BY a.actionDate DESC")
    Page<AuditLog> findAllOrderByDate(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(LOWER(a.summary) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AuditLog> searchAuditLogs(@Param("search") String search, Pageable pageable);
}
