package com.sonar.workflow.dto;

import com.sonar.workflow.entity.ApprovalHistory;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotNull(message = "Workflow instance ID is required")
    private UUID workflowInstanceId;

    @NotNull(message = "Action is required")
    private ApprovalHistory.Action action;

    private String comments;

    private UUID escalateToUserId;

    private String actionSource;
}
