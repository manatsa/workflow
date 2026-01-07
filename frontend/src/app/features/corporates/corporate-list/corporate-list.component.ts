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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Corporate, CorporateType, CorporateTypeLabels } from '@core/models/corporate.model';
import { Category } from '@core/models/category.model';

@Component({
  selector: 'app-corporate-list',
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
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="corporate-list-container">
      <div class="header">
        <h1>Corporates</h1>
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
          <button mat-raised-button color="primary" (click)="showForm = true; editingCorporate = null; corporateForm.reset()">
            <mat-icon>add</mat-icon>
            Add Corporate
          </button>
        </div>
      </div>

      <div class="content-grid" [class.with-form]="showForm">
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="corporates" class="full-width">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let row">{{ row.categoryName || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let row">{{ row.corporateTypeDisplayName || '-' }}</td>
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
                  <button mat-icon-button (click)="editCorporate(row)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="toggleStatus(row)" [matTooltip]="row.isActive ? 'Deactivate' : 'Activate'">
                    <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCorporate(row)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (corporates.length === 0) {
              <div class="no-data">
                <mat-icon>corporate_fare</mat-icon>
                <p>No corporates found. Add your first corporate.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (showForm) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingCorporate ? 'Edit Corporate' : 'Add Corporate' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="corporateForm" (ngSubmit)="saveCorporate()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code">
                    @if (corporateForm.get('code')?.hasError('required')) {
                      <mat-error>Code is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name">
                    @if (corporateForm.get('name')?.hasError('required')) {
                      <mat-error>Name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Category (Industry)</mat-label>
                    <mat-select formControlName="categoryId">
                      <mat-option [value]="null">-- None --</mat-option>
                      @for (category of categories; track category.id) {
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

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Address</mat-label>
                  <textarea matInput formControlName="address" rows="2"></textarea>
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Contact Email</mat-label>
                    <input matInput formControlName="contactEmail" type="email">
                    @if (corporateForm.get('contactEmail')?.hasError('email')) {
                      <mat-error>Invalid email format</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Contact Phone</mat-label>
                    <input matInput formControlName="contactPhone">
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Website</mat-label>
                  <input matInput formControlName="website" placeholder="https://example.com">
                </mat-form-field>

                <div class="form-actions">
                  <button mat-button type="button" (click)="showForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="loading || corporateForm.invalid">
                    {{ editingCorporate ? 'Update' : 'Create' }}
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
    .corporate-list-container { padding: 1rem; }

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
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .content-grid.with-form {
      grid-template-columns: 1fr 500px;
    }

    @media (max-width: 1100px) {
      .content-grid.with-form {
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

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-field {
      flex: 1;
      margin-bottom: 0.5rem;
    }

    .form-field.full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    table {
      width: 100%;
    }

    .mat-column-actions {
      width: 150px;
      text-align: center;
    }
  `]
})
export class CorporateListComponent implements OnInit {
  corporates: Corporate[] = [];
  categories: Category[] = [];
  displayedColumns = ['code', 'name', 'category', 'type', 'status', 'actions'];
  showForm = false;
  editingCorporate: Corporate | null = null;
  loading = false;
  corporateForm: FormGroup;

  corporateTypes = Object.values(CorporateType).map(value => ({
    value,
    label: CorporateTypeLabels[value]
  }));

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private importExportService: ImportExportService,
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
    this.loadCorporates();
    this.loadCategories();
  }

  loadCorporates() {
    this.userService.getCorporates().subscribe(res => {
      if (res.success) {
        this.corporates = res.data;
      }
    });
  }

  loadCategories() {
    this.userService.getActiveCategories().subscribe(res => {
      if (res.success) {
        this.categories = res.data;
      }
    });
  }

  editCorporate(corporate: Corporate) {
    this.editingCorporate = corporate;
    this.showForm = true;
    this.corporateForm.patchValue({
      code: corporate.code,
      name: corporate.name,
      description: corporate.description,
      address: corporate.address,
      categoryId: corporate.categoryId,
      corporateType: corporate.corporateType,
      contactEmail: corporate.contactEmail,
      contactPhone: corporate.contactPhone,
      website: corporate.website
    });
  }

  saveCorporate() {
    if (this.corporateForm.invalid) return;

    this.loading = true;
    const data = this.corporateForm.value;

    const request = this.editingCorporate
      ? this.userService.updateCorporate(this.editingCorporate.id, data)
      : this.userService.createCorporate(data);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.editingCorporate ? 'Corporate updated' : 'Corporate created',
            'Close',
            { duration: 3000 }
          );
          this.showForm = false;
          this.editingCorporate = null;
          this.corporateForm.reset();
          this.loadCorporates();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  toggleStatus(corporate: Corporate) {
    const request = corporate.isActive
      ? this.userService.deactivateCorporate(corporate.id)
      : this.userService.activateCorporate(corporate.id);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          corporate.isActive ? 'Corporate deactivated' : 'Corporate activated',
          'Close',
          { duration: 3000 }
        );
        this.loadCorporates();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteCorporate(corporate: Corporate) {
    if (confirm(`Are you sure you want to delete "${corporate.name}"?`)) {
      this.userService.deleteCorporate(corporate.id).subscribe({
        next: () => {
          this.snackBar.open('Corporate deleted', 'Close', { duration: 3000 });
          this.loadCorporates();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
        }
      });
    }
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('corporates').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Corporates_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('corporates', file).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message || 'Corporates imported', 'Close', { duration: 3000 });
          this.loadCorporates();
        } else {
          this.snackBar.open(res.message || 'Failed to import', 'Close', { duration: 3000 });
        }
        input.value = '';
      },
      error: (err) => { this.snackBar.open(err.error?.message || 'Failed to import', 'Close', { duration: 3000 }); input.value = ''; }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('corporates').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Corporates_Export.xlsx');
        this.snackBar.open('Corporates exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
