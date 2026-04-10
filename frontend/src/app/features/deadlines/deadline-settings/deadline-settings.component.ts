import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingService } from '../../../core/services/setting.service';

interface SettingItem {
  id?: string;
  key: string;
  value: string;
  label: string;
  category: string;
  tab: string;
  type: string;
  options?: string;
  description?: string;
}

@Component({
  selector: 'app-deadline-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule
  ],
  template: `
    <div class="deadline-settings">
      <div class="page-header">
        <div>
          <h1>Deadline Settings</h1>
          <p class="subtitle">Configure scheduling, notifications, and thresholds for critical deadlines</p>
        </div>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
          @if (saving) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon> Save Settings
          }
        </button>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        @for (category of categories; track category) {
          <mat-card class="settings-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ getCategoryIcon(category) }}</mat-icon>
              <mat-card-title>{{ category }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="settings-grid">
                @for (setting of getSettingsByCategory(category); track setting.key) {
                  <div class="setting-item">
                    @if (setting.type === 'BOOLEAN') {
                      <mat-slide-toggle [(ngModel)]="boolValues[setting.key]" color="primary"
                                        (change)="onBoolChange(setting)">
                        {{ setting.label }}
                      </mat-slide-toggle>
                    } @else if (setting.type === 'NUMBER') {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ setting.label }}</mat-label>
                        <input matInput type="number" [(ngModel)]="setting.value" [name]="setting.key">
                        @if (getHint(setting.key)) {
                          <mat-hint>{{ getHint(setting.key) }}</mat-hint>
                        }
                      </mat-form-field>
                    } @else if (setting.type === 'SELECT' && setting.options) {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ setting.label }}</mat-label>
                        <mat-select [(ngModel)]="setting.value" [name]="setting.key">
                          @for (opt of setting.options.split(','); track opt) {
                            <mat-option [value]="opt.trim()">{{ opt.trim() }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    } @else {
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ setting.label }}</mat-label>
                        <input matInput [(ngModel)]="setting.value" [name]="setting.key">
                        @if (getHint(setting.key)) {
                          <mat-hint>{{ getHint(setting.key) }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Schedule Preview -->
        <mat-card class="settings-card preview-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>info</mat-icon>
            <mat-card-title>Schedule Preview</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="preview-grid">
              <div class="preview-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <strong>Runs daily at</strong>
                  <span>{{ getSettingValue('deadline.scheduler.hour', '7') }}:{{ getSettingValue('deadline.scheduler.minute', '0').padStart(2, '0') }}</span>
                </div>
              </div>
              <div class="preview-item">
                <mat-icon>warning</mat-icon>
                <div>
                  <strong>Due Soon threshold</strong>
                  <span>{{ getSettingValue('deadline.due.soon.threshold.days', '7') }} days before due date</span>
                </div>
              </div>
              <div class="preview-item">
                <mat-icon>visibility</mat-icon>
                <div>
                  <strong>Look-ahead window</strong>
                  <span>{{ getSettingValue('deadline.look.ahead.days', '60') }} days</span>
                </div>
              </div>
              <div class="preview-item">
                <mat-icon>notifications</mat-icon>
                <div>
                  <strong>Default reminders at</strong>
                  <span>{{ getSettingValue('deadline.default.reminder.days', '30,7,1') }} days before</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .deadline-settings { padding: 24px; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
    .settings-card { margin-bottom: 20px; }
    .settings-card mat-card-header { margin-bottom: 16px; }
    .settings-card mat-card-header mat-icon { color: #1976d2; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .setting-item { display: flex; align-items: center; }
    .full-width { width: 100%; }
    mat-slide-toggle { margin: 8px 0; }
    .preview-card { background: #f5f5f5; }
    .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .preview-item { display: flex; align-items: center; gap: 12px; }
    .preview-item mat-icon { color: #1976d2; }
    .preview-item div { display: flex; flex-direction: column; }
    .preview-item strong { font-size: 13px; color: #333; }
    .preview-item span { font-size: 14px; color: #666; }
    @media (max-width: 768px) {
      .settings-grid, .preview-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DeadlineSettingsComponent implements OnInit {
  settings: SettingItem[] = [];
  categories: string[] = [];
  boolValues: Record<string, boolean> = {};
  loading = true;
  saving = false;

  private hints: Record<string, string> = {
    'deadline.scheduler.hour': '0-23 (24-hour format)',
    'deadline.scheduler.minute': '0-59',
    'deadline.due.soon.threshold.days': 'Deadlines within this many days will be marked "Due Soon"',
    'deadline.look.ahead.days': 'How far ahead to scan for reminders',
    'deadline.default.reminder.days': 'e.g. 30,7,1 — sends reminders at 30, 7, and 1 day(s) before',
    'deadline.overdue.escalation.days': 'Days after due date before escalation',
    'deadline.scheduler.cron': 'Advanced: overrides hour/minute if set manually'
  };

  constructor(private settingService: SettingService, private snackBar: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.settingService.getSettingsByTab('Deadlines').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.settings = res.data as any[];
          // Build categories in order
          const seen = new Set<string>();
          this.categories = [];
          for (const s of this.settings) {
            if (s.category && !seen.has(s.category)) {
              seen.add(s.category);
              this.categories.push(s.category);
            }
          }
          // Init boolean values
          for (const s of this.settings) {
            if (s.type === 'BOOLEAN') {
              this.boolValues[s.key] = s.value === 'true';
            }
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getSettingsByCategory(category: string): SettingItem[] {
    return this.settings.filter(s => s.category === category);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Scheduling': 'schedule',
      'Status Thresholds': 'tune',
      'Reminders': 'notifications_active',
      'Overdue': 'warning',
      'Notifications': 'email'
    };
    return icons[category] || 'settings';
  }

  getHint(key: string): string {
    return this.hints[key] || '';
  }

  getSettingValue(key: string, fallback: string): string {
    const s = this.settings.find(s => s.key === key);
    return s?.value || fallback;
  }

  onBoolChange(setting: SettingItem) {
    setting.value = this.boolValues[setting.key] ? 'true' : 'false';
  }

  save() {
    this.saving = true;

    // Update cron from hour/minute
    const hour = this.getSettingValue('deadline.scheduler.hour', '7');
    const minute = this.getSettingValue('deadline.scheduler.minute', '0');
    const cronSetting = this.settings.find(s => s.key === 'deadline.scheduler.cron');
    if (cronSetting) {
      cronSetting.value = `0 ${minute} ${hour} * * *`;
    }

    this.settingService.saveSettings(this.settings as any[]).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Deadline settings saved successfully', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(res.message || 'Failed to save settings', 'Close', { duration: 5000 });
        }
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to save settings', 'Close', { duration: 5000 });
        this.saving = false;
      }
    });
  }
}
