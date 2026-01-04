package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false)
    private WorkflowInstance workflowInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approver_name")
    private String approverName;

    @Column(name = "approver_email")
    private String approverEmail;

    @Column
    private Integer level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "action_date")
    private LocalDateTime actionDate;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "action_source")
    @Enumerated(EnumType.STRING)
    private ActionSource actionSource = ActionSource.SYSTEM;

    public enum Action {
        SUBMITTED, APPROVED, REJECTED, ESCALATED, CANCELLED, RETURNED, REASSIGNED, RECALLED
    }

    public enum ActionSource {
        SYSTEM, EMAIL
    }
}
