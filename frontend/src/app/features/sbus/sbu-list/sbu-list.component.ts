import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { SBU } from '@core/models/user.model';
import { Corporate } from '@core/models/corporate.model';
import { SbuDetailDialogComponent } from '../sbu-detail-dialog/sbu-detail-dialog.component';
import { SbuEditDialogComponent } from '../sbu-edit-dialog/sbu-edit-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-sbu-list',
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
    <div class="sbu-list-container">
      <div class="header">
        <h1>SBU Management</h1>
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
          <button mat-raised-button matTooltip="Add new SBU" color="primary" (click)="openAddSbu()">
            <mat-icon>add</mat-icon> Add SBU
          </button>
        </div>
      </div>

      <div class="content-area">
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="flatSbus" class="full-width">
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
                <td mat-cell *matCellDef="let row">{{ row.corporateName || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="parent">
                <th mat-header-cell *matHeaderCellDef>Parent SBU</th>
                <td mat-cell *matCellDef="let row">{{ row.parentName || row.parent?.name || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>Address</th>
                <td mat-cell *matCellDef="let row">{{ row.address || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="contactEmail">
                <th mat-header-cell *matHeaderCellDef>Contact Email</th>
                <td mat-cell *matCellDef="let row">{{ row.contactEmail || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="contactPhone">
                <th mat-header-cell *matHeaderCellDef>Contact Phone</th>
                <td mat-cell *matCellDef="let row">{{ row.contactPhone || '-' }}</td>
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
                    <button mat-menu-item (click)="openEditSbu(row)">
                      <mat-icon>edit</mat-icon> <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="openAddChildSbu(row)">
                      <mat-icon>add</mat-icon> <span>Add Child SBU</span>
                    </button>
                    <button mat-menu-item (click)="deleteSbu(row)">
                      <mat-icon color="warn">delete</mat-icon> <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="viewSbu(row)"></tr>
            </table>

            @if (flatSbus.length === 0) {
              <div class="no-data">
                <mat-icon>business</mat-icon>
                <p>No SBUs configured. Add your first SBU to get started.</p>
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

    .sbu-list-container {
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
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
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

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f0f4ff;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #666;
      text-align: center;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .mat-column-actions {
      width: 140px;
      text-align: center;
    }
  `]
})
export class SbuListComponent implements OnInit {
  flatSbus: SBU[] = [];
  corporates: Corporate[] = [];
  displayedColumns = ['code', 'name', 'corporate', 'parent', 'address', 'contactEmail', 'contactPhone', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadSbus();
    this.loadCorporates();
  }

  loadCorporates() {
    this.userService.getActiveCorporates().subscribe(res => {
      if (res.success) {
        this.corporates = res.data;
      }
    });
  }

  loadSbus() {
    this.userService.getSbus().subscribe(res => {
      if (res.success) {
        this.flatSbus = res.data;
      }
    });
  }

  // --- Dialogs ---

  viewSbu(sbu: SBU) {
    const dialogRef = this.dialog.open(SbuDetailDialogComponent, {
      data: sbu,
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditSbu(sbu);
      } else if (result === 'addChild') {
        this.openAddChildSbu(sbu);
      }
    });
  }

  openAddSbu() {
    const dialogRef = this.dialog.open(SbuEditDialogComponent, {
      data: { sbu: null, corporates: this.corporates, flatSbus: this.flatSbus },
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadSbus();
      }
    });
  }

  openEditSbu(sbu: SBU) {
    const dialogRef = this.dialog.open(SbuEditDialogComponent, {
      data: { sbu, corporates: this.corporates, flatSbus: this.flatSbus },
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadSbus();
      }
    });
  }

  openAddChildSbu(parentSbu: SBU) {
    const dialogRef = this.dialog.open(SbuEditDialogComponent, {
      data: {
        sbu: null,
        corporates: this.corporates,
        flatSbus: this.flatSbus,
        parentId: parentSbu.id,
        corporateId: parentSbu.corporateId
      },
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadSbus();
      }
    });
  }

  deleteSbu(sbu: SBU) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete SBU',
        message: 'Are you sure you want to delete this SBU? This will also delete all child SBUs.',
        itemName: sbu.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.userService.deleteSbu(sbu.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('SBU deleted successfully', 'Close', { duration: 3000 });
              this.loadSbus();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete SBU', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // --- Import/Export ---

  downloadTemplate() {
    this.importExportService.downloadTemplate('sbus').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'SBUs_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('sbus', file).subscribe({
      next: (response) => {
        if (response.body) {
          const filename = this.importExportService.extractFilename(response, file.name.replace('.xlsx', '') + '_Result.xlsx');
          this.importExportService.downloadFile(response.body, filename);
        }
        this.snackBar.open('Import complete - results downloaded', 'Close', { duration: 5000 });
        this.loadSbus();
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to import', 'Close', { duration: 5000 });
        input.value = '';
      }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('sbus').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'SBUs_Export.xlsx');
        this.snackBar.open('SBUs exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
