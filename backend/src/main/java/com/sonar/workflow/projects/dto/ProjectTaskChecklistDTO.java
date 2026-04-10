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
public class ProjectTaskChecklistDTO {
    private UUID id;
    private UUID taskId;
    private UUID completedById;
    private String name;
    private Boolean isCompleted;
    private String completedByName;
    private LocalDateTime completedAt;
    private Integer sortOrder;
}
