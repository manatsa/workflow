import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '@core/services/auth.service';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow, WorkflowInstance, InstanceStatus } from '@core/models/workflow.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule
  ],
  template: `
    <div class="dashboard">
      <h1>Welcome, {{ fullName }}!</h1>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>pending</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">Pending Approvals</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>send</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ submissionsCount }}</span>
            <span class="stat-label">My Submissions</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ approvedCount }}</span>
            <span class="stat-label">Approved</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon>folder</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ workflows.length }}</span>
            <span class="stat-label">Active Workflows</span>
          </div>
        </mat-card>
      </div>

      <div class="content-grid">
        <mat-card class="card">
          <mat-card-header>
            <mat-card-title>Available Workflows</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="workflow-grid">
              @for (workflow of workflows; track workflow.id) {
                <mat-card class="workflow-card" [routerLink]="['/workflows', workflow.code, 'new']">
                  <mat-icon>{{ workflow.icon || 'description' }}</mat-icon>
                  <h3>{{ workflow.name }}</h3>
                  <p>{{ workflow.description }}</p>
                </mat-card>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="card">
          <mat-card-header>
            <mat-card-title>Recent Pending Approvals</mat-card-title>
            <button mat-button color="primary" routerLink="/approvals">View All</button>
          </mat-card-header>
          <mat-card-content>
            @if (pendingApprovals.length === 0) {
              <p class="no-data">No pending approvals</p>
            } @else {
              <table mat-table [dataSource]="pendingApprovals" class="data-table">
                <ng-container matColumnDef="referenceNumber">
                  <th mat-header-cell *matHeaderCellDef>Reference</th>
                  <td mat-cell *matCellDef="let item">{{ item.referenceNumber }}</td>
                </ng-container>

                <ng-container matColumnDef="workflowName">
                  <th mat-header-cell *matHeaderCellDef>Workflow</th>
                  <td mat-cell *matCellDef="let item">{{ item.workflowName }}</td>
                </ng-container>

                <ng-container matColumnDef="initiatorName">
                  <th mat-header-cell *matHeaderCellDef>Submitted By</th>
                  <td mat-cell *matCellDef="let item">{{ item.initiatorName }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let item">
                    <button mat-button color="primary" [routerLink]="['/approvals', item.id]">
                      Review
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 1rem; }

    h1 { margin-bottom: 1.5rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .stat-card mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #1976d2;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 500;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1rem;
    }

    .card { height: fit-content; }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .workflow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 1rem 0;
    }

    .workflow-card {
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .workflow-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .workflow-card mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1976d2;
    }

    .workflow-card h3 {
      margin: 0.5rem 0 0.25rem;
      font-size: 0.875rem;
    }

    .workflow-card p {
      margin: 0;
      font-size: 0.75rem;
      color: #666;
    }

    .data-table { width: 100%; }

    .no-data {
      text-align: center;
      color: #666;
      padding: 2rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  workflows: Workflow[] = [];
  pendingApprovals: WorkflowInstance[] = [];
  pendingCount = 0;
  submissionsCount = 0;
  approvedCount = 0;
  displayedColumns = ['referenceNumber', 'workflowName', 'initiatorName', 'actions'];

  constructor(
    private authService: AuthService,
    private workflowService: WorkflowService
  ) {}

  get fullName(): string {
    return this.authService.currentUser?.fullName || 'User';
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.workflowService.getActiveWorkflows().subscribe(res => {
      if (res.success) {
        this.workflows = res.data;
      }
    });

    this.workflowService.getPendingApprovals(0, 5).subscribe(res => {
      if (res.success) {
        this.pendingApprovals = res.data.content;
        this.pendingCount = res.data.totalElements;
      }
    });

    this.workflowService.getMySubmissions(0, 100).subscribe(res => {
      if (res.success) {
        this.submissionsCount = res.data.totalElements;
        this.approvedCount = res.data.content.filter(
          i => i.status === InstanceStatus.APPROVED
        ).length;
      }
    });
  }
}
