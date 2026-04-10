import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Role, Privilege } from '@core/models/user.model';
import { RoleDetailDialogComponent } from '../role-detail-dialog/role-detail-dialog.component';
import { RoleEditDialogComponent } from '../role-edit-dialog/role-edit-dialog.component';
import { PrivilegeEditDialogComponent } from '../privilege-edit-dialog/privilege-edit-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-role-list',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule],
  template: `
    <div class="role-list-container">
      <div class="header">
        <h1>Roles & Privileges</h1>
        <div class="header-actions">
          @if (activeTab === 0) {
            <button mat-stroked-button matTooltip="Template" (click)="downloadTemplate('roles')">
              <mat-icon>description</mat-icon> Template
            </button>
            <button mat-stroked-button matTooltip="Import" (click)="rolesFileInput.click()">
              <mat-icon>upload</mat-icon> Import
            </button>
            <input hidden #rolesFileInput type="file" accept=".xlsx" (change)="importFromExcel($event, 'roles')">
            <button mat-stroked-button matTooltip="Export" (click)="exportToExcel('roles')">
              <mat-icon>download</mat-icon> Export
            </button>
            <button mat-raised-button matTooltip="Add Role" color="primary" (click)="openAddRole()">
              <mat-icon>add</mat-icon> Add Role
            </button>
          } @else {
            <button mat-stroked-button matTooltip="Template" (click)="downloadTemplate('privileges')">
              <mat-icon>description</mat-icon> Template
            </button>
            <button mat-stroked-button matTooltip="Import" (click)="privilegesFileInput.click()">
              <mat-icon>upload</mat-icon> Import
            </button>
            <input hidden #privilegesFileInput type="file" accept=".xlsx" (change)="importFromExcel($event, 'privileges')">
            <button mat-stroked-button matTooltip="Export" (click)="exportToExcel('privileges')">
              <mat-icon>download</mat-icon> Export
            </button>
            <button mat-raised-button matTooltip="Add Privilege" color="primary" (click)="openAddPrivilege()">
              <mat-icon>add</mat-icon> Add Privilege
            </button>
          }
        </div>
      </div>

      <mat-tab-group (selectedTabChange)="activeTab = $event.index">
        <!-- Roles Tab -->
        <mat-tab label="Roles">
          <div class="tab-content">
            <table mat-table [dataSource]="rolesDataSource" matSort class="data-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let role">
                  <strong>{{ role.name }}</strong>
                  @if (role.description) {
                    <div class="description">{{ role.description }}</div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="privileges">
                <th mat-header-cell *matHeaderCellDef>Privileges</th>
                <td mat-cell *matCellDef="let role">
                  @for (priv of role.privileges?.slice(0, 3); track priv.id) {
                    <mat-chip>{{ priv.name }}</mat-chip>
                  }
                  @if (role.privileges?.length > 3) {
                    <span class="more">+{{ role.privileges.length - 3 }} more</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let role">
                  <button mat-icon-button matTooltip="Edit" (click)="openEditRole(role); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete" (click)="deleteRole(role); $event.stopPropagation()" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rolesColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rolesColumns;" (click)="viewRole(row)" class="clickable-row"></tr>
            </table>
          </div>
        </mat-tab>

        <!-- Privileges Tab -->
        <mat-tab label="Privileges">
          <div class="tab-content">
            <table mat-table [dataSource]="privilegesDataSource" class="data-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let priv">
                  <strong>{{ priv.name }}</strong>
                  @if (priv.description) {
                    <div class="description">{{ priv.description }}</div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let priv">{{ priv.category }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let priv">
                  <button mat-icon-button matTooltip="Edit" (click)="openEditPrivilege(priv); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete" (click)="deletePrivilege(priv); $event.stopPropagation()" color="warn"
                          [disabled]="priv.name === 'ADMIN'">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="privilegesColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: privilegesColumns;" (click)="openEditPrivilege(row)" class="clickable-row"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    app-role-list .role-list-container { padding: 1rem; }

    app-role-list .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    app-role-list .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    app-role-list .tab-content {
      padding: 1rem 0;
    }

    app-role-list .data-table {
      width: 100%;
    }

    app-role-list .description {
      font-size: 0.75rem;
      color: #666;
    }

    app-role-list .more {
      font-size: 0.75rem;
      color: #666;
      margin-left: 0.25rem;
    }

    app-role-list .clickable-row {
      cursor: pointer;
    }

    app-role-list .clickable-row:hover {
      background: #f0f4ff;
    }
  `]
})
export class RoleListComponent implements OnInit {
  activeTab = 0;
  rolesColumns = ['name', 'privileges', 'actions'];
  privilegesColumns = ['name', 'category', 'actions'];
  rolesDataSource = new MatTableDataSource<Role>([]);
  privilegesDataSource = new MatTableDataSource<Privilege>([]);
  privileges: Privilege[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.loadPrivileges();
  }

  ngAfterViewInit() {
    this.rolesDataSource.paginator = this.paginator;
    this.rolesDataSource.sort = this.sort;
  }

  loadRoles() {
    this.userService.getRoles().subscribe(res => {
      if (res.success) {
        this.rolesDataSource.data = res.data;
      }
    });
  }

  loadPrivileges() {
    this.userService.getPrivileges().subscribe(res => {
      if (res.success) {
        this.privileges = res.data;
        this.privilegesDataSource.data = res.data;
      }
    });
  }

  // --- Role dialogs ---

  viewRole(role: Role) {
    const dialogRef = this.dialog.open(RoleDetailDialogComponent, {
      data: role,
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditRole(role);
      }
    });
  }

  openAddRole() {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      data: { role: null, privileges: this.privileges },
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadRoles();
      }
    });
  }

  openEditRole(role: Role) {
    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      data: { role, privileges: this.privileges },
      width: '600px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadRoles();
      }
    });
  }

  deleteRole(role: Role) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Role',
        message: 'Are you sure you want to delete this role?',
        itemName: role.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.userService.deleteRole(role.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Role deleted successfully', 'Close', { duration: 3000 });
              this.loadRoles();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete role', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // --- Privilege dialogs ---

  openAddPrivilege() {
    const dialogRef = this.dialog.open(PrivilegeEditDialogComponent, {
      data: null,
      width: '500px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadPrivileges();
      }
    });
  }

  openEditPrivilege(priv: Privilege) {
    const dialogRef = this.dialog.open(PrivilegeEditDialogComponent, {
      data: priv,
      width: '500px',
      maxHeight: '85vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadPrivileges();
      }
    });
  }

  deletePrivilege(priv: Privilege) {
    if (priv.name === 'ADMIN') {
      this.snackBar.open('Cannot delete system privilege', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Privilege',
        message: 'Are you sure you want to delete this privilege?',
        itemName: priv.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.userService.deletePrivilege(priv.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.snackBar.open('Privilege deleted successfully', 'Close', { duration: 3000 });
              this.loadPrivileges();
            }
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete privilege', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // --- Import/Export ---

  downloadTemplate(entity: string) {
    this.importExportService.downloadTemplate(entity).subscribe({
      next: (blob) => {
        const label = entity.charAt(0).toUpperCase() + entity.slice(1);
        this.importExportService.downloadFile(blob, `${label}_Template.xlsx`);
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event, entity: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel(entity, file).subscribe({
      next: (response) => {
        if (response.body) {
          const filename = this.importExportService.extractFilename(response, file.name.replace('.xlsx', '') + '_Result.xlsx');
          this.importExportService.downloadFile(response.body, filename);
        }
        this.snackBar.open('Import complete - results downloaded', 'Close', { duration: 5000 });
        if (entity === 'roles') {
          this.loadRoles();
        } else {
          this.loadPrivileges();
        }
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to import', 'Close', { duration: 5000 });
        input.value = '';
      }
    });
  }

  exportToExcel(entity: string) {
    const label = entity.charAt(0).toUpperCase() + entity.slice(1);
    this.importExportService.exportToExcel(entity).subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, `${label}_Export.xlsx`);
        this.snackBar.open(`${label} exported`, 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
