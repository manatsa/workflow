import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuditLog } from '@core/models/setting.model';

@Component({
  selector: 'app-audit-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>history</mat-icon>
        Audit Log Details
      </h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="detail-section">
        <h4>General Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Timestamp</span>
            <span class="value">{{ data.actionDate | date:'medium' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Action</span>
            <span class="badge" [class]="getActionClass(data.action)">{{ data.action }}</span>
          </div>
          <div class="detail-item">
            <span class="label">User</span>
            <span class="value">{{ data.userFullName || data.username || 'System' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Username</span>
            <span class="value">{{ data.username || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">IP Address</span>
            <span class="value">{{ data.ipAddress || '-' }}</span>
          </div>
          @if (data.module) {
            <div class="detail-item">
              <span class="label">Module</span>
              <span class="value">{{ data.module }}</span>
            </div>
          }
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Entity Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Entity Type</span>
            <span class="value">{{ data.entityType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Entity Name</span>
            <span class="value">{{ data.entityName || '-' }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="label">Entity ID</span>
            <span class="value mono">{{ data.entityId }}</span>
          </div>
          @if (data.workflowInstanceRef) {
            <div class="detail-item">
              <span class="label">Workflow Reference</span>
              <span class="value">{{ data.workflowInstanceRef }}</span>
            </div>
          }
          @if (data.sbuName) {
            <div class="detail-item">
              <span class="label">SBU</span>
              <span class="value">{{ data.sbuName }}</span>
            </div>
          }
        </div>
      </div>

      @if (data.summary) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Summary</h4>
          <p class="summary-text">{{ data.summary }}</p>
        </div>
      }

      @if (data.changes) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Changes</h4>
          <pre class="changes-text">{{ data.changes }}</pre>
        </div>
      }

      @if (data.oldValues || data.newValues) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Value Comparison</h4>
          <div class="values-grid">
            @if (data.oldValues) {
              <div class="value-box old">
                <span class="value-label">Old Values</span>
                <pre>{{ formatJson(data.oldValues) }}</pre>
              </div>
            }
            @if (data.newValues) {
              <div class="value-box new">
                <span class="value-label">New Values</span>
                <pre>{{ formatJson(data.newValues) }}</pre>
              </div>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    mat-dialog-content {
      max-height: 70vh;
    }

    .detail-section {
      padding: 1rem 0;
    }

    .detail-section h4 {
      margin: 0 0 1rem 0;
      color: #1976d2;
      font-weight: 500;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item.full-width {
      grid-column: span 2;
    }

    .detail-item .label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-item .value {
      font-weight: 500;
    }

    .detail-item .value.mono {
      font-family: monospace;
      font-size: 0.85rem;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      word-break: break-all;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      width: fit-content;
    }

    .badge.create { background: #e8f5e9; color: #2e7d32; }
    .badge.update { background: #e3f2fd; color: #1565c0; }
    .badge.delete { background: #ffebee; color: #c62828; }
    .badge.login { background: #f3e5f5; color: #7b1fa2; }
    .badge.logout { background: #f5f5f5; color: #666; }
    .badge.approve { background: #e8f5e9; color: #2e7d32; }
    .badge.reject { background: #ffebee; color: #c62828; }
    .badge.submit { background: #e3f2fd; color: #1565c0; }
    .badge.escalate { background: #fff3e0; color: #e65100; }
    .badge.password_change { background: #e8f5e9; color: #2e7d32; }
    .badge.password_reset { background: #fff3e0; color: #e65100; }

    .summary-text {
      margin: 0;
      line-height: 1.6;
    }

    .changes-text {
      margin: 0;
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .values-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .value-box {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 0.75rem;
    }

    .value-box.old {
      border-left: 3px solid #c62828;
    }

    .value-box.new {
      border-left: 3px solid #2e7d32;
    }

    .value-box .value-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    .value-box.old .value-label { color: #c62828; }
    .value-box.new .value-label { color: #2e7d32; }

    .value-box pre {
      margin: 0;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    mat-divider {
      margin: 0.5rem 0;
    }
  `]
})
export class AuditDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AuditLog,
    private dialogRef: MatDialogRef<AuditDetailDialogComponent>
  ) {}

  getActionClass(action: string): string {
    return action?.toLowerCase() || '';
  }

  formatJson(jsonString: string): string {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonString;
    }
  }

  close() {
    this.dialogRef.close();
  }
}
