package com.sonarworks.workflow.service;

import com.sonarworks.workflow.entity.EmailApprovalToken;
import com.sonarworks.workflow.entity.WorkflowInstance;
import com.sonarworks.workflow.repository.EmailApprovalTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailApprovalService {

    private final EmailApprovalTokenRepository tokenRepository;
    private final SettingService settingService;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    /**
     * Generates a secure random token for email approval
     */
    public String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    /**
     * Creates an email approval token for a workflow instance
     */
    @Transactional
    public EmailApprovalToken createToken(WorkflowInstance instance, String approverEmail,
                                          String approverName, Integer level,
                                          EmailApprovalToken.ActionType actionType) {
        // Get token expiry hours from settings (default 48 hours)
        int expiryHours = settingService.getIntValue("workflow.email.token.expiry.hours", 48);

        EmailApprovalToken token = EmailApprovalToken.builder()
                .token(generateSecureToken())
                .workflowInstance(instance)
                .approverEmail(approverEmail)
                .approverName(approverName)
                .approvalLevel(level)
                .actionType(actionType)
                .expiresAt(LocalDateTime.now().plusHours(expiryHours))
                .isUsed(false)
                .build();

        return tokenRepository.save(token);
    }

    /**
     * Validates and retrieves a token
     */
    public Optional<EmailApprovalToken> validateToken(String tokenString) {
        return tokenRepository.findValidToken(tokenString, LocalDateTime.now());
    }

    /**
     * Marks a token as used
     */
    @Transactional
    public void markTokenAsUsed(EmailApprovalToken token) {
        token.setIsUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    /**
     * Invalidates all tokens for a specific instance and level
     * (called when an approval action is taken)
     */
    @Transactional
    public void invalidateTokensForInstanceAndLevel(UUID instanceId, Integer level) {
        tokenRepository.invalidateTokensForInstanceAndLevel(instanceId, level, LocalDateTime.now());
    }

    /**
     * Checks if email approvals are enabled
     */
    public boolean isEmailApprovalEnabled() {
        return settingService.getBooleanValue("workflow.allow.email.approvals", true);
    }

    /**
     * Gets the application base URL for generating approval links
     */
    public String getBaseUrl() {
        return settingService.getValue("app.base.url", "http://localhost:4200");
    }

    /**
     * Generates the full approval URL for an action
     */
    public String generateApprovalUrl(String token, EmailApprovalToken.ActionType actionType) {
        String baseUrl = getBaseUrl();
        return baseUrl + "/email-approval?token=" + token + "&action=" + actionType.name().toLowerCase();
    }

    /**
     * Scheduled task to clean up expired tokens
     */
    @Scheduled(cron = "0 0 */6 * * *") // Run every 6 hours
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Cleaning up expired email approval tokens");
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
