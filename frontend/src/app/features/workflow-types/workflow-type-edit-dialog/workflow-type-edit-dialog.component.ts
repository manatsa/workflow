import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowType } from '@core/models/workflow.model';

export interface WorkflowTypeEditDialogData {
  type: WorkflowType | null;
}

@Component({
  selector: 'app-workflow-type-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit Workflow Type' : 'Create Workflow Type' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" id="workflowTypeForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. BANKING">
          @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
            <mat-error>Code is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Banking">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe this workflow type"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Icon</mat-label>
            <input matInput formControlName="icon" placeholder="e.g. account_balance">
            <mat-hint>Material icon name</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Color</mat-label>
            <input matInput formControlName="color" placeholder="#3f51b5">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Order</mat-label>
          <input matInput type="number" formControlName="displayOrder">
        </mat-form-field>

        <mat-checkbox formControlName="isActive">Active</mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update' : 'Create' }}"
              color="primary" form="workflowTypeForm" type="submit" [disabled]="saving">
        @if (saving) { Saving... } @else { {{ isEditing ? 'Update' : 'Create' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 0 16px; }
    .dialog-header h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0; }
    mat-dialog-content { min-width: 450px; max-height: 70vh; padding-top: 0.5rem; }
    .full-width { width: 100%; margin-bottom: 0.25rem; }
    .row { display: flex; gap: 0.75rem; }
    .flex-1 { flex: 1; }
  `]
})
export class WorkflowTypeEditDialogComponent implements OnInit {
  form: FormGroup;
  saving = false;

  get isEditing(): boolean {
    return !!this.data.type;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: WorkflowTypeEditDialogData,
    private dialogRef: MatDialogRef<WorkflowTypeEditDialogComponent>,
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      icon: [''],
      color: [''],
      displayOrder: [0],
      isActive: [true]
    });
  }

  ngOnInit() {
    if (this.data.type) {
      this.form.patchValue({
        code: this.data.type.code,
        name: this.data.type.name,
        description: this.data.type.description,
        icon: this.data.type.icon,
        color: this.data.type.color,
        displayOrder: this.data.type.displayOrder ?? 0,
        isActive: this.data.type.isActive ?? true
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;

    const payload = this.form.value;
    const request = this.isEditing
      ? this.workflowService.updateWorkflowType(this.data.type!.id, payload)
      : this.workflowService.createWorkflowType(payload);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Workflow type updated' : 'Workflow type created',
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
