import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { SettingService } from '@core/services/setting.service';
import { AuditLog } from '@core/models/setting.model';
import { AuditDetailDialogComponent } from './audit-detail-dialog.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="audit-log-container">
      <div class="header">
        <h1>Audit Logs</h1>
        <button mat-raised-button (click)="exportLogs()">
          <mat-icon>download</mat-icon>
          Export
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-expansion-panel class="filter-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>filter_list</mat-icon>
                Filters
              </mat-panel-title>
              <mat-panel-description>
                @if (hasFilters) {
                  {{ activeFilterCount }} filter(s) active
                }
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="filter-grid">
              <mat-form-field appearance="outline">
                <mat-label>User</mat-label>
                <input matInput [(ngModel)]="filters.performedBy" placeholder="Search by username">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Action</mat-label>
                <mat-select [(ngModel)]="filters.action">
                  <mat-option value="">All</mat-option>
                  @for (action of actions; track action) {
                    <mat-option [value]="action">{{ action }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Entity Type</mat-label>
                <mat-select [(ngModel)]="filters.entityType">
                  <mat-option value="">All</mat-option>
                  @for (type of entityTypes; track type) {
                    <mat-option [value]="type">{{ type }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>From Date</mat-label>
                <input matInput [matDatepicker]="fromPicker" [(ngModel)]="filters.fromDate">
                <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>To Date</mat-label>
                <input matInput [matDatepicker]="toPicker" [(ngModel)]="filters.toDate">
                <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="filter-actions">
              <button mat-button (click)="clearFilters()">Clear</button>
              <button mat-raised-button color="primary" (click)="applyFilters()">Apply Filters</button>
            </div>
          </mat-expansion-panel>

          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            <ng-container matColumnDef="actionDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Timestamp</th>
              <td mat-cell *matCellDef="let log">
                {{ log.actionDate | date:'medium' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>User</th>
              <td mat-cell *matCellDef="let log">
                <div class="user-info">
                  <div class="avatar">{{ getInitials(log.userFullName || log.username) }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ log.userFullName || log.username }}</span>
                    @if (log.userFullName && log.username) {
                      <span class="username">({{ log.username }})</span>
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Action</th>
              <td mat-cell *matCellDef="let log">
                <span class="badge" [class]="getActionClass(log.action)">{{ log.action }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="entityType">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Entity Type</th>
              <td mat-cell *matCellDef="let log">{{ log.entityType }}</td>
            </ng-container>

            <ng-container matColumnDef="entityName">
              <th mat-header-cell *matHeaderCellDef>Entity</th>
              <td mat-cell *matCellDef="let log">
                <span class="entity-name">{{ log.entityName || (log.entityId | slice:0:8) + '...' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="summary">
              <th mat-header-cell *matHeaderCellDef>Summary</th>
              <td mat-cell *matCellDef="let log">
                {{ (log.summary || '') | slice:0:40 }}{{ (log.summary?.length || 0) > 40 ? '...' : '' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef>IP Address</th>
              <td mat-cell *matCellDef="let log">{{ log.ipAddress || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let log">
                <button mat-icon-button (click)="viewDetails(log)" matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewDetails(row)"></tr>
          </table>

          <mat-paginator [length]="totalElements"
                         [pageSize]="pageSize"
                         [pageSizeOptions]="[25, 50, 100, 200]"
                         (page)="onPageChange($event)"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .audit-log-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .filter-panel {
      margin-bottom: 1rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem 0;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .data-table {
      width: 100%;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.create { background: #e8f5e9; color: #2e7d32; }
    .badge.update { background: #e3f2fd; color: #1565c0; }
    .badge.delete { background: #ffebee; color: #c62828; }
    .badge.login { background: #f3e5f5; color: #7b1fa2; }
    .badge.logout { background: #f5f5f5; color: #666; }
    .badge.approve { background: #e8f5e9; color: #2e7d32; }
    .badge.reject { background: #ffebee; color: #c62828; }

    .entity-name {
      font-weight: 500;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
    }

    .username {
      font-size: 0.75rem;
      color: #666;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f5f5f5;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  displayedColumns = ['actionDate', 'user', 'action', 'entityType', 'entityName', 'summary', 'ipAddress', 'actions'];
  dataSource = new MatTableDataSource<AuditLog>([]);
  totalElements = 0;
  pageSize = 25;
  currentPage = 0;

  filters = {
    performedBy: '',
    action: '',
    entityType: '',
    fromDate: null as Date | null,
    toDate: null as Date | null
  };

  actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ESCALATE', 'SUBMIT', 'PASSWORD_CHANGE', 'PASSWORD_RESET'];
  entityTypes = ['User', 'Role', 'Workflow', 'WorkflowInstance', 'Setting', 'SBU', 'Corporate', 'Branch', 'Category'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private dialog = inject(MatDialog);

  constructor(private settingService: SettingService) {}

  ngOnInit() {
    this.loadLogs();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  get hasFilters(): boolean {
    return !!(this.filters.performedBy || this.filters.action || this.filters.entityType ||
              this.filters.fromDate || this.filters.toDate);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.performedBy) count++;
    if (this.filters.action) count++;
    if (this.filters.entityType) count++;
    if (this.filters.fromDate) count++;
    if (this.filters.toDate) count++;
    return count;
  }

  loadLogs() {
    this.settingService.getAuditLogsPaged(this.currentPage, this.pageSize, this.filters)
      .subscribe(res => {
        if (res.success) {
          this.dataSource.data = res.data.content;
          this.totalElements = res.data.totalElements;
        }
      });
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadLogs();
  }

  clearFilters() {
    this.filters = {
      performedBy: '',
      action: '',
      entityType: '',
      fromDate: null,
      toDate: null
    };
    this.applyFilters();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getActionClass(action: string): string {
    return action?.toLowerCase() || '';
  }

  viewDetails(log: AuditLog) {
    this.dialog.open(AuditDetailDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: log
    });
  }

  exportLogs() {
    this.settingService.exportAuditLogs(this.filters).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
