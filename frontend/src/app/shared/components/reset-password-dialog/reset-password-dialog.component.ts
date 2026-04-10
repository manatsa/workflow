import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Reset Password for {{ data.fullName }}</h2>
    <mat-dialog-content>
      <p class="hint">A temporary password has been generated. You can edit it or use as-is.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>New Password</mat-label>
        <input matInput [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password">
        <button mat-icon-button matTooltip="{{ showPassword ? 'Hide Password' : 'Show Password' }}" matSuffix (click)="showPassword = !showPassword" type="button">
          <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
      <div class="generate-row">
        <button mat-stroked-button matTooltip="Generate New" type="button" (click)="regenerate()">
          <mat-icon>refresh</mat-icon> Generate New
        </button>
      </div>
      <mat-checkbox [(ngModel)]="mustChangePassword" class="change-checkbox">
        Require password change on first login
      </mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" mat-dialog-close>Cancel</button>
      <button mat-raised-button matTooltip="Reset Password" color="primary" [disabled]="!password || password.length < 6" (click)="confirm()">
        Reset Password
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .hint {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 1rem;
    }
    .full-width { width: 100%; }
    .generate-row {
      display: flex;
      justify-content: flex-end;
      margin-top: -0.5rem;
      margin-bottom: 0.5rem;
    }
    .change-checkbox {
      margin-top: 0.5rem;
    }
  `]
})
export class ResetPasswordDialogComponent {
  password: string;
  showPassword = true;
  mustChangePassword = true;

  constructor(
    private dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fullName: string }
  ) {
    this.password = this.generatePassword();
  }

  confirm() {
    this.dialogRef.close({ password: this.password, mustChangePassword: this.mustChangePassword });
  }

  regenerate() {
    this.password = this.generatePassword();
  }

  private generatePassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%&*';
    const all = upper + lower + digits + special;

    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }
}
