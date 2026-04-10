import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { DepartmentService } from '@core/services/department.service';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Department } from '@core/models/department.model';
import { Corporate } from '@core/models/corporate.model';
import { DepartmentEditDialogComponent } from '../department-edit-dialog/department-edit-dialog.component';
import { DepartmentDetailDialogComponent } from '../department-detail-dialog/department-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="department-list-container">
      <div class="header">
        <h1>Departments</h1>
        <div class="header-actions">
          <button mat-stroked-button matTooltip="Download Template" (click)="downloadTemplate()">
            <mat-icon>description</mat-icon> Template
          </button>
          <button mat-stroked-button matTooltip="Import from Excel" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon> Import
          </button>
          <input hidden #fileInput type="file" accept=".xlsx" (change)="importFromExcel($event)">
          <button mat-stroked-button matTooltip="Export to Excel" (click)="exportToExcel()">
            <mat-icon>download</mat-icon> Export
          </button>
          <button mat-raised-button matTooltip="Add new Department" color="primary" (click)="openAddDepartment()">
            <mat-icon>add</mat-icon>
            Add Department
          </button>
        </div>
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

            <button mat-button matTooltip="Clear Filters" (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="content-area">
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
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button matTooltip="Actions" [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEditDepartment(row)">
                      <mat-icon>edit</mat-icon> <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="deleteDepartment(row)">
                      <mat-icon color="warn">delete</mat-icon> <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewDepartment(row)"></tr>
            </table>

            @if (displayedDepartments.length === 0) {
              <div class="no-data">
                <mat-icon>business</mat-icon>
                <p>No departments found. Add your first department.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .department-list-container {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-shrink: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .filter-card {
      margin-bottom: 1rem;
      flex-shrink: 0;
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

    .content-area {
      flex: 1;
      min-height: 0;
    }

    .table-card {
      width: 100%;
      height: 100%;
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

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f0f4ff;
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

  // Filters
  filterCorporateId: string | null = null;

  constructor(
    private departmentService: DepartmentService,
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

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

  viewDepartment(department: Department) {
    const dialogRef = this.dialog.open(DepartmentDetailDialogComponent, {
      data: department,
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditDepartment(department);
      }
    });
  }

  openAddDepartment() {
    const dialogRef = this.dialog.open(DepartmentEditDialogComponent, {
      data: { department: null, corporates: this.corporates },
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadDepartments();
      }
    });
  }

  openEditDepartment(department: Department) {
    const dialogRef = this.dialog.open(DepartmentEditDialogComponent, {
      data: { department, corporates: this.corporates },
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadDepartments();
      }
    });
  }

  deleteDepartment(department: Department) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Department',
        message: 'Are you sure you want to delete this department?',
        itemName: department.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
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
    });
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('departments').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Departments_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('departments', file).subscribe({
      next: (response) => {
        if (response.body) {
          const filename = this.importExportService.extractFilename(response, file.name.replace('.xlsx', '') + '_Result.xlsx');
          this.importExportService.downloadFile(response.body, filename);
        }
        this.snackBar.open('Import complete - results downloaded', 'Close', { duration: 5000 });
        this.loadDepartments();
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to import', 'Close', { duration: 5000 });
        input.value = '';
      }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('departments').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Departments_Export.xlsx');
        this.snackBar.open('Departments exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
