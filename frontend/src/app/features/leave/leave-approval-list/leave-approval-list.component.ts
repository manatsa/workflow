import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService, LeaveRequestDTO } from '../services/leave.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-leave-approval-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="leave-approval-list">
      <div class="page-header">
        <div>
          <h1>Leave Approvals</h1>
          <p class="subtitle">Review and approve pending leave requests</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (requests.length === 0) {
              <div class="empty-state">
                <mat-icon>thumb_up</mat-icon>
                <p>No pending leave requests</p>
              </div>
            } @else {
              <table mat-table [dataSource]="requests" class="full-width">
                <ng-container matColumnDef="employeeName">
                  <th mat-header-cell *matHeaderCellDef>Employee</th>
                  <td mat-cell *matCellDef="let r">
                    <div>
                      <strong>{{ r.employeeName }}</strong>
                      <div class="sub-text">{{ r.department || '' }}</div>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="leaveType">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let r">
                    <mat-chip [style.backgroundColor]="r.leaveTypeColor" style="color: white; font-size: 12px;">{{ r.leaveTypeName }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef>Dates</th>
                  <td mat-cell *matCellDef="let r">{{ r.startDate }} - {{ r.endDate }}</td>
                </ng-container>
                <ng-container matColumnDef="totalDays">
                  <th mat-header-cell *matHeaderCellDef>Days</th>
                  <td mat-cell *matCellDef="let r"><strong>{{ r.totalDays }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="level">
                  <th mat-header-cell *matHeaderCellDef>Level</th>
                  <td mat-cell *matCellDef="let r">
                    @if (r.maxLevel) {
                      <span class="level-badge">{{ r.currentLevel }}/{{ r.maxLevel }}</span>
                    } @else {
                      <span class="level-badge single">1/1</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="reason">
                  <th mat-header-cell *matHeaderCellDef>Reason</th>
                  <td mat-cell *matCellDef="let r">{{ r.reason | slice:0:50 }}{{ r.reason?.length > 50 ? '...' : '' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let r">
                    <button mat-icon-button color="primary" matTooltip="Approve" (click)="approve(r)">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="Reject" (click)="reject(r)">
                      <mat-icon>cancel</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Reassign" (click)="reassign(r)">
                      <mat-icon>swap_horiz</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="View Details" [routerLink]="['/leave/requests', r.id]">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
              <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageSizeOptions]="[10, 20, 50]"
                             (page)="onPage($event)"></mat-paginator>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-approval-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .sub-text { font-size: 12px; color: #666; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .level-badge { background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .level-badge.single { background: #f5f5f5; color: #666; }
  `]
})
export class LeaveApprovalListComponent implements OnInit {
  requests: LeaveRequestDTO[] = [];
  loading = true;
  columns = ['employeeName', 'leaveType', 'dates', 'totalDays', 'level', 'reason', 'actions'];
  totalElements = 0;
  pageSize = 20;
  page = 0;

  constructor(
    private leaveService: LeaveService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.leaveService.getPendingApprovals(this.page, this.pageSize).subscribe({
      next: (res) => {
        if (res.success) {
          this.requests = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onPage(event: PageEvent) {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  approve(request: LeaveRequestDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Approve Leave Request',
        message: `Approve leave request from ${request.employeeName}?`,
        confirmText: 'Approve',
        confirmColor: 'primary',
        type: 'confirm',
        showReasonInput: true,
        reasonLabel: 'Comments (optional)',
        reasonRequired: false
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.approveRequest(request.id!, result.reason || '').subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open(res.message || 'Leave request approved', 'Close', { duration: 3000 });
            this.load();
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to approve', 'Close', { duration: 5000 });
        }
      });
    });
  }

  reject(request: LeaveRequestDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Reject Leave Request',
        message: `Reject leave request from ${request.employeeName}?`,
        confirmText: 'Reject',
        confirmColor: 'warn',
        type: 'warn',
        showReasonInput: true,
        reasonLabel: 'Rejection reason',
        reasonRequired: true
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.rejectRequest(request.id!, result.reason).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Leave request rejected', 'Close', { duration: 3000 });
            this.load();
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to reject', 'Close', { duration: 5000 });
        }
      });
    });
  }

  reassign(request: LeaveRequestDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Reassign Leave Request',
        message: `Reassign this leave request to a different approver. Enter the user ID of the new approver.`,
        confirmText: 'Reassign',
        confirmColor: 'primary',
        type: 'confirm',
        showReasonInput: true,
        reasonLabel: 'Reason for reassignment',
        reasonRequired: true
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      // For now, use the current approver's user ID prompt approach
      const newUserId = prompt('Enter the User ID of the new approver:');
      if (!newUserId) return;
      this.leaveService.reassignRequest(request.id!, newUserId, result.reason).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Leave request reassigned', 'Close', { duration: 3000 });
            this.load();
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to reassign', 'Close', { duration: 5000 });
        }
      });
    });
  }
}
