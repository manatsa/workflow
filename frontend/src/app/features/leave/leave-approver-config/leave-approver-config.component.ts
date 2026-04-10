import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LeaveService } from '../services/leave.service';
import { UserService } from '@core/services/user.service';
import { DepartmentService } from '@core/services/department.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

// ─── Approver Dialog Component ──────────────────────────────────────────────
@Component({
  selector: 'app-leave-approver-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.readonly ? 'visibility' : (data.approver ? 'edit' : 'person_add') }}</mat-icon>
      {{ data.readonly ? 'View Approver' : (data.approver ? 'Edit Approver' : 'Add Approver') }}
    </h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>User</mat-label>
          <mat-select [(ngModel)]="form.userId" [disabled]="data.readonly || !!data.approver">
            @for (user of data.users; track user.id) {
              <mat-option [value]="user.id">{{ user.fullName }} ({{ user.email }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Approval Level</mat-label>
            <input matInput type="number" [(ngModel)]="form.level" min="1" [readonly]="data.readonly">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Escalation Timeout (hours)</mat-label>
            <input matInput type="number" [(ngModel)]="form.escalationTimeoutHours" min="0" [readonly]="data.readonly">
            <mat-hint>Leave empty or 0 to disable escalation</mat-hint>
          </mat-form-field>
        </div>

        <div class="row toggles">
          <mat-slide-toggle [(ngModel)]="form.canEscalate" [disabled]="data.readonly">
            Can Escalate
          </mat-slide-toggle>
        </div>

        <div class="section-title">Email Notifications</div>
        <div class="row toggles">
          <mat-slide-toggle [(ngModel)]="form.notifyOnPending" [disabled]="data.readonly">
            On Pending
          </mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="form.notifyOnApproval" [disabled]="data.readonly">
            On Approval
          </mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="form.notifyOnRejection" [disabled]="data.readonly">
            On Rejection
          </mat-slide-toggle>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">{{ data.readonly ? 'Close' : 'Cancel' }}</button>
      @if (!data.readonly) {
        <button mat-raised-button color="primary" (click)="save()" [disabled]="!form.userId">
          {{ data.approver ? 'Update' : 'Add' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display: flex; align-items: center; gap: 8px; margin: 0; padding: 16px 24px; }
    mat-dialog-content { min-width: 450px; padding: 0 24px; }
    .form-grid { display: flex; flex-direction: column; gap: 12px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .row mat-form-field { flex: 1; }
    .toggles { display: flex; gap: 24px; flex-wrap: wrap; padding: 8px 0; }
    .section-title { font-weight: 500; font-size: 13px; color: #666; margin-top: 8px; }
  `]
})
export class LeaveApproverDialogComponent {
  form: any;

  constructor(
    public dialogRef: MatDialogRef<LeaveApproverDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { approver: any; users: any[]; nextLevel: number; readonly: boolean }
  ) {
    if (data.approver) {
      this.form = { ...data.approver };
    } else {
      this.form = {
        userId: null,
        level: data.nextLevel || 1,
        escalationTimeoutHours: 48,
        canEscalate: true,
        notifyOnPending: true,
        notifyOnApproval: true,
        notifyOnRejection: true
      };
    }
  }

  save() {
    this.dialogRef.close(this.form);
  }
}

// ─── Main Config Component ──────────────────────────────────────────────────
@Component({
  selector: 'app-leave-approver-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatMenuModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule, MatDialogModule
  ],
  template: `
    <div class="approver-config">
      <div class="page-header">
        <div>
          <h1>Leave Approval Chains</h1>
          <p class="subtitle">Configure multi-level approval chains per department</p>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="department-row">
            <mat-form-field appearance="outline" style="width: 300px;">
              <mat-label>Department</mat-label>
              <mat-select [(ngModel)]="selectedDepartmentId" (selectionChange)="loadApprovers()">
                @for (dept of departments; track dept.id) {
                  <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (selectedDepartmentId) {
              <button mat-raised-button color="primary" (click)="openAddDialog()">
                <mat-icon>person_add</mat-icon> Add Approver
              </button>
            }
          </div>

          @if (selectedDepartmentId) {
            @if (loading) {
              <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
            } @else if (approvers.length === 0) {
              <div class="empty-state">
                <mat-icon>group_off</mat-icon>
                <p>No approvers configured for this department</p>
                <button mat-stroked-button color="primary" (click)="openAddDialog()">
                  <mat-icon>person_add</mat-icon> Add First Approver
                </button>
              </div>
            } @else {
              <table mat-table [dataSource]="approvers" class="full-width">
                <ng-container matColumnDef="level">
                  <th mat-header-cell *matHeaderCellDef>Level</th>
                  <td mat-cell *matCellDef="let a">
                    <span class="level-chip">{{ a.level }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="userName">
                  <th mat-header-cell *matHeaderCellDef>Approver</th>
                  <td mat-cell *matCellDef="let a">
                    <div><strong>{{ a.userName || a.approverName }}</strong></div>
                    <div class="sub-text">{{ a.userEmail || a.approverEmail }}</div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="escalation">
                  <th mat-header-cell *matHeaderCellDef>Escalation</th>
                  <td mat-cell *matCellDef="let a">
                    @if (a.canEscalate && a.escalationTimeoutHours) {
                      <span class="esc-badge">{{ a.escalationTimeoutHours }}h</span>
                    } @else {
                      <span class="sub-text">Disabled</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="notifications">
                  <th mat-header-cell *matHeaderCellDef>Notifications</th>
                  <td mat-cell *matCellDef="let a">
                    @if (a.notifyOnPending) { <mat-icon class="notif-icon on" matTooltip="Notify on pending">notifications</mat-icon> }
                    @if (a.notifyOnApproval) { <mat-icon class="notif-icon on" matTooltip="Notify on approval">check_circle</mat-icon> }
                    @if (a.notifyOnRejection) { <mat-icon class="notif-icon on" matTooltip="Notify on rejection">cancel</mat-icon> }
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let a">
                    <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="More options">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="openViewDialog(a)">
                        <mat-icon>visibility</mat-icon>
                        <span>View</span>
                      </button>
                      <button mat-menu-item (click)="openEditDialog(a)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="removeApprover(a)" class="delete-action">
                        <mat-icon>delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
            }
          } @else {
            <div class="empty-state">
              <mat-icon>domain</mat-icon>
              <p>Select a department to configure its approval chain</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .approver-config { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .department-row { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
    .sub-text { font-size: 12px; color: #666; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .level-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      background: #1976d2; color: white; font-weight: 600; font-size: 13px;
    }
    .esc-badge {
      background: #fff3e0; color: #e65100; padding: 2px 8px;
      border-radius: 12px; font-size: 12px; font-weight: 500;
    }
    .notif-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
    .notif-icon.on { color: #4caf50; }
    .delete-action { color: #f44336 !important; }
  `]
})
export class LeaveApproverConfigComponent implements OnInit {
  departments: any[] = [];
  users: any[] = [];
  approvers: any[] = [];
  selectedDepartmentId: string | null = null;
  loading = false;
  columns = ['level', 'userName', 'escalation', 'notifications', 'actions'];

  constructor(
    private leaveService: LeaveService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.departmentService.getActiveDepartments().subscribe({
      next: (res: any) => { if (res.success) this.departments = res.data || []; }
    });
    this.userService.getUsers().subscribe({
      next: (res: any) => { if (res.success) this.users = res.data || []; }
    });
  }

  loadApprovers() {
    if (!this.selectedDepartmentId) return;
    this.loading = true;
    this.leaveService.getApprovers(this.selectedDepartmentId).subscribe({
      next: (res: any) => {
        if (res.success) this.approvers = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get nextLevel(): number {
    return this.approvers.length > 0
      ? Math.max(...this.approvers.map((a: any) => a.level)) + 1 : 1;
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(LeaveApproverDialogComponent, {
      width: '550px',
      data: { approver: null, users: this.users, nextLevel: this.nextLevel, readonly: false }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const dto = {
        ...result,
        departmentId: this.selectedDepartmentId
      };
      this.leaveService.createApprover(dto).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.snackBar.open('Approver added', 'Close', { duration: 3000 });
            this.loadApprovers();
          }
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.message || 'Failed to add approver', 'Close', { duration: 5000 });
        }
      });
    });
  }

  openViewDialog(approver: any) {
    this.dialog.open(LeaveApproverDialogComponent, {
      width: '550px',
      data: { approver, users: this.users, nextLevel: this.nextLevel, readonly: true }
    });
  }

  openEditDialog(approver: any) {
    const dialogRef = this.dialog.open(LeaveApproverDialogComponent, {
      width: '550px',
      data: { approver: { ...approver }, users: this.users, nextLevel: this.nextLevel, readonly: false }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.leaveService.updateApprover(approver.id, result).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.snackBar.open('Approver updated', 'Close', { duration: 3000 });
            this.loadApprovers();
          }
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.message || 'Failed to update approver', 'Close', { duration: 5000 });
        }
      });
    });
  }

  removeApprover(approver: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Remove Approver',
        message: 'Are you sure you want to remove this approver from the chain?',
        itemName: approver.userName || approver.approverName,
        type: 'delete'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.deleteApprover(approver.id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.snackBar.open('Approver removed', 'Close', { duration: 3000 });
            this.loadApprovers();
          }
        }
      });
    });
  }
}
