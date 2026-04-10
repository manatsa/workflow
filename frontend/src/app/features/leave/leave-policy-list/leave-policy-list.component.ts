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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LeaveService, LeavePolicyDTO, LeaveTypeDTO } from '../services/leave.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-leave-policy-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="leave-policy-list">
      <div class="page-header">
        <div>
          <h1>Leave Policies</h1>
          <p class="subtitle">Configure leave policies for each leave type</p>
        </div>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> New Policy
        </button>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="policies" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Policy Name</th>
                <td mat-cell *matCellDef="let p">{{ p.name }}</td>
              </ng-container>
              <ng-container matColumnDef="leaveType">
                <th mat-header-cell *matHeaderCellDef>Leave Type</th>
                <td mat-cell *matCellDef="let p">{{ p.leaveTypeName }}</td>
              </ng-container>
              <ng-container matColumnDef="daysAllowed">
                <th mat-header-cell *matHeaderCellDef>Days</th>
                <td mat-cell *matCellDef="let p">{{ p.daysAllowed }}</td>
              </ng-container>
              <ng-container matColumnDef="accrualMethod">
                <th mat-header-cell *matHeaderCellDef>Accrual</th>
                <td mat-cell *matCellDef="let p">{{ p.accrualMethod }}</td>
              </ng-container>
              <ng-container matColumnDef="carryOver">
                <th mat-header-cell *matHeaderCellDef>Carry-Over</th>
                <td mat-cell *matCellDef="let p">{{ p.maxCarryOverDays }} days</td>
              </ng-container>
              <ng-container matColumnDef="isDefault">
                <th mat-header-cell *matHeaderCellDef>Default</th>
                <td mat-cell *matCellDef="let p">{{ p.isDefault ? 'Yes' : 'No' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button matTooltip="Edit" (click)="openDialog(p)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" matTooltip="Delete" (click)="delete(p)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .leave-policy-list { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .full-width { width: 100%; }
  `]
})
export class LeavePolicyListComponent implements OnInit {
  policies: LeavePolicyDTO[] = [];
  leaveTypes: LeaveTypeDTO[] = [];
  loading = true;
  columns = ['name', 'leaveType', 'daysAllowed', 'accrualMethod', 'carryOver', 'isDefault', 'actions'];

  constructor(private leaveService: LeaveService, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() {
    this.leaveService.getTypes().subscribe({ next: (res) => { if (res.success) this.leaveTypes = res.data; } });
    this.load();
  }

  load() {
    this.loading = true;
    this.leaveService.getPolicies().subscribe({
      next: (res) => { if (res.success) this.policies = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openDialog(policy?: LeavePolicyDTO) {
    const dialogRef = this.dialog.open(LeavePolicyDialogComponent, {
      width: '600px',
      data: { policy: policy ? { ...policy } : null, leaveTypes: this.leaveTypes }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(policy: LeavePolicyDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Policy',
        message: 'Are you sure you want to delete this policy?',
        itemName: policy.name,
        type: 'delete'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result?.confirmed) return;
      this.leaveService.deletePolicy(policy.id!).subscribe({
        next: (res) => {
          if (res.success) { this.snackBar.open('Policy deleted', 'Close', { duration: 3000 }); this.load(); }
        }
      });
    });
  }
}

@Component({
  selector: 'app-leave-policy-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule, MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.policy ? 'Edit' : 'New' }} Leave Policy</h2>
    <mat-dialog-content>
      <form class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Policy Name</mat-label>
          <input matInput [(ngModel)]="form.name" name="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Leave Type</mat-label>
          <mat-select [(ngModel)]="form.leaveTypeId" name="leaveTypeId" required>
            @for (type of data.leaveTypes; track type.id) {
              <mat-option [value]="type.id">{{ type.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Days Allowed</mat-label>
          <input matInput type="number" [(ngModel)]="form.daysAllowed" name="daysAllowed" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Accrual Method</mat-label>
          <mat-select [(ngModel)]="form.accrualMethod" name="accrualMethod">
            <mat-option value="ANNUAL_UPFRONT">Annual Upfront</mat-option>
            <mat-option value="MONTHLY">Monthly</mat-option>
            <mat-option value="QUARTERLY">Quarterly</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Max Carry-Over Days</mat-label>
          <input matInput type="number" [(ngModel)]="form.maxCarryOverDays" name="maxCarryOverDays">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Min Days Before Request</mat-label>
          <input matInput type="number" [(ngModel)]="form.minDaysBeforeRequest" name="minDaysBeforeRequest">
        </mat-form-field>
        <mat-checkbox [(ngModel)]="form.allowHalfDay" name="allowHalfDay">Allow Half-Day</mat-checkbox>
        <mat-checkbox [(ngModel)]="form.proRataForNewJoiners" name="proRataForNewJoiners">Pro-Rata for New Joiners</mat-checkbox>
        <mat-checkbox [(ngModel)]="form.allowNegativeBalance" name="allowNegativeBalance">Allow Negative Balance</mat-checkbox>
        <mat-checkbox [(ngModel)]="form.isDefault" name="isDefault">Default Policy</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!form.name || !form.leaveTypeId">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 450px; } .full-width { width: 100%; }`]
})
export class LeavePolicyDialogComponent {
  form: any;

  constructor(
    private dialogRef: MatDialogRef<LeavePolicyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { policy: LeavePolicyDTO | null; leaveTypes: LeaveTypeDTO[] },
    private leaveService: LeaveService,
    private snackBar: MatSnackBar
  ) {
    this.form = data.policy ? { ...data.policy } : {
      name: '', leaveTypeId: '', daysAllowed: 0, accrualMethod: 'ANNUAL_UPFRONT',
      maxCarryOverDays: 0, minDaysBeforeRequest: 1, allowHalfDay: true,
      proRataForNewJoiners: true, allowNegativeBalance: false, isDefault: false
    };
  }

  save() {
    const obs = this.data.policy
      ? this.leaveService.updatePolicy(this.data.policy.id!, this.form)
      : this.leaveService.createPolicy(this.form);

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(this.data.policy ? 'Policy updated' : 'Policy created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed', 'Close', { duration: 5000 });
        }
      },
      error: (err) => { this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 5000 }); }
    });
  }
}
