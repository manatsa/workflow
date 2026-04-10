import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProjectSettingsService, ProjectSettingsDTO } from '../services/project.service';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow } from '@core/models/workflow.model';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatExpansionModule, MatSnackBarModule,
    MatSlideToggleModule, MatProgressBarModule, MatDividerModule,
    MatTooltipModule],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <button mat-icon-button matTooltip="Go Back" routerLink="/projects">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Project Settings</h2>
        <span class="spacer"></span>
        <button mat-raised-button matTooltip="Initialize Defaults" color="primary" (click)="initializeDefaults()">
          <mat-icon>refresh</mat-icon> Initialize Defaults
        </button>
      </div>

      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      @for (group of settingGroups; track group) {
        <mat-expansion-panel [expanded]="true" class="settings-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>settings</mat-icon>
              <span>{{ group | titlecase }}</span>
            </mat-panel-title>
            <mat-panel-description>
              {{ getGroupSettings(group).length }} settings
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="settings-list">
            @for (setting of getGroupSettings(group); track setting.id) {
              <div class="setting-row">
                <div class="setting-info">
                  <span class="setting-key">{{ setting.settingKey }}</span>
                  <span class="setting-desc">{{ setting.description }}</span>
                </div>
                <div class="setting-value">
                  @if (setting.settingType === 'BOOLEAN') {
                    <mat-slide-toggle
                      [checked]="setting.settingValue === 'true'"
                      (change)="updateSettingValue(setting, $event.checked ? 'true' : 'false')">
                    </mat-slide-toggle>
                  } @else if (setting.settingType === 'SELECT') {
                    <mat-form-field appearance="outline" class="setting-input">
                      <mat-select [(ngModel)]="setting.settingValue" (selectionChange)="saveSetting(setting)">
                        @for (opt of getSelectOptions(setting); track opt) {
                          <mat-option [value]="opt">{{ opt }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  } @else if (setting.settingType === 'UUID') {
                    <mat-form-field appearance="outline" class="setting-input">
                      <mat-select [(ngModel)]="setting.settingValue" (selectionChange)="saveSetting(setting)">
                        <mat-option value="">None</mat-option>
                        @for (wf of workflows; track wf.id) {
                          <mat-option [value]="wf.id">{{ wf.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  } @else if (setting.settingType === 'NUMBER') {
                    <mat-form-field appearance="outline" class="setting-input">
                      <input matInput type="number" [(ngModel)]="setting.settingValue"
                             (blur)="saveSetting(setting)">
                    </mat-form-field>
                  } @else {
                    <mat-form-field appearance="outline" class="setting-input">
                      <input matInput [(ngModel)]="setting.settingValue"
                             (blur)="saveSetting(setting)">
                    </mat-form-field>
                  }
                </div>
              </div>
              <mat-divider></mat-divider>
            }
          </div>
        </mat-expansion-panel>
      }

      <div *ngIf="!loading && settings.length === 0" class="empty-state">
        <mat-icon>settings</mat-icon>
        <p>No settings found. Click "Initialize Defaults" to create default settings.</p>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; }
    .spacer { flex: 1; }
    .settings-panel { margin-bottom: 12px; }
    .settings-panel mat-panel-title { display: flex; align-items: center; gap: 8px; }
    .settings-list { display: flex; flex-direction: column; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; gap: 16px; }
    .setting-info { display: flex; flex-direction: column; flex: 1; }
    .setting-key { font-weight: 500; font-size: 14px; }
    .setting-desc { font-size: 12px; color: #666; }
    .setting-value { min-width: 250px; display: flex; justify-content: flex-end; }
    .setting-input { width: 250px; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  settings: ProjectSettingsDTO[] = [];
  settingGroups: string[] = [];
  loading = true;
  workflows: Workflow[] = [];

  constructor(
    private settingsService: ProjectSettingsService,
    private snackBar: MatSnackBar,
    private workflowService: WorkflowService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.workflowService.getWorkflows().subscribe({
      next: (res) => {
        if (res.success) {
          this.workflows = res.data || [];
        }
      },
      error: () => console.error('Failed to load workflows')
    });
  }

  loadSettings() {
    this.loading = true;
    this.settingsService.getAllSettings().subscribe({
      next: (res) => {
        if (res.success) {
          this.settings = res.data;
          this.settingGroups = [...new Set(this.settings.map(s => s.settingGroup || 'general'))];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load settings', 'Close', { duration: 3000 });
      }
    });
  }

  getSelectOptions(setting: ProjectSettingsDTO): string[] {
    if (!setting.options) return [];
    return setting.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
  }

  getGroupSettings(group: string): ProjectSettingsDTO[] {
    return this.settings.filter(s => (s.settingGroup || 'general') === group);
  }

  updateSettingValue(setting: ProjectSettingsDTO, value: string) {
    setting.settingValue = value;
    this.saveSetting(setting);
  }

  saveSetting(setting: ProjectSettingsDTO) {
    this.settingsService.saveSetting(setting).subscribe({
      next: () => this.snackBar.open('Setting saved', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Failed to save setting', 'Close', { duration: 3000 })
    });
  }

  initializeDefaults() {
    this.settingsService.initializeDefaults().subscribe({
      next: () => {
        this.snackBar.open('Defaults initialized', 'Close', { duration: 3000 });
        this.loadSettings();
      },
      error: () => this.snackBar.open('Failed to initialize defaults', 'Close', { duration: 3000 })
    });
  }
}
