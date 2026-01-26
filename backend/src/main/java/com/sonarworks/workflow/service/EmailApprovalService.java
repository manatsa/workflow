package com.sonarworks.workflow.service;

import com.sonarworks.workflow.entity.EmailApprovalToken;
import com.sonarworks.workflow.entity.WorkflowInstance;
import com.sonarworks.workflow.repository.EmailApprovalTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.base-url:http://localhost:9500}")
    private String defaultBaseUrl;

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
        return createToken(instance, approverEmail, approverName, level, actionType, null);
    }

    /**
     * Creates an email approval token with optional escalation target
     */
    @Transactional
    public EmailApprovalToken createToken(WorkflowInstance instance, String approverEmail,
                                          String approverName, Integer level,
                                          EmailApprovalToken.ActionType actionType,
                                          UUID escalationTargetId) {
        // Get token expiry hours from settings (default 48 hours)
        int expiryHours = settingService.getIntValue("workflow.email.token.expiry.hours", 48);

        String tokenString = generateSecureToken();
        log.info("Creating email approval token for instance {} action {} - token: {}",
                instance.getId(), actionType, tokenString);

        EmailApprovalToken token = EmailApprovalToken.builder()
                .token(tokenString)
                .workflowInstance(instance)
                .approverEmail(approverEmail)
                .approverName(approverName)
                .approvalLevel(level)
                .actionType(actionType)
                .escalationTargetId(escalationTargetId)
                .expiresAt(LocalDateTime.now().plusHours(expiryHours))
                .isUsed(false)
                .build();

        EmailApprovalToken savedToken = tokenRepository.save(token);
        log.info("Saved email approval token with id: {} for action: {}", savedToken.getId(), actionType);
        return savedToken;
    }

    /**
     * Creates all action tokens for an approver (approve, reject, escalate, review)
     */
    @Transactional
    public EmailApprovalTokens createAllActionTokens(WorkflowInstance instance, String approverEmail,
                                                      String approverName, Integer level) {
        EmailApprovalToken approveToken = createToken(instance, approverEmail, approverName, level,
                EmailApprovalToken.ActionType.APPROVE);
        EmailApprovalToken rejectToken = createToken(instance, approverEmail, approverName, level,
                EmailApprovalToken.ActionType.REJECT);
        EmailApprovalToken escalateToken = createToken(instance, approverEmail, approverName, level,
                EmailApprovalToken.ActionType.ESCALATE);
        EmailApprovalToken reviewToken = createToken(instance, approverEmail, approverName, level,
                EmailApprovalToken.ActionType.REVIEW);

        return new EmailApprovalTokens(approveToken, rejectToken, escalateToken, reviewToken);
    }

    /**
     * Container for all action tokens
     */
    public record EmailApprovalTokens(
            EmailApprovalToken approveToken,
            EmailApprovalToken rejectToken,
            EmailApprovalToken escalateToken,
            EmailApprovalToken reviewToken
    ) {}

    /**
     * Validates and retrieves a token
     */
    public Optional<EmailApprovalToken> validateToken(String tokenString) {
        log.debug("Validating token: {}", tokenString);
        Optional<EmailApprovalToken> result = tokenRepository.findValidToken(tokenString, LocalDateTime.now());
        log.debug("Token validation result: {}", result.isPresent() ? "found valid token" : "no valid token found");
        return result;
    }

    /**
     * Gets the reason why a token is invalid (for error messages)
     */
    public String getTokenInvalidReason(String tokenString) {
        Optional<EmailApprovalToken> tokenOpt = tokenRepository.findByToken(tokenString);
        if (tokenOpt.isEmpty()) {
            log.debug("Token not found in database: {}", tokenString);
            return "Token not found. The link may be invalid or corrupted.";
        }

        EmailApprovalToken token = tokenOpt.get();
        if (Boolean.TRUE.equals(token.getIsUsed())) {
            log.debug("Token already used: {}, usedAt: {}", tokenString, token.getUsedAt());
            return "This link has already been used. Each approval link can only be used once.";
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.debug("Token expired: {}, expiredAt: {}", tokenString, token.getExpiresAt());
            return "This link has expired. Please request a new approval email.";
        }

        return "Invalid or expired token";
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
     * Invalidates ALL tokens for a specific instance (regardless of level)
     * (called when workflow is approved or rejected)
     */
    @Transactional
    public void invalidateAllTokensForInstance(UUID instanceId) {
        tokenRepository.invalidateAllTokensForInstance(instanceId, LocalDateTime.now());
        log.info("Invalidated all tokens for instance: {}", instanceId);
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
        return settingService.getValue("app.base.url", defaultBaseUrl);
    }

    /**
     * Generates the full approval URL for an action
     */
    public String generateApprovalUrl(String token, EmailApprovalToken.ActionType actionType) {
        String baseUrl = getBaseUrl();
        String url = baseUrl + "/email-approval?token=" + token + "&action=" + actionType.name().toLowerCase();
        log.debug("Generated approval URL for action {}: {}", actionType, url);
        return url;
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
