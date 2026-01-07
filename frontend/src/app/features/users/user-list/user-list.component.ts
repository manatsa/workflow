import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '@core/services/user.service';
import { ImportExportService } from '@core/services/import-export.service';
import { User } from '@core/models/user.model';
import { UserDetailDialogComponent } from '@shared/components/user-detail-dialog/user-detail-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="user-list-container">
      <div class="header">
        <h1>Users</h1>
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
          <button mat-raised-button color="primary" routerLink="/users/new">
            <mat-icon>add</mat-icon>
            Add User
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="table-toolbar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search users</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup)="applyFilter()"
                     placeholder="Search by name, username, or email">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-info">
                  <div class="avatar">{{ getInitials(user) }}</div>
                  <div>
                    <div class="name">{{ user.fullName }}</div>
                    <div class="email">{{ user.email }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Username</th>
              <td mat-cell *matCellDef="let user">{{ user.username }}</td>
            </ng-container>

            <ng-container matColumnDef="userType">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
              <td mat-cell *matCellDef="let user">
                <span class="badge" [class]="user.userType.toLowerCase()">{{ user.userType }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                @for (role of user.roles?.slice(0, 2); track role.id) {
                  <mat-chip>{{ role.name }}</mat-chip>
                }
                @if (user.roles?.length > 2) {
                  <span class="more">+{{ user.roles.length - 2 }} more</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let user">
                @if (user.locked) {
                  <span class="badge locked">Locked</span>
                } @else if (user.enabled) {
                  <span class="badge active">Active</span>
                } @else {
                  <span class="badge inactive">Inactive</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="lastLogin">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Login</th>
              <td mat-cell *matCellDef="let user">
                {{ user.lastLogin | date:'short' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="viewUser(user)">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/users', user.id]">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  @if (user.locked) {
                    <button mat-menu-item (click)="unlockUser(user)">
                      <mat-icon>lock_open</mat-icon>
                      <span>Unlock</span>
                    </button>
                  } @else {
                    <button mat-menu-item (click)="lockUser(user)">
                      <mat-icon>lock</mat-icon>
                      <span>Lock</span>
                    </button>
                  }
                  <button mat-menu-item (click)="resetPassword(user)">
                    <mat-icon>vpn_key</mat-icon>
                    <span>Reset Password</span>
                  </button>
                  <button mat-menu-item (click)="deleteUser(user)" class="delete-action">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-list-container { padding: 1rem; }

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

    .table-toolbar {
      margin-bottom: 1rem;
    }

    .search-field {
      width: 400px;
    }

    .data-table {
      width: 100%;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .user-info .name {
      font-weight: 500;
    }

    .user-info .email {
      font-size: 0.75rem;
      color: #666;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #f5f5f5; color: #666; }
    .badge.locked { background: #ffebee; color: #c62828; }
    .badge.system { background: #e3f2fd; color: #1565c0; }
    .badge.staff { background: #e8f5e9; color: #2e7d32; }
    .badge.manager { background: #fff3e0; color: #e65100; }
    .badge.external { background: #f3e5f5; color: #7b1fa2; }

    .more {
      font-size: 0.75rem;
      color: #666;
      margin-left: 0.25rem;
    }

    .delete-action {
      color: #c62828;
    }
  `]
})
export class UserListComponent implements OnInit {
  displayedColumns = ['fullName', 'username', 'userType', 'roles', 'status', 'lastLogin', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.userService.getUsers().subscribe(res => {
      if (res.success) {
        this.dataSource.data = res.data;
      }
    });
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  getInitials(user: User): string {
    return (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
  }

  viewUser(user: User) {
    const dialogRef = this.dialog.open(UserDetailDialogComponent, {
      width: '650px',
      maxHeight: '90vh',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadUsers();
      }
    });
  }

  lockUser(user: User) {
    this.userService.lockUser(user.id).subscribe(res => {
      if (res.success) {
        this.snackBar.open('User locked successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  unlockUser(user: User) {
    this.userService.unlockUser(user.id).subscribe(res => {
      if (res.success) {
        this.snackBar.open('User unlocked successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  resetPassword(user: User) {
    this.userService.adminResetPassword(user.id).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Password reset email sent', 'Close', { duration: 3000 });
      }
    });
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
      this.userService.deleteUser(user.id).subscribe(res => {
        if (res.success) {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        }
      });
    }
  }

  downloadTemplate() {
    this.importExportService.downloadTemplate('users').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Users_Template.xlsx');
        this.snackBar.open('Template downloaded', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to download template', 'Close', { duration: 3000 })
    });
  }

  importFromExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.importExportService.importFromExcel('users', file).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message || 'Users imported successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        } else {
          this.snackBar.open(res.message || 'Failed to import', 'Close', { duration: 3000 });
        }
        input.value = '';
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to import', 'Close', { duration: 3000 });
        input.value = '';
      }
    });
  }

  exportToExcel() {
    this.importExportService.exportToExcel('users').subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Users_Export.xlsx');
        this.snackBar.open('Users exported', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to export', 'Close', { duration: 3000 })
    });
  }
}
