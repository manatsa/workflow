import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeadlineService, DeadlineItemDTO } from '../services/deadline.service';
import { ImportExportService } from '@core/services/import-export.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogType } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DeadlineItemViewDialogComponent } from './deadline-item-view-dialog.component';

@Component({
  selector: 'app-deadline-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule,
    MatMenuModule, MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="deadline-list-page">
      <div class="page-header">
        <div>
          <h1>Deadline Items</h1>
          <p class="subtitle">Manage all critical deadline definitions</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="downloadTemplate()" matTooltip="Download template">
            <mat-icon>description</mat-icon> Template
          </button>
          <button mat-stroked-button (click)="fileInput.click()" matTooltip="Import from Excel">
            <mat-icon>upload</mat-icon> Import
          </button>
          <input #fileInput type="file" hidden accept=".xlsx,.xls" (change)="importData($event)">
          <button mat-stroked-button (click)="exportData()" matTooltip="Export to Excel">
            <mat-icon>download</mat-icon> Export
          </button>
          <button mat-raised-button color="primary" routerLink="/deadlines/items/new">
            <mat-icon>add</mat-icon> New Deadline
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search deadlines</mat-label>
              <input matInput [(ngModel)]="searchQuery" (keyup.enter)="loadItems()" placeholder="Search by name, code, or category">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="selectedCategory" (selectionChange)="filterItems()">
                <mat-option value="">All Categories</mat-option>
                @for (cat of categories; track cat.id) {
                  <mat-option [value]="cat.name">{{ cat.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Priority</mat-label>
              <mat-select [(ngModel)]="selectedPriority" (selectionChange)="filterItems()">
                <mat-option value="">All Priorities</mat-option>
                <mat-option value="CRITICAL">Critical</mat-option>
                <mat-option value="HIGH">High</mat-option>
                <mat-option value="MEDIUM">Medium</mat-option>
                <mat-option value="LOW">Low</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-card>
          <mat-card-content>
            @if (filteredItems.length === 0) {
              <div class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <h3>No deadlines found</h3>
                <p>Create your first deadline to get started.</p>
                <button mat-raised-button color="primary" routerLink="/deadlines/items/new">
                  <mat-icon>add</mat-icon> Create Deadline
                </button>
              </div>
            } @else {
              <table mat-table [dataSource]="filteredItems" class="deadline-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">
                    <div class="name-cell">
                      <a [routerLink]="['/deadlines/items', row.id]" class="deadline-link">{{ row.name }}</a>
                      <span class="code-text">{{ row.code }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let row">{{ row.categoryName || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="priority-chip" [class]="'priority-' + row.priority?.toLowerCase()">{{ row.priority }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="recurrenceType">
                  <th mat-header-cell *matHeaderCellDef>Recurrence</th>
                  <td mat-cell *matCellDef="let row">{{ formatRecurrence(row.recurrenceType) }}</td>
                </ng-container>

                <ng-container matColumnDef="nextDueDate">
                  <th mat-header-cell *matHeaderCellDef>Next Due Date</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.nextDueDate) {
                      <span [class.overdue-text]="row.nextInstanceStatus === 'OVERDUE'"
                            [class.due-soon-text]="row.nextInstanceStatus === 'DUE_SOON'">
                        {{ row.nextDueDate | date:'dd MMM yyyy' }}
                      </span>
                    } @else {
                      <span class="no-date">No date set</span>
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="status-chip" [class]="'status-' + row.status?.toLowerCase()">{{ row.status }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="viewItem(row)">
                        <mat-icon>visibility</mat-icon> View Details
                      </button>
                      <button mat-menu-item [routerLink]="['/deadlines/items', row.id]">
                        <mat-icon>edit</mat-icon> Edit
                      </button>
                      <button mat-menu-item (click)="checkReminders(row)">
                        <mat-icon>notifications_active</mat-icon> Send Reminders
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="deleteItem(row)">
                        <mat-icon color="warn">delete</mat-icon> <span class="delete-text">Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .deadline-list-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }

    .filter-card { margin-bottom: 16px; }
    .filters-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 250px; }
    .filter-field { min-width: 160px; }

    .deadline-table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,0.04); }
    .name-cell { display: flex; flex-direction: column; }
    .deadline-link { color: #1565c0; text-decoration: none; font-weight: 500; }
    .deadline-link:hover { text-decoration: underline; }
    .code-text { font-size: 12px; color: #999; }
    .no-date { color: #999; font-style: italic; }
    .overdue-text { color: #c62828; font-weight: 600; }
    .due-soon-text { color: #e65100; font-weight: 600; }

    .priority-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
    .priority-critical { background: #ffebee; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #fff8e1; color: #f57f17; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }

    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-paused { background: #fff3e0; color: #e65100; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-archived { background: #f5f5f5; color: #666; }

    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
    .empty-state h3 { color: #666; margin: 16px 0 8px; }
    .empty-state p { color: #999; margin-bottom: 16px; }
    .delete-text { color: #c62828; }
  `]
})
export class DeadlineListComponent implements OnInit {
  items: DeadlineItemDTO[] = [];
  filteredItems: DeadlineItemDTO[] = [];
  categories: any[] = [];
  loading = true;
  searchQuery = '';
  selectedCategory = '';
  selectedPriority = '';

  displayedColumns = ['name', 'category', 'priority', 'recurrenceType', 'nextDueDate', 'status', 'actions'];

  constructor(
    private deadlineService: DeadlineService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadItems();
    this.loadCategories();
  }

  loadItems() {
    this.loading = true;
    this.deadlineService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.items = res.data;
          this.filterItems();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load deadlines', 'Close', { duration: 3000 });
      }
    });
  }

  loadCategories() {
    this.deadlineService.getActiveCategories().subscribe({
      next: (res: any) => {
        if (res.success) this.categories = res.data;
      }
    });
  }

  filterItems() {
    this.filteredItems = this.items.filter(item => {
      const matchesCategory = !this.selectedCategory || item.categoryName === this.selectedCategory;
      const matchesPriority = !this.selectedPriority || item.priority === this.selectedPriority;
      const matchesSearch = !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.code?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesPriority && matchesSearch;
    });
  }

  formatRecurrence(type: string): string {
    const map: Record<string, string> = {
      'ONE_TIME': 'One Time',
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'SEMI_ANNUAL': 'Semi-Annual',
      'ANNUAL': 'Annual'
    };
    return map[type] || type;
  }

  viewItem(item: DeadlineItemDTO) {
    // Load full details then open dialog
    this.deadlineService.getById(item.id!).subscribe({
      next: (res: any) => {
        if (res.success) {
          const dialogRef = this.dialog.open(DeadlineItemViewDialogComponent, {
            width: '700px',
            maxHeight: '90vh',
            data: res.data
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result === 'edit') {
              this.router.navigate(['/deadlines/items', item.id]);
            }
          });
        }
      },
      error: () => this.snackBar.open('Failed to load details', 'Close', { duration: 3000 })
    });
  }

  checkReminders(item: DeadlineItemDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Send Reminders',
        message: `This will check "${item.name}" and send any due reminders or overdue notifications to the configured recipients. Continue?`,
        confirmText: 'Send Reminders',
        cancelText: 'Cancel',
        confirmColor: 'primary',
        type: 'confirm' as ConfirmDialogType
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.deadlineService.checkReminders(item.id!).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open(res.data || 'Reminders processed', 'Close', { duration: 5000 });
              this.loadItems();
            }
          },
          error: (err: any) => this.snackBar.open(err.error?.message || 'Failed to send reminders', 'Close', { duration: 3000 })
        });
      }
    });
  }

  deleteItem(item: DeadlineItemDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Delete Deadline',
        message: `You are about to permanently delete this deadline item. This will remove all associated actions, notification recipients, and instance history.`,
        itemName: item.name,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        type: 'delete' as ConfirmDialogType,
        showReasonInput: true,
        reasonLabel: 'Reason for deletion (optional)',
        reasonRequired: false
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.deadlineService.delete(item.id!).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open(`"${item.name}" has been deleted`, 'Close', { duration: 3000 });
              this.loadItems();
            }
          },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
        });
      }
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('deadline').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'Deadline_Template.xlsx'),
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importExportService.importFromExcel('deadline', file).subscribe({
      next: (response) => {
        const blob = response.body!;
        const filename = this.importExportService.extractFilename(response, 'Deadline_Import_Results.xlsx');
        this.importExportService.downloadFile(blob, filename);
        this.snackBar.open('Import completed — check results file', 'Close', { duration: 5000 });
        this.loadItems();
      },
      error: () => this.snackBar.open('Import failed', 'Close', { duration: 3000 })
    });
    event.target.value = '';
  }

  exportData() {
    this.importExportService.exportToExcel('deadline').subscribe({
      next: (blob) => this.importExportService.downloadFile(blob, 'Deadlines_Export.xlsx'),
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
