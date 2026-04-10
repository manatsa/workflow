package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTaskDTO {
    private UUID id;
    private UUID projectId;
    private UUID phaseId;
    private UUID milestoneId;
    private UUID parentTaskId;
    private UUID assigneeId;
    private String name;
    private String description;
    private String status;
    private String priority;
    private String assigneeName;
    private String phaseName;
    private String milestoneName;
    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDate actualStartDate;
    private LocalDate actualEndDate;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private Integer completionPercentage;
    private Integer sortOrder;
    private Boolean isCriticalPath;
    private List<UUID> dependencyTaskIds;
    private String tags;
    private List<ProjectTaskChecklistDTO> checklists;
    private List<ProjectTaskCommentDTO> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
