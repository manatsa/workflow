import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowInstance, InstanceStatus } from '@core/models/workflow.model';

@Component({
  selector: 'app-my-submissions',
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
    MatMenuModule
  ],
  template: `
    <div class="my-submissions-container">
      <div class="header">
        <h1>My Submissions</h1>
        <div class="header-stats">
          <mat-chip>{{ totalElements }} total</mat-chip>
        </div>
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
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadSubmissions()">
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
              <td mat-cell *matCellDef="let item">
                <a [routerLink]="['/workflows', item.workflowCode, 'instances', item.id]" class="reference-link">
                  {{ item.referenceNumber }}
                </a>
              </td>
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

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let item">
                <span class="badge" [class]="item.status.toLowerCase()">
                  {{ item.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="currentApprovalLevel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Current Level</th>
              <td mat-cell *matCellDef="let item">
                @if (item.status === 'PENDING') {
                  Level {{ item.currentApprovalLevel }}
                } @else {
                  -
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Submitted</th>
              <td mat-cell *matCellDef="let item">
                {{ item.createdAt | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="updatedAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Updated</th>
              <td mat-cell *matCellDef="let item">
                {{ item.updatedAt | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/workflows', item.workflowCode, 'instances', item.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>
                  @if (item.status === 'DRAFT') {
                    <button mat-menu-item [routerLink]="['/workflows', item.workflowCode, 'edit', item.id]">
                      <mat-icon>edit</mat-icon>
                      <span>Edit Draft</span>
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
              <mat-icon>send</mat-icon>
              <h3>No Submissions Yet</h3>
              <p>Start by submitting a new workflow request.</p>
              <button mat-raised-button color="primary" routerLink="/dashboard">
                Go to Dashboard
              </button>
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
    .my-submissions-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
    }
  `]
})
export class MySubmissionsComponent implements OnInit {
  displayedColumns = ['referenceNumber', 'workflowName', 'status', 'currentApprovalLevel', 'createdAt', 'updatedAt', 'actions'];
  dataSource = new MatTableDataSource<WorkflowInstance>([]);
  searchTerm = '';
  statusFilter = '';
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  statuses = Object.values(InstanceStatus);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private workflowService: WorkflowService) {}

  ngOnInit() {
    this.loadSubmissions();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadSubmissions() {
    this.workflowService.getMySubmissions(this.currentPage, this.pageSize, this.statusFilter || undefined)
      .subscribe(res => {
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
    this.loadSubmissions();
  }
}
