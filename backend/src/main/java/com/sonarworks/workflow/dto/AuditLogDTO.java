package com.sonarworks.workflow.dto;

import com.sonarworks.workflow.entity.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {

    private UUID id;
    private String entityType;
    private UUID entityId;
    private String entityName;
    private AuditLog.AuditAction action;
    private String username;
    private UUID userId;
    private String userFullName;
    private LocalDateTime actionDate;
    private String summary;
    private String oldValues;
    private String newValues;
    private String changes;
    private String ipAddress;
    private String module;
    private UUID workflowInstanceId;
    private String workflowInstanceRef;
    private UUID sbuId;
    private String sbuName;
}
