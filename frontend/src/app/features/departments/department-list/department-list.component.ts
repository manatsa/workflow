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
import { DepartmentService } from '@core/services/department.service';
import { UserService } from '@core/services/user.service';
import { Department } from '@core/models/department.model';
import { Corporate } from '@core/models/corporate.model';

@Component({
  selector: 'app-department-list',
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
    <div class="department-list-container">
      <div class="header">
        <h1>Departments</h1>
        <button mat-raised-button color="primary" (click)="openNewForm()">
          <mat-icon>add</mat-icon>
          Add Department
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Corporate</mat-label>
              <mat-select [(ngModel)]="filterCorporateId" (selectionChange)="applyFilters()">
                <mat-option [value]="null">-- All Corporates --</mat-option>
                @for (corp of corporates; track corp.id) {
                  <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
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
            <table mat-table [dataSource]="displayedDepartments" class="full-width">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="corporate">
                <th mat-header-cell *matHeaderCellDef>Corporate</th>
                <td mat-cell *matCellDef="let row">{{ row.corporateName || 'Global' }}</td>
              </ng-container>

              <ng-container matColumnDef="headOfDepartment">
                <th mat-header-cell *matHeaderCellDef>Head of Department</th>
                <td mat-cell *matCellDef="let row">{{ row.headOfDepartment || '-' }}</td>
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
                  <button mat-icon-button (click)="editDepartment(row)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteDepartment(row)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (displayedDepartments.length === 0) {
              <div class="no-data">
                <mat-icon>business</mat-icon>
                <p>No departments found. Add your first department.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (showForm) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingDepartment ? 'Edit Department' : 'Add Department' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="departmentForm" (ngSubmit)="saveDepartment()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Code</mat-label>
                    <input matInput formControlName="code">
                    @if (departmentForm.get('code')?.hasError('required')) {
                      <mat-error>Code is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name">
                    @if (departmentForm.get('name')?.hasError('required')) {
                      <mat-error>Name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Corporate (Optional)</mat-label>
                  <mat-select formControlName="corporateId">
                    <mat-option [value]="null">-- Global (All Corporates) --</mat-option>
                    @for (corp of corporates; track corp.id) {
                      <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>Leave empty for global department accessible to all corporates</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field full-width">
                  <mat-label>Head of Department</mat-label>
                  <input matInput formControlName="headOfDepartment">
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Contact Email</mat-label>
                    <input matInput formControlName="contactEmail" type="email">
                    @if (departmentForm.get('contactEmail')?.hasError('email')) {
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
                  <button mat-raised-button color="primary" type="submit" [disabled]="loading || departmentForm.invalid">
                    {{ editingDepartment ? 'Update' : 'Create' }}
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
    .department-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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
      width: 120px;
      text-align: center;
    }
  `]
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  displayedDepartments: Department[] = [];
  corporates: Corporate[] = [];

  displayedColumns = ['code', 'name', 'corporate', 'headOfDepartment', 'status', 'actions'];
  showForm = false;
  editingDepartment: Department | null = null;
  loading = false;
  departmentForm: FormGroup;

  // Filters
  filterCorporateId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private userService: UserService,
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
    this.loadDepartments();
    this.loadCorporates();
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe(res => {
      if (res.success) {
        this.departments = res.data;
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

  applyFilters() {
    let result = [...this.departments];

    if (this.filterCorporateId) {
      result = result.filter(d => d.corporateId === this.filterCorporateId);
    }

    this.displayedDepartments = result;
  }

  clearFilters() {
    this.filterCorporateId = null;
    this.applyFilters();
  }

  openNewForm() {
    this.showForm = true;
    this.editingDepartment = null;
    this.departmentForm.reset();
  }

  editDepartment(department: Department) {
    this.editingDepartment = department;
    this.showForm = true;

    this.departmentForm.patchValue({
      code: department.code,
      name: department.name,
      description: department.description,
      corporateId: department.corporateId || null,
      headOfDepartment: department.headOfDepartment,
      contactEmail: department.contactEmail,
      contactPhone: department.contactPhone
    });
  }

  saveDepartment() {
    if (this.departmentForm.invalid) return;

    this.loading = true;
    const formData = this.departmentForm.value;

    const request = this.editingDepartment
      ? this.departmentService.updateDepartment(this.editingDepartment.id, formData)
      : this.departmentService.createDepartment(formData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.editingDepartment ? 'Department updated' : 'Department created',
            'Close',
            { duration: 3000 }
          );
          this.showForm = false;
          this.editingDepartment = null;
          this.departmentForm.reset();
          this.loadDepartments();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteDepartment(department: Department) {
    if (confirm(`Are you sure you want to delete "${department.name}"?`)) {
      this.departmentService.deleteDepartment(department.id).subscribe({
        next: () => {
          this.snackBar.open('Department deleted', 'Close', { duration: 3000 });
          this.loadDepartments();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
