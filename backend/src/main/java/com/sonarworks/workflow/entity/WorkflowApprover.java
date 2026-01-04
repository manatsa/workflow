package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "workflow_approvers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowApprover extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "approver_name")
    private String approverName;

    @Column(name = "approver_email")
    private String approverEmail;

    @Column(nullable = false)
    private Integer level = 1;

    @Column(name = "approval_limit")
    private BigDecimal approvalLimit;

    @Column(name = "is_unlimited")
    private Boolean isUnlimited = true;

    @Column(name = "can_escalate")
    private Boolean canEscalate = true;

    @Column(name = "escalation_timeout_hours")
    private Integer escalationTimeoutHours;

    @Column(name = "notify_on_pending")
    private Boolean notifyOnPending = true;

    @Column(name = "notify_on_approval")
    private Boolean notifyOnApproval = true;

    @Column(name = "notify_on_rejection")
    private Boolean notifyOnRejection = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sbu_id")
    private SBU sbu;

    @Column(name = "display_order")
    private Integer displayOrder = 0;
}
