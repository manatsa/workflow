import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowInstance } from '@core/models/workflow.model';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="reject-dialog">
      <h2>Reject Request</h2>
      <p>Please provide a reason for rejection.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Rejection Reason</mat-label>
        <textarea matInput [(ngModel)]="comments" rows="3" placeholder="Enter reason for rejection..."></textarea>
      </mat-form-field>
      <div class="dialog-actions">
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="warn" [disabled]="!comments?.trim()" (click)="dialogRef.close(comments)">
          <mat-icon>close</mat-icon> Reject
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reject-dialog { padding: 20px; min-width: 350px; }
    .reject-dialog h2 { margin: 0 0 8px; }
    .reject-dialog p { color: #666; margin: 0 0 16px; }
    .full-width { width: 100%; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .dialog-actions button mat-icon { margin-right: 4px; }
  `]
})
export class RejectDialogComponent {
  comments = '';
  constructor(public dialogRef: MatDialogRef<RejectDialogComponent>) {}
}

@Component({
  selector: 'app-approval-list',
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
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule],
  template: `
    <div class="approval-list-container">
      <div class="header">
        <h1>Pending Approvals</h1>
        <div class="header-stats">
          <mat-chip>{{ totalElements }} pending</mat-chip>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="table-toolbar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup)="applyFilter()"
                     placeholder="Search by reference or workflow">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            <ng-container matColumnDef="referenceNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Reference</th>
              <td mat-cell *matCellDef="let item">
                <a [routerLink]="['/approvals', item.id]" class="reference-link">
                  {{ item.referenceNumber }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
              <td mat-cell *matCellDef="let item">{{ item.title || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="workflowName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Workflow</th>
              <td mat-cell *matCellDef="let item">
                <div class="workflow-info">
                  <mat-icon>{{ item.workflowIcon || 'description' }}</mat-icon>
                  <span>{{ item.workflowName }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="initiatorName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Submitted By</th>
              <td mat-cell *matCellDef="let item">{{ item.initiatorName }}</td>
            </ng-container>

            <ng-container matColumnDef="currentApprovalLevel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Level</th>
              <td mat-cell *matCellDef="let item">
                Level {{ item.currentApprovalLevel }}
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Submitted</th>
              <td mat-cell *matCellDef="let item">
                {{ item.createdAt | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item" (click)="$event.stopPropagation()">
                <div class="action-buttons">
                  <button mat-raised-button matTooltip="Review Submission" color="primary" [routerLink]="['/workflows', item.workflowCode, 'instances', item.id]">
                    Review
                  </button>
                  <button mat-raised-button matTooltip="Approve" class="btn-approve" (click)="quickApprove(item)" [disabled]="item._processing">
                    Approve
                  </button>
                  <button mat-raised-button matTooltip="Escalate" class="btn-escalate" (click)="quickEscalate(item)" [disabled]="item._processing">
                    Escalate
                  </button>
                  <button mat-raised-button matTooltip="Reject" class="btn-reject" (click)="quickReject(item)" [disabled]="item._processing">
                    Reject
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewSubmission(row)"></tr>
          </table>

          @if (dataSource.data.length === 0) {
            <div class="empty-state">
              <mat-icon>thumb_up</mat-icon>
              <h3>All Caught Up!</h3>
              <p>You have no pending approvals at this time.</p>
            </div>
          }

          <mat-paginator [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[10, 25, 50, 100]"
                         (page)="onPageChange($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .approval-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-toolbar {
      margin-bottom: 1rem;
    }

    .search-field {
      width: 400px;
    }

    .data-table {
      width: 100%;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f5f5f5;
    }

    .reference-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .reference-link:hover {
      text-decoration: underline;
    }

    .workflow-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .workflow-info mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: nowrap;
    }

    .action-buttons button {
      font-size: 11px;
      line-height: 24px;
      min-width: unset;
      padding: 0 8px;
    }

    .btn-approve { background-color: #4caf50 !important; color: white !important; }
    .btn-approve:hover { background-color: #388e3c !important; }
    .btn-escalate { background-color: #ff9800 !important; color: white !important; }
    .btn-escalate:hover { background-color: #f57c00 !important; }
    .btn-reject { background-color: #f44336 !important; color: white !important; }
    .btn-reject:hover { background-color: #d32f2f !important; }
    .btn-approve:disabled, .btn-escalate:disabled, .btn-reject:disabled { opacity: 0.5; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #666;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
      opacity: 0.7;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      margin: 0;
    }
  `]
})
export class ApprovalListComponent implements OnInit {
  displayedColumns = ['title', 'workflowName', 'initiatorName', 'currentApprovalLevel', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<WorkflowInstance>([]);
  searchTerm = '';
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private workflowService: WorkflowService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadApprovals();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadApprovals() {
    this.workflowService.getPendingApprovals(this.currentPage, this.pageSize).subscribe(res => {
      if (res.success) {
        this.dataSource.data = res.data.content;
        this.totalElements = res.data.totalElements;
      }
    });
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadApprovals();
  }

  viewSubmission(item: any) {
    this.router.navigate(['/workflows', item.workflowCode, 'instances', item.id]);
  }

  quickApprove(item: any) {
    item._processing = true;
    // Seal is resolved automatically by backend: workflow stamp → default setting stamp
    this.workflowService.submitApproval({
      instanceId: item.id,
      action: 'APPROVE',
      comments: 'Approved'
    }).subscribe({
      next: (res) => {
        item._processing = false;
        if (res.success) {
          this.snackBar.open('Request approved successfully', 'Close', { duration: 3000 });
          this.loadApprovals();
        } else {
          this.snackBar.open(res.message || 'Failed to approve', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        item._processing = false;
        this.snackBar.open(err.error?.message || 'Failed to approve', 'Close', { duration: 3000 });
      }
    });
  }

  quickEscalate(item: any) {
    item._processing = true;
    this.workflowService.submitApproval({ instanceId: item.id, action: 'ESCALATE', comments: 'Escalated' }).subscribe({
      next: (res) => {
        item._processing = false;
        if (res.success) {
          this.snackBar.open('Request escalated successfully', 'Close', { duration: 3000 });
          this.loadApprovals();
        } else {
          this.snackBar.open(res.message || 'Failed to escalate', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        item._processing = false;
        this.snackBar.open(err.error?.message || 'Failed to escalate', 'Close', { duration: 3000 });
      }
    });
  }

  quickReject(item: any) {
    const dialogRef = this.dialog.open(RejectDialogComponent, { width: '420px' });
    dialogRef.afterClosed().subscribe(comments => {
      if (comments) {
        item._processing = true;
        this.workflowService.submitApproval({ instanceId: item.id, action: 'REJECT', comments }).subscribe({
          next: (res) => {
            item._processing = false;
            if (res.success) {
              this.snackBar.open('Request rejected', 'Close', { duration: 3000 });
              this.loadApprovals();
            } else {
              this.snackBar.open(res.message || 'Failed to reject', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            item._processing = false;
            this.snackBar.open(err.error?.message || 'Failed to reject', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
