import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.showReasonInput) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.reasonLabel || 'Reason' }}</mat-label>
          <textarea matInput [(ngModel)]="reason" rows="3"
                    [required]="data.reasonRequired ?? false"></textarea>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'"
              (click)="onConfirm()"
              [disabled]="data.reasonRequired && !reason">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 1rem;
    }

    mat-dialog-content {
      min-width: 300px;
    }

    mat-dialog-content p {
      margin: 0;
      color: rgba(0, 0, 0, 0.7);
    }
  `]
})
export class ConfirmDialogComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason
    });
  }
}
