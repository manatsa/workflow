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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { SettingService } from '@core/services/setting.service';
import { ThemeService } from '@core/services/theme.service';
import { ImportExportService } from '@core/services/import-export.service';
import { Setting } from '@core/models/setting.model';
import { HttpClient } from '@angular/common/http';

interface SettingGroup {
  category: string;
  settings: Setting[];
}

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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatChipsModule
  ],
  template: `
    <div class="settings-container">
      <div class="header">
        <h1>Settings</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="jsonFileInput.click()" [disabled]="loading">
            <mat-icon>upload</mat-icon>
            Import JSON
          </button>
          <input hidden #jsonFileInput type="file" accept=".json" (change)="importSettingsJson($event)">
          <button mat-stroked-button (click)="exportSettingsJson()" [disabled]="loading || tabs.length === 0">
            <mat-icon>download</mat-icon>
            Export JSON
          </button>
          <button mat-raised-button color="primary" (click)="saveAll()" [disabled]="loading || tabs.length === 0">
            <mat-icon>save</mat-icon>
            Save Changes
          </button>
        </div>
      </div>

      @if (loading) {
        <mat-card>
          <mat-card-content class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading settings...</p>
          </mat-card-content>
        </mat-card>
      } @else if (error) {
        <mat-card>
          <mat-card-content class="error-state">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error }}</p>
            <button mat-raised-button color="primary" (click)="loadSettings()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </mat-card-content>
        </mat-card>
      } @else if (tabs.length === 0) {
        <mat-card>
          <mat-card-content class="empty-state">
            <mat-icon>settings</mat-icon>
            <p>No settings found.</p>
            <p class="hint">Settings will be automatically created when the system initializes.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <mat-tab-group>
            @for (tab of tabs; track tab) {
              <mat-tab [label]="tab">
                <div class="tab-content">
                  <!-- Special actions for Mail Settings tab -->
                  @if (tab === 'Mail Settings') {
                    <div class="tab-actions">
                      <mat-form-field appearance="outline" class="test-email-field">
                        <mat-label>Test Email Address</mat-label>
                        <input matInput [(ngModel)]="testEmailAddress" placeholder="Enter email address">
                      </mat-form-field>
                      <button mat-raised-button color="accent" (click)="sendTestEmail()" [disabled]="sendingTestEmail || !testEmailAddress">
                        @if (sendingTestEmail) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>send</mat-icon>
                        }
                        Send Test Email
                      </button>
                    </div>
                    <mat-divider></mat-divider>
                  }

                  <!-- Special handling for Reporting tab - Report Roles multi-select -->
                  @if (tab === 'Reporting') {
                    <div class="reporting-section">
                      <h3 class="category-title">Access Control</h3>
                      <div class="setting-item full-width">
                        <div class="setting-label">
                          <strong>Report Roles</strong>
                          <span class="description">Select roles that can access reports</span>
                        </div>
                        <div class="setting-input roles-select">
                          <mat-form-field appearance="outline" class="full-width-field">
                            <mat-label>Select Roles</mat-label>
                            <mat-select [(ngModel)]="selectedReportRoles" [ngModelOptions]="{standalone: true}" multiple (selectionChange)="onReportRolesChange()">
                              @for (role of availableRoles; track role.id) {
                                <mat-option [value]="role.name">{{ role.name }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        </div>
                      </div>
                      <mat-divider></mat-divider>
                    </div>
                  }

                  <!-- Settings grouped by category in 2 columns -->
                  @for (group of getGroupedSettingsForTab(tab); track group.category) {
                    <div class="category-section">
                      <h3 class="category-title">{{ group.category }}</h3>
                      <div class="settings-grid">
                        @for (setting of group.settings; track setting.key) {
                          <div class="setting-item">
                            <div class="setting-label">
                              <strong>{{ setting.label || setting.key }}</strong>
                              @if (setting.description) {
                                <span class="description">{{ setting.description }}</span>
                              }
                            </div>
                            <div class="setting-input">
                              @switch (setting.type) {
                                @case ('BOOLEAN') {
                                  <mat-slide-toggle
                                    [checked]="setting.value === 'true'"
                                    (change)="setting.value = $event.checked ? 'true' : 'false'">
                                  </mat-slide-toggle>
                                }
                                @case ('COLOR') {
                                  <div class="color-input">
                                    <input type="color" [(ngModel)]="setting.value"
                                           [ngModelOptions]="{standalone: true}">
                                    <input matInput [(ngModel)]="setting.value"
                                           [ngModelOptions]="{standalone: true}" class="color-text">
                                  </div>
                                }
                                @case ('NUMBER') {
                                  <mat-form-field appearance="outline" class="compact-field">
                                    <input matInput type="number" [(ngModel)]="setting.value"
                                           [ngModelOptions]="{standalone: true}">
                                  </mat-form-field>
                                }
                                @case ('PASSWORD') {
                                  <mat-form-field appearance="outline" class="compact-field">
                                    <input matInput type="password" [(ngModel)]="setting.value"
                                           [ngModelOptions]="{standalone: true}">
                                  </mat-form-field>
                                }
                                @case ('SELECT') {
                                  <mat-form-field appearance="outline" class="compact-field">
                                    <mat-select [(ngModel)]="setting.value" [ngModelOptions]="{standalone: true}">
                                      @for (option of getSelectOptions(setting); track option) {
                                        <mat-option [value]="option">{{ option }}</mat-option>
                                      }
                                    </mat-select>
                                  </mat-form-field>
                                }
                                @default {
                                  <mat-form-field appearance="outline" class="compact-field">
                                    <input matInput [(ngModel)]="setting.value"
                                           [ngModelOptions]="{standalone: true}">
                                  </mat-form-field>
                                }
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        </mat-card>
      }
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

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .tab-content { padding: 1rem; }

    .tab-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .test-email-field {
      flex: 1;
      max-width: 400px;
    }

    .tab-actions button {
      height: 56px;
    }

    .tab-actions mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .category-section {
      margin-bottom: 1.5rem;
    }

    .category-title {
      font-size: 1rem;
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (max-width: 1200px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #fafafa;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .setting-label {
      flex: 1;
      min-width: 0;
      padding-right: 1rem;
    }

    .setting-label strong {
      display: block;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .setting-label .description {
      display: block;
      font-size: 0.7rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .setting-input {
      flex-shrink: 0;
      width: 200px;
    }

    .compact-field {
      width: 100%;
    }

    .compact-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .color-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-input input[type="color"] {
      width: 40px;
      height: 36px;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .color-input .color-text {
      flex: 1;
      font-size: 0.8rem;
    }

    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #666;
    }

    .loading-state mat-spinner {
      margin-bottom: 1rem;
    }

    .error-state mat-icon, .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .error-state mat-icon {
      color: #f44336;
    }

    .error-state button {
      margin-top: 1rem;
    }

    .empty-state .hint {
      font-size: 0.875rem;
      opacity: 0.7;
      margin-top: 0.5rem;
    }

    mat-divider {
      margin: 1rem 0;
    }

    .reporting-section {
      margin-bottom: 1rem;
    }

    .setting-item.full-width {
      grid-column: 1 / -1;
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .setting-item.full-width .setting-label {
      padding-right: 0;
    }

    .setting-item.full-width .setting-input {
      width: 100%;
    }

    .roles-select {
      max-width: 500px;
    }

    .full-width-field {
      width: 100%;
    }

    .full-width-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `]
})
export class SettingsComponent implements OnInit {
  settings: Setting[] = [];
  tabs: string[] = [];
  settingsGrouped: Record<string, Setting[]> = {};
  loading = true;
  error: string | null = null;
  testEmailAddress = '';
  sendingTestEmail = false;
  availableRoles: { id: string; name: string }[] = [];
  selectedReportRoles: string[] = [];

  private apiUrl = '/api';

  constructor(
    private settingService: SettingService,
    private themeService: ThemeService,
    private importExportService: ImportExportService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadRoles();
  }

  loadRoles() {
    this.http.get<any>(`${this.apiUrl}/roles`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.availableRoles = res.data.map((r: any) => ({ id: r.id, name: r.name }));
        }
      }
    });
  }

  initReportRolesFromSettings() {
    const reportRolesSetting = this.settings.find(s => s.key === 'reporting.roles');
    if (reportRolesSetting && reportRolesSetting.value) {
      this.selectedReportRoles = reportRolesSetting.value.split(',').map(r => r.trim()).filter(r => r.length > 0);
    }
  }

  onReportRolesChange() {
    const reportRolesSetting = this.settings.find(s => s.key === 'reporting.roles');
    if (reportRolesSetting) {
      reportRolesSetting.value = this.selectedReportRoles.join(',');
    }
  }

  loadSettings() {
    this.loading = true;
    this.error = null;
    this.settingService.getSettingsGrouped().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.settingsGrouped = res.data;
          this.tabs = Object.keys(res.data);
          this.settings = Object.values(res.data).flat();
          this.initReportRolesFromSettings();
        } else {
          this.error = res.message || 'Failed to load settings';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load settings. Please check your permissions.';
      }
    });
  }

  getSettingsForTab(tab: string): Setting[] {
    return this.settingsGrouped[tab] || [];
  }

  getGroupedSettingsForTab(tab: string): SettingGroup[] {
    let settings = this.getSettingsForTab(tab);

    // Filter out reporting.roles as it's handled separately in the Reporting tab
    if (tab === 'Reporting') {
      settings = settings.filter(s => s.key !== 'reporting.roles');
    }

    const categoryMap = new Map<string, Setting[]>();

    // Group settings by category
    settings.forEach(setting => {
      const category = setting.category || 'General';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(setting);
    });

    // Convert to array and sort by category name
    return Array.from(categoryMap.entries())
      .map(([category, settings]) => ({ category, settings }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  getSelectOptions(setting: Setting): string[] {
    if (!setting.options) {
      return [];
    }
    return setting.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
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
          // Refresh theme to apply new theme settings
          this.themeService.refreshTheme();
        }
      },
      error: () => {
        this.snackBar.open('Failed to save settings', 'Close', { duration: 3000 });
      }
    });
  }

  sendTestEmail() {
    if (!this.testEmailAddress) {
      this.snackBar.open('Please enter an email address', 'Close', { duration: 3000 });
      return;
    }

    this.sendingTestEmail = true;
    this.settingService.sendTestEmail(this.testEmailAddress).subscribe({
      next: (res) => {
        this.sendingTestEmail = false;
        if (res.success) {
          this.snackBar.open(res.message || 'Test email sent successfully!', 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(res.message || 'Failed to send test email', 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.sendingTestEmail = false;
        this.snackBar.open(err.error?.message || 'Failed to send test email', 'Close', { duration: 5000 });
      }
    });
  }

  exportSettingsJson() {
    this.importExportService.exportSettingsJson().subscribe({
      next: (blob) => {
        this.importExportService.downloadFile(blob, 'Settings_Export.json');
        this.snackBar.open('Settings exported successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to export settings', 'Close', { duration: 3000 });
      }
    });
  }

  importSettingsJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.importExportService.importSettingsJson(file).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(res.message || 'Settings imported successfully', 'Close', { duration: 3000 });
          this.loadSettings();
        } else {
          this.snackBar.open(res.message || 'Failed to import settings', 'Close', { duration: 3000 });
        }
        input.value = '';
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to import settings', 'Close', { duration: 3000 });
        input.value = '';
      }
    });
  }
}
