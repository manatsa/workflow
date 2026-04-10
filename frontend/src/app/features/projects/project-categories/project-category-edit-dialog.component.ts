import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectCategoryService, ProjectCategoryDTO } from '../services/project.service';

@Component({
  selector: 'app-project-category-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
        {{ data ? 'Edit Category' : 'New Category' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="categoryForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. CAT-001">
          @if (categoryForm.get('code')?.hasError('required')) {
            <mat-error>Code is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Category name">
          @if (categoryForm.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Optional description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="loading || categoryForm.invalid" (click)="save()">
        <mat-icon>{{ data ? 'save' : 'add' }}</mat-icon>
        {{ data ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    mat-dialog-content {
      min-width: 400px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
})
export class ProjectCategoryEditDialogComponent implements OnInit {
  categoryForm: FormGroup;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProjectCategoryDTO | null,
    private dialogRef: MatDialogRef<ProjectCategoryEditDialogComponent>,
    private fb: FormBuilder,
    private categoryService: ProjectCategoryService,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    if (this.data) {
      this.categoryForm.patchValue({
        code: this.data.code,
        name: this.data.name,
        description: this.data.description
      });
    }
  }

  save() {
    if (this.categoryForm.invalid) return;

    this.loading = true;
    const formData = this.categoryForm.value;

    const request = this.data
      ? this.categoryService.update(this.data.id, formData)
      : this.categoryService.create(formData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.data ? 'Category updated' : 'Category created',
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close('saved');
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
