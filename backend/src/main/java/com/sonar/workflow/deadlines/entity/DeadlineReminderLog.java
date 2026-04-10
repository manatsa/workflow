package com.sonar.workflow.deadlines.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deadline_reminder_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadlineReminderLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deadline_instance_id", nullable = false)
    private DeadlineInstance deadlineInstance;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "reminder_type", nullable = false)
    private String reminderType;

    @Column
    @Builder.Default
    private Boolean success = true;

    @Column(name = "error_message")
    private String errorMessage;
}
