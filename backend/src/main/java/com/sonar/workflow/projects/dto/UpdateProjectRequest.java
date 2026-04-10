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
public class UpdateProjectRequest {
    private String name;
    private String description;
    private String priority;
    private String category;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private BigDecimal estimatedBudget;
    private UUID managerId;
    private UUID sponsorId;
    private UUID sbuId;
    private Integer completionPercentage;
    private String notes;
    private String objectives;
    private String scope;
    private String deliverables;
    private String assumptions;
    private String constraints;
}
