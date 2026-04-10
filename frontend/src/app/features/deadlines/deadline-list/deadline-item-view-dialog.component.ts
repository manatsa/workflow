import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeadlineItemDTO } from '../services/deadline.service';

@Component({
  selector: 'app-deadline-item-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="view-dialog">
      <div class="dialog-header" [class]="'priority-bg-' + data.priority?.toLowerCase()">
        <div class="header-content">
          <mat-icon class="header-icon">event_note</mat-icon>
          <div>
            <h2>{{ data.name }}</h2>
            <span class="code-badge">{{ data.code }}</span>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="detail-grid">
          <div class="detail-item">
            <mat-icon>category</mat-icon>
            <div>
              <label>Category</label>
              <span>{{ data.categoryName || 'Not set' }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>flag</mat-icon>
            <div>
              <label>Priority</label>
              <span class="priority-chip" [class]="'priority-' + data.priority?.toLowerCase()">{{ data.priority }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>toggle_on</mat-icon>
            <div>
              <label>Status</label>
              <span class="status-chip" [class]="'status-' + data.status?.toLowerCase()">{{ data.status }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>repeat</mat-icon>
            <div>
              <label>Recurrence</label>
              <span>{{ formatRecurrence(data.recurrenceType) }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>event</mat-icon>
            <div>
              <label>Next Due Date</label>
              <span [class.overdue-text]="data.nextInstanceStatus === 'OVERDUE'"
                    [class.due-soon-text]="data.nextInstanceStatus === 'DUE_SOON'">
                {{ data.nextDueDate ? (data.nextDueDate | date:'dd MMMM yyyy') : 'Not set' }}
              </span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>notifications</mat-icon>
            <div>
              <label>Reminder Days</label>
              <span>{{ data.reminderDaysBefore || 'Not configured' }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>person</mat-icon>
            <div>
              <label>Owner</label>
              <span>{{ data.ownerName || 'Not assigned' }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>business</mat-icon>
            <div>
              <label>SBU</label>
              <span>{{ data.sbuName || 'Not assigned' }}</span>
            </div>
          </div>
        </div>

        @if (data.description) {
          <mat-divider></mat-divider>
          <div class="section">
            <h3><mat-icon>description</mat-icon> Description</h3>
            <p class="description-text">{{ data.description }}</p>
          </div>
        }

        @if (data.actions && data.actions.length > 0) {
          <mat-divider></mat-divider>
          <div class="section">
            <h3><mat-icon>checklist</mat-icon> Actions ({{ data.actions.length }})</h3>
            <div class="action-list">
              @for (action of data.actions; track action.id) {
                <div class="action-item">
                  <mat-icon class="action-status-icon" [class.completed]="action.status === 'COMPLETED'">
                    {{ action.status === 'COMPLETED' ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                  <div class="action-info">
                    <span class="action-title" [class.completed-text]="action.status === 'COMPLETED'">{{ action.title }}</span>
                    @if (action.assigneeName) {
                      <span class="action-assignee">{{ action.assigneeName }}</span>
                    }
                  </div>
                  @if (action.dueOffsetDays) {
                    <span class="action-offset">{{ action.dueOffsetDays }}d before</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (data.recipients && data.recipients.length > 0) {
          <mat-divider></mat-divider>
          <div class="section">
            <h3><mat-icon>mail</mat-icon> Notification Recipients ({{ data.recipients.length }})</h3>
            <div class="recipient-list">
              @for (r of data.recipients; track r.id) {
                <div class="recipient-item">
                  <mat-icon>person</mat-icon>
                  <div>
                    <span class="recipient-name">{{ r.recipientName || r.recipientEmail }}</span>
                    <span class="recipient-email">{{ r.recipientEmail }}</span>
                  </div>
                  <div class="notify-badges">
                    @if (r.notifyOnReminder) { <span class="notify-badge reminder">Reminder</span> }
                    @if (r.notifyOnOverdue) { <span class="notify-badge overdue">Overdue</span> }
                    @if (r.notifyOnCompletion) { <span class="notify-badge complete">Complete</span> }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (data.instances && data.instances.length > 0) {
          <mat-divider></mat-divider>
          <div class="section">
            <h3><mat-icon>history</mat-icon> Instance History ({{ data.instances.length }})</h3>
            <div class="instance-list">
              @for (inst of data.instances; track inst.id) {
                <div class="instance-item">
                  <span class="inst-date">{{ inst.dueDate | date:'dd MMM yyyy' }}</span>
                  <span class="status-chip" [class]="'status-' + inst.status?.toLowerCase()">{{ inst.status?.replace('_', ' ') }}</span>
                  @if (inst.completedAt) {
                    <span class="inst-completed">Completed {{ inst.completedAt | date:'dd MMM yyyy' }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <mat-divider></mat-divider>
        <div class="meta-info">
          <span>Created: {{ data.createdAt | date:'dd MMM yyyy HH:mm' }} by {{ data.createdBy || 'Unknown' }}</span>
          <span>Last Updated: {{ data.updatedAt | date:'dd MMM yyyy HH:mm' }}</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-raised-button color="primary" [mat-dialog-close]="'edit'">
          <mat-icon>edit</mat-icon> Edit
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .view-dialog { min-width: 550px; }
    .dialog-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; border-radius: 4px 4px 0 0; }
    .priority-bg-critical { background: linear-gradient(135deg, #c62828, #e53935); }
    .priority-bg-high { background: linear-gradient(135deg, #e65100, #f57c00); }
    .priority-bg-medium { background: linear-gradient(135deg, #1565c0, #1976d2); }
    .priority-bg-low { background: linear-gradient(135deg, #2e7d32, #43a047); }
    .header-content { display: flex; align-items: center; gap: 12px; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: rgba(255,255,255,0.9); }
    .dialog-header h2 { margin: 0; color: white; font-size: 20px; }
    .code-badge { background: rgba(255,255,255,0.2); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
    .close-btn { color: rgba(255,255,255,0.8); }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 0; }
    .detail-item { display: flex; align-items: flex-start; gap: 10px; }
    .detail-item mat-icon { color: #666; margin-top: 2px; font-size: 20px; width: 20px; height: 20px; }
    .detail-item label { display: block; font-size: 12px; color: #999; margin-bottom: 2px; }
    .detail-item span:not(.priority-chip):not(.status-chip) { font-size: 14px; color: #333; }

    .priority-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .priority-critical { background: #ffebee; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #e3f2fd; color: #1565c0; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }

    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-paused { background: #fff3e0; color: #e65100; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-archived { background: #f5f5f5; color: #666; }
    .status-upcoming { background: #e3f2fd; color: #1565c0; }
    .status-due_soon { background: #fff3e0; color: #e65100; }
    .status-overdue { background: #ffebee; color: #c62828; }
    .status-skipped { background: #f5f5f5; color: #666; }

    .overdue-text { color: #c62828 !important; font-weight: 600; }
    .due-soon-text { color: #e65100 !important; font-weight: 600; }

    .section { padding: 12px 0; }
    .section h3 { display: flex; align-items: center; gap: 8px; font-size: 15px; color: #333; margin: 0 0 12px; }
    .section h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #666; }
    .description-text { color: #555; line-height: 1.6; margin: 0; white-space: pre-wrap; }

    .action-list { display: flex; flex-direction: column; gap: 8px; }
    .action-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .action-status-icon { color: #bbb; font-size: 20px; width: 20px; height: 20px; }
    .action-status-icon.completed { color: #2e7d32; }
    .action-info { flex: 1; display: flex; flex-direction: column; }
    .action-title { font-size: 14px; color: #333; }
    .action-title.completed-text { text-decoration: line-through; color: #999; }
    .action-assignee { font-size: 12px; color: #999; }
    .action-offset { font-size: 12px; color: #666; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }

    .recipient-list { display: flex; flex-direction: column; gap: 8px; }
    .recipient-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .recipient-item mat-icon { color: #666; font-size: 20px; width: 20px; height: 20px; }
    .recipient-name { font-size: 14px; color: #333; display: block; }
    .recipient-email { font-size: 12px; color: #999; display: block; }
    .notify-badges { display: flex; gap: 4px; margin-left: auto; }
    .notify-badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; }
    .notify-badge.reminder { background: #e3f2fd; color: #1565c0; }
    .notify-badge.overdue { background: #ffebee; color: #c62828; }
    .notify-badge.complete { background: #e8f5e9; color: #2e7d32; }

    .instance-list { display: flex; flex-direction: column; gap: 6px; }
    .instance-item { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
    .inst-date { font-size: 14px; color: #333; min-width: 100px; }
    .inst-completed { font-size: 12px; color: #999; margin-left: auto; }

    .meta-info { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; }
    .meta-info span { font-size: 12px; color: #999; }

    mat-divider { margin: 8px 0; }
  `]
})
export class DeadlineItemViewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeadlineItemDTO,
    private dialogRef: MatDialogRef<DeadlineItemViewDialogComponent>
  ) {}

  formatRecurrence(type: string): string {
    const map: Record<string, string> = {
      'ONE_TIME': 'One Time', 'MONTHLY': 'Monthly', 'QUARTERLY': 'Quarterly',
      'SEMI_ANNUAL': 'Semi-Annual', 'ANNUAL': 'Annual'
    };
    return map[type] || type;
  }
}
