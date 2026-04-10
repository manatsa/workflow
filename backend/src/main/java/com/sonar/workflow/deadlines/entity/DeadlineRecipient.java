package com.sonar.workflow.deadlines.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "deadline_recipients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineRecipient extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deadline_item_id", nullable = false)
    private DeadlineItem deadlineItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "notify_on_reminder")
    @Builder.Default
    private Boolean notifyOnReminder = true;

    @Column(name = "notify_on_overdue")
    @Builder.Default
    private Boolean notifyOnOverdue = true;

    @Column(name = "notify_on_completion")
    @Builder.Default
    private Boolean notifyOnCompletion = true;
}
