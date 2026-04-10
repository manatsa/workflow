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
public class ProjectStatusHistoryDTO {
    private UUID id;
    private UUID projectId;
    private String fromStatus;
    private String toStatus;
    private String fromStage;
    private String toStage;
    private String reason;
    private String changedBy;
    private LocalDateTime createdAt;
}
