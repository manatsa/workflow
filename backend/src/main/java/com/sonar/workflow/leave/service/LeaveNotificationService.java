package com.sonar.workflow.leave.service;

import com.sonar.workflow.leave.entity.LeaveApprover;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.service.EmailService;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveNotificationService {

    private final EmailService emailService;
    private final SettingService settingService;

    @Async
    public void notifyApproverOfPendingRequest(LeaveRequest request, LeaveApprover approver) {
        if (!settingService.getBooleanValue("leave.notifications.enabled", true)) return;
        if (approver == null || !Boolean.TRUE.equals(approver.getNotifyOnPending())) return;

        String email = approver.getApproverEmail();
        if (email == null || email.isBlank()) return;

        String employeeName = request.getEmployee().getFullName();
        String leaveType = request.getLeaveType().getName();
        int level = request.getCurrentLevel() != null ? request.getCurrentLevel() : 1;
        int maxLevel = request.getMaxLevel() != null ? request.getMaxLevel() : 1;

        String subject = "Leave Approval Required (Level " + level + "/" + maxLevel + "): " +
                employeeName + " - " + leaveType;

        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: #1976d2;'>Leave Approval Required</h3>" +
                "<p>Dear " + approver.getApproverName() + ",</p>" +
                "<p>A leave request requires your approval:</p>" +
                "<table style='border-collapse: collapse; width: 100%; margin: 16px 0;'>" +
                row("Reference", request.getReferenceNumber()) +
                row("Employee", employeeName) +
                row("Leave Type", leaveType) +
                row("Dates", request.getStartDate() + " to " + request.getEndDate()) +
                row("Days", request.getTotalDays().toString()) +
                row("Reason", request.getReason()) +
                row("Approval Level", level + " of " + maxLevel) +
                "</table>" +
                "<p>Please log in to review and take action.</p>" +
                "</div>";

        try {
            emailService.sendHtmlEmail(email, subject, body);
            log.info("Sent leave approval notification to {} for {}", email, request.getReferenceNumber());
        } catch (Exception e) {
            log.error("Failed to send leave approval notification to {}", email, e);
        }
    }

    @Async
    public void notifySubmitterOfDecision(LeaveRequest request, String action, String approverName, String comments) {
        if (!settingService.getBooleanValue("leave.notifications.enabled", true)) return;

        String email = request.getEmployee().getEmail();
        if (email == null || email.isBlank()) return;

        String color = "APPROVED".equals(action) ? "#4caf50" : "#f44336";
        String subject = "Leave Request " + action + ": " + request.getReferenceNumber();

        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: " + color + ";'>Leave Request " + action + "</h3>" +
                "<p>Dear " + request.getEmployee().getFullName() + ",</p>" +
                "<p>Your leave request has been <strong>" + action.toLowerCase() + "</strong>:</p>" +
                "<table style='border-collapse: collapse; width: 100%; margin: 16px 0;'>" +
                row("Reference", request.getReferenceNumber()) +
                row("Leave Type", request.getLeaveType().getName()) +
                row("Dates", request.getStartDate() + " to " + request.getEndDate()) +
                row("Days", request.getTotalDays().toString()) +
                row("Decided by", approverName) +
                (comments != null && !comments.isBlank() ? row("Comments", comments) : "") +
                "</table>" +
                "</div>";

        try {
            emailService.sendHtmlEmail(email, subject, body);
        } catch (Exception e) {
            log.error("Failed to send leave decision notification to {}", email, e);
        }
    }

    @Async
    public void notifyOfReassignment(LeaveRequest request, String newApproverName, String reason) {
        if (!settingService.getBooleanValue("leave.notifications.enabled", true)) return;

        String email = request.getEmployee().getEmail();
        if (email == null || email.isBlank()) return;

        String subject = "Leave Request Reassigned: " + request.getReferenceNumber();
        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px;'>" +
                "<h3 style='color: #ff9800;'>Leave Request Reassigned</h3>" +
                "<p>Dear " + request.getEmployee().getFullName() + ",</p>" +
                "<p>Your leave request <strong>" + request.getReferenceNumber() + "</strong> has been reassigned to " +
                "<strong>" + newApproverName + "</strong>.</p>" +
                (reason != null && !reason.isBlank() ? "<p><em>Reason: " + reason + "</em></p>" : "") +
                "</div>";

        try {
            emailService.sendHtmlEmail(email, subject, body);
        } catch (Exception e) {
            log.error("Failed to send reassignment notification to {}", email, e);
        }
    }

    private String row(String label, String value) {
        return "<tr><td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>" + label +
                "</td><td style='padding: 8px; border: 1px solid #ddd;'>" + (value != null ? value : "-") + "</td></tr>";
    }
}
