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
public class ProjectIssueDTO {
    private UUID id;
    private UUID projectId;
    private UUID assigneeId;
    private UUID reportedById;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String category;
    private UUID categoryId;
    private String categoryName;
    private String assigneeName;
    private String reportedByName;
    private LocalDate reportedDate;
    private LocalDate dueDate;
    private LocalDate resolvedDate;
    private String resolution;
    private String impactDescription;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
