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

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final SettingService settingService;

    @Value("${spring.mail.username:noreply@sonarworks.com}")
    private String fromEmail;

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
        try {
            String baseUrl = settingService.getValue("app.base.url", "http://localhost:4200");
            String resetLink = baseUrl + "/reset-password?token=" + token;

            Context context = new Context();
            context.setVariable("firstName", firstName);
            context.setVariable("resetLink", resetLink);
            context.setVariable("expiryHours", settingService.getIntValue("password.reset.token.expiry.hours", 24));

            String htmlContent = templateEngine.process("password-reset-email", context);
            sendHtmlEmail(toEmail, "Password Reset Request", htmlContent);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
        }
    }

    @Async
    public void sendApprovalRequestEmail(String toEmail, String approverName, String workflowName,
                                          String referenceNumber, String initiatorName, String approvalLink) {
        try {
            Context context = new Context();
            context.setVariable("approverName", approverName);
            context.setVariable("workflowName", workflowName);
            context.setVariable("referenceNumber", referenceNumber);
            context.setVariable("initiatorName", initiatorName);
            context.setVariable("approvalLink", approvalLink);

            String htmlContent = templateEngine.process("approval-request-email", context);
            sendHtmlEmail(toEmail, "Approval Required: " + workflowName + " - " + referenceNumber, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send approval request email to {}", toEmail, e);
        }
    }

    @Async
    public void sendApprovalNotificationEmail(String toEmail, String recipientName, String workflowName,
                                               String referenceNumber, String action, String approverName, String comments) {
        try {
            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("workflowName", workflowName);
            context.setVariable("referenceNumber", referenceNumber);
            context.setVariable("action", action);
            context.setVariable("approverName", approverName);
            context.setVariable("comments", comments);

            String htmlContent = templateEngine.process("approval-notification-email", context);
            sendHtmlEmail(toEmail, workflowName + " - " + referenceNumber + " " + action, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send approval notification email to {}", toEmail, e);
        }
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
        log.info("Email sent successfully to {}", to);
    }
}
