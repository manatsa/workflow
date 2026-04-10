package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.entity.DeadlineAction;
import com.sonar.workflow.deadlines.entity.DeadlineInstance;
import com.sonar.workflow.deadlines.entity.DeadlineItem;
import com.sonar.workflow.deadlines.entity.DeadlineReminderLog;
import com.sonar.workflow.deadlines.repository.DeadlineActionRepository;
import com.sonar.workflow.deadlines.repository.DeadlineReminderLogRepository;
import com.sonar.workflow.service.EmailService;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineNotificationService {

    private final EmailService emailService;
    private final DeadlineActionRepository actionRepository;
    private final DeadlineReminderLogRepository reminderLogRepository;
    private final SettingService settingService;

    public void sendReminderEmail(DeadlineInstance instance, String recipientEmail, String recipientName, String reminderType) {
        DeadlineItem item = instance.getDeadlineItem();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), instance.getDueDate());

        // Check if already sent
        if (reminderLogRepository.existsByDeadlineInstanceIdAndReminderTypeAndRecipientEmail(
                instance.getId(), reminderType, recipientEmail)) {
            return;
        }

        String appName = settingService.getValue("app.name", "Sona Workflow");
        String subject = String.format("[%s] Deadline Reminder: %s - Due in %d days", appName, item.getName(), daysRemaining);
        if (daysRemaining <= 0) {
            subject = String.format("[%s] OVERDUE: %s", appName, item.getName());
        }

        List<DeadlineAction> actions = actionRepository.findByDeadlineItemIdOrderByDisplayOrderAsc(item.getId());
        String htmlContent = buildReminderHtml(item, instance, recipientName, daysRemaining, actions);

        boolean success = false;
        String errorMessage = null;
        try {
            emailService.sendHtmlEmail(recipientEmail, subject, htmlContent);
            success = true;
            log.info("Sent {} reminder for '{}' to {}", reminderType, item.getName(), recipientEmail);
        } catch (Exception e) {
            errorMessage = e.getMessage();
            log.error("Failed to send {} reminder for '{}' to {}: {}", reminderType, item.getName(), recipientEmail, e.getMessage());
        }

        // Log the reminder
        DeadlineReminderLog reminderLog = DeadlineReminderLog.builder()
                .deadlineInstance(instance)
                .sentAt(LocalDateTime.now())
                .recipientEmail(recipientEmail)
                .reminderType(reminderType)
                .success(success)
                .errorMessage(errorMessage)
                .build();
        reminderLogRepository.save(reminderLog);
    }

    public void sendOverdueEmail(DeadlineInstance instance, String recipientEmail, String recipientName) {
        sendReminderEmail(instance, recipientEmail, recipientName, "OVERDUE");
    }

    public void sendCompletionEmail(DeadlineInstance instance, String recipientEmail, String recipientName) {
        DeadlineItem item = instance.getDeadlineItem();
        String appName = settingService.getValue("app.name", "Sona Workflow");
        String subject = String.format("[%s] Deadline Completed: %s", appName, item.getName());

        String htmlContent = buildCompletionHtml(item, instance, recipientName);

        try {
            emailService.sendHtmlEmail(recipientEmail, subject, htmlContent);
            log.info("Sent completion notification for '{}' to {}", item.getName(), recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send completion notification for '{}' to {}: {}", item.getName(), recipientEmail, e.getMessage());
        }
    }

    private String buildReminderHtml(DeadlineItem item, DeadlineInstance instance, String recipientName, long daysRemaining, List<DeadlineAction> actions) {
        String priorityColor = switch (item.getPriority()) {
            case CRITICAL -> "#d32f2f";
            case HIGH -> "#e65100";
            case MEDIUM -> "#f57f17";
            case LOW -> "#2e7d32";
        };

        String statusLabel = daysRemaining <= 0 ? "OVERDUE" : (daysRemaining <= 7 ? "Due Soon" : "Upcoming");
        String headerColor = daysRemaining <= 0 ? "#d32f2f" : (daysRemaining <= 7 ? "#e65100" : "#1565c0");

        StringBuilder actionsHtml = new StringBuilder();
        if (!actions.isEmpty()) {
            actionsHtml.append("<div style='margin-top:16px;'><h3 style='color:#333;margin-bottom:8px;'>Action Items</h3><table style='width:100%;border-collapse:collapse;'>");
            for (DeadlineAction action : actions) {
                String statusIcon = action.getStatus() == DeadlineAction.ActionStatus.COMPLETED ? "&#9745;" : "&#9744;";
                actionsHtml.append(String.format(
                        "<tr><td style='padding:6px 8px;border-bottom:1px solid #eee;'>%s %s</td><td style='padding:6px 8px;border-bottom:1px solid #eee;color:#666;'>%s</td></tr>",
                        statusIcon, action.getTitle(), action.getAssigneeName() != null ? action.getAssigneeName() : ""));
            }
            actionsHtml.append("</table></div>");
        }

        return String.format("""
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:linear-gradient(135deg,%s,%s);padding:24px;border-radius:8px 8px 0 0;">
                        <h1 style="color:white;margin:0;font-size:20px;">%s</h1>
                        <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">Deadline Reminder</p>
                    </div>
                    <div style="padding:24px;background:#fff;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
                        <p style="color:#333;">Hi %s,</p>
                        <p style="color:#333;">This is a reminder about an upcoming deadline that requires your attention.</p>
                        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
                            <table style="width:100%%;">
                                <tr><td style="padding:4px 0;color:#666;width:130px;">Deadline:</td><td style="color:#333;font-weight:bold;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Due Date:</td><td style="color:#333;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Days Remaining:</td><td style="color:%s;font-weight:bold;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Priority:</td><td><span style="background:%s;color:white;padding:2px 8px;border-radius:12px;font-size:12px;">%s</span></td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Category:</td><td style="color:#333;">%s</td></tr>
                            </table>
                        </div>
                        %s
                        %s
                        <p style="color:#999;font-size:12px;margin-top:24px;">This is an automated notification. Please do not reply to this email.</p>
                    </div>
                </div>
                """,
                headerColor, headerColor,
                statusLabel,
                recipientName != null ? recipientName : "Team",
                item.getName(),
                instance.getDueDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")),
                headerColor,
                daysRemaining <= 0 ? Math.abs(daysRemaining) + " days overdue" : daysRemaining + " days",
                priorityColor,
                item.getPriority().name(),
                item.getCategory() != null ? item.getCategory() : "N/A",
                item.getDescription() != null ? "<p style='color:#333;'>" + item.getDescription() + "</p>" : "",
                actionsHtml.toString());
    }

    private String buildCompletionHtml(DeadlineItem item, DeadlineInstance instance, String recipientName) {
        return String.format("""
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:linear-gradient(135deg,#2e7d32,#4caf50);padding:24px;border-radius:8px 8px 0 0;">
                        <h1 style="color:white;margin:0;font-size:20px;">Deadline Completed</h1>
                    </div>
                    <div style="padding:24px;background:#fff;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
                        <p style="color:#333;">Hi %s,</p>
                        <p style="color:#333;">The following deadline has been marked as completed:</p>
                        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
                            <table style="width:100%%;">
                                <tr><td style="padding:4px 0;color:#666;width:130px;">Deadline:</td><td style="color:#333;font-weight:bold;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Due Date:</td><td style="color:#333;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Completed:</td><td style="color:#2e7d32;font-weight:bold;">%s</td></tr>
                                <tr><td style="padding:4px 0;color:#666;">Completed By:</td><td style="color:#333;">%s</td></tr>
                            </table>
                        </div>
                        <p style="color:#999;font-size:12px;margin-top:24px;">This is an automated notification.</p>
                    </div>
                </div>
                """,
                recipientName != null ? recipientName : "Team",
                item.getName(),
                instance.getDueDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")),
                instance.getCompletedAt() != null ? instance.getCompletedAt().format(DateTimeFormatter.ofPattern("dd MMMM yyyy HH:mm")) : "Now",
                instance.getCompletedBy() != null ? instance.getCompletedBy() : "System");
    }
}
