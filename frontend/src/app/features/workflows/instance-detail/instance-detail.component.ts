import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkflowService } from '@core/services/workflow.service';
import { SettingService } from '@core/services/setting.service';
import { AuthService } from '@core/services/auth.service';
import { WorkflowInstance, ApprovalHistory, ChildWorkflow, ChildInstance } from '@core/models/workflow.model';
import { AuditLog } from '@core/models/setting.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-instance-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    ClipboardModule
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
          <mat-menu #actionsMenu="matMenu" xPosition="before">
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
            @if (canRecall) {
              <button mat-menu-item (click)="recallSubmission()">
                <mat-icon>undo</mat-icon>
                <span>Recall Submission</span>
              </button>
            }
            <button mat-menu-item (click)="printSubmission()">
              <mat-icon>print</mat-icon>
              <span>Print</span>
            </button>
            <button mat-menu-item (click)="copyReferenceNumber()">
              <mat-icon>content_copy</mat-icon>
              <span>Copy Reference</span>
            </button>
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

              <!-- Parent Instance Link -->
              @if (instance.parentInstanceId) {
                <mat-card class="parent-link-card">
                  <mat-card-content>
                    <div class="info-row">
                      <span class="label">Parent Submission</span>
                      <a class="parent-link" [routerLink]="['/workflows', instance.parentWorkflowCode, 'instances', instance.parentInstanceId]">
                        <mat-icon>link</mat-icon>
                        {{ instance.parentInstanceReferenceNumber }} ({{ instance.parentWorkflowName }})
                      </a>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Sub-Workflows (create child submissions) -->
              @if (childWorkflows.length > 0) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Sub-Workflows</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="sub-workflow-buttons">
                      @for (child of childWorkflows; track child.id) {
                        <button mat-stroked-button color="primary" [routerLink]="['/workflows', child.code, 'new']" [queryParams]="{ parentInstanceId: instance.id }">
                          <mat-icon>{{ child.icon || 'add_circle_outline' }}</mat-icon>
                          {{ child.name }}
                        </button>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Sub-Submissions (only for child workflows WITHOUT screens) -->
              @if (childInstancesWithoutScreens.length > 0) {
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Sub-Submissions</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="child-instances-list">
                      @for (child of childInstancesWithoutScreens; track child.id) {
                        <div class="child-instance-row" [routerLink]="['/workflows', child.workflowCode, 'instances', child.id]">
                          <div class="child-instance-info">
                            <span class="child-ref">{{ child.referenceNumber }}</span>
                            <span class="child-workflow">{{ child.workflowName }}</span>
                            @if (child.title) {
                              <span class="child-title">{{ child.title }}</span>
                            }
                          </div>
                          <div class="child-instance-meta">
                            <span class="badge" [class]="child.status.toLowerCase()">{{ child.status }}</span>
                            <span class="child-date">{{ child.createdAt | date:'short' }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- Attachments Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              Attachments
              @if (instance.attachments && instance.attachments.length > 0) {
                <span class="tab-badge">{{ instance.attachments.length }}</span>
              }
            </ng-template>
            <div class="tab-content">
              @if (instance.attachments && instance.attachments.length > 0) {
                <mat-card>
                  <mat-card-content>
                    <div class="attachments-list">
                      @for (attachment of instance.attachments; track attachment.id) {
                        <div class="attachment-item">
                          <mat-icon>description</mat-icon>
                          <a class="attachment-link" (click)="downloadAttachment(attachment)">{{ attachment.originalFileName }}</a>
                          <span class="size">({{ formatFileSize(attachment.fileSize) }})</span>
                          <button mat-icon-button (click)="downloadAttachment(attachment)">
                            <mat-icon>download</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" (click)="deleteAttachment(attachment)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              } @else {
                <mat-card>
                  <mat-card-content>
                    <div class="empty-state">
                      <mat-icon>attach_file</mat-icon>
                      <p>No attachments</p>
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
                      <ng-container matColumnDef="actionDate">
                        <th mat-header-cell *matHeaderCellDef>Date</th>
                        <td mat-cell *matCellDef="let log">{{ log.actionDate | date:'medium' }}</td>
                      </ng-container>

                      <ng-container matColumnDef="action">
                        <th mat-header-cell *matHeaderCellDef>Action</th>
                        <td mat-cell *matCellDef="let log">
                          <span class="badge">{{ log.action }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="userFullName">
                        <th mat-header-cell *matHeaderCellDef>User</th>
                        <td mat-cell *matCellDef="let log">{{ log.userFullName || log.username }}</td>
                      </ng-container>

                      <ng-container matColumnDef="summary">
                        <th mat-header-cell *matHeaderCellDef>Details</th>
                        <td mat-cell *matCellDef="let log">{{ log.summary || log.details }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="auditColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: auditColumns;"></tr>
                    </table>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Dynamic tabs for child workflows with screens -->
          @for (childWf of childWorkflowsWithScreens; track childWf.id) {
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon style="margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">{{ childWf.icon || 'description' }}</mat-icon>
                {{ childWf.name }}
                @if (getChildInstancesForWorkflow(childWf.code).length > 0) {
                  <span class="tab-badge">{{ getChildInstancesForWorkflow(childWf.code).length }}</span>
                }
              </ng-template>
              <div class="tab-content">
                <div class="child-tab-header">
                  <button mat-stroked-button color="primary" [routerLink]="['/workflows', childWf.code, 'new']" [queryParams]="{ parentInstanceId: instance.id }">
                    <mat-icon>add</mat-icon>
                    New Submission
                  </button>
                </div>
                @if (getChildInstancesForWorkflow(childWf.code).length === 0) {
                  <div class="empty-state">
                    <mat-icon>inbox</mat-icon>
                    <p>No submissions yet for {{ childWf.name }}</p>
                  </div>
                } @else {
                  <div class="child-instances-list">
                    @for (child of getChildInstancesForWorkflow(childWf.code); track child.id) {
                      <div class="child-instance-row" [routerLink]="['/workflows', child.workflowCode, 'instances', child.id]">
                        <div class="child-instance-info">
                          <span class="child-ref">{{ child.referenceNumber }}</span>
                          @if (child.title) {
                            <span class="child-title">{{ child.title }}</span>
                          }
                        </div>
                        <div class="child-instance-meta">
                          <span class="badge" [class]="child.status.toLowerCase()">{{ child.status }}</span>
                          <span class="child-date">{{ child.createdAt | date:'short' }}</span>
                          <a class="view-link" [routerLink]="['/workflows', child.workflowCode, 'instances', child.id]">
                            <mat-icon>open_in_new</mat-icon>
                            View
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>

        <!-- Approval Action Panel -->
        @if (canTakeAction && instance.isCurrentApprover) {
          <mat-card class="approval-action-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>gavel</mat-icon>
                Take Action
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Comments</mat-label>
                <textarea matInput [(ngModel)]="approvalComments" rows="3"
                          placeholder="Add your comments..."></textarea>
                @if (instance.commentsMandatory) {
                  <mat-hint>Comments are required for all actions</mat-hint>
                } @else if (instance.commentsMandatoryOnReject || instance.commentsMandatoryOnEscalate) {
                  <mat-hint>Comments required for:
                    {{ instance.commentsMandatoryOnReject ? 'Reject' : '' }}{{ instance.commentsMandatoryOnReject && instance.commentsMandatoryOnEscalate ? ', ' : '' }}{{ instance.commentsMandatoryOnEscalate ? 'Escalate' : '' }}
                  </mat-hint>
                }
              </mat-form-field>
              <div class="approval-action-buttons">
                <button mat-raised-button color="primary" (click)="approveSubmission()"
                        [disabled]="submittingAction">
                  <mat-icon>check</mat-icon>
                  Approve
                </button>
                <button mat-stroked-button color="primary" (click)="escalateSubmission()"
                        [disabled]="submittingAction">
                  <mat-icon>arrow_upward</mat-icon>
                  Escalate
                </button>
                <button mat-raised-button color="warn" (click)="rejectSubmission()"
                        [disabled]="submittingAction">
                  <mat-icon>close</mat-icon>
                  Reject
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Edit Action -->
        @if (canEdit) {
          <div class="action-bar">
            <button mat-raised-button color="accent" (click)="editSubmission()">
              <mat-icon>edit</mat-icon>
              Edit Submission
            </button>
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
      position: relative;
      z-index: 1;
    }

    .header-info {
      flex: 1;
      min-width: 0;
    }

    .header button[mat-icon-button] {
      flex-shrink: 0;
      z-index: 2;
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

    .tab-badge {
      background: #1976d2;
      color: white;
      border-radius: 12px;
      padding: 0 6px;
      font-size: 0.7rem;
      margin-left: 6px;
      min-width: 18px;
      text-align: center;
      display: inline-block;
      line-height: 18px;
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

    .attachment-link {
      flex: 1;
      color: #1976d2;
      text-decoration: underline;
      cursor: pointer;
    }

    .attachment-link:hover {
      color: #1565c0;
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
    .parent-link-card { margin-bottom: 1rem; }
    .parent-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #1976d2;
      text-decoration: none;
      cursor: pointer;
    }
    .parent-link:hover { text-decoration: underline; }
    .sub-workflow-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .child-instances-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .child-instance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .child-instance-row:hover { background: #f5f5f5; }
    .child-instance-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .child-ref { font-weight: 500; }
    .child-workflow { font-size: 0.85rem; color: #666; }
    .child-title { font-size: 0.85rem; color: #888; }
    .child-instance-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .child-date { font-size: 0.85rem; color: #999; }
    .view-link {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: #1976d2;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }
    .view-link mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .view-link:hover { text-decoration: underline; }
    .child-tab-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
    .approval-action-card {
      margin-top: 1rem;
      border: 2px solid #1976d2;
    }
    .approval-action-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .full-width { width: 100%; }
    .approval-action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `]
})
export class InstanceDetailComponent implements OnInit {
  instance: WorkflowInstance | null = null;
  approvalHistory: ApprovalHistory[] = [];
  auditLogs: AuditLog[] = [];
  childWorkflows: ChildWorkflow[] = [];
  loading = true;
  canTakeAction = false;
  canEdit = false;
  canDelete = false;
  canRecall = false;
  currentUserId: string = '';
  approvalComments: string = '';
  submittingAction = false;

  auditColumns = ['actionDate', 'action', 'userFullName', 'summary'];

  get childWorkflowsWithScreens(): ChildWorkflow[] {
    return this.childWorkflows.filter(cw => (cw.screenCount ?? 0) >= 1);
  }

  get childWorkflowCodesWithScreens(): Set<string> {
    return new Set(this.childWorkflowsWithScreens.map(cw => cw.code));
  }

  get childInstancesWithoutScreens(): ChildInstance[] {
    if (!this.instance?.childInstances) return [];
    const codesWithScreens = this.childWorkflowCodesWithScreens;
    return this.instance.childInstances.filter(ci => !codesWithScreens.has(ci.workflowCode));
  }

  getChildInstancesForWorkflow(workflowCode: string): ChildInstance[] {
    if (!this.instance?.childInstances) return [];
    return this.instance.childInstances.filter(ci => ci.workflowCode === workflowCode);
  }

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
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {
    this.currentUserId = this.authService.currentUser?.userId || '';
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const instanceId = params.get('instanceId');
      if (instanceId) {
        this.loading = true;
        this.instance = null;
        this.approvalHistory = [];
        this.auditLogs = [];
        this.childWorkflows = [];
        this.loadInstance(instanceId);
      }
    });
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
          // Can recall if pending and current user is the initiator
          this.canRecall = res.data.status === 'PENDING' && res.data.initiatorId === this.currentUserId;
          this.loadChildWorkflows(res.data.workflowId);
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

  loadChildWorkflows(workflowId: string) {
    this.workflowService.getChildWorkflows(workflowId).subscribe(res => {
      if (res.success) {
        this.childWorkflows = res.data || [];
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

  deleteAttachment(attachment: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Attachment',
        message: `Are you sure you want to delete "${attachment.originalFileName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.workflowService.deleteAttachment(attachment.id).subscribe({
          next: () => {
            this.instance!.attachments = this.instance!.attachments.filter(
              (a: any) => a.id !== attachment.id
            );
            this.snackBar.open('Attachment deleted', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to delete attachment', 'Close', { duration: 3000 });
          }
        });
      }
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

  recallSubmission() {
    if (!this.instance) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Recall Submission',
        message: `Are you sure you want to recall submission "${this.instance.referenceNumber}"? This will remove it from the approval queue.`,
        confirmText: 'Recall',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.instance) {
        this.workflowService.recallInstance(this.instance.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Submission recalled successfully', 'Close', { duration: 3000 });
              this.loadInstance(this.instance!.id);
            }
          },
          error: () => {
            this.snackBar.open('Failed to recall submission', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  printSubmission() {
    window.print();
  }

  copyReferenceNumber() {
    if (this.instance) {
      this.clipboard.copy(this.instance.referenceNumber);
      this.snackBar.open('Reference number copied to clipboard', 'Close', { duration: 2000 });
    }
  }

  approveSubmission() {
    this.submitApprovalAction('APPROVE');
  }

  escalateSubmission() {
    this.submitApprovalAction('ESCALATE');
  }

  rejectSubmission() {
    this.submitApprovalAction('REJECT');
  }

  private submitApprovalAction(action: string) {
    if (!this.instance) return;

    // Check mandatory comments based on workflow configuration
    const commentsEmpty = !this.approvalComments?.trim();
    if (commentsEmpty) {
      if (this.instance.commentsMandatory) {
        this.snackBar.open('Comments are required for this workflow', 'Close', { duration: 3000 });
        return;
      }
      if (action === 'REJECT' && this.instance.commentsMandatoryOnReject) {
        this.snackBar.open('Comments are required when rejecting', 'Close', { duration: 3000 });
        return;
      }
      if (action === 'ESCALATE' && this.instance.commentsMandatoryOnEscalate) {
        this.snackBar.open('Comments are required when escalating', 'Close', { duration: 3000 });
        return;
      }
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0) + action.slice(1).toLowerCase()} Submission`,
        message: `Are you sure you want to ${action.toLowerCase()} submission "${this.instance.referenceNumber}"?`,
        confirmText: action.charAt(0) + action.slice(1).toLowerCase(),
        cancelText: 'Cancel',
        confirmColor: action === 'REJECT' ? 'warn' : 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.instance) {
        this.submittingAction = true;
        this.workflowService.submitApproval({
          instanceId: this.instance.id,
          action,
          comments: this.approvalComments || undefined
        }).subscribe({
          next: (res) => {
            this.submittingAction = false;
            if (res.success) {
              this.snackBar.open(`Submission ${action.toLowerCase()}d successfully`, 'Close', { duration: 3000 });
              this.approvalComments = '';
              this.loadInstance(this.instance!.id);
            }
          },
          error: (err) => {
            this.submittingAction = false;
            this.snackBar.open(err.error?.message || `Failed to ${action.toLowerCase()} submission`, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
