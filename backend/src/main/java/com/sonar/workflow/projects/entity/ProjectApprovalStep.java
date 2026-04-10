package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_approval_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectApprovalStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_user_id")
    private User approverUser;

    @Column(name = "approver_name")
    private String approverName;

    @Column(name = "approver_email")
    private String approverEmail;

    @Column(nullable = false)
    private Integer level;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "approval_limit", precision = 19, scale = 2)
    private BigDecimal approvalLimit;

    @Column(name = "is_unlimited")
    @Builder.Default
    private Boolean isUnlimited = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StepStatus status = StepStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private StepAction action;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "action_date")
    private LocalDateTime actionDate;

    public enum StepStatus {
        PENDING, CURRENT, APPROVED, REJECTED, SKIPPED
    }

    public enum StepAction {
        APPROVED, REJECTED
    }
}
