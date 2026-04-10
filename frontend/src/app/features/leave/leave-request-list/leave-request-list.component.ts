import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService, LeaveRequestDTO } from '../services/leave.service';
import { ImportExportService } from '@core/services/import-export.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { LeaveRequestFormComponent } from '../leave-request-form/leave-request-form.component';

@Component({
  selector: 'app-leave-request-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="leave-request-list">
      <div class="page-header">
        <div>
          <h1>My Leave Requests</h1>
          <p class="subtitle">View and manage your leave requests</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="downloadTemplate()" matTooltip="Download template">
            <mat-icon>description</mat-icon> Template
          </button>
          <button mat-stroked-button (click)="fileInput.click()" matTooltip="Import from Excel">
            <mat-icon>upload</mat-icon> Import
          </button>
          <input #fileInput type="file" hidden accept=".xlsx,.xls" (change)="importData($event)">
          <button mat-stroked-button (click)="exportData()" matTooltip="Export to Excel">
            <mat-icon>download</mat-icon> Export
          </button>
          <button mat-raised-button color="primary" (click)="openNewRequest()">
            <mat-icon>add</mat-icon> New Request
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="requests" class="full-width">
              <ng-container matColumnDef="referenceNumber">
                <th mat-header-cell *matHeaderCellDef>Reference</th>
                <td mat-cell *matCellDef="let r">
                  <a [routerLink]="['/leave/requests', r.id]">{{ r.referenceNumber }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="leaveType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let r">
                  <mat-chip [style.backgroundColor]="r.leaveTypeColor" style="color: white; font-size: 12px;">{{ r.leaveTypeName }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="startDate">
                <th mat-header-cell *matHeaderCellDef>Start</th>
                <td mat-cell *matCellDef="let r">{{ r.startDate }}</td>
              </ng-container>
              <ng-container matColumnDef="endDate">
                <th mat-header-cell *matHeaderCellDef>End</th>
                <td mat-cell *matCellDef="let r">{{ r.endDate }}</td>
              </ng-container>
              <ng-container matColumnDef="totalDays">
                <th mat-header-cell *matHeaderCellDef>Days</th>
                <td mat-cell *matCellDef="let r">{{ r.totalDays }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let r">
                  <mat-chip class="status-{{ r.status?.toLowerCase() }}">{{ r.status }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let r">
                  @if (r.status === 'PENDING') {
                    <button mat-icon-button color="warn" matTooltip="Recall" (click)="recall(r)">
                      <mat-icon>undo</mat-icon>
                    </button>
                  }
                  @if (r.status === 'PENDING' || r.status === 'APPROVED') {
                    <button mat-icon-button color="warn" matTooltip="Cancel" (click)="cancel(r)">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
            <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageSizeOptions]="[10, 20, 50]"
                           (page)="onPage($event)"></mat-paginator>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-request-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .status-pending { background-color: #ff9800 !important; color: white !important; }
    .status-approved { background-color: #4caf50 !important; color: white !important; }
    .status-rejected { background-color: #f44336 !important; color: white !important; }
    .status-cancelled { background-color: #9e9e9e !important; color: white !important; }
    .status-recalled { background-color: #607d8b !important; color: white !important; }
  `]
})
export class LeaveRequestListComponent implements OnInit {
  requests: LeaveRequestDTO[] = [];
  loading = true;
  columns = ['referenceNumber', 'leaveType', 'startDate', 'endDate', 'totalDays', 'status', 'actions'];
  totalElements = 0;
  pageSize = 20;
  page = 0;

  constructor(
    private leaveService: LeaveService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() { this.load(); }

  openNewRequest() {
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '650px',
      maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'created') this.load();
    });
  }

  load() {
    this.loading = true;
    this.leaveService.getMyRequests(this.page, this.pageSize).subscribe({
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

  recall(request: LeaveRequestDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Recall Request',
        message: 'Are you sure you want to recall this leave request?',
        confirmText: 'Recall',
        confirmColor: 'warn',
        type: 'warn'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.recallRequest(request.id!).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Request recalled', 'Close', { duration: 3000 });
            this.load();
          }
        }
      });
    });
  }

  cancel(request: LeaveRequestDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Cancel Request',
        message: 'Are you sure you want to cancel this leave request?',
        confirmText: 'Cancel Request',
        confirmColor: 'warn',
        type: 'warn',
        showReasonInput: true,
        reasonLabel: 'Cancellation reason',
        reasonRequired: true
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.cancelRequest(request.id!, result.reason).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Request cancelled', 'Close', { duration: 3000 });
            this.load();
          }
        }
      });
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('leaverequest').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveRequest_Template.xlsx'),
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importExportService.importFromExcel('leaverequest', file).subscribe({
      next: (response) => {
        const blob = response.body!;
        const filename = this.importExportService.extractFilename(response, 'LeaveRequest_Import_Results.xlsx');
        this.importExportService.downloadFile(blob, filename);
        this.snackBar.open('Import completed — check results file', 'Close', { duration: 5000 });
        this.load();
      },
      error: () => this.snackBar.open('Import failed', 'Close', { duration: 3000 })
    });
    event.target.value = '';
  }

  exportData() {
    this.importExportService.exportToExcel('leaverequest').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveRequests_Export.xlsx'),
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
