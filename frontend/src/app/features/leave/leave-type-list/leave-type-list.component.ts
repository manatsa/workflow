import { Component, OnInit } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Inject } from '@angular/core';
import { LeaveService, LeaveTypeDTO } from '../services/leave.service';
import { ImportExportService } from '@core/services/import-export.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-leave-type-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="leave-type-list">
      <div class="page-header">
        <div>
          <h1>Leave Types</h1>
          <p class="subtitle">Configure leave types available in the system</p>
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
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> New Leave Type
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="types" class="full-width">
              <ng-container matColumnDef="color">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let t">
                  <span class="color-dot" [style.backgroundColor]="t.colorCode"></span>
                </td>
              </ng-container>
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let t">{{ t.name }}</td>
              </ng-container>
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let t">{{ t.code }}</td>
              </ng-container>
              <ng-container matColumnDef="defaultDays">
                <th mat-header-cell *matHeaderCellDef>Default Days</th>
                <td mat-cell *matCellDef="let t">{{ t.defaultDaysPerYear }}</td>
              </ng-container>
              <ng-container matColumnDef="isPaid">
                <th mat-header-cell *matHeaderCellDef>Paid</th>
                <td mat-cell *matCellDef="let t">{{ t.isPaid ? 'Yes' : 'No' }}</td>
              </ng-container>
              <ng-container matColumnDef="gender">
                <th mat-header-cell *matHeaderCellDef>Gender</th>
                <td mat-cell *matCellDef="let t">{{ t.applicableGender }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let t">
                  <button mat-icon-button matTooltip="Edit" (click)="openDialog(t)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" matTooltip="Delete" (click)="delete(t)"><mat-icon>delete</mat-icon></button>
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
    .leave-type-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .color-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
  `]
})
export class LeaveTypeListComponent implements OnInit {
  types: LeaveTypeDTO[] = [];
  loading = true;
  columns = ['color', 'name', 'code', 'defaultDays', 'isPaid', 'gender', 'actions'];

  constructor(private leaveService: LeaveService, private snackBar: MatSnackBar, private dialog: MatDialog, private importExportService: ImportExportService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.leaveService.getAllTypes().subscribe({
      next: (res) => { if (res.success) this.types = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openDialog(type?: LeaveTypeDTO) {
    const dialogRef = this.dialog.open(LeaveTypeDialogComponent, {
      width: '500px',
      data: type ? { ...type } : null
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(type: LeaveTypeDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Leave Type',
        message: 'Are you sure you want to delete this leave type?',
        itemName: type.name,
        type: 'delete'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.deleteType(type.id!).subscribe({
        next: (res) => {
          if (res.success) { this.snackBar.open('Leave type deleted', 'Close', { duration: 3000 }); this.load(); }
        }
      });
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('leavetype').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveType_Template.xlsx'),
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importExportService.importFromExcel('leavetype', file).subscribe({
      next: (response) => {
        const blob = response.body!;
        const filename = this.importExportService.extractFilename(response, 'LeaveType_Import_Results.xlsx');
        this.importExportService.downloadFile(blob, filename);
        this.snackBar.open('Import completed — check results file', 'Close', { duration: 5000 });
        this.load();
      },
      error: () => this.snackBar.open('Import failed', 'Close', { duration: 3000 })
    });
    event.target.value = '';
  }

  exportData() {
    this.importExportService.exportToExcel('leavetype').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'LeaveTypes_Export.xlsx'),
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}

@Component({
  selector: 'app-leave-type-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, MatIconModule, MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'New' }} Leave Type</h2>
    <mat-dialog-content>
      <form class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="form.name" name="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="form.code" name="code" required [readonly]="!!data">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Color</mat-label>
          <input matInput type="color" [(ngModel)]="form.colorCode" name="colorCode">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Default Days Per Year</mat-label>
          <input matInput type="number" [(ngModel)]="form.defaultDaysPerYear" name="defaultDaysPerYear" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Applicable Gender</mat-label>
          <mat-select [(ngModel)]="form.applicableGender" name="applicableGender">
            <mat-option value="ALL">All</mat-option>
            <mat-option value="MALE">Male</mat-option>
            <mat-option value="FEMALE">Female</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-checkbox [(ngModel)]="form.isPaid" name="isPaid">Paid Leave</mat-checkbox>
        <mat-checkbox [(ngModel)]="form.requiresAttachment" name="requiresAttachment">Requires Attachment</mat-checkbox>
        @if (form.requiresAttachment) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Attachment Required After (days)</mat-label>
            <input matInput type="number" [(ngModel)]="form.attachmentRequiredAfterDays" name="attachmentRequiredAfterDays">
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="form.description" name="description" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!form.name || !form.code">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; }
    .full-width { width: 100%; }
  `]
})
export class LeaveTypeDialogComponent {
  form: any;

  constructor(
    private dialogRef: MatDialogRef<LeaveTypeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LeaveTypeDTO | null,
    private leaveService: LeaveService,
    private snackBar: MatSnackBar
  ) {
    this.form = data ? { ...data } : {
      name: '', code: '', colorCode: '#1976d2', defaultDaysPerYear: 0,
      applicableGender: 'ALL', isPaid: true, requiresAttachment: false,
      attachmentRequiredAfterDays: null, description: '', displayOrder: 0
    };
  }

  save() {
    const obs = this.data
      ? this.leaveService.updateType(this.data.id!, this.form)
      : this.leaveService.createType(this.form);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(this.data ? 'Leave type updated' : 'Leave type created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed', 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 5000 });
      }
    });
  }
}
