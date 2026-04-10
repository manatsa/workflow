import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Privilege } from '@core/models/user.model';

@Component({
  selector: 'app-privilege-edit-dialog',
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
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit Privilege' : 'Create Privilege' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" id="privilegeForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Privilege Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. VIEW_REPORTS">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Privilege name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe what this privilege allows"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <input matInput formControlName="category" placeholder="e.g. WORKFLOW, USER_MANAGEMENT">
        </mat-form-field>

        @if (isEditing) {
          <div class="toggle-row">
            <mat-slide-toggle formControlName="isSystemPrivilege" color="primary">
              System Privilege
            </mat-slide-toggle>
            <span class="hint">System privileges cannot be deleted by regular users</span>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" form="privilegeForm" type="submit" [disabled]="saving">
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

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .hint {
      font-size: 0.75rem;
      color: #999;
    }
  `]
})
export class PrivilegeEditDialogComponent implements OnInit {
  form: FormGroup;
  saving = false;

  get isEditing(): boolean {
    return !!this.data;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Privilege | null,
    private dialogRef: MatDialogRef<PrivilegeEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: [''],
      isSystemPrivilege: [false]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        description: this.data.description,
        category: this.data.category,
        isSystemPrivilege: this.data.isSystemPrivilege || false
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;

    const privData = this.form.value;
    const request = this.isEditing
      ? this.userService.updatePrivilege(this.data!.id, privData)
      : this.userService.createPrivilege(privData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Privilege updated successfully' : 'Privilege created successfully',
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
