package com.sonarworks.workflow.dto;

import com.sonarworks.workflow.entity.ApprovalHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalHistoryDTO {

    private UUID id;
    private UUID workflowInstanceId;
    private UUID approverId;
    private String approverName;
    private String approverEmail;
    private Integer level;
    private ApprovalHistory.Action action;
    private String comments;
    private LocalDateTime actionDate;
    private ApprovalHistory.ActionSource actionSource;
}
