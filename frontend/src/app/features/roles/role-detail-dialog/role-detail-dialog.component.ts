import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-role-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>shield</mat-icon>
        Role Details
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="role-header">
        <div class="role-icon">
          <mat-icon>admin_panel_settings</mat-icon>
        </div>
        <div class="role-title">
          <h3>{{ data.name }}</h3>
          <div class="badges">
            @if (data.isSystemRole) {
              <span class="badge system">System Role</span>
            } @else {
              <span class="badge custom">Custom Role</span>
            }
            <span class="badge count">{{ getPrivilegesList().length }} privilege(s)</span>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      @if (data.description) {
        <div class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ data.description }}</p>
        </div>
        <mat-divider></mat-divider>
      }

      <div class="detail-section">
        <h4>Privileges</h4>
        @if (getPrivilegesList().length > 0) {
          <div class="privileges-list">
            @for (priv of getPrivilegesList(); track priv.name || priv) {
              <div class="privilege-item">
                <div class="privilege-icon">
                  <mat-icon>verified_user</mat-icon>
                </div>
                <div class="privilege-info">
                  <span class="privilege-name">{{ priv.name || priv }}</span>
                  @if (priv.description) {
                    <span class="privilege-desc">{{ priv.description }}</span>
                  }
                  @if (priv.category) {
                    <span class="privilege-category">{{ priv.category }}</span>
                  }
                </div>
                @if (priv.isSystemPrivilege) {
                  <mat-icon class="system-icon" matTooltip="System Privilege">lock</mat-icon>
                }
              </div>
            }
          </div>
        } @else {
          <p class="no-data">No privileges assigned to this role</p>
        }
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Role Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Role ID</span>
            <span class="value mono">{{ data.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Type</span>
            <span class="value">{{ data.isSystemRole ? 'System' : 'Custom' }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button matTooltip="Edit" color="primary" (click)="edit()">
        <mat-icon>edit</mat-icon> Edit
      </button>
      <button mat-button matTooltip="Close" (click)="close()">Close</button>
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
      min-width: 500px;
      max-height: 70vh;
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }

    .role-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .role-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .role-title h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
    }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge.system { background: #e3f2fd; color: #1565c0; }
    .badge.custom { background: #f3e5f5; color: #7b1fa2; }
    .badge.count { background: #e8f5e9; color: #2e7d32; }

    .detail-section {
      padding: 1rem 0;
    }

    .detail-section h4 {
      margin: 0 0 0.75rem 0;
      color: #1976d2;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .description-text {
      margin: 0;
      line-height: 1.6;
      color: #333;
    }

    .privileges-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .privilege-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid #1976d2;
    }

    .privilege-icon {
      color: #1976d2;
      display: flex;
      align-items: center;
    }

    .privilege-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .privilege-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .privilege-name {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .privilege-desc {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.15rem;
    }

    .privilege-category {
      font-size: 0.65rem;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0.15rem;
    }

    .system-icon {
      color: #1565c0;
      font-size: 18px;
      width: 18px;
      height: 18px;
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

    .detail-item .label {
      font-size: 0.7rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-item .value {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .detail-item .value.mono {
      font-family: monospace;
      font-size: 0.75rem;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      word-break: break-all;
    }

    .no-data {
      color: #666;
      font-style: italic;
      margin: 0;
    }

    mat-divider {
      margin: 0.25rem 0;
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
})
export class RoleDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<RoleDetailDialogComponent>
  ) {}

  getPrivilegesList(): any[] {
    if (!this.data.privileges) return [];
    if (Array.isArray(this.data.privileges)) {
      return this.data.privileges;
    }
    // If it's a Set or object, convert
    return Object.values(this.data.privileges);
  }

  edit() {
    this.dialogRef.close('edit');
  }

  close() {
    this.dialogRef.close();
  }
}
