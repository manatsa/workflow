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
import { Branch } from '@core/models/branch.model';
import { Corporate } from '@core/models/corporate.model';
import { SBU } from '@core/models/user.model';

export interface BranchEditDialogData {
  branch: Branch | null;
  corporates: Corporate[];
  allSbus: SBU[];
}

@Component({
  selector: 'app-branch-edit-dialog',
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
        {{ isEditing ? 'Edit Branch' : 'Create Branch' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="branchForm" id="branchForm" (ngSubmit)="save()">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g. BR-001">
            @if (branchForm.get('code')?.hasError('required') && branchForm.get('code')?.touched) {
              <mat-error>Code is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Main Branch">
            @if (branchForm.get('name')?.hasError('required') && branchForm.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Corporate (Optional Filter)</mat-label>
          <mat-select formControlName="corporateId" (selectionChange)="onCorporateChange()">
            <mat-option [value]="null">-- Select to filter SBUs --</mat-option>
            @for (corp of data.corporates; track corp.id) {
              <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
            }
          </mat-select>
          <mat-hint>Select to filter available SBUs</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SBU</mat-label>
          <mat-select formControlName="sbuId">
            <mat-option [value]="null">-- Select SBU --</mat-option>
            @for (sbu of formSbus; track sbu.id) {
              <mat-option [value]="sbu.id">{{ sbu.name }} @if (sbu.corporateName) { ({{ sbu.corporateName }}) }</mat-option>
            }
          </mat-select>
          @if (branchForm.get('sbuId')?.hasError('required') && branchForm.get('sbuId')?.touched) {
            <mat-error>SBU is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Describe this branch"></textarea>
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
            <input matInput formControlName="contactEmail" type="email" placeholder="e.g. branch@company.com">
            @if (branchForm.get('contactEmail')?.hasError('email')) {
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
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update Branch' : 'Create Branch' }}"
              color="primary" form="branchForm" type="submit" [disabled]="saving">
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
export class BranchEditDialogComponent implements OnInit {
  branchForm: FormGroup;
  saving = false;
  formSbus: SBU[] = [];

  get isEditing(): boolean {
    return !!this.data.branch;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BranchEditDialogData,
    private dialogRef: MatDialogRef<BranchEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.branchForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      address: [''],
      corporateId: [null],
      sbuId: [null, Validators.required],
      contactEmail: ['', Validators.email],
      contactPhone: ['']
    });
  }

  ngOnInit() {
    this.formSbus = [...this.data.allSbus];

    if (this.data.branch) {
      if (this.data.branch.corporateId) {
        this.formSbus = this.data.allSbus.filter(s => s.corporateId === this.data.branch!.corporateId);
      }

      this.branchForm.patchValue({
        code: this.data.branch.code,
        name: this.data.branch.name,
        description: this.data.branch.description,
        address: this.data.branch.address,
        corporateId: this.data.branch.corporateId || null,
        sbuId: this.data.branch.sbuId,
        contactEmail: this.data.branch.contactEmail,
        contactPhone: this.data.branch.contactPhone
      });
    }
  }

  onCorporateChange() {
    const corporateId = this.branchForm.get('corporateId')?.value;
    if (corporateId) {
      this.formSbus = this.data.allSbus.filter(s => s.corporateId === corporateId);
    } else {
      this.formSbus = [...this.data.allSbus];
    }
    this.branchForm.patchValue({ sbuId: null });
  }

  save() {
    if (this.branchForm.invalid) return;
    this.saving = true;

    const formData = this.branchForm.value;
    const data = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      sbuId: formData.sbuId,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone
    };

    const request = this.isEditing
      ? this.userService.updateBranch(this.data.branch!.id, data)
      : this.userService.createBranch(data);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Branch updated successfully' : 'Branch created successfully',
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
