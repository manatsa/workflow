package com.sonar.workflow.service;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.repository.WorkflowApproverRepository;
import com.sonar.workflow.repository.WorkflowInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowReminderService {

    private final WorkflowInstanceRepository instanceRepository;
    private final WorkflowApproverRepository approverRepository;
    private final EmailService emailService;
    private final SettingService settingService;
    private final AuditService auditService;

    /**
     * Runs every 15 minutes to check for pending workflow instances
     * that need reminders or escalation.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void processReminders() {
        if (!settingService.getBooleanValue("workflow.reminders.global.enabled", true)) {
            return;
        }

        List<WorkflowInstance> pendingInstances;
        try {
            pendingInstances = instanceRepository.findPendingWithRemindersEnabled();
        } catch (Exception e) {
            log.error("Failed to fetch pending instances for reminders", e);
            return;
        }

        for (WorkflowInstance instance : pendingInstances) {
            try {
                processInstance(instance);
            } catch (Exception e) {
                log.error("Failed to process reminders for instance {}", instance.getReferenceNumber(), e);
            }
        }
    }

    private void processInstance(WorkflowInstance instance) {
        Workflow workflow = instance.getWorkflow();
        LocalDateTime submittedAt = instance.getSubmittedAt();
        if (submittedAt == null) return;

        LocalDateTime now = LocalDateTime.now();
        long hoursSinceSubmission = ChronoUnit.HOURS.between(submittedAt, now);

        int startAfterHours = workflow.getReminderStartAfterHours() != null ? workflow.getReminderStartAfterHours() : 24;
        int frequencyHours = workflow.getReminderFrequencyHours() != null ? workflow.getReminderFrequencyHours() : 24;
        int maxCount = workflow.getReminderMaxCount() != null ? workflow.getReminderMaxCount() : 3;
        int remindersSent = instance.getReminderCount() != null ? instance.getReminderCount() : 0;

        // Check escalation first (takes priority after all reminders exhausted)
        if (Boolean.TRUE.equals(workflow.getEscalationEnabled()) && instance.getEscalatedAt() == null) {
            int escalationAfterHours = workflow.getEscalationAfterHours() != null ? workflow.getEscalationAfterHours() : 72;
            if (hoursSinceSubmission >= escalationAfterHours && remindersSent >= maxCount) {
                handleEscalation(instance, workflow);
                return;
            }
        }

        // Check if it's time for a reminder
        if (remindersSent >= maxCount) return;
        if (hoursSinceSubmission < startAfterHours) return;

        // Calculate when next reminder is due
        LocalDateTime lastReminder = instance.getLastReminderSentAt();
        if (lastReminder != null) {
            long hoursSinceLastReminder = ChronoUnit.HOURS.between(lastReminder, now);
            if (hoursSinceLastReminder < frequencyHours) return;
        }

        // Send reminder
        sendReminder(instance, workflow, remindersSent + 1, maxCount);
    }

    private void sendReminder(WorkflowInstance instance, Workflow workflow, int reminderNumber, int maxCount) {
        WorkflowApprover approver = instance.getCurrentApprover();
        if (approver == null) return;

        String approverEmail = approver.getApproverEmail();
        String approverName = approver.getApproverName();
        if (approverEmail == null || approverEmail.isBlank()) {
            if (approver.getUser() != null) {
                approverEmail = approver.getUser().getEmail();
                approverName = approver.getUser().getFullName();
            }
        }
        if (approverEmail == null || approverEmail.isBlank()) return;

        String workflowName = workflow.getName();
        String referenceNumber = instance.getReferenceNumber();
        String submissionTitle = instance.getTitle();
        String subjectRef = (submissionTitle != null && !submissionTitle.isBlank()) ? submissionTitle : referenceNumber;
        String submitterName = instance.getInitiator() != null ? instance.getInitiator().getFullName() : "Unknown";
        String submittedDate = instance.getSubmittedAt() != null ? instance.getSubmittedAt().toLocalDate().toString() : "";

        // Build email subject and body
        String subject = workflow.getReminderEmailSubject();
        String body = workflow.getReminderEmailBody();

        if (subject == null || subject.isBlank()) {
            subject = "Reminder " + reminderNumber + "/" + maxCount + ": Pending approval for " + workflowName + " - " + subjectRef;
        } else {
            subject = replacePlaceholders(subject, instance, workflow, approverName, approverEmail, reminderNumber, maxCount);
        }

        if (body == null || body.isBlank()) {
            body = buildDefaultReminderBody(approverName, workflowName, referenceNumber, submitterName, submittedDate, reminderNumber, maxCount);
        } else {
            body = replacePlaceholders(body, instance, workflow, approverName, approverEmail, reminderNumber, maxCount);
        }

        try {
            emailService.sendHtmlEmail(approverEmail, subject, body);
            log.info("Sent reminder {}/{} for {} to {}", reminderNumber, maxCount, referenceNumber, approverEmail);

            // Also notify submitter if configured
            if (Boolean.TRUE.equals(workflow.getReminderIncludeSubmitter()) && instance.getInitiator() != null) {
                String submitterEmail = instance.getInitiator().getEmail();
                if (submitterEmail != null && !submitterEmail.isBlank() && !submitterEmail.equals(approverEmail)) {
                    String submitterSubject = "Your submission " + referenceNumber + " is awaiting approval (Reminder " + reminderNumber + "/" + maxCount + ")";
                    String submitterBody = buildSubmitterReminderBody(submitterName, workflowName, referenceNumber, approverName, reminderNumber, maxCount);
                    emailService.sendHtmlEmail(submitterEmail, submitterSubject, submitterBody);
                }
            }

            // Update tracking
            instance.setReminderCount(reminderNumber);
            instance.setLastReminderSentAt(LocalDateTime.now());
            instanceRepository.save(instance);

        } catch (Exception e) {
            log.error("Failed to send reminder email for {} to {}", referenceNumber, approverEmail, e);
        }
    }

    private void handleEscalation(WorkflowInstance instance, Workflow workflow) {
        Workflow.EscalationAction action = workflow.getEscalationAction();
        if (action == null) action = Workflow.EscalationAction.NOTIFY_ADMIN;

        String referenceNumber = instance.getReferenceNumber();
        log.info("Escalating {} with action {}", referenceNumber, action);

        switch (action) {
            case NOTIFY_ADMIN -> notifyAdminOfEscalation(instance, workflow);
            case AUTO_APPROVE -> autoApproveInstance(instance, workflow);
            case REASSIGN_NEXT_LEVEL -> reassignToNextLevel(instance, workflow);
        }

        instance.setEscalatedAt(LocalDateTime.now());
        instanceRepository.save(instance);
    }

    private void notifyAdminOfEscalation(WorkflowInstance instance, Workflow workflow) {
        String adminEmail = settingService.getValue("admin.email", null);
        if (adminEmail == null || adminEmail.isBlank()) {
            log.warn("Cannot escalate {}: no admin email configured", instance.getReferenceNumber());
            return;
        }

        String body = "<h3>Workflow Escalation Notice</h3>" +
                "<p>The following submission has exceeded the maximum approval wait time and has been escalated:</p>" +
                "<ul>" +
                "<li><strong>Workflow:</strong> " + workflow.getName() + "</li>" +
                "<li><strong>Reference:</strong> " + instance.getReferenceNumber() + "</li>" +
                "<li><strong>Submitted by:</strong> " + (instance.getInitiator() != null ? instance.getInitiator().getFullName() : "Unknown") + "</li>" +
                "<li><strong>Submitted at:</strong> " + instance.getSubmittedAt() + "</li>" +
                "<li><strong>Current approver:</strong> " + (instance.getCurrentApprover() != null ? instance.getCurrentApprover().getApproverName() : "Unknown") + "</li>" +
                "<li><strong>Reminders sent:</strong> " + instance.getReminderCount() + "</li>" +
                "</ul>" +
                "<p>Please take action on this submission.</p>";

        try {
            emailService.sendHtmlEmail(adminEmail, "ESCALATION: " + workflow.getName() + " - " + instance.getReferenceNumber(), body);
            auditService.log(AuditLog.AuditAction.UPDATE, "WorkflowInstance", instance.getId(),
                    instance.getReferenceNumber(), "Escalated to admin: reminders exhausted", null, null);
        } catch (Exception e) {
            log.error("Failed to send escalation email for {}", instance.getReferenceNumber(), e);
        }
    }

    private void autoApproveInstance(WorkflowInstance instance, Workflow workflow) {
        instance.setStatus(WorkflowInstance.Status.APPROVED);
        instance.setCompletedAt(LocalDateTime.now());
        instanceRepository.save(instance);

        auditService.log(AuditLog.AuditAction.UPDATE, "WorkflowInstance", instance.getId(),
                instance.getReferenceNumber(), "Auto-approved: approval timeout exceeded after " +
                instance.getReminderCount() + " reminders", null, null);

        log.info("Auto-approved {} after escalation timeout", instance.getReferenceNumber());
    }

    private void reassignToNextLevel(WorkflowInstance instance, Workflow workflow) {
        Integer currentLevel = instance.getCurrentLevel();
        if (currentLevel == null) currentLevel = 1;

        // Find the next level approver
        List<WorkflowApprover> nextApprovers = approverRepository.findByWorkflowIdAndLevel(workflow.getId(), currentLevel + 1);
        if (!nextApprovers.isEmpty()) {
            WorkflowApprover nextApprover = nextApprovers.get(0);
            instance.setCurrentApprover(nextApprover);
            instance.setCurrentLevel(currentLevel + 1);
            instance.setReminderCount(0);
            instance.setLastReminderSentAt(null);
            instanceRepository.save(instance);

            auditService.log(AuditLog.AuditAction.UPDATE, "WorkflowInstance", instance.getId(),
                    instance.getReferenceNumber(), "Reassigned to level " + (currentLevel + 1) +
                    ": approval timeout exceeded", null, null);

            log.info("Reassigned {} from level {} to level {}", instance.getReferenceNumber(), currentLevel, currentLevel + 1);
        } else {
            // No next level - fall back to notifying admin
            notifyAdminOfEscalation(instance, workflow);
        }
    }

    private String replacePlaceholders(String template, WorkflowInstance instance, Workflow workflow,
                                        String approverName, String approverEmail, int reminderNumber, int maxCount) {
        String workflowName = workflow.getName();
        String workflowCode = workflow.getCode();
        String referenceNumber = instance.getReferenceNumber() != null ? instance.getReferenceNumber() : "";
        String submissionTitle = instance.getTitle() != null ? instance.getTitle() : "";
        String status = instance.getStatus() != null ? instance.getStatus().name() : "";
        String submitterName = instance.getInitiator() != null ? instance.getInitiator().getFullName() : "";
        String submitterEmail = instance.getInitiator() != null && instance.getInitiator().getEmail() != null ? instance.getInitiator().getEmail() : "";
        String submitterDepartment = instance.getInitiator() != null && instance.getInitiator().getDepartment() != null ? instance.getInitiator().getDepartment() : "";
        String submittedDate = instance.getSubmittedAt() != null ? instance.getSubmittedAt().toLocalDate().toString() : "";
        String submittedTime = instance.getSubmittedAt() != null ? instance.getSubmittedAt().toLocalTime().withNano(0).toString() : "";
        String submittedDateTime = instance.getSubmittedAt() != null ? instance.getSubmittedAt().withNano(0).toString().replace("T", " ") : "";
        String currentLevel = instance.getCurrentLevel() != null ? String.valueOf(instance.getCurrentLevel()) : "0";
        String amount = instance.getAmount() != null ? instance.getAmount().toPlainString() : "";
        String sbuName = instance.getSbu() != null ? instance.getSbu().getName() : "";
        long daysPending = instance.getSubmittedAt() != null ? java.time.temporal.ChronoUnit.DAYS.between(instance.getSubmittedAt(), java.time.LocalDateTime.now()) : 0;

        String result = template
                // Workflow info
                .replace("@{workflowName}", workflowName != null ? workflowName : "")
                .replace("@{workflowCode}", workflowCode != null ? workflowCode : "")
                // Submission info
                .replace("@{referenceNumber}", referenceNumber)
                .replace("@{submissionTitle}", submissionTitle)
                .replace("@{status}", status)
                .replace("@{amount}", amount)
                .replace("@{sbuName}", sbuName)
                // Approver info
                .replace("@{approverName}", approverName != null ? approverName : "")
                .replace("@{approverEmail}", approverEmail != null ? approverEmail : "")
                .replace("@{approvalLevel}", currentLevel)
                // Submitter info
                .replace("@{submitterName}", submitterName)
                .replace("@{submitterEmail}", submitterEmail)
                .replace("@{submitterDepartment}", submitterDepartment)
                // Date/time info
                .replace("@{submittedDate}", submittedDate)
                .replace("@{submittedTime}", submittedTime)
                .replace("@{submittedDateTime}", submittedDateTime)
                .replace("@{daysPending}", String.valueOf(daysPending))
                // Reminder info
                .replace("@{reminderNumber}", String.valueOf(reminderNumber))
                .replace("@{reminderMax}", String.valueOf(maxCount));

        // Backwards compatibility with old {{}} syntax
        result = result
                .replace("{{workflowName}}", workflowName != null ? workflowName : "")
                .replace("{{approverName}}", approverName != null ? approverName : "")
                .replace("{{submitterName}}", submitterName)
                .replace("{{referenceNumber}}", referenceNumber)
                .replace("{{submittedDate}}", submittedDate);

        return result;
    }

    private String buildDefaultReminderBody(String approverName, String workflowName, String referenceNumber,
                                             String submitterName, String submittedDate, int reminderNumber, int maxCount) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: #ff9800;'>Approval Reminder (" + reminderNumber + " of " + maxCount + ")</h3>" +
                "<p>Dear " + approverName + ",</p>" +
                "<p>This is a reminder that you have a pending approval that requires your attention:</p>" +
                "<table style='border-collapse: collapse; width: 100%; margin: 16px 0;'>" +
                "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Workflow</td>" +
                "<td style='padding: 8px; border: 1px solid #ddd;'>" + workflowName + "</td></tr>" +
                "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Reference</td>" +
                "<td style='padding: 8px; border: 1px solid #ddd;'>" + referenceNumber + "</td></tr>" +
                "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Submitted by</td>" +
                "<td style='padding: 8px; border: 1px solid #ddd;'>" + submitterName + "</td></tr>" +
                "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Submitted on</td>" +
                "<td style='padding: 8px; border: 1px solid #ddd;'>" + submittedDate + "</td></tr>" +
                "</table>" +
                "<p>Please log in to review and take action on this request.</p>" +
                "<p style='color: #999; font-size: 12px;'>This is reminder " + reminderNumber + " of " + maxCount + ".</p>" +
                "</div>";
    }

    private String buildSubmitterReminderBody(String submitterName, String workflowName, String referenceNumber,
                                               String approverName, int reminderNumber, int maxCount) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: #1976d2;'>Submission Status Update</h3>" +
                "<p>Dear " + submitterName + ",</p>" +
                "<p>Your submission <strong>" + referenceNumber + "</strong> for <strong>" + workflowName +
                "</strong> is still pending approval from <strong>" + approverName + "</strong>.</p>" +
                "<p>A reminder (number " + reminderNumber + " of " + maxCount + ") has been sent to the approver.</p>" +
                "<p style='color: #999; font-size: 12px;'>This is an automated notification.</p>" +
                "</div>";
    }
}
