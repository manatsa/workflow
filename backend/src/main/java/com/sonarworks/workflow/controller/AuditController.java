package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.AuditLogDTO;
import com.sonarworks.workflow.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLogs(pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> searchAuditLogs(
            @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.searchAuditLogs(q, pageable)));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsForEntity(
            @PathVariable String entityType, @PathVariable UUID entityId) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLogsForEntity(entityType, entityId)));
    }

    @GetMapping("/workflow-instance/{instanceId}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsForWorkflowInstance(
            @PathVariable UUID instanceId) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLogsForWorkflowInstance(instanceId)));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getAuditLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLogsByDateRange(startDate, endDate)));
    }
}
