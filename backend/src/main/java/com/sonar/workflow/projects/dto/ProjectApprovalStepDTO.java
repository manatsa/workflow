package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectApprovalStepDTO {
    private UUID id;
    private UUID projectId;
    private UUID approverUserId;
    private String approverName;
    private String approverEmail;
    private Integer level;
    private Integer displayOrder;
    private BigDecimal approvalLimit;
    private Boolean isUnlimited;
    private String status;
    private String action;
    private String comments;
    private LocalDateTime actionDate;
    private LocalDateTime createdAt;
}
