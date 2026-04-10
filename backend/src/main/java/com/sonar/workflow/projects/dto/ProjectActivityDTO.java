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
public class ProjectActivityDTO {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private String type;
    private String description;
    private String entityType;
    private UUID entityId;
    private String userName;
    private LocalDateTime timestamp;
}
