import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Inject } from '@angular/core';
import { DeadlineService, DeadlineCategoryDTO } from '../services/deadline.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogType } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-deadline-category-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatChipsModule, MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <div class="category-list-container">
      <div class="header">
        <div>
          <h1>Deadline Categories</h1>
          <p class="subtitle">Manage categories for organizing deadlines</p>
        </div>
        <button mat-raised-button color="primary" (click)="openEditDialog(null)">
          <mat-icon>add</mat-icon> Add Category
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          @if (categories.length === 0) {
            <div class="empty-state">
              <mat-icon>category</mat-icon>
              <h3>No categories found</h3>
              <p>Add your first deadline category to organize your deadlines.</p>
              <button mat-raised-button color="primary" (click)="openEditDialog(null)">
                <mat-icon>add</mat-icon> Add Category
              </button>
            </div>
          } @else {
            <table mat-table [dataSource]="categories" class="full-width">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">
                  <span class="category-name">{{ row.name }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let row">{{ row.description || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-chip" [class.active]="row.isActive" [class.inactive]="!row.isActive">
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button matTooltip="Edit" (click)="openEditDialog(row); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Toggle Status" (click)="toggleStatus(row); $event.stopPropagation()">
                    <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete" color="warn" (click)="deleteCategory(row); $event.stopPropagation()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .category-list-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .full-width { width: 100%; }
    .category-name { font-weight: 500; }

    .status-chip { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip.active { background: #e8f5e9; color: #2e7d32; }
    .status-chip.inactive { background: #f5f5f5; color: #999; }

    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
    .empty-state h3 { color: #666; margin: 16px 0 8px; }
    .empty-state p { color: #999; margin-bottom: 16px; }
  `]
})
export class DeadlineCategoryListComponent implements OnInit {
  categories: DeadlineCategoryDTO[] = [];
  displayedColumns = ['code', 'name', 'description', 'status', 'actions'];

  constructor(
    private deadlineService: DeadlineService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.deadlineService.getCategories().subscribe({
      next: (res: any) => {
        if (res.success) this.categories = res.data;
      },
      error: () => this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 })
    });
  }

  openEditDialog(category: DeadlineCategoryDTO | null) {
    const dialogRef = this.dialog.open(DeadlineCategoryEditDialogComponent, {
      width: '500px',
      data: category ? { ...category } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadCategories();
    });
  }

  toggleStatus(category: DeadlineCategoryDTO) {
    this.deadlineService.toggleCategoryStatus(category.id!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.snackBar.open('Status updated', 'Close', { duration: 3000 });
          this.loadCategories();
        }
      },
      error: () => this.snackBar.open('Failed to toggle status', 'Close', { duration: 3000 })
    });
  }

  deleteCategory(category: DeadlineCategoryDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        type: 'delete' as ConfirmDialogType
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.deadlineService.deleteCategory(category.id!).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
              this.loadCategories();
            }
          },
          error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 })
        });
      }
    });
  }
}

// Edit/Create dialog component
@Component({
  selector: 'app-deadline-category-edit-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Category' : 'New Category' }}</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="category.code" placeholder="e.g., REG, CORP, GOV" required>
          <mat-hint>Short unique identifier</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="category.name" placeholder="e.g., Regulatory" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="category.description" rows="3" placeholder="Optional description"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving || !category.code || !category.name">
        {{ data ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; }
    .full-width { width: 100%; }
  `]
})
export class DeadlineCategoryEditDialogComponent {
  category: DeadlineCategoryDTO;
  saving = false;

  constructor(
    private deadlineService: DeadlineService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<DeadlineCategoryEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeadlineCategoryDTO | null
  ) {
    this.category = data ? { ...data } : { code: '', name: '', description: '' };
  }

  save() {
    this.saving = true;
    const request = this.data
      ? this.deadlineService.updateCategory(this.data.id!, this.category)
      : this.deadlineService.createCategory(this.category);

    request.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.snackBar.open(this.data ? 'Category updated' : 'Category created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save', 'Close', { duration: 3000 });
      }
    });
  }
}
