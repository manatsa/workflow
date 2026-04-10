import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SBU } from '@core/models/user.model';

@Component({
  selector: 'app-sbu-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>business</mat-icon>
        SBU Details
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="sbu-header">
        <div class="sbu-icon">
          <mat-icon>corporate_fare</mat-icon>
        </div>
        <div class="sbu-title">
          <h3>{{ data.name }}</h3>
          <div class="badges">
            @if (data.code) {
              <span class="badge code">{{ data.code }}</span>
            }
            @if (data.isRoot) {
              <span class="badge root">Root SBU</span>
            }
            @if (data.isActive !== undefined) {
              <span class="badge" [class.active]="data.isActive" [class.inactive]="!data.isActive">
                {{ data.isActive ? 'Active' : 'Inactive' }}
              </span>
            }
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>General Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Name</span>
            <span class="value">{{ data.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Code</span>
            <span class="value">{{ data.code || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Corporate</span>
            <span class="value">
              @if (data.corporateName) {
                {{ data.corporateName }}
                @if (data.corporateCode) {
                  <span class="sub-text">({{ data.corporateCode }})</span>
                }
              } @else {
                -
              }
            </span>
          </div>
          <div class="detail-item">
            <span class="label">Parent SBU</span>
            <span class="value">{{ data.parentName || data.parent?.name || 'None (Root)' }}</span>
          </div>
        </div>
      </div>

      @if (data.description) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ data.description }}</p>
        </div>
      }

      @if (data.contactEmail || data.contactPhone || data.address) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Contact Information</h4>
          <div class="detail-grid">
            @if (data.contactEmail) {
              <div class="detail-item">
                <span class="label">Email</span>
                <span class="value">{{ data.contactEmail }}</span>
              </div>
            }
            @if (data.contactPhone) {
              <div class="detail-item">
                <span class="label">Phone</span>
                <span class="value">{{ data.contactPhone }}</span>
              </div>
            }
            @if (data.address) {
              <div class="detail-item full-width">
                <span class="label">Address</span>
                <span class="value">{{ data.address }}</span>
              </div>
            }
          </div>
        </div>
      }

      @if (data.branches && data.branches.length > 0) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Branches ({{ data.branches.length }})</h4>
          <div class="chips-container">
            @for (branch of data.branches; track branch.id) {
              <mat-chip>{{ branch.name }}</mat-chip>
            }
          </div>
        </div>
      }

      @if (data.children && data.children.length > 0) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Child SBUs ({{ data.children.length }})</h4>
          <div class="chips-container">
            @for (child of data.children; track child.id) {
              <mat-chip>
                {{ child.name }}
                @if (child.code) { ({{ child.code }}) }
              </mat-chip>
            }
          </div>
        </div>
      }

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Identifiers</h4>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <span class="label">SBU ID</span>
            <span class="value mono">{{ data.id }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button matTooltip="Edit SBU" color="primary" (click)="edit()">
        <mat-icon>edit</mat-icon> Edit
      </button>
      <button mat-stroked-button matTooltip="Add Child SBU" color="primary" (click)="addChild()">
        <mat-icon>add</mat-icon> Add Child
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

    .sbu-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }

    .sbu-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2e7d32, #1b5e20);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sbu-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .sbu-title h3 {
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

    .badge.code { background: #e3f2fd; color: #1565c0; }
    .badge.root { background: #fff3e0; color: #e65100; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #f5f5f5; color: #666; }

    .detail-section {
      padding: 1rem 0;
    }

    .detail-section h4 {
      margin: 0 0 0.75rem 0;
      color: #2e7d32;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .description-text {
      margin: 0;
      line-height: 1.6;
      color: #333;
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

    .sub-text {
      color: #999;
      font-weight: 400;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
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
export class SbuDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SbuDetailDialogComponent>
  ) {}

  edit() {
    this.dialogRef.close('edit');
  }

  addChild() {
    this.dialogRef.close('addChild');
  }

  close() {
    this.dialogRef.close();
  }
}
