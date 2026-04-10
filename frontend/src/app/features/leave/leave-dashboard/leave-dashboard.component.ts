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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService, LeaveDashboardDTO, LeaveBalanceDTO, LeaveRequestDTO } from '../services/leave.service';
import { LeaveRequestFormComponent } from '../leave-request-form/leave-request-form.component';

@Component({
  selector: 'app-leave-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="leave-dashboard">
      <div class="page-header">
        <div>
          <h1>Leave Management</h1>
          <p class="subtitle">View your leave balances, requests, and team calendar</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openNewRequest()">
            <mat-icon>add</mat-icon> New Leave Request
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (dashboard) {
        <!-- Balance Cards -->
        <h2 class="section-title">My Leave Balances</h2>
        <div class="balance-cards">
          @for (balance of dashboard.balances; track balance.id) {
            <mat-card class="balance-card">
              <mat-card-content>
                <div class="balance-header" [style.borderLeftColor]="balance.leaveTypeColor">
                  <span class="balance-type">{{ balance.leaveTypeName }}</span>
                  <span class="balance-available" [style.color]="balance.leaveTypeColor">{{ balance.available }}</span>
                </div>
                <div class="balance-details">
                  <div class="detail-row">
                    <span>Entitled</span><span>{{ balance.entitled }}</span>
                  </div>
                  <div class="detail-row">
                    <span>Used</span><span>{{ balance.used }}</span>
                  </div>
                  <div class="detail-row">
                    <span>Pending</span><span>{{ balance.pending }}</span>
                  </div>
                  @if (balance.carriedOver > 0) {
                    <div class="detail-row">
                      <span>Carried Over</span><span>{{ balance.carriedOver }}</span>
                    </div>
                  }
                  @if (balance.adjustment !== 0) {
                    <div class="detail-row">
                      <span>Adjustment</span><span>{{ balance.adjustment }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Pending Requests -->
        @if (dashboard.pendingRequests.length > 0) {
          <h2 class="section-title">My Pending Requests</h2>
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="dashboard.pendingRequests" class="full-width">
                <ng-container matColumnDef="referenceNumber">
                  <th mat-header-cell *matHeaderCellDef>Reference</th>
                  <td mat-cell *matCellDef="let r">
                    <a [routerLink]="['/leave/requests', r.id]">{{ r.referenceNumber }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="leaveType">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip [style.backgroundColor]="r.leaveTypeColor" style="color: white">{{ r.leaveTypeName }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef>Dates</th>
                  <td mat-cell *matCellDef="let r">{{ r.startDate }} - {{ r.endDate }}</td>
                </ng-container>
                <ng-container matColumnDef="totalDays">
                  <th mat-header-cell *matHeaderCellDef>Days</th>
                  <td mat-cell *matCellDef="let r">{{ r.totalDays }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip class="status-chip status-{{ r.status?.toLowerCase() }}">{{ r.status }}</mat-chip>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="requestColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: requestColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }

        <!-- Team on Leave Today -->
        @if (dashboard.teamOnLeave.length > 0) {
          <h2 class="section-title">Team on Leave Today</h2>
          <div class="team-leave-cards">
            @for (member of dashboard.teamOnLeave; track member.id) {
              <mat-card class="team-card">
                <mat-card-content>
                  <mat-icon>person</mat-icon>
                  <div>
                    <strong>{{ member.employeeName }}</strong>
                    <span class="team-leave-type">{{ member.leaveTypeName }}</span>
                    <span class="team-leave-dates">{{ member.startDate }} - {{ member.endDate }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <!-- Upcoming Leave -->
        @if (dashboard.upcomingLeave.length > 0) {
          <h2 class="section-title">My Upcoming Leave</h2>
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="dashboard.upcomingLeave" class="full-width">
                <ng-container matColumnDef="referenceNumber">
                  <th mat-header-cell *matHeaderCellDef>Reference</th>
                  <td mat-cell *matCellDef="let r">{{ r.referenceNumber }}</td>
                </ng-container>
                <ng-container matColumnDef="leaveType">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let r">{{ r.leaveTypeName }}</td>
                </ng-container>
                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef>Dates</th>
                  <td mat-cell *matCellDef="let r">{{ r.startDate }} - {{ r.endDate }}</td>
                </ng-container>
                <ng-container matColumnDef="totalDays">
                  <th mat-header-cell *matHeaderCellDef>Days</th>
                  <td mat-cell *matCellDef="let r">{{ r.totalDays }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">{{ r.status }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="requestColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: requestColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .leave-dashboard { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .section-title { font-size: 18px; margin: 24px 0 12px; }
    .balance-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .balance-card { cursor: default; }
    .balance-header { display: flex; justify-content: space-between; align-items: center; border-left: 4px solid; padding-left: 12px; margin-bottom: 12px; }
    .balance-type { font-weight: 500; font-size: 14px; }
    .balance-available { font-size: 28px; font-weight: 700; }
    .balance-details { font-size: 13px; color: #666; }
    .detail-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .full-width { width: 100%; }
    .team-leave-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .team-card mat-card-content { display: flex; align-items: center; gap: 12px; }
    .team-leave-type { display: block; font-size: 13px; color: #666; }
    .team-leave-dates { display: block; font-size: 12px; color: #999; }
    .status-pending { background-color: #ff9800 !important; color: white !important; }
    .status-approved { background-color: #4caf50 !important; color: white !important; }
    .status-rejected { background-color: #f44336 !important; color: white !important; }
    .status-cancelled { background-color: #9e9e9e !important; color: white !important; }
  `]
})
export class LeaveDashboardComponent implements OnInit {
  dashboard: LeaveDashboardDTO | null = null;
  loading = true;
  requestColumns = ['referenceNumber', 'leaveType', 'dates', 'totalDays', 'status'];

  constructor(
    private leaveService: LeaveService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  openNewRequest() {
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '650px',
      maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'created') this.loadDashboard();
    });
  }

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.leaveService.getDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.dashboard = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load dashboard', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
