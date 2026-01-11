package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.EmailConfigurationStatus;
import com.sonarworks.workflow.dto.EmailTestResult;
import com.sonarworks.workflow.entity.EmailProtocol;
import com.sonarworks.workflow.entity.EmailSettings;
import com.sonarworks.workflow.entity.SmtpSecurity;
import com.sonarworks.workflow.repository.EmailSettingsRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailSettingsService {

    private final EmailSettingsRepository emailSettingsRepository;

    public EmailSettings getSettings() {
        return emailSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    EmailSettings defaultSettings = new EmailSettings();
                    defaultSettings.setEmailEnabled(false);
                    defaultSettings.setEmailProtocol(EmailProtocol.SMTP);
                    defaultSettings.setSmtpPort(587);
                    defaultSettings.setSmtpSecurity(SmtpSecurity.TLS);
                    defaultSettings.setSmtpAuthRequired(true);
                    defaultSettings.setSenderName("Sonarworks Workflow");
                    defaultSettings.setConnectionTimeout(5000);
                    defaultSettings.setReadTimeout(5000);
                    defaultSettings.setWriteTimeout(5000);
                    defaultSettings.setMaxRetries(3);
                    defaultSettings.setRetryDelaySeconds(30);
                    defaultSettings.setIncludeCompanyLogo(true);
                    defaultSettings.setUseSslTrustAll(false);
                    defaultSettings.setDebugMode(false);
                    return emailSettingsRepository.save(defaultSettings);
                });
    }

    public EmailSettings getSettingsForDisplay() {
        EmailSettings settings = getSettings();
        // Mask sensitive fields for frontend display
        if (StringUtils.hasText(settings.getSmtpPassword())) {
            settings.setSmtpPassword("********");
        }
        if (StringUtils.hasText(settings.getMsClientSecret())) {
            settings.setMsClientSecret("********");
        }
        if (StringUtils.hasText(settings.getGmailClientSecret())) {
            settings.setGmailClientSecret("********");
        }
        if (StringUtils.hasText(settings.getGmailRefreshToken())) {
            settings.setGmailRefreshToken("********");
        }
        if (StringUtils.hasText(settings.getExchangePassword())) {
            settings.setExchangePassword("********");
        }
        if (StringUtils.hasText(settings.getApiKey())) {
            settings.setApiKey("********");
        }
        if (StringUtils.hasText(settings.getAwsSecretKey())) {
            settings.setAwsSecretKey("********");
        }
        return settings;
    }

    @Transactional
    public EmailSettings updateSettings(EmailSettings newSettings) {
        EmailSettings existingSettings = getSettings();

        // Update general settings
        existingSettings.setEmailEnabled(newSettings.getEmailEnabled());
        existingSettings.setEmailProtocol(newSettings.getEmailProtocol());

        // Update SMTP settings
        existingSettings.setSmtpHost(newSettings.getSmtpHost());
        existingSettings.setSmtpPort(newSettings.getSmtpPort());
        existingSettings.setSmtpUsername(newSettings.getSmtpUsername());
        existingSettings.setSmtpSecurity(newSettings.getSmtpSecurity());
        existingSettings.setSmtpAuthRequired(newSettings.getSmtpAuthRequired());

        // Only update password if not masked
        if (newSettings.getSmtpPassword() != null && !newSettings.getSmtpPassword().equals("********")) {
            existingSettings.setSmtpPassword(newSettings.getSmtpPassword());
        }

        // Update Microsoft 365 settings
        existingSettings.setMsTenantId(newSettings.getMsTenantId());
        existingSettings.setMsClientId(newSettings.getMsClientId());
        existingSettings.setMsUserEmail(newSettings.getMsUserEmail());
        if (newSettings.getMsClientSecret() != null && !newSettings.getMsClientSecret().equals("********")) {
            existingSettings.setMsClientSecret(newSettings.getMsClientSecret());
        }

        // Update Gmail API settings
        existingSettings.setGmailClientId(newSettings.getGmailClientId());
        existingSettings.setGmailUserEmail(newSettings.getGmailUserEmail());
        if (newSettings.getGmailClientSecret() != null && !newSettings.getGmailClientSecret().equals("********")) {
            existingSettings.setGmailClientSecret(newSettings.getGmailClientSecret());
        }
        if (newSettings.getGmailRefreshToken() != null && !newSettings.getGmailRefreshToken().equals("********")) {
            existingSettings.setGmailRefreshToken(newSettings.getGmailRefreshToken());
        }

        // Update Exchange settings
        existingSettings.setExchangeServerUrl(newSettings.getExchangeServerUrl());
        existingSettings.setExchangeDomain(newSettings.getExchangeDomain());
        existingSettings.setExchangeUsername(newSettings.getExchangeUsername());
        existingSettings.setExchangeEmail(newSettings.getExchangeEmail());
        if (newSettings.getExchangePassword() != null && !newSettings.getExchangePassword().equals("********")) {
            existingSettings.setExchangePassword(newSettings.getExchangePassword());
        }

        // Update API settings
        existingSettings.setApiEndpoint(newSettings.getApiEndpoint());
        existingSettings.setAwsRegion(newSettings.getAwsRegion());
        existingSettings.setAwsAccessKeyId(newSettings.getAwsAccessKeyId());
        if (newSettings.getApiKey() != null && !newSettings.getApiKey().equals("********")) {
            existingSettings.setApiKey(newSettings.getApiKey());
        }
        if (newSettings.getAwsSecretKey() != null && !newSettings.getAwsSecretKey().equals("********")) {
            existingSettings.setAwsSecretKey(newSettings.getAwsSecretKey());
        }

        // Update sender settings
        existingSettings.setSenderEmail(newSettings.getSenderEmail());
        existingSettings.setSenderName(newSettings.getSenderName());
        existingSettings.setReplyToEmail(newSettings.getReplyToEmail());

        // Update email appearance
        existingSettings.setEmailSignature(newSettings.getEmailSignature());
        existingSettings.setIncludeCompanyLogo(newSettings.getIncludeCompanyLogo());
        existingSettings.setEmailFooter(newSettings.getEmailFooter());

        // Update connection settings
        existingSettings.setConnectionTimeout(newSettings.getConnectionTimeout());
        existingSettings.setReadTimeout(newSettings.getReadTimeout());
        existingSettings.setWriteTimeout(newSettings.getWriteTimeout());

        // Update advanced settings
        existingSettings.setUseSslTrustAll(newSettings.getUseSslTrustAll());
        existingSettings.setDebugMode(newSettings.getDebugMode());
        existingSettings.setMaxRetries(newSettings.getMaxRetries());
        existingSettings.setRetryDelaySeconds(newSettings.getRetryDelaySeconds());

        // Update test settings
        existingSettings.setTestEmailRecipient(newSettings.getTestEmailRecipient());

        return emailSettingsRepository.save(existingSettings);
    }

    public boolean isEmailConfigured() {
        EmailSettings settings = getSettings();
        if (!settings.getEmailEnabled()) {
            return false;
        }

        EmailProtocol protocol = settings.getEmailProtocol();

        // Check based on protocol
        if (protocol == EmailProtocol.SMTP || protocol == EmailProtocol.SMTP_OFFICE365 ||
            protocol == EmailProtocol.SMTP_GMAIL || protocol == EmailProtocol.SMTP_OUTLOOK ||
            protocol == EmailProtocol.SMTP_YAHOO || protocol == EmailProtocol.SMTP_EXCHANGE) {
            return StringUtils.hasText(settings.getSmtpHost()) &&
                   settings.getSmtpPort() != null &&
                   StringUtils.hasText(settings.getSenderEmail());
        } else if (protocol == EmailProtocol.MICROSOFT_GRAPH) {
            return StringUtils.hasText(settings.getMsTenantId()) &&
                   StringUtils.hasText(settings.getMsClientId()) &&
                   StringUtils.hasText(settings.getMsClientSecret()) &&
                   StringUtils.hasText(settings.getMsUserEmail());
        } else if (protocol == EmailProtocol.GMAIL_API) {
            return StringUtils.hasText(settings.getGmailClientId()) &&
                   StringUtils.hasText(settings.getGmailClientSecret()) &&
                   StringUtils.hasText(settings.getGmailRefreshToken()) &&
                   StringUtils.hasText(settings.getGmailUserEmail());
        } else if (protocol == EmailProtocol.EXCHANGE_EWS) {
            return StringUtils.hasText(settings.getExchangeServerUrl()) &&
                   StringUtils.hasText(settings.getExchangeUsername()) &&
                   StringUtils.hasText(settings.getExchangePassword()) &&
                   StringUtils.hasText(settings.getExchangeEmail());
        } else if (protocol == EmailProtocol.SENDGRID || protocol == EmailProtocol.MAILGUN) {
            return StringUtils.hasText(settings.getApiKey()) &&
                   StringUtils.hasText(settings.getSenderEmail());
        } else if (protocol == EmailProtocol.AWS_SES) {
            return StringUtils.hasText(settings.getAwsAccessKeyId()) &&
                   StringUtils.hasText(settings.getAwsSecretKey()) &&
                   StringUtils.hasText(settings.getAwsRegion()) &&
                   StringUtils.hasText(settings.getSenderEmail());
        }

        return false;
    }

    public EmailConfigurationStatus getEmailStatus() {
        EmailSettings settings = getSettings();

        EmailConfigurationStatus status = new EmailConfigurationStatus();
        status.setEnabled(settings.getEmailEnabled());
        status.setConfigured(isEmailConfigured());
        status.setTested(settings.getLastTestDate() != null);
        status.setLastTestSuccess(settings.getLastTestSuccess() != null && settings.getLastTestSuccess());
        status.setLastTestDate(settings.getLastTestDate());
        status.setLastTestError(settings.getLastTestError());
        status.setSmtpHost(settings.getSmtpHost());
        status.setSmtpPort(settings.getSmtpPort());
        status.setSenderEmail(settings.getSenderEmail());
        status.setEmailProtocol(settings.getEmailProtocol() != null ? settings.getEmailProtocol().name() : null);

        return status;
    }

    public JavaMailSender buildMailSender() {
        EmailSettings settings = getSettings();

        if (!settings.getEmailEnabled()) {
            throw new RuntimeException("Email functionality is disabled");
        }

        EmailProtocol protocol = settings.getEmailProtocol();

        // Only SMTP-based protocols can use JavaMailSender
        if (protocol != EmailProtocol.SMTP && protocol != EmailProtocol.SMTP_OFFICE365 &&
            protocol != EmailProtocol.SMTP_GMAIL && protocol != EmailProtocol.SMTP_OUTLOOK &&
            protocol != EmailProtocol.SMTP_YAHOO && protocol != EmailProtocol.SMTP_EXCHANGE) {
            throw new RuntimeException("Protocol " + protocol + " does not use JavaMailSender. Use appropriate API client.");
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(settings.getSmtpHost());
        mailSender.setPort(settings.getSmtpPort());

        if (settings.getSmtpAuthRequired()) {
            mailSender.setUsername(settings.getSmtpUsername());
            mailSender.setPassword(settings.getSmtpPassword());
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");

        SmtpSecurity security = settings.getSmtpSecurity();
        if (security == SmtpSecurity.TLS) {
            props.put("mail.smtp.auth", String.valueOf(settings.getSmtpAuthRequired()));
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        } else if (security == SmtpSecurity.SSL) {
            props.put("mail.smtp.auth", String.valueOf(settings.getSmtpAuthRequired()));
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        } else {
            props.put("mail.smtp.auth", String.valueOf(settings.getSmtpAuthRequired()));
        }

        props.put("mail.smtp.connectiontimeout", String.valueOf(settings.getConnectionTimeout()));
        props.put("mail.smtp.timeout", String.valueOf(settings.getReadTimeout()));
        props.put("mail.smtp.writetimeout", String.valueOf(settings.getWriteTimeout()));

        if (settings.getUseSslTrustAll()) {
            props.put("mail.smtp.ssl.trust", "*");
        }

        if (settings.getDebugMode()) {
            props.put("mail.debug", "true");
        }

        return mailSender;
    }

    @Transactional
    public EmailTestResult testEmailConfiguration(String recipientEmail) {
        EmailSettings settings = getSettings();
        long startTime = System.currentTimeMillis();

        try {
            if (!isEmailConfigured()) {
                return EmailTestResult.failure("Email is not properly configured", "Please configure all required fields");
            }

            String recipient = StringUtils.hasText(recipientEmail) ? recipientEmail : settings.getTestEmailRecipient();
            if (!StringUtils.hasText(recipient)) {
                return EmailTestResult.failure("No recipient specified", "Please provide a test email recipient");
            }

            // For SMTP-based protocols, send test email
            EmailProtocol protocol = settings.getEmailProtocol();
            if (protocol == EmailProtocol.SMTP || protocol == EmailProtocol.SMTP_OFFICE365 ||
                protocol == EmailProtocol.SMTP_GMAIL || protocol == EmailProtocol.SMTP_OUTLOOK ||
                protocol == EmailProtocol.SMTP_YAHOO || protocol == EmailProtocol.SMTP_EXCHANGE) {

                JavaMailSender mailSender = buildMailSender();
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(settings.getSenderEmail(), settings.getSenderName());
                helper.setTo(recipient);
                helper.setSubject("Sonarworks Workflow Email Test");
                helper.setText("<html><body><h2>Email Configuration Test</h2><p>This is a test email from Sonarworks Workflow.</p><p>If you received this email, your email configuration is working correctly.</p><p>Sent at: " + LocalDateTime.now() + "</p></body></html>", true);

                if (StringUtils.hasText(settings.getReplyToEmail())) {
                    helper.setReplyTo(settings.getReplyToEmail());
                }

                mailSender.send(message);
            } else {
                // For API-based protocols, just verify configuration
                return EmailTestResult.failure("API-based protocol testing not implemented",
                    "Protocol " + protocol + " requires manual verification");
            }

            long duration = System.currentTimeMillis() - startTime;

            // Update test results
            settings.setLastTestDate(LocalDateTime.now());
            settings.setLastTestSuccess(true);
            settings.setLastTestError(null);
            emailSettingsRepository.save(settings);

            return EmailTestResult.success("Test email sent successfully to " + recipient, duration);

        } catch (Exception e) {
            log.error("Email test failed", e);
            long duration = System.currentTimeMillis() - startTime;

            // Update test results
            settings.setLastTestDate(LocalDateTime.now());
            settings.setLastTestSuccess(false);
            settings.setLastTestError(e.getMessage());
            emailSettingsRepository.save(settings);

            return EmailTestResult.failure("Failed to send test email: " + e.getMessage(), e.toString());
        }
    }

    public String getSenderEmail() {
        return getSettings().getSenderEmail();
    }

    public String getSenderName() {
        return getSettings().getSenderName();
    }
}
