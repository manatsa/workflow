package com.sonar.workflow.deadlines.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deadline_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineAction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deadline_item_id", nullable = false)
    private DeadlineItem deadlineItem;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(name = "assignee_name")
    private String assigneeName;

    @Column(name = "assignee_email")
    private String assigneeEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ActionStatus status = ActionStatus.PENDING;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by")
    private String completedBy;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "due_offset_days")
    private Integer dueOffsetDays;

    public enum ActionStatus {
        PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    }
}
