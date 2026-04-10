package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistItemDTO {
    private UUID id;
    private UUID checklistId;
    private UUID completedById;
    private String name;
    private String description;
    private Boolean isCompleted;
    private Boolean isMandatory;
    private String completedByName;
    private LocalDateTime completedAt;
    private Integer sortOrder;
}
