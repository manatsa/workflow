import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ImportResult } from '@core/services/import-export.service';

@Component({
  selector: 'app-import-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class]="data.result.errorCount > 0 ? 'warn-icon' : 'success-icon'">
        {{ data.result.errorCount > 0 ? 'warning' : 'check_circle' }}
      </mat-icon>
      Import Results
    </h2>
    <mat-dialog-content>
      <div class="summary">
        <div class="summary-item success" *ngIf="data.result.successCount > 0">
          <mat-icon>check_circle</mat-icon>
          <span>{{ data.result.successCount }} record(s) imported successfully</span>
        </div>
        <div class="summary-item error" *ngIf="data.result.errorCount > 0">
          <mat-icon>error</mat-icon>
          <span>{{ data.result.errorCount }} error(s) encountered</span>
        </div>
      </div>

      <mat-divider *ngIf="data.result.errors?.length"></mat-divider>

      <div class="errors-section" *ngIf="data.result.errors?.length">
        <h3>Error Details:</h3>
        <div class="error-list">
          <div class="error-item" *ngFor="let error of data.result.errors">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <span>{{ error }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .warn-icon { color: #f57c00; }
    .success-icon { color: #4caf50; }
    .summary { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .summary-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-weight: 500; }
    .summary-item.success { background: #e8f5e9; color: #2e7d32; }
    .summary-item.error { background: #fbe9e7; color: #c62828; }
    .summary-item mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .errors-section { margin-top: 16px; }
    .errors-section h3 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; }
    .error-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .error-item {
      display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px;
      background: #fff3e0; border-radius: 4px; font-size: 13px; color: #e65100;
    }
    .error-icon { font-size: 18px; width: 18px; height: 18px; min-width: 18px; margin-top: 1px; color: #e65100; }
    mat-dialog-content { max-width: 600px; min-width: 400px; }
  `]
})
export class ImportResultDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImportResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { result: ImportResult }
  ) {}
}
