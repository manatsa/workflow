package com.sonar.workflow.leave.service;

import com.sonar.workflow.entity.Department;
import com.sonar.workflow.leave.entity.LeaveApprovalHistory;
import com.sonar.workflow.leave.entity.LeaveApprover;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.repository.LeaveApprovalHistoryRepository;
import com.sonar.workflow.leave.repository.LeaveApproverRepository;
import com.sonar.workflow.leave.repository.LeaveRequestRepository;
import com.sonar.workflow.service.EmailService;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveReminderService {

    private final LeaveRequestRepository requestRepository;
    private final LeaveApproverRepository approverRepository;
    private final LeaveApprovalHistoryRepository historyRepository;
    private final EmailService emailService;
    private final SettingService settingService;

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void processReminders() {
        if (!settingService.getBooleanValue("leave.reminders.enabled", true)) return;

        List<LeaveRequest> pending;
        try {
            pending = requestRepository.findPendingWithSubmittedAt();
        } catch (Exception e) {
            log.error("Failed to fetch pending leave requests for reminders", e);
            return;
        }

        for (LeaveRequest request : pending) {
            try {
                processRequest(request);
            } catch (Exception e) {
                log.error("Failed to process leave reminder for {}", request.getReferenceNumber(), e);
            }
        }
    }

    private void processRequest(LeaveRequest request) {
        if (request.getSubmittedAt() == null || request.getCurrentApprover() == null) return;

        LocalDateTime now = LocalDateTime.now();
        long hoursSinceSubmission = ChronoUnit.HOURS.between(request.getSubmittedAt(), now);

        int startAfterHours = settingService.getIntValue("leave.reminders.start.after.hours", 24);
        int frequencyHours = settingService.getIntValue("leave.reminders.frequency.hours", 24);
        int maxCount = settingService.getIntValue("leave.reminders.max.count", 3);
        int remindersSent = request.getReminderCount() != null ? request.getReminderCount() : 0;

        // Check escalation first
        LeaveApprover currentApprover = request.getCurrentApprover();
        if (Boolean.TRUE.equals(currentApprover.getCanEscalate()) && request.getEscalatedAt() == null) {
            Integer timeout = currentApprover.getEscalationTimeoutHours();
            if (timeout != null && timeout > 0 && hoursSinceSubmission >= timeout && remindersSent >= maxCount) {
                handleEscalation(request);
                return;
            }
        }

        if (remindersSent >= maxCount) return;
        if (hoursSinceSubmission < startAfterHours) return;

        LocalDateTime lastReminder = request.getLastReminderSentAt();
        if (lastReminder != null) {
            long hoursSinceLast = ChronoUnit.HOURS.between(lastReminder, now);
            if (hoursSinceLast < frequencyHours) return;
        }

        sendReminder(request, remindersSent + 1, maxCount);
    }

    private void sendReminder(LeaveRequest request, int reminderNumber, int maxCount) {
        LeaveApprover approver = request.getCurrentApprover();
        String email = approver.getApproverEmail();
        if (email == null || email.isBlank()) return;

        String employeeName = request.getEmployee().getFullName();
        String leaveType = request.getLeaveType().getName();
        String ref = request.getReferenceNumber();

        String subject = "Reminder " + reminderNumber + "/" + maxCount + ": Leave approval pending - " + ref;
        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: #ff9800;'>Leave Approval Reminder (" + reminderNumber + " of " + maxCount + ")</h3>" +
                "<p>Dear " + approver.getApproverName() + ",</p>" +
                "<p>This is a reminder that a leave request requires your attention:</p>" +
                "<table style='border-collapse: collapse; width: 100%; margin: 16px 0;'>" +
                row("Reference", ref) +
                row("Employee", employeeName) +
                row("Leave Type", leaveType) +
                row("Dates", request.getStartDate() + " to " + request.getEndDate()) +
                row("Days", request.getTotalDays().toString()) +
                "</table>" +
                "<p>Please log in to review and take action.</p>" +
                "<p style='color: #999; font-size: 12px;'>Reminder " + reminderNumber + " of " + maxCount + ".</p></div>";

        try {
            emailService.sendHtmlEmail(email, subject, body);
            request.setReminderCount(reminderNumber);
            request.setLastReminderSentAt(LocalDateTime.now());
            requestRepository.save(request);
            log.info("Sent leave reminder {}/{} for {} to {}", reminderNumber, maxCount, ref, email);
        } catch (Exception e) {
            log.error("Failed to send leave reminder for {} to {}", ref, email, e);
        }
    }

    private void handleEscalation(LeaveRequest request) {
        Integer currentLevel = request.getCurrentLevel();
        if (currentLevel == null) currentLevel = 1;
        Integer maxLevel = request.getMaxLevel();

        UUID deptId = request.getEmployee().getDepartments().stream()
                .findFirst().map(Department::getId).orElse(null);

        if (deptId != null && maxLevel != null && currentLevel < maxLevel) {
            // Advance to next level
            List<LeaveApprover> nextApprovers = approverRepository.findByDepartmentIdAndLevel(deptId, currentLevel + 1);
            if (!nextApprovers.isEmpty()) {
                LeaveApprover next = nextApprovers.get(0);
                request.setCurrentApprover(next);
                request.setCurrentLevel(currentLevel + 1);
                request.setReminderCount(0);
                request.setLastReminderSentAt(null);
                request.setEscalatedAt(LocalDateTime.now());
                requestRepository.save(request);

                LeaveApprovalHistory history = LeaveApprovalHistory.builder()
                        .leaveRequest(request)
                        .approverName("System")
                        .level(currentLevel)
                        .action(LeaveApprovalHistory.Action.ESCALATED)
                        .comments("Auto-escalated from level " + currentLevel + " to level " + (currentLevel + 1))
                        .actionDate(LocalDateTime.now())
                        .build();
                historyRepository.save(history);

                log.info("Escalated leave request {} from level {} to {}", request.getReferenceNumber(), currentLevel, currentLevel + 1);
                return;
            }
        }

        // Can't escalate further - notify admin
        request.setEscalatedAt(LocalDateTime.now());
        requestRepository.save(request);

        String adminEmail = settingService.getValue("admin.email", null);
        if (adminEmail != null && !adminEmail.isBlank()) {
            try {
                String body = "<h3>Leave Escalation Notice</h3>" +
                        "<p>Leave request <strong>" + request.getReferenceNumber() + "</strong> from " +
                        request.getEmployee().getFullName() + " has exceeded the approval timeout and all reminders.</p>" +
                        "<p>Please take action.</p>";
                emailService.sendHtmlEmail(adminEmail, "ESCALATION: Leave request " + request.getReferenceNumber(), body);
            } catch (Exception e) {
                log.error("Failed to send leave escalation email", e);
            }
        }
    }

    private String row(String label, String value) {
        return "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>" + label +
                "</td><td style='padding: 8px; border: 1px solid #ddd;'>" + (value != null ? value : "-") + "</td></tr>";
    }
}
