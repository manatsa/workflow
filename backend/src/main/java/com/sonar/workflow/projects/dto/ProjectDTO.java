package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String status;
    private String stage;
    private String priority;
    private String category;
    private UUID categoryId;
    private String categoryCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private BigDecimal estimatedBudget;
    private BigDecimal actualCost;
    private Integer completionPercentage;
    private UUID managerId;
    private UUID sponsorId;
    private UUID sbuId;
    private String managerName;
    private String sponsorName;
    private String sbuName;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private Integer currentApprovalLevel;
    private UUID currentApproverId;
    private String currentApproverName;
    private LocalDateTime submittedForApprovalAt;
    private String submittedBy;
    private Boolean isCurrentUserApprover;
    private List<ProjectApprovalStepDTO> approvalSteps;
    private String notes;
    private String objectives;
    private String scope;
    private String deliverables;
    private String assumptions;
    private String constraints;
    private Integer taskCount;
    private Integer completedTaskCount;
    private Integer teamMemberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private Boolean isActive;
}
