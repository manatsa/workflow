package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "entity_name")
    private String entityName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(nullable = false)
    private String username;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_full_name")
    private String userFullName;

    @Column(name = "action_date", nullable = false)
    private LocalDateTime actionDate;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "old_values", columnDefinition = "TEXT")
    private String oldValues;

    @Column(name = "new_values", columnDefinition = "TEXT")
    private String newValues;

    @Column(name = "changes", columnDefinition = "TEXT")
    private String changes;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "module")
    private String module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id")
    private WorkflowInstance workflowInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sbu_id")
    private SBU sbu;

    public enum AuditAction {
        CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, PASSWORD_CHANGE, PASSWORD_RESET,
        SUBMIT, APPROVE, REJECT, ESCALATE, CANCEL, LOCK, UNLOCK,
        IMPORT, EXPORT, BACKUP, RESTORE, SYSTEM_LOCK, SYSTEM_UNLOCK
    }
}
