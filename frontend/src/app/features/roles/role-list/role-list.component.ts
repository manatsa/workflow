import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Role, Privilege } from '@core/models/user.model';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="role-list-container">
      <div class="header">
        <h1>Roles & Privileges</h1>
        <button mat-raised-button color="primary" (click)="showAddRole = true">
          <mat-icon>add</mat-icon>
          Add Role
        </button>
      </div>

      <div class="content-grid">
        <mat-card class="roles-card">
          <mat-card-header>
            <mat-card-title>Roles</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (showAddRole) {
              <div class="add-role-form">
                <form [formGroup]="roleForm" (ngSubmit)="saveRole()">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Role Name</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Description</mat-label>
                    <input matInput formControlName="description">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Privileges</mat-label>
                    <mat-select formControlName="privilegeIds" multiple>
                      @for (priv of privileges; track priv.id) {
                        <mat-option [value]="priv.id">{{ priv.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <div class="form-actions">
                    <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
                    <button mat-raised-button color="primary" type="submit">
                      {{ editingRole ? 'Update' : 'Create' }}
                    </button>
                  </div>
                </form>
              </div>
            }

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
                  <button mat-icon-button (click)="editRole(role)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="deleteRole(role)" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rolesColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rolesColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <mat-card class="privileges-card">
          <mat-card-header>
            <mat-card-title>Privileges</mat-card-title>
            <button mat-icon-button (click)="showAddPrivilege = true">
              <mat-icon>add</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (showAddPrivilege) {
              <div class="add-privilege-form">
                <form [formGroup]="privilegeForm" (ngSubmit)="savePrivilege()">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Privilege Name</mat-label>
                    <input matInput formControlName="name">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Description</mat-label>
                    <input matInput formControlName="description">
                  </mat-form-field>

                  <div class="form-actions">
                    <button mat-button type="button" (click)="showAddPrivilege = false">Cancel</button>
                    <button mat-raised-button color="primary" type="submit">Create</button>
                  </div>
                </form>
              </div>
            }

            <div class="privilege-list">
              @for (priv of privileges; track priv.id) {
                <div class="privilege-item">
                  <div class="privilege-info">
                    <strong>{{ priv.name }}</strong>
                    @if (priv.description) {
                      <span class="description">{{ priv.description }}</span>
                    }
                  </div>
                  <button mat-icon-button (click)="deletePrivilege(priv)" color="warn"
                          [disabled]="priv.name === 'ADMIN'">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .role-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
    }

    .add-role-form, .add-privilege-form {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .form-field {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .data-table {
      width: 100%;
    }

    .description {
      font-size: 0.75rem;
      color: #666;
    }

    .more {
      font-size: 0.75rem;
      color: #666;
      margin-left: 0.25rem;
    }

    .privilege-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .privilege-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }

    .privilege-item:last-child {
      border-bottom: none;
    }

    .privilege-info {
      display: flex;
      flex-direction: column;
    }

    .privilege-info .description {
      font-size: 0.75rem;
      color: #666;
    }
  `]
})
export class RoleListComponent implements OnInit {
  rolesColumns = ['name', 'privileges', 'actions'];
  rolesDataSource = new MatTableDataSource<Role>([]);
  privileges: Privilege[] = [];

  showAddRole = false;
  showAddPrivilege = false;
  editingRole: Role | null = null;

  roleForm: FormGroup;
  privilegeForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      privilegeIds: [[]]
    });

    this.privilegeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

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
      }
    });
  }

  editRole(role: Role) {
    this.editingRole = role;
    this.showAddRole = true;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      privilegeIds: role.privilegeIds || []
    });
  }

  cancelEdit() {
    this.showAddRole = false;
    this.editingRole = null;
    this.roleForm.reset();
  }

  saveRole() {
    if (this.roleForm.invalid) return;

    const roleData = this.roleForm.value;
    const request = this.editingRole
      ? this.userService.updateRole(this.editingRole.id, roleData)
      : this.userService.createRole(roleData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.editingRole ? 'Role updated successfully' : 'Role created successfully',
            'Close',
            { duration: 3000 }
          );
          this.cancelEdit();
          this.loadRoles();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  deleteRole(role: Role) {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
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
  }

  savePrivilege() {
    if (this.privilegeForm.invalid) return;

    this.userService.createPrivilege(this.privilegeForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Privilege created successfully', 'Close', { duration: 3000 });
          this.showAddPrivilege = false;
          this.privilegeForm.reset();
          this.loadPrivileges();
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to create privilege', 'Close', { duration: 3000 });
      }
    });
  }

  deletePrivilege(priv: Privilege) {
    if (priv.name === 'ADMIN') {
      this.snackBar.open('Cannot delete system privilege', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete the privilege "${priv.name}"?`)) {
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
  }
}
