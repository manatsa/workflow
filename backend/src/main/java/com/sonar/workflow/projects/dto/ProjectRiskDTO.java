package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRiskDTO {
    private UUID id;
    private UUID projectId;
    private UUID ownerId;
    private String title;
    private String description;
    private String probability;
    private String impact;
    private String status;
    private String ownerName;
    private String mitigationPlan;
    private String contingencyPlan;
    private LocalDate identifiedDate;
    private LocalDate responseDate;
    private String riskCategory;
    private UUID categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
