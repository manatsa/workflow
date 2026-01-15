import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>workflow</mat-icon>
          <mat-card-title>Forgot Password</mat-card-title>
          <mat-card-subtitle>Enter your email to reset your password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (successMessage) {
            <div class="success-message">{{ successMessage }}</div>
          }

          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }

          @if (!submitted) {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email Address</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
                <mat-icon matPrefix>email</mat-icon>
                @if (forgotPasswordForm.get('email')?.hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (forgotPasswordForm.get('email')?.hasError('email')) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit"
                      class="submit-button" [disabled]="loading">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span style="margin-left: 8px;">Sending...</span>
                } @else {
                  Send Reset Link
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
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .forgot-password-card {
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
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation display
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.get('email')?.value?.trim();

    if (!email) {
      this.loading = false;
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.submitted = true;
          this.successMessage = 'Password reset link has been sent to your email address. Please check your inbox.';
        } else {
          this.errorMessage = response.message || 'Failed to send reset link. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'An error occurred. Please try again.';
      }
    });
  }
}
