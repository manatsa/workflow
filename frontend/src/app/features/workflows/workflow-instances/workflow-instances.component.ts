import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowInstance, InstanceStatus } from '@core/models/workflow.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-workflow-instances',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="instances-container">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ workflowName }}</h1>
            <p class="subtitle">All submissions for this workflow</p>
          </div>
        </div>
        <button mat-raised-button color="primary" [routerLink]="['/workflows', workflowCode, 'new']">
          <mat-icon>add</mat-icon>
          New Submission
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="table-toolbar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup)="applyFilter()"
                     placeholder="Search by reference number">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilter()">
                <mat-option value="">All</mat-option>
                @for (status of statuses; track status) {
                  <mat-option [value]="status">{{ status }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            <ng-container matColumnDef="referenceNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Reference</th>
              <td mat-cell *matCellDef="let instance">
                <a [routerLink]="['/workflows', workflowCode, 'instances', instance.id]">
                  {{ instance.referenceNumber }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
              <td mat-cell *matCellDef="let instance">{{ instance.title || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="initiatorName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Submitted By</th>
              <td mat-cell *matCellDef="let instance">{{ instance.initiatorName }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let instance">
                <span class="badge" [class]="instance.status.toLowerCase()">
                  {{ instance.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="currentLevel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Current Level</th>
              <td mat-cell *matCellDef="let instance">
                @if (instance.status === 'PENDING') {
                  Level {{ instance.currentLevel || instance.currentApprovalLevel }}
                  @if (instance.totalApproversAtLevel && instance.totalApproversAtLevel > 1) {
                    <br><small class="approver-progress">(Approver {{ (instance.currentApproverOrder || 0) + 1 }} of {{ instance.totalApproversAtLevel }})</small>
                  }
                } @else {
                  -
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Submitted</th>
              <td mat-cell *matCellDef="let instance">
                {{ instance.createdAt | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Updated</th>
              <td mat-cell *matCellDef="let instance">
                {{ instance.updatedAt | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let instance">
                <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Actions">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/workflows', workflowCode, 'instances', instance.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>

                  @if (instance.status === 'DRAFT') {
                    <button mat-menu-item [routerLink]="['/workflows', workflowCode, 'edit', instance.id]">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="submitForApproval(instance)">
                      <mat-icon>send</mat-icon>
                      <span>Submit for Approval</span>
                    </button>
                  }

                  @if (instance.status === 'PENDING') {
                    <button mat-menu-item [routerLink]="['/approvals', instance.id]">
                      <mat-icon>approval</mat-icon>
                      <span>Review</span>
                    </button>
                    <button mat-menu-item (click)="recallSubmission(instance)">
                      <mat-icon>undo</mat-icon>
                      <span>Recall</span>
                    </button>
                  }

                  @if (instance.status === 'REJECTED') {
                    <button mat-menu-item (click)="resubmit(instance)">
                      <mat-icon>replay</mat-icon>
                      <span>Resubmit</span>
                    </button>
                  }

                  <mat-divider></mat-divider>

                  <button mat-menu-item (click)="cloneSubmission(instance)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Duplicate</span>
                  </button>

                  @if (instance.status !== 'APPROVED' && instance.status !== 'REJECTED') {
                    <button mat-menu-item (click)="cancelSubmission(instance)">
                      <mat-icon>cancel</mat-icon>
                      <span>Cancel</span>
                    </button>
                  }

                  @if (instance.status === 'DRAFT' || instance.status === 'CANCELLED') {
                    <button mat-menu-item (click)="deleteSubmission(instance)" class="delete-action">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (dataSource.data.length === 0) {
            <div class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>No submissions found</p>
            </div>
          }

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .instances-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-left h1 { margin: 0; }

    .subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .table-toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .data-table {
      width: 100%;
    }

    .data-table a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .data-table a:hover {
      text-decoration: underline;
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
    .badge.draft { background: #f5f5f5; color: #666; }
    .badge.escalated { background: #e3f2fd; color: #1565c0; }
    .badge.cancelled { background: #fafafa; color: #9e9e9e; }
    .badge.on_hold { background: #f3e5f5; color: #7b1fa2; }

    .delete-action { color: #c62828; }

    .approver-progress {
      color: #666;
      font-size: 0.7rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }
  `]
})
export class WorkflowInstancesComponent implements OnInit, OnDestroy {
  displayedColumns = ['referenceNumber', 'title', 'initiatorName', 'status', 'currentLevel', 'createdAt', 'updatedAt', 'actions'];
  dataSource = new MatTableDataSource<WorkflowInstance>([]);
  searchTerm = '';
  statusFilter = '';
  workflowCode = '';
  workflowName = '';

  statuses = Object.values(InstanceStatus);
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private workflowService: WorkflowService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Subscribe to route params to detect navigation changes
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const newWorkflowCode = params['workflowCode'] || '';
      if (newWorkflowCode !== this.workflowCode || !this.workflowCode) {
        this.workflowCode = newWorkflowCode;
        this.searchTerm = '';
        this.statusFilter = '';
        this.loadWorkflow();
        this.loadInstances();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.createFilter();
  }

  loadWorkflow() {
    this.workflowService.getWorkflowByCode(this.workflowCode).subscribe(res => {
      if (res.success) {
        this.workflowName = res.data.name;
      }
    });
  }

  loadInstances() {
    this.workflowService.getInstancesByWorkflow(this.workflowCode).subscribe(res => {
      if (res.success && res.data) {
        this.dataSource.data = res.data.content || [];
      }
    });
  }

  createFilter(): (data: WorkflowInstance, filter: string) => boolean {
    return (data: WorkflowInstance, filter: string) => {
      const searchStr = (data.referenceNumber || '').toLowerCase();
      const searchTerm = this.searchTerm.toLowerCase();
      const statusMatch = !this.statusFilter || data.status === this.statusFilter;
      const textMatch = !searchTerm || searchStr.includes(searchTerm);
      return statusMatch && textMatch;
    };
  }

  applyFilter() {
    this.dataSource.filter = Date.now().toString();
  }

  submitForApproval(instance: WorkflowInstance) {
    this.workflowService.submitDraftInstance(instance.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Submitted for approval', 'Close', { duration: 3000 });
          this.loadInstances();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to submit', 'Close', { duration: 3000 });
      }
    });
  }

  recallSubmission(instance: WorkflowInstance) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Recall Submission',
        message: `Are you sure you want to recall "${instance.referenceNumber}"? This will return it to draft status.`,
        confirmText: 'Recall',
        cancelText: 'Cancel',
        showReasonInput: true,
        reasonLabel: 'Reason for recall'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workflowService.recallInstance(instance.id, result.reason).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Submission recalled', 'Close', { duration: 3000 });
              this.loadInstances();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to recall', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  resubmit(instance: WorkflowInstance) {
    this.workflowService.resubmitInstance(instance.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Resubmitted for approval', 'Close', { duration: 3000 });
          this.loadInstances();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to resubmit', 'Close', { duration: 3000 });
      }
    });
  }

  cloneSubmission(instance: WorkflowInstance) {
    this.workflowService.cloneInstance(instance.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Submission duplicated', 'Close', { duration: 3000 });
          this.loadInstances();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to duplicate', 'Close', { duration: 3000 });
      }
    });
  }

  cancelSubmission(instance: WorkflowInstance) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Submission',
        message: `Are you sure you want to cancel "${instance.referenceNumber}"?`,
        confirmText: 'Cancel Submission',
        cancelText: 'Keep',
        showReasonInput: true,
        reasonLabel: 'Reason for cancellation'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workflowService.cancelInstance(instance.id, result.reason).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Submission cancelled', 'Close', { duration: 3000 });
              this.loadInstances();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to cancel', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteSubmission(instance: WorkflowInstance) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Submission',
        message: `Are you sure you want to delete "${instance.referenceNumber}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workflowService.deleteInstance(instance.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Submission deleted', 'Close', { duration: 3000 });
              this.loadInstances();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
