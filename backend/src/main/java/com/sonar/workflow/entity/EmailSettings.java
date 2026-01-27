package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_settings")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== GENERAL SETTINGS =====

    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_protocol", length = 30, nullable = false)
    private EmailProtocol emailProtocol = EmailProtocol.SMTP;

    // ===== SMTP SETTINGS =====

    @Column(name = "smtp_host", length = 255)
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort = 587;

    @Column(name = "smtp_username", length = 255)
    private String smtpUsername;

    @Column(name = "smtp_password", length = 500)
    private String smtpPassword;

    @Enumerated(EnumType.STRING)
    @Column(name = "smtp_security", length = 20)
    private SmtpSecurity smtpSecurity = SmtpSecurity.TLS;

    @Column(name = "smtp_auth_required", nullable = false)
    private Boolean smtpAuthRequired = true;

    // ===== MICROSOFT 365 / EXCHANGE ONLINE SETTINGS =====

    @Column(name = "ms_tenant_id", length = 100)
    private String msTenantId;

    @Column(name = "ms_client_id", length = 100)
    private String msClientId;

    @Column(name = "ms_client_secret", length = 500)
    private String msClientSecret;

    @Column(name = "ms_user_email", length = 255)
    private String msUserEmail;

    // ===== GMAIL API SETTINGS =====

    @Column(name = "gmail_client_id", length = 255)
    private String gmailClientId;

    @Column(name = "gmail_client_secret", length = 500)
    private String gmailClientSecret;

    @Column(name = "gmail_refresh_token", length = 500)
    private String gmailRefreshToken;

    @Column(name = "gmail_user_email", length = 255)
    private String gmailUserEmail;

    // ===== EXCHANGE SERVER (ON-PREMISE) SETTINGS =====

    @Column(name = "exchange_server_url", length = 500)
    private String exchangeServerUrl;

    @Column(name = "exchange_domain", length = 100)
    private String exchangeDomain;

    @Column(name = "exchange_username", length = 255)
    private String exchangeUsername;

    @Column(name = "exchange_password", length = 500)
    private String exchangePassword;

    @Column(name = "exchange_email", length = 255)
    private String exchangeEmail;

    // ===== API-BASED SERVICES (SendGrid, Mailgun, AWS SES) =====

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(name = "api_endpoint", length = 500)
    private String apiEndpoint;

    @Column(name = "aws_region", length = 50)
    private String awsRegion;

    @Column(name = "aws_access_key_id", length = 100)
    private String awsAccessKeyId;

    @Column(name = "aws_secret_key", length = 500)
    private String awsSecretKey;

    // ===== SENDER SETTINGS =====

    @Column(name = "sender_email", length = 255)
    private String senderEmail;

    @Column(name = "sender_name", length = 100)
    private String senderName = "Sonar Workflow";

    @Column(name = "reply_to_email", length = 255)
    private String replyToEmail;

    // ===== EMAIL DEFAULTS =====

    @Column(name = "email_signature", columnDefinition = "TEXT")
    private String emailSignature;

    @Column(name = "include_company_logo", nullable = false)
    private Boolean includeCompanyLogo = true;

    @Column(name = "email_footer", columnDefinition = "TEXT")
    private String emailFooter;

    // ===== CONNECTION SETTINGS =====

    @Column(name = "connection_timeout")
    private Integer connectionTimeout = 5000;

    @Column(name = "read_timeout")
    private Integer readTimeout = 5000;

    @Column(name = "write_timeout")
    private Integer writeTimeout = 5000;

    // ===== ADVANCED SETTINGS =====

    @Column(name = "use_ssl_trust_all", nullable = false)
    private Boolean useSslTrustAll = false;

    @Column(name = "debug_mode", nullable = false)
    private Boolean debugMode = false;

    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    @Column(name = "retry_delay_seconds")
    private Integer retryDelaySeconds = 30;

    // ===== TEST SETTINGS =====

    @Column(name = "test_email_recipient", length = 255)
    private String testEmailRecipient;

    @Column(name = "last_test_date")
    private LocalDateTime lastTestDate;

    @Column(name = "last_test_success")
    private Boolean lastTestSuccess;

    @Column(name = "last_test_error", columnDefinition = "TEXT")
    private String lastTestError;

    // ===== AUDIT FIELDS =====

    @CreatedBy
    @Column(name = "created_by", length = 50, updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedBy
    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;
}
