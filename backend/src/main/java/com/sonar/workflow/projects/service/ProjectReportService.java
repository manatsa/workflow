package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.*;
import com.sonar.workflow.projects.entity.*;
import com.sonar.workflow.projects.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectReportService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectTeamMemberRepository teamMemberRepository;
    private final ProjectRiskRepository riskRepository;
    private final ProjectIssueRepository issueRepository;
    private final ProjectBudgetLineRepository budgetLineRepository;
    private final ProjectTimeLogRepository timeLogRepository;
    private final ProjectMilestoneRepository milestoneRepository;

    @Transactional(readOnly = true)
    public ProjectReportDTO getStatusReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("projectCode", project.getCode());
        summary.put("status", project.getStatus().name());
        summary.put("stage", project.getStage().name());
        summary.put("completionPercentage", project.getCompletionPercentage());
        summary.put("startDate", project.getStartDate());
        summary.put("endDate", project.getEndDate());
        summary.put("manager", project.getManager() != null ? project.getManager().getFullName() : "Unassigned");

        long totalTasks = taskRepository.countByProjectIdAndIsActiveTrue(projectId);
        long completedTasks = taskRepository.countByProjectIdAndStatus(projectId, ProjectTask.TaskStatus.DONE);
        long blockedTasks = taskRepository.countByProjectIdAndStatus(projectId, ProjectTask.TaskStatus.BLOCKED);
        summary.put("totalTasks", totalTasks);
        summary.put("completedTasks", completedTasks);
        summary.put("blockedTasks", blockedTasks);

        long openRisks = riskRepository.countByProjectIdAndStatusNot(projectId, ProjectRisk.RiskStatus.CLOSED);
        long openIssues = issueRepository.countByProjectIdAndStatusNot(projectId, ProjectIssue.IssueStatus.CLOSED);
        summary.put("openRisks", openRisks);
        summary.put("openIssues", openIssues);

        summary.put("estimatedBudget", project.getEstimatedBudget());
        summary.put("actualCost", project.getActualCost());
        if (project.getEstimatedBudget() != null && project.getEstimatedBudget().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal budgetVariance = project.getEstimatedBudget().subtract(
                    project.getActualCost() != null ? project.getActualCost() : BigDecimal.ZERO);
            summary.put("budgetVariance", budgetVariance);
            BigDecimal budgetUtilization = project.getActualCost() != null
                    ? project.getActualCost().divide(project.getEstimatedBudget(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            summary.put("budgetUtilization", budgetUtilization);
        }

        // Schedule analysis
        if (project.getEndDate() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), project.getEndDate());
            summary.put("daysRemaining", daysRemaining);
            summary.put("isOverdue", daysRemaining < 0);
        }

        return ProjectReportDTO.builder()
                .reportType("STATUS_REPORT")
                .reportTitle("Project Status Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(summary)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getBudgetReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        List<ProjectBudgetLine> budgetLines = budgetLineRepository.findByProjectIdOrderBySortOrder(projectId);

        List<Map<String, Object>> tableData = budgetLines.stream().map(line -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", line.getName());
            row.put("category", line.getCategory().name());
            row.put("estimated", line.getEstimatedAmount());
            row.put("actual", line.getActualAmount());
            row.put("committed", line.getCommittedAmount());
            row.put("variance", line.getEstimatedAmount().subtract(line.getActualAmount()));
            return row;
        }).collect(Collectors.toList());

        BigDecimal totalEstimated = budgetLineRepository.sumEstimatedByProjectId(projectId);
        BigDecimal totalActual = budgetLineRepository.sumActualByProjectId(projectId);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("totalEstimated", totalEstimated);
        summary.put("totalActual", totalActual);
        summary.put("totalVariance", totalEstimated.subtract(totalActual));
        summary.put("lineCount", budgetLines.size());

        return ProjectReportDTO.builder()
                .reportType("BUDGET_REPORT")
                .reportTitle("Budget Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getTaskReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        List<ProjectTask> tasks = taskRepository.findByProjectIdAndIsActiveTrue(projectId);

        Map<String, Long> tasksByStatus = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));

        Map<String, Long> tasksByPriority = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));

        List<Map<String, Object>> tableData = tasks.stream().map(task -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", task.getName());
            row.put("status", task.getStatus().name());
            row.put("priority", task.getPriority().name());
            row.put("assignee", task.getAssignee() != null ? task.getAssignee().getFullName() : "Unassigned");
            row.put("startDate", task.getStartDate());
            row.put("dueDate", task.getDueDate());
            row.put("completion", task.getCompletionPercentage());
            row.put("estimatedHours", task.getEstimatedHours());
            row.put("actualHours", task.getActualHours());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("totalTasks", tasks.size());
        summary.put("tasksByStatus", tasksByStatus);
        summary.put("tasksByPriority", tasksByPriority);

        long overdueTasks = tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != ProjectTask.TaskStatus.DONE && t.getStatus() != ProjectTask.TaskStatus.CANCELLED)
                .count();
        summary.put("overdueTasks", overdueTasks);

        return ProjectReportDTO.builder()
                .reportType("TASK_REPORT")
                .reportTitle("Task Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getRiskReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        List<ProjectRisk> risks = riskRepository.findByProjectId(projectId);

        List<Map<String, Object>> tableData = risks.stream().map(risk -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("title", risk.getTitle());
            row.put("probability", risk.getProbability().name());
            row.put("impact", risk.getImpact().name());
            row.put("status", risk.getStatus().name());
            row.put("owner", risk.getOwner() != null ? risk.getOwner().getFullName() : "Unassigned");
            row.put("category", risk.getRiskCategory());
            row.put("identifiedDate", risk.getIdentifiedDate());
            return row;
        }).collect(Collectors.toList());

        Map<String, Long> risksByStatus = risks.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus().name(), Collectors.counting()));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("totalRisks", risks.size());
        summary.put("risksByStatus", risksByStatus);

        long highRisks = risks.stream()
                .filter(r -> r.getImpact() == ProjectRisk.RiskImpact.HIGH || r.getImpact() == ProjectRisk.RiskImpact.VERY_HIGH)
                .count();
        summary.put("highImpactRisks", highRisks);

        return ProjectReportDTO.builder()
                .reportType("RISK_REPORT")
                .reportTitle("Risk Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getTimeReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        BigDecimal totalHours = timeLogRepository.sumHoursByProjectId(projectId);

        List<ProjectTask> tasks = taskRepository.findByProjectIdAndIsActiveTrue(projectId);
        BigDecimal totalEstimatedHours = tasks.stream()
                .map(ProjectTask::getEstimatedHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> tableData = tasks.stream()
                .filter(t -> t.getEstimatedHours() != null || (t.getActualHours() != null && t.getActualHours().compareTo(BigDecimal.ZERO) > 0))
                .map(task -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("taskName", task.getName());
                    row.put("assignee", task.getAssignee() != null ? task.getAssignee().getFullName() : "Unassigned");
                    row.put("estimatedHours", task.getEstimatedHours());
                    row.put("actualHours", task.getActualHours());
                    row.put("status", task.getStatus().name());
                    return row;
                }).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("totalEstimatedHours", totalEstimatedHours);
        summary.put("totalActualHours", totalHours);
        summary.put("variance", totalEstimatedHours.subtract(totalHours));

        return ProjectReportDTO.builder()
                .reportType("TIME_REPORT")
                .reportTitle("Time Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getMilestoneReport(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        List<ProjectMilestone> milestones = milestoneRepository.findByProjectIdOrderBySortOrder(projectId);

        List<Map<String, Object>> tableData = milestones.stream().map(m -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", m.getName());
            row.put("status", m.getStatus().name());
            row.put("dueDate", m.getDueDate());
            row.put("completedDate", m.getCompletedDate());
            row.put("owner", m.getOwner() != null ? m.getOwner().getFullName() : "Unassigned");
            row.put("isCritical", m.getIsCritical());
            boolean isOverdue = m.getDueDate() != null && m.getDueDate().isBefore(LocalDate.now())
                    && m.getStatus() != ProjectMilestone.MilestoneStatus.COMPLETED;
            row.put("isOverdue", isOverdue);
            return row;
        }).collect(Collectors.toList());

        long completed = milestones.stream().filter(m -> m.getStatus() == ProjectMilestone.MilestoneStatus.COMPLETED).count();
        long overdue = milestones.stream()
                .filter(m -> m.getDueDate() != null && m.getDueDate().isBefore(LocalDate.now())
                        && m.getStatus() != ProjectMilestone.MilestoneStatus.COMPLETED)
                .count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("projectName", project.getName());
        summary.put("totalMilestones", milestones.size());
        summary.put("completedMilestones", completed);
        summary.put("overdueMilestones", overdue);

        return ProjectReportDTO.builder()
                .reportType("MILESTONE_REPORT")
                .reportTitle("Milestone Report - " + project.getName())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectReportDTO getPortfolioReport() {
        List<Project> projects = projectRepository.findByIsActiveTrueOrderByCreatedAtDesc();

        List<Map<String, Object>> tableData = projects.stream().map(p -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", p.getCode());
            row.put("name", p.getName());
            row.put("status", p.getStatus().name());
            row.put("stage", p.getStage().name());
            row.put("priority", p.getPriority().name());
            row.put("manager", p.getManager() != null ? p.getManager().getFullName() : "Unassigned");
            row.put("completion", p.getCompletionPercentage());
            row.put("budget", p.getEstimatedBudget());
            row.put("actualCost", p.getActualCost());
            row.put("startDate", p.getStartDate());
            row.put("endDate", p.getEndDate());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalProjects", projects.size());

        Map<String, Long> byStatus = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));
        summary.put("projectsByStatus", byStatus);

        BigDecimal totalBudget = projects.stream()
                .map(Project::getEstimatedBudget).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = projects.stream()
                .map(Project::getActualCost).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("totalBudget", totalBudget);
        summary.put("totalActualCost", totalCost);

        return ProjectReportDTO.builder()
                .reportType("PORTFOLIO_REPORT")
                .reportTitle("Portfolio Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .tableData(tableData)
                .build();
    }
}
