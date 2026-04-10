package com.sonar.workflow.leave.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leave_approval_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprovalHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_request_id", nullable = false)
    private LeaveRequest leaveRequest;

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
    @Builder.Default
    private LocalDateTime actionDate = LocalDateTime.now();

    public enum Action {
        SUBMITTED, APPROVED, REJECTED, REASSIGNED, ESCALATED, CANCELLED, RECALLED
    }
}
