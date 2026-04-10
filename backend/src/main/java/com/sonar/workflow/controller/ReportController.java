package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.ReportResultDTO;
import com.sonar.workflow.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/definitions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReportDefinitions() {
        List<Map<String, Object>> definitions = getAvailableReports();
        return ResponseEntity.ok(ApiResponse.success(definitions));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResultDTO>> generateReport(
            @PathVariable String reportId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String approvedStartDate,
            @RequestParam(required = false) String approvedEndDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String corporateId,
            @RequestParam(required = false) String sbuId,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String groupBy,
            @RequestParam(required = false) String leaveTypeId,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String priority) {

        Map<String, String> parameters = new HashMap<>();
        if (startDate != null) parameters.put("startDate", startDate);
        if (endDate != null) parameters.put("endDate", endDate);
        if (approvedStartDate != null) parameters.put("approvedStartDate", approvedStartDate);
        if (approvedEndDate != null) parameters.put("approvedEndDate", approvedEndDate);
        if (status != null) parameters.put("status", status);
        if (workflowId != null) parameters.put("workflowId", workflowId);
        if (userId != null) parameters.put("userId", userId);
        if (corporateId != null) parameters.put("corporateId", corporateId);
        if (sbuId != null) parameters.put("sbuId", sbuId);
        if (branchId != null) parameters.put("branchId", branchId);
        if (departmentId != null) parameters.put("departmentId", departmentId);
        if (groupBy != null) parameters.put("groupBy", groupBy);
        if (leaveTypeId != null) parameters.put("leaveTypeId", leaveTypeId);
        if (year != null) parameters.put("year", year);
        if (categoryId != null) parameters.put("categoryId", categoryId);
        if (priority != null) parameters.put("priority", priority);

        ReportResultDTO result = reportService.generateReport(reportId, parameters);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private List<Map<String, Object>> getAvailableReports() {
        return List.of(
            // Workflow Reports
            createReportDef("submission-summary", "Submission Summary", "All submissions with status, workflow, user, SBU, branch, department breakdown and date filtering", "workflow", "summarize"),
            createReportDef("approval-tracker", "Approval Tracker", "Track approval progress, response times, pending aging, escalations, bottlenecks, and approver workload", "workflow", "thumb_up"),
            createReportDef("performance-metrics", "Performance Metrics", "Processing times, SLA compliance, turnaround times, throughput, and workflow efficiency", "workflow", "speed"),
            createReportDef("user-activity", "User Activity", "User submissions, approvals, login history, productivity. Top submitters, top approvers, inactive users", "workflow", "people"),
            createReportDef("organization-overview", "Organization Overview", "Submissions and performance by corporate, SBU, branch, and department", "workflow", "corporate_fare"),
            createReportDef("financial-summary", "Financial Summary", "Amounts by status, workflow, approver. High-value submissions and approval limits utilization", "workflow", "attach_money"),
            createReportDef("audit-compliance", "Audit & Compliance", "Full audit trail, overdue approvals, data changes, access logs, and compliance tracking", "workflow", "verified_user"),
            createReportDef("trends-analytics", "Trends & Analytics", "Monthly and yearly trends, growth analysis, seasonal patterns, and volume forecasting", "workflow", "trending_up"),
            // Leave Reports
            createReportDef("leave-balances", "Leave Balances", "Employee leave balances with entitled, used, pending, and available days by leave type and department", "leave", "account_balance"),
            createReportDef("leave-taken", "Leave Taken", "Approved leave requests with employee, leave type, dates, duration, and approver details", "leave", "event_available"),
            createReportDef("leave-running", "Running Applications", "Currently pending leave requests with approval level, current approver, waiting time, and reminders sent", "leave", "pending_actions"),
            createReportDef("leave-approval-delays", "Approval Delays", "Leave approval turnaround times, delays over 24 hours, and approver response metrics", "leave", "schedule"),
            createReportDef("leave-escalated", "Escalated Applications", "Leave requests that were escalated due to approval timeout, with escalation details and resolution status", "leave", "priority_high"),
            // Deadline Reports
            createReportDef("deadline-status-overview", "Status Overview", "All deadline instances with status, priority, category, due date, owner, and days to due. Filter by date range, category, priority, status.", "deadline", "event_busy"),
            createReportDef("deadline-overdue", "Overdue Deadlines", "All currently overdue deadlines with days overdue, priority, owner, SBU, and reminders sent. Filter by category, priority.", "deadline", "warning"),
            createReportDef("deadline-compliance", "Compliance Rates", "Completion and compliance rates grouped by deadline item with total, completed, overdue counts and average completion time. Filter by date range, category.", "deadline", "verified"),
            createReportDef("deadline-reminders", "Reminder Audit", "All reminders sent with success/failure status, recipient, type, deadline info. Filter by date range, category.", "deadline", "notifications"),
            // Project Reports
            createReportDef("project-status", "Project Status", "All projects with status, stage, priority, manager, category, budget vs actual cost, and completion", "project", "assignment"),
            createReportDef("project-budget", "Budget & Cost", "Project budgets, actual costs, variances, and cost breakdown by budget line category", "project", "account_balance"),
            createReportDef("project-tasks", "Task Tracker", "All tasks across projects with status, priority, assignee, completion, and overdue analysis", "project", "checklist"),
            createReportDef("project-milestones", "Milestone Tracker", "Milestones across projects with due dates, completion status, and critical path", "project", "flag"),
            createReportDef("project-risks-issues", "Risks & Issues", "All risks and issues across projects with probability, impact, status, and mitigation plans", "project", "warning"),
            createReportDef("project-team", "Team & Resources", "Team members across projects with roles, workload, and allocation", "project", "groups")
        );
    }

    private Map<String, Object> createReportDef(String id, String name, String description, String category, String icon) {
        Map<String, Object> report = new HashMap<>();
        report.put("id", id);
        report.put("name", name);
        report.put("description", description);
        report.put("category", category);
        report.put("icon", icon);
        return report;
    }
}
