import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '@core/services/user.service';
import { Role, Privilege } from '@core/models/user.model';

export interface RoleEditDialogData {
  role: Role | null;
  privileges: Privilege[];
}

@Component({
  selector: 'app-role-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditing ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditing ? 'Edit Role' : 'Create Role' }}
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="roleForm" id="roleForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. MANAGER">
          @if (roleForm.get('name')?.hasError('required') && roleForm.get('name')?.touched) {
            <mat-error>Role name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Describe the purpose of this role"></textarea>
        </mat-form-field>

        <mat-divider></mat-divider>

        <div class="privileges-section">
          <h4>Assign Privileges</h4>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Privileges</mat-label>
            <mat-select formControlName="privilegeIds" multiple (openedChange)="onSelectOpened($event)">
              <div class="search-box">
                <mat-icon>search</mat-icon>
                <input #searchInput type="text" placeholder="Search privileges..."
                       (input)="filterPrivileges($event)" (keydown)="$event.stopPropagation()">
                @if (privilegeSearch) {
                  <button type="button" class="clear-btn" (click)="clearSearch()">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
              @for (priv of filteredPrivileges; track priv.id) {
                <mat-option [value]="priv.id">
                  <span class="option-name">{{ priv.name }}</span>
                  @if (priv.category) {
                    <span class="option-category"> ({{ priv.category }})</span>
                  }
                </mat-option>
              }
              @if (filteredPrivileges.length === 0) {
                <div class="no-results">No privileges match "{{ privilegeSearch }}"</div>
              }
            </mat-select>
          </mat-form-field>

          @if (selectedPrivileges.length > 0) {
            <div class="selected-chips">
              <span class="chips-label">Selected ({{ selectedPrivileges.length }}):</span>
              <div class="chips-container">
                @for (priv of selectedPrivileges; track priv.id) {
                  <mat-chip (removed)="removePrivilege(priv.id)">
                    {{ priv.name }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
              </div>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" form="roleForm" type="submit" [disabled]="saving">
        @if (saving) {
          Saving...
        } @else {
          {{ isEditing ? 'Update' : 'Create' }}
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
      min-width: 500px;
      max-height: 70vh;
      padding-top: 0.5rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    .privileges-section {
      padding-top: 1rem;
    }

    .privileges-section h4 {
      margin: 0 0 0.75rem 0;
      color: #1976d2;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .option-category {
      color: #999;
      font-size: 0.8em;
    }

    .selected-chips {
      margin-top: 0.25rem;
    }

    .chips-label {
      font-size: 0.75rem;
      color: #666;
      display: block;
      margin-bottom: 0.5rem;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    mat-divider {
      margin: 0.5rem 0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 8px 16px;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }

    .search-box mat-icon {
      color: #999;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .search-box input {
      border: none;
      outline: none;
      font-size: 14px;
      width: 100%;
      background: transparent;
    }

    .clear-btn {
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
    }

    .clear-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #999;
    }

    .no-results {
      padding: 12px 16px;
      color: #999;
      font-size: 0.875rem;
      font-style: italic;
    }
  `]
})
export class RoleEditDialogComponent implements OnInit {
  roleForm: FormGroup;
  saving = false;
  privilegeSearch = '';
  filteredPrivileges: Privilege[] = [];

  get isEditing(): boolean {
    return !!this.data.role;
  }

  get selectedPrivileges(): Privilege[] {
    const ids: string[] = this.roleForm.get('privilegeIds')?.value || [];
    return this.data.privileges.filter(p => ids.includes(p.id));
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RoleEditDialogData,
    private dialogRef: MatDialogRef<RoleEditDialogComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      privilegeIds: [[]]
    });
  }

  ngOnInit() {
    this.filteredPrivileges = [...this.data.privileges];
    if (this.data.role) {
      this.roleForm.patchValue({
        name: this.data.role.name,
        description: this.data.role.description,
        privilegeIds: this.data.role.privilegeIds || []
      });
    }
  }

  onSelectOpened(opened: boolean) {
    if (opened) {
      this.privilegeSearch = '';
      this.filteredPrivileges = [...this.data.privileges];
    }
  }

  filterPrivileges(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.privilegeSearch = query;
    const lower = query.toLowerCase();
    this.filteredPrivileges = this.data.privileges.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.category && p.category.toLowerCase().includes(lower)) ||
      (p.description && p.description.toLowerCase().includes(lower))
    );
  }

  clearSearch() {
    this.privilegeSearch = '';
    this.filteredPrivileges = [...this.data.privileges];
  }

  removePrivilege(id: string) {
    const current: string[] = this.roleForm.get('privilegeIds')?.value || [];
    this.roleForm.patchValue({
      privilegeIds: current.filter(pid => pid !== id)
    });
  }

  save() {
    if (this.roleForm.invalid) return;
    this.saving = true;

    const roleData = this.roleForm.value;
    const request = this.isEditing
      ? this.userService.updateRole(this.data.role!.id, roleData)
      : this.userService.createRole(roleData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(
            this.isEditing ? 'Role updated successfully' : 'Role created successfully',
            'Close', { duration: 3000 }
          );
          this.dialogRef.close('saved');
        }
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
