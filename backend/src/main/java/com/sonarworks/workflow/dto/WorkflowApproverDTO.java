package com.sonarworks.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowApproverDTO {

    private String id;  // String to accept temp IDs from frontend
    private UUID workflowId;

    // User selection (when approverType = USER)
    private String approverId;  // User ID as string (single user - legacy)
    private List<String> approverIds;  // Multiple user IDs (preferred)
    private UUID userId;        // Alternative user ID field
    private String userName;
    private String approverName;
    private String approverEmail;

    // Role selection (when approverType = ROLE)
    private String roleId;      // Role ID as string

    // Approver type: USER, ROLE, MANAGER, SBU_HEAD
    private String approverType;

    // Label for display
    private String label;

    // Email for notifications (frontend uses 'email')
    private String email;

    private Integer level;

    private BigDecimal approvalLimit;
    private BigDecimal amountLimit;  // Frontend uses amountLimit
    private Boolean isUnlimited;
    private Boolean canEscalate;
    private Boolean requireComment;
    private Boolean emailNotification;
    private Integer escalationTimeoutHours;
    private Boolean notifyOnPending;
    private Boolean notifyOnApproval;
    private Boolean notifyOnRejection;
    private UUID sbuId;
    private String sbuName;
    private Integer displayOrder;
}
