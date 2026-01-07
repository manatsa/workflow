package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.ReportResultDTO;
import com.sonarworks.workflow.service.ReportService;
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
            @RequestParam(required = false) String groupBy) {

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

        ReportResultDTO result = reportService.generateReport(reportId, parameters);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private List<Map<String, Object>> getAvailableReports() {
        return List.of(
            // Submission Reports
            createReportDef("submissions-by-status", "Submissions by Status", "Total submissions grouped by their current status", "submissions", "pie_chart"),
            createReportDef("submissions-by-workflow", "Submissions by Workflow", "Distribution of submissions across all workflows", "submissions", "donut_large"),
            createReportDef("submissions-by-date", "Daily Submissions", "Submissions count by date for a selected period", "submissions", "calendar_today"),
            createReportDef("submissions-by-user", "Submissions by User", "Number of submissions made by each user", "submissions", "person"),
            createReportDef("submissions-by-sbu", "Submissions by SBU", "Submissions grouped by Strategic Business Unit", "submissions", "business"),
            createReportDef("submissions-by-branch", "Submissions by Branch", "Submissions distributed across branches", "submissions", "store"),
            createReportDef("submissions-by-department", "Submissions by Department", "Submissions grouped by department", "submissions", "account_tree"),
            createReportDef("pending-submissions", "Pending Submissions", "All submissions currently awaiting approval", "submissions", "hourglass_empty"),
            createReportDef("rejected-submissions", "Rejected Submissions", "All rejected submissions with rejection reasons", "submissions", "cancel"),
            createReportDef("draft-submissions", "Draft Submissions", "Incomplete submissions saved as drafts", "submissions", "drafts"),

            // Approval Reports
            createReportDef("approvals-by-approver", "Approvals by Approver", "Number of approvals processed by each approver", "approvals", "person_outline"),
            createReportDef("approval-response-time", "Approval Response Time", "Average time taken by approvers to respond", "approvals", "timer"),
            createReportDef("pending-approvals-aging", "Pending Approvals Aging", "Pending approvals categorized by waiting time", "approvals", "access_time"),
            createReportDef("escalated-approvals", "Escalated Approvals", "List of approvals that were escalated", "approvals", "trending_up"),
            createReportDef("approval-by-level", "Approvals by Level", "Approval statistics for each approval level", "approvals", "layers"),
            createReportDef("rejection-analysis", "Rejection Analysis", "Analysis of rejection patterns and reasons", "approvals", "pie_chart"),
            createReportDef("approver-workload", "Approver Workload", "Current workload distribution among approvers", "approvals", "work"),
            createReportDef("approval-bottlenecks", "Approval Bottlenecks", "Identify where approvals are getting delayed", "approvals", "report_problem"),
            createReportDef("auto-escalation-report", "Auto-Escalation Report", "Submissions auto-escalated due to timeout", "approvals", "schedule"),
            createReportDef("delegation-report", "Delegation Report", "Approvals handled through delegation", "approvals", "swap_horiz"),

            // Performance Reports
            createReportDef("average-processing-time", "Average Processing Time", "Average time from submission to completion", "performance", "speed"),
            createReportDef("processing-time-by-workflow", "Processing Time by Workflow", "Average processing time for each workflow", "performance", "timeline"),
            createReportDef("sla-compliance", "SLA Compliance", "Submissions meeting SLA requirements", "performance", "verified"),
            createReportDef("turnaround-time", "Turnaround Time Report", "End-to-end turnaround time analysis", "performance", "update"),
            createReportDef("workflow-efficiency", "Workflow Efficiency", "Efficiency metrics for each workflow", "performance", "insights"),
            createReportDef("peak-hours-analysis", "Peak Hours Analysis", "Submission patterns by hour of day", "performance", "schedule"),
            createReportDef("throughput-report", "Throughput Report", "Number of submissions processed over time", "performance", "show_chart"),
            createReportDef("cycle-time-analysis", "Cycle Time Analysis", "Time spent at each approval stage", "performance", "loop"),

            // User Reports
            createReportDef("user-activity-summary", "User Activity Summary", "Overall activity summary for each user", "users", "summarize"),
            createReportDef("top-submitters", "Top Submitters", "Users with highest submission counts", "users", "emoji_events"),
            createReportDef("top-approvers", "Top Approvers", "Most active approvers in the system", "users", "military_tech"),
            createReportDef("user-login-history", "User Login History", "Login activity and patterns for users", "users", "login"),
            createReportDef("inactive-users", "Inactive Users", "Users with no recent activity", "users", "person_off"),
            createReportDef("user-productivity", "User Productivity", "Productivity metrics per user", "users", "trending_up"),
            createReportDef("new-users-report", "New Users Report", "Recently added users and their onboarding status", "users", "person_add"),

            // Workflow Reports
            createReportDef("workflow-usage", "Workflow Usage Statistics", "Usage frequency and patterns for each workflow", "workflows", "bar_chart"),
            createReportDef("most-used-workflows", "Most Used Workflows", "Ranking of workflows by usage", "workflows", "leaderboard"),
            createReportDef("workflow-completion-rate", "Workflow Completion Rate", "Success rate for each workflow type", "workflows", "check_circle"),
            createReportDef("workflow-configuration", "Workflow Configuration", "Current configuration of all workflows", "workflows", "settings"),
            createReportDef("workflow-approvers", "Workflow Approvers Matrix", "Approvers configured for each workflow", "workflows", "grid_on"),
            createReportDef("workflow-fields-usage", "Workflow Fields Usage", "Field utilization across workflows", "workflows", "list_alt"),

            // Organization Reports
            createReportDef("corporate-summary", "Corporate Summary", "Submissions summary by corporate entity", "organization", "corporate_fare"),
            createReportDef("sbu-performance", "SBU Performance", "Performance comparison across SBUs", "organization", "business"),
            createReportDef("branch-activity", "Branch Activity Report", "Activity levels across all branches", "organization", "store"),
            createReportDef("department-workload", "Department Workload", "Workload distribution by department", "organization", "account_tree"),
            createReportDef("cross-department", "Cross-Department Workflows", "Workflows spanning multiple departments", "organization", "swap_calls"),
            createReportDef("hierarchy-report", "Organization Hierarchy", "Complete organizational structure view", "organization", "account_tree"),

            // Compliance Reports
            createReportDef("audit-trail", "Audit Trail Report", "Complete audit trail for all actions", "compliance", "history"),
            createReportDef("compliance-status", "Compliance Status", "Overall compliance status dashboard", "compliance", "verified_user"),
            createReportDef("overdue-approvals", "Overdue Approvals", "Approvals that exceeded their time limit", "compliance", "warning"),
            createReportDef("policy-violations", "Policy Violations", "Instances of policy non-compliance", "compliance", "gavel"),
            createReportDef("access-log", "Access Log Report", "User access and permission changes", "compliance", "security"),
            createReportDef("data-changes", "Data Changes Report", "All data modifications in the system", "compliance", "edit_note"),

            // Trends Reports
            createReportDef("monthly-trends", "Monthly Trends", "Month-over-month submission trends", "trends", "show_chart"),
            createReportDef("yearly-comparison", "Yearly Comparison", "Year-over-year performance comparison", "trends", "compare"),
            createReportDef("growth-analysis", "Growth Analysis", "System usage growth over time", "trends", "trending_up"),
            createReportDef("seasonal-patterns", "Seasonal Patterns", "Identify seasonal submission patterns", "trends", "wb_sunny"),
            createReportDef("forecast-report", "Forecast Report", "Projected submissions based on trends", "trends", "insights"),

            // Financial Reports
            createReportDef("amount-by-status", "Amount by Status", "Total amounts grouped by submission status", "financial", "account_balance"),
            createReportDef("amount-by-workflow", "Amount by Workflow", "Financial distribution across workflows", "financial", "attach_money"),
            createReportDef("amount-by-approver", "Amount by Approver", "Amounts processed by each approver", "financial", "payments"),
            createReportDef("high-value-submissions", "High Value Submissions", "Submissions exceeding threshold amounts", "financial", "monetization_on"),
            createReportDef("approval-limits-usage", "Approval Limits Usage", "How approval limits are being utilized", "financial", "credit_score"),

            // Executive Reports
            createReportDef("executive-dashboard", "Executive Dashboard", "High-level KPIs and metrics overview", "executive", "dashboard"),
            createReportDef("kpi-summary", "KPI Summary Report", "Key Performance Indicators summary", "executive", "assessment"),
            createReportDef("management-report", "Management Report", "Comprehensive management overview", "executive", "summarize"),
            createReportDef("system-health", "System Health Report", "Overall system health and usage metrics", "executive", "health_and_safety")
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
