import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProjectService, ProjectDTO, ProjectReportService, ProjectReportDTO } from '../services/project.service';

@Component({
  selector: 'app-project-reports',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule, MatProgressBarModule, MatSnackBarModule, MatDividerModule,
    MatTooltipModule],
  template: `
    <div class="reports-container" *ngIf="project">
      <div class="page-header">
        <button mat-icon-button matTooltip="Go Back" routerLink="/projects/{{project.id}}">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Reports - {{ project.name }}</h2>
      </div>

      <!-- Report Type Buttons -->
      <div class="report-buttons">
        @for (rt of reportTypes; track rt.key) {
          <button mat-raised-button matTooltip="{{ rt.label }}"
                  [color]="selectedReport === rt.key ? 'primary' : ''"
                  (click)="generateReport(rt.key)">
            <mat-icon>{{ rt.icon }}</mat-icon>
            {{ rt.label }}
          </button>
        }
      </div>

      <mat-progress-bar *ngIf="generating" mode="indeterminate"></mat-progress-bar>

      <!-- Report Content -->
      @if (report) {
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>{{ report.reportTitle }}</mat-card-title>
            <mat-card-subtitle>Generated: {{ report.generatedAt | date:'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <!-- Summary Cards -->
            @if (report.summary && getSummaryEntries().length > 0) {
              <div class="summary-cards">
                @for (entry of getSimpleSummaryEntries(); track entry[0]) {
                  <div class="summary-card" [style.border-left]="'4px solid ' + getSummaryColor(entry[0], entry[1])">
                    <span class="summary-label">{{ formatLabel(entry[0]) }}</span>
                    <span class="summary-value" [style.color]="getSummaryColor(entry[0], entry[1])">{{ formatSummaryValue(entry[0], entry[1]) }}</span>
                  </div>
                }
              </div>

              @if (getMapSummaryEntries().length > 0) {
                <div class="distribution-section">
                  @for (entry of getMapSummaryEntries(); track entry[0]) {
                    <div class="distribution-card">
                      <h4>{{ formatLabel(entry[0]) }}</h4>
                      <div class="distribution-bars">
                        @for (item of getObjectEntries(entry[1]); track item[0]) {
                          <div class="distribution-row">
                            <span class="dist-label">
                              <span class="dist-dot" [style.background]="getDistColor(entry[0], item[0])"></span>
                              {{ formatLabel(item[0]) }}
                            </span>
                            <div class="dist-bar-track">
                              <div class="dist-bar-fill" [style.width.%]="getDistPercent(entry[1], item[1])" [style.background]="getDistColor(entry[0], item[0])"></div>
                            </div>
                            <span class="dist-value">{{ item[1] }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
              <mat-divider></mat-divider>
            }

            <!-- Data Table -->
            @if (report.tableData && report.tableData.length > 0) {
              <div class="table-container">
                <table mat-table [dataSource]="report.tableData" class="full-width">
                  @for (col of tableColumns; track col) {
                    <ng-container [matColumnDef]="col">
                      <th mat-header-cell *matHeaderCellDef>{{ formatLabel(col) }}</th>
                      <td mat-cell *matCellDef="let row">
                        <span *ngIf="isStatusColumn(col)" class="status-chip" [style.background]="getStatusChipColor(row[col])" [style.color]="'white'">{{ formatCellValue(row[col]) }}</span>
                        <span *ngIf="!isStatusColumn(col)">{{ formatCellValue(row[col]) }}</span>
                      </td>
                    </ng-container>
                  }
                  <tr mat-header-row *matHeaderRowDef="tableColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: tableColumns;"></tr>
                </table>
              </div>
            }

            @if (!report.tableData || report.tableData.length === 0) {
              <div class="empty-state">
                <mat-icon>analytics</mat-icon>
                <p>No data available for this report.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      @if (!report && !generating) {
        <div class="empty-state">
          <mat-icon>assessment</mat-icon>
          <p>Select a report type above to generate.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-container { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; }
    .report-buttons { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .report-card { margin-top: 16px; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; padding: 16px 0; }
    .summary-card { background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; border-left: 4px solid #1976d2; }
    .summary-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; text-transform: uppercase; }
    .summary-value { display: block; font-size: 24px; font-weight: 600; }
    .table-container { margin-top: 16px; overflow-x: auto; }
    .full-width { width: 100%; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .distribution-section { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 16px 0; }
    .distribution-card { background: #f5f5f5; border-radius: 8px; padding: 16px; }
    .distribution-card h4 { margin: 0 0 12px 0; font-size: 14px; color: #333; }
    .distribution-bars { display: flex; flex-direction: column; gap: 8px; }
    .distribution-row { display: flex; align-items: center; gap: 8px; }
    .dist-label { font-size: 12px; color: #555; min-width: 110px; text-transform: capitalize; display: flex; align-items: center; gap: 6px; }
    .dist-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .dist-bar-track { flex: 1; height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden; }
    .dist-bar-fill { height: 100%; border-radius: 5px; transition: width 0.3s; }
    .dist-value { font-size: 13px; font-weight: 600; min-width: 30px; text-align: right; }
    .status-chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
  `]
})
export class ProjectReportsComponent implements OnInit {
  project: ProjectDTO | null = null;
  report: ProjectReportDTO | null = null;
  selectedReport = '';
  generating = false;
  tableColumns: string[] = [];

  reportTypes = [
    { key: 'status', label: 'Status', icon: 'info' },
    { key: 'budget', label: 'Budget', icon: 'account_balance' },
    { key: 'tasks', label: 'Tasks', icon: 'assignment' },
    { key: 'risks', label: 'Risks', icon: 'warning' },
    { key: 'time', label: 'Time', icon: 'schedule' },
    { key: 'milestones', label: 'Milestones', icon: 'flag' },
    { key: 'portfolio', label: 'Portfolio', icon: 'dashboard' }
  ];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private reportService: ProjectReportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectService.getProjectById(id).subscribe(res => {
        if (res.success) this.project = res.data;
      });
    }
  }

  generateReport(type: string) {
    if (!this.project) return;
    this.selectedReport = type;
    this.generating = true;
    this.report = null;

    let obs;
    switch (type) {
      case 'status': obs = this.reportService.getStatusReport(this.project.id); break;
      case 'budget': obs = this.reportService.getBudgetReport(this.project.id); break;
      case 'tasks': obs = this.reportService.getTaskReport(this.project.id); break;
      case 'risks': obs = this.reportService.getRiskReport(this.project.id); break;
      case 'time': obs = this.reportService.getTimeReport(this.project.id); break;
      case 'milestones': obs = this.reportService.getMilestoneReport(this.project.id); break;
      case 'portfolio': obs = this.reportService.getPortfolioReport(); break;
      default: this.generating = false; return;
    }

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.report = res.data;
          if (this.report?.tableData && this.report.tableData.length > 0) {
            this.tableColumns = Object.keys(this.report.tableData[0]);
          } else {
            this.tableColumns = [];
          }
        }
        this.generating = false;
      },
      error: () => {
        this.generating = false;
        this.snackBar.open('Failed to generate report', 'Close', { duration: 3000 });
      }
    });
  }

  getSummaryEntries(): [string, any][] {
    return Object.entries(this.report?.summary || {});
  }

  getSimpleSummaryEntries(): [string, any][] {
    return this.getSummaryEntries().filter(([_, v]) => typeof v !== 'object' || v === null);
  }

  getMapSummaryEntries(): [string, any][] {
    return this.getSummaryEntries().filter(([_, v]) => typeof v === 'object' && v !== null);
  }

  getObjectEntries(obj: any): [string, any][] {
    return Object.entries(obj || {});
  }

  getDistPercent(map: any, value: number): number {
    const values = Object.values(map || {}) as number[];
    const max = Math.max(...values, 1);
    return (value / max) * 100;
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return Object.entries(value).map(([k, v]) => `${this.formatLabel(k)}: ${v}`).join(', ');
    }
    return String(value);
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()).trim();
  }

  formatSummaryValue(key: string, value: any): string {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (key === 'completionPercentage' || key === 'budgetUtilization') return value + '%';
    return String(value ?? '');
  }

  getSummaryColor(key: string, value: any): string {
    const k = key.toLowerCase();
    // Status-based
    if (k === 'status') return this.getProjectStatusColor(String(value));
    if (k === 'stage') return '#7b1fa2';
    // Completion
    if (k === 'completionpercentage') {
      const n = Number(value) || 0;
      if (n >= 80) return '#2e7d32';
      if (n >= 50) return '#f57c00';
      return '#1976d2';
    }
    // Risks & issues
    if (k === 'openrisks') return Number(value) > 0 ? '#e65100' : '#2e7d32';
    if (k === 'openissues') return Number(value) > 0 ? '#c62828' : '#2e7d32';
    if (k === 'blockedtasks') return Number(value) > 0 ? '#c62828' : '#2e7d32';
    // Budget
    if (k === 'budgetvariance') return Number(value) >= 0 ? '#2e7d32' : '#c62828';
    if (k === 'budgetutilization') {
      const n = Number(value) || 0;
      if (n > 100) return '#c62828';
      if (n > 80) return '#f57c00';
      return '#2e7d32';
    }
    if (k === 'estimatedbudget' || k === 'actualcost') return '#1565c0';
    // Schedule
    if (k === 'daysremaining') return Number(value) < 0 ? '#c62828' : Number(value) < 14 ? '#f57c00' : '#2e7d32';
    if (k === 'isoverdue') return value === true ? '#c62828' : '#2e7d32';
    // Tasks
    if (k === 'completedtasks') return '#2e7d32';
    if (k === 'totaltasks') return '#1976d2';
    // Default
    return '#455a64';
  }

  private getProjectStatusColor(status: string): string {
    const s = (status || '').toUpperCase();
    const map: Record<string, string> = {
      'DRAFT': '#9e9e9e', 'ACTIVE': '#2196f3', 'ON_HOLD': '#ff9800', 'COMPLETED': '#4caf50',
      'CANCELLED': '#f44336', 'ARCHIVED': '#795548', 'PLANNING': '#673ab7'
    };
    return map[s] || '#455a64';
  }

  getDistColor(category: string, item: string): string {
    const key = (item || '').toUpperCase().replace(/\s+/g, '_');
    // Task statuses
    const taskStatusColors: Record<string, string> = {
      'TODO': '#9e9e9e', 'IN_PROGRESS': '#2196f3', 'IN_REVIEW': '#7b1fa2',
      'DONE': '#4caf50', 'BLOCKED': '#f44336', 'CANCELLED': '#795548'
    };
    // Priorities
    const priorityColors: Record<string, string> = {
      'LOW': '#8bc34a', 'MEDIUM': '#ff9800', 'HIGH': '#f44336', 'CRITICAL': '#b71c1c',
      'VERY_LOW': '#8bc34a', 'VERY_HIGH': '#b71c1c'
    };
    // Risk statuses
    const riskStatusColors: Record<string, string> = {
      'IDENTIFIED': '#ff9800', 'ANALYZING': '#2196f3', 'MITIGATING': '#7b1fa2',
      'RESOLVED': '#4caf50', 'ACCEPTED': '#607d8b', 'CLOSED': '#9e9e9e'
    };
    // Issue statuses
    const issueStatusColors: Record<string, string> = {
      'OPEN': '#f44336', 'IN_PROGRESS': '#2196f3', 'RESOLVED': '#4caf50',
      'CLOSED': '#9e9e9e', 'REOPENED': '#ff9800'
    };
    // Budget categories
    const budgetColors: Record<string, string> = {
      'LABOR': '#1976d2', 'EQUIPMENT': '#f57c00', 'MATERIALS': '#7b1fa2', 'SOFTWARE': '#0097a7',
      'TRAVEL': '#e65100', 'TRAINING': '#388e3c', 'CONSULTING': '#5d4037', 'CONTINGENCY': '#616161', 'OTHER': '#9e9e9e'
    };
    // Milestone statuses
    const milestoneColors: Record<string, string> = {
      'PENDING': '#ff9800', 'ACHIEVED': '#4caf50', 'MISSED': '#f44336', 'AT_RISK': '#e65100'
    };

    const cat = (category || '').toLowerCase();
    if (cat.includes('status') || cat.includes('stage')) {
      return taskStatusColors[key] || riskStatusColors[key] || issueStatusColors[key] || milestoneColors[key] || this.getProjectStatusColor(key);
    }
    if (cat.includes('priority') || cat.includes('impact') || cat.includes('probability')) {
      return priorityColors[key] || '#1976d2';
    }
    if (cat.includes('category')) {
      return budgetColors[key] || '#1976d2';
    }
    // Fallback: try all maps
    return taskStatusColors[key] || priorityColors[key] || riskStatusColors[key] || issueStatusColors[key] || budgetColors[key] || milestoneColors[key] || '#1976d2';
  }

  isStatusColumn(col: string): boolean {
    const c = col.toLowerCase();
    return c === 'status' || c === 'priority' || c === 'impact' || c === 'probability' || c === 'stage';
  }

  getStatusChipColor(value: any): string {
    return this.getDistColor('status', String(value ?? ''));
  }
}
