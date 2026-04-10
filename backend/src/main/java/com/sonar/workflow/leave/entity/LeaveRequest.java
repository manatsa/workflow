package com.sonar.workflow.leave.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(name = "reference_number", unique = true)
    private String referenceNumber;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "start_date_half_day")
    @Builder.Default
    private Boolean startDateHalfDay = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "start_date_half_day_period")
    private HalfDayPeriod startDateHalfDayPeriod;

    @Column(name = "end_date_half_day")
    @Builder.Default
    private Boolean endDateHalfDay = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "end_date_half_day_period")
    private HalfDayPeriod endDateHalfDayPeriod;

    @Column(name = "total_days", precision = 10, scale = 2)
    private BigDecimal totalDays;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LeaveRequestStatus status = LeaveRequestStatus.DRAFT;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approver_comments", columnDefinition = "TEXT")
    private String approverComments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delegate_to")
    private User delegateTo;

    @Column(name = "contact_while_on_leave")
    private String contactWhileOnLeave;

    @OneToMany(mappedBy = "leaveRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeaveRequestAttachment> attachments = new ArrayList<>();

    // Multi-level approval fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_approver_id")
    private LeaveApprover currentApprover;

    @Column(name = "current_level")
    private Integer currentLevel;

    @Column(name = "max_level")
    private Integer maxLevel;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reminder_count")
    @Builder.Default
    private Integer reminderCount = 0;

    @Column(name = "last_reminder_sent_at")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @OneToMany(mappedBy = "leaveRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("actionDate ASC")
    @Builder.Default
    private List<LeaveApprovalHistory> approvalHistory = new ArrayList<>();

    public enum LeaveRequestStatus {
        DRAFT, PENDING, APPROVED, REJECTED, CANCELLED, RECALLED
    }

    public enum HalfDayPeriod {
        MORNING, AFTERNOON
    }
}
