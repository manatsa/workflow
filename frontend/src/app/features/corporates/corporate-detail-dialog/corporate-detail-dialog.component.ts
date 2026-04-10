import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Corporate, CorporateTypeLabels } from '@core/models/corporate.model';

@Component({
  selector: 'app-corporate-detail-dialog',
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
        <mat-icon>corporate_fare</mat-icon>
        Corporate Details
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="corp-header">
        <div class="corp-icon">
          <mat-icon>business</mat-icon>
        </div>
        <div class="corp-title">
          <h3>{{ data.name }}</h3>
          <div class="badges">
            @if (data.code) {
              <span class="badge code">{{ data.code }}</span>
            }
            @if (data.corporateTypeDisplayName) {
              <span class="badge type">{{ data.corporateTypeDisplayName }}</span>
            }
            <span class="badge" [class.active]="data.isActive" [class.inactive]="!data.isActive">
              {{ data.isActive ? 'Active' : 'Inactive' }}
            </span>
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
            <span class="label">Category</span>
            <span class="value">{{ data.categoryName || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Type</span>
            <span class="value">{{ data.corporateTypeDisplayName || '-' }}</span>
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

      @if (data.contactEmail || data.contactPhone || data.address || data.website) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Contact Information</h4>
          <div class="detail-grid">
            @if (data.contactEmail) {
              <div class="detail-item">
                <span class="label">Email</span>
                <span class="value link">
                  <mat-icon class="inline-icon">email</mat-icon>
                  {{ data.contactEmail }}
                </span>
              </div>
            }
            @if (data.contactPhone) {
              <div class="detail-item">
                <span class="label">Phone</span>
                <span class="value">
                  <mat-icon class="inline-icon">phone</mat-icon>
                  {{ data.contactPhone }}
                </span>
              </div>
            }
            @if (data.website) {
              <div class="detail-item full-width">
                <span class="label">Website</span>
                <span class="value link">
                  <mat-icon class="inline-icon">language</mat-icon>
                  {{ data.website }}
                </span>
              </div>
            }
            @if (data.address) {
              <div class="detail-item full-width">
                <span class="label">Address</span>
                <span class="value">
                  <mat-icon class="inline-icon">location_on</mat-icon>
                  {{ data.address }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      @if (data.sbus && data.sbus.length > 0) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>SBUs ({{ data.sbus.length }})</h4>
          <div class="chips-container">
            @for (sbu of data.sbus; track sbu.id) {
              <mat-chip>
                {{ sbu.name }}
                @if (sbu.code) { ({{ sbu.code }}) }
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
            <span class="label">Corporate ID</span>
            <span class="value mono">{{ data.id }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button matTooltip="Edit Corporate" color="primary" (click)="edit()">
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

    .corp-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }

    .corp-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1976d2, #0d47a1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .corp-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .corp-title h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
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
    .badge.type { background: #f3e5f5; color: #7b1fa2; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #f5f5f5; color: #666; }

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
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .detail-item .value.link {
      color: #1976d2;
    }

    .detail-item .value.mono {
      font-family: monospace;
      font-size: 0.75rem;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      word-break: break-all;
    }

    .inline-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
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
export class CorporateDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Corporate,
    private dialogRef: MatDialogRef<CorporateDetailDialogComponent>
  ) {}

  edit() {
    this.dialogRef.close('edit');
  }

  close() {
    this.dialogRef.close();
  }
}
