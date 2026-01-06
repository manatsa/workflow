import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '@core/models/user.model';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>person</mat-icon>
        User Details
      </h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="user-header">
        <div class="avatar">{{ getInitials() }}</div>
        <div class="user-title">
          <h3>{{ data.fullName || (data.firstName + ' ' + data.lastName) }}</h3>
          <span class="username">{{ data.username }}</span>
          <div class="status-badges">
            <span class="badge" [class]="data.userType?.toLowerCase()">{{ data.userType }}</span>
            @if (data.isLocked || data.locked) {
              <span class="badge locked">Locked</span>
            } @else if (data.isActive || data.enabled) {
              <span class="badge active">Active</span>
            } @else {
              <span class="badge inactive">Inactive</span>
            }
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <mat-tab-group>
        <mat-tab label="Personal Info">
          <div class="tab-content">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">First Name</span>
                <span class="value">{{ data.firstName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Last Name</span>
                <span class="value">{{ data.lastName || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Email</span>
                <span class="value">{{ data.email || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Phone</span>
                <span class="value">{{ data.phoneNumber || data.phone || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Staff ID</span>
                <span class="value">{{ data.staffId || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Department</span>
                <span class="value">{{ data.department || '-' }}</span>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Account Info">
          <div class="tab-content">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Username</span>
                <span class="value">{{ data.username }}</span>
              </div>
              <div class="detail-item">
                <span class="label">User Type</span>
                <span class="value">{{ data.userType }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Status</span>
                <span class="value">
                  @if (data.isLocked || data.locked) {
                    Locked
                  } @else if (data.isActive || data.enabled) {
                    Active
                  } @else {
                    Inactive
                  }
                </span>
              </div>
              @if (data.lockReason) {
                <div class="detail-item full-width">
                  <span class="label">Lock Reason</span>
                  <span class="value">{{ data.lockReason }}</span>
                </div>
              }
              <div class="detail-item">
                <span class="label">Must Change Password</span>
                <span class="value">{{ data.mustChangePassword ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Last Login</span>
                <span class="value">{{ data.lastLogin ? (data.lastLogin | date:'medium') : 'Never' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Password Changed</span>
                <span class="value">{{ data.passwordChangedAt ? (data.passwordChangedAt | date:'medium') : '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Created At</span>
                <span class="value">{{ data.createdAt | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Created By</span>
                <span class="value">{{ data.createdBy || '-' }}</span>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Roles & Permissions">
          <div class="tab-content">
            <div class="section">
              <h4>Roles</h4>
              @if (data.roles && data.roles.length > 0) {
                <div class="chips-container">
                  @for (role of data.roles; track role.id || role) {
                    <mat-chip>{{ role.name || role }}</mat-chip>
                  }
                </div>
              } @else {
                <p class="no-data">No roles assigned</p>
              }
            </div>

            <div class="section">
              <h4>Privileges</h4>
              @if (data.privileges && data.privileges.length > 0) {
                <div class="chips-container">
                  @for (privilege of data.privileges; track privilege) {
                    <mat-chip class="privilege-chip">{{ privilege }}</mat-chip>
                  }
                </div>
              } @else {
                <p class="no-data">No privileges assigned</p>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Organization">
          <div class="tab-content">
            <div class="section">
              <h4>Corporates</h4>
              @if (data.corporates && data.corporates.length > 0) {
                <div class="chips-container">
                  @for (corp of data.corporates; track corp.id) {
                    <mat-chip>{{ corp.name }}</mat-chip>
                  }
                </div>
              } @else if (data.corporateIds && data.corporateIds.length > 0) {
                <p class="no-data">{{ data.corporateIds.length }} corporate(s) assigned</p>
              } @else {
                <p class="no-data">No corporates assigned (Global Access)</p>
              }
            </div>

            <div class="section">
              <h4>SBUs</h4>
              @if (data.sbus && data.sbus.length > 0) {
                <div class="chips-container">
                  @for (sbu of data.sbus; track sbu.id) {
                    <mat-chip>{{ sbu.name }}</mat-chip>
                  }
                </div>
              } @else if (data.sbuIds && data.sbuIds.length > 0) {
                <p class="no-data">{{ data.sbuIds.length }} SBU(s) assigned</p>
              } @else {
                <p class="no-data">No SBUs assigned</p>
              }
            </div>

            <div class="section">
              <h4>Branches</h4>
              @if (data.branches && data.branches.length > 0) {
                <div class="chips-container">
                  @for (branch of data.branches; track branch.id) {
                    <mat-chip>{{ branch.name }}</mat-chip>
                  }
                </div>
              } @else if (data.branchIds && data.branchIds.length > 0) {
                <p class="no-data">{{ data.branchIds.length }} branch(es) assigned</p>
              } @else {
                <p class="no-data">No branches assigned</p>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions>
      <div class="action-buttons">
        <button mat-stroked-button color="primary" (click)="editUser()">
          <mat-icon>edit</mat-icon>
          Edit
        </button>
        @if (isLocked) {
          <button mat-stroked-button (click)="unlockUser()">
            <mat-icon>lock_open</mat-icon>
            Unlock
          </button>
        } @else {
          <button mat-stroked-button color="warn" (click)="lockUser()">
            <mat-icon>lock</mat-icon>
            Lock
          </button>
        }
        <button mat-stroked-button (click)="resetPassword()">
          <mat-icon>vpn_key</mat-icon>
          Reset Password
        </button>
      </div>
      <span class="spacer"></span>
      <button mat-button (click)="close()">Close</button>
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
      min-width: 550px;
      max-height: 70vh;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .user-title h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .user-title .username {
      color: #666;
      font-size: 0.875rem;
    }

    .status-badges {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
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

    .tab-content {
      padding: 1rem 0;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item.full-width {
      grid-column: span 2;
    }

    .detail-item .label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-item .value {
      font-weight: 500;
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section h4 {
      margin: 0 0 0.75rem 0;
      color: #1976d2;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .privilege-chip {
      background: #e3f2fd !important;
    }

    .no-data {
      color: #666;
      font-style: italic;
      margin: 0;
    }

    mat-divider {
      margin: 0.5rem 0;
    }

    mat-dialog-actions {
      display: flex;
      align-items: center;
      padding: 8px 16px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-buttons button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .spacer {
      flex: 1;
    }
  `]
})
export class UserDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: User,
    private dialogRef: MatDialogRef<UserDetailDialogComponent>,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  get isLocked(): boolean {
    return this.data.isLocked || this.data.locked || false;
  }

  getInitials(): string {
    const first = this.data.firstName?.[0] || '';
    const last = this.data.lastName?.[0] || '';
    return (first + last).toUpperCase() || this.data.username?.[0]?.toUpperCase() || '?';
  }

  editUser() {
    this.dialogRef.close();
    this.router.navigate(['/users', this.data.id]);
  }

  lockUser() {
    this.userService.lockUser(this.data.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('User locked successfully', 'Close', { duration: 3000 });
          this.data.isLocked = true;
          this.data.locked = true;
          this.dialogRef.close('refresh');
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to lock user', 'Close', { duration: 3000 });
      }
    });
  }

  unlockUser() {
    this.userService.unlockUser(this.data.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('User unlocked successfully', 'Close', { duration: 3000 });
          this.data.isLocked = false;
          this.data.locked = false;
          this.dialogRef.close('refresh');
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to unlock user', 'Close', { duration: 3000 });
      }
    });
  }

  resetPassword() {
    this.userService.adminResetPassword(this.data.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Password reset email sent', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to reset password', 'Close', { duration: 3000 });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
