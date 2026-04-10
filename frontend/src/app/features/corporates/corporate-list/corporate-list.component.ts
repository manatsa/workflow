import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Corporate } from '@core/models/corporate.model';
import { Category } from '@core/models/category.model';
import { CorporateEditDialogComponent } from '../corporate-edit-dialog/corporate-edit-dialog.component';
import { CorporateDetailDialogComponent } from '../corporate-detail-dialog/corporate-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-corporate-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="corporate-list-container">
      <div class="header">
        <h1>Corporates</h1>
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
          <button mat-raised-button matTooltip="Add new Corporate" color="primary" (click)="openAddCorporate()">
            <mat-icon>add</mat-icon>
            Add Corporate
          </button>
        </div>
      </div>

      <div class="content-area">
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

              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>Address</th>
                <td mat-cell *matCellDef="let row">{{ row.address || '-' }}</td>
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
                    <button mat-menu-item (click)="openEditCorporate(row)">
                      <mat-icon>edit</mat-icon> <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="toggleStatus(row)">
                      <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                      <span>{{ row.isActive ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                    <button mat-menu-item (click)="deleteCorporate(row)">
                      <mat-icon color="warn">delete</mat-icon> <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewCorporate(row)"></tr>
            </table>

            @if (corporates.length === 0) {
              <div class="no-data">
                <mat-icon>corporate_fare</mat-icon>
                <p>No corporates found. Add your first corporate.</p>
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

    .corporate-list-container {
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
      width: 150px;
      text-align: center;
    }
  `]
})
export class CorporateListComponent implements OnInit {
  corporates: Corporate[] = [];
  categories: Category[] = [];
  displayedColumns = ['code', 'name', 'category', 'type', 'address', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

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

  viewCorporate(corporate: Corporate) {
    const dialogRef = this.dialog.open(CorporateDetailDialogComponent, {
      data: corporate,
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditCorporate(corporate);
      }
    });
  }

  openAddCorporate() {
    const dialogRef = this.dialog.open(CorporateEditDialogComponent, {
      data: { corporate: null, categories: this.categories },
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadCorporates();
      }
    });
  }

  openEditCorporate(corporate: Corporate) {
    const dialogRef = this.dialog.open(CorporateEditDialogComponent, {
      data: { corporate, categories: this.categories },
      width: '650px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadCorporates();
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
          'Close', { duration: 3000 }
        );
        this.loadCorporates();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteCorporate(corporate: Corporate) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Corporate',
        message: 'Are you sure you want to delete this corporate?',
        itemName: corporate.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
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
    });
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
      next: (response) => {
        if (response.body) {
          const filename = this.importExportService.extractFilename(response, file.name.replace('.xlsx', '') + '_Result.xlsx');
          this.importExportService.downloadFile(response.body, filename);
        }
        this.snackBar.open('Import complete - results downloaded', 'Close', { duration: 5000 });
        this.loadCorporates();
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to import', 'Close', { duration: 5000 });
        input.value = '';
      }
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
