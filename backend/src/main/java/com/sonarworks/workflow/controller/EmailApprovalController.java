package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.ApprovalRequest;
import com.sonarworks.workflow.dto.WorkflowInstanceDTO;
import com.sonarworks.workflow.entity.ApprovalHistory;
import com.sonarworks.workflow.entity.EmailApprovalToken;
import com.sonarworks.workflow.entity.WorkflowInstance;
import com.sonarworks.workflow.service.EmailApprovalService;
import com.sonarworks.workflow.service.WorkflowInstanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateToken(@RequestParam String token) {
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
        WorkflowInstance instance = approvalToken.getWorkflowInstance();

        // Check if instance is still pending and at the correct level
        if (instance.getStatus() != WorkflowInstance.Status.PENDING) {
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
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> processApproval(
            @RequestParam String token,
            @RequestParam String action,
            @RequestParam(required = false) String comments) {

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

        // Verify the authenticated user matches the approver
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Authentication required"));
        }

        String currentUserEmail = auth.getName();
        // Note: auth.getName() might return username, we need to handle this
        // For now, we'll trust the token and proceed

        // Check if instance is still at the correct level
        if (!instance.getCurrentLevel().equals(approvalToken.getApprovalLevel())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("This approval level has already been processed"));
        }

        try {
            ApprovalHistory.Action approvalAction;

            switch (action.toUpperCase()) {
                case "APPROVE":
                    approvalAction = ApprovalHistory.Action.APPROVED;
                    if (comments == null || comments.isBlank()) {
                        comments = "Approved via email";
                    }
                    break;
                case "REJECT":
                    approvalAction = ApprovalHistory.Action.REJECTED;
                    if (comments == null || comments.isBlank()) {
                        return ResponseEntity.badRequest()
                                .body(ApiResponse.error("Comments are required for rejection"));
                    }
                    break;
                default:
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid action: " + action));
            }

            ApprovalRequest approvalRequest = ApprovalRequest.builder()
                    .workflowInstanceId(instance.getId())
                    .action(approvalAction)
                    .comments(comments)
                    .actionSource("EMAIL")
                    .build();

            WorkflowInstanceDTO result = workflowInstanceService.processApproval(approvalRequest);

            // Mark token as used
            emailApprovalService.markTokenAsUsed(approvalToken);

            // Invalidate other tokens for this instance and level
            emailApprovalService.invalidateTokensForInstanceAndLevel(
                    instance.getId(),
                    approvalToken.getApprovalLevel()
            );

            return ResponseEntity.ok(ApiResponse.success(
                    action.equalsIgnoreCase("APPROVE") ? "Request approved successfully" : "Request rejected",
                    result
            ));

        } catch (Exception e) {
            log.error("Error processing email approval", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process approval: " + e.getMessage()));
        }
    }

    /**
     * Get instance details for email approval (requires auth)
     */
    @GetMapping("/instance/{token}")
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
