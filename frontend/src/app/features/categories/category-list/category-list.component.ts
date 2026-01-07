import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Category } from '@core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="category-list-container">
      <div class="header">
        <h1>Categories (Industries)</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="downloadTemplate()">
            <mat-icon>description</mat-icon> Template
          </button>
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>upload</mat-icon> Import
          </button>
          <input hidden #fileInput type="file" accept=".xlsx" (change)="importFromExcel($event)">
          <button mat-stroked-button (click)="exportToExcel()">
            <mat-icon>download</mat-icon> Export
          </button>
          <button mat-raised-button color="primary" (click)="showForm = true; editingCategory = null; categoryForm.reset()">
            <mat-icon>add</mat-icon>
            Add Category
          </button>
        </div>
      </div>

      <div class="content-grid">
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="categories" class="full-width">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let row">{{ row.description }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [color]="row.isActive ? 'primary' : 'warn'" selected>
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="editCategory(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="toggleStatus(row)">
                    <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCategory(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (categories.length === 0) {
              <div class="no-data">
                <mat-icon>category</mat-icon>
                <p>No categories found. Add your first category.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (showForm) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Code</mat-label>
                  <input matInput formControlName="code">
                  @if (categoryForm.get('code')?.hasError('required')) {
                    <mat-error>Code is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name">
                  @if (categoryForm.get('name')?.hasError('required')) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3"></textarea>
                </mat-form-field>

                <div class="form-actions">
                  <button mat-button type="button" (click)="showForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="loading || categoryForm.invalid">
                    {{ editingCategory ? 'Update' : 'Create' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .category-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1rem;
    }

    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .full-width { width: 100%; }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .form-field {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns = ['code', 'name', 'description', 'status', 'actions'];
  showForm = false;
  editingCategory: Category | null = null;
  loading = false;
  categoryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.userService.getCategories().subscribe(res => {
      if (res.success) {
        this.categories = res.data;
      }
    });
  }

  editCategory(category: Category) {
    this.editingCategory = category;
    this.showForm = true;
    this.categoryForm.patchValue({
      code: category.code,
      name: category.name,
      description: category.description
    });
  }

  saveCategory() {
    if (this.categoryForm.invalid) return;

    this.loading = true;
    const data = this.categoryForm.value;

    const request = this.editingCategory
      ? this.userService.updateCategory(this.editingCategory.id, data)
      : this.userService.createCategory(data);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.editingCategory ? 'Category updated' : 'Category created',
            'Close',
            { duration: 3000 }
          );
          this.showForm = false;
          this.editingCategory = null;
          this.categoryForm.reset();
          this.loadCategories();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  toggleStatus(category: Category) {
    const request = category.isActive
      ? this.userService.deactivateCategory(category.id)
      : this.userService.activateCategory(category.id);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          category.isActive ? 'Category deactivated' : 'Category activated',
          'Close',
          { duration: 3000 }
        );
        this.loadCategories();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.userService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
          this.loadCategories();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
        }
      });
    }
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('categories').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Categories_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('categories', file).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message || 'Categories imported', 'Close', { duration: 3000 });
          this.loadCategories();
        } else {
          this.snackBar.open(res.message || 'Failed to import', 'Close', { duration: 3000 });
        }
        input.value = '';
      },
      error: (err) => { this.snackBar.open(err.error?.message || 'Failed to import', 'Close', { duration: 3000 }); input.value = ''; }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('categories').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Categories_Export.xlsx');
        this.snackBar.open('Categories exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
