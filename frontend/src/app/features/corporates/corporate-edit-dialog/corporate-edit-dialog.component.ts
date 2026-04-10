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
import { UserService } from '@core/services/user.service';
import { Corporate, CorporateType, CorporateTypeLabels } from '@core/models/corporate.model';
import { Category } from '@core/models/category.model';

export interface CorporateEditDialogData {
  corporate: Corporate | null;
  categories: Category[];
}

@Component({
  selector: 'app-corporate-edit-dialog',
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
        {{ isEditing ? 'Edit Corporate' : 'Create Corporate' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="corporateForm" id="corporateForm" (ngSubmit)="save()">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g. CORP-001">
            @if (corporateForm.get('code')?.hasError('required') && corporateForm.get('code')?.touched) {
              <mat-error>Code is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Acme Corp">
            @if (corporateForm.get('name')?.hasError('required') && corporateForm.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Category (Industry)</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option [value]="null">-- None --</mat-option>
              @for (category of data.categories; track category.id) {
                <mat-option [value]="category.id">{{ category.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Corporate Type</mat-label>
            <mat-select formControlName="corporateType">
              <mat-option [value]="null">-- None --</mat-option>
              @for (type of corporateTypes; track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Describe this corporate"></textarea>
        </mat-form-field>

        <mat-divider></mat-divider>

        <div class="section-header"><h4>Contact Details</h4></div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="2" placeholder="Physical address"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contact Email</mat-label>
            <input matInput formControlName="contactEmail" type="email" placeholder="e.g. info@company.com">
            @if (corporateForm.get('contactEmail')?.hasError('email')) {
              <mat-error>Invalid email format</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contact Phone</mat-label>
            <input matInput formControlName="contactPhone" placeholder="e.g. +1234567890">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Website</mat-label>
          <input matInput formControlName="website" placeholder="https://example.com">
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update Corporate' : 'Create Corporate' }}"
              color="primary" form="corporateForm" type="submit" [disabled]="saving">
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
export class CorporateEditDialogComponent implements OnInit {
  corporateForm: FormGroup;
  saving = false;

  corporateTypes = Object.values(CorporateType).map(value => ({
    value,
    label: CorporateTypeLabels[value]
  }));

  get isEditing(): boolean {
    return !!this.data.corporate;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CorporateEditDialogData,
    private dialogRef: MatDialogRef<CorporateEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.corporateForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      address: [''],
      categoryId: [null],
      corporateType: [null],
      contactEmail: ['', Validators.email],
      contactPhone: [''],
      website: ['']
    });
  }

  ngOnInit() {
    if (this.data.corporate) {
      this.corporateForm.patchValue({
        code: this.data.corporate.code,
        name: this.data.corporate.name,
        description: this.data.corporate.description,
        address: this.data.corporate.address,
        categoryId: this.data.corporate.categoryId,
        corporateType: this.data.corporate.corporateType,
        contactEmail: this.data.corporate.contactEmail,
        contactPhone: this.data.corporate.contactPhone,
        website: this.data.corporate.website
      });
    }
  }

  save() {
    if (this.corporateForm.invalid) return;
    this.saving = true;

    const corporateData = this.corporateForm.value;
    const request = this.isEditing
      ? this.userService.updateCorporate(this.data.corporate!.id, corporateData)
      : this.userService.createCorporate(corporateData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Corporate updated successfully' : 'Corporate created successfully',
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
