package com.sonar.workflow.leave.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.Department;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leave_approvers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"department_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveApprover extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(name = "approver_name")
    private String approverName;

    @Column(name = "approver_email")
    private String approverEmail;

    @Column(name = "can_escalate")
    @Builder.Default
    private Boolean canEscalate = true;

    @Column(name = "escalation_timeout_hours")
    private Integer escalationTimeoutHours;

    @Column(name = "notify_on_pending")
    @Builder.Default
    private Boolean notifyOnPending = true;

    @Column(name = "notify_on_approval")
    @Builder.Default
    private Boolean notifyOnApproval = true;

    @Column(name = "notify_on_rejection")
    @Builder.Default
    private Boolean notifyOnRejection = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}
