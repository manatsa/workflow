import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>lock</mat-icon>
        Change Password
      </h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      @if (errorMessage) {
        <div class="error-message">{{ errorMessage }}</div>
      }

      <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Current Password</mat-label>
          <input matInput [type]="hideCurrentPassword ? 'password' : 'text'"
                 formControlName="currentPassword" autocomplete="current-password">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button"
                  (click)="hideCurrentPassword = !hideCurrentPassword">
            <mat-icon>{{ hideCurrentPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (changePasswordForm.get('currentPassword')?.hasError('required')) {
            <mat-error>Current password is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>New Password</mat-label>
          <input matInput [type]="hideNewPassword ? 'password' : 'text'"
                 formControlName="newPassword" autocomplete="new-password">
          <mat-icon matPrefix>lock_outline</mat-icon>
          <button mat-icon-button matSuffix type="button"
                  (click)="hideNewPassword = !hideNewPassword">
            <mat-icon>{{ hideNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (changePasswordForm.get('newPassword')?.hasError('required')) {
            <mat-error>New password is required</mat-error>
          }
          @if (changePasswordForm.get('newPassword')?.hasError('minlength')) {
            <mat-error>Password must be at least 8 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Confirm New Password</mat-label>
          <input matInput [type]="hideConfirmPassword ? 'password' : 'text'"
                 formControlName="confirmPassword" autocomplete="new-password">
          <mat-icon matPrefix>lock_outline</mat-icon>
          <button mat-icon-button matSuffix type="button"
                  (click)="hideConfirmPassword = !hideConfirmPassword">
            <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (changePasswordForm.get('confirmPassword')?.hasError('required')) {
            <mat-error>Please confirm your new password</mat-error>
          }
          @if (changePasswordForm.hasError('passwordMismatch')) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>

        <div class="password-requirements">
          <h4>Password Requirements:</h4>
          <ul>
            <li [class.met]="hasMinLength">At least 8 characters</li>
            <li [class.met]="hasUppercase">At least one uppercase letter</li>
            <li [class.met]="hasLowercase">At least one lowercase letter</li>
            <li [class.met]="hasNumber">At least one number</li>
            <li [class.met]="hasSpecial">At least one special character</li>
          </ul>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="loading || changePasswordForm.invalid">
        @if (loading) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Change Password
        }
      </button>
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
      min-width: 400px;
      max-width: 500px;
    }

    .form-field {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .password-requirements {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 0.5rem;
    }

    .password-requirements h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }

    .password-requirements ul {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.8rem;
    }

    .password-requirements li {
      color: #666;
      margin-bottom: 0.25rem;
    }

    .password-requirements li.met {
      color: #2e7d32;
    }

    .password-requirements li.met::marker {
      content: "\\2713  ";
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `]
})
export class ChangePasswordDialogComponent {
  changePasswordForm: FormGroup;
  loading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get newPassword(): string {
    return this.changePasswordForm.get('newPassword')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.newPassword);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  get hasSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;

    this.authService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.errorMessage = response.message || 'Failed to change password';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'An error occurred. Please try again.';
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
