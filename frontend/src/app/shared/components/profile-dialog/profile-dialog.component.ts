import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface ProfileDialogData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  staffId?: string;
  department?: string;
  userType: string;
  roles: string[];
  sbus?: any[];
  lastLogin?: string;
  createdAt?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="profile-dialog">
      <div class="profile-header">
        <div class="avatar">{{ userInitials }}</div>
        <div class="header-info">
          <h2>{{ data.fullName }}</h2>
          <span class="user-type">{{ data.userType }}</span>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="profile-content">
        <div class="info-section">
          <h4><mat-icon>person</mat-icon> Personal Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Username</span>
              <span class="value">{{ data.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value">{{ data.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">First Name</span>
              <span class="value">{{ data.firstName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Last Name</span>
              <span class="value">{{ data.lastName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone</span>
              <span class="value">{{ data.phoneNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Staff ID</span>
              <span class="value">{{ data.staffId || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Department</span>
              <span class="value">{{ data.department || '-' }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="info-section">
          <h4><mat-icon>security</mat-icon> Account Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">User Type</span>
              <span class="value badge" [class]="data.userType.toLowerCase()">{{ data.userType }}</span>
            </div>
            <div class="info-item">
              <span class="label">Account Status</span>
              <span class="value badge" [class.active]="data.isActive" [class.inactive]="!data.isActive">
                {{ data.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Last Login</span>
              <span class="value">{{ data.lastLogin ? (data.lastLogin | date:'medium') : 'Never' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Account Created</span>
              <span class="value">{{ data.createdAt ? (data.createdAt | date:'medium') : '-' }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="info-section">
          <h4><mat-icon>admin_panel_settings</mat-icon> Roles</h4>
          <div class="chips-container">
            @if (data.roles && data.roles.length > 0) {
              @for (role of data.roles; track role) {
                <span class="role-chip">{{ role }}</span>
              }
            } @else {
              <span class="no-data">No roles assigned</span>
            }
          </div>
        </div>

        @if (data.sbus && data.sbus.length > 0) {
          <mat-divider></mat-divider>
          <div class="info-section">
            <h4><mat-icon>business</mat-icon> Business Units</h4>
            <div class="chips-container">
              @for (sbu of data.sbus; track sbu.id) {
                <span class="sbu-chip">{{ sbu.name }}</span>
              }
            </div>
          </div>
        }
      </div>

      <mat-divider></mat-divider>

      <div class="dialog-actions">
        <button mat-button mat-dialog-close>Close</button>
      </div>
    </div>
  `,
  styles: [`
    .profile-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      position: relative;
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .header-info h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .user-type {
      color: #666;
      font-size: 0.875rem;
    }

    .close-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    .profile-content {
      padding: 0 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .info-section {
      padding: 1rem 0;
    }

    .info-section h4 {
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #1976d2;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-section h4 mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item .label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item .value {
      font-size: 0.95rem;
      font-weight: 500;
      color: #333;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      width: fit-content;
    }

    .badge.system { background: #e3f2fd; color: #1565c0; }
    .badge.staff { background: #f5f5f5; color: #666; }
    .badge.manager { background: #fff3e0; color: #e65100; }
    .badge.external { background: #fce4ec; color: #c62828; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #ffebee; color: #c62828; }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .role-chip, .sbu-chip {
      padding: 0.375rem 0.75rem;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .role-chip {
      background: #e3f2fd;
      color: #1565c0;
    }

    .sbu-chip {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .no-data {
      color: #999;
      font-style: italic;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem;
    }
  `]
})
export class ProfileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfileDialogData
  ) {}

  get userInitials(): string {
    const name = this.data.fullName || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
