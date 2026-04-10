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
public class ProjectMilestoneDTO {
    private UUID id;
    private UUID projectId;
    private UUID ownerId;
    private String name;
    private String description;
    private String status;
    private String ownerName;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private Integer sortOrder;
    private Boolean isCritical;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
