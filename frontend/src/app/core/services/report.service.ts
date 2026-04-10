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
      { id: 'workflow', name: 'Workflow Reports', icon: 'assessment', description: 'Comprehensive workflow submission, approval, and performance reports' },
      { id: 'project', name: 'Project Reports', icon: 'folder_special', description: 'Project tracking, budget, task, risk, and milestone reports' },
      { id: 'leave', name: 'Leave Reports', icon: 'beach_access', description: 'Leave balances, utilization, approvals, and escalation reports' },
      { id: 'deadline', name: 'Deadline Reports', icon: 'event_busy', description: 'Deadline tracking, overdue analysis, compliance rates, and reminder audit' }
    ];
  }

  getAllReports(): ReportDefinition[] {
    return [
      // Workflow Reports (8)
      { id: 'submission-summary', name: 'Submission Summary', description: 'All submissions with status, workflow, user, SBU, branch, department breakdown and date filtering. Group by status, workflow, user, SBU, or date period.', category: 'workflow', icon: 'summarize' },
      { id: 'approval-tracker', name: 'Approval Tracker', description: 'Track approval progress, response times, pending aging, escalations, bottlenecks, and approver workload across all approval levels.', category: 'workflow', icon: 'thumb_up' },
      { id: 'performance-metrics', name: 'Performance Metrics', description: 'Processing times, SLA compliance, turnaround times, throughput, cycle time analysis, and workflow efficiency per period.', category: 'workflow', icon: 'speed' },
      { id: 'user-activity', name: 'User Activity', description: 'User submissions, approvals, login history, productivity metrics. Identify top submitters, top approvers, and inactive users.', category: 'workflow', icon: 'people' },
      { id: 'organization-overview', name: 'Organization Overview', description: 'Submissions and performance grouped by corporate, SBU, branch, and department. Cross-department workflow analysis.', category: 'workflow', icon: 'corporate_fare' },
      { id: 'financial-summary', name: 'Financial Summary', description: 'Amounts by status, workflow, approver, and period. High-value submissions and approval limits utilization.', category: 'workflow', icon: 'attach_money' },
      { id: 'audit-compliance', name: 'Audit & Compliance', description: 'Full audit trail, overdue approvals, data changes, access logs, and compliance tracking with detailed action history.', category: 'workflow', icon: 'verified_user' },
      { id: 'trends-analytics', name: 'Trends & Analytics', description: 'Monthly and yearly trends, growth analysis, seasonal patterns, and volume forecasting across all workflows.', category: 'workflow', icon: 'trending_up' },

      // Project Reports (6)
      { id: 'project-status', name: 'Project Status', description: 'All projects with status, stage, priority, manager, category, SBU, budget vs actual cost, and completion. Filter by status, stage, priority, category, manager, date range.', category: 'project', icon: 'assignment' },
      { id: 'project-budget', name: 'Budget & Cost', description: 'Project budgets, actual costs, variances, and cost breakdown by budget line category. Filter by project, category, SBU, date range, over/under budget.', category: 'project', icon: 'account_balance' },
      { id: 'project-tasks', name: 'Task Tracker', description: 'All tasks across projects with status, priority, assignee, completion, and overdue analysis. Filter by project, assignee, status, priority, date range.', category: 'project', icon: 'checklist' },
      { id: 'project-milestones', name: 'Milestone Tracker', description: 'Milestones across projects with due dates, completion status, and critical path. Filter by project, status, date range, critical only.', category: 'project', icon: 'flag' },
      { id: 'project-risks-issues', name: 'Risks & Issues', description: 'All risks and issues across projects with probability, impact, severity, status, and mitigation plans. Filter by project, type, status, priority, category.', category: 'project', icon: 'warning' },
      { id: 'project-team', name: 'Team & Resources', description: 'Team members across projects with roles, workload, and allocation. Filter by project, role, member, SBU.', category: 'project', icon: 'groups' },

      // Leave Reports (5)
      { id: 'leave-balances', name: 'Leave Balances', description: 'Employee leave balances with entitled, carried over, used, pending, and available days. Filter by year, department, leave type.', category: 'leave', icon: 'account_balance' },
      { id: 'leave-taken', name: 'Leave Taken', description: 'Approved leave requests with employee, leave type, dates, duration, and approver. Filter by date range, department, leave type, status.', category: 'leave', icon: 'event_available' },
      { id: 'leave-running', name: 'Running Applications', description: 'Currently pending leave requests with approval level, current approver, waiting time, and reminders sent. Filter by department, leave type.', category: 'leave', icon: 'pending_actions' },
      { id: 'leave-approval-delays', name: 'Approval Delays', description: 'Leave approval turnaround times and delays. Shows hours to decision, reminders sent, and delay rate. Filter by date range, department.', category: 'leave', icon: 'schedule' },
      { id: 'leave-escalated', name: 'Escalated Applications', description: 'Leave requests that were escalated due to approval timeout. Shows escalation time, reminders, and resolution status. Filter by date range, department.', category: 'leave', icon: 'priority_high' },

      // Deadline Reports (4)
      { id: 'deadline-status-overview', name: 'Status Overview', description: 'All deadline instances with status, priority, category, due date, owner, and days to due. Filter by date range, category, priority, status.', category: 'deadline', icon: 'event_busy' },
      { id: 'deadline-overdue', name: 'Overdue Deadlines', description: 'All currently overdue deadlines with days overdue, priority, owner, SBU, and reminders sent. Filter by category, priority.', category: 'deadline', icon: 'warning' },
      { id: 'deadline-compliance', name: 'Compliance Rates', description: 'Completion and compliance rates per deadline with totals, overdue counts, and average completion time. Filter by date range, category.', category: 'deadline', icon: 'verified' },
      { id: 'deadline-reminders', name: 'Reminder Audit', description: 'All reminders sent with success/failure status, recipient, type, and deadline info. Filter by date range, category.', category: 'deadline', icon: 'notifications' }
    ];
  }
}
