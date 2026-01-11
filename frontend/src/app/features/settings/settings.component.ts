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
import { EmailSettingsService } from '@core/services/email-settings.service';
import { Setting } from '@core/models/setting.model';
import { EmailSettings, EmailProtocol, SmtpSecurity, EmailTestResult } from '@core/models/email-settings.model';
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
            <!-- Dynamic tabs (excluding Reporting which comes after Email) -->
            @for (tab of getTabsBeforeReporting(); track tab) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>{{ getTabIcon(tab) }}</mat-icon>
                  <span class="tab-label">{{ tab }}</span>
                </ng-template>
                <div class="tab-content">
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

            <!-- Email Settings Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>email</mat-icon>
                <span class="tab-label">Email</span>
              </ng-template>
              <div class="tab-content">
                @if (emailErrorMessage) {
                  <div class="error-message">{{ emailErrorMessage }}</div>
                }
                @if (emailSuccessMessage) {
                  <div class="success-message">{{ emailSuccessMessage }}</div>
                }
                @if (emailLoading) {
                  <div class="loading-spinner"><mat-spinner diameter="30"></mat-spinner></div>
                }

                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Email Protocol</mat-label>
                    <mat-select [(ngModel)]="emailSettings.emailProtocol" [ngModelOptions]="{standalone: true}">
                      @for (protocol of emailProtocols; track protocol) {
                        <mat-option [value]="protocol">{{ getProtocolLabel(protocol) }}</mat-option>
                      }
                    </mat-select>
                    <mat-hint>Select the email delivery method</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Sender Email</mat-label>
                    <input matInput [(ngModel)]="emailSettings.senderEmail" [ngModelOptions]="{standalone: true}" type="email" required>
                    <mat-hint>Email address to send from</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Sender Name</mat-label>
                    <input matInput [(ngModel)]="emailSettings.senderName" [ngModelOptions]="{standalone: true}">
                    <mat-hint>Display name for sent emails</mat-hint>
                  </mat-form-field>
                </div>

                <!-- SMTP Settings -->
                @if (isSmtpProtocol()) {
                  <div class="settings-section">
                    <h4>SMTP Configuration</h4>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>SMTP Host</mat-label>
                        <input matInput [(ngModel)]="emailSettings.smtpHost" [ngModelOptions]="{standalone: true}">
                        <mat-hint>e.g., smtp.gmail.com</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>SMTP Port</mat-label>
                        <input matInput [(ngModel)]="emailSettings.smtpPort" [ngModelOptions]="{standalone: true}" type="number">
                        <mat-hint>e.g., 587 for TLS, 465 for SSL</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Security</mat-label>
                        <mat-select [(ngModel)]="emailSettings.smtpSecurity" [ngModelOptions]="{standalone: true}">
                          @for (sec of smtpSecurityOptions; track sec) {
                            <mat-option [value]="sec">{{ sec }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Username</mat-label>
                        <input matInput [(ngModel)]="emailSettings.smtpUsername" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Password</mat-label>
                        <input matInput [(ngModel)]="emailSettings.smtpPassword" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                        <button mat-icon-button matSuffix type="button" (click)="showEmailPassword = !showEmailPassword">
                          <mat-icon>{{ showEmailPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Reply-To Email</mat-label>
                        <input matInput [(ngModel)]="emailSettings.replyToEmail" [ngModelOptions]="{standalone: true}" type="email">
                        <mat-hint>Optional reply-to address</mat-hint>
                      </mat-form-field>
                    </div>
                    <div class="radio-field-section" style="margin-top: 10px;">
                      <mat-slide-toggle [(ngModel)]="emailSettings.smtpAuthRequired" [ngModelOptions]="{standalone: true}">
                        SMTP Authentication Required
                      </mat-slide-toggle>
                    </div>
                  </div>
                }

                <!-- Microsoft Graph Settings -->
                @if (isMicrosoftProtocol()) {
                  <div class="settings-section">
                    <h4>Microsoft Graph API Configuration</h4>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>Tenant ID</mat-label>
                        <input matInput [(ngModel)]="emailSettings.msTenantId" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Client ID</mat-label>
                        <input matInput [(ngModel)]="emailSettings.msClientId" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Client Secret</mat-label>
                        <input matInput [(ngModel)]="emailSettings.msClientSecret" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                        <button mat-icon-button matSuffix type="button" (click)="showEmailPassword = !showEmailPassword">
                          <mat-icon>{{ showEmailPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>User Email</mat-label>
                        <input matInput [(ngModel)]="emailSettings.msUserEmail" [ngModelOptions]="{standalone: true}" type="email">
                        <mat-hint>Microsoft 365 user email</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                }

                <!-- Gmail API Settings -->
                @if (isGmailApiProtocol()) {
                  <div class="settings-section">
                    <h4>Gmail API Configuration</h4>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>Client ID</mat-label>
                        <input matInput [(ngModel)]="emailSettings.gmailClientId" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Client Secret</mat-label>
                        <input matInput [(ngModel)]="emailSettings.gmailClientSecret" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                        <button mat-icon-button matSuffix type="button" (click)="showEmailPassword = !showEmailPassword">
                          <mat-icon>{{ showEmailPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Refresh Token</mat-label>
                        <input matInput [(ngModel)]="emailSettings.gmailRefreshToken" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>User Email</mat-label>
                        <input matInput [(ngModel)]="emailSettings.gmailUserEmail" [ngModelOptions]="{standalone: true}" type="email">
                        <mat-hint>Gmail user email</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                }

                <!-- Exchange EWS Settings -->
                @if (isExchangeProtocol()) {
                  <div class="settings-section">
                    <h4>Exchange EWS Configuration</h4>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>Server URL</mat-label>
                        <input matInput [(ngModel)]="emailSettings.exchangeServerUrl" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Username</mat-label>
                        <input matInput [(ngModel)]="emailSettings.exchangeUsername" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Password</mat-label>
                        <input matInput [(ngModel)]="emailSettings.exchangePassword" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                        <button mat-icon-button matSuffix type="button" (click)="showEmailPassword = !showEmailPassword">
                          <mat-icon>{{ showEmailPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Domain</mat-label>
                        <input matInput [(ngModel)]="emailSettings.exchangeDomain" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Email</mat-label>
                        <input matInput [(ngModel)]="emailSettings.exchangeEmail" [ngModelOptions]="{standalone: true}" type="email">
                        <mat-hint>Exchange email address</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                }

                <!-- API-based Services Settings -->
                @if (isApiBasedProtocol()) {
                  <div class="settings-section">
                    <h4>API Configuration</h4>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>API Key</mat-label>
                        <input matInput [(ngModel)]="emailSettings.apiKey" [ngModelOptions]="{standalone: true}"
                               [type]="showEmailPassword ? 'text' : 'password'">
                        <button mat-icon-button matSuffix type="button" (click)="showEmailPassword = !showEmailPassword">
                          <mat-icon>{{ showEmailPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                        </button>
                      </mat-form-field>

                      @if (emailSettings.emailProtocol === 'AWS_SES') {
                        <mat-form-field appearance="outline">
                          <mat-label>Region</mat-label>
                          <input matInput [(ngModel)]="emailSettings.awsRegion" [ngModelOptions]="{standalone: true}">
                          <mat-hint>e.g., us-east-1</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Access Key ID</mat-label>
                          <input matInput [(ngModel)]="emailSettings.awsAccessKeyId" [ngModelOptions]="{standalone: true}">
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Secret Key</mat-label>
                          <input matInput [(ngModel)]="emailSettings.awsSecretKey" [ngModelOptions]="{standalone: true}"
                                 [type]="showEmailPassword ? 'text' : 'password'">
                        </mat-form-field>
                      }
                    </div>
                  </div>
                }

                <!-- Active Toggle -->
                <div class="radio-field-section" style="margin-top: 20px;">
                  <mat-slide-toggle [(ngModel)]="emailSettings.emailEnabled" [ngModelOptions]="{standalone: true}">
                    Email Service Enabled
                  </mat-slide-toggle>
                  <p class="radio-hint">Enable or disable email sending</p>
                </div>

                <!-- Test Connection -->
                <div class="settings-section" style="margin-top: 20px;">
                  <h4>Test Email Configuration</h4>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Test Email Address</mat-label>
                      <input matInput [(ngModel)]="emailTestEmail" [ngModelOptions]="{standalone: true}" type="email"
                             placeholder="Enter email to receive test">
                      <mat-hint>Leave empty to use Sender Email</mat-hint>
                    </mat-form-field>
                  </div>

                  @if (emailTestResult) {
                    <div [class]="emailTestResult.success ? 'success-message' : 'error-message'" style="margin: 10px 0;">
                      <strong>{{ emailTestResult.message }}</strong>
                      @if (emailTestResult.errorDetails) {
                        <div>{{ emailTestResult.errorDetails }}</div>
                      }
                    </div>
                  }

                  <button mat-stroked-button color="accent" type="button" (click)="testEmailConnection()" [disabled]="emailLoading">
                    <mat-icon>send</mat-icon>
                    Send Test Email
                  </button>
                </div>

                <div class="action-buttons" style="margin-top: 20px;">
                  <button mat-raised-button color="primary" type="button" (click)="saveEmailSettings()" [disabled]="emailLoading">
                    <mat-icon>save</mat-icon>
                    Save Email Settings
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Reporting Tab (after Email) -->
            @if (hasReportingTab()) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>assessment</mat-icon>
                  <span class="tab-label">Reporting</span>
                </ng-template>
                <div class="tab-content">
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

                  <!-- Settings grouped by category in 2 columns -->
                  @for (group of getGroupedSettingsForTab('Reporting'); track group.category) {
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

    .tab-content { padding: 24px; min-height: 300px; }

    .tab-label { margin-left: 4px; }

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

    /* Form grid for Email settings - matches Sonar */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .form-grid mat-form-field {
      width: 100%;
    }

    /* Settings section for Email settings - matches Sonar */
    .settings-section {
      margin-top: 24px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .settings-section h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 500;
    }

    /* Radio/Toggle field section - matches Sonar */
    .radio-field-section {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .radio-hint {
      margin-top: 8px;
      margin-bottom: 0;
      font-size: 12px;
      color: #666;
    }

    /* Action buttons - matches Sonar */
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .settings-grid {
        grid-template-columns: 1fr;
      }
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

    .error-message {
      padding: 10px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 4px;
      margin: 10px 0;
    }

    .success-message {
      padding: 10px;
      background: #d4edda;
      color: #155724;
      border-radius: 4px;
      margin: 10px 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 20px;
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
  availableRoles: { id: string; name: string }[] = [];
  selectedReportRoles: string[] = [];

  // Email Settings
  emailSettings: EmailSettings = {
    emailProtocol: EmailProtocol.SMTP,
    senderEmail: '',
    senderName: 'Sonarworks Workflow',
    emailEnabled: false,
    smtpPort: 587,
    smtpSecurity: SmtpSecurity.TLS,
    smtpAuthRequired: true
  };
  emailProtocols = Object.values(EmailProtocol);
  smtpSecurityOptions = Object.values(SmtpSecurity);
  emailTestEmail = '';
  emailTestResult: EmailTestResult | null = null;
  emailLoading = false;
  emailErrorMessage = '';
  emailSuccessMessage = '';
  showEmailPassword = false;

  private apiUrl = '/api';

  constructor(
    private settingService: SettingService,
    private themeService: ThemeService,
    private importExportService: ImportExportService,
    private emailSettingsService: EmailSettingsService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadRoles();
    this.loadEmailSettings();
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
          // Filter out Mail Settings tab - email is now managed via Email Settings
          this.tabs = Object.keys(res.data).filter(tab => tab !== 'Mail Settings');
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

  getTabsBeforeReporting(): string[] {
    return this.tabs.filter(tab => tab !== 'Reporting');
  }

  hasReportingTab(): boolean {
    return this.tabs.includes('Reporting');
  }

  getTabIcon(tab: string): string {
    const iconMap: Record<string, string> = {
      'General': 'settings',
      'Appearance': 'palette',
      'Theme': 'color_lens',
      'Security': 'security',
      'Authentication': 'lock',
      'Notifications': 'notifications',
      'System': 'computer',
      'Database': 'storage',
      'Backup': 'backup',
      'Logging': 'description',
      'Performance': 'speed',
      'Integration': 'integration_instructions',
      'API': 'api',
      'Users': 'people',
      'Permissions': 'admin_panel_settings',
      'Workflow': 'account_tree',
      'Approval': 'approval',
      'Financial': 'account_balance',
      'Audit': 'history',
      'Branding': 'branding_watermark',
      'Email': 'email',
      'Mail Settings': 'mail',
      'Reporting': 'assessment'
    };
    return iconMap[tab] || 'tune';
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

  // Email Settings Methods
  loadEmailSettings() {
    this.emailLoading = true;
    this.emailErrorMessage = '';
    this.emailSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.emailSettings = settings;
        this.emailLoading = false;
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailErrorMessage = err.error?.message || 'Failed to load email settings';
      }
    });
  }

  saveEmailSettings() {
    this.emailLoading = true;
    this.emailErrorMessage = '';
    this.emailSuccessMessage = '';
    this.emailSettingsService.saveSettings(this.emailSettings).subscribe({
      next: (settings) => {
        this.emailSettings = settings;
        this.emailLoading = false;
        this.emailSuccessMessage = 'Email settings saved successfully';
        this.snackBar.open('Email settings saved successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailErrorMessage = err.error?.message || 'Failed to save email settings';
        this.snackBar.open('Failed to save email settings', 'Close', { duration: 3000 });
      }
    });
  }

  testEmailConnection() {
    this.emailLoading = true;
    this.emailTestResult = null;
    const recipient = this.emailTestEmail || this.emailSettings.senderEmail;
    this.emailSettingsService.testConnection(recipient).subscribe({
      next: (result) => {
        this.emailTestResult = result;
        this.emailLoading = false;
        if (result.success) {
          this.snackBar.open(result.message, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(result.message, 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailTestResult = {
          success: false,
          message: err.error?.message || 'Failed to test email connection',
          errorDetails: err.message
        };
        this.snackBar.open('Failed to test email connection', 'Close', { duration: 5000 });
      }
    });
  }

  getProtocolLabel(protocol: EmailProtocol): string {
    const labels: Record<string, string> = {
      'SMTP': 'SMTP (Generic)',
      'SMTP_GMAIL': 'Gmail SMTP',
      'SMTP_OUTLOOK': 'Outlook.com SMTP',
      'SMTP_OFFICE365': 'Office 365 SMTP',
      'SMTP_YAHOO': 'Yahoo SMTP',
      'SMTP_EXCHANGE': 'Exchange Server SMTP',
      'MICROSOFT_GRAPH': 'Microsoft Graph API',
      'GMAIL_API': 'Gmail API',
      'EXCHANGE_EWS': 'Exchange EWS',
      'SENDGRID': 'SendGrid',
      'MAILGUN': 'Mailgun',
      'AWS_SES': 'Amazon SES'
    };
    return labels[protocol] || protocol;
  }

  isSmtpProtocol(): boolean {
    const p = this.emailSettings.emailProtocol;
    return p === EmailProtocol.SMTP || p === EmailProtocol.SMTP_GMAIL ||
           p === EmailProtocol.SMTP_OUTLOOK || p === EmailProtocol.SMTP_OFFICE365 ||
           p === EmailProtocol.SMTP_YAHOO || p === EmailProtocol.SMTP_EXCHANGE;
  }

  isMicrosoftProtocol(): boolean {
    return this.emailSettings.emailProtocol === EmailProtocol.MICROSOFT_GRAPH;
  }

  isGmailApiProtocol(): boolean {
    return this.emailSettings.emailProtocol === EmailProtocol.GMAIL_API;
  }

  isExchangeProtocol(): boolean {
    return this.emailSettings.emailProtocol === EmailProtocol.EXCHANGE_EWS;
  }

  isApiBasedProtocol(): boolean {
    const p = this.emailSettings.emailProtocol;
    return p === EmailProtocol.SENDGRID || p === EmailProtocol.MAILGUN || p === EmailProtocol.AWS_SES;
  }
}
