package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.ApprovalRequest;
import com.sonar.workflow.dto.WorkflowInstanceDTO;
import com.sonar.workflow.entity.ApprovalHistory;
import com.sonar.workflow.entity.EmailApprovalToken;
import com.sonar.workflow.entity.WorkflowInstance;
import com.sonar.workflow.service.EmailApprovalService;
import com.sonar.workflow.service.WorkflowInstanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/email-approval")
@RequiredArgsConstructor
@Slf4j
public class EmailApprovalController {

    private final EmailApprovalService emailApprovalService;
    private final WorkflowInstanceService workflowInstanceService;

    /**
     * Validates a token and returns the workflow instance details
     * This endpoint is publicly accessible (no auth required) but token must be valid
     */
    @GetMapping("/validate")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@RequestParam String token) {
        log.debug("Validating email approval token: {}", token);

        if (!emailApprovalService.isEmailApprovalEnabled()) {
            log.warn("Email approvals are disabled");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email approvals are not enabled"));
        }

        Optional<EmailApprovalToken> tokenOpt = emailApprovalService.validateToken(token);
        if (tokenOpt.isEmpty()) {
            // Check if token exists but is expired or used
            String reason = emailApprovalService.getTokenInvalidReason(token);
            log.warn("Token validation failed for token '{}': {}", token, reason);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(reason));
        }

        EmailApprovalToken approvalToken = tokenOpt.get();
        WorkflowInstance instance = approvalToken.getWorkflowInstance();

        // Check if instance is still pending and at the correct level
        if (instance.getStatus() != WorkflowInstance.Status.PENDING &&
            instance.getStatus() != WorkflowInstance.Status.ESCALATED) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This request has already been processed"));
        }

        if (!instance.getCurrentLevel().equals(approvalToken.getApprovalLevel())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This approval level has already been processed"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("instanceId", instance.getId());
        response.put("referenceNumber", instance.getReferenceNumber());
        response.put("workflowName", instance.getWorkflow().getName());
        response.put("initiatorName", instance.getInitiator() != null ? instance.getInitiator().getFullName() : "Unknown");
        response.put("approverEmail", approvalToken.getApproverEmail());
        response.put("approverName", approvalToken.getApproverName());
        response.put("actionType", approvalToken.getActionType());
        response.put("currentLevel", instance.getCurrentLevel());
        response.put("requiresAuth", true); // Frontend will check if user is logged in

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Process an approval action from email
     * This endpoint requires authentication
     */
    @PostMapping("/process")
    @Transactional
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> processApproval(
            @RequestParam String token,
            @RequestParam String action,
            @RequestParam(required = false) String comments,
            @RequestParam(required = false) UUID escalateToUserId) {

        if (!emailApprovalService.isEmailApprovalEnabled()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email approvals are not enabled"));
        }

        // Validate token
        Optional<EmailApprovalToken> tokenOpt = emailApprovalService.validateToken(token);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or expired token"));
        }

        EmailApprovalToken approvalToken = tokenOpt.get();
        WorkflowInstance instance = approvalToken.getWorkflowInstance();
        UUID instanceId = instance.getId();
        Integer approvalLevel = approvalToken.getApprovalLevel();

        // Verify the authenticated user matches the approver
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Authentication required"));
        }

        // Verify the logged-in user's email matches the token's approver email
        String authenticatedEmail = null;
        Object principal = auth.getPrincipal();
        if (principal instanceof com.sonar.workflow.security.CustomUserDetails) {
            authenticatedEmail = ((com.sonar.workflow.security.CustomUserDetails) principal).getEmail();
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            authenticatedEmail = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        }

        if (authenticatedEmail == null || !authenticatedEmail.equalsIgnoreCase(approvalToken.getApproverEmail())) {
            log.warn("Email approval: authenticated user email '{}' does not match token approver email '{}'",
                    authenticatedEmail, approvalToken.getApproverEmail());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You are not authorized to perform this action. Please log in with the account associated with " + approvalToken.getApproverEmail()));
        }

        // Check if instance is still pending or escalated
        if (instance.getStatus() != WorkflowInstance.Status.PENDING &&
            instance.getStatus() != WorkflowInstance.Status.ESCALATED) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This request has already been processed"));
        }

        // Check if instance is still at the correct level
        if (!instance.getCurrentLevel().equals(approvalLevel)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This approval level has already been processed"));
        }

        try {
            ApprovalHistory.Action approvalAction;
            String successMessage;

            switch (action.toUpperCase()) {
                case "APPROVE":
                    approvalAction = ApprovalHistory.Action.APPROVED;
                    if (comments == null || comments.isBlank()) {
                        comments = "Approved via email";
                    }
                    successMessage = "Request approved successfully";
                    break;
                case "REJECT":
                    approvalAction = ApprovalHistory.Action.REJECTED;
                    if (comments == null || comments.isBlank()) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Comments are required for rejection"));
                    }
                    successMessage = "Request rejected";
                    break;
                case "ESCALATE":
                    approvalAction = ApprovalHistory.Action.ESCALATED;
                    if (comments == null || comments.isBlank()) {
                        comments = "Escalated via email";
                    }
                    successMessage = "Request escalated successfully";
                    break;
                case "REVIEW":
                    // Review is a read-only action - just mark the token as used
                    emailApprovalService.markTokenAsUsed(approvalToken);
                    WorkflowInstanceDTO reviewResult = workflowInstanceService.getInstanceById(instanceId);
                    return ResponseEntity.ok(ApiResponse.success("Request reviewed", reviewResult));
                default:
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid action: " + action));
            }

            ApprovalRequest.ApprovalRequestBuilder requestBuilder = ApprovalRequest.builder()
                    .workflowInstanceId(instanceId)
                    .action(approvalAction)
                    .comments(comments)
                    .actionSource("EMAIL");

            // Add escalation target if escalating
            if (approvalAction == ApprovalHistory.Action.ESCALATED && escalateToUserId != null) {
                requestBuilder.escalateToUserId(escalateToUserId);
            }

            WorkflowInstanceDTO result = workflowInstanceService.processApproval(requestBuilder.build());

            // Mark token as used
            emailApprovalService.markTokenAsUsed(approvalToken);

            // Invalidate other tokens for this instance and level
            emailApprovalService.invalidateTokensForInstanceAndLevel(instanceId, approvalLevel);

            return ResponseEntity.ok(ApiResponse.success(successMessage, result));

        } catch (Exception e) {
            log.error("Error processing email approval", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process approval: " + e.getMessage()));
        }
    }

    /**
     * Get escalation targets for a workflow instance
     * Returns list of approvers who can receive escalation
     */
    @GetMapping("/escalation-targets")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEscalationTargets(@RequestParam String token) {
        if (!emailApprovalService.isEmailApprovalEnabled()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email approvals are not enabled"));
        }

        Optional<EmailApprovalToken> tokenOpt = emailApprovalService.validateToken(token);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or expired token"));
        }

        EmailApprovalToken approvalToken = tokenOpt.get();
        List<Map<String, Object>> targets = workflowInstanceService.getEscalationTargets(
                approvalToken.getWorkflowInstance().getId()
        );

        return ResponseEntity.ok(ApiResponse.success(targets));
    }

    /**
     * Get instance details for email approval (requires auth)
     */
    @GetMapping("/instance/{token}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> getInstanceDetails(@PathVariable String token) {
        if (!emailApprovalService.isEmailApprovalEnabled()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email approvals are not enabled"));
        }

        Optional<EmailApprovalToken> tokenOpt = emailApprovalService.validateToken(token);
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or expired token"));
        }

        EmailApprovalToken approvalToken = tokenOpt.get();
        WorkflowInstanceDTO instanceDTO = workflowInstanceService.getInstanceById(
                approvalToken.getWorkflowInstance().getId()
        );

        return ResponseEntity.ok(ApiResponse.success(instanceDTO));
    }
}
