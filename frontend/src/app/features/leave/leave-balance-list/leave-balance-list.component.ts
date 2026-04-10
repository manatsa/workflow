import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService, LeaveBalanceDTO } from '../services/leave.service';
import { ImportExportService } from '@core/services/import-export.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-leave-balance-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="leave-balance-list">
      <div class="page-header">
        <div>
          <h1>Leave Balances</h1>
          <p class="subtitle">View and manage employee leave balances</p>
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
          <mat-form-field appearance="outline" class="year-select">
            <mat-label>Year</mat-label>
            <mat-select [(ngModel)]="selectedYear" (selectionChange)="load()">
              @for (y of years; track y) {
                <mat-option [value]="y">{{ y }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="initializeYear()" matTooltip="Initialize balances for selected year">
            <mat-icon>playlist_add</mat-icon> Initialize Year
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="balances" class="full-width">
              <ng-container matColumnDef="employeeName">
                <th mat-header-cell *matHeaderCellDef>Employee</th>
                <td mat-cell *matCellDef="let b">
                  <div>
                    <strong>{{ b.employeeName }}</strong>
                    <div class="sub-text">{{ b.department || '' }}</div>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="leaveType">
                <th mat-header-cell *matHeaderCellDef>Leave Type</th>
                <td mat-cell *matCellDef="let b">
                  <span [style.color]="b.leaveTypeColor">&#9679;</span> {{ b.leaveTypeName }}
                </td>
              </ng-container>
              <ng-container matColumnDef="entitled">
                <th mat-header-cell *matHeaderCellDef>Entitled</th>
                <td mat-cell *matCellDef="let b">{{ b.entitled }}</td>
              </ng-container>
              <ng-container matColumnDef="carriedOver">
                <th mat-header-cell *matHeaderCellDef>Carried Over</th>
                <td mat-cell *matCellDef="let b">{{ b.carriedOver }}</td>
              </ng-container>
              <ng-container matColumnDef="used">
                <th mat-header-cell *matHeaderCellDef>Used</th>
                <td mat-cell *matCellDef="let b">{{ b.used }}</td>
              </ng-container>
              <ng-container matColumnDef="pending">
                <th mat-header-cell *matHeaderCellDef>Pending</th>
                <td mat-cell *matCellDef="let b">{{ b.pending }}</td>
              </ng-container>
              <ng-container matColumnDef="available">
                <th mat-header-cell *matHeaderCellDef>Available</th>
                <td mat-cell *matCellDef="let b"><strong [class.low-balance]="b.available <= 2">{{ b.available }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Adjust</th>
                <td mat-cell *matCellDef="let b">
                  <button mat-icon-button matTooltip="Adjust balance" (click)="adjust(b)">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-balance-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .year-select { width: 120px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .sub-text { font-size: 12px; color: #666; }
    .low-balance { color: #f44336; }
  `]
})
export class LeaveBalanceListComponent implements OnInit {
  balances: LeaveBalanceDTO[] = [];
  loading = true;
  selectedYear = new Date().getFullYear();
  years: number[] = [];
  columns = ['employeeName', 'leaveType', 'entitled', 'carriedOver', 'used', 'pending', 'available', 'actions'];

  constructor(private leaveService: LeaveService, private snackBar: MatSnackBar, private dialog: MatDialog, private importExportService: ImportExportService) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) this.years.push(y);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.leaveService.getAllBalances(this.selectedYear).subscribe({
      next: (res) => {
        if (res.success) this.balances = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  initializeYear() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Initialize Balances',
        message: `Initialize leave balances for ${this.selectedYear}? This will create balances for all employees.`,
        confirmText: 'Initialize',
        type: 'confirm'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.initializeYear(this.selectedYear).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open(`Balances initialized for ${this.selectedYear}`, 'Close', { duration: 3000 });
            this.load();
          }
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to initialize', 'Close', { duration: 5000 });
        }
      });
    });
  }

  adjust(balance: LeaveBalanceDTO) {
    const daysStr = prompt(`Adjust balance for ${balance.employeeName} - ${balance.leaveTypeName}.\nEnter days (positive to add, negative to deduct):`);
    if (!daysStr) return;
    const days = parseFloat(daysStr);
    if (isNaN(days)) return;
    const reason = prompt('Reason for adjustment:');
    if (!reason) return;

    this.leaveService.adjustBalance({
      employeeId: balance.employeeId,
      leaveTypeId: balance.leaveTypeId,
      year: this.selectedYear,
      adjustmentDays: days,
      reason
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Balance adjusted', 'Close', { duration: 3000 });
          this.load();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to adjust', 'Close', { duration: 5000 });
      }
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('leavebalance').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveBalance_Template.xlsx'),
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importExportService.importFromExcel('leavebalance', file).subscribe({
      next: (response) => {
        const blob = response.body!;
        const filename = this.importExportService.extractFilename(response, 'LeaveBalance_Import_Results.xlsx');
        this.importExportService.downloadFile(blob, filename);
        this.snackBar.open('Import completed — check results file', 'Close', { duration: 5000 });
        this.load();
      },
      error: () => this.snackBar.open('Import failed', 'Close', { duration: 3000 })
    });
    event.target.value = '';
  }

  exportData() {
    this.importExportService.exportToExcel('leavebalance').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveBalances_Export.xlsx'),
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
