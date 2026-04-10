import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/services/auth.service';
import { SettingService } from '@core/services/setting.service';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow, WorkflowInstance, InstanceStatus } from '@core/models/workflow.model';
import { ProjectService, ProjectDashboardDTO, ProjectSummaryDTO } from '../projects/services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-text">
            <h1>Welcome back, {{ firstName }}!</h1>
            <p class="hero-subtitle">Here's your summary for today</p>
          </div>
          <div class="hero-date">
            <mat-icon>calendar_today</mat-icon>
            <span>{{ today | date:'EEEE, MMMM d, y' }}</span>
          </div>
        </div>
      </div>

      <!-- Workflow Stat Cards -->
      <div class="section-label">
        <mat-icon>account_tree</mat-icon>
        <span>Workflows</span>
      </div>
      <div class="stats-row">
        <div class="stat-card stat-pending" routerLink="/approvals" matRipple>
          <div class="stat-icon-wrap">
            <mat-icon>hourglass_top</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">Pending Approvals</span>
          </div>
          <div class="stat-accent"></div>
        </div>

        <div class="stat-card stat-submitted" routerLink="/submissions" matRipple>
          <div class="stat-icon-wrap">
            <mat-icon>send</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ submissionsCount }}</span>
            <span class="stat-label">My Submissions</span>
          </div>
          <div class="stat-accent"></div>
        </div>

        <div class="stat-card stat-approved" matRipple>
          <div class="stat-icon-wrap">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ approvedCount }}</span>
            <span class="stat-label">Approved</span>
          </div>
          <div class="stat-accent"></div>
        </div>

        <div class="stat-card stat-workflows" matRipple>
          <div class="stat-icon-wrap">
            <mat-icon>account_tree</mat-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ workflows.length }}</span>
            <span class="stat-label">Active Workflows</span>
          </div>
          <div class="stat-accent"></div>
        </div>
      </div>

      <!-- Project Stat Cards -->
      @if (projectsModuleEnabled && projectDashboard) {
        <div class="section-label">
          <mat-icon>folder_special</mat-icon>
          <span>Projects</span>
        </div>
        <div class="stats-row">
          <div class="stat-card stat-proj-total" routerLink="/projects" matRipple>
            <div class="stat-icon-wrap">
              <mat-icon>folder</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ projectDashboard.totalProjects }}</span>
              <span class="stat-label">Total Projects</span>
            </div>
            <div class="stat-accent"></div>
          </div>

          <div class="stat-card stat-proj-active" routerLink="/projects" matRipple>
            <div class="stat-icon-wrap">
              <mat-icon>play_circle</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ projectDashboard.activeProjects }}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-accent"></div>
          </div>

          <div class="stat-card stat-proj-completed" matRipple>
            <div class="stat-icon-wrap">
              <mat-icon>verified</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ projectDashboard.completedProjects }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-accent"></div>
          </div>

          <div class="stat-card stat-proj-overdue" matRipple>
            <div class="stat-icon-wrap">
              <mat-icon>warning</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ projectDashboard.overdueProjects }}</span>
              <span class="stat-label">Overdue</span>
            </div>
            <div class="stat-accent"></div>
          </div>
        </div>
      }

      <!-- Main Content Row -->
      <div class="content-row">
        <!-- Submissions Breakdown Chart -->
        <div class="chart-card">
          <div class="card-header">
            <h3>Submissions Overview</h3>
          </div>
          <div class="chart-body">
            @if (submissionsCount > 0) {
              <div class="donut-container">
                <svg viewBox="0 0 120 120" class="donut-chart">
                  @for (seg of donutSegments; track seg.label) {
                    <circle cx="60" cy="60" r="48" fill="none"
                            [attr.stroke]="seg.color"
                            stroke-width="16"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            stroke-linecap="round"
                            class="donut-segment" />
                  }
                  <text x="60" y="56" text-anchor="middle" class="donut-total">{{ submissionsCount }}</text>
                  <text x="60" y="72" text-anchor="middle" class="donut-total-label">Total</text>
                </svg>
              </div>
              <div class="chart-legend">
                @for (seg of donutSegments; track seg.label) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="seg.color"></span>
                    <span class="legend-label">{{ seg.label }}</span>
                    <span class="legend-value">{{ seg.value }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-chart">
                <mat-icon>pie_chart_outline</mat-icon>
                <p>No submissions yet</p>
              </div>
            }
          </div>
        </div>

        <!-- Projects Breakdown Chart -->
        @if (projectsModuleEnabled && projectDashboard && projectDashboard.totalProjects > 0) {
          <div class="chart-card">
            <div class="card-header">
              <h3>Projects by Status</h3>
              <button mat-button matTooltip="View All" routerLink="/projects" class="view-all-btn">View All</button>
            </div>
            <div class="chart-body">
              <div class="donut-container">
                <svg viewBox="0 0 120 120" class="donut-chart">
                  @for (seg of projectDonutSegments; track seg.label) {
                    <circle cx="60" cy="60" r="48" fill="none"
                            [attr.stroke]="seg.color"
                            stroke-width="16"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            stroke-linecap="round"
                            class="donut-segment" />
                  }
                  <text x="60" y="56" text-anchor="middle" class="donut-total">{{ projectDashboard.totalProjects }}</text>
                  <text x="60" y="72" text-anchor="middle" class="donut-total-label">Projects</text>
                </svg>
              </div>
              <div class="chart-legend">
                @for (seg of projectDonutSegments; track seg.label) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="seg.color"></span>
                    <span class="legend-label">{{ seg.label }}</span>
                    <span class="legend-value">{{ seg.value }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Quick Actions -->
        <div class="quick-actions-card">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="actions-grid">
            @for (workflow of workflows.slice(0, 4); track workflow.id) {
              <div class="action-tile" [routerLink]="['/workflows', workflow.code, 'new']" matRipple>
                <div class="action-icon" [style.background]="getWorkflowColor(workflow)">
                  <mat-icon>{{ workflow.icon || 'description' }}</mat-icon>
                </div>
                <span class="action-name">{{ workflow.name }}</span>
              </div>
            }
            @if (projectsModuleEnabled) {
              <div class="action-tile" routerLink="/projects" matRipple>
                <div class="action-icon" style="background: #00897b">
                  <mat-icon>folder_special</mat-icon>
                </div>
                <span class="action-name">View Projects</span>
              </div>
            }
            <div class="action-tile" routerLink="/approvals" matRipple>
              <div class="action-icon" style="background: #ff9800">
                <mat-icon>approval</mat-icon>
              </div>
              <span class="action-name">My Approvals</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Second Content Row -->
      <div class="content-row second-row">
        <!-- Project Budget & Completion -->
        @if (projectsModuleEnabled && projectDashboard && projectDashboard.totalProjects > 0) {
          <div class="metrics-card">
            <div class="card-header">
              <h3>Project Metrics</h3>
            </div>
            <div class="metrics-body">
              <!-- Average Completion -->
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">Average Completion</span>
                  <span class="metric-pct">{{ projectDashboard.averageCompletion | number:'1.0-0' }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill progress-completion" [style.width.%]="projectDashboard.averageCompletion"></div>
                </div>
              </div>

              <!-- Budget Utilization -->
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">Budget Used</span>
                  <span class="metric-pct">{{ getBudgetPct() | number:'1.0-0' }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [class.progress-ok]="getBudgetPct() <= 80"
                       [class.progress-warn]="getBudgetPct() > 80 && getBudgetPct() <= 100"
                       [class.progress-danger]="getBudgetPct() > 100"
                       [style.width.%]="Math.min(getBudgetPct(), 100)"></div>
                </div>
                <div class="budget-row">
                  <span class="budget-label">{{ projectDashboard.totalActualCost | number:'1.0-0' }} spent</span>
                  <span class="budget-label">{{ projectDashboard.totalBudget | number:'1.0-0' }} budget</span>
                </div>
              </div>

              <!-- Priority Bars -->
              <div class="metric-item">
                <span class="metric-title" style="margin-bottom: 8px; display: block;">By Priority</span>
                @for (entry of projectPriorityEntries; track entry[0]) {
                  <div class="priority-row">
                    <span class="priority-label">{{ entry[0] }}</span>
                    <div class="priority-bar-track">
                      <div class="priority-bar-fill" [style.width.%]="getPriorityPct(entry[1])" [style.background]="getPriorityColor(entry[0])"></div>
                    </div>
                    <span class="priority-count">{{ entry[1] }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Pending Approvals -->
        <div class="approvals-card">
          <div class="card-header">
            <h3>Pending Approvals</h3>
            @if (pendingApprovals.length > 0) {
              <button mat-button matTooltip="View All" routerLink="/approvals" class="view-all-btn">View All</button>
            }
          </div>
          <div class="approvals-list">
            @if (pendingApprovals.length === 0) {
              <div class="empty-approvals">
                <mat-icon>task_alt</mat-icon>
                <p>All caught up!</p>
              </div>
            } @else {
              @for (item of pendingApprovals; track item.id) {
                <div class="approval-item" [routerLink]="['/approvals', item.id]" matRipple>
                  <div class="approval-icon">
                    <mat-icon>{{ item.workflowIcon || 'description' }}</mat-icon>
                  </div>
                  <div class="approval-info">
                    <span class="approval-ref">{{ item.referenceNumber }}</span>
                    <span class="approval-meta">{{ item.workflowName }} &middot; {{ item.initiatorName }}</span>
                  </div>
                  <mat-icon class="approval-arrow">chevron_right</mat-icon>
                </div>
              }
            }
          </div>
        </div>

        <!-- Recent Projects -->
        @if (projectsModuleEnabled && projectDashboard && projectDashboard.recentProjects && projectDashboard.recentProjects.length > 0) {
          <div class="recent-projects-card">
            <div class="card-header">
              <h3>Recent Projects</h3>
              <button mat-button matTooltip="View All" routerLink="/projects" class="view-all-btn">View All</button>
            </div>
            <div class="project-list">
              @for (proj of projectDashboard.recentProjects.slice(0, 5); track proj.id) {
                <div class="project-item" [routerLink]="['/projects', proj.id]" matRipple>
                  <div class="project-status-dot" [style.background]="getProjectStatusColor(proj.status)"></div>
                  <div class="project-item-info">
                    <span class="project-item-name">{{ proj.name }}</span>
                    <span class="project-item-meta">{{ proj.managerName || 'Unassigned' }} &middot; {{ proj.priority }}</span>
                  </div>
                  <div class="project-item-progress">
                    <div class="mini-progress-track">
                      <div class="mini-progress-fill" [style.width.%]="proj.completionPercentage"></div>
                    </div>
                    <span class="mini-progress-label">{{ proj.completionPercentage }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 24px; max-width: 1400px; margin: 0 auto; }

    /* Section Labels */
    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #555;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .section-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }

    /* Hero Banner */
    .hero-banner {
      background: linear-gradient(135deg, #1565c0 0%, #1976d2 30%, #42a5f5 70%, #64b5f6 100%);
      border-radius: 16px;
      padding: 32px 36px;
      margin-bottom: 24px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .hero-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    .hero-banner::after {
      content: '';
      position: absolute;
      bottom: -60%;
      left: 10%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
      border-radius: 50%;
    }
    .hero-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .hero-text h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 600; letter-spacing: -0.3px; }
    .hero-subtitle { margin: 0; font-size: 14px; opacity: 0.85; }
    .hero-date {
      display: flex; align-items: center; gap: 8px; font-size: 14px; opacity: 0.9;
      background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 24px;
    }
    .hero-date mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Stat Cards */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      cursor: pointer; position: relative; overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
    .stat-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: 4px 0 0 4px; }

    .stat-pending .stat-accent { background: #ff9800; }
    .stat-submitted .stat-accent { background: #2196f3; }
    .stat-approved .stat-accent { background: #4caf50; }
    .stat-workflows .stat-accent { background: #9c27b0; }
    .stat-proj-total .stat-accent { background: #00897b; }
    .stat-proj-active .stat-accent { background: #1976d2; }
    .stat-proj-completed .stat-accent { background: #43a047; }
    .stat-proj-overdue .stat-accent { background: #e53935; }

    .stat-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-pending .stat-icon-wrap { background: #fff3e0; }
    .stat-submitted .stat-icon-wrap { background: #e3f2fd; }
    .stat-approved .stat-icon-wrap { background: #e8f5e9; }
    .stat-workflows .stat-icon-wrap { background: #f3e5f5; }
    .stat-proj-total .stat-icon-wrap { background: #e0f2f1; }
    .stat-proj-active .stat-icon-wrap { background: #e3f2fd; }
    .stat-proj-completed .stat-icon-wrap { background: #e8f5e9; }
    .stat-proj-overdue .stat-icon-wrap { background: #ffebee; }

    .stat-pending .stat-icon-wrap mat-icon { color: #e65100; }
    .stat-submitted .stat-icon-wrap mat-icon { color: #1565c0; }
    .stat-approved .stat-icon-wrap mat-icon { color: #2e7d32; }
    .stat-workflows .stat-icon-wrap mat-icon { color: #7b1fa2; }
    .stat-proj-total .stat-icon-wrap mat-icon { color: #00695c; }
    .stat-proj-active .stat-icon-wrap mat-icon { color: #1565c0; }
    .stat-proj-completed .stat-icon-wrap mat-icon { color: #2e7d32; }
    .stat-proj-overdue .stat-icon-wrap mat-icon { color: #c62828; }

    .stat-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; line-height: 1.1; }
    .stat-label { font-size: 12px; color: #888; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Content Rows */
    .content-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .second-row { margin-top: 0; }

    /* Shared Card Styles */
    .chart-card, .quick-actions-card, .approvals-card, .metrics-card, .recent-projects-card {
      background: white; border-radius: 14px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .view-all-btn { color: #1976d2; font-size: 13px; }

    /* Donut Chart */
    .chart-body { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .donut-container { width: 160px; height: 160px; }
    .donut-chart { width: 100%; height: 100%; transform: rotate(-90deg); }
    .donut-segment { transition: stroke-dasharray 0.6s ease; }
    .donut-total { font-size: 22px; font-weight: 700; fill: #1a1a2e; transform: rotate(90deg); transform-origin: 60px 60px; }
    .donut-total-label { font-size: 10px; fill: #888; text-transform: uppercase; transform: rotate(90deg); transform-origin: 60px 60px; }
    .chart-legend { width: 100%; }
    .legend-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { flex: 1; font-size: 13px; color: #555; }
    .legend-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .empty-chart { text-align: center; padding: 40px 0; color: #bbb; }
    .empty-chart mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-chart p { margin: 8px 0 0; font-size: 14px; }

    /* Quick Actions */
    .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .action-tile {
      display: flex; align-items: center; gap: 12px; padding: 14px;
      border-radius: 12px; background: #f8f9fc; cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }
    .action-tile:hover { background: #eef1f8; transform: translateX(2px); }
    .action-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .action-icon mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }
    .action-name { font-size: 13px; font-weight: 500; color: #333; line-height: 1.3; }

    /* Pending Approvals */
    .approvals-list { display: flex; flex-direction: column; gap: 4px; }
    .approval-item {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      border-radius: 10px; cursor: pointer; transition: background 0.15s;
    }
    .approval-item:hover { background: #f5f7fa; }
    .approval-icon {
      width: 38px; height: 38px; border-radius: 10px; background: #e3f2fd;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .approval-icon mat-icon { color: #1565c0; font-size: 20px; width: 20px; height: 20px; }
    .approval-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .approval-ref { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .approval-meta { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .approval-arrow { color: #ccc; font-size: 20px; width: 20px; height: 20px; }
    .empty-approvals { text-align: center; padding: 40px 0; color: #bbb; }
    .empty-approvals mat-icon { font-size: 48px; width: 48px; height: 48px; color: #4caf50; }
    .empty-approvals p { margin: 8px 0 0; font-size: 14px; color: #888; }

    /* Project Metrics Card */
    .metrics-body { display: flex; flex-direction: column; gap: 20px; }
    .metric-item { }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .metric-title { font-size: 13px; color: #555; font-weight: 500; }
    .metric-pct { font-size: 14px; font-weight: 700; color: #1a1a2e; }
    .progress-track { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .progress-completion { background: linear-gradient(90deg, #1976d2, #42a5f5); }
    .progress-ok { background: linear-gradient(90deg, #43a047, #66bb6a); }
    .progress-warn { background: linear-gradient(90deg, #ff9800, #ffb74d); }
    .progress-danger { background: linear-gradient(90deg, #e53935, #ef5350); }
    .budget-row { display: flex; justify-content: space-between; margin-top: 4px; }
    .budget-label { font-size: 11px; color: #999; }

    .priority-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .priority-label { font-size: 12px; color: #555; min-width: 70px; text-transform: capitalize; }
    .priority-bar-track { flex: 1; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .priority-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
    .priority-count { font-size: 12px; font-weight: 600; color: #1a1a2e; min-width: 20px; text-align: right; }

    /* Recent Projects Card */
    .project-list { display: flex; flex-direction: column; gap: 4px; }
    .project-item {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      border-radius: 10px; cursor: pointer; transition: background 0.15s;
    }
    .project-item:hover { background: #f5f7fa; }
    .project-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .project-item-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .project-item-name { font-size: 13px; font-weight: 600; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .project-item-meta { font-size: 12px; color: #888; }
    .project-item-progress { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .mini-progress-track { width: 60px; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .mini-progress-fill { height: 100%; background: linear-gradient(90deg, #1976d2, #42a5f5); border-radius: 3px; }
    .mini-progress-label { font-size: 12px; font-weight: 600; color: #1a1a2e; min-width: 32px; text-align: right; }

    /* Responsive */
    @media (max-width: 1100px) {
      .content-row { grid-template-columns: 1fr 1fr; }
      .content-row > :last-child:nth-child(odd) { grid-column: span 2; }
    }
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .content-row { grid-template-columns: 1fr; }
      .content-row > :last-child:nth-child(odd) { grid-column: span 1; }
      .hero-content { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  Math = Math;
  workflows: Workflow[] = [];
  pendingApprovals: WorkflowInstance[] = [];
  pendingCount = 0;
  submissionsCount = 0;
  approvedCount = 0;
  today = new Date();
  statusCounts: Record<string, number> = {};
  donutSegments: DonutSegment[] = [];

  // Project data
  projectDashboard: ProjectDashboardDTO | null = null;
  projectDonutSegments: DonutSegment[] = [];
  projectPriorityEntries: [string, number][] = [];

  private workflowColors = [
    '#1976d2', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4',
    '#f44336', '#3f51b5', '#009688', '#ff5722', '#673ab7', '#2196f3'
  ];

  projectsModuleEnabled = true;

  constructor(
    private authService: AuthService,
    private settingService: SettingService,
    private workflowService: WorkflowService,
    private projectService: ProjectService
  ) {}

  get firstName(): string {
    const full = this.authService.currentUser?.fullName || 'User';
    return full.split(' ')[0];
  }

  ngOnInit() {
    this.loadData();
  }

  getWorkflowColor(workflow: Workflow): string {
    const idx = this.workflows.indexOf(workflow);
    return this.workflowColors[idx % this.workflowColors.length];
  }

  loadData() {
    this.workflowService.getActiveWorkflows().subscribe(res => {
      if (res.success) this.workflows = res.data;
    });

    this.workflowService.getPendingApprovals(0, 5).subscribe(res => {
      if (res.success) {
        this.pendingApprovals = res.data.content;
        this.pendingCount = res.data.totalElements;
      }
    });

    this.workflowService.getMySubmissions(0, 200).subscribe(res => {
      if (res.success) {
        const all = res.data.content;
        this.submissionsCount = res.data.totalElements;
        this.statusCounts = {};
        all.forEach(i => {
          this.statusCounts[i.status] = (this.statusCounts[i.status] || 0) + 1;
        });
        this.approvedCount = this.statusCounts[InstanceStatus.APPROVED] || 0;
        this.buildDonut();
      }
    });

    // Check projects module state, then load project dashboard
    this.settingService.getSettingValue('module.projects.enabled').subscribe({
      next: (res) => {
        if (res.success) {
          this.projectsModuleEnabled = res.data !== 'false';
        }
        if (this.projectsModuleEnabled) {
          this.loadProjectDashboard();
        }
      },
      error: () => this.loadProjectDashboard()
    });
  }

  private loadProjectDashboard() {
    this.projectService.getDashboard().subscribe({
      next: res => {
        if (res.success) {
          this.projectDashboard = res.data;
          this.buildProjectDonut();
          this.projectPriorityEntries = Object.entries(this.projectDashboard.projectsByPriority || {})
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1]);
        }
      },
      error: (err) => { console.warn('Failed to load project dashboard:', err); }
    });
  }

  getBudgetPct(): number {
    if (!this.projectDashboard || !this.projectDashboard.totalBudget) return 0;
    return (this.projectDashboard.totalActualCost / this.projectDashboard.totalBudget) * 100;
  }

  getPriorityPct(count: number): number {
    const max = Math.max(...this.projectPriorityEntries.map(e => e[1]), 1);
    return (count / max) * 100;
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'CRITICAL': '#d32f2f', 'HIGH': '#e53935', 'MEDIUM': '#ff9800', 'LOW': '#4caf50', 'NONE': '#90a4ae'
    };
    return colors[priority.toUpperCase()] || '#78909c';
  }

  getProjectStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'DRAFT': '#90a4ae', 'PLANNING': '#42a5f5', 'ACTIVE': '#1976d2', 'IN_PROGRESS': '#1976d2',
      'ON_HOLD': '#ff9800', 'COMPLETED': '#4caf50', 'CANCELLED': '#78909c', 'CLOSED': '#607d8b',
      'PENDING_APPROVAL': '#ff9800', 'APPROVED': '#43a047', 'REJECTED': '#e53935'
    };
    return colors[status] || '#bdbdbd';
  }

  private buildDonut() {
    const colorMap: Record<string, string> = {
      [InstanceStatus.APPROVED]: '#4caf50', [InstanceStatus.PENDING]: '#ff9800',
      [InstanceStatus.REJECTED]: '#f44336', [InstanceStatus.DRAFT]: '#90a4ae',
      [InstanceStatus.ESCALATED]: '#9c27b0', [InstanceStatus.CANCELLED]: '#78909c',
      [InstanceStatus.ON_HOLD]: '#607d8b', [InstanceStatus.RECALLED]: '#795548'
    };
    const labelMap: Record<string, string> = {
      [InstanceStatus.APPROVED]: 'Approved', [InstanceStatus.PENDING]: 'Pending',
      [InstanceStatus.REJECTED]: 'Rejected', [InstanceStatus.DRAFT]: 'Draft',
      [InstanceStatus.ESCALATED]: 'Escalated', [InstanceStatus.CANCELLED]: 'Cancelled',
      [InstanceStatus.ON_HOLD]: 'On Hold', [InstanceStatus.RECALLED]: 'Recalled'
    };
    this.donutSegments = this.computeDonutSegments(this.statusCounts, this.submissionsCount, colorMap, labelMap);
  }

  private buildProjectDonut() {
    if (!this.projectDashboard) return;
    const statusMap = this.projectDashboard.projectsByStatus || {};
    const colorMap: Record<string, string> = {
      'DRAFT': '#90a4ae', 'PLANNING': '#42a5f5', 'ACTIVE': '#1976d2', 'IN_PROGRESS': '#1976d2',
      'ON_HOLD': '#ff9800', 'COMPLETED': '#4caf50', 'CANCELLED': '#78909c', 'CLOSED': '#607d8b',
      'PENDING_APPROVAL': '#ffa726', 'APPROVED': '#43a047', 'REJECTED': '#e53935'
    };
    const labelMap: Record<string, string> = {};
    Object.keys(statusMap).forEach(k => {
      labelMap[k] = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    });
    this.projectDonutSegments = this.computeDonutSegments(statusMap, this.projectDashboard.totalProjects, colorMap, labelMap);
  }

  private computeDonutSegments(
    counts: Record<string, number>, total: number,
    colorMap: Record<string, string>, labelMap: Record<string, string>
  ): DonutSegment[] {
    const circumference = 2 * Math.PI * 48;
    const safeTotal = total || 1;
    let offset = 0;
    const gap = 3;

    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        const pct = count / safeTotal;
        const segLength = pct * circumference - gap;
        const seg: DonutSegment = {
          label: labelMap[key] || key,
          value: count,
          color: colorMap[key] || '#bdbdbd',
          dashArray: `${Math.max(segLength, 2)} ${circumference - Math.max(segLength, 2)}`,
          dashOffset: -offset
        };
        offset += pct * circumference;
        return seg;
      });
  }
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}
