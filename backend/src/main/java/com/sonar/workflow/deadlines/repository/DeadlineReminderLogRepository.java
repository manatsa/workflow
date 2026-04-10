package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeadlineReminderLogRepository extends JpaRepository<DeadlineReminderLog, UUID> {

    boolean existsByDeadlineInstanceIdAndReminderTypeAndRecipientEmail(UUID instanceId, String reminderType, String recipientEmail);

    List<DeadlineReminderLog> findByDeadlineInstanceIdOrderBySentAtDesc(UUID instanceId);
}
