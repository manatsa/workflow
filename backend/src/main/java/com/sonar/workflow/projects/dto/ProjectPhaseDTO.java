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
public class ProjectPhaseDTO {
    private UUID id;
    private UUID projectId;
    private String name;
    private String description;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer sortOrder;
    private Integer completionPercentage;
    private Integer taskCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
