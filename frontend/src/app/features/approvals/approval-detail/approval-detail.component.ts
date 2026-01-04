import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowInstance, ApprovalHistory } from '@core/models/workflow.model';

@Component({
  selector: 'app-approval-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="approval-detail-container">
      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (instance) {
        <div class="header">
          <button mat-icon-button routerLink="/approvals">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ instance.referenceNumber }}</h1>
            <p class="subtitle">{{ instance.workflowName }} - Approval Request</p>
          </div>
          <span class="badge pending">Pending Your Approval</span>
        </div>

        <div class="content-grid">
          <div class="main-content">
            <!-- Submission Details -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Submission Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="label">Submitted By</span>
                    <span class="value">{{ instance.initiatorName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Submitted At</span>
                    <span class="value">{{ instance.createdAt | date:'medium' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Current Level</span>
                    <span class="value">Level {{ instance.currentApprovalLevel }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Form Data -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Form Data</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @for (field of getFieldValuesArray(); track field.fieldName) {
                  <div class="field-row">
                    <span class="field-label">{{ field.fieldLabel }}</span>
                    <span class="field-value">{{ field.value || '-' }}</span>
                  </div>
                }
              </mat-card-content>
            </mat-card>

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

            <!-- Submitter Comments -->
            @if (instance.comments) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Submitter Comments</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="comments-text">{{ instance.comments }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>

          <div class="sidebar">
            <!-- Approval Action -->
            <mat-card class="action-card">
              <mat-card-header>
                <mat-card-title>Take Action</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="actionForm">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Comments</mat-label>
                    <textarea matInput formControlName="comments" rows="4"
                              placeholder="Add your comments..."></textarea>
                    @if (requireComment && actionForm.get('comments')?.hasError('required')) {
                      <mat-error>Comments are required</mat-error>
                    }
                  </mat-form-field>
                </form>

                <div class="action-buttons">
                  <button mat-raised-button color="primary" (click)="approve()"
                          [disabled]="submitting">
                    <mat-icon>check</mat-icon>
                    Approve
                  </button>

                  @if (canEscalate) {
                    <button mat-stroked-button color="primary" (click)="escalate()"
                            [disabled]="submitting">
                      <mat-icon>arrow_upward</mat-icon>
                      Escalate
                    </button>
                  }

                  <button mat-raised-button color="warn" (click)="reject()"
                          [disabled]="submitting">
                    <mat-icon>close</mat-icon>
                    Reject
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Approval History -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Approval History</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (approvalHistory.length === 0) {
                  <p class="no-history">No previous approvals</p>
                } @else {
                  <div class="history-list">
                    @for (history of approvalHistory; track history.id) {
                      <div class="history-item">
                        <div class="history-header">
                          <span class="approver">{{ history.approverName }}</span>
                          <span class="badge" [class]="history.action.toLowerCase()">
                            {{ history.action }}
                          </span>
                        </div>
                        <div class="history-meta">
                          Level {{ history.level }} - {{ history.createdAt | date:'short' }}
                        </div>
                        @if (history.comments) {
                          <div class="history-comments">"{{ history.comments }}"</div>
                        }
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- Approval Chain -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Approval Chain</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="approval-chain">
                  @for (approver of approvalChain; track approver.level) {
                    <div class="chain-item" [class.current]="approver.level === instance.currentApprovalLevel"
                         [class.completed]="approver.level < instance.currentApprovalLevel">
                      <div class="chain-marker">
                        @if (approver.level < instance.currentApprovalLevel) {
                          <mat-icon>check_circle</mat-icon>
                        } @else if (approver.level === instance.currentApprovalLevel) {
                          <mat-icon>pending</mat-icon>
                        } @else {
                          <mat-icon>radio_button_unchecked</mat-icon>
                        }
                      </div>
                      <div class="chain-info">
                        <strong>Level {{ approver.level }}</strong>
                        <span>{{ approver.label }}</span>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .approval-detail-container {
      padding: 1rem;
      max-width: 1400px;
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

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.pending { background: #fff3e0; color: #e65100; }
    .badge.approved { background: #e8f5e9; color: #2e7d32; }
    .badge.rejected { background: #ffebee; color: #c62828; }
    .badge.escalated { background: #e3f2fd; color: #1565c0; }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1rem;
    }

    .main-content mat-card {
      margin-bottom: 1rem;
    }

    .sidebar mat-card {
      margin-bottom: 1rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item .label {
      font-size: 0.75rem;
      color: #666;
    }

    .detail-item .value {
      font-weight: 500;
    }

    .field-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .field-row:last-child {
      border-bottom: none;
    }

    .field-label {
      color: #666;
    }

    .field-value {
      font-weight: 500;
    }

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

    .attachment-item .name { flex: 1; }
    .attachment-item .size { color: #666; font-size: 0.75rem; }

    .comments-text {
      margin: 0;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-style: italic;
    }

    .action-card {
      border: 2px solid #1976d2;
    }

    .full-width { width: 100%; }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-buttons button {
      width: 100%;
    }

    .no-history {
      color: #666;
      text-align: center;
      font-style: italic;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .history-item {
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .history-header .approver {
      font-weight: 500;
    }

    .history-meta {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .history-comments {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-style: italic;
    }

    .approval-chain {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .chain-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .chain-item.current {
      background: #fff3e0;
    }

    .chain-item.completed {
      background: #e8f5e9;
    }

    .chain-marker mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .chain-item.completed .chain-marker mat-icon {
      color: #2e7d32;
    }

    .chain-item.current .chain-marker mat-icon {
      color: #e65100;
    }

    .chain-info {
      display: flex;
      flex-direction: column;
    }

    .chain-info span {
      font-size: 0.75rem;
      color: #666;
    }
  `]
})
export class ApprovalDetailComponent implements OnInit {
  instance: WorkflowInstance | null = null;
  approvalHistory: ApprovalHistory[] = [];
  approvalChain: any[] = [];
  actionForm: FormGroup;
  loading = true;
  submitting = false;
  requireComment = false;
  canEscalate = true;

  getFieldValuesArray(): { fieldName: string; fieldLabel: string; value: any }[] {
    if (!this.instance?.fieldValues) return [];
    if (Array.isArray(this.instance.fieldValues)) {
      return this.instance.fieldValues;
    }
    return Object.entries(this.instance.fieldValues).map(([key, value]) => ({
      fieldName: key,
      fieldLabel: key,
      value: value
    }));
  }

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.actionForm = this.fb.group({
      comments: ['']
    });
  }

  ngOnInit() {
    const instanceId = this.route.snapshot.paramMap.get('id');
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
          this.loadWorkflowApprovers(res.data.workflowId);
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load approval request', 'Close', { duration: 3000 });
      }
    });
  }

  loadWorkflowApprovers(workflowId: string) {
    this.workflowService.getWorkflow(workflowId).subscribe(res => {
      if (res.success) {
        this.approvalChain = res.data.approvers || [];
        const currentApprover = this.approvalChain.find(
          a => a.level === this.instance?.currentApprovalLevel
        );
        if (currentApprover) {
          this.requireComment = currentApprover.requireComment;
          this.canEscalate = currentApprover.canEscalate;
          if (this.requireComment) {
            this.actionForm.get('comments')?.setValidators(Validators.required);
          }
        }
      }
    });
  }

  approve() {
    this.submitAction('APPROVE');
  }

  escalate() {
    this.submitAction('ESCALATE');
  }

  reject() {
    this.submitAction('REJECT');
  }

  submitAction(action: string) {
    if (this.requireComment && !this.actionForm.value.comments?.trim()) {
      this.snackBar.open('Comments are required', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const data = {
      instanceId: this.instance!.id,
      action,
      comments: this.actionForm.value.comments
    };

    this.workflowService.submitApproval(data).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.snackBar.open(`Request ${action.toLowerCase()}d successfully`, 'Close', { duration: 3000 });
          this.router.navigate(['/approvals']);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Action failed', 'Close', { duration: 3000 });
      }
    });
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
}
