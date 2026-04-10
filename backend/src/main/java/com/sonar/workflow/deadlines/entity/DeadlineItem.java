package com.sonar.workflow.deadlines.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.SBU;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deadline_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineItem extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private DeadlineCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeadlinePriority priority = DeadlinePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeadlineItemStatus status = DeadlineItemStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false)
    @Builder.Default
    private RecurrenceType recurrenceType = RecurrenceType.ONE_TIME;

    @Column(name = "reminder_days_before")
    @Builder.Default
    private String reminderDaysBefore = "30,7,1";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sbu_id")
    private SBU sbu;

    @OneToMany(mappedBy = "deadlineItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<DeadlineAction> actions = new ArrayList<>();

    @OneToMany(mappedBy = "deadlineItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeadlineRecipient> recipients = new ArrayList<>();

    @OneToMany(mappedBy = "deadlineItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dueDate ASC")
    @Builder.Default
    private List<DeadlineInstance> instances = new ArrayList<>();

    public enum DeadlinePriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum DeadlineItemStatus {
        ACTIVE, PAUSED, COMPLETED, ARCHIVED
    }

    public enum RecurrenceType {
        ONE_TIME, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    }
}
