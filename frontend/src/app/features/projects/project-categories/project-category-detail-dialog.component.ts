import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectCategoryDTO } from '../services/project.service';

@Component({
  selector: 'app-project-category-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>category</mat-icon>
        Project Category Details
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="entity-header">
        <div class="entity-icon">
          <mat-icon>category</mat-icon>
        </div>
        <div class="entity-title">
          <h3>{{ data.name }}</h3>
          <div class="badges">
            @if (data.code) {
              <span class="badge code">{{ data.code }}</span>
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
        </div>
      </div>

      @if (data.description) {
        <mat-divider></mat-divider>
        <div class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ data.description }}</p>
        </div>
      }

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Identifiers</h4>
        <div class="detail-grid">
          <div class="detail-item full-width">
            <span class="label">Category ID</span>
            <span class="value mono">{{ data.id }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button matTooltip="Edit Category" color="primary" (click)="edit()">
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
      min-width: 450px;
      max-height: 70vh;
    }

    .entity-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }

    .entity-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #43a047, #1b5e20);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .entity-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .entity-title h3 {
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

    .badge.code { background: #e8f5e9; color: #2e7d32; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #ffebee; color: #c62828; }

    .detail-section { padding: 1rem 0; }

    .detail-section h4 {
      margin: 0 0 0.75rem 0;
      color: #1b5e20;
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

    .detail-item.full-width { grid-column: span 2; }

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

    mat-divider { margin: 0.25rem 0; }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
})
export class ProjectCategoryDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProjectCategoryDTO,
    private dialogRef: MatDialogRef<ProjectCategoryDetailDialogComponent>
  ) {}

  edit() {
    this.dialogRef.close('edit');
  }

  close() {
    this.dialogRef.close();
  }
}
