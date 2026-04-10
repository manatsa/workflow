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
public class ProjectBudgetAdjustmentDTO {
    private UUID id;
    private UUID budgetLineId;
    private String adjustmentType;
    private BigDecimal previousEstimated;
    private BigDecimal newEstimated;
    private BigDecimal previousActual;
    private BigDecimal newActual;
    private BigDecimal adjustmentAmount;
    private String notes;
    private String adjustedBy;
    private LocalDateTime adjustedAt;
    private LocalDateTime createdAt;
}
