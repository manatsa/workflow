import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkflowService } from '@core/services/workflow.service';
import { SettingService } from '@core/services/setting.service';
import { WorkflowInstance, ApprovalHistory } from '@core/models/workflow.model';
import { AuditLog } from '@core/models/setting.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-instance-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="instance-detail-container">
      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (instance) {
        <div class="header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ instance.referenceNumber }}</h1>
            <p class="subtitle">{{ instance.workflowName }}</p>
          </div>
          <span class="badge" [class]="instance.status.toLowerCase()">{{ instance.status }}</span>
          <button mat-icon-button [matMenuTriggerFor]="actionsMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #actionsMenu="matMenu">
            @if (canEdit) {
              <button mat-menu-item (click)="editSubmission()">
                <mat-icon>edit</mat-icon>
                <span>Edit Submission</span>
              </button>
            }
            @if (canDelete) {
              <button mat-menu-item (click)="deleteSubmission()">
                <mat-icon>delete</mat-icon>
                <span>Delete Submission</span>
              </button>
            }
          </mat-menu>
        </div>

        <mat-tab-group>
          <!-- Details Tab -->
          <mat-tab label="Details">
            <div class="tab-content">
              <div class="details-grid">
                <mat-card class="info-card">
                  <mat-card-header>
                    <mat-card-title>Submission Info</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Reference Number</span>
                      <span class="value">{{ instance.referenceNumber }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Submitted By</span>
                      <span class="value">{{ instance.initiatorName }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Submitted At</span>
                      <span class="value">{{ instance.createdAt | date:'medium' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Status</span>
                      <span class="badge" [class]="instance.status.toLowerCase()">{{ instance.status }}</span>
                    </div>
                    @if (instance.status === 'PENDING') {
                      <div class="info-row">
                        <span class="label">Current Approval Level</span>
                        <span class="value">Level {{ instance.currentApprovalLevel }}</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <mat-card class="data-card">
                  <mat-card-header>
                    <mat-card-title>Form Data</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @for (field of getFieldValuesArray(); track field.fieldName) {
                      <div class="info-row">
                        <span class="label">{{ field.fieldLabel }}</span>
                        <span class="value">{{ field.value || '-' }}</span>
                      </div>
                    }
                    @if (instance.comments) {
                      <mat-divider></mat-divider>
                      <div class="info-row">
                        <span class="label">Comments</span>
                        <span class="value">{{ instance.comments }}</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Attachments -->
              @if (instance.attachments && instance.attachments.length > 0) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Attachments</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="attachments-list">
                      @for (attachment of instance.attachments; track attachment.id) {
                        <div class="attachment-item">
                          <mat-icon>description</mat-icon>
                          <span class="name">{{ attachment.originalFileName }}</span>
                          <span class="size">({{ formatFileSize(attachment.fileSize) }})</span>
                          <button mat-icon-button (click)="downloadAttachment(attachment)">
                            <mat-icon>download</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- Approval History Tab -->
          <mat-tab label="Approval History">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  @if (approvalHistory.length === 0) {
                    <div class="empty-state">
                      <mat-icon>history</mat-icon>
                      <p>No approval actions yet</p>
                    </div>
                  } @else {
                    <div class="timeline">
                      @for (history of approvalHistory; track history.id) {
                        <div class="timeline-item">
                          <div class="timeline-marker" [class]="history.action.toLowerCase()">
                            @switch (history.action) {
                              @case ('APPROVED') {
                                <mat-icon>check</mat-icon>
                              }
                              @case ('REJECTED') {
                                <mat-icon>close</mat-icon>
                              }
                              @case ('ESCALATED') {
                                <mat-icon>arrow_upward</mat-icon>
                              }
                              @case ('RECALLED') {
                                <mat-icon>undo</mat-icon>
                              }
                              @default {
                                <mat-icon>pending</mat-icon>
                              }
                            }
                          </div>
                          <div class="timeline-content">
                            <div class="timeline-header">
                              <strong>{{ history.approverName }}</strong>
                              <span class="badge" [class]="history.action.toLowerCase()">{{ history.action }}</span>
                            </div>
                            <div class="timeline-meta">
                              Level {{ history.level }} - {{ history.createdAt | date:'medium' }}
                            </div>
                            @if (history.comments) {
                              <div class="timeline-comments">
                                "{{ history.comments }}"
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Audit Tab -->
          <mat-tab label="Audit">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  @if (auditLogs.length === 0) {
                    <div class="empty-state">
                      <mat-icon>receipt_long</mat-icon>
                      <p>No audit logs available</p>
                    </div>
                  } @else {
                    <table mat-table [dataSource]="auditLogs" class="audit-table">
                      <ng-container matColumnDef="createdAt">
                        <th mat-header-cell *matHeaderCellDef>Date</th>
                        <td mat-cell *matCellDef="let log">{{ log.createdAt | date:'medium' }}</td>
                      </ng-container>

                      <ng-container matColumnDef="action">
                        <th mat-header-cell *matHeaderCellDef>Action</th>
                        <td mat-cell *matCellDef="let log">
                          <span class="badge">{{ log.action }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="performedBy">
                        <th mat-header-cell *matHeaderCellDef>User</th>
                        <td mat-cell *matCellDef="let log">{{ log.performedBy }}</td>
                      </ng-container>

                      <ng-container matColumnDef="details">
                        <th mat-header-cell *matHeaderCellDef>Details</th>
                        <td mat-cell *matCellDef="let log">{{ log.details }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="auditColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: auditColumns;"></tr>
                    </table>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Action Buttons -->
        @if (canTakeAction || canEdit) {
          <div class="action-bar">
            @if (canEdit) {
              <button mat-raised-button color="accent" (click)="editSubmission()">
                <mat-icon>edit</mat-icon>
                Edit Submission
              </button>
            }
            @if (canTakeAction) {
              <button mat-raised-button color="primary" [routerLink]="['/approvals', instance.id]">
                <mat-icon>approval</mat-icon>
                Review & Approve
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .instance-detail-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header-info {
      flex: 1;
    }

    .header-info h1 { margin: 0; }

    .subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .tab-content {
      padding: 1rem 0;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      color: #666;
      font-size: 0.875rem;
    }

    .info-row .value {
      font-weight: 500;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.pending { background: #fff3e0; color: #e65100; }
    .badge.approved { background: #e8f5e9; color: #2e7d32; }
    .badge.rejected { background: #ffebee; color: #c62828; }
    .badge.escalated { background: #e3f2fd; color: #1565c0; }
    .badge.recalled { background: #fce4ec; color: #c2185b; }
    .badge.cancelled { background: #f5f5f5; color: #666; }
    .badge.on_hold { background: #fff8e1; color: #f57f17; }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .attachment-item .name {
      flex: 1;
    }

    .attachment-item .size {
      color: #666;
      font-size: 0.75rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .timeline {
      padding: 1rem 0;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
    }

    .timeline-marker {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }

    .timeline-marker.approved {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .timeline-marker.rejected {
      background: #ffebee;
      color: #c62828;
    }

    .timeline-marker.escalated {
      background: #e3f2fd;
      color: #1565c0;
    }

    .timeline-marker.recalled {
      background: #fce4ec;
      color: #c2185b;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .timeline-meta {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .timeline-comments {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-style: italic;
    }

    .audit-table {
      width: 100%;
    }

    .action-bar {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 0;
      margin-top: 1rem;
      border-top: 1px solid #eee;
    }
  `]
})
export class InstanceDetailComponent implements OnInit {
  instance: WorkflowInstance | null = null;
  approvalHistory: ApprovalHistory[] = [];
  auditLogs: AuditLog[] = [];
  loading = true;
  canTakeAction = false;
  canEdit = false;
  canDelete = false;

  auditColumns = ['createdAt', 'action', 'performedBy', 'details'];

  getFieldValuesArray(): { fieldName: string; fieldLabel: string; value: any }[] {
    if (!this.instance?.fieldValues) return [];
    if (Array.isArray(this.instance.fieldValues)) {
      return this.instance.fieldValues;
    }
    // Convert Record<string, any> to array format
    return Object.entries(this.instance.fieldValues).map(([key, value]) => ({
      fieldName: key,
      fieldLabel: key,
      value: value
    }));
  }

  constructor(
    private workflowService: WorkflowService,
    private settingService: SettingService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const instanceId = this.route.snapshot.paramMap.get('instanceId');
    if (instanceId) {
      this.loadInstance(instanceId);
    }
  }

  loadInstance(id: string) {
    this.workflowService.getInstance(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.instance = res.data;
          this.approvalHistory = res.data.approvalHistory || [];
          this.canTakeAction = res.data.status === 'PENDING';
          this.canEdit = res.data.status === 'DRAFT' || res.data.status === 'RECALLED';
          this.canDelete = res.data.status === 'DRAFT' || res.data.status === 'RECALLED';
          this.loadAuditLogs(id);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadAuditLogs(instanceId: string) {
    this.settingService.getAuditLogs('WorkflowInstance', instanceId).subscribe(res => {
      if (res.success) {
        this.auditLogs = res.data;
      }
    });
  }

  goBack() {
    if (this.instance) {
      this.router.navigate(['/workflows', this.instance.workflowCode, 'instances']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadAttachment(attachment: any) {
    this.workflowService.downloadAttachment(attachment.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalFileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  editSubmission() {
    if (this.instance) {
      this.router.navigate(['/workflows', this.instance.workflowCode, 'edit', this.instance.id]);
    }
  }

  deleteSubmission() {
    if (!this.instance) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Submission',
        message: `Are you sure you want to delete submission "${this.instance.referenceNumber}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.instance) {
        this.workflowService.deleteInstance(this.instance.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Submission deleted successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/my-submissions']);
            }
          },
          error: () => {
            this.snackBar.open('Failed to delete submission', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
