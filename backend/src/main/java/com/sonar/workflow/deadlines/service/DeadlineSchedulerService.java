package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.entity.DeadlineInstance;
import com.sonar.workflow.deadlines.entity.DeadlineItem;
import com.sonar.workflow.deadlines.entity.DeadlineRecipient;
import com.sonar.workflow.deadlines.repository.DeadlineInstanceRepository;
import com.sonar.workflow.deadlines.repository.DeadlineRecipientRepository;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineSchedulerService {

    private final DeadlineInstanceRepository instanceRepository;
    private final DeadlineRecipientRepository recipientRepository;
    private final DeadlineNotificationService notificationService;
    private final SettingService settingService;

    /**
     * Runs every hour and checks if the current hour/minute matches the configured schedule.
     * Schedule is configured via 'deadline.scheduler.hour' and 'deadline.scheduler.minute' settings.
     * Default: runs at 7:00 AM daily.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void processDeadlineReminders() {
        // Check if current time matches the configured schedule
        int scheduledHour = settingService.getIntValue("deadline.scheduler.hour", 7);
        int scheduledMinute = settingService.getIntValue("deadline.scheduler.minute", 0);
        java.time.LocalTime now = java.time.LocalTime.now();
        if (now.getHour() != scheduledHour || now.getMinute() != scheduledMinute) {
            return;
        }
        if (!settingService.getBooleanValue("module.deadlines.enabled", false)) {
            return;
        }
        if (!settingService.getBooleanValue("deadline.scheduler.enabled", true)) {
            return;
        }

        log.info("Starting deadline reminder processing...");
        LocalDate today = LocalDate.now();

        // 1. Update instance statuses
        updateInstanceStatuses(today);

        // 2. Process reminders for upcoming deadlines
        processUpcomingReminders(today);

        // 3. Process overdue notifications
        if (settingService.getBooleanValue("deadline.email.notifications.enabled", true)) {
            processOverdueNotifications();
        }

        log.info("Deadline reminder processing completed.");
    }

    private void updateInstanceStatuses(LocalDate today) {
        int dueSoonThreshold = settingService.getIntValue("deadline.due.soon.threshold.days", 7);

        // Mark overdue instances
        List<DeadlineInstance> upcoming = instanceRepository.findByStatusIn(
                List.of(DeadlineInstance.InstanceStatus.UPCOMING, DeadlineInstance.InstanceStatus.DUE_SOON));

        for (DeadlineInstance instance : upcoming) {
            if (instance.getDueDate().isBefore(today)) {
                instance.setStatus(DeadlineInstance.InstanceStatus.OVERDUE);
                instanceRepository.save(instance);
            } else if (ChronoUnit.DAYS.between(today, instance.getDueDate()) <= dueSoonThreshold) {
                if (instance.getStatus() != DeadlineInstance.InstanceStatus.DUE_SOON) {
                    instance.setStatus(DeadlineInstance.InstanceStatus.DUE_SOON);
                    instanceRepository.save(instance);
                }
            }
        }
    }

    private void processUpcomingReminders(LocalDate today) {
        int lookAheadDays = settingService.getIntValue("deadline.look.ahead.days", 60);
        LocalDate maxLookAhead = today.plusDays(lookAheadDays);
        List<DeadlineInstance> instances = instanceRepository.findByStatusInAndDueDateBetween(
                List.of(DeadlineInstance.InstanceStatus.UPCOMING, DeadlineInstance.InstanceStatus.DUE_SOON),
                today, maxLookAhead);

        for (DeadlineInstance instance : instances) {
            DeadlineItem item = instance.getDeadlineItem();
            if (item.getStatus() != DeadlineItem.DeadlineItemStatus.ACTIVE || !Boolean.TRUE.equals(item.getIsActive())) {
                continue;
            }

            String reminderConfig = item.getReminderDaysBefore();
            if (reminderConfig == null || reminderConfig.isBlank()) continue;

            List<Integer> reminderDays = Arrays.stream(reminderConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::parseInt)
                    .toList();

            long daysUntilDue = ChronoUnit.DAYS.between(today, instance.getDueDate());

            for (int days : reminderDays) {
                if (daysUntilDue == days) {
                    String reminderType = days + "_DAY";
                    sendToRecipients(instance, item, reminderType);
                }
            }
        }
    }

    private void processOverdueNotifications() {
        List<DeadlineInstance> overdueInstances = instanceRepository.findOverdueWithItem();

        for (DeadlineInstance instance : overdueInstances) {
            DeadlineItem item = instance.getDeadlineItem();
            if (item.getStatus() != DeadlineItem.DeadlineItemStatus.ACTIVE) continue;

            // Send overdue notification once per day per recipient
            List<DeadlineRecipient> recipients = recipientRepository.findByDeadlineItemIdAndNotifyOnOverdueTrue(item.getId());
            for (DeadlineRecipient recipient : recipients) {
                notificationService.sendOverdueEmail(instance, recipient.getRecipientEmail(), recipient.getRecipientName());
            }
        }
    }

    private void sendToRecipients(DeadlineInstance instance, DeadlineItem item, String reminderType) {
        List<DeadlineRecipient> recipients = recipientRepository.findByDeadlineItemIdAndNotifyOnReminderTrue(item.getId());
        for (DeadlineRecipient recipient : recipients) {
            notificationService.sendReminderEmail(instance, recipient.getRecipientEmail(), recipient.getRecipientName(), reminderType);
        }
    }

    /**
     * Manually check and send reminders for a specific deadline item.
     * Updates instance statuses and sends any due reminders/overdue notifications.
     * Returns a summary of what was done.
     */
    @Transactional
    public String checkAndSendReminders(java.util.UUID deadlineItemId) {
        DeadlineItem item = instanceRepository.findActiveByDeadlineItemId(deadlineItemId).stream()
                .findFirst()
                .map(DeadlineInstance::getDeadlineItem)
                .orElse(null);

        if (item == null) {
            // Try loading from item repo directly
            return "No active instances found for this deadline.";
        }

        LocalDate today = LocalDate.now();
        List<DeadlineInstance> activeInstances = instanceRepository.findActiveByDeadlineItemId(deadlineItemId);
        int remindersSent = 0;
        int overdueNotified = 0;

        int dueSoonThreshold = settingService.getIntValue("deadline.due.soon.threshold.days", 7);

        for (DeadlineInstance instance : activeInstances) {
            // Update status
            if (instance.getDueDate().isBefore(today) && instance.getStatus() != DeadlineInstance.InstanceStatus.OVERDUE) {
                instance.setStatus(DeadlineInstance.InstanceStatus.OVERDUE);
                instanceRepository.save(instance);
            } else if (ChronoUnit.DAYS.between(today, instance.getDueDate()) <= dueSoonThreshold && instance.getStatus() == DeadlineInstance.InstanceStatus.UPCOMING) {
                instance.setStatus(DeadlineInstance.InstanceStatus.DUE_SOON);
                instanceRepository.save(instance);
            }

            // Check reminders
            String reminderConfig = item.getReminderDaysBefore();
            if (reminderConfig != null && !reminderConfig.isBlank()) {
                long daysUntilDue = ChronoUnit.DAYS.between(today, instance.getDueDate());
                List<Integer> reminderDays = java.util.Arrays.stream(reminderConfig.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).map(Integer::parseInt).toList();

                for (int days : reminderDays) {
                    if (daysUntilDue <= days) {
                        String reminderType = days + "_DAY_MANUAL";
                        List<DeadlineRecipient> recipients = recipientRepository.findByDeadlineItemIdAndNotifyOnReminderTrue(item.getId());
                        for (DeadlineRecipient recipient : recipients) {
                            notificationService.sendReminderEmail(instance, recipient.getRecipientEmail(), recipient.getRecipientName(), reminderType);
                            remindersSent++;
                        }
                    }
                }
            }

            // Overdue notifications
            if (instance.getStatus() == DeadlineInstance.InstanceStatus.OVERDUE) {
                List<DeadlineRecipient> recipients = recipientRepository.findByDeadlineItemIdAndNotifyOnOverdueTrue(item.getId());
                for (DeadlineRecipient recipient : recipients) {
                    notificationService.sendOverdueEmail(instance, recipient.getRecipientEmail(), recipient.getRecipientName());
                    overdueNotified++;
                }
            }
        }

        String summary = String.format("Checked %d instance(s). Reminders sent: %d. Overdue notifications: %d.",
                activeInstances.size(), remindersSent, overdueNotified);
        log.info("Manual reminder check for deadline {}: {}", deadlineItemId, summary);
        return summary;
    }
}
