import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingService } from '@core/services/setting.service';
import { Setting, SettingType } from '@core/models/setting.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="settings-container">
      <div class="header">
        <h1>Settings</h1>
        <button mat-raised-button color="primary" (click)="saveAll()">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
      </div>

      <mat-card>
        <mat-tab-group>
          @for (tab of tabs; track tab) {
            <mat-tab [label]="tab">
              <div class="tab-content">
                @for (setting of getSettingsForTab(tab); track setting.key) {
                  <div class="setting-row">
                    <div class="setting-label">
                      <strong>{{ setting.label }}</strong>
                      @if (setting.description) {
                        <span class="description">{{ setting.description }}</span>
                      }
                    </div>
                    <div class="setting-input">
                      @switch (setting.type) {
                        @case ('BOOLEAN') {
                          <mat-slide-toggle
                            [(ngModel)]="setting.value"
                            [ngModelOptions]="{standalone: true}">
                          </mat-slide-toggle>
                        }
                        @case ('COLOR') {
                          <div class="color-input">
                            <input type="color" [(ngModel)]="setting.value"
                                   [ngModelOptions]="{standalone: true}">
                            <input matInput [(ngModel)]="setting.value"
                                   [ngModelOptions]="{standalone: true}">
                          </div>
                        }
                        @case ('NUMBER') {
                          <mat-form-field appearance="outline">
                            <input matInput type="number" [(ngModel)]="setting.value"
                                   [ngModelOptions]="{standalone: true}">
                          </mat-form-field>
                        }
                        @case ('PASSWORD') {
                          <mat-form-field appearance="outline">
                            <input matInput type="password" [(ngModel)]="setting.value"
                                   [ngModelOptions]="{standalone: true}">
                          </mat-form-field>
                        }
                        @default {
                          <mat-form-field appearance="outline">
                            <input matInput [(ngModel)]="setting.value"
                                   [ngModelOptions]="{standalone: true}">
                          </mat-form-field>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .tab-content { padding: 1rem; }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .setting-label {
      flex: 1;
    }

    .setting-label .description {
      display: block;
      font-size: 0.75rem;
      color: #666;
    }

    .setting-input {
      width: 300px;
    }

    .setting-input mat-form-field {
      width: 100%;
    }

    .color-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-input input[type="color"] {
      width: 50px;
      height: 36px;
      border: none;
      cursor: pointer;
    }
  `]
})
export class SettingsComponent implements OnInit {
  settings: Setting[] = [];
  tabs: string[] = [];
  settingsGrouped: Record<string, Setting[]> = {};

  constructor(
    private settingService: SettingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingService.getSettingsGrouped().subscribe(res => {
      if (res.success) {
        this.settingsGrouped = res.data;
        this.tabs = Object.keys(res.data);
        this.settings = Object.values(res.data).flat();
      }
    });
  }

  getSettingsForTab(tab: string): Setting[] {
    return this.settingsGrouped[tab] || [];
  }

  saveAll() {
    const modifiedSettings = this.settings.map(s => ({
      id: s.id,
      key: s.key,
      value: String(s.value),
      label: s.label,
      type: s.type,
      tab: s.tab,
      category: s.category
    }));

    this.settingService.saveSettings(modifiedSettings).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Failed to save settings', 'Close', { duration: 3000 });
      }
    });
  }
}
