import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Role, SBU, UserType } from '@core/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="user-form-container">
      <div class="header">
        <button mat-icon-button routerLink="/users">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEdit ? 'Edit User' : 'Create User' }}</h1>
      </div>

      <mat-card>
        <mat-card-content>
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
            <div class="form-section">
              <h3>Account Information</h3>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" [readonly]="isEdit">
                  <mat-icon matPrefix>person</mat-icon>
                  @if (userForm.get('username')?.hasError('required')) {
                    <mat-error>Username is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email">
                  <mat-icon matPrefix>email</mat-icon>
                  @if (userForm.get('email')?.hasError('required')) {
                    <mat-error>Email is required</mat-error>
                  }
                  @if (userForm.get('email')?.hasError('email')) {
                    <mat-error>Please enter a valid email</mat-error>
                  }
                </mat-form-field>
              </div>

              @if (!isEdit) {
                <div class="form-row">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Password</mat-label>
                    <input matInput formControlName="password" type="password">
                    <mat-icon matPrefix>lock</mat-icon>
                    @if (userForm.get('password')?.hasError('required')) {
                      <mat-error>Password is required</mat-error>
                    }
                    @if (userForm.get('password')?.hasError('minlength')) {
                      <mat-error>Password must be at least 8 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Confirm Password</mat-label>
                    <input matInput formControlName="confirmPassword" type="password">
                    <mat-icon matPrefix>lock_outline</mat-icon>
                    @if (userForm.hasError('passwordMismatch')) {
                      <mat-error>Passwords do not match</mat-error>
                    }
                  </mat-form-field>
                </div>
              }
            </div>

            <div class="form-section">
              <h3>Personal Information</h3>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName">
                  @if (userForm.get('firstName')?.hasError('required')) {
                    <mat-error>First name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName">
                  @if (userForm.get('lastName')?.hasError('required')) {
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
                  <input matInput formControlName="staffId">
                  <mat-icon matPrefix>badge</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Department</mat-label>
                <input matInput formControlName="department">
                <mat-icon matPrefix>business</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-section">
              <h3>Access & Permissions</h3>
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>User Type</mat-label>
                  <mat-select formControlName="userType">
                    @for (type of userTypes; track type) {
                      <mat-option [value]="type">{{ type }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Roles</mat-label>
                  <mat-select formControlName="roleIds" multiple>
                    @for (role of roles; track role.id) {
                      <mat-option [value]="role.id">{{ role.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>SBUs</mat-label>
                <mat-select formControlName="sbuIds" multiple>
                  @for (sbu of sbus; track sbu.id) {
                    <mat-option [value]="sbu.id">{{ sbu.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div class="checkbox-row">
                <mat-checkbox formControlName="enabled">Account Enabled</mat-checkbox>
                <mat-checkbox formControlName="mustChangePassword">Must Change Password on Next Login</mat-checkbox>
              </div>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/users">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="loading">
                @if (loading) {
                  Saving...
                } @else {
                  {{ isEdit ? 'Update User' : 'Create User' }}
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-form-container { padding: 1rem; }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header h1 { margin: 0; }

    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .checkbox-row {
      display: flex;
      gap: 2rem;
      margin-top: 0.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  `]
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEdit = false;
  loading = false;
  userId: string | null = null;
  roles: Role[] = [];
  sbus: SBU[] = [];
  userTypes: UserType[] = [UserType.SYSTEM, UserType.STAFF, UserType.MANAGER, UserType.EXTERNAL];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      staffId: [''],
      department: [''],
      userType: ['STAFF', Validators.required],
      roleIds: [[]],
      sbuIds: [[]],
      enabled: [true],
      mustChangePassword: [true]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadRoles();
    this.loadSbus();

    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId && this.userId !== 'new') {
      this.isEdit = true;
      this.loadUser();
    } else {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!password && !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  loadRoles() {
    this.userService.getRoles().subscribe(res => {
      if (res.success) {
        this.roles = res.data;
      }
    });
  }

  loadSbus() {
    this.userService.getSbus().subscribe(res => {
      if (res.success) {
        this.sbus = res.data;
      }
    });
  }

  loadUser() {
    if (!this.userId) return;
    this.userService.getUser(this.userId).subscribe(res => {
      if (res.success) {
        const user = res.data;
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          staffId: user.staffId,
          department: user.department,
          userType: user.userType,
          roleIds: user.roleIds || [],
          sbuIds: user.sbuIds || [],
          enabled: user.enabled ?? user.isActive,
          mustChangePassword: user.mustChangePassword
        });
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.loading = true;
    const formValue = this.userForm.value;

    const userData = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password || undefined,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phone: formValue.phone,
      staffId: formValue.staffId,
      department: formValue.department,
      userType: formValue.userType,
      roleIds: formValue.roleIds,
      sbuIds: formValue.sbuIds,
      enabled: formValue.enabled,
      mustChangePassword: formValue.mustChangePassword
    };

    const request = this.isEdit
      ? this.userService.updateUser(this.userId!, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.isEdit ? 'User updated successfully' : 'User created successfully',
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/users']);
        } else {
          this.snackBar.open(res.message || 'Operation failed', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'An error occurred', 'Close', { duration: 3000 });
      }
    });
  }
}
