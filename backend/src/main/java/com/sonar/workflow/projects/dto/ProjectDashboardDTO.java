package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDashboardDTO {
    private Long totalProjects;
    private Long activeProjects;
    private Long completedProjects;
    private Long overdueProjects;
    private BigDecimal totalBudget;
    private BigDecimal totalActualCost;
    private Double averageCompletion;
    private Map<String, Long> projectsByStatus;
    private Map<String, Long> projectsByPriority;
    private Map<String, Long> projectsByStage;
    private List<ProjectSummaryDTO> recentProjects;
    private List<ProjectActivityDTO> recentActivities;
}
