import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <div class="avatar" mat-card-avatar>{{ userInitials }}</div>
          <mat-card-title>{{ fullName }}</mat-card-title>
          <mat-card-subtitle>{{ userType }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" readonly>
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email">
                <mat-icon matPrefix>email</mat-icon>
                @if (profileForm.get('email')?.hasError('email')) {
                  <mat-error>Please enter a valid email</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                @if (profileForm.get('firstName')?.hasError('required')) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                @if (profileForm.get('lastName')?.hasError('required')) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone">
                <mat-icon matPrefix>phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Staff ID</mat-label>
                <input matInput formControlName="staffId" readonly>
                <mat-icon matPrefix>badge</mat-icon>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="form-field full-width">
              <mat-label>Department</mat-label>
              <input matInput formControlName="department">
              <mat-icon matPrefix>business</mat-icon>
            </mat-form-field>

            <div class="info-section">
              <h4>Account Information</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">User Type</span>
                  <span class="value">{{ userType }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Last Login</span>
                  <span class="value">{{ lastLogin | date:'medium' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Account Created</span>
                  <span class="value">{{ createdAt | date:'medium' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Roles</span>
                  <span class="value">{{ roles }}</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="loading">
                @if (loading) {
                  Saving...
                } @else {
                  Save Changes
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 1rem;
      display: flex;
      justify-content: center;
    }

    .profile-card {
      width: 100%;
      max-width: 700px;
    }

    .avatar {
      width: 56px !important;
      height: 56px !important;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 500;
    }

    mat-card-header {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-field {
      flex: 1;
      margin-bottom: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .info-section {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .info-section h4 {
      margin: 0 0 0.75rem 0;
      color: #333;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item .label {
      font-size: 0.75rem;
      color: #666;
    }

    .info-item .value {
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  lastLogin: Date | null = null;
  createdAt: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      username: [''],
      email: ['', Validators.email],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      staffId: [''],
      department: ['']
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  get fullName(): string {
    return this.authService.currentUser?.fullName || 'User';
  }

  get userInitials(): string {
    const name = this.fullName;
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  get userType(): string {
    return this.authService.currentUser?.userType || 'STAFF';
  }

  get roles(): string {
    return this.authService.currentUser?.roles?.join(', ') || 'None';
  }

  loadProfile() {
    const user = this.authService.currentUser;
    if (user) {
      this.profileForm.patchValue({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        staffId: user.staffId,
        department: user.department
      });
      this.lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      this.createdAt = user.createdAt ? new Date(user.createdAt) : null;
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    const updateData = {
      email: this.profileForm.value.email,
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      phone: this.profileForm.value.phone,
      department: this.profileForm.value.department
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          this.authService.refreshCurrentUser();
        } else {
          this.snackBar.open(response.message || 'Failed to update profile', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'An error occurred', 'Close', { duration: 3000 });
      }
    });
  }
}
