package com.sonar.workflow.deadlines.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deadline_instances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineInstance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deadline_item_id", nullable = false)
    private DeadlineItem deadlineItem;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InstanceStatus status = InstanceStatus.UPCOMING;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by")
    private String completedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "deadlineInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeadlineReminderLog> reminderLogs = new ArrayList<>();

    public enum InstanceStatus {
        UPCOMING, DUE_SOON, OVERDUE, COMPLETED, SKIPPED
    }
}
