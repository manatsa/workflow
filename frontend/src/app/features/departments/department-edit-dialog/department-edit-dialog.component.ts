import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DepartmentService } from '@core/services/department.service';
import { Department } from '@core/models/department.model';
import { Corporate } from '@core/models/corporate.model';

export interface DepartmentEditDialogData {
  department: Department | null;
  corporates: Corporate[];
}

@Component({
  selector: 'app-department-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit Department' : 'Create Department' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="departmentForm" id="departmentForm" (ngSubmit)="save()">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g. HR">
            @if (departmentForm.get('code')?.hasError('required') && departmentForm.get('code')?.touched) {
              <mat-error>Code is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Human Resources">
            @if (departmentForm.get('name')?.hasError('required') && departmentForm.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Corporate (Optional)</mat-label>
          <mat-select formControlName="corporateId">
            <mat-option [value]="null">-- Global (All Corporates) --</mat-option>
            @for (corp of data.corporates; track corp.id) {
              <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
            }
          </mat-select>
          <mat-hint>Leave empty for global department accessible to all corporates</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Describe this department"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Head of Department</mat-label>
          <input matInput formControlName="headOfDepartment" placeholder="e.g. John Smith">
        </mat-form-field>

        <mat-divider></mat-divider>

        <div class="section-header"><h4>Contact Details</h4></div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contact Email</mat-label>
            <input matInput formControlName="contactEmail" type="email" placeholder="e.g. dept@company.com">
            @if (departmentForm.get('contactEmail')?.hasError('email')) {
              <mat-error>Invalid email format</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contact Phone</mat-label>
            <input matInput formControlName="contactPhone" placeholder="e.g. +1234567890">
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update Department' : 'Create Department' }}"
              color="primary" form="departmentForm" type="submit" [disabled]="saving">
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
      min-width: 550px;
      max-height: 70vh;
      padding-top: 0.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-field {
      flex: 1;
      margin-bottom: 0.25rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    .section-header h4 {
      margin: 0.75rem 0;
      color: #2e7d32;
      font-weight: 500;
      font-size: 0.875rem;
    }

    mat-divider {
      margin: 0.5rem 0;
    }
  `]
})
export class DepartmentEditDialogComponent implements OnInit {
  departmentForm: FormGroup;
  saving = false;

  get isEditing(): boolean {
    return !!this.data.department;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentEditDialogData,
    private dialogRef: MatDialogRef<DepartmentEditDialogComponent>,
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar
  ) {
    this.departmentForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      corporateId: [null],
      headOfDepartment: [''],
      contactEmail: ['', Validators.email],
      contactPhone: ['']
    });
  }

  ngOnInit() {
    if (this.data.department) {
      this.departmentForm.patchValue({
        code: this.data.department.code,
        name: this.data.department.name,
        description: this.data.department.description,
        corporateId: this.data.department.corporateId || null,
        headOfDepartment: this.data.department.headOfDepartment,
        contactEmail: this.data.department.contactEmail,
        contactPhone: this.data.department.contactPhone
      });
    }
  }

  save() {
    if (this.departmentForm.invalid) return;
    this.saving = true;

    const formData = this.departmentForm.value;
    const request = this.isEditing
      ? this.departmentService.updateDepartment(this.data.department!.id, formData)
      : this.departmentService.createDepartment(formData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Department updated successfully' : 'Department created successfully',
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
