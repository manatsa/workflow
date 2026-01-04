import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="reset-password-container">
      <mat-card class="reset-password-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>workflow</mat-icon>
          <mat-card-title>Reset Password</mat-card-title>
          <mat-card-subtitle>Enter your new password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (successMessage) {
            <div class="success-message">{{ successMessage }}</div>
          }

          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }

          @if (!tokenInvalid && !submitted) {
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>New Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password" autocomplete="new-password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button"
                        (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetPasswordForm.get('password')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (resetPasswordForm.get('password')?.hasError('minlength')) {
                  <mat-error>Password must be at least 8 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="hideConfirmPassword ? 'password' : 'text'"
                       formControlName="confirmPassword" autocomplete="new-password">
                <mat-icon matPrefix>lock_outline</mat-icon>
                <button mat-icon-button matSuffix type="button"
                        (click)="hideConfirmPassword = !hideConfirmPassword">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetPasswordForm.get('confirmPassword')?.hasError('required')) {
                  <mat-error>Please confirm your password</mat-error>
                }
                @if (resetPasswordForm.hasError('passwordMismatch')) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit"
                      class="submit-button" [disabled]="loading">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Reset Password
                }
              </button>
            </form>
          }
        </mat-card-content>

        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Back to Login</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .reset-password-card {
      width: 100%;
      max-width: 400px;
      margin: 1rem;
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

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  tokenInvalid = false;
  hidePassword = true;
  hideConfirmPassword = true;
  successMessage = '';
  errorMessage = '';
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.tokenInvalid = true;
      this.errorMessage = 'Invalid or missing reset token. Please request a new password reset.';
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.resetPasswordForm.value.password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.submitted = true;
          this.successMessage = 'Your password has been reset successfully. Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.errorMessage = response.message || 'Failed to reset password';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'An error occurred. Please try again.';
      }
    });
  }
}
