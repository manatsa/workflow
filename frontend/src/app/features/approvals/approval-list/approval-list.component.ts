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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowInstance } from '@core/models/workflow.model';

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
    MatChipsModule
  ],
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
              <td mat-cell *matCellDef="let item">
                <button mat-raised-button color="primary" [routerLink]="['/approvals', item.id]">
                  Review
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
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
  displayedColumns = ['referenceNumber', 'title', 'workflowName', 'initiatorName', 'currentApprovalLevel', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<WorkflowInstance>([]);
  searchTerm = '';
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private workflowService: WorkflowService) {}

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
}
