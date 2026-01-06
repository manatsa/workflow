import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Role, SBU, UserType, Corporate, Branch } from '@core/models/user.model';
import { DepartmentService } from '@core/services/department.service';
import { Department } from '@core/models/department.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTabsModule,
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
            <mat-tab-group>
              <!-- User Details Tab -->
              <mat-tab label="User Details">
                <div class="tab-content">
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
                    <h3>Roles & User Type</h3>
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
                  </div>
                </div>
              </mat-tab>

              <!-- Access Permissions Tab -->
              <mat-tab label="Access Permissions">
                <div class="tab-content">
                  <div class="access-info">
                    <mat-icon>info</mat-icon>
                    <p>Leave all fields empty to grant the user global access to all data. Select specific corporates, SBUs, branches, or departments to restrict access.</p>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Corporates</mat-label>
                      <mat-select formControlName="corporateIds" multiple (selectionChange)="onCorporateChange()">
                        @for (corp of corporates; track corp.id) {
                          <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>User can access data from selected corporates</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>SBUs</mat-label>
                      <mat-select formControlName="sbuIds" multiple (selectionChange)="onSbuChange()">
                        @for (sbu of filteredSbus; track sbu.id) {
                          <mat-option [value]="sbu.id">{{ sbu.name }} @if (sbu.corporateName) { ({{ sbu.corporateName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filtered by Corporate if selected</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Branches</mat-label>
                      <mat-select formControlName="branchIds" multiple>
                        @for (branch of filteredBranches; track branch.id) {
                          <mat-option [value]="branch.id">{{ branch.name }} @if (branch.sbuName) { ({{ branch.sbuName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filtered by SBU if selected</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Departments</mat-label>
                      <mat-select formControlName="departmentIds" multiple>
                        @for (dept of filteredDepartments; track dept.id) {
                          <mat-option [value]="dept.id">{{ dept.name }} @if (dept.corporateName) { ({{ dept.corporateName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filtered by Corporate if selected</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="access-summary">
                    <h4>Current Access Summary</h4>
                    @if (getAccessSummary().length === 0) {
                      <p class="no-restrictions">No restrictions - User has global access to all data</p>
                    } @else {
                      <div class="restriction-chips">
                        @for (item of getAccessSummary(); track item) {
                          <span class="access-chip">{{ item }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>

            <!-- These stay outside tabs to be visible across all tabs -->
            <div class="global-options">
              <div class="checkbox-row">
                <mat-checkbox formControlName="enabled">Account Enabled</mat-checkbox>
                <mat-checkbox formControlName="mustChangePassword">Must Change Password on Next Login</mat-checkbox>
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

    .tab-content {
      padding: 1.5rem 0;
    }

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
      margin-bottom: 1rem;
    }

    .form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .global-options {
      border-top: 1px solid #e0e0e0;
      padding-top: 1.5rem;
      margin-top: 1rem;
    }

    .checkbox-row {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .access-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .access-info mat-icon {
      color: #1976d2;
      flex-shrink: 0;
    }

    .access-info p {
      margin: 0;
      color: #1565c0;
      font-size: 0.9rem;
    }

    .access-summary {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .access-summary h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .no-restrictions {
      color: #4caf50;
      font-weight: 500;
    }

    .restriction-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .access-chip {
      padding: 0.375rem 0.75rem;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 16px;
      font-size: 0.85rem;
      font-weight: 500;
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
  filteredSbus: SBU[] = [];
  corporates: Corporate[] = [];
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  userTypes: UserType[] = [UserType.SYSTEM, UserType.STAFF, UserType.MANAGER, UserType.EXTERNAL];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private departmentService: DepartmentService,
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
      corporateIds: [[]],
      sbuIds: [[]],
      branchIds: [[]],
      departmentIds: [[]],
      enabled: [true],
      mustChangePassword: [true]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadRoles();
    this.loadCorporates();
    this.loadSbus();
    this.loadBranches();
    this.loadDepartments();

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

  loadCorporates() {
    this.userService.getActiveCorporates().subscribe(res => {
      if (res.success) {
        this.corporates = res.data;
      }
    });
  }

  loadSbus() {
    this.userService.getSbus().subscribe(res => {
      if (res.success) {
        this.sbus = res.data;
        this.filteredSbus = [...this.sbus];
      }
    });
  }

  loadBranches() {
    this.userService.getActiveBranches().subscribe(res => {
      if (res.success) {
        this.branches = res.data;
        this.filteredBranches = [...this.branches];
      }
    });
  }

  loadDepartments() {
    this.departmentService.getActiveDepartments().subscribe(res => {
      if (res.success) {
        this.departments = res.data;
        this.filteredDepartments = [...this.departments];
      }
    });
  }

  onCorporateChange() {
    const corporateIds: string[] = this.userForm.get('corporateIds')?.value || [];

    if (corporateIds.length > 0) {
      this.filteredSbus = this.sbus.filter(sbu => corporateIds.includes(sbu.corporateId || ''));
      this.filteredDepartments = this.departments.filter(dept => corporateIds.includes(dept.corporateId || ''));
    } else {
      this.filteredSbus = [...this.sbus];
      this.filteredDepartments = [...this.departments];
    }

    // Clear invalid SBU selections
    const currentSbuIds: string[] = this.userForm.get('sbuIds')?.value || [];
    const validSbuIds = currentSbuIds.filter(id => this.filteredSbus.some(s => s.id === id));
    if (validSbuIds.length !== currentSbuIds.length) {
      this.userForm.patchValue({ sbuIds: validSbuIds });
    }

    // Clear invalid Department selections
    const currentDeptIds: string[] = this.userForm.get('departmentIds')?.value || [];
    const validDeptIds = currentDeptIds.filter(id => this.filteredDepartments.some(d => d.id === id));
    if (validDeptIds.length !== currentDeptIds.length) {
      this.userForm.patchValue({ departmentIds: validDeptIds });
    }

    this.onSbuChange();
  }

  onSbuChange() {
    const sbuIds: string[] = this.userForm.get('sbuIds')?.value || [];
    const corporateIds: string[] = this.userForm.get('corporateIds')?.value || [];

    if (sbuIds.length > 0) {
      this.filteredBranches = this.branches.filter(branch => sbuIds.includes(branch.sbuId));
    } else if (corporateIds.length > 0) {
      // If corporates selected but no SBUs, show branches for all SBUs in selected corporates
      const sbuIdsForCorporates = this.sbus
        .filter(s => corporateIds.includes(s.corporateId || ''))
        .map(s => s.id);
      this.filteredBranches = this.branches.filter(branch => sbuIdsForCorporates.includes(branch.sbuId));
    } else {
      this.filteredBranches = [...this.branches];
    }

    // Clear invalid Branch selections
    const currentBranchIds: string[] = this.userForm.get('branchIds')?.value || [];
    const validBranchIds = currentBranchIds.filter(id => this.filteredBranches.some(b => b.id === id));
    if (validBranchIds.length !== currentBranchIds.length) {
      this.userForm.patchValue({ branchIds: validBranchIds });
    }
  }

  getAccessSummary(): string[] {
    const summary: string[] = [];
    const corporateIds: string[] = this.userForm.get('corporateIds')?.value || [];
    const sbuIds: string[] = this.userForm.get('sbuIds')?.value || [];
    const branchIds: string[] = this.userForm.get('branchIds')?.value || [];
    const departmentIds: string[] = this.userForm.get('departmentIds')?.value || [];

    corporateIds.forEach(id => {
      const corp = this.corporates.find(c => c.id === id);
      if (corp) summary.push(`Corporate: ${corp.name}`);
    });

    sbuIds.forEach(id => {
      const sbu = this.sbus.find(s => s.id === id);
      if (sbu) summary.push(`SBU: ${sbu.name}`);
    });

    branchIds.forEach(id => {
      const branch = this.branches.find(b => b.id === id);
      if (branch) summary.push(`Branch: ${branch.name}`);
    });

    departmentIds.forEach(id => {
      const dept = this.departments.find(d => d.id === id);
      if (dept) summary.push(`Department: ${dept.name}`);
    });

    return summary;
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
          phone: user.phoneNumber,
          staffId: user.staffId,
          department: user.department,
          userType: user.userType,
          roleIds: user.roleIds || [],
          corporateIds: user.corporateIds || [],
          sbuIds: user.sbuIds || [],
          branchIds: user.branchIds || [],
          departmentIds: user.departmentIds || [],
          enabled: user.enabled ?? user.isActive,
          mustChangePassword: user.mustChangePassword
        });

        // Apply cascading filters after loading user data
        setTimeout(() => {
          this.onCorporateChange();
        }, 100);
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
      phoneNumber: formValue.phone,
      staffId: formValue.staffId,
      department: formValue.department,
      userType: formValue.userType,
      roleIds: formValue.roleIds,
      corporateIds: formValue.corporateIds,
      sbuIds: formValue.sbuIds,
      branchIds: formValue.branchIds,
      departmentIds: formValue.departmentIds,
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
