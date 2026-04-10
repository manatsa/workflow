import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LeaveService, LeaveTypeDTO, LeaveRequestDTO } from '../services/leave.service';

@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_circle</mat-icon>
      New Leave Request
    </h2>

    <mat-dialog-content>
      <form class="form-grid" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Leave Type</mat-label>
          <mat-select [(ngModel)]="request.leaveTypeId" name="leaveTypeId" required (selectionChange)="onTypeChange()">
            @for (type of leaveTypes; track type.id) {
              <mat-option [value]="type.id">
                <span [style.color]="type.colorCode">&#9679;</span> {{ type.name }} ({{ type.defaultDaysPerYear }} days/year)
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="date-row">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" name="startDate" required
                   (dateChange)="calculateDays()">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" name="endDate" required
                   (dateChange)="calculateDays()">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="half-day-row">
          <mat-checkbox [(ngModel)]="request.startDateHalfDay" name="startDateHalfDay"
                        (change)="calculateDays()">Start date half-day</mat-checkbox>
          @if (request.startDateHalfDay) {
            <mat-form-field appearance="outline" class="half-day-select">
              <mat-select [(ngModel)]="request.startDateHalfDayPeriod" name="startDateHalfDayPeriod">
                <mat-option value="MORNING">Morning</mat-option>
                <mat-option value="AFTERNOON">Afternoon</mat-option>
              </mat-select>
            </mat-form-field>
          }
          <mat-checkbox [(ngModel)]="request.endDateHalfDay" name="endDateHalfDay"
                        (change)="calculateDays()">End date half-day</mat-checkbox>
          @if (request.endDateHalfDay) {
            <mat-form-field appearance="outline" class="half-day-select">
              <mat-select [(ngModel)]="request.endDateHalfDayPeriod" name="endDateHalfDayPeriod">
                <mat-option value="MORNING">Morning</mat-option>
                <mat-option value="AFTERNOON">Afternoon</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </div>

        @if (calculatedDays !== null) {
          <div class="days-preview">
            <mat-icon>event_available</mat-icon>
            <span><strong>{{ calculatedDays }}</strong> working day(s)</span>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <textarea matInput [(ngModel)]="request.reason" name="reason" rows="3" required></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact While On Leave</mat-label>
          <input matInput [(ngModel)]="request.contactWhileOnLeave" name="contactWhileOnLeave"
                 placeholder="Phone number or email">
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting">
        @if (submitting) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Submit Request
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px 24px;
    }

    mat-dialog-content {
      min-width: 500px;
      max-height: 70vh;
      padding: 0 24px;
    }

    .form-grid { display: flex; flex-direction: column; gap: 8px; }
    .date-row { display: flex; gap: 16px; }
    .date-row mat-form-field { flex: 1; }
    .half-day-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .half-day-select { width: 150px; }
    .days-preview { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #e3f2fd; border-radius: 8px; margin: 8px 0; }
    .full-width { width: 100%; }
  `]
})
export class LeaveRequestFormComponent implements OnInit {
  leaveTypes: LeaveTypeDTO[] = [];
  request: any = {
    leaveTypeId: '',
    startDateHalfDay: false,
    startDateHalfDayPeriod: 'MORNING',
    endDateHalfDay: false,
    endDateHalfDayPeriod: 'MORNING',
    reason: '',
    contactWhileOnLeave: ''
  };
  startDate: Date | null = null;
  endDate: Date | null = null;
  calculatedDays: number | null = null;
  submitting = false;

  constructor(
    private leaveService: LeaveService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LeaveRequestFormComponent>
  ) {}

  ngOnInit() {
    this.leaveService.getTypes().subscribe({
      next: (res) => {
        if (res.success) this.leaveTypes = res.data;
      }
    });
  }

  onTypeChange() {
    this.calculateDays();
  }

  calculateDays() {
    if (!this.startDate || !this.endDate) return;
    const startStr = this.formatDate(this.startDate);
    const endStr = this.formatDate(this.endDate);

    this.leaveService.calculateDays(startStr, endStr,
      this.request.startDateHalfDay, this.request.endDateHalfDay).subscribe({
      next: (res) => {
        if (res.success) this.calculatedDays = res.data;
      }
    });
  }

  submit() {
    if (!this.startDate || !this.endDate || !this.request.leaveTypeId) return;

    this.submitting = true;
    const dto: LeaveRequestDTO = {
      ...this.request,
      startDate: this.formatDate(this.startDate),
      endDate: this.formatDate(this.endDate)
    };

    this.leaveService.createRequest(dto).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Leave request submitted successfully', 'Close', { duration: 3000 });
          this.dialogRef.close('created');
        } else {
          this.snackBar.open(res.message || 'Failed to submit request', 'Close', { duration: 5000 });
        }
        this.submitting = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to submit request', 'Close', { duration: 5000 });
        this.submitting = false;
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
