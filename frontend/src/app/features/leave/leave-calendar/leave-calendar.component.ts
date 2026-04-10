import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LeaveService, LeaveRequestDTO, PublicHolidayDTO } from '../services/leave.service';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leaves: { employeeName: string; leaveTypeName: string; leaveTypeColor: string }[];
}

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="leave-calendar">
      <div class="page-header">
        <div>
          <h1>Team Calendar</h1>
          <p class="subtitle">View who is on leave</p>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="calendar-nav">
            <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
            <h2>{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
            <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
            <button mat-button (click)="goToToday()">Today</button>
          </div>

          @if (loading) {
            <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
          } @else {
            <div class="calendar-grid">
              <div class="calendar-header">
                @for (day of weekDays; track day) {
                  <div class="header-cell">{{ day }}</div>
                }
              </div>
              <div class="calendar-body">
                @for (day of calendarDays; track day.date) {
                  <div class="calendar-cell" [class.other-month]="!day.isCurrentMonth"
                       [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.holiday]="day.isHoliday">
                    <span class="day-number">{{ day.dayOfMonth }}</span>
                    @if (day.isHoliday) {
                      <div class="holiday-label" [matTooltip]="day.holidayName || ''">{{ day.holidayName }}</div>
                    }
                    @for (leave of day.leaves; track leave.employeeName) {
                      <div class="leave-entry" [style.backgroundColor]="leave.leaveTypeColor"
                           [matTooltip]="leave.employeeName + ' - ' + leave.leaveTypeName">
                        {{ leave.employeeName | slice:0:15 }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .leave-calendar { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .calendar-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .calendar-nav h2 { margin: 0; min-width: 200px; text-align: center; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .calendar-grid { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f5f5f5; }
    .header-cell { padding: 8px; text-align: center; font-weight: 500; font-size: 13px; border-bottom: 1px solid #e0e0e0; }
    .calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); }
    .calendar-cell { min-height: 80px; padding: 4px; border: 1px solid #f0f0f0; font-size: 12px; }
    .calendar-cell.other-month { background: #fafafa; }
    .calendar-cell.today { background: #e3f2fd; }
    .calendar-cell.weekend { background: #f5f5f5; }
    .calendar-cell.holiday { background: #fff3e0; }
    .day-number { font-weight: 500; font-size: 13px; display: block; margin-bottom: 2px; }
    .holiday-label { font-size: 10px; color: #e65100; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .leave-entry { font-size: 10px; color: white; padding: 1px 4px; border-radius: 3px; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `]
})
export class LeaveCalendarComponent implements OnInit {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  calendarDays: CalendarDay[] = [];
  loading = false;
  leaveRequests: LeaveRequestDTO[] = [];
  holidays: PublicHolidayDTO[] = [];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(private leaveService: LeaveService) {}

  ngOnInit() { this.loadCalendar(); }

  loadCalendar() {
    this.loading = true;
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const from = this.formatDate(firstDay);
    const to = this.formatDate(lastDay);

    // Load team calendar data and holidays in parallel
    this.leaveService.getTeamCalendar(from, to).subscribe({
      next: (res) => {
        if (res.success) this.leaveRequests = res.data || [];
        this.leaveService.getHolidays(this.currentYear).subscribe({
          next: (hRes) => {
            if (hRes.success) this.holidays = hRes.data || [];
            this.buildCalendar();
            this.loading = false;
          },
          error: () => { this.buildCalendar(); this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  buildCalendar() {
    const today = new Date();
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    this.calendarDays = [];
    const current = new Date(startDay);

    for (let i = 0; i < 42; i++) {
      const dateStr = this.formatDate(current);
      const holiday = this.holidays.find(h => h.date === dateStr);
      const dayLeaves: any[] = [];

      for (const lr of this.leaveRequests) {
        if (dateStr >= lr.startDate && dateStr <= lr.endDate) {
          dayLeaves.push({
            employeeName: lr.employeeName,
            leaveTypeName: lr.leaveTypeName,
            leaveTypeColor: lr.leaveTypeColor || '#1976d2'
          });
        }
      }

      this.calendarDays.push({
        date: new Date(current),
        dayOfMonth: current.getDate(),
        isCurrentMonth: current.getMonth() === this.currentMonth,
        isToday: current.toDateString() === today.toDateString(),
        isWeekend: current.getDay() === 0 || current.getDay() === 6,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        leaves: dayLeaves
      });

      current.setDate(current.getDate() + 1);
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else { this.currentMonth--; }
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else { this.currentMonth++; }
    this.loadCalendar();
  }

  goToToday() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.loadCalendar();
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
