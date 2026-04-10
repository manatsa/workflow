import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ProjectCategoryService, ProjectCategoryDTO } from '../services/project.service';
import { AuthService } from '@core/services/auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ProjectCategoryDetailDialogComponent } from './project-category-detail-dialog.component';
import { ProjectCategoryEditDialogComponent } from './project-category-edit-dialog.component';

@Component({
  selector: 'app-project-category-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule],
  template: `
    <div class="category-list-container">
      <div class="header">
        <h1>Project Categories</h1>
        <div class="header-actions">
          <button mat-raised-button matTooltip="Add Category" color="primary" (click)="openEditDialog(null)">
            <mat-icon>add</mat-icon>
            Add Category
          </button>
        </div>
      </div>

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
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewCategory(row)"></tr>
          </table>

          @if (categories.length === 0) {
            <div class="no-data">
              <mat-icon>category</mat-icon>
              <p>No project categories found. Add your first category.</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
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

    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f0f4ff; }
  `]
})
export class ProjectCategoryListComponent implements OnInit {
  categories: ProjectCategoryDTO[] = [];
  displayedColumns = ['code', 'name', 'description', 'status', 'actions'];

  constructor(
    private categoryService: ProjectCategoryService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  get canSeeAll(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasRole('ROLE_PROJECT_MANAGER')
      || this.authService.hasPrivilege('ADMIN');
  }

  loadCategories() {
    const request = this.canSeeAll
      ? this.categoryService.getAll()
      : this.categoryService.getActive();

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data;
        }
      },
      error: () => this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 })
    });
  }

  viewCategory(category: ProjectCategoryDTO) {
    const dialogRef = this.dialog.open(ProjectCategoryDetailDialogComponent, {
      data: category,
      width: '550px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditDialog(category);
      }
    });
  }

  openEditDialog(category: ProjectCategoryDTO | null) {
    const dialogRef = this.dialog.open(ProjectCategoryEditDialogComponent, {
      data: category,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadCategories();
      }
    });
  }

  toggleStatus(category: ProjectCategoryDTO) {
    const request = category.isActive
      ? this.categoryService.deactivate(category.id)
      : this.categoryService.activate(category.id);

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

  deleteCategory(category: ProjectCategoryDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Category',
        message: 'Are you sure you want to delete this category?',
        itemName: category.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.categoryService.delete(category.id).subscribe({
          next: () => {
            this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
            this.loadCategories();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
