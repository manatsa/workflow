import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Category } from '@core/models/category.model';

export interface CategoryEditDialogData {
  category: Category | null;
}

@Component({
  selector: 'app-category-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit Category' : 'Create Category' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="categoryForm" id="categoryForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. FIN">
          @if (categoryForm.get('code')?.hasError('required') && categoryForm.get('code')?.touched) {
            <mat-error>Code is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Finance">
          @if (categoryForm.get('name')?.hasError('required') && categoryForm.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe this category"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update Category' : 'Create Category' }}"
              color="primary" form="categoryForm" type="submit" [disabled]="saving">
        @if (saving) {
          Saving...
        } @else {
          {{ isEditing ? 'Update' : 'Create' }}
        }
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
      min-width: 450px;
      max-height: 70vh;
      padding-top: 0.5rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.25rem;
    }
  `]
})
export class CategoryEditDialogComponent implements OnInit {
  categoryForm: FormGroup;
  saving = false;

  get isEditing(): boolean {
    return !!this.data.category;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CategoryEditDialogData,
    private dialogRef: MatDialogRef<CategoryEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    if (this.data.category) {
      this.categoryForm.patchValue({
        code: this.data.category.code,
        name: this.data.category.name,
        description: this.data.category.description
      });
    }
  }

  save() {
    if (this.categoryForm.invalid) return;
    this.saving = true;

    const categoryData = this.categoryForm.value;
    const request = this.isEditing
      ? this.userService.updateCategory(this.data.category!.id, categoryData)
      : this.userService.createCategory(categoryData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Category updated successfully' : 'Category created successfully',
            'Close', { duration: 3000 }
          );
          this.dialogRef.close('saved');
        }
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
