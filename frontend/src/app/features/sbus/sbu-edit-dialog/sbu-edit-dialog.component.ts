import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { SBU } from '@core/models/user.model';
import { Corporate } from '@core/models/corporate.model';

export interface SbuEditDialogData {
  sbu: SBU | null;
  corporates: Corporate[];
  flatSbus: SBU[];
  parentId?: string | null;
  corporateId?: string | null;
}

@Component({
  selector: 'app-sbu-edit-dialog',
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
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit SBU' : 'Create SBU' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="sbuForm" id="sbuForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Corporate</mat-label>
          <mat-select formControlName="corporateId">
            <mat-option [value]="null">-- Select Corporate --</mat-option>
            @for (corp of data.corporates; track corp.id) {
              <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
            }
          </mat-select>
          @if (sbuForm.get('corporateId')?.hasError('required') && sbuForm.get('corporateId')?.touched) {
            <mat-error>Corporate is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Head Office">
          @if (sbuForm.get('name')?.hasError('required') && sbuForm.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. HO-001">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe this SBU"></textarea>
        </mat-form-field>

        <mat-divider></mat-divider>

        <div class="section-header">
          <h4>Hierarchy</h4>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Parent SBU</mat-label>
          <mat-select formControlName="parentId">
            <mat-option [value]="null">None (Root Level)</mat-option>
            @for (sbu of availableParents; track sbu.id) {
              <mat-option [value]="sbu.id">
                {{ sbu.name }}
                @if (sbu.corporateName) { ({{ sbu.corporateName }}) }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-divider></mat-divider>

        <div class="section-header">
          <h4>Contact Details</h4>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact Email</mat-label>
          <input matInput formControlName="contactEmail" placeholder="e.g. office@company.com">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact Phone</mat-label>
          <input matInput formControlName="contactPhone" placeholder="e.g. +1234567890">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="2"
                    placeholder="Physical address"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button matTooltip="{{ isEditing ? 'Update SBU' : 'Create SBU' }}"
              color="primary" form="sbuForm" type="submit" [disabled]="saving">
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
      min-width: 500px;
      max-height: 70vh;
      padding-top: 0.5rem;
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
export class SbuEditDialogComponent implements OnInit {
  sbuForm: FormGroup;
  saving = false;

  get isEditing(): boolean {
    return !!this.data.sbu;
  }

  get availableParents(): SBU[] {
    if (!this.data.sbu) return this.data.flatSbus;
    return this.data.flatSbus.filter((s: SBU) => s.id !== this.data.sbu!.id);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SbuEditDialogData,
    private dialogRef: MatDialogRef<SbuEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.sbuForm = this.fb.group({
      corporateId: [null, Validators.required],
      name: ['', Validators.required],
      code: [''],
      description: [''],
      parentId: [null],
      contactEmail: [''],
      contactPhone: [''],
      address: ['']
    });
  }

  ngOnInit() {
    if (this.data.sbu) {
      this.sbuForm.patchValue({
        corporateId: this.data.sbu.corporateId || null,
        name: this.data.sbu.name,
        code: this.data.sbu.code,
        description: this.data.sbu.description,
        parentId: this.data.sbu.parent?.id || this.data.sbu.parentId || null,
        contactEmail: this.data.sbu.contactEmail || '',
        contactPhone: this.data.sbu.contactPhone || '',
        address: this.data.sbu.address || ''
      });
    } else {
      // Pre-fill parent and corporate for "Add Child" scenario
      if (this.data.parentId) {
        this.sbuForm.patchValue({ parentId: this.data.parentId });
      }
      if (this.data.corporateId) {
        this.sbuForm.patchValue({ corporateId: this.data.corporateId });
      }
    }
  }

  save() {
    if (this.sbuForm.invalid) return;
    this.saving = true;

    const sbuData = this.sbuForm.value;
    const request = this.isEditing
      ? this.userService.updateSbu(this.data.sbu!.id, sbuData)
      : this.userService.createSbu(sbuData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'SBU updated successfully' : 'SBU created successfully',
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
