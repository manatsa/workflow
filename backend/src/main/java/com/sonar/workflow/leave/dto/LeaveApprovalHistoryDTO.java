package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveApprovalHistoryDTO {
    private UUID id;
    private String approverName;
    private String approverEmail;
    private Integer level;
    private String action;
    private String comments;
    private String actionDate;
}
