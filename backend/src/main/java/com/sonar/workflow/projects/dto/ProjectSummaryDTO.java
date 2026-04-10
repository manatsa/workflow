package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummaryDTO {
    private UUID id;
    private String code;
    private String name;
    private String status;
    private String stage;
    private String priority;
    private String managerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer completionPercentage;
    private Integer taskCount;
    private Integer completedTaskCount;
    private BigDecimal estimatedBudget;
    private BigDecimal actualCost;
}
