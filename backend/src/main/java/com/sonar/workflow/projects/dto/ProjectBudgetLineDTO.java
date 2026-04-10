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
public class ProjectBudgetLineDTO {
    private UUID id;
    private UUID projectId;
    private String name;
    private String description;
    private String category;
    private BigDecimal estimatedAmount;
    private BigDecimal actualAmount;
    private BigDecimal committedAmount;
    private BigDecimal variance;
    private BigDecimal originalEstimate;
    private BigDecimal approvedAmount;
    private BigDecimal forecastAmount;
    private String notes;
    private String adjustmentNotes;
    private BigDecimal variancePercentage;
    private Integer adjustmentCount;
    private List<ProjectBudgetAdjustmentDTO> adjustments;
    private LocalDate budgetDate;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
