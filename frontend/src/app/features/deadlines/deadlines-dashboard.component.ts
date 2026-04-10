import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeadlineService, DeadlineDashboardDTO, DeadlineInstanceDTO } from './services/deadline.service';

@Component({
  selector: 'app-deadlines-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule
  ],
  template: `
    <div class="deadlines-dashboard">
      <div class="page-header">
        <div>
          <h1>Critical Deadlines</h1>
          <p class="subtitle">Track and manage important deadlines, reporting dates, and meetings</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/deadlines/items/new">
            <mat-icon>add</mat-icon> New Deadline
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (dashboard) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card active" routerLink="/deadlines/items">
            <mat-card-content>
              <div class="card-icon"><mat-icon>event_note</mat-icon></div>
              <div class="card-info">
                <span class="card-value">{{ dashboard.totalActive }}</span>
                <span class="card-label">Active Deadlines</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card upcoming">
            <mat-card-content>
              <div class="card-icon"><mat-icon>schedule</mat-icon></div>
              <div class="card-info">
                <span class="card-value">{{ dashboard.upcomingCount }}</span>
                <span class="card-label">Upcoming</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card due-soon">
            <mat-card-content>
              <div class="card-icon"><mat-icon>warning</mat-icon></div>
              <div class="card-info">
                <span class="card-value">{{ dashboard.dueSoonCount }}</span>
                <span class="card-label">Due Soon</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card overdue">
            <mat-card-content>
              <div class="card-icon"><mat-icon>error</mat-icon></div>
              <div class="card-info">
                <span class="card-value">{{ dashboard.overdueCount }}</span>
                <span class="card-label">Overdue</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card completed">
            <mat-card-content>
              <div class="card-icon"><mat-icon>check_circle</mat-icon></div>
              <div class="card-info">
                <span class="card-value">{{ dashboard.completedThisMonth }}</span>
                <span class="card-label">Completed This Month</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Overdue Section -->
        @if (dashboard.overdueDeadlines.length > 0) {
          <mat-card class="section-card overdue-section">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon overdue-icon">error</mat-icon>
              <mat-card-title>Overdue Deadlines</mat-card-title>
              <mat-card-subtitle>{{ dashboard.overdueDeadlines.length }} item(s) past due date</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="dashboard.overdueDeadlines" class="deadline-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Deadline</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/deadlines/items', row.deadlineItemId]" class="deadline-link">{{ row.deadlineItemName }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let row">{{ row.categoryName || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let row">{{ row.dueDate | date:'dd MMM yyyy' }}</td>
                </ng-container>
                <ng-container matColumnDef="daysRemaining">
                  <th mat-header-cell *matHeaderCellDef>Overdue By</th>
                  <td mat-cell *matCellDef="let row" class="overdue-text">
                    {{ Math.abs(row.daysRemaining) }} day(s)
                  </td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="priority-chip" [class]="'priority-' + row.priority?.toLowerCase()">{{ row.priority }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Mark Complete" color="primary" (click)="completeInstance(row); $event.stopPropagation()">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="overdueColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: overdueColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }

        <!-- Upcoming Section -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="section-icon upcoming-icon">event</mat-icon>
            <mat-card-title>Upcoming Deadlines</mat-card-title>
            <mat-card-subtitle>Next 30 days</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (dashboard.upcomingDeadlines.length === 0) {
              <p class="empty-message">No upcoming deadlines in the next 30 days.</p>
            } @else {
              <table mat-table [dataSource]="dashboard.upcomingDeadlines" class="deadline-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Deadline</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/deadlines/items', row.deadlineItemId]" class="deadline-link">{{ row.deadlineItemName }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let row">{{ row.categoryName || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let row">{{ row.dueDate | date:'dd MMM yyyy' }}</td>
                </ng-container>
                <ng-container matColumnDef="daysRemaining">
                  <th mat-header-cell *matHeaderCellDef>Days Left</th>
                  <td mat-cell *matCellDef="let row" [class.due-soon-text]="row.daysRemaining <= 7">
                    {{ row.daysRemaining }} day(s)
                  </td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="priority-chip" [class]="'priority-' + row.priority?.toLowerCase()">{{ row.priority }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="status-chip" [class]="'status-' + row.status?.toLowerCase()">{{ row.status?.replace('_', ' ') }}</span>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="upcomingColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: upcomingColumns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .deadlines-dashboard { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .summary-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .summary-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    .card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .card-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .card-info { display: flex; flex-direction: column; }
    .card-value { font-size: 28px; font-weight: 600; line-height: 1.2; }
    .card-label { font-size: 13px; color: #666; }

    .active .card-icon { background: #e3f2fd; color: #1565c0; }
    .active .card-value { color: #1565c0; }
    .upcoming .card-icon { background: #e8f5e9; color: #2e7d32; }
    .upcoming .card-value { color: #2e7d32; }
    .due-soon .card-icon { background: #fff3e0; color: #e65100; }
    .due-soon .card-value { color: #e65100; }
    .overdue .card-icon { background: #ffebee; color: #c62828; }
    .overdue .card-value { color: #c62828; }
    .completed .card-icon { background: #e8f5e9; color: #388e3c; }
    .completed .card-value { color: #388e3c; }

    .section-card { margin-bottom: 24px; }
    .section-icon { font-size: 24px !important; width: 40px !important; height: 40px !important; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    .overdue-icon { background: #ffebee; color: #c62828; }
    .upcoming-icon { background: #e3f2fd; color: #1565c0; }
    .overdue-section { border-left: 4px solid #c62828; }

    .deadline-table { width: 100%; }
    .deadline-link { color: #1565c0; text-decoration: none; font-weight: 500; }
    .deadline-link:hover { text-decoration: underline; }
    .overdue-text { color: #c62828; font-weight: 600; }
    .due-soon-text { color: #e65100; font-weight: 600; }
    .empty-message { color: #999; text-align: center; padding: 24px; }

    .priority-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .priority-critical { background: #ffebee; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #fff8e1; color: #f57f17; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }

    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-upcoming { background: #e3f2fd; color: #1565c0; }
    .status-due_soon { background: #fff3e0; color: #e65100; }
    .status-overdue { background: #ffebee; color: #c62828; }
    .status-completed { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class DeadlinesDashboardComponent implements OnInit {
  dashboard: DeadlineDashboardDTO | null = null;
  loading = true;
  Math = Math;

  overdueColumns = ['name', 'category', 'dueDate', 'daysRemaining', 'priority', 'actions'];
  upcomingColumns = ['name', 'category', 'dueDate', 'daysRemaining', 'priority', 'status'];

  constructor(
    private deadlineService: DeadlineService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.deadlineService.getDashboard().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dashboard = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load dashboard', 'Close', { duration: 3000 });
      }
    });
  }

  completeInstance(instance: DeadlineInstanceDTO) {
    this.deadlineService.completeInstance(instance.id!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open('Deadline marked as completed', 'Close', { duration: 3000 });
          this.loadDashboard();
        }
      },
      error: () => this.snackBar.open('Failed to complete deadline', 'Close', { duration: 3000 })
    });
  }
}
