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
import { Branch } from '@core/models/branch.model';
import { Corporate } from '@core/models/corporate.model';
import { SBU } from '@core/models/user.model';

@Component({
  selector: 'app-branch-list',
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
    <div class="branch-list-container">
      <div class="header">
        <h1>Branches</h1>
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
          <button mat-raised-button color="primary" (click)="openNewForm()">
            <mat-icon>add</mat-icon>
            Add Branch
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Corporate</mat-label>
              <mat-select [(ngModel)]="filterCorporateId" (selectionChange)="onFilterCorporateChange()">
                <mat-option [value]="null">-- All Corporates --</mat-option>
                @for (corp of corporates; track corp.id) {
                  <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Filter by SBU</mat-label>
              <mat-select [(ngModel)]="filterSbuId" (selectionChange)="applyFilters()">
                <mat-option [value]="null">-- All SBUs --</mat-option>
                @for (sbu of filteredSbus; track sbu.id) {
                  <mat-option [value]="sbu.id">{{ sbu.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="content-grid" [class.with-form]="showForm">
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="displayedBranches" class="full-width">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="sbu">
                <th mat-header-cell *matHeaderCellDef>SBU</th>
                <td mat-cell *matCellDef="let row">{{ row.sbuName || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="corporate">
                <th mat-header-cell *matHeaderCellDef>Corporate</th>
                <td mat-cell *matCellDef="let row">{{ row.corporateName || '-' }}</td>
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
                  <button mat-icon-button (click)="editBranch(row)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="toggleStatus(row)" [matTooltip]="row.isActive ? 'Deactivate' : 'Activate'">
                    <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteBranch(row)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (displayedBranches.length === 0) {
              <div class="no-data">
                <mat-icon>store</mat-icon>
                <p>No branches found. Add your first branch.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (showForm) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingBranch ? 'Edit Branch' : 'Add Branch' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="branchForm" (ngSubmit)="saveBranch()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code">
                    @if (branchForm.get('code')?.hasError('required')) {
                      <mat-error>Code is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name">
                    @if (branchForm.get('name')?.hasError('required')) {
                      <mat-error>Name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Corporate (Optional Filter)</mat-label>
                  <mat-select formControlName="corporateId" (selectionChange)="onFormCorporateChange()">
                    <mat-option [value]="null">-- Select to filter SBUs --</mat-option>
                    @for (corp of corporates; track corp.id) {
                      <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Select to filter available SBUs</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>SBU</mat-label>
                  <mat-select formControlName="sbuId">
                    <mat-option [value]="null">-- Select SBU --</mat-option>
                    @for (sbu of formSbus; track sbu.id) {
                      <mat-option [value]="sbu.id">{{ sbu.name }} @if (sbu.corporateName) { ({{ sbu.corporateName }}) }</mat-option>
                    }
                  </mat-select>
                  @if (branchForm.get('sbuId')?.hasError('required')) {
                    <mat-error>SBU is required</mat-error>
                  }
                </mat-form-field>

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
                    @if (branchForm.get('contactEmail')?.hasError('email')) {
                      <mat-error>Invalid email format</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Contact Phone</mat-label>
                    <input matInput formControlName="contactPhone">
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="showForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="loading || branchForm.invalid">
                    {{ editingBranch ? 'Update' : 'Create' }}
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
    .branch-list-container { padding: 1rem; }

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

    .filter-card {
      margin-bottom: 1rem;
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-row mat-form-field {
      min-width: 200px;
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
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  displayedBranches: Branch[] = [];
  corporates: Corporate[] = [];
  allSbus: SBU[] = [];
  filteredSbus: SBU[] = [];
  formSbus: SBU[] = [];

  displayedColumns = ['code', 'name', 'sbu', 'corporate', 'status', 'actions'];
  showForm = false;
  editingBranch: Branch | null = null;
  loading = false;
  branchForm: FormGroup;

  // Filters
  filterCorporateId: string | null = null;
  filterSbuId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private importExportService: ImportExportService,
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
    this.loadBranches();
    this.loadCorporates();
    this.loadSbus();
  }

  loadBranches() {
    this.userService.getBranches().subscribe(res => {
      if (res.success) {
        this.branches = res.data;
        this.applyFilters();
      }
    });
  }

  loadCorporates() {
    this.userService.getActiveCorporates().subscribe(res => {
      if (res.success) {
        this.corporates = res.data;
      }
    });
  }

  loadSbus() {
    this.userService.getSBUs().subscribe(res => {
      if (res.success) {
        this.allSbus = res.data;
        this.filteredSbus = [...this.allSbus];
        this.formSbus = [...this.allSbus];
      }
    });
  }

  onFilterCorporateChange() {
    if (this.filterCorporateId) {
      this.filteredSbus = this.allSbus.filter(s => s.corporateId === this.filterCorporateId);
    } else {
      this.filteredSbus = [...this.allSbus];
    }
    this.filterSbuId = null;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.branches];

    if (this.filterCorporateId) {
      result = result.filter(b => b.corporateId === this.filterCorporateId);
    }

    if (this.filterSbuId) {
      result = result.filter(b => b.sbuId === this.filterSbuId);
    }

    this.displayedBranches = result;
  }

  clearFilters() {
    this.filterCorporateId = null;
    this.filterSbuId = null;
    this.filteredSbus = [...this.allSbus];
    this.applyFilters();
  }

  openNewForm() {
    this.showForm = true;
    this.editingBranch = null;
    this.branchForm.reset();
    this.formSbus = [...this.allSbus];
  }

  onFormCorporateChange() {
    const corporateId = this.branchForm.get('corporateId')?.value;
    if (corporateId) {
      this.formSbus = this.allSbus.filter(s => s.corporateId === corporateId);
    } else {
      this.formSbus = [...this.allSbus];
    }
    this.branchForm.patchValue({ sbuId: null });
  }

  editBranch(branch: Branch) {
    this.editingBranch = branch;
    this.showForm = true;

    // Set formSbus first if there's a corporateId
    if (branch.corporateId) {
      this.formSbus = this.allSbus.filter(s => s.corporateId === branch.corporateId);
    } else {
      this.formSbus = [...this.allSbus];
    }

    this.branchForm.patchValue({
      code: branch.code,
      name: branch.name,
      description: branch.description,
      address: branch.address,
      corporateId: branch.corporateId || null,
      sbuId: branch.sbuId,
      contactEmail: branch.contactEmail,
      contactPhone: branch.contactPhone
    });
  }

  saveBranch() {
    if (this.branchForm.invalid) return;

    this.loading = true;
    const formData = this.branchForm.value;

    // Remove corporateId as it's just for filtering, not stored
    const data = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      sbuId: formData.sbuId,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone
    };

    const request = this.editingBranch
      ? this.userService.updateBranch(this.editingBranch.id, data)
      : this.userService.createBranch(data);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.editingBranch ? 'Branch updated' : 'Branch created',
            'Close',
            { duration: 3000 }
          );
          this.showForm = false;
          this.editingBranch = null;
          this.branchForm.reset();
          this.loadBranches();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  toggleStatus(branch: Branch) {
    const request = branch.isActive
      ? this.userService.deactivateBranch(branch.id)
      : this.userService.activateBranch(branch.id);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          branch.isActive ? 'Branch deactivated' : 'Branch activated',
          'Close',
          { duration: 3000 }
        );
        this.loadBranches();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteBranch(branch: Branch) {
    if (confirm(`Are you sure you want to delete "${branch.name}"?`)) {
      this.userService.deleteBranch(branch.id).subscribe({
        next: () => {
          this.snackBar.open('Branch deleted', 'Close', { duration: 3000 });
          this.loadBranches();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
        }
      });
    }
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('branches').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Branches_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('branches', file).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message || 'Branches imported', 'Close', { duration: 3000 });
          this.loadBranches();
        } else {
          this.snackBar.open(res.message || 'Failed to import', 'Close', { duration: 3000 });
        }
        input.value = '';
      },
      error: (err) => { this.snackBar.open(err.error?.message || 'Failed to import', 'Close', { duration: 3000 }); input.value = ''; }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('branches').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Branches_Export.xlsx');
        this.snackBar.open('Branches exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
