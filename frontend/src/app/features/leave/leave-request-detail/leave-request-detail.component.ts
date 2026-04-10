import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeaveService, LeaveRequestDTO } from '../services/leave.service';

@Component({
  selector: 'app-leave-request-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="leave-request-detail">
      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (request) {
        <div class="page-header">
          <div>
            <h1>{{ request.referenceNumber }}</h1>
            <p class="subtitle">Leave request details</p>
          </div>
          <button mat-button routerLink="/leave/requests">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>

        <mat-card>
          <mat-card-content>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Employee</label>
                <span>{{ request.employeeName }}</span>
              </div>
              <div class="detail-item">
                <label>Department</label>
                <span>{{ request.department || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>Leave Type</label>
                <mat-chip [style.backgroundColor]="request.leaveTypeColor" style="color: white">{{ request.leaveTypeName }}</mat-chip>
              </div>
              <div class="detail-item">
                <label>Status</label>
                <mat-chip class="status-{{ request.status?.toLowerCase() }}">{{ request.status }}</mat-chip>
              </div>
              <div class="detail-item">
                <label>Start Date</label>
                <span>{{ request.startDate }} {{ request.startDateHalfDay ? '(Half Day - ' + request.startDateHalfDayPeriod + ')' : '' }}</span>
              </div>
              <div class="detail-item">
                <label>End Date</label>
                <span>{{ request.endDate }} {{ request.endDateHalfDay ? '(Half Day - ' + request.endDateHalfDayPeriod + ')' : '' }}</span>
              </div>
              <div class="detail-item">
                <label>Total Days</label>
                <span class="total-days">{{ request.totalDays }}</span>
              </div>
              <div class="detail-item">
                <label>Reason</label>
                <span>{{ request.reason || '-' }}</span>
              </div>
              @if (request.contactWhileOnLeave) {
                <div class="detail-item">
                  <label>Contact While On Leave</label>
                  <span>{{ request.contactWhileOnLeave }}</span>
                </div>
              }
              @if (request.delegateToName) {
                <div class="detail-item">
                  <label>Delegated To</label>
                  <span>{{ request.delegateToName }}</span>
                </div>
              }

              <mat-divider></mat-divider>

              <div class="detail-item">
                <label>Submitted</label>
                <span>{{ request.createdAt }} by {{ request.createdBy }}</span>
              </div>
              @if (request.approvedByName) {
                <div class="detail-item">
                  <label>{{ request.status === 'APPROVED' ? 'Approved' : 'Reviewed' }} By</label>
                  <span>{{ request.approvedByName }} on {{ request.approvedAt }}</span>
                </div>
              }
              @if (request.approverComments) {
                <div class="detail-item">
                  <label>Approver Comments</label>
                  <span>{{ request.approverComments }}</span>
                </div>
              }
              @if (request.cancellationReason) {
                <div class="detail-item">
                  <label>Cancellation Reason</label>
                  <span>{{ request.cancellationReason }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-request-detail { padding: 24px; max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-item label { font-size: 12px; color: #666; font-weight: 500; text-transform: uppercase; }
    .detail-item span { font-size: 14px; }
    .total-days { font-size: 20px; font-weight: 700; color: #1976d2; }
    mat-divider { grid-column: 1 / -1; margin: 8px 0; }
    .status-pending { background-color: #ff9800 !important; color: white !important; }
    .status-approved { background-color: #4caf50 !important; color: white !important; }
    .status-rejected { background-color: #f44336 !important; color: white !important; }
    .status-cancelled { background-color: #9e9e9e !important; color: white !important; }
  `]
})
export class LeaveRequestDetailComponent implements OnInit {
  request: LeaveRequestDTO | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private leaveService: LeaveService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.leaveService.getRequest(id).subscribe({
        next: (res) => {
          if (res.success) this.request = res.data;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }
}
