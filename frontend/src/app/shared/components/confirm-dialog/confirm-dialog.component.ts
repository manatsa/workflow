import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

export type ConfirmDialogType = 'delete' | 'warn' | 'info' | 'confirm';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  type?: ConfirmDialogType;
  itemName?: string;
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
  showCheckbox?: boolean;
  checkboxLabel?: string;
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
    MatInputModule,
    MatCheckboxModule
  ],
  template: `
    <div class="confirm-dialog" [class]="'type-' + dialogType">
      <div class="dialog-icon-header">
        <div class="icon-circle">
          <mat-icon>{{ iconName }}</mat-icon>
        </div>
      </div>

      <div class="dialog-body">
        <h2>{{ data.title }}</h2>
        @if (data.itemName) {
          <p class="message">{{ data.message }}</p>
          <div class="item-name">"{{ data.itemName }}"</div>
        } @else {
          <p class="message">{{ data.message }}</p>
        }

        @if (data.showReasonInput) {
          <mat-form-field appearance="outline" class="full-width reason-field">
            <mat-label>{{ data.reasonLabel || 'Reason' }}</mat-label>
            <textarea matInput [(ngModel)]="reason" rows="3"
                      [required]="data.reasonRequired ?? false"></textarea>
          </mat-form-field>
        }

        @if (data.showCheckbox) {
          <div class="checkbox-field">
            <mat-checkbox [(ngModel)]="checkboxValue" color="warn">
              {{ data.checkboxLabel || 'Confirm' }}
            </mat-checkbox>
          </div>
        }
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button class="cancel-btn" (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button [class]="'confirm-btn ' + dialogType + '-btn'"
                (click)="onConfirm()"
                [disabled]="data.reasonRequired && !reason">
          <mat-icon>{{ confirmIcon }}</mat-icon>
          {{ data.confirmText || confirmDefaultText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      text-align: center;
      padding: 1.5rem 1.5rem 1rem;
      min-width: 360px;
      max-width: 440px;
    }

    .dialog-icon-header {
      display: flex;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .icon-circle mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .type-delete .icon-circle {
      background: linear-gradient(135deg, #ff5252, #d32f2f);
      box-shadow: 0 4px 16px rgba(211, 47, 47, 0.3);
    }

    .type-warn .icon-circle {
      background: linear-gradient(135deg, #ffb74d, #f57c00);
      box-shadow: 0 4px 16px rgba(245, 124, 0, 0.3);
    }

    .type-info .icon-circle {
      background: linear-gradient(135deg, #64b5f6, #1976d2);
      box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
    }

    .type-confirm .icon-circle {
      background: linear-gradient(135deg, #81c784, #388e3c);
      box-shadow: 0 4px 16px rgba(56, 142, 60, 0.3);
    }

    .dialog-body {
      margin-bottom: 1.5rem;
    }

    .dialog-body h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #212121;
    }

    .message {
      margin: 0;
      font-size: 0.925rem;
      color: #616161;
      line-height: 1.5;
    }

    .item-name {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      font-weight: 500;
      color: #424242;
      font-size: 0.95rem;
      border-left: 3px solid #e0e0e0;
      display: inline-block;
    }

    .type-delete .item-name {
      border-left-color: #ef5350;
      background: #fce4ec;
      color: #c62828;
    }

    .type-warn .item-name {
      border-left-color: #ffa726;
      background: #fff3e0;
      color: #e65100;
    }

    .reason-field {
      width: 100%;
      margin-top: 1rem;
      text-align: left;
    }

    .checkbox-field {
      margin-top: 1rem;
      text-align: left;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      padding-top: 0.5rem;
    }

    .cancel-btn {
      min-width: 100px;
      border-radius: 8px !important;
      font-weight: 500;
    }

    .confirm-btn {
      min-width: 120px;
      border-radius: 8px !important;
      font-weight: 500;
      color: white !important;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .confirm-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 2px;
    }

    .delete-btn {
      background: linear-gradient(135deg, #ef5350, #c62828) !important;
    }

    .delete-btn:hover {
      background: linear-gradient(135deg, #e53935, #b71c1c) !important;
    }

    .warn-btn {
      background: linear-gradient(135deg, #ffa726, #ef6c00) !important;
    }

    .warn-btn:hover {
      background: linear-gradient(135deg, #fb8c00, #e65100) !important;
    }

    .info-btn {
      background: linear-gradient(135deg, #42a5f5, #1565c0) !important;
    }

    .info-btn:hover {
      background: linear-gradient(135deg, #1e88e5, #0d47a1) !important;
    }

    .confirm-btn.confirm-btn:not(.delete-btn):not(.warn-btn):not(.info-btn) {
      background: linear-gradient(135deg, #66bb6a, #2e7d32) !important;
    }

    .confirm-btn.confirm-btn:not(.delete-btn):not(.warn-btn):not(.info-btn):hover {
      background: linear-gradient(135deg, #43a047, #1b5e20) !important;
    }

    .confirm-btn:disabled {
      opacity: 0.5;
    }

    :host ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 16px !important;
    }
  `]
})
export class ConfirmDialogComponent {
  reason = '';
  checkboxValue = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  get dialogType(): ConfirmDialogType {
    return this.data.type || 'confirm';
  }

  get iconName(): string {
    switch (this.dialogType) {
      case 'delete': return 'delete_forever';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'confirm': return 'check_circle';
    }
  }

  get confirmIcon(): string {
    switch (this.dialogType) {
      case 'delete': return 'delete';
      case 'warn': return 'warning';
      case 'info': return 'check';
      case 'confirm': return 'check';
    }
  }

  get confirmDefaultText(): string {
    switch (this.dialogType) {
      case 'delete': return 'Delete';
      case 'warn': return 'Continue';
      case 'info': return 'OK';
      case 'confirm': return 'Confirm';
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason,
      checkboxValue: this.checkboxValue
    });
  }
}
