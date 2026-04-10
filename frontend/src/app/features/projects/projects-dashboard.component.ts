import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import {
  ProjectService,
  ProjectImportService,
  ProjectCategoryService,
  ProjectCategoryDTO,
  ProjectSummaryDTO,
  ProjectDashboardDTO,
  CreateProjectRequest
} from './services/project.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-projects-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule],
  template: `
    <!-- ==================== MAIN CONTAINER ==================== -->
    <div class="projects-dashboard-container">
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">folder_special</mat-icon>
          <div>
            <h1>Projects</h1>
            <p class="subtitle">Manage and track all your projects</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-stroked-button [matMenuTriggerFor]="exportMenu" matTooltip="Export Dashboard">
            <mat-icon>download</mat-icon>
            Dashboard
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportDashboard('excel')">
              <mat-icon>table_chart</mat-icon>
              <span>Export as Excel</span>
            </button>
            <button mat-menu-item (click)="exportDashboard('pdf')">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>Export as PDF</span>
            </button>
          </mat-menu>
          <button mat-raised-button matTooltip="New Project" color="primary" (click)="openNewProjectDialog()">
            <mat-icon>add</mat-icon>
            New Project
          </button>
        </div>
      </div>

      <mat-tab-group [(selectedIndex)]="selectedTabIndex" animationDuration="200ms">
        <!-- ==================== TAB 1: DASHBOARD ==================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">dashboard</mat-icon>
            Dashboard
          </ng-template>

          <div class="tab-content">
            <!-- Stats Cards -->
            <div class="stats-grid">
              <mat-card class="stat-card total">
                <mat-card-content>
                  <div class="stat-icon-wrap">
                    <mat-icon>folder</mat-icon>
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ dashboard?.totalProjects || 0 }}</span>
                    <span class="stat-label">Total Projects</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card active">
                <mat-card-content>
                  <div class="stat-icon-wrap">
                    <mat-icon>play_circle</mat-icon>
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ dashboard?.activeProjects || 0 }}</span>
                    <span class="stat-label">Active Projects</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card completed">
                <mat-card-content>
                  <div class="stat-icon-wrap">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ dashboard?.completedProjects || 0 }}</span>
                    <span class="stat-label">Completed Projects</span>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="stat-card overdue">
                <mat-card-content>
                  <div class="stat-icon-wrap">
                    <mat-icon>warning</mat-icon>
                  </div>
                  <div class="stat-info">
                    <span class="stat-value">{{ dashboard?.overdueProjects || 0 }}</span>
                    <span class="stat-label">Overdue Projects</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Budget Overview -->
            <div class="dashboard-row">
              <mat-card class="budget-card">
                <mat-card-header>
                  <mat-card-title>Budget Overview</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="budget-stats">
                    <div class="budget-item">
                      <span class="budget-label">Total Budget</span>
                      <span class="budget-value">{{ (dashboard?.totalBudget || 0) | currency }}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Actual Cost</span>
                      <span class="budget-value spent">{{ (dashboard?.totalActualCost || 0) | currency }}</span>
                    </div>
                    <div class="budget-item">
                      <span class="budget-label">Avg. Completion</span>
                      <span class="budget-value">{{ (dashboard?.averageCompletion || 0) | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                  <mat-progress-bar
                    mode="determinate"
                    [value]="dashboard?.averageCompletion || 0"
                    class="overall-progress">
                  </mat-progress-bar>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Distribution Charts (Simple Bars) -->
            <div class="charts-row">
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Projects by Status</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="bar-chart" *ngIf="dashboard?.projectsByStatus">
                    <div class="bar-row" *ngFor="let entry of getObjectEntries(dashboard!.projectsByStatus)">
                      <span class="bar-label">{{ entry[0] }}</span>
                      <div class="bar-track">
                        <div class="bar-fill"
                          [style.width.%]="getBarWidth(entry[1], dashboard!.totalProjects)"
                          [style.backgroundColor]="getStatusColor(entry[0])">
                        </div>
                      </div>
                      <span class="bar-value">{{ entry[1] }}</span>
                    </div>
                  </div>
                  <div *ngIf="!dashboard?.projectsByStatus" class="empty-chart">No data available</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Projects by Priority</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="bar-chart" *ngIf="dashboard?.projectsByPriority">
                    <div class="bar-row" *ngFor="let entry of getObjectEntries(dashboard!.projectsByPriority)">
                      <span class="bar-label">{{ entry[0] }}</span>
                      <div class="bar-track">
                        <div class="bar-fill"
                          [style.width.%]="getBarWidth(entry[1], dashboard!.totalProjects)"
                          [style.backgroundColor]="getPriorityColor(entry[0])">
                        </div>
                      </div>
                      <span class="bar-value">{{ entry[1] }}</span>
                    </div>
                  </div>
                  <div *ngIf="!dashboard?.projectsByPriority" class="empty-chart">No data available</div>
                </mat-card-content>
              </mat-card>

              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Projects by Stage</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="bar-chart" *ngIf="dashboard?.projectsByStage">
                    <div class="bar-row" *ngFor="let entry of getObjectEntries(dashboard!.projectsByStage)">
                      <span class="bar-label">{{ entry[0] }}</span>
                      <div class="bar-track">
                        <div class="bar-fill"
                          [style.width.%]="getBarWidth(entry[1], dashboard!.totalProjects)"
                          [style.backgroundColor]="'#7c4dff'">
                        </div>
                      </div>
                      <span class="bar-value">{{ entry[1] }}</span>
                    </div>
                  </div>
                  <div *ngIf="!dashboard?.projectsByStage" class="empty-chart">No data available</div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Recent Projects Table -->
            <mat-card class="recent-projects-card">
              <mat-card-header>
                <mat-card-title>Recent Projects</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-responsive">
                  <table mat-table [dataSource]="dashboard?.recentProjects || []" class="full-width-table">
                    <ng-container matColumnDef="code">
                      <th mat-header-cell *matHeaderCellDef>Code</th>
                      <td mat-cell *matCellDef="let row">
                        <a [routerLink]="['/projects', row.id]" class="project-link">{{ row.code }}</a>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-chip" [style.backgroundColor]="getStatusColor(row.status)">
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="priority">
                      <th mat-header-cell *matHeaderCellDef>Priority</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="priority-chip" [style.backgroundColor]="getPriorityColor(row.priority)">
                          {{ row.priority }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="manager">
                      <th mat-header-cell *matHeaderCellDef>Manager</th>
                      <td mat-cell *matCellDef="let row">{{ row.managerName || '-' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="completion">
                      <th mat-header-cell *matHeaderCellDef>Completion</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="completion-cell">
                          <mat-progress-bar mode="determinate" [value]="row.completionPercentage"></mat-progress-bar>
                          <span class="completion-text">{{ row.completionPercentage || 0 }}%</span>
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="recentProjectColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: recentProjectColumns;"></tr>
                  </table>
                </div>
                <div *ngIf="!dashboard?.recentProjects?.length" class="empty-state">
                  <mat-icon>folder_off</mat-icon>
                  <p>No recent projects found</p>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Recent Activities -->
            <mat-card class="activities-card" *ngIf="dashboard?.recentActivities?.length">
              <mat-card-header>
                <mat-card-title>Recent Activities</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="activity-list">
                  <div class="activity-item" *ngFor="let activity of dashboard!.recentActivities; let i = index"
                    [class.last]="i === dashboard!.recentActivities.length - 1">
                    <div class="activity-icon">
                      <mat-icon>{{ getActivityIcon(activity.type) }}</mat-icon>
                    </div>
                    <div class="activity-content">
                      <span class="activity-user">{{ activity.userName }}</span>
                      <span class="activity-desc">{{ activity.description }}</span>
                      <span class="activity-time">{{ activity.timestamp | date:'short' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ==================== TAB 2: ALL PROJECTS ==================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">list</mat-icon>
            All Projects
          </ng-template>

          <div class="tab-content">
            <!-- Filters Row -->
            <div class="filters-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search projects</mat-label>
                <input matInput [(ngModel)]="searchQuery" (keyup.enter)="applySearch()" placeholder="Search by name or code...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="status-filter">
                <mat-label>Filter by Status</mat-label>
                <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyStatusFilter()">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="DRAFT">Draft</mat-option>
                  <mat-option value="ACTIVE">Active</mat-option>
                  <mat-option value="COMPLETED">Completed</mat-option>
                  <mat-option value="ON_HOLD">On Hold</mat-option>
                  <mat-option value="CANCELLED">Cancelled</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-stroked-button matTooltip="Clear" (click)="clearFilters()" class="clear-btn">
                <mat-icon>clear</mat-icon>
                Clear
              </button>

              <span class="spacer"></span>

              <button mat-raised-button matTooltip="New Project" color="primary" (click)="openNewProjectDialog()">
                <mat-icon>add</mat-icon>
                New Project
              </button>
            </div>

            <!-- Projects Table -->
            <mat-card class="projects-table-card">
              <mat-card-content>
                <div class="table-responsive">
                  <table mat-table [dataSource]="filteredProjects" class="full-width-table">
                    <ng-container matColumnDef="code">
                      <th mat-header-cell *matHeaderCellDef>Code</th>
                      <td mat-cell *matCellDef="let row">
                        <a [routerLink]="['/projects', row.id]" class="project-link">{{ row.code }}</a>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="project-name">{{ row.name }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-chip" [style.backgroundColor]="getStatusColor(row.status)">
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="priority">
                      <th mat-header-cell *matHeaderCellDef>Priority</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="priority-chip" [style.backgroundColor]="getPriorityColor(row.priority)">
                          {{ row.priority }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="manager">
                      <th mat-header-cell *matHeaderCellDef>Manager</th>
                      <td mat-cell *matCellDef="let row">{{ row.managerName || '-' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="completion">
                      <th mat-header-cell *matHeaderCellDef>Completion</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="completion-cell">
                          <mat-progress-bar mode="determinate" [value]="row.completionPercentage"
                            [color]="row.completionPercentage === 100 ? 'accent' : 'primary'">
                          </mat-progress-bar>
                          <span class="completion-text">{{ row.completionPercentage || 0 }}%</span>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="startDate">
                      <th mat-header-cell *matHeaderCellDef>Start Date</th>
                      <td mat-cell *matCellDef="let row">{{ row.startDate | date:'mediumDate' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="endDate">
                      <th mat-header-cell *matHeaderCellDef>End Date</th>
                      <td mat-cell *matCellDef="let row">{{ row.endDate | date:'mediumDate' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button matTooltip="More Options" [matMenuTriggerFor]="actionMenu" aria-label="Actions">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #actionMenu="matMenu">
                          <button mat-menu-item (click)="viewProject(row)">
                            <mat-icon>visibility</mat-icon>
                            <span>View</span>
                          </button>
                          <button mat-menu-item (click)="editProject(row)">
                            <mat-icon>edit</mat-icon>
                            <span>Edit</span>
                          </button>
                          <button mat-menu-item (click)="deleteProject(row)" class="delete-action">
                            <mat-icon color="warn">delete</mat-icon>
                            <span>Delete</span>
                          </button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="allProjectColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: allProjectColumns;"
                      class="project-row"></tr>
                  </table>
                </div>

                <div *ngIf="!filteredProjects.length && !loading" class="empty-state">
                  <mat-icon>folder_off</mat-icon>
                  <p>No projects found</p>
                  <button mat-stroked-button matTooltip="Create your first project" color="primary" (click)="openNewProjectDialog()">
                    Create your first project
                  </button>
                </div>

                <div *ngIf="loading" class="loading-state">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>Loading projects...</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ==================== TAB 3: IMPORT ==================== -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">cloud_upload</mat-icon>
            Import
          </ng-template>

          <div class="tab-content">
            <!-- Download Templates -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Download Templates</mat-card-title>
                <mat-card-subtitle>Download Excel templates to prepare your import data</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="template-buttons">
                  <button mat-raised-button matTooltip="Projects Template" color="primary" (click)="downloadProjectTemplate()">
                    <mat-icon>download</mat-icon>
                    Projects
                  </button>
                  <button mat-raised-button matTooltip="Tasks Template" color="accent" (click)="downloadTaskTemplate()">
                    <mat-icon>download</mat-icon>
                    Tasks
                  </button>
                  <button mat-raised-button matTooltip="Team Members Template" (click)="downloadTemplate('team-members')">
                    <mat-icon>download</mat-icon>
                    Team Members
                  </button>
                  <button mat-raised-button matTooltip="Budget Lines Template" (click)="downloadTemplate('budget-lines')">
                    <mat-icon>download</mat-icon>
                    Budget Lines
                  </button>
                  <button mat-raised-button matTooltip="Risks Template" (click)="downloadTemplate('risks')">
                    <mat-icon>download</mat-icon>
                    Risks
                  </button>
                  <button mat-raised-button matTooltip="Issues Template" (click)="downloadTemplate('issues')">
                    <mat-icon>download</mat-icon>
                    Issues
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Import Projects -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Projects</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import projects</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone"
                  [class.drag-over]="projectDragOver"
                  (dragover)="onDragOver($event, 'project')"
                  (dragleave)="onDragLeave('project')"
                  (drop)="onDrop($event, 'project')">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <p>Drag and drop your projects file here, or</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="projectFileInput.click()">
                    Browse Files
                  </button>
                  <input #projectFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onProjectFileSelected($event)">
                  <p class="upload-hint">Supports .xlsx, .xls, .csv files</p>
                </div>
                <div *ngIf="projectFileName" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ projectFileName }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="clearProjectFile()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="{{ importingProjects ? 'Importing...' : 'Import Projects' }}" color="primary" (click)="importProjects()"
                  [disabled]="!projectFile || importingProjects" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ importingProjects ? 'Importing...' : 'Import Projects' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Tasks -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Tasks</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import tasks into a project</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone"
                  [class.drag-over]="taskDragOver"
                  (dragover)="onDragOver($event, 'task')"
                  (dragleave)="onDragLeave('task')"
                  (drop)="onDrop($event, 'task')">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <p>Drag and drop your tasks file here, or</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="taskFileInput.click()">
                    Browse Files
                  </button>
                  <input #taskFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onTaskFileSelected($event)">
                  <p class="upload-hint">Supports .xlsx, .xls, .csv files</p>
                </div>
                <div *ngIf="taskFileName" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ taskFileName }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="clearTaskFile()">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="{{ importingTasks ? 'Importing...' : 'Import Tasks' }}" color="accent" (click)="importTasks()"
                  [disabled]="!taskFile || importingTasks" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ importingTasks ? 'Importing...' : 'Import Tasks' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Team Members -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Team Members</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import team members</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone">
                  <mat-icon class="upload-icon">group_add</mat-icon>
                  <p>Select your team members file</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="teamFileInput.click()">
                    Browse Files
                  </button>
                  <input #teamFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onGenericFileSelected($event, 'team')">
                </div>
                <div *ngIf="genericFiles['team']" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ genericFiles['team'].name }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="genericFiles['team'] = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="Import Team Members" color="primary" (click)="importGeneric('team')"
                  [disabled]="!genericFiles['team'] || genericImporting['team']" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ genericImporting['team'] ? 'Importing...' : 'Import Team Members' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Budget Lines -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Budget Lines</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import budget lines</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone">
                  <mat-icon class="upload-icon">account_balance</mat-icon>
                  <p>Select your budget lines file</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="budgetFileInput.click()">
                    Browse Files
                  </button>
                  <input #budgetFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onGenericFileSelected($event, 'budget')">
                </div>
                <div *ngIf="genericFiles['budget']" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ genericFiles['budget'].name }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="genericFiles['budget'] = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="Import Budget Lines" color="primary" (click)="importGeneric('budget')"
                  [disabled]="!genericFiles['budget'] || genericImporting['budget']" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ genericImporting['budget'] ? 'Importing...' : 'Import Budget Lines' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Risks -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Risks</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import project risks</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone">
                  <mat-icon class="upload-icon">warning</mat-icon>
                  <p>Select your risks file</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="riskFileInput.click()">
                    Browse Files
                  </button>
                  <input #riskFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onGenericFileSelected($event, 'risk')">
                </div>
                <div *ngIf="genericFiles['risk']" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ genericFiles['risk'].name }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="genericFiles['risk'] = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="Import Risks" color="primary" (click)="importGeneric('risk')"
                  [disabled]="!genericFiles['risk'] || genericImporting['risk']" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ genericImporting['risk'] ? 'Importing...' : 'Import Risks' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Issues -->
            <mat-card class="import-card">
              <mat-card-header>
                <mat-card-title>Import Issues</mat-card-title>
                <mat-card-subtitle>Upload an Excel file to bulk-import project issues</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="upload-zone">
                  <mat-icon class="upload-icon">bug_report</mat-icon>
                  <p>Select your issues file</p>
                  <button mat-stroked-button matTooltip="Browse Files" color="primary" (click)="issueFileInput.click()">
                    Browse Files
                  </button>
                  <input #issueFileInput type="file" hidden accept=".xlsx,.xls,.csv"
                    (change)="onGenericFileSelected($event, 'issue')">
                </div>
                <div *ngIf="genericFiles['issue']" class="selected-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ genericFiles['issue'].name }}</span>
                  <button mat-icon-button matTooltip="Close" (click)="genericFiles['issue'] = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-raised-button matTooltip="Import Issues" color="primary" (click)="importGeneric('issue')"
                  [disabled]="!genericFiles['issue'] || genericImporting['issue']" class="import-btn">
                  <mat-icon>upload</mat-icon>
                  {{ genericImporting['issue'] ? 'Importing...' : 'Import Issues' }}
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Import Results -->
            <mat-card class="import-card results-card" *ngIf="importResults">
              <mat-card-header>
                <mat-card-title>Import Results</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="import-results">
                  <div class="result-row success" *ngIf="importResults.successCount !== undefined">
                    <mat-icon>check_circle</mat-icon>
                    <span>{{ importResults.successCount }} records imported successfully</span>
                  </div>
                  <div class="result-row error" *ngIf="importResults.errorCount !== undefined && importResults.errorCount > 0">
                    <mat-icon>error</mat-icon>
                    <span>{{ importResults.errorCount }} records failed</span>
                  </div>
                  <div class="result-row info" *ngIf="importResults.totalCount !== undefined">
                    <mat-icon>info</mat-icon>
                    <span>{{ importResults.totalCount }} total records processed</span>
                  </div>
                  <div class="error-details" *ngIf="importResults.errors?.length">
                    <h4>Error Details:</h4>
                    <div class="error-item" *ngFor="let err of importResults.errors">
                      <span class="error-row">Row {{ err.row }}:</span>
                      <span class="error-msg">{{ err.message }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- ==================== NEW PROJECT DIALOG (INLINE) ==================== -->
      <div class="dialog-overlay" *ngIf="showNewProjectDialog" (click)="closeNewProjectDialog()">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Create New Project</h2>
            <button mat-icon-button matTooltip="Close" (click)="closeNewProjectDialog()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="dialog-body">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Category</mat-label>
                <mat-select [(ngModel)]="newProject.category" (selectionChange)="onCategoryChange($event.value)">
                  @for (cat of projectCategories; track cat.id) {
                    <mat-option [value]="cat.code">{{ cat.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Project Code</mat-label>
                <input matInput [(ngModel)]="newProject.code" [readonly]="true" placeholder="Auto-generated">
                <mat-hint *ngIf="generatingCode">Generating...</mat-hint>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Project Name</mat-label>
              <input matInput [(ngModel)]="newProject.name" placeholder="Enter project name" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="newProject.description" rows="3"
                placeholder="Describe the project..."></textarea>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Priority</mat-label>
                <mat-select [(ngModel)]="newProject.priority">
                  <mat-option value="LOW">Low</mat-option>
                  <mat-option value="MEDIUM">Medium</mat-option>
                  <mat-option value="HIGH">High</mat-option>
                  <mat-option value="CRITICAL">Critical</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="newProject.startDate"
                  placeholder="Select start date">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="newProject.endDate"
                  placeholder="Select end date">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Estimated Budget</mat-label>
                <input matInput type="number" [(ngModel)]="newProject.estimatedBudget" placeholder="0.00">
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field-half">
                <mat-label>Manager</mat-label>
                <mat-select [(ngModel)]="newProject.managerId">
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{ user.firstName }} {{ user.lastName }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="dialog-actions">
            <button mat-stroked-button matTooltip="Cancel" (click)="closeNewProjectDialog()">Cancel</button>
            <button mat-raised-button color="primary" (click)="createProject()"
              [disabled]="!newProject.code || !newProject.name || !newProject.category || creatingProject || generatingCode">
              {{ creatingProject ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== CONTAINER & HEADER ==================== */
    .projects-dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1976d2;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: #212121;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #757575;
      font-size: 14px;
    }

    /* ==================== TABS ==================== */
    .tab-icon {
      margin-right: 8px;
    }

    .tab-content {
      padding: 24px 0;
    }

    /* ==================== STATS GRID ==================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      border-radius: 12px !important;
      border-left: 4px solid transparent;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
    }

    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon-wrap mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .stat-card.total { border-left-color: #1976d2; }
    .stat-card.total .stat-icon-wrap { background: #1976d2; }
    .stat-card.active { border-left-color: #2196f3; }
    .stat-card.active .stat-icon-wrap { background: #2196f3; }
    .stat-card.completed { border-left-color: #4caf50; }
    .stat-card.completed .stat-icon-wrap { background: #4caf50; }
    .stat-card.overdue { border-left-color: #f44336; }
    .stat-card.overdue .stat-icon-wrap { background: #f44336; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #212121;
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: #757575;
      margin-top: 4px;
    }

    /* ==================== BUDGET CARD ==================== */
    .dashboard-row {
      margin-bottom: 24px;
    }

    .budget-card {
      border-radius: 12px !important;
    }

    .budget-stats {
      display: flex;
      gap: 40px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .budget-item {
      display: flex;
      flex-direction: column;
    }

    .budget-label {
      font-size: 13px;
      color: #757575;
    }

    .budget-value {
      font-size: 22px;
      font-weight: 600;
      color: #212121;
    }

    .budget-value.spent {
      color: #f57c00;
    }

    .overall-progress {
      height: 8px !important;
      border-radius: 4px;
    }

    /* ==================== CHARTS ==================== */
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .chart-card {
      border-radius: 12px !important;
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bar-label {
      width: 100px;
      font-size: 12px;
      font-weight: 500;
      color: #424242;
      text-transform: capitalize;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-track {
      flex: 1;
      height: 20px;
      background: #f5f5f5;
      border-radius: 10px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.6s ease;
      min-width: 4px;
    }

    .bar-value {
      width: 32px;
      text-align: right;
      font-size: 13px;
      font-weight: 600;
      color: #424242;
    }

    .empty-chart {
      padding: 24px;
      text-align: center;
      color: #9e9e9e;
    }

    /* ==================== TABLE STYLES ==================== */
    .recent-projects-card,
    .projects-table-card,
    .activities-card {
      border-radius: 12px !important;
      margin-bottom: 24px;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .full-width-table {
      width: 100%;
    }

    .project-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .project-link:hover {
      text-decoration: underline;
    }

    .project-name {
      font-weight: 500;
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
    }

    .project-row:hover {
      background: #f5f5f5;
    }

    /* ==================== CHIPS ==================== */
    .status-chip,
    .priority-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    /* ==================== COMPLETION ==================== */
    .completion-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }

    .completion-cell mat-progress-bar {
      flex: 1;
      height: 6px !important;
      border-radius: 3px;
    }

    .completion-text {
      font-size: 12px;
      font-weight: 500;
      color: #616161;
      white-space: nowrap;
    }

    /* ==================== FILTERS ==================== */
    .filters-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-field {
      width: 300px;
    }

    .status-filter {
      width: 200px;
    }

    .clear-btn {
      height: 40px;
    }

    .spacer {
      flex: 1;
    }

    /* ==================== EMPTY & LOADING ==================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      color: #9e9e9e;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 16px;
      margin-bottom: 16px;
    }

    .loading-state {
      padding: 32px;
      text-align: center;
    }

    .loading-state p {
      margin-top: 12px;
      color: #757575;
    }

    /* ==================== ACTIVITIES ==================== */
    .activity-list {
      display: flex;
      flex-direction: column;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-item.last {
      border-bottom: none;
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .activity-user {
      font-weight: 500;
      font-size: 13px;
      color: #212121;
    }

    .activity-desc {
      font-size: 13px;
      color: #616161;
    }

    .activity-time {
      font-size: 11px;
      color: #9e9e9e;
    }

    /* ==================== IMPORT ==================== */
    .import-card {
      border-radius: 12px !important;
      margin-bottom: 20px;
    }

    .template-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .upload-zone {
      border: 2px dashed #bdbdbd;
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fafafa;
      margin-bottom: 16px;
    }

    .upload-zone:hover,
    .upload-zone.drag-over {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bdbdbd;
      margin-bottom: 8px;
    }

    .upload-zone p {
      color: #757575;
      margin: 8px 0;
    }

    .upload-hint {
      font-size: 12px;
      color: #9e9e9e !important;
    }

    .selected-file {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .selected-file mat-icon {
      color: #4caf50;
    }

    .selected-file span {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .import-btn {
      margin-top: 8px;
    }

    /* ==================== IMPORT RESULTS ==================== */
    .results-card {
      border: 1px solid #e0e0e0;
    }

    .import-results {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 500;
    }

    .result-row.success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .result-row.success mat-icon {
      color: #4caf50;
    }

    .result-row.error {
      background: #fbe9e7;
      color: #c62828;
    }

    .result-row.error mat-icon {
      color: #f44336;
    }

    .result-row.info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .result-row.info mat-icon {
      color: #2196f3;
    }

    .error-details {
      margin-top: 12px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;
    }

    .error-details h4 {
      margin: 0 0 12px;
      color: #e65100;
    }

    .error-item {
      display: flex;
      gap: 8px;
      padding: 4px 0;
      font-size: 13px;
    }

    .error-row {
      font-weight: 600;
      color: #bf360c;
      white-space: nowrap;
    }

    .error-msg {
      color: #616161;
    }

    /* ==================== DIALOG ==================== */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-panel {
      background: white;
      border-radius: 16px;
      width: 640px;
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-field-half {
      flex: 1;
    }

    .form-field-full {
      width: 100%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    /* ==================== DELETE ACTION ==================== */
    .delete-action {
      color: #f44336 !important;
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 768px) {
      .projects-dashboard-container {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-row {
        grid-template-columns: 1fr;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .status-filter {
        width: 100%;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .dialog-panel {
        width: 95vw;
        max-height: 90vh;
      }

      .budget-stats {
        gap: 20px;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectsDashboardComponent implements OnInit {
  // Tab state
  selectedTabIndex = 0;

  // Dashboard data
  dashboard: ProjectDashboardDTO | null = null;
  recentProjectColumns = ['code', 'name', 'status', 'priority', 'manager', 'completion'];

  // All projects
  allProjects: ProjectSummaryDTO[] = [];
  filteredProjects: ProjectSummaryDTO[] = [];
  allProjectColumns = ['code', 'name', 'status', 'priority', 'manager', 'completion', 'startDate', 'endDate', 'actions'];
  searchQuery = '';
  filterStatus = '';
  loading = false;

  // New project dialog
  showNewProjectDialog = false;
  creatingProject = false;
  generatingCode = false;
  newProject: CreateProjectRequest = this.getEmptyProject();

  // Users for manager dropdown
  users: any[] = [];

  // Project categories for dropdown
  projectCategories: ProjectCategoryDTO[] = [];

  // Import state
  projectFile: File | null = null;
  projectFileName = '';
  taskFile: File | null = null;
  taskFileName = '';
  projectDragOver = false;
  taskDragOver = false;
  importingProjects = false;
  importingTasks = false;
  importResults: any = null;
  genericFiles: Record<string, File | null> = {};
  genericImporting: Record<string, boolean> = {};

  // Status color map
  private statusColors: Record<string, string> = {
    'DRAFT': '#9e9e9e',
    'ACTIVE': '#2196f3',
    'COMPLETED': '#4caf50',
    'ON_HOLD': '#ff9800',
    'CANCELLED': '#f44336'
  };

  // Priority color map
  private priorityColors: Record<string, string> = {
    'LOW': '#009688',
    'MEDIUM': '#2196f3',
    'HIGH': '#ff9800',
    'CRITICAL': '#f44336'
  };

  constructor(
    private projectService: ProjectService,
    private importService: ProjectImportService,
    private categoryService: ProjectCategoryService,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAllProjects();
    this.loadUsers();
    this.loadProjectCategories();
  }

  loadProjectCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.projectCategories = res.data || [];
        }
      },
      error: () => console.error('Failed to load project categories')
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        this.users = res.data || [];
      },
      error: () => console.error('Failed to load users')
    });
  }

  // ==================== DATA LOADING ====================

  loadDashboard(): void {
    this.projectService.getDashboard().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dashboard = res.data;
        }
      },
      error: (err: any) => {
        console.error('Failed to load dashboard', err);
        this.showSnack('Failed to load dashboard data');
      }
    });
  }

  loadAllProjects(): void {
    this.loading = true;
    this.projectService.getAllProjects().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allProjects = res.data || [];
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load projects', err);
        this.showSnack('Failed to load projects');
        this.loading = false;
      }
    });
  }

  // ==================== FILTERS ====================

  applySearch(): void {
    this.applyFilters();
  }

  applyStatusFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allProjects];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q))
      );
    }

    if (this.filterStatus) {
      result = result.filter(p => p.status === this.filterStatus);
    }

    this.filteredProjects = result;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  // ==================== NEW PROJECT ====================

  onCategoryChange(categoryCode: string): void {
    if (!categoryCode) {
      this.newProject.code = '';
      return;
    }
    this.generatingCode = true;
    this.projectService.generateCode(categoryCode).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.newProject.code = res.data;
        }
        this.generatingCode = false;
      },
      error: () => {
        this.generatingCode = false;
        this.showSnack('Failed to generate project code');
      }
    });
  }

  openNewProjectDialog(): void {
    this.newProject = this.getEmptyProject();
    this.showNewProjectDialog = true;
  }

  closeNewProjectDialog(): void {
    this.showNewProjectDialog = false;
  }

  createProject(): void {
    if (!this.newProject.name) {
      this.showSnack('Project name is required');
      return;
    }
    if (!this.newProject.category) {
      this.showSnack('Project category is required');
      return;
    }

    this.creatingProject = true;

    const request: CreateProjectRequest = {
      ...this.newProject,
      startDate: this.newProject.startDate
        ? new Date(this.newProject.startDate).toISOString().split('T')[0]
        : undefined,
      endDate: this.newProject.endDate
        ? new Date(this.newProject.endDate).toISOString().split('T')[0]
        : undefined
    };

    this.projectService.createProject(request).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showSnack('Project created successfully');
          this.closeNewProjectDialog();
          this.loadAllProjects();
          this.loadDashboard();
        } else {
          this.showSnack(res.message || 'Failed to create project');
        }
        this.creatingProject = false;
      },
      error: (err: any) => {
        console.error('Failed to create project', err);
        this.showSnack(err?.error?.message || 'Failed to create project');
        this.creatingProject = false;
      }
    });
  }

  viewProject(project: ProjectSummaryDTO): void {
    this.router.navigate(['/projects', project.id]);
  }

  editProject(project: ProjectSummaryDTO): void {
    this.router.navigate(['/projects', project.id], { queryParams: { edit: true } });
  }

  deleteProject(project: ProjectSummaryDTO): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: 'Are you sure you want to delete this project?',
        itemName: project.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.projectService.deleteProject(project.id).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.showSnack('Project deleted successfully');
              this.loadAllProjects();
              this.loadDashboard();
            } else {
              this.showSnack(res.message || 'Failed to delete project');
            }
          },
          error: (err: any) => {
            console.error('Failed to delete project', err);
            this.showSnack(err?.error?.message || 'Failed to delete project');
          }
        });
      }
    });
  }

  // ==================== IMPORT ====================

  downloadProjectTemplate(): void {
    this.importService.downloadProjectTemplate().subscribe({
      next: (blob) => this.downloadBlob(blob, 'projects-template.xlsx'),
      error: () => this.showSnack('Failed to download template')
    });
  }

  downloadTaskTemplate(): void {
    this.importService.downloadTaskTemplate().subscribe({
      next: (blob) => this.downloadBlob(blob, 'tasks-template.xlsx'),
      error: () => this.showSnack('Failed to download template')
    });
  }

  onProjectFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.projectFile = input.files[0];
      this.projectFileName = this.projectFile.name;
    }
  }

  onTaskFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.taskFile = input.files[0];
      this.taskFileName = this.taskFile.name;
    }
  }

  clearProjectFile(): void {
    this.projectFile = null;
    this.projectFileName = '';
  }

  clearTaskFile(): void {
    this.taskFile = null;
    this.taskFileName = '';
  }

  onDragOver(event: DragEvent, type: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'project') {
      this.projectDragOver = true;
    } else {
      this.taskDragOver = true;
    }
  }

  onDragLeave(type: string): void {
    if (type === 'project') {
      this.projectDragOver = false;
    } else {
      this.taskDragOver = false;
    }
  }

  onDrop(event: DragEvent, type: string): void {
    event.preventDefault();
    event.stopPropagation();

    if (type === 'project') {
      this.projectDragOver = false;
      if (event.dataTransfer?.files?.length) {
        this.projectFile = event.dataTransfer.files[0];
        this.projectFileName = this.projectFile.name;
      }
    } else {
      this.taskDragOver = false;
      if (event.dataTransfer?.files?.length) {
        this.taskFile = event.dataTransfer.files[0];
        this.taskFileName = this.taskFile.name;
      }
    }
  }

  importProjects(): void {
    if (!this.projectFile) return;

    this.importingProjects = true;
    this.importResults = null;

    this.importService.importProjects(this.projectFile).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(blob, 'Projects_Import_Results.xlsx');
        this.showSnack('Import complete - results downloaded');
        this.loadAllProjects();
        this.loadDashboard();
        this.importingProjects = false;
        this.clearProjectFile();
      },
      error: (err: any) => {
        this.importingProjects = false;
        this.showSnack('Import failed');
      }
    });
  }

  importTasks(): void {
    if (!this.taskFile) return;

    this.importingTasks = true;
    this.importResults = null;

    this.importService.importTasks(this.taskFile).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(blob, 'Tasks_Import_Results.xlsx');
        this.showSnack('Import complete - results downloaded');
        this.importingTasks = false;
        this.clearTaskFile();
      },
      error: () => {
        this.importingTasks = false;
        this.showSnack('Import failed');
      }
    });
  }

  // ==================== HELPERS ====================

  getStatusColor(status: string): string {
    return this.statusColors[status?.toUpperCase()] || '#9e9e9e';
  }

  getPriorityColor(priority: string): string {
    return this.priorityColors[priority?.toUpperCase()] || '#9e9e9e';
  }

  getBarWidth(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.max((value / total) * 100, 2);
  }

  getObjectEntries(obj: Record<string, number>): [string, number][] {
    return Object.entries(obj || {});
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'PROJECT_CREATED': 'add_circle',
      'PROJECT_UPDATED': 'edit',
      'STATUS_CHANGE': 'swap_horiz',
      'STAGE_TRANSITION': 'trending_up',
      'TASK_CREATED': 'assignment',
      'TASK_COMPLETED': 'check_circle',
      'TEAM_MEMBER_ADDED': 'person_add',
      'DOCUMENT_ADDED': 'cloud_upload',
      'RISK_CREATED': 'warning',
      'ISSUE_CREATED': 'bug_report',
      'BUDGET_LINE_CREATED': 'account_balance',
      'MILESTONE_CREATED': 'flag',
      'CREATE': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'delete',
      'COMMENT': 'comment',
      'UPLOAD': 'cloud_upload',
      'ASSIGN': 'person_add',
      'COMPLETE': 'check_circle'
    };
    return icons[type?.toUpperCase()] || 'info';
  }

  private getEmptyProject(): CreateProjectRequest {
    return {
      code: '',
      name: '',
      description: '',
      priority: 'MEDIUM',
      category: '',
      startDate: undefined,
      endDate: undefined,
      estimatedBudget: undefined,
      managerId: ''
    };
  }

  downloadTemplate(type: string): void {
    const methodMap: Record<string, () => any> = {
      'team-members': () => this.importService.downloadTeamMemberTemplate(),
      'budget-lines': () => this.importService.downloadBudgetLineTemplate(),
      'risks': () => this.importService.downloadRiskTemplate(),
      'issues': () => this.importService.downloadIssueTemplate(),
    };
    const method = methodMap[type];
    if (method) {
      method().subscribe({
        next: (blob: Blob) => this.downloadBlob(blob, `${type}-template.xlsx`),
        error: () => this.showSnack('Failed to download template')
      });
    }
  }

  onGenericFileSelected(event: any, type: string): void {
    const file = event.target.files?.[0];
    if (file) {
      this.genericFiles[type] = file;
    }
    event.target.value = '';
  }

  importGeneric(type: string): void {
    const file = this.genericFiles[type];
    if (!file) return;
    this.genericImporting[type] = true;
    this.importResults = null;
    const methodMap: Record<string, (f: File) => any> = {
      'team': (f: File) => this.importService.importTeamMembers(f),
      'budget': (f: File) => this.importService.importBudgetLines(f),
      'risk': (f: File) => this.importService.importRisks(f),
      'issue': (f: File) => this.importService.importIssues(f),
    };
    const labelMap: Record<string, string> = { team: 'TeamMembers', budget: 'BudgetLines', risk: 'Risks', issue: 'Issues' };
    const method = methodMap[type];
    if (method) {
      method(file).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, `${labelMap[type]}_Import_Results.xlsx`);
          this.showSnack('Import complete - results downloaded');
          this.genericImporting[type] = false;
          this.genericFiles[type] = null;
        },
        error: () => {
          this.genericImporting[type] = false;
          this.showSnack('Import failed');
        }
      });
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  exportDashboard(format: 'excel' | 'pdf') {
    if (!this.dashboard) {
      this.showSnack('No dashboard data to export');
      return;
    }

    if (format === 'excel') {
      this.exportDashboardExcel();
    } else {
      this.exportDashboardPdf();
    }
  }

  private exportDashboardExcel() {
    const d = this.dashboard!;
    const rows: string[][] = [];

    // Summary
    rows.push(['Project Dashboard Summary']);
    rows.push([]);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Projects', String(d.totalProjects || 0)]);
    rows.push(['Active Projects', String(d.activeProjects || 0)]);
    rows.push(['Completed Projects', String(d.completedProjects || 0)]);
    rows.push(['Overdue Projects', String(d.overdueProjects || 0)]);
    rows.push(['Total Budget', String(d.totalBudget || 0)]);
    rows.push(['Actual Cost', String(d.totalActualCost || 0)]);
    rows.push(['Average Completion', (d.averageCompletion || 0) + '%']);
    rows.push([]);

    // By Status
    rows.push(['Projects by Status']);
    rows.push(['Status', 'Count']);
    if (d.projectsByStatus) {
      Object.entries(d.projectsByStatus).forEach(([k, v]) => rows.push([k, String(v)]));
    }
    rows.push([]);

    // By Priority
    rows.push(['Projects by Priority']);
    rows.push(['Priority', 'Count']);
    if (d.projectsByPriority) {
      Object.entries(d.projectsByPriority).forEach(([k, v]) => rows.push([k, String(v)]));
    }
    rows.push([]);

    // By Stage
    rows.push(['Projects by Stage']);
    rows.push(['Stage', 'Count']);
    if (d.projectsByStage) {
      Object.entries(d.projectsByStage).forEach(([k, v]) => rows.push([k, String(v)]));
    }
    rows.push([]);

    // Recent Projects
    rows.push(['Recent Projects']);
    rows.push(['Code', 'Name', 'Status', 'Priority', 'Manager', 'Completion %']);
    if (d.recentProjects) {
      d.recentProjects.forEach(p => {
        rows.push([p.code, p.name, p.status, p.priority, p.managerName || '-', (p.completionPercentage || 0) + '%']);
      });
    }

    // Build CSV
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Project_Dashboard.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.showSnack('Dashboard exported to CSV');
  }

  private exportDashboardPdf() {
    const d = this.dashboard!;

    const html = `
      <html>
      <head>
        <title>Project Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px; }
          h2 { color: #424242; margin-top: 24px; }
          .stats { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
          .stat { background: #f5f5f5; padding: 16px 24px; border-radius: 8px; text-align: center; min-width: 140px; }
          .stat-val { font-size: 28px; font-weight: bold; color: #1976d2; display: block; }
          .stat-lbl { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 24px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #1976d2; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .budget { margin: 16px 0; }
          .budget span { margin-right: 24px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Project Dashboard</h1>

        <div class="stats">
          <div class="stat"><span class="stat-val">${d.totalProjects || 0}</span><span class="stat-lbl">Total Projects</span></div>
          <div class="stat"><span class="stat-val">${d.activeProjects || 0}</span><span class="stat-lbl">Active</span></div>
          <div class="stat"><span class="stat-val">${d.completedProjects || 0}</span><span class="stat-lbl">Completed</span></div>
          <div class="stat"><span class="stat-val">${d.overdueProjects || 0}</span><span class="stat-lbl">Overdue</span></div>
        </div>

        <h2>Budget Overview</h2>
        <div class="budget">
          <span><strong>Total Budget:</strong> $${(d.totalBudget || 0).toLocaleString()}</span>
          <span><strong>Actual Cost:</strong> $${(d.totalActualCost || 0).toLocaleString()}</span>
          <span><strong>Avg. Completion:</strong> ${(d.averageCompletion || 0).toFixed(0)}%</span>
        </div>

        ${this.buildDistributionTable('Projects by Status', d.projectsByStatus)}
        ${this.buildDistributionTable('Projects by Priority', d.projectsByPriority)}
        ${this.buildDistributionTable('Projects by Stage', d.projectsByStage)}

        <h2>Recent Projects</h2>
        <table>
          <tr><th>Code</th><th>Name</th><th>Status</th><th>Priority</th><th>Manager</th><th>Completion</th></tr>
          ${(d.recentProjects || []).map(p => `
            <tr>
              <td>${p.code}</td><td>${p.name}</td><td>${p.status}</td>
              <td>${p.priority}</td><td>${p.managerName || '-'}</td><td>${(p.completionPercentage || 0)}%</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    this.showSnack('Dashboard PDF ready for printing');
  }

  private buildDistributionTable(title: string, data: { [key: string]: number } | undefined): string {
    if (!data || Object.keys(data).length === 0) return '';
    const rows = Object.entries(data).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
    return `<h2>${title}</h2><table><tr><th>Category</th><th>Count</th></tr>${rows}</table>`;
  }

  private showSnack(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
