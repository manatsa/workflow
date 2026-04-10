package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistDTO {
    private UUID id;
    private UUID projectId;
    private String name;
    private String description;
    private String type;
    private Boolean isTemplate;
    private Integer sortOrder;
    private Integer totalItems;
    private Integer completedItems;
    private Double completionPercentage;
    private List<ProjectChecklistItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
