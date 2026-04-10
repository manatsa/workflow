package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeadlineRecipientRepository extends JpaRepository<DeadlineRecipient, UUID> {

    List<DeadlineRecipient> findByDeadlineItemId(UUID deadlineItemId);

    List<DeadlineRecipient> findByDeadlineItemIdAndNotifyOnReminderTrue(UUID deadlineItemId);

    List<DeadlineRecipient> findByDeadlineItemIdAndNotifyOnOverdueTrue(UUID deadlineItemId);

    List<DeadlineRecipient> findByDeadlineItemIdAndNotifyOnCompletionTrue(UUID deadlineItemId);
}
