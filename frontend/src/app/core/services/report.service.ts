import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  parameters?: ReportParameter[];
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'daterange' | 'select' | 'multiselect' | 'text' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ReportResult {
  columns: ReportColumn[];
  data: any[];
  summary?: Record<string, any>;
  generatedAt: string;
  parameters?: Record<string, any>;
}

export interface ReportColumn {
  field: string;
  header: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'currency' | 'percentage' | 'status';
  width?: number;
  align?: 'left' | 'center' | 'right';
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getReportDefinitions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/definitions`);
  }

  generateReport(reportId: string, parameters?: Record<string, any>): Observable<any> {
    let params = new HttpParams();
    if (parameters) {
      Object.keys(parameters).forEach(key => {
        if (parameters[key] !== null && parameters[key] !== undefined) {
          params = params.set(key, parameters[key]);
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/${reportId}`, { params });
  }

  exportReport(reportId: string, format: 'excel' | 'pdf' | 'csv', parameters?: Record<string, any>): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (parameters) {
      Object.keys(parameters).forEach(key => {
        if (parameters[key] !== null && parameters[key] !== undefined) {
          params = params.set(key, parameters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/${reportId}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Report categories for UI organization
  getReportCategories(): { id: string; name: string; icon: string; description: string }[] {
    return [
      { id: 'submissions', name: 'Submission Reports', icon: 'send', description: 'Reports on workflow submissions and their status' },
      { id: 'approvals', name: 'Approval Reports', icon: 'thumb_up', description: 'Reports on approval activities and performance' },
      { id: 'performance', name: 'Performance Reports', icon: 'speed', description: 'Processing times and efficiency metrics' },
      { id: 'users', name: 'User Reports', icon: 'people', description: 'User activity and productivity reports' },
      { id: 'workflows', name: 'Workflow Reports', icon: 'account_tree', description: 'Workflow usage and configuration reports' },
      { id: 'organization', name: 'Organization Reports', icon: 'corporate_fare', description: 'Reports by corporate structure' },
      { id: 'compliance', name: 'Compliance & Audit', icon: 'verified_user', description: 'Compliance tracking and audit reports' },
      { id: 'trends', name: 'Trends & Analytics', icon: 'trending_up', description: 'Historical trends and forecasting' },
      { id: 'financial', name: 'Financial Reports', icon: 'attach_money', description: 'Amount-based and financial analysis' },
      { id: 'executive', name: 'Executive Summary', icon: 'dashboard', description: 'High-level executive dashboards' }
    ];
  }

  // All 50+ report definitions
  getAllReports(): ReportDefinition[] {
    return [
      // SUBMISSION REPORTS (10)
      { id: 'submissions-by-status', name: 'Submissions by Status', description: 'Total submissions grouped by their current status', category: 'submissions', icon: 'pie_chart' },
      { id: 'submissions-by-workflow', name: 'Submissions by Workflow', description: 'Distribution of submissions across all workflows', category: 'submissions', icon: 'donut_large' },
      { id: 'submissions-by-date', name: 'Daily Submissions', description: 'Submissions count by date for a selected period', category: 'submissions', icon: 'calendar_today' },
      { id: 'submissions-by-user', name: 'Submissions by User', description: 'Number of submissions made by each user', category: 'submissions', icon: 'person' },
      { id: 'submissions-by-sbu', name: 'Submissions by SBU', description: 'Submissions grouped by Strategic Business Unit', category: 'submissions', icon: 'business' },
      { id: 'submissions-by-branch', name: 'Submissions by Branch', description: 'Submissions distributed across branches', category: 'submissions', icon: 'store' },
      { id: 'submissions-by-department', name: 'Submissions by Department', description: 'Submissions grouped by department', category: 'submissions', icon: 'account_tree' },
      { id: 'pending-submissions', name: 'Pending Submissions', description: 'All submissions currently awaiting approval', category: 'submissions', icon: 'hourglass_empty' },
      { id: 'rejected-submissions', name: 'Rejected Submissions', description: 'All rejected submissions with rejection reasons', category: 'submissions', icon: 'cancel' },
      { id: 'draft-submissions', name: 'Draft Submissions', description: 'Incomplete submissions saved as drafts', category: 'submissions', icon: 'drafts' },

      // APPROVAL REPORTS (10)
      { id: 'approvals-by-approver', name: 'Approvals by Approver', description: 'Number of approvals processed by each approver', category: 'approvals', icon: 'person_outline' },
      { id: 'approval-response-time', name: 'Approval Response Time', description: 'Average time taken by approvers to respond', category: 'approvals', icon: 'timer' },
      { id: 'pending-approvals-aging', name: 'Pending Approvals Aging', description: 'Pending approvals categorized by waiting time', category: 'approvals', icon: 'access_time' },
      { id: 'escalated-approvals', name: 'Escalated Approvals', description: 'List of approvals that were escalated', category: 'approvals', icon: 'trending_up' },
      { id: 'approval-by-level', name: 'Approvals by Level', description: 'Approval statistics for each approval level', category: 'approvals', icon: 'layers' },
      { id: 'rejection-analysis', name: 'Rejection Analysis', description: 'Analysis of rejection patterns and reasons', category: 'approvals', icon: 'pie_chart' },
      { id: 'approver-workload', name: 'Approver Workload', description: 'Current workload distribution among approvers', category: 'approvals', icon: 'work' },
      { id: 'approval-bottlenecks', name: 'Approval Bottlenecks', description: 'Identify where approvals are getting delayed', category: 'approvals', icon: 'report_problem' },
      { id: 'auto-escalation-report', name: 'Auto-Escalation Report', description: 'Submissions auto-escalated due to timeout', category: 'approvals', icon: 'schedule' },
      { id: 'delegation-report', name: 'Delegation Report', description: 'Approvals handled through delegation', category: 'approvals', icon: 'swap_horiz' },

      // PERFORMANCE REPORTS (8)
      { id: 'average-processing-time', name: 'Average Processing Time', description: 'Average time from submission to completion', category: 'performance', icon: 'speed' },
      { id: 'processing-time-by-workflow', name: 'Processing Time by Workflow', description: 'Average processing time for each workflow', category: 'performance', icon: 'timeline' },
      { id: 'sla-compliance', name: 'SLA Compliance', description: 'Submissions meeting SLA requirements', category: 'performance', icon: 'verified' },
      { id: 'turnaround-time', name: 'Turnaround Time Report', description: 'End-to-end turnaround time analysis', category: 'performance', icon: 'update' },
      { id: 'workflow-efficiency', name: 'Workflow Efficiency', description: 'Efficiency metrics for each workflow', category: 'performance', icon: 'insights' },
      { id: 'peak-hours-analysis', name: 'Peak Hours Analysis', description: 'Submission patterns by hour of day', category: 'performance', icon: 'schedule' },
      { id: 'throughput-report', name: 'Throughput Report', description: 'Number of submissions processed over time', category: 'performance', icon: 'show_chart' },
      { id: 'cycle-time-analysis', name: 'Cycle Time Analysis', description: 'Time spent at each approval stage', category: 'performance', icon: 'loop' },

      // USER REPORTS (7)
      { id: 'user-activity-summary', name: 'User Activity Summary', description: 'Overall activity summary for each user', category: 'users', icon: 'summarize' },
      { id: 'top-submitters', name: 'Top Submitters', description: 'Users with highest submission counts', category: 'users', icon: 'emoji_events' },
      { id: 'top-approvers', name: 'Top Approvers', description: 'Most active approvers in the system', category: 'users', icon: 'military_tech' },
      { id: 'user-login-history', name: 'User Login History', description: 'Login activity and patterns for users', category: 'users', icon: 'login' },
      { id: 'inactive-users', name: 'Inactive Users', description: 'Users with no recent activity', category: 'users', icon: 'person_off' },
      { id: 'user-productivity', name: 'User Productivity', description: 'Productivity metrics per user', category: 'users', icon: 'trending_up' },
      { id: 'new-users-report', name: 'New Users Report', description: 'Recently added users and their onboarding status', category: 'users', icon: 'person_add' },

      // WORKFLOW REPORTS (6)
      { id: 'workflow-usage', name: 'Workflow Usage Statistics', description: 'Usage frequency and patterns for each workflow', category: 'workflows', icon: 'bar_chart' },
      { id: 'most-used-workflows', name: 'Most Used Workflows', description: 'Ranking of workflows by usage', category: 'workflows', icon: 'leaderboard' },
      { id: 'workflow-completion-rate', name: 'Workflow Completion Rate', description: 'Success rate for each workflow type', category: 'workflows', icon: 'check_circle' },
      { id: 'workflow-configuration', name: 'Workflow Configuration', description: 'Current configuration of all workflows', category: 'workflows', icon: 'settings' },
      { id: 'workflow-approvers', name: 'Workflow Approvers Matrix', description: 'Approvers configured for each workflow', category: 'workflows', icon: 'grid_on' },
      { id: 'workflow-fields-usage', name: 'Workflow Fields Usage', description: 'Field utilization across workflows', category: 'workflows', icon: 'list_alt' },

      // ORGANIZATION REPORTS (6)
      { id: 'corporate-summary', name: 'Corporate Summary', description: 'Submissions summary by corporate entity', category: 'organization', icon: 'corporate_fare' },
      { id: 'sbu-performance', name: 'SBU Performance', description: 'Performance comparison across SBUs', category: 'organization', icon: 'business' },
      { id: 'branch-activity', name: 'Branch Activity Report', description: 'Activity levels across all branches', category: 'organization', icon: 'store' },
      { id: 'department-workload', name: 'Department Workload', description: 'Workload distribution by department', category: 'organization', icon: 'account_tree' },
      { id: 'cross-department', name: 'Cross-Department Workflows', description: 'Workflows spanning multiple departments', category: 'organization', icon: 'swap_calls' },
      { id: 'hierarchy-report', name: 'Organization Hierarchy', description: 'Complete organizational structure view', category: 'organization', icon: 'account_tree' },

      // COMPLIANCE & AUDIT REPORTS (6)
      { id: 'audit-trail', name: 'Audit Trail Report', description: 'Complete audit trail for all actions', category: 'compliance', icon: 'history' },
      { id: 'compliance-status', name: 'Compliance Status', description: 'Overall compliance status dashboard', category: 'compliance', icon: 'verified_user' },
      { id: 'overdue-approvals', name: 'Overdue Approvals', description: 'Approvals that exceeded their time limit', category: 'compliance', icon: 'warning' },
      { id: 'policy-violations', name: 'Policy Violations', description: 'Instances of policy non-compliance', category: 'compliance', icon: 'gavel' },
      { id: 'access-log', name: 'Access Log Report', description: 'User access and permission changes', category: 'compliance', icon: 'security' },
      { id: 'data-changes', name: 'Data Changes Report', description: 'All data modifications in the system', category: 'compliance', icon: 'edit_note' },

      // TRENDS & ANALYTICS (5)
      { id: 'monthly-trends', name: 'Monthly Trends', description: 'Month-over-month submission trends', category: 'trends', icon: 'show_chart' },
      { id: 'yearly-comparison', name: 'Yearly Comparison', description: 'Year-over-year performance comparison', category: 'trends', icon: 'compare' },
      { id: 'growth-analysis', name: 'Growth Analysis', description: 'System usage growth over time', category: 'trends', icon: 'trending_up' },
      { id: 'seasonal-patterns', name: 'Seasonal Patterns', description: 'Identify seasonal submission patterns', category: 'trends', icon: 'wb_sunny' },
      { id: 'forecast-report', name: 'Forecast Report', description: 'Projected submissions based on trends', category: 'trends', icon: 'insights' },

      // FINANCIAL REPORTS (5)
      { id: 'amount-by-status', name: 'Amount by Status', description: 'Total amounts grouped by submission status', category: 'financial', icon: 'account_balance' },
      { id: 'amount-by-workflow', name: 'Amount by Workflow', description: 'Financial distribution across workflows', category: 'financial', icon: 'attach_money' },
      { id: 'amount-by-approver', name: 'Amount by Approver', description: 'Amounts processed by each approver', category: 'financial', icon: 'payments' },
      { id: 'high-value-submissions', name: 'High Value Submissions', description: 'Submissions exceeding threshold amounts', category: 'financial', icon: 'monetization_on' },
      { id: 'approval-limits-usage', name: 'Approval Limits Usage', description: 'How approval limits are being utilized', category: 'financial', icon: 'credit_score' },

      // EXECUTIVE SUMMARY (4)
      { id: 'executive-dashboard', name: 'Executive Dashboard', description: 'High-level KPIs and metrics overview', category: 'executive', icon: 'dashboard' },
      { id: 'kpi-summary', name: 'KPI Summary Report', description: 'Key Performance Indicators summary', category: 'executive', icon: 'assessment' },
      { id: 'management-report', name: 'Management Report', description: 'Comprehensive management overview', category: 'executive', icon: 'summarize' },
      { id: 'system-health', name: 'System Health Report', description: 'Overall system health and usage metrics', category: 'executive', icon: 'health_and_safety' }
    ];
  }
}
