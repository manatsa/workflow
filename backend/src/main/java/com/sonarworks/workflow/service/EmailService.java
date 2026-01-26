package com.sonarworks.workflow.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final SettingService settingService;
    private final EmailSettingsService emailSettingsService;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    /**
     * Gets the appropriate JavaMailSender - either from EmailSettings (if configured)
     * or falls back to the Spring-configured mailSender
     */
    private JavaMailSender getMailSender() {
        try {
            if (emailSettingsService.isEmailConfigured()) {
                return emailSettingsService.buildMailSender();
            }
        } catch (Exception e) {
            log.warn("Could not build mail sender from EmailSettings, falling back to default: {}", e.getMessage());
        }
        return mailSender;
    }

    private String getFromEmail() {
        // First try to get from EmailSettings entity
        try {
            String emailSettingsSender = emailSettingsService.getSenderEmail();
            if (emailSettingsSender != null && !emailSettingsSender.isBlank()) {
                return emailSettingsSender;
            }
        } catch (Exception e) {
            log.debug("Could not get sender from EmailSettings: {}", e.getMessage());
        }

        // Second, try to get from legacy settings
        String fromAddress = settingService.getValue("mail.from.address", null);
        if (fromAddress != null && !fromAddress.isBlank()) {
            return fromAddress;
        }
        // Fall back to spring.mail.username
        if (springMailUsername != null && !springMailUsername.isBlank()) {
            return springMailUsername;
        }
        // Default fallback
        return "noreply@sonarworks.com";
    }

    private String getSenderName() {
        try {
            String senderName = emailSettingsService.getSenderName();
            if (senderName != null && !senderName.isBlank()) {
                return senderName;
            }
        } catch (Exception e) {
            log.debug("Could not get sender name from EmailSettings: {}", e.getMessage());
        }
        return settingService.getValue("mail.from.name", "Sonarworks Workflow");
    }

    /**
     * Sends password reset email synchronously so we can report errors to the user.
     * This method is NOT @Async because the user needs to know if the email failed.
     */
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) throws MessagingException {
        String baseUrl = settingService.getValue("app.base.url", "http://localhost:8080");
        String resetLink = baseUrl + "/reset-password?token=" + token;

        Context context = new Context();
        context.setVariable("firstName", firstName);
        context.setVariable("resetLink", resetLink);
        context.setVariable("expiryHours", settingService.getIntValue("password.reset.token.expiry.hours", 24));

        String htmlContent = templateEngine.process("password-reset-email", context);
        sendHtmlEmail(toEmail, "Password Reset Request", htmlContent);
        log.info("Password reset email sent successfully to {}", toEmail);
    }

    @Async
    public void sendApprovalRequestEmail(String toEmail, String approverName, String workflowName,
                                          String referenceNumber, String initiatorName, String approvalLink) {
        sendApprovalRequestEmail(toEmail, approverName, workflowName, referenceNumber, initiatorName,
                approvalLink, null, null, null, false);
    }

    @Async
    public void sendApprovalRequestEmail(String toEmail, String approverName, String workflowName,
                                          String referenceNumber, String initiatorName, String approvalLink,
                                          String approveLink, String rejectLink, String amount,
                                          boolean emailApprovalEnabled) {
        sendApprovalRequestEmail(toEmail, approverName, workflowName, referenceNumber, initiatorName,
                approvalLink, approveLink, rejectLink, amount, emailApprovalEnabled, null);
    }

    @Async
    public void sendApprovalRequestEmail(String toEmail, String approverName, String workflowName,
                                          String referenceNumber, String initiatorName, String approvalLink,
                                          String approveLink, String rejectLink, String amount,
                                          boolean emailApprovalEnabled, List<Map<String, String>> summaryFields) {
        sendApprovalRequestEmail(toEmail, approverName, workflowName, referenceNumber, initiatorName,
                approvalLink, approveLink, rejectLink, null, null, amount, emailApprovalEnabled, summaryFields);
    }

    @Async
    public void sendApprovalRequestEmail(String toEmail, String approverName, String workflowName,
                                          String referenceNumber, String initiatorName, String approvalLink,
                                          String approveLink, String rejectLink, String escalateLink, String reviewLink,
                                          String amount, boolean emailApprovalEnabled, List<Map<String, String>> summaryFields) {
        try {
            Context context = new Context();
            context.setVariable("approverName", approverName);
            context.setVariable("workflowName", workflowName);
            context.setVariable("referenceNumber", referenceNumber);
            context.setVariable("initiatorName", initiatorName);
            context.setVariable("approvalLink", approvalLink);
            context.setVariable("approveLink", approveLink);
            context.setVariable("rejectLink", rejectLink);
            context.setVariable("escalateLink", escalateLink);
            context.setVariable("reviewLink", reviewLink);
            context.setVariable("amount", amount);
            context.setVariable("emailApprovalEnabled", emailApprovalEnabled);
            context.setVariable("summaryFields", summaryFields);

            String htmlContent = templateEngine.process("approval-request-email", context);
            sendHtmlEmail(toEmail, "Approval Required: " + workflowName + " - " + referenceNumber, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send approval request email to {}", toEmail, e);
        }
    }

    @Async
    public void sendApprovalNotificationEmail(String toEmail, String recipientName, String workflowName,
                                               String referenceNumber, String action, String approverName,
                                               String comments, String submissionTitle) {
        try {
            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("workflowName", workflowName);
            context.setVariable("referenceNumber", referenceNumber);
            context.setVariable("action", action);
            context.setVariable("approverName", approverName);
            context.setVariable("comments", comments);
            context.setVariable("submissionTitle", submissionTitle);

            String htmlContent = templateEngine.process("approval-notification-email", context);
            sendHtmlEmail(toEmail, workflowName + " - " + referenceNumber + " " + action, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send approval notification email to {}", toEmail, e);
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        if (to == null || to.isBlank() || !to.contains("@")) {
            throw new MessagingException("Invalid recipient email address: " + to);
        }

        String fromEmail = getFromEmail();
        if (fromEmail == null || fromEmail.isBlank() || !fromEmail.contains("@")) {
            throw new MessagingException("Invalid sender email address. Please configure mail settings.");
        }

        JavaMailSender sender = getMailSender();
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        sender.send(message);
        log.info("Email sent successfully to {}", to);
    }

    public void sendTestEmail(String toEmail) throws MessagingException {
        String appName = settingService.getValue("app.name", "Sonarworks Workflow");
        String fromEmail = getFromEmail();

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f5f5f5; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <h2>Test Email</h2>
                        <p>This is a test email from your workflow management system.</p>
                        <p>If you received this email, your email settings are configured correctly.</p>
                        <p><strong>Configuration Details:</strong></p>
                        <ul>
                            <li>SMTP Host: %s</li>
                            <li>SMTP Port: %s</li>
                            <li>From Address: %s</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This is an automated test email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                appName,
                settingService.getValue("mail.host", "Not configured"),
                settingService.getValue("mail.port", "Not configured"),
                fromEmail
            );

        sendHtmlEmail(toEmail, "Test Email from " + appName, htmlContent);
    }
}
