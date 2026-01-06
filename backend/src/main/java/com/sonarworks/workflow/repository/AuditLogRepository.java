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

    @Query(value = "SELECT * FROM audit_logs a WHERE " +
            "(CAST(:username AS VARCHAR) IS NULL OR CAST(a.username AS VARCHAR) ILIKE '%' || CAST(:username AS VARCHAR) || '%') AND " +
            "(CAST(:action AS VARCHAR) IS NULL OR a.action = CAST(:action AS VARCHAR)) AND " +
            "(CAST(:entityType AS VARCHAR) IS NULL OR a.entity_type = CAST(:entityType AS VARCHAR)) AND " +
            "(CAST(:fromDate AS TIMESTAMP) IS NULL OR a.action_date >= CAST(:fromDate AS TIMESTAMP)) AND " +
            "(CAST(:toDate AS TIMESTAMP) IS NULL OR a.action_date <= CAST(:toDate AS TIMESTAMP)) " +
            "ORDER BY a.action_date DESC", nativeQuery = true)
    List<AuditLog> findAllFiltered(
            @Param("username") String username,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}
