import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LeaveService, PublicHolidayDTO } from '../services/leave.service';
import { ImportExportService } from '@core/services/import-export.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-leave-holiday-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="leave-holiday-list">
      <div class="page-header">
        <div>
          <h1>Public Holidays</h1>
          <p class="subtitle">Manage public holidays for leave calculations</p>
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
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> New Holiday
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (holidays.length === 0) {
              <div class="empty-state">
                <mat-icon>event</mat-icon>
                <p>No public holidays configured for {{ selectedYear }}</p>
              </div>
            } @else {
              <table mat-table [dataSource]="holidays" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let h">{{ h.name }}</td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let h">{{ h.date }}</td>
                </ng-container>
                <ng-container matColumnDef="country">
                  <th mat-header-cell *matHeaderCellDef>Country</th>
                  <td mat-cell *matCellDef="let h">{{ h.country || 'All' }}</td>
                </ng-container>
                <ng-container matColumnDef="recurring">
                  <th mat-header-cell *matHeaderCellDef>Recurring</th>
                  <td mat-cell *matCellDef="let h">{{ h.isRecurring ? 'Yes' : 'No' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let h">
                    <button mat-icon-button matTooltip="Edit" (click)="openDialog(h)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" matTooltip="Delete" (click)="delete(h)"><mat-icon>delete</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-holiday-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .year-select { width: 120px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class LeaveHolidayListComponent implements OnInit {
  holidays: PublicHolidayDTO[] = [];
  loading = true;
  selectedYear = new Date().getFullYear();
  years: number[] = [];
  columns = ['name', 'date', 'country', 'recurring', 'actions'];

  constructor(private leaveService: LeaveService, private snackBar: MatSnackBar, private dialog: MatDialog, private importExportService: ImportExportService) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) this.years.push(y);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.leaveService.getHolidays(this.selectedYear).subscribe({
      next: (res) => { if (res.success) this.holidays = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openDialog(holiday?: PublicHolidayDTO) {
    const dialogRef = this.dialog.open(LeaveHolidayDialogComponent, {
      width: '500px',
      data: holiday ? { ...holiday } : null
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(holiday: PublicHolidayDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Holiday',
        message: 'Are you sure you want to delete this holiday?',
        itemName: holiday.name,
        type: 'delete'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.deleteHoliday(holiday.id!).subscribe({
        next: (res) => {
          if (res.success) { this.snackBar.open('Holiday deleted', 'Close', { duration: 3000 }); this.load(); }
        }
      });
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('holiday').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'Holiday_Template.xlsx'),
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importExportService.importFromExcel('holiday', file).subscribe({
      next: (response) => {
        const blob = response.body!;
        const filename = this.importExportService.extractFilename(response, 'Holiday_Import_Results.xlsx');
        this.importExportService.downloadFile(blob, filename);
        this.snackBar.open('Import completed — check results file', 'Close', { duration: 5000 });
        this.load();
      },
      error: () => this.snackBar.open('Import failed', 'Close', { duration: 3000 })
    });
    event.target.value = '';
  }

  exportData() {
    this.importExportService.exportToExcel('holiday').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'Holidays_Export.xlsx'),
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}

@Component({
  selector: 'app-leave-holiday-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatButtonModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'New' }} Public Holiday</h2>
    <mat-dialog-content>
      <form class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" name="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="holidayDate" name="date" required
                 (dateChange)="onDateChange()">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Country (ISO code, leave empty for all)</mat-label>
          <input matInput [(ngModel)]="form.country" name="country">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="form.description" name="description" rows="2"></textarea>
        </mat-form-field>
        <mat-checkbox [(ngModel)]="form.isRecurring" name="isRecurring">Recurring (same date every year)</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!form.name || !form.date">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; } .full-width { width: 100%; }`]
})
export class LeaveHolidayDialogComponent {
  form: any;
  holidayDate: Date | null = null;

  constructor(
    private dialogRef: MatDialogRef<LeaveHolidayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PublicHolidayDTO | null,
    private leaveService: LeaveService,
    private snackBar: MatSnackBar
  ) {
    if (data) {
      this.form = { ...data };
      this.holidayDate = data.date ? new Date(data.date) : null;
    } else {
      this.form = { name: '', date: '', country: '', description: '', isRecurring: false };
    }
  }

  onDateChange() {
    if (this.holidayDate) {
      const y = this.holidayDate.getFullYear();
      const m = String(this.holidayDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.holidayDate.getDate()).padStart(2, '0');
      this.form.date = `${y}-${m}-${d}`;
      this.form.year = y;
    }
  }

  save() {
    const obs = this.data
      ? this.leaveService.updateHoliday(this.data.id!, this.form)
      : this.leaveService.createHoliday(this.form);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(this.data ? 'Holiday updated' : 'Holiday created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed', 'Close', { duration: 5000 });
        }
      },
      error: (err) => { this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 5000 }); }
    });
  }
}
