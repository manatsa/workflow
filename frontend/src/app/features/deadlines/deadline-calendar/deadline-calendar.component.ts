import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeadlineService, DeadlineInstanceDTO } from '../services/deadline.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  deadlines: DeadlineInstanceDTO[];
}

@Component({
  selector: 'app-deadline-calendar',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="calendar-page">
      <div class="page-header">
        <h1>Deadline Calendar</h1>
        <div class="month-nav">
          <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
          <span class="month-label">{{ currentDate | date:'MMMM yyyy' }}</span>
          <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
          <button mat-stroked-button (click)="goToToday()">Today</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <div class="calendar-grid">
              <div class="calendar-header" *ngFor="let day of weekDays">{{ day }}</div>
              @for (day of calendarDays; track day.date.toISOString()) {
                <div class="calendar-day" [class.other-month]="!day.isCurrentMonth" [class.today]="day.isToday">
                  <span class="day-number">{{ day.date.getDate() }}</span>
                  @for (dl of day.deadlines; track dl.id) {
                    <a [routerLink]="['/deadlines/items', dl.deadlineItemId]"
                       class="deadline-dot"
                       [class.overdue]="dl.status === 'OVERDUE'"
                       [class.due-soon]="dl.status === 'DUE_SOON'"
                       [class.completed]="dl.status === 'COMPLETED'"
                       [matTooltip]="dl.deadlineItemName + ' (' + dl.status + ')'">
                      {{ dl.deadlineItemName | slice:0:18 }}{{ (dl.deadlineItemName?.length || 0) > 18 ? '...' : '' }}
                    </a>
                  }
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Legend -->
        <div class="legend">
          <span class="legend-item"><span class="legend-dot upcoming"></span> Upcoming</span>
          <span class="legend-item"><span class="legend-dot due-soon"></span> Due Soon</span>
          <span class="legend-item"><span class="legend-dot overdue"></span> Overdue</span>
          <span class="legend-item"><span class="legend-dot completed"></span> Completed</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .month-nav { display: flex; align-items: center; gap: 8px; }
    .month-label { font-size: 18px; font-weight: 500; min-width: 180px; text-align: center; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }

    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid #e0e0e0; }
    .calendar-header { padding: 10px; text-align: center; font-weight: 600; font-size: 13px; color: #666; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
    .calendar-day { min-height: 100px; padding: 6px; border: 1px solid #f0f0f0; position: relative; }
    .calendar-day.other-month { background: #fafafa; }
    .calendar-day.other-month .day-number { color: #ccc; }
    .calendar-day.today { background: #e3f2fd; }
    .calendar-day.today .day-number { color: #1565c0; font-weight: 700; }
    .day-number { font-size: 13px; font-weight: 500; color: #333; }

    .deadline-dot { display: block; margin-top: 2px; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #e3f2fd; color: #1565c0; cursor: pointer; }
    .deadline-dot:hover { opacity: 0.85; }
    .deadline-dot.overdue { background: #ffebee; color: #c62828; }
    .deadline-dot.due-soon { background: #fff3e0; color: #e65100; }
    .deadline-dot.completed { background: #e8f5e9; color: #2e7d32; }

    .legend { display: flex; gap: 20px; justify-content: center; margin-top: 16px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; }
    .legend-dot { width: 12px; height: 12px; border-radius: 3px; }
    .legend-dot.upcoming { background: #e3f2fd; }
    .legend-dot.due-soon { background: #fff3e0; }
    .legend-dot.overdue { background: #ffebee; }
    .legend-dot.completed { background: #e8f5e9; }
  `]
})
export class DeadlineCalendarComponent implements OnInit {
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  allInstances: DeadlineInstanceDTO[] = [];
  loading = true;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private deadlineService: DeadlineService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadInstances();
  }

  loadInstances() {
    this.loading = true;
    this.deadlineService.getUpcoming(90).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allInstances = res.data;
          // Also load overdue
          this.deadlineService.getOverdue().subscribe({
            next: (overdueRes: any) => {
              if (overdueRes.success) {
                this.allInstances = [...this.allInstances, ...overdueRes.data];
              }
              this.buildCalendar();
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load deadlines', 'Close', { duration: 3000 });
      }
    });
  }

  buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.calendarDays = [];

    // Fill in days from previous month
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      this.calendarDays.push({ date, isCurrentMonth: false, isToday: false, deadlines: this.getDeadlinesForDate(date) });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isToday = date.getTime() === today.getTime();
      this.calendarDays.push({ date, isCurrentMonth: true, isToday, deadlines: this.getDeadlinesForDate(date) });
    }

    // Fill remaining days
    const remaining = 42 - this.calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({ date, isCurrentMonth: false, isToday: false, deadlines: this.getDeadlinesForDate(date) });
    }
  }

  getDeadlinesForDate(date: Date): DeadlineInstanceDTO[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.allInstances.filter(i => i.dueDate === dateStr);
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.buildCalendar();
  }
}
