import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="change-password-container">
      <mat-card class="change-password-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>lock</mat-icon>
          <mat-card-title>Change Password</mat-card-title>
          <mat-card-subtitle>Update your account password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
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

            <button mat-raised-button color="primary" type="submit"
                    class="submit-button" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Change Password
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .change-password-container {
      padding: 1rem;
      display: flex;
      justify-content: center;
    }

    .change-password-card {
      width: 100%;
      max-width: 500px;
    }

    mat-card-header {
      margin-bottom: 1rem;
    }

    .form-field {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .submit-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
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
      margin-bottom: 1rem;
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
      content: "✓ ";
    }
  `]
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  loading = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
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

    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
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
}
