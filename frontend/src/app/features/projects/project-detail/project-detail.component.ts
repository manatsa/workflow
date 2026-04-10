import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import {
  ProjectService,
  ProjectTaskService,
  ProjectCategoryService,
  RiskIssueCategoryService,
  ProjectCategoryDTO,
  RiskIssueCategoryDTO,
  ProjectDTO,
  ProjectTaskDTO,
  ProjectTeamMemberDTO,
  ProjectBudgetLineDTO,
  ProjectBudgetAdjustmentDTO,
  ProjectMilestoneDTO,
  ProjectRiskDTO,
  ProjectIssueDTO,
  ProjectStatusHistoryDTO,
  ProjectChecklistDTO,
  ProjectChecklistItemDTO,
  ProjectActivityDTO,
  ProjectApprovalStepDTO
} from '../services/project.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-project-detail',
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <div class="project-detail-container">
      @if (loading) {
        <div class="loading-overlay">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Loading project...</p>
        </div>
      } @else if (project) {
        <!-- Header -->
        <div class="detail-header">
          <div class="header-left">
            <button mat-icon-button (click)="goBack()" matTooltip="Back to projects">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-info">
              <h1>{{ project.name }}</h1>
              <span class="project-code">{{ project.code }}</span>
            </div>
          </div>
          <div class="header-right">
            <span class="status-badge" [class]="'status-' + project.status.toLowerCase()">{{ project.status }}</span>
            <span class="stage-badge" [class]="'stage-' + project.stage.toLowerCase()">{{ project.stage }}</span>
            <button mat-icon-button matTooltip="Export Project" [matMenuTriggerFor]="exportMenu">
              <mat-icon>download</mat-icon>
            </button>
            <mat-menu #exportMenu="matMenu">
              <button mat-menu-item (click)="exportProject('excel')">
                <mat-icon>table_chart</mat-icon>
                <span>Export as Excel</span>
              </button>
              <button mat-menu-item (click)="exportProject('pdf')">
                <mat-icon>picture_as_pdf</mat-icon>
                <span>Export as PDF</span>
              </button>
            </mat-menu>
            <button mat-icon-button matTooltip="More Options" [matMenuTriggerFor]="projectMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #projectMenu="matMenu" xPosition="before">
              <button mat-menu-item (click)="toggleEditMode()">
                <mat-icon>edit</mat-icon>
                <span>{{ editMode ? 'Cancel Edit' : 'Edit Project' }}</span>
              </button>
              <button mat-menu-item (click)="submitForApproval()" [disabled]="project.status !== 'DRAFT'">
                <mat-icon>send</mat-icon>
                <span>Submit for Approval</span>
              </button>
              <button mat-menu-item routerLink="/projects/{{project.id}}/reports">
                <mat-icon>assessment</mat-icon>
                <span>View Reports</span>
              </button>
              <mat-divider></mat-divider>
              @for (stage of getNextStages(); track stage) {
                <button mat-menu-item (click)="transitionStage(stage)">
                  <mat-icon>skip_next</mat-icon>
                  <span>Move to {{ stage }}</span>
                </button>
              }
            </mat-menu>
          </div>
        </div>

        <!-- Tab Group -->
        <mat-tab-group (selectedTabChange)="onTabChange($event)" animationDuration="200ms">

          <!-- ==================== TAB 1: OVERVIEW ==================== -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <!-- Edit Mode -->
              @if (editMode) {
                <mat-card class="edit-card">
                  <mat-card-header>
                    <mat-card-title>Edit Project</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="form-grid">
                      <mat-form-field appearance="outline">
                        <mat-label>Name</mat-label>
                        <input matInput [(ngModel)]="editData.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select [(ngModel)]="editData.priority">
                          @for (p of priorities; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="editData.category">
                          @for (cat of projectCategories; track cat.id) {
                            <mat-option [value]="cat.code">{{ cat.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Start Date</mat-label>
                        <input matInput [matDatepicker]="startPicker" [(ngModel)]="editData.startDate">
                        <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                        <mat-datepicker #startPicker></mat-datepicker>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>End Date</mat-label>
                        <input matInput [matDatepicker]="endPicker" [(ngModel)]="editData.endDate">
                        <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                        <mat-datepicker #endPicker></mat-datepicker>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Estimated Budget</mat-label>
                        <input matInput type="number" [(ngModel)]="editData.estimatedBudget">
                        <span matPrefix>$&nbsp;</span>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Description</mat-label>
                        <textarea matInput rows="3" [(ngModel)]="editData.description"></textarea>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Objectives</mat-label>
                        <textarea matInput rows="3" [(ngModel)]="editData.objectives"></textarea>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Scope</mat-label>
                        <textarea matInput rows="3" [(ngModel)]="editData.scope"></textarea>
                      </mat-form-field>
                    </div>
                  </mat-card-content>
                  <mat-card-actions align="end">
                    <button mat-button matTooltip="Cancel" (click)="toggleEditMode()">Cancel</button>
                    <button mat-flat-button matTooltip="Save Changes" color="primary" (click)="saveProject()">Save Changes</button>
                  </mat-card-actions>
                </mat-card>
              } @else {
                <!-- Info Cards Row -->
                <div class="info-cards">
                  <mat-card class="info-card">
                    <div class="info-card-icon status">
                      <mat-icon>flag</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Status</span>
                      <span class="info-value">
                        <span class="status-chip" [class]="'status-' + project.status.toLowerCase()">{{ project.status }}</span>
                      </span>
                    </div>
                  </mat-card>
                  <mat-card class="info-card">
                    <div class="info-card-icon stage">
                      <mat-icon>layers</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Stage</span>
                      <span class="info-value">{{ project.stage }}</span>
                    </div>
                  </mat-card>
                  <mat-card class="info-card">
                    <div class="info-card-icon priority">
                      <mat-icon>priority_high</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Priority</span>
                      <span class="info-value">
                        <span class="priority-chip" [class]="'priority-' + project.priority.toLowerCase()">{{ project.priority }}</span>
                      </span>
                    </div>
                  </mat-card>
                  <mat-card class="info-card">
                    <div class="info-card-icon dates">
                      <mat-icon>date_range</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Timeline</span>
                      <span class="info-value small">{{ project.startDate | date:'mediumDate' }} - {{ project.endDate | date:'mediumDate' }}</span>
                    </div>
                  </mat-card>
                  <mat-card class="info-card">
                    <div class="info-card-icon budget">
                      <mat-icon>account_balance_wallet</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Budget</span>
                      <span class="info-value">{{ project.estimatedBudget | currency }}</span>
                      <span class="info-sub">Spent: {{ project.actualCost | currency }}</span>
                    </div>
                  </mat-card>
                  <mat-card class="info-card">
                    <div class="info-card-icon completion">
                      <mat-icon>donut_large</mat-icon>
                    </div>
                    <div class="info-card-content">
                      <span class="info-label">Completion</span>
                      <span class="info-value">{{ project.completionPercentage }}%</span>
                      <mat-progress-bar mode="determinate" [value]="project.completionPercentage"></mat-progress-bar>
                    </div>
                  </mat-card>
                </div>

                <!-- Stage Progression -->
                <mat-card class="stage-card">
                  <mat-card-header>
                    <mat-card-title>Stage Progression</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="stage-progress">
                      @for (s of stages; track s; let i = $index) {
                        <div class="stage-step" [class.active]="project.stage === s" [class.completed]="getStageIndex(project.stage) > i">
                          <div class="stage-dot">
                            @if (getStageIndex(project.stage) > i) {
                              <mat-icon>check</mat-icon>
                            } @else {
                              {{ i + 1 }}
                            }
                          </div>
                          <span class="stage-label">{{ s }}</span>
                        </div>
                        @if (i < stages.length - 1) {
                          <div class="stage-connector" [class.completed]="getStageIndex(project.stage) > i"></div>
                        }
                      }
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Approval Progress -->
                @if (project.approvalSteps && project.approvalSteps.length > 0 && (project.status === 'PENDING_APPROVAL' || project.status === 'APPROVED')) {
                  <mat-card class="approval-card">
                    <mat-card-header>
                      <mat-card-title>
                        <mat-icon>verified</mat-icon> Approval Progress
                      </mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="approval-stepper">
                        @for (step of project.approvalSteps; track step.id) {
                          <div class="approval-step" [class.approved]="step.status === 'APPROVED'" [class.rejected]="step.status === 'REJECTED'" [class.current]="step.status === 'CURRENT'" [class.skipped]="step.status === 'SKIPPED'" [class.pending]="step.status === 'PENDING'">
                            <div class="approval-step-icon">
                              @if (step.status === 'APPROVED') {
                                <mat-icon class="step-icon approved">check_circle</mat-icon>
                              } @else if (step.status === 'REJECTED') {
                                <mat-icon class="step-icon rejected">cancel</mat-icon>
                              } @else if (step.status === 'CURRENT') {
                                <mat-icon class="step-icon current">hourglass_top</mat-icon>
                              } @else if (step.status === 'SKIPPED') {
                                <mat-icon class="step-icon skipped">skip_next</mat-icon>
                              } @else {
                                <mat-icon class="step-icon pending">radio_button_unchecked</mat-icon>
                              }
                            </div>
                            <div class="approval-step-info">
                              <span class="approval-step-name">{{ step.approverName }}</span>
                              <span class="approval-step-level">Level {{ step.level }}</span>
                              @if (step.actionDate) {
                                <span class="approval-step-date">{{ step.actionDate | date:'medium' }}</span>
                              }
                              @if (step.comments) {
                                <span class="approval-step-comments">"{{ step.comments }}"</span>
                              }
                            </div>
                            <span class="approval-step-status" [class]="'astatus-' + step.status.toLowerCase()">{{ step.status }}</span>
                          </div>
                        }
                      </div>

                      @if (project.isCurrentUserApprover && project.status === 'PENDING_APPROVAL') {
                        <mat-divider class="approval-divider"></mat-divider>
                        <div class="approval-actions">
                          <mat-form-field appearance="outline" class="approval-comments-field">
                            <mat-label>Comments</mat-label>
                            <textarea matInput [(ngModel)]="approvalComments" rows="2" placeholder="Add your comments..."></textarea>
                          </mat-form-field>
                          <div class="approval-buttons">
                            <button mat-flat-button matTooltip="Approve" color="primary" (click)="processApproval('APPROVED')">
                              <mat-icon>check</mat-icon> Approve
                            </button>
                            <button mat-flat-button matTooltip="Reject" color="warn" (click)="processApproval('REJECTED')">
                              <mat-icon>close</mat-icon> Reject
                            </button>
                          </div>
                        </div>
                      }
                    </mat-card-content>
                  </mat-card>
                }

                <!-- Details Sections -->
                <div class="detail-sections">
                  <mat-card class="detail-card">
                    <mat-card-header>
                      <mat-card-title>Project Details</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Manager</span>
                          <span class="detail-value">{{ project.managerName || 'Not assigned' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Sponsor</span>
                          <span class="detail-value">{{ project.sponsorName || 'Not assigned' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">SBU</span>
                          <span class="detail-value">{{ project.sbuName || 'N/A' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Category</span>
                          <span class="detail-value">{{ project.category || 'N/A' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Tasks</span>
                          <span class="detail-value">{{ project.completedTaskCount }}/{{ project.taskCount }} completed</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Team Members</span>
                          <span class="detail-value">{{ project.teamMemberCount }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Created</span>
                          <span class="detail-value">{{ project.createdAt | date:'medium' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Last Updated</span>
                          <span class="detail-value">{{ project.updatedAt | date:'medium' }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Description</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p class="section-text">{{ project.description || 'No description provided.' }}</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Objectives</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p class="section-text">{{ project.objectives || 'No objectives defined.' }}</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Scope</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p class="section-text">{{ project.scope || 'No scope defined.' }}</p>
                  </mat-expansion-panel>

                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>Notes</mat-panel-title>
                    </mat-expansion-panel-header>
                    <p class="section-text">{{ project.notes || 'No notes.' }}</p>
                  </mat-expansion-panel>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 2: TASKS ==================== -->
          <mat-tab label="Tasks">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Tasks ({{ tasks.length }})</h3>
                <button mat-flat-button matTooltip="Add Task" color="primary" (click)="showAddTask = !showAddTask">
                  <mat-icon>add</mat-icon> Add Task
                </button>
              </div>

              @if (showAddTask) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Task Name</mat-label>
                        <input matInput [(ngModel)]="newTask.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select [(ngModel)]="newTask.priority">
                          @for (p of priorities; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="taskDuePicker" [(ngModel)]="newTask.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="taskDuePicker"></mat-datepicker-toggle>
                        <mat-datepicker #taskDuePicker></mat-datepicker>
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addTask()" [disabled]="!newTask.name">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddTask = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="tasks" class="data-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Task</th>
                  <td mat-cell *matCellDef="let task">{{ task.name }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let task">
                    <span class="task-status-chip" [class]="'task-' + task.status.toLowerCase()">{{ task.status | titlecase }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let task">
                    <span class="priority-chip" [class]="'priority-' + task.priority.toLowerCase()">{{ task.priority }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="assignee">
                  <th mat-header-cell *matHeaderCellDef>Assignee</th>
                  <td mat-cell *matCellDef="let task">{{ task.assigneeName || 'Unassigned' }}</td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let task">{{ task.dueDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="completion">
                  <th mat-header-cell *matHeaderCellDef>Progress</th>
                  <td mat-cell *matCellDef="let task">
                    <div class="progress-cell">
                      <mat-progress-bar mode="determinate" [value]="task.completionPercentage"></mat-progress-bar>
                      <span>{{ task.completionPercentage }}%</span>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let task">
                    <button mat-icon-button [matMenuTriggerFor]="taskMenu" matTooltip="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #taskMenu="matMenu">
                      <button mat-menu-item (click)="startTaskEdit(task)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <mat-divider></mat-divider>
                      @for (s of taskStatuses; track s) {
                        <button mat-menu-item (click)="updateTaskStatus(task, s)" [disabled]="task.status === s">
                          <span>Set {{ s | titlecase }}</span>
                        </button>
                      }
                      <mat-divider></mat-divider>
                      <button mat-menu-item (click)="deleteTask(task)">
                        <mat-icon color="warn">delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="taskColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: taskColumns;"></tr>
              </table>

              @if (editingTaskId) {
                <mat-card class="inline-form" style="margin-top: 16px;">
                  <mat-card-content>
                    <h4 style="margin: 0 0 12px 0;">Edit Task</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Task Name</mat-label>
                        <input matInput [(ngModel)]="editTaskData.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Status</mat-label>
                        <mat-select [(ngModel)]="editTaskData.status">
                          @for (s of taskStatuses; track s) {
                            <mat-option [value]="s">{{ s | titlecase }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select [(ngModel)]="editTaskData.priority">
                          @for (p of priorities; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Description</mat-label>
                        <textarea matInput [(ngModel)]="editTaskData.description" rows="2"></textarea>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Assignee</mat-label>
                        <mat-select [(ngModel)]="editTaskData.assigneeId">
                          <mat-option [value]="''">Unassigned</mat-option>
                          @for (u of users; track u.id) {
                            <mat-option [value]="u.id">{{ u.fullName || u.username }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Start Date</mat-label>
                        <input matInput [matDatepicker]="editStartPicker" [(ngModel)]="editTaskData.startDate">
                        <mat-datepicker-toggle matIconSuffix [for]="editStartPicker"></mat-datepicker-toggle>
                        <mat-datepicker #editStartPicker></mat-datepicker>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="editDuePicker" [(ngModel)]="editTaskData.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="editDuePicker"></mat-datepicker-toggle>
                        <mat-datepicker #editDuePicker></mat-datepicker>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Estimated Hours</mat-label>
                        <input matInput type="number" [(ngModel)]="editTaskData.estimatedHours">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Completion %</mat-label>
                        <input matInput type="number" min="0" max="100" [(ngModel)]="editTaskData.completionPercentage">
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Milestone</mat-label>
                        <mat-select [(ngModel)]="editTaskData.milestoneId">
                          <mat-option [value]="''">None</mat-option>
                          @for (m of milestones; track m.id) {
                            <mat-option [value]="m.id">{{ m.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Tags</mat-label>
                        <input matInput [(ngModel)]="editTaskData.tags" placeholder="Comma-separated tags">
                      </mat-form-field>
                      <div style="display: flex; align-items: center; gap: 16px; padding-bottom: 22px;">
                        <mat-checkbox [(ngModel)]="editTaskData.isCriticalPath">Critical Path</mat-checkbox>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      <button mat-button matTooltip="Cancel" (click)="cancelTaskEdit()">Cancel</button>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="saveTaskEdit()" [disabled]="!editTaskData.name">Save</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (tasks.length === 0) {
                <div class="empty-state">
                  <mat-icon>assignment</mat-icon>
                  <p>No tasks yet. Add a task to get started.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 3: TEAM ==================== -->
          <mat-tab label="Team">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Team Members ({{ teamMembers.length }})</h3>
                <button mat-flat-button matTooltip="Add Member" color="primary" (click)="showAddMember = !showAddMember">
                  <mat-icon>person_add</mat-icon> Add Member
                </button>
              </div>

              @if (showAddMember) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>User</mat-label>
                        <mat-select [(ngModel)]="newMember.userId">
                          <mat-option *ngFor="let user of users" [value]="user.id">
                            {{ user.firstName }} {{ user.lastName }}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Role</mat-label>
                        <mat-select [(ngModel)]="newMember.role">
                          @for (r of teamRoles; track r) {
                            <mat-option [value]="r">{{ r }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Allocation %</mat-label>
                        <input matInput type="number" min="0" max="100" [(ngModel)]="newMember.allocationPercentage">
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addTeamMember()" [disabled]="!newMember.userId">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddMember = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="teamMembers" class="data-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let m">{{ m.userName }}</td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let m">{{ m.userEmail }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let m">{{ m.role }}</td>
                </ng-container>
                <ng-container matColumnDef="allocation">
                  <th mat-header-cell *matHeaderCellDef>Allocation</th>
                  <td mat-cell *matCellDef="let m">
                    <div class="progress-cell">
                      <mat-progress-bar mode="determinate" [value]="m.allocationPercentage"></mat-progress-bar>
                      <span>{{ m.allocationPercentage }}%</span>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="joinDate">
                  <th mat-header-cell *matHeaderCellDef>Joined</th>
                  <td mat-cell *matCellDef="let m">{{ m.joinDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let m">
                    <button mat-icon-button [matMenuTriggerFor]="memberMenu" matTooltip="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #memberMenu="matMenu">
                      <button mat-menu-item (click)="startMemberEdit(m)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="removeTeamMember(m)">
                        <mat-icon color="warn">person_remove</mat-icon>
                        <span>Remove</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="teamColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: teamColumns;"></tr>
              </table>

              @if (editingMemberId) {
                <mat-card class="inline-form" style="margin-top: 16px;">
                  <mat-card-content>
                    <h4 style="margin: 0 0 12px 0;">Edit Team Member</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Role</mat-label>
                        <mat-select [(ngModel)]="editMemberData.role">
                          @for (r of teamRoles; track r) {
                            <mat-option [value]="r">{{ r }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Allocation %</mat-label>
                        <input matInput type="number" min="0" max="100" [(ngModel)]="editMemberData.allocationPercentage">
                      </mat-form-field>
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Responsibilities</mat-label>
                        <input matInput [(ngModel)]="editMemberData.responsibilities">
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="saveMemberEdit()">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="cancelMemberEdit()">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (teamMembers.length === 0) {
                <div class="empty-state">
                  <mat-icon>group</mat-icon>
                  <p>No team members assigned.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 4: BUDGET ==================== -->
          <mat-tab label="Budget">
            <div class="tab-content">
              <!-- Summary Cards -->
              @if (budgetLines.length > 0) {
                <div class="budget-summary-cards">
                  <div class="budget-summary-card">
                    <mat-icon>account_balance</mat-icon>
                    <div class="budget-summary-info">
                      <span class="budget-summary-label">Total Estimated</span>
                      <span class="budget-summary-value">{{ getBudgetTotal('estimatedAmount') | currency }}</span>
                    </div>
                  </div>
                  <div class="budget-summary-card">
                    <mat-icon>receipt_long</mat-icon>
                    <div class="budget-summary-info">
                      <span class="budget-summary-label">Total Actual</span>
                      <span class="budget-summary-value">{{ getBudgetTotal('actualAmount') | currency }}</span>
                    </div>
                  </div>
                  <div class="budget-summary-card">
                    <mat-icon>pending_actions</mat-icon>
                    <div class="budget-summary-info">
                      <span class="budget-summary-label">Total Committed</span>
                      <span class="budget-summary-value">{{ getBudgetTotal('committedAmount') | currency }}</span>
                    </div>
                  </div>
                  <div class="budget-summary-card" [class.positive-variance]="getBudgetTotal('variance') >= 0" [class.negative-variance]="getBudgetTotal('variance') < 0">
                    <mat-icon>{{ getBudgetTotal('variance') >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                    <div class="budget-summary-info">
                      <span class="budget-summary-label">Total Variance</span>
                      <span class="budget-summary-value">{{ getBudgetTotal('variance') | currency }}</span>
                    </div>
                  </div>
                </div>
              }

              <div class="tab-toolbar">
                <h3>Budget Lines</h3>
                <button mat-flat-button matTooltip="Add Budget Line" color="primary" (click)="showAddBudget = !showAddBudget">
                  <mat-icon>add</mat-icon> Add Budget Line
                </button>
              </div>

              @if (showAddBudget) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Name</mat-label>
                        <input matInput [(ngModel)]="newBudgetLine.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="newBudgetLine.category">
                          @for (c of budgetCategories; track c) {
                            <mat-option [value]="c">{{ c }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Estimated Amount</mat-label>
                        <input matInput type="number" [(ngModel)]="newBudgetLine.estimatedAmount">
                        <span matPrefix>$&nbsp;</span>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Actual Amount</mat-label>
                        <input matInput type="number" [(ngModel)]="newBudgetLine.actualAmount">
                        <span matPrefix>$&nbsp;</span>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Committed Amount</mat-label>
                        <input matInput type="number" [(ngModel)]="newBudgetLine.committedAmount">
                        <span matPrefix>$&nbsp;</span>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Forecast Amount</mat-label>
                        <input matInput type="number" [(ngModel)]="newBudgetLine.forecastAmount">
                        <span matPrefix>$&nbsp;</span>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="wide-field">
                        <mat-label>Notes</mat-label>
                        <input matInput [(ngModel)]="newBudgetLine.notes">
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addBudgetLine()" [disabled]="!newBudgetLine.name">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddBudget = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="budgetLines" class="data-table budget-table" multiTemplateDataRows>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <mat-form-field appearance="outline" class="inline-edit-field">
                        <input matInput [(ngModel)]="editBudgetData.name">
                      </mat-form-field>
                    } @else {
                      <div>
                        <strong>{{ b.name }}</strong>
                        @if (b.notes) {
                          <div class="budget-line-notes">{{ b.notes }}</div>
                        }
                      </div>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <mat-form-field appearance="outline" class="inline-edit-field">
                        <mat-select [(ngModel)]="editBudgetData.category">
                          @for (c of budgetCategories; track c) {
                            <mat-option [value]="c">{{ c }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    } @else {
                      <span class="category-chip">{{ b.category }}</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="estimated">
                  <th mat-header-cell *matHeaderCellDef>Estimated</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <mat-form-field appearance="outline" class="inline-edit-field narrow">
                        <input matInput type="number" [(ngModel)]="editBudgetData.estimatedAmount">
                      </mat-form-field>
                    } @else {
                      {{ b.estimatedAmount | currency }}
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="actual">
                  <th mat-header-cell *matHeaderCellDef>Actual</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <mat-form-field appearance="outline" class="inline-edit-field narrow">
                        <input matInput type="number" [(ngModel)]="editBudgetData.actualAmount">
                      </mat-form-field>
                    } @else {
                      {{ b.actualAmount | currency }}
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="committed">
                  <th mat-header-cell *matHeaderCellDef>Committed</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <mat-form-field appearance="outline" class="inline-edit-field narrow">
                        <input matInput type="number" [(ngModel)]="editBudgetData.committedAmount">
                      </mat-form-field>
                    } @else {
                      {{ b.committedAmount | currency }}
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="variance">
                  <th mat-header-cell *matHeaderCellDef>Variance</th>
                  <td mat-cell *matCellDef="let b" [class.positive-variance]="b.variance >= 0" [class.negative-variance]="b.variance < 0">
                    {{ b.variance | currency }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="variancePct">
                  <th mat-header-cell *matHeaderCellDef>Var%</th>
                  <td mat-cell *matCellDef="let b" [class.positive-variance]="b.variancePercentage >= 0" [class.negative-variance]="b.variancePercentage < 0">
                    {{ b.variancePercentage | number:'1.1-1' }}%
                  </td>
                </ng-container>
                <ng-container matColumnDef="adjustments">
                  <th mat-header-cell *matHeaderCellDef>Adj.</th>
                  <td mat-cell *matCellDef="let b">
                    @if (b.adjustmentCount > 0) {
                      <button mat-icon-button matTooltip="View adjustment history" (click)="toggleAdjustmentHistory(b)">
                        <mat-icon [matBadge]="b.adjustmentCount" matBadgeSize="small" matBadgeColor="accent">history</mat-icon>
                      </button>
                    } @else {
                      <span class="muted-text">0</span>
                    }
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let b">
                    @if (editingBudgetLineId === b.id) {
                      <div class="inline-edit-actions">
                        <mat-form-field appearance="outline" class="adjustment-notes-field">
                          <mat-label>Adjustment Notes</mat-label>
                          <input matInput [(ngModel)]="editBudgetData.adjustmentNotes" placeholder="Reason for change...">
                        </mat-form-field>
                        <button mat-icon-button color="primary" matTooltip="Save" (click)="saveBudgetLineEdit(b)">
                          <mat-icon>check</mat-icon>
                        </button>
                        <button mat-icon-button matTooltip="Cancel" (click)="cancelBudgetLineEdit()">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    } @else {
                      <button mat-icon-button matTooltip="Edit" (click)="startBudgetLineEdit(b)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" matTooltip="Delete" (click)="deleteBudgetLine(b)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>

                <!-- Expandable adjustment history row -->
                <ng-container matColumnDef="expandedDetail">
                  <td mat-cell *matCellDef="let b" [attr.colspan]="budgetColumns.length">
                    @if (expandedAdjustmentLineId === b.id && b.adjustments?.length > 0) {
                      <div class="adjustment-history-panel">
                        <h4>Adjustment History - {{ b.name }}</h4>
                        <div class="adjustment-timeline">
                          @for (adj of b.adjustments; track adj.id) {
                            <div class="adjustment-entry">
                              <div class="adjustment-header">
                                <span class="adjustment-type-badge" [class]="'adj-type-' + adj.adjustmentType.toLowerCase()">
                                  {{ adj.adjustmentType }}
                                </span>
                                <span class="adjustment-date">{{ adj.adjustedAt | date:'medium' }}</span>
                                <span class="adjustment-by">by {{ adj.adjustedBy }}</span>
                              </div>
                              <div class="adjustment-details">
                                <span class="adj-change">
                                  Estimated: {{ adj.previousEstimated | currency }} &rarr; {{ adj.newEstimated | currency }}
                                </span>
                                @if (adj.previousActual !== adj.newActual) {
                                  <span class="adj-change">
                                    Actual: {{ adj.previousActual | currency }} &rarr; {{ adj.newActual | currency }}
                                  </span>
                                }
                                <span class="adj-amount" [class.positive-variance]="adj.adjustmentAmount >= 0" [class.negative-variance]="adj.adjustmentAmount < 0">
                                  Delta: {{ adj.adjustmentAmount | currency }}
                                </span>
                              </div>
                              <div class="adjustment-notes">{{ adj.notes }}</div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="budgetColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: budgetColumns;" [class.editing-row]="editingBudgetLineId === row.id"></tr>
                <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>
              </table>

              @if (budgetLines.length > 0) {
                <div class="budget-totals">
                  <div class="total-item">
                    <span class="total-label">Total Estimated</span>
                    <span class="total-value">{{ getBudgetTotal('estimatedAmount') | currency }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">Total Actual</span>
                    <span class="total-value">{{ getBudgetTotal('actualAmount') | currency }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">Total Committed</span>
                    <span class="total-value">{{ getBudgetTotal('committedAmount') | currency }}</span>
                  </div>
                  <div class="total-item" [class.positive-variance]="getBudgetTotal('variance') >= 0" [class.negative-variance]="getBudgetTotal('variance') < 0">
                    <span class="total-label">Total Variance</span>
                    <span class="total-value">{{ getBudgetTotal('variance') | currency }}</span>
                  </div>
                </div>

                <!-- Category Breakdown -->
                <div class="category-breakdown">
                  <h4>Category Breakdown</h4>
                  @for (cat of getBudgetCategories(); track cat) {
                    <div class="category-row">
                      <div class="category-info">
                        <span class="category-name">{{ cat }}</span>
                        <span class="category-amounts">
                          {{ getCategoryTotal(cat, 'actualAmount') | currency }} / {{ getCategoryTotal(cat, 'estimatedAmount') | currency }}
                        </span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="getCategoryProgress(cat)" [color]="getCategoryProgress(cat) > 100 ? 'warn' : 'primary'"></mat-progress-bar>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>account_balance_wallet</mat-icon>
                  <p>No budget lines defined.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 5: MILESTONES ==================== -->
          <mat-tab label="Milestones">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Milestones ({{ milestones.length }})</h3>
                <button mat-flat-button matTooltip="Add Milestone" color="primary" (click)="showAddMilestone = !showAddMilestone">
                  <mat-icon>add</mat-icon> Add Milestone
                </button>
              </div>

              @if (showAddMilestone) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Name</mat-label>
                        <input matInput [(ngModel)]="newMilestone.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="milestonePicker" [(ngModel)]="newMilestone.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="milestonePicker"></mat-datepicker-toggle>
                        <mat-datepicker #milestonePicker></mat-datepicker>
                      </mat-form-field>
                      <mat-checkbox [(ngModel)]="newMilestone.isCritical">Critical</mat-checkbox>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addMilestone()" [disabled]="!newMilestone.name">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddMilestone = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <mat-list>
                @for (ms of milestones; track ms.id) {
                  <mat-list-item class="milestone-item">
                    <mat-icon matListItemIcon [class.critical]="ms.isCritical">
                      {{ ms.status === 'COMPLETED' ? 'check_circle' : (ms.isCritical ? 'error' : 'flag') }}
                    </mat-icon>
                    <div matListItemTitle class="milestone-title">
                      {{ ms.name }}
                      @if (ms.isCritical) {
                        <span class="critical-badge">CRITICAL</span>
                      }
                    </div>
                    <div matListItemLine>
                      <span class="status-chip" [class]="'status-' + ms.status.toLowerCase()">{{ ms.status }}</span>
                      <span class="milestone-date">Due: {{ ms.dueDate | date:'mediumDate' }}</span>
                      @if (ms.completedDate) {
                        <span class="milestone-date">Completed: {{ ms.completedDate | date:'mediumDate' }}</span>
                      }
                    </div>
                    <div matListItemMeta>
                      <button mat-icon-button matTooltip="Edit" (click)="startMilestoneEdit(ms)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Delete" (click)="deleteMilestone(ms)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>flag</mat-icon>
                    <p>No milestones defined.</p>
                  </div>
                }
              </mat-list>

              @if (editingMilestoneId) {
                <mat-card class="inline-form" style="margin-top: 16px;">
                  <mat-card-content>
                    <h4 style="margin: 0 0 12px 0;">Edit Milestone</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Name</mat-label>
                        <input matInput [(ngModel)]="editMilestoneData.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Status</mat-label>
                        <mat-select [(ngModel)]="editMilestoneData.status">
                          @for (s of milestoneStatuses; track s) {
                            <mat-option [value]="s">{{ s }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="editMilestonePicker" [(ngModel)]="editMilestoneData.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="editMilestonePicker"></mat-datepicker-toggle>
                        <mat-datepicker #editMilestonePicker></mat-datepicker>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Owner</mat-label>
                        <mat-select [(ngModel)]="editMilestoneData.ownerId">
                          <mat-option [value]="''">None</mat-option>
                          @for (u of users; track u.id) {
                            <mat-option [value]="u.id">{{ u.fullName || u.username }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Description</mat-label>
                        <textarea matInput [(ngModel)]="editMilestoneData.description" rows="2"></textarea>
                      </mat-form-field>
                      <mat-checkbox [(ngModel)]="editMilestoneData.isCritical">Critical</mat-checkbox>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="saveMilestoneEdit()" [disabled]="!editMilestoneData.name">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="cancelMilestoneEdit()">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 6: RISKS ==================== -->
          <mat-tab label="Risks">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Risks ({{ risks.length }})</h3>
                <button mat-flat-button matTooltip="Add Risk" color="primary" (click)="showAddRisk = !showAddRisk">
                  <mat-icon>add</mat-icon> Add Risk
                </button>
              </div>

              @if (showAddRisk) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="newRisk.title">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Probability</mat-label>
                        <mat-select [(ngModel)]="newRisk.probability">
                          @for (p of riskLevels; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Impact</mat-label>
                        <mat-select [(ngModel)]="newRisk.impact">
                          @for (i of riskLevels; track i) {
                            <mat-option [value]="i">{{ i }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="newRisk.categoryId">
                          @for (cat of riskCategories; track cat.id) {
                            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addRisk()" [disabled]="!newRisk.title">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddRisk = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="risks" class="data-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Risk</th>
                  <td mat-cell *matCellDef="let r">{{ r.title }}</td>
                </ng-container>
                <ng-container matColumnDef="probability">
                  <th mat-header-cell *matHeaderCellDef>Probability</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="risk-level" [class]="'risk-' + r.probability.toLowerCase()">{{ r.probability }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="impact">
                  <th mat-header-cell *matHeaderCellDef>Impact</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="risk-level" [class]="'risk-' + r.impact.toLowerCase()">{{ r.impact }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">
                    <span class="status-chip" [class]="'status-' + r.status.toLowerCase()">{{ r.status }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="owner">
                  <th mat-header-cell *matHeaderCellDef>Owner</th>
                  <td mat-cell *matCellDef="let r">{{ r.ownerName || 'Unassigned' }}</td>
                </ng-container>
                <ng-container matColumnDef="category">
                  <th mat-header-cell *matHeaderCellDef>Category</th>
                  <td mat-cell *matCellDef="let r">{{ r.categoryName || r.riskCategory || 'N/A' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let r">
                    <button mat-icon-button [matMenuTriggerFor]="riskMenu" matTooltip="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #riskMenu="matMenu">
                      <button mat-menu-item (click)="startRiskEdit(r)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="deleteRisk(r)">
                        <mat-icon color="warn">delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="riskColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: riskColumns;"></tr>
              </table>

              @if (editingRiskId) {
                <mat-card class="inline-form" style="margin-top: 16px;">
                  <mat-card-content>
                    <h4 style="margin: 0 0 12px 0;">Edit Risk</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="editRiskData.title">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Status</mat-label>
                        <mat-select [(ngModel)]="editRiskData.status">
                          @for (s of riskStatuses; track s) {
                            <mat-option [value]="s">{{ s }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="editRiskData.categoryId">
                          @for (cat of riskCategories; track cat.id) {
                            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Probability</mat-label>
                        <mat-select [(ngModel)]="editRiskData.probability">
                          @for (p of riskLevels; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Impact</mat-label>
                        <mat-select [(ngModel)]="editRiskData.impact">
                          @for (i of riskLevels; track i) {
                            <mat-option [value]="i">{{ i }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Owner</mat-label>
                        <mat-select [(ngModel)]="editRiskData.ownerId">
                          <mat-option [value]="''">Unassigned</mat-option>
                          @for (u of users; track u.id) {
                            <mat-option [value]="u.id">{{ u.fullName || u.username }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Description</mat-label>
                        <textarea matInput [(ngModel)]="editRiskData.description" rows="2"></textarea>
                      </mat-form-field>
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Mitigation Plan</mat-label>
                        <textarea matInput [(ngModel)]="editRiskData.mitigationPlan" rows="2"></textarea>
                      </mat-form-field>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      <button mat-button matTooltip="Cancel" (click)="cancelRiskEdit()">Cancel</button>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="saveRiskEdit()" [disabled]="!editRiskData.title">Save</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (risks.length === 0) {
                <div class="empty-state">
                  <mat-icon>warning</mat-icon>
                  <p>No risks identified.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 7: ISSUES ==================== -->
          <mat-tab label="Issues">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Issues ({{ issues.length }})</h3>
                <button mat-flat-button matTooltip="Add Issue" color="primary" (click)="showAddIssue = !showAddIssue">
                  <mat-icon>add</mat-icon> Add Issue
                </button>
              </div>

              @if (showAddIssue) {
                <mat-card class="inline-form">
                  <mat-card-content>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="newIssue.title">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select [(ngModel)]="newIssue.priority">
                          @for (p of priorities; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="newIssue.categoryId">
                          @for (cat of issueCategories; track cat.id) {
                            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="issueDuePicker" [(ngModel)]="newIssue.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="issueDuePicker"></mat-datepicker-toggle>
                        <mat-datepicker #issueDuePicker></mat-datepicker>
                      </mat-form-field>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="addIssue()" [disabled]="!newIssue.title">Save</button>
                      <button mat-button matTooltip="Cancel" (click)="showAddIssue = false">Cancel</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              <table mat-table [dataSource]="issues" class="data-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Issue</th>
                  <td mat-cell *matCellDef="let iss">{{ iss.title }}</td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let iss">
                    <span class="priority-chip" [class]="'priority-' + iss.priority.toLowerCase()">{{ iss.priority }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let iss">
                    <span class="status-chip" [class]="'status-' + iss.status.toLowerCase()">{{ iss.status }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="assignee">
                  <th mat-header-cell *matHeaderCellDef>Assignee</th>
                  <td mat-cell *matCellDef="let iss">{{ iss.assigneeName || 'Unassigned' }}</td>
                </ng-container>
                <ng-container matColumnDef="reportedDate">
                  <th mat-header-cell *matHeaderCellDef>Reported</th>
                  <td mat-cell *matCellDef="let iss">{{ iss.reportedDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="dueDate">
                  <th mat-header-cell *matHeaderCellDef>Due Date</th>
                  <td mat-cell *matCellDef="let iss">{{ iss.dueDate | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let iss">
                    <button mat-icon-button [matMenuTriggerFor]="issueMenu" matTooltip="Actions">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #issueMenu="matMenu">
                      <button mat-menu-item (click)="startIssueEdit(iss)">
                        <mat-icon>edit</mat-icon>
                        <span>Edit</span>
                      </button>
                      <button mat-menu-item (click)="deleteIssue(iss)">
                        <mat-icon color="warn">delete</mat-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="issueColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: issueColumns;"></tr>
              </table>

              @if (editingIssueId) {
                <mat-card class="inline-form" style="margin-top: 16px;">
                  <mat-card-content>
                    <h4 style="margin: 0 0 12px 0;">Edit Issue</h4>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="editIssueData.title">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Status</mat-label>
                        <mat-select [(ngModel)]="editIssueData.status">
                          @for (s of issueStatuses; track s) {
                            <mat-option [value]="s">{{ s }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select [(ngModel)]="editIssueData.priority">
                          @for (p of priorities; track p) {
                            <mat-option [value]="p">{{ p }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Category</mat-label>
                        <mat-select [(ngModel)]="editIssueData.categoryId">
                          @for (cat of issueCategories; track cat.id) {
                            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Assignee</mat-label>
                        <mat-select [(ngModel)]="editIssueData.assigneeId">
                          <mat-option [value]="''">Unassigned</mat-option>
                          @for (u of users; track u.id) {
                            <mat-option [value]="u.id">{{ u.fullName || u.username }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="editIssueDuePicker" [(ngModel)]="editIssueData.dueDate">
                        <mat-datepicker-toggle matIconSuffix [for]="editIssueDuePicker"></mat-datepicker-toggle>
                        <mat-datepicker #editIssueDuePicker></mat-datepicker>
                      </mat-form-field>
                    </div>
                    <div class="form-row">
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Description</mat-label>
                        <textarea matInput [(ngModel)]="editIssueData.description" rows="2"></textarea>
                      </mat-form-field>
                      <mat-form-field appearance="outline" style="flex: 2;">
                        <mat-label>Resolution</mat-label>
                        <textarea matInput [(ngModel)]="editIssueData.resolution" rows="2"></textarea>
                      </mat-form-field>
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      <button mat-button matTooltip="Cancel" (click)="cancelIssueEdit()">Cancel</button>
                      <button mat-flat-button matTooltip="Save" color="primary" (click)="saveIssueEdit()" [disabled]="!editIssueData.title">Save</button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }

              @if (issues.length === 0) {
                <div class="empty-state">
                  <mat-icon>bug_report</mat-icon>
                  <p>No issues reported.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ==================== TAB 8: HISTORY ==================== -->
          <mat-tab label="History">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Status History</h3>
              </div>

              <div class="timeline">
                @for (entry of statusHistory; track entry.id) {
                  <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-connector"></div>
                    <mat-card class="timeline-card">
                      <mat-card-content>
                        <div class="timeline-header">
                          <span class="timeline-date">{{ entry.createdAt | date:'medium' }}</span>
                          <span class="timeline-user">by {{ entry.changedBy }}</span>
                        </div>
                        <div class="timeline-body">
                          @if (entry.fromStatus && entry.toStatus) {
                            <div class="transition-row">
                              <span class="label">Status:</span>
                              <span class="status-chip" [class]="'status-' + entry.fromStatus.toLowerCase()">{{ entry.fromStatus }}</span>
                              <mat-icon>arrow_forward</mat-icon>
                              <span class="status-chip" [class]="'status-' + entry.toStatus.toLowerCase()">{{ entry.toStatus }}</span>
                            </div>
                          }
                          @if (entry.fromStage && entry.toStage) {
                            <div class="transition-row">
                              <span class="label">Stage:</span>
                              <span class="stage-badge" [class]="'stage-' + entry.fromStage.toLowerCase()">{{ entry.fromStage }}</span>
                              <mat-icon>arrow_forward</mat-icon>
                              <span class="stage-badge" [class]="'stage-' + entry.toStage.toLowerCase()">{{ entry.toStage }}</span>
                            </div>
                          }
                          @if (entry.reason) {
                            <p class="timeline-reason">Reason: {{ entry.reason }}</p>
                          }
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>history</mat-icon>
                    <p>No status history available.</p>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <!-- ==================== TAB 9: CHECKLISTS ==================== -->
          <mat-tab label="Checklists">
            <div class="tab-content">
              <div class="tab-toolbar">
                <h3>Checklists</h3>
                <div class="toolbar-actions">
                  <button mat-stroked-button matTooltip="Apply Template" (click)="showApplyTemplate = !showApplyTemplate" *ngIf="checklistTemplates.length > 0">
                    <mat-icon>content_copy</mat-icon> Apply Template
                  </button>
                  <button mat-raised-button matTooltip="Add Checklist" color="primary" (click)="showAddChecklist = !showAddChecklist">
                    <mat-icon>add</mat-icon> Add Checklist
                  </button>
                </div>
              </div>

              <!-- Apply Template -->
              @if (showApplyTemplate) {
                <mat-card class="inline-form-card">
                  <h4>Apply Template</h4>
                  <div class="template-list">
                    @for (tmpl of checklistTemplates; track tmpl.id) {
                      <div class="template-item">
                        <span>{{ tmpl.name }} ({{ tmpl.totalItems }} items)</span>
                        <button mat-stroked-button matTooltip="Apply" color="primary" (click)="applyTemplate(tmpl.id)">Apply</button>
                      </div>
                    }
                  </div>
                </mat-card>
              }

              <!-- Add Checklist Form -->
              @if (showAddChecklist) {
                <mat-card class="inline-form-card">
                  <h4>New Checklist</h4>
                  <div class="inline-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput [(ngModel)]="newChecklist.name">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Description</mat-label>
                      <input matInput [(ngModel)]="newChecklist.description">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Type</mat-label>
                      <mat-select [(ngModel)]="newChecklist.type">
                        <mat-option value="INITIATION">Initiation</mat-option>
                        <mat-option value="PLANNING">Planning</mat-option>
                        <mat-option value="EXECUTION">Execution</mat-option>
                        <mat-option value="CLOSING">Closing</mat-option>
                        <mat-option value="GENERAL">General</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <button mat-raised-button matTooltip="Save" color="primary" (click)="createChecklist()" [disabled]="!newChecklist.name">Save</button>
                    <button mat-button matTooltip="Cancel" (click)="showAddChecklist = false">Cancel</button>
                  </div>
                </mat-card>
              }

              <!-- Checklists -->
              @for (cl of checklists; track cl.id) {
                <mat-expansion-panel class="checklist-panel">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <span class="checklist-title">{{ cl.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description>
                      <mat-progress-bar mode="determinate" [value]="cl.completionPercentage" class="checklist-progress"></mat-progress-bar>
                      <span class="checklist-pct">{{ cl.completionPercentage }}%</span>
                      <span class="checklist-count">{{ cl.completedItems }}/{{ cl.totalItems }}</span>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="checklist-body">
                    @if (cl.description) {
                      <p class="checklist-desc">{{ cl.description }}</p>
                    }

                    <div class="checklist-items">
                      @for (item of cl.items; track item.id) {
                        <div class="checklist-item" [class.completed]="item.isCompleted">
                          <mat-checkbox [checked]="item.isCompleted" (change)="toggleItem(cl, item)">
                            <span [class.completed-text]="item.isCompleted">{{ item.name }}</span>
                          </mat-checkbox>
                          @if (item.isMandatory) {
                            <span class="mandatory-badge">Required</span>
                          }
                          @if (item.completedByName) {
                            <span class="completed-by">{{ item.completedByName }} - {{ item.completedAt | date:'short' }}</span>
                          }
                          <button mat-icon-button matTooltip="Close" color="warn" (click)="deleteItem(cl, item)" class="item-delete">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>

                    <!-- Add Item -->
                    <div class="add-item-row">
                      <mat-form-field appearance="outline" class="add-item-field">
                        <mat-label>New item</mat-label>
                        <input matInput [(ngModel)]="newItemNames[cl.id]" (keyup.enter)="addItem(cl)">
                      </mat-form-field>
                      <mat-checkbox [(ngModel)]="newItemMandatory[cl.id]">Required</mat-checkbox>
                      <button mat-icon-button matTooltip="Add" color="primary" (click)="addItem(cl)" [disabled]="!newItemNames[cl.id]">
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>

                    <div class="checklist-actions">
                      <button mat-button matTooltip="Edit Checklist" (click)="startChecklistEdit(cl)">
                        <mat-icon>edit</mat-icon> Edit Checklist
                      </button>
                      <button mat-button matTooltip="Delete Checklist" color="warn" (click)="deleteChecklist(cl)">
                        <mat-icon>delete</mat-icon> Delete Checklist
                      </button>
                    </div>

                    @if (editingChecklistId === cl.id) {
                      <div class="form-row" style="margin-top: 12px;">
                        <mat-form-field appearance="outline">
                          <mat-label>Name</mat-label>
                          <input matInput [(ngModel)]="editChecklistData.name">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Description</mat-label>
                          <input matInput [(ngModel)]="editChecklistData.description">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Type</mat-label>
                          <mat-select [(ngModel)]="editChecklistData.type">
                            <mat-option value="INITIATION">Initiation</mat-option>
                            <mat-option value="PLANNING">Planning</mat-option>
                            <mat-option value="EXECUTION">Execution</mat-option>
                            <mat-option value="CLOSING">Closing</mat-option>
                            <mat-option value="GENERAL">General</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <button mat-flat-button matTooltip="Save" color="primary" (click)="saveChecklistEdit()" [disabled]="!editChecklistData.name">Save</button>
                        <button mat-button matTooltip="Cancel" (click)="cancelChecklistEdit()">Cancel</button>
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              } @empty {
                <div class="empty-state">
                  <mat-icon>checklist</mat-icon>
                  <p>No checklists yet. Create one or apply a template.</p>
                </div>
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <h2>Project Not Found</h2>
          <p>The requested project could not be loaded.</p>
          <button mat-flat-button matTooltip="Back to Projects" color="primary" (click)="goBack()">Back to Projects</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .project-detail-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading & Error States */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      gap: 16px;
      color: #666;
    }
    .loading-overlay mat-progress-bar { width: 300px; }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 0;
      gap: 12px;
      color: #666;
    }
    .error-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }

    /* Header */
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-info h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    .project-code {
      font-size: 13px;
      color: #888;
      font-family: monospace;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Badges */
    .status-badge, .stage-badge, .status-chip, .priority-chip, .task-status-chip, .risk-level, .critical-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-draft, .status-badge.status-draft { background: #e3f2fd; color: #1565c0; }
    .status-pending, .status-pending_approval, .status-badge.status-pending { background: #fff3e0; color: #e65100; }
    .status-approved, .status-active, .status-badge.status-active, .status-badge.status-approved { background: #e8f5e9; color: #2e7d32; }
    .status-in_progress, .status-in-progress { background: #e3f2fd; color: #1565c0; }
    .status-completed, .status-done, .status-badge.status-completed { background: #e8f5e9; color: #2e7d32; }
    .status-on_hold, .status-badge.status-on_hold { background: #fff8e1; color: #f57f17; }
    .status-cancelled, .status-badge.status-cancelled { background: #fce4ec; color: #c62828; }
    .status-closed, .status-badge.status-closed { background: #f5f5f5; color: #616161; }
    .status-open { background: #e3f2fd; color: #1565c0; }
    .status-resolved { background: #e8f5e9; color: #2e7d32; }
    .status-identified { background: #fff3e0; color: #e65100; }
    .status-mitigated { background: #e8f5e9; color: #2e7d32; }
    .status-accepted { background: #e3f2fd; color: #1565c0; }
    .status-blocked { background: #fce4ec; color: #c62828; }

    .stage-badge { background: #ede7f6; color: #4527a0; }
    .stage-initiation { background: #e8eaf6; color: #283593; }
    .stage-planning { background: #e3f2fd; color: #1565c0; }
    .stage-execution { background: #fff3e0; color: #e65100; }
    .stage-monitoring { background: #fce4ec; color: #c62828; }
    .stage-closing { background: #e8f5e9; color: #2e7d32; }

    .priority-critical, .priority-urgent { background: #fce4ec; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #fff8e1; color: #f57f17; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }
    .priority-none { background: #f5f5f5; color: #757575; }

    .task-todo { background: #f5f5f5; color: #616161; }
    .task-in_progress { background: #e3f2fd; color: #1565c0; }
    .task-in_review { background: #ede7f6; color: #4527a0; }
    .task-blocked { background: #fce4ec; color: #c62828; }
    .task-done { background: #e8f5e9; color: #2e7d32; }
    .task-cancelled { background: #f5f5f5; color: #9e9e9e; }

    .risk-low { background: #e8f5e9; color: #2e7d32; }
    .risk-medium { background: #fff8e1; color: #f57f17; }
    .risk-high { background: #fff3e0; color: #e65100; }
    .risk-very_high, .risk-critical { background: #fce4ec; color: #c62828; }

    .critical-badge {
      background: #c62828;
      color: #fff;
      font-size: 9px;
      padding: 2px 6px;
      margin-left: 8px;
      border-radius: 4px;
    }

    /* Tab Content */
    .tab-content { padding: 24px 0; }

    .tab-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .tab-toolbar h3 { margin: 0; font-weight: 500; }

    /* Info Cards */
    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
    }
    .info-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .info-card-icon mat-icon { color: #fff; }
    .info-card-icon.status { background: #1565c0; }
    .info-card-icon.stage { background: #4527a0; }
    .info-card-icon.priority { background: #e65100; }
    .info-card-icon.dates { background: #00838f; }
    .info-card-icon.budget { background: #2e7d32; }
    .info-card-icon.completion { background: #6a1b9a; }

    .info-card-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .info-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 16px; font-weight: 500; }
    .info-value.small { font-size: 13px; }
    .info-sub { font-size: 12px; color: #888; }
    .info-card-content mat-progress-bar { margin-top: 4px; }

    /* Stage Progression */
    .stage-card { margin-bottom: 24px; }
    .stage-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
    }
    .stage-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .stage-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #757575;
      transition: all 0.3s;
    }
    .stage-step.active .stage-dot {
      background: #1565c0;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(21, 101, 192, 0.2);
    }
    .stage-step.completed .stage-dot {
      background: #2e7d32;
      color: #fff;
    }
    .stage-step.completed .stage-dot mat-icon { font-size: 20px; }
    .stage-label { font-size: 12px; color: #666; font-weight: 500; }
    .stage-step.active .stage-label { color: #1565c0; font-weight: 600; }
    .stage-step.completed .stage-label { color: #2e7d32; }
    .stage-connector {
      width: 60px;
      height: 2px;
      background: #e0e0e0;
      margin: 0 4px;
      margin-bottom: 24px;
    }
    .stage-connector.completed { background: #2e7d32; }

    /* Approval Card */
    .approval-card { margin-bottom: 24px; }
    .approval-card mat-card-title { display: flex; align-items: center; gap: 8px; }
    .approval-stepper { display: flex; flex-direction: column; gap: 8px; }
    .approval-step {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: 8px; border: 1px solid #e0e0e0; background: #fafafa;
    }
    .approval-step.current { border-color: #1565c0; background: #e3f2fd; }
    .approval-step.approved { border-color: #2e7d32; background: #e8f5e9; }
    .approval-step.rejected { border-color: #c62828; background: #fce4ec; }
    .approval-step.skipped { opacity: 0.5; }
    .approval-step-icon { flex-shrink: 0; }
    .step-icon.approved { color: #2e7d32; }
    .step-icon.rejected { color: #c62828; }
    .step-icon.current { color: #1565c0; }
    .step-icon.skipped { color: #9e9e9e; }
    .step-icon.pending { color: #bdbdbd; }
    .approval-step-info { display: flex; flex-direction: column; flex: 1; gap: 2px; }
    .approval-step-name { font-weight: 500; font-size: 14px; }
    .approval-step-level { font-size: 11px; color: #888; text-transform: uppercase; }
    .approval-step-date { font-size: 12px; color: #666; }
    .approval-step-comments { font-size: 12px; color: #555; font-style: italic; }
    .approval-step-status {
      font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px;
      text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;
    }
    .astatus-approved { background: #e8f5e9; color: #2e7d32; }
    .astatus-rejected { background: #fce4ec; color: #c62828; }
    .astatus-current { background: #e3f2fd; color: #1565c0; }
    .astatus-pending { background: #f5f5f5; color: #9e9e9e; }
    .astatus-skipped { background: #f5f5f5; color: #757575; }
    .approval-divider { margin: 16px 0; }
    .approval-actions { display: flex; flex-direction: column; gap: 12px; }
    .approval-comments-field { width: 100%; }
    .approval-buttons { display: flex; gap: 12px; }

    /* Detail Sections */
    .detail-sections {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .detail-card { margin-bottom: 0; }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .detail-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.3px; }
    .detail-value { font-size: 14px; color: #333; }
    .section-text { white-space: pre-wrap; color: #444; line-height: 1.6; margin: 0; }

    /* Edit Card */
    .edit-card { margin-bottom: 24px; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .form-grid .full-width { grid-column: 1 / -1; }

    /* Inline Forms */
    .inline-form { margin-bottom: 16px; }
    .form-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .form-row mat-form-field { flex: 1; min-width: 160px; }
    .form-row mat-checkbox { flex-shrink: 0; }

    /* Tables */
    .data-table {
      width: 100%;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      overflow: hidden;
    }
    .data-table th {
      background: #fafafa;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.3px;
    }
    .data-table td { font-size: 13px; }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
    }
    .progress-cell mat-progress-bar { flex: 1; }
    .progress-cell span { font-size: 12px; color: #666; white-space: nowrap; }

    /* Budget Summary Cards */
    .budget-summary-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .budget-summary-card {
      flex: 1;
      min-width: 180px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .budget-summary-card mat-icon { font-size: 28px; width: 28px; height: 28px; color: #1565c0; }
    .budget-summary-card.positive-variance mat-icon { color: #2e7d32; }
    .budget-summary-card.negative-variance mat-icon { color: #c62828; }
    .budget-summary-info { display: flex; flex-direction: column; }
    .budget-summary-label { font-size: 11px; color: #999; text-transform: uppercase; }
    .budget-summary-value { font-size: 18px; font-weight: 600; }

    /* Budget Table */
    .budget-table .inline-edit-field { width: 100%; }
    .budget-table .inline-edit-field.narrow { max-width: 120px; }
    .budget-line-notes { font-size: 11px; color: #888; margin-top: 2px; }
    .category-chip { font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #e3f2fd; color: #1565c0; }
    .muted-text { color: #ccc; }
    .editing-row { background: #fffde7 !important; }
    .inline-edit-actions { display: flex; align-items: center; gap: 4px; }
    .adjustment-notes-field { min-width: 160px; }
    .detail-row { height: 0; }
    .detail-row td { padding: 0 !important; border: none !important; }

    /* Adjustment History Panel */
    .adjustment-history-panel {
      padding: 16px 24px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }
    .adjustment-history-panel h4 { margin: 0 0 12px 0; font-size: 14px; color: #333; }
    .adjustment-timeline { display: flex; flex-direction: column; gap: 10px; }
    .adjustment-entry {
      padding: 10px 12px;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #e8e8e8;
    }
    .adjustment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .adjustment-type-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
    }
    .adj-type-initial { background: #e8f5e9; color: #2e7d32; }
    .adj-type-increase { background: #e3f2fd; color: #1565c0; }
    .adj-type-decrease { background: #fce4ec; color: #c62828; }
    .adj-type-reallocation { background: #fff3e0; color: #e65100; }
    .adj-type-correction { background: #f3e5f5; color: #7b1fa2; }
    .adjustment-date { font-size: 12px; color: #888; }
    .adjustment-by { font-size: 12px; color: #aaa; }
    .adjustment-details { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; }
    .adj-change { color: #555; }
    .adj-amount { font-weight: 500; }
    .adjustment-notes { font-size: 12px; color: #666; margin-top: 6px; font-style: italic; }

    /* Category Breakdown */
    .category-breakdown { margin-top: 20px; padding: 16px; background: #fafafa; border-radius: 8px; border: 1px solid #e8e8e8; }
    .category-breakdown h4 { margin: 0 0 12px 0; font-size: 14px; color: #333; }
    .category-row { margin-bottom: 12px; }
    .category-info { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .category-name { font-size: 13px; font-weight: 500; }
    .category-amounts { font-size: 12px; color: #888; }

    /* Budget Totals */
    .budget-totals {
      display: flex;
      justify-content: flex-end;
      gap: 32px;
      padding: 20px 16px;
      margin-top: 8px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
    }
    .total-item { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .total-label { font-size: 11px; color: #999; text-transform: uppercase; }
    .total-value { font-size: 18px; font-weight: 600; }
    .positive-variance { color: #2e7d32; }
    .negative-variance { color: #c62828; }

    /* Milestones */
    .milestone-item { height: auto !important; min-height: 64px; }
    .milestone-title { display: flex; align-items: center; }
    .milestone-date { font-size: 12px; color: #888; margin-left: 12px; }
    .critical mat-icon, mat-icon.critical { color: #c62828; }

    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 40px;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 20px;
    }
    .timeline-dot {
      position: absolute;
      left: -40px;
      top: 16px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #1565c0;
      border: 3px solid #e3f2fd;
      z-index: 1;
    }
    .timeline-connector {
      position: absolute;
      left: -34px;
      top: 30px;
      bottom: -20px;
      width: 2px;
      background: #e0e0e0;
    }
    .timeline-item:last-child .timeline-connector { display: none; }
    .timeline-card { margin-left: 0; }
    .timeline-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .timeline-date { font-size: 13px; font-weight: 500; color: #333; }
    .timeline-user { font-size: 12px; color: #888; }
    .transition-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .transition-row .label { font-size: 12px; color: #888; min-width: 50px; }
    .transition-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #999; }
    .timeline-reason { font-size: 13px; color: #666; font-style: italic; margin: 8px 0 0; }

    /* Empty States */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      gap: 8px;
      color: #999;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ddd; }

    /* Checklists */
    .checklist-panel { margin-bottom: 8px; }
    .checklist-title { font-weight: 500; }
    .checklist-progress { width: 120px; margin: 0 12px; }
    .checklist-pct { font-size: 13px; font-weight: 500; min-width: 40px; }
    .checklist-count { font-size: 12px; color: #666; margin-left: 8px; }
    .checklist-desc { font-size: 13px; color: #666; margin: 0 0 12px; }
    .checklist-items { display: flex; flex-direction: column; gap: 4px; }
    .checklist-item {
      display: flex; align-items: center; gap: 8px; padding: 4px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .checklist-item.completed { opacity: 0.7; }
    .completed-text { text-decoration: line-through; }
    .mandatory-badge { font-size: 10px; background: #fff3e0; color: #e65100; padding: 2px 6px; border-radius: 8px; }
    .completed-by { font-size: 11px; color: #999; margin-left: auto; }
    .item-delete { margin-left: auto; }
    .add-item-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .add-item-field { flex: 1; }
    .checklist-actions { margin-top: 12px; display: flex; justify-content: flex-end; }
    .template-list { display: flex; flex-direction: column; gap: 8px; }
    .template-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; }

    /* Responsive */
    @media (max-width: 768px) {
      .project-detail-container { padding: 12px; }
      .detail-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .header-right { align-self: flex-end; }
      .info-cards { grid-template-columns: 1fr 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; }
      .form-row mat-form-field { min-width: 100%; }
      .budget-totals { flex-direction: column; align-items: flex-end; gap: 12px; }
      .stage-progress { flex-wrap: wrap; }
      .stage-connector { width: 30px; }
    }

    @media (max-width: 480px) {
      .info-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  // Users for team member dropdown
  users: any[] = [];

  // Data
  project: ProjectDTO | null = null;
  tasks: ProjectTaskDTO[] = [];
  teamMembers: ProjectTeamMemberDTO[] = [];
  budgetLines: ProjectBudgetLineDTO[] = [];
  milestones: ProjectMilestoneDTO[] = [];
  risks: ProjectRiskDTO[] = [];
  issues: ProjectIssueDTO[] = [];
  statusHistory: ProjectStatusHistoryDTO[] = [];
  checklists: ProjectChecklistDTO[] = [];
  checklistTemplates: ProjectChecklistDTO[] = [];
  recentActivities: ProjectActivityDTO[] = [];

  // Checklist UI state
  showAddChecklist = false;
  showApplyTemplate = false;
  newChecklist: Partial<ProjectChecklistDTO> = { type: 'GENERAL' };
  newItemNames: { [checklistId: string]: string } = {};
  newItemMandatory: { [checklistId: string]: boolean } = {};

  // State
  loading = true;
  editMode = false;
  projectId = '';
  editData: Partial<ProjectDTO> = {};

  // Tab data loaded flags
  tabsLoaded: { [key: number]: boolean } = { 0: false };

  // Auto edit mode from query param
  pendingEditMode = false;

  // Approval
  approvalComments = '';

  // Inline form toggles
  showAddTask = false;
  showAddMember = false;
  showAddBudget = false;
  editingBudgetLineId: string | null = null;
  editBudgetData: Partial<ProjectBudgetLineDTO> = {};
  editingTaskId: string | null = null;
  editTaskData: Partial<ProjectTaskDTO> = {};
  expandedAdjustmentLineId: string | null = null;
  showAddMilestone = false;
  showAddRisk = false;
  showAddIssue = false;

  // New item models
  newTask: Partial<ProjectTaskDTO> = { priority: 'MEDIUM', status: 'TODO' };
  newMember: Partial<ProjectTeamMemberDTO> = { role: 'MEMBER', allocationPercentage: 100 };
  newBudgetLine: Partial<ProjectBudgetLineDTO> = { estimatedAmount: 0, actualAmount: 0, committedAmount: 0 };
  newMilestone: Partial<ProjectMilestoneDTO> = { isCritical: false };
  newRisk: Partial<ProjectRiskDTO> = { probability: 'MEDIUM', impact: 'MEDIUM', status: 'IDENTIFIED' };
  newIssue: Partial<ProjectIssueDTO> = { priority: 'MEDIUM', status: 'OPEN' };

  // Column definitions
  taskColumns = ['name', 'status', 'priority', 'assignee', 'dueDate', 'completion', 'actions'];
  teamColumns = ['name', 'email', 'role', 'allocation', 'joinDate', 'actions'];
  budgetColumns = ['name', 'category', 'estimated', 'actual', 'committed', 'variance', 'variancePct', 'adjustments', 'actions'];
  riskColumns = ['title', 'probability', 'impact', 'status', 'owner', 'category', 'actions'];
  issueColumns = ['title', 'priority', 'status', 'assignee', 'reportedDate', 'dueDate', 'actions'];

  // Reference data
  stages = ['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSING'];
  priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'CANCELLED'];
  teamRoles = ['PROJECT_MANAGER', 'LEAD', 'MEMBER', 'STAKEHOLDER', 'CONSULTANT'];
  budgetCategories = ['LABOR', 'MATERIALS', 'EQUIPMENT', 'SOFTWARE', 'TRAVEL', 'TRAINING', 'CONTINGENCY', 'OTHER'];
  riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
  riskStatuses = ['IDENTIFIED', 'ANALYZING', 'MITIGATING', 'RESOLVED', 'ACCEPTED', 'CLOSED'];
  issueStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
  milestoneStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'];

  // Project categories for dropdown
  projectCategories: ProjectCategoryDTO[] = [];

  // Risk/Issue categories
  riskCategories: RiskIssueCategoryDTO[] = [];
  issueCategories: RiskIssueCategoryDTO[] = [];

  // Inline edit state
  editingMemberId: string | null = null;
  editMemberData: Partial<ProjectTeamMemberDTO> = {};
  editingMilestoneId: string | null = null;
  editMilestoneData: Partial<ProjectMilestoneDTO> = {};
  editingRiskId: string | null = null;
  editRiskData: Partial<ProjectRiskDTO> = {};
  editingIssueId: string | null = null;
  editIssueData: Partial<ProjectIssueDTO> = {};
  editingChecklistId: string | null = null;
  editChecklistData: Partial<ProjectChecklistDTO> = {};

  constructor(
    private projectService: ProjectService,
    private taskService: ProjectTaskService,
    private categoryService: ProjectCategoryService,
    private riCategoryService: RiskIssueCategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      this.loadProject();
    });
    this.route.queryParams.subscribe(qp => {
      if (qp['edit'] === 'true') {
        this.pendingEditMode = true;
      }
    });
    this.loadUsers();
    this.loadProjectCategories();
    this.loadRiskIssueCategories();
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

  loadRiskIssueCategories(): void {
    this.riCategoryService.getByType('RISK').subscribe({
      next: (res: any) => { if (res.success) this.riskCategories = res.data || []; },
      error: () => console.error('Failed to load risk categories')
    });
    this.riCategoryService.getByType('ISSUE').subscribe({
      next: (res: any) => { if (res.success) this.issueCategories = res.data || []; },
      error: () => console.error('Failed to load issue categories')
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

  loadProject(): void {
    this.loading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data;
        this.loading = false;
        this.tabsLoaded[0] = true;
        if (this.pendingEditMode && this.project) {
          this.pendingEditMode = false;
          this.editData = { ...this.project };
          this.editMode = true;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
      }
    });
  }

  onTabChange(event: any): void {
    const index = event.index;
    if (this.tabsLoaded[index]) return;

    switch (index) {
      case 1: this.loadTasks(); break;
      case 2: this.loadTeam(); break;
      case 3: this.loadBudget(); break;
      case 4: this.loadMilestones(); break;
      case 5: this.loadRisks(); break;
      case 6: this.loadIssues(); break;
      case 7: this.loadHistory(); break;
      case 8: this.loadChecklists(); break;
    }
    this.tabsLoaded[index] = true;
  }

  loadTasks(): void {
    this.taskService.getTasks(this.projectId).subscribe({
      next: (res: any) => this.tasks = res.data || [],
      error: () => this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 })
    });
  }

  loadTeam(): void {
    this.projectService.getTeamMembers(this.projectId).subscribe({
      next: (res: any) => this.teamMembers = res.data || [],
      error: () => this.snackBar.open('Failed to load team', 'Close', { duration: 3000 })
    });
  }

  loadBudget(): void {
    this.projectService.getBudgetLines(this.projectId).subscribe({
      next: (res: any) => this.budgetLines = res.data || [],
      error: () => this.snackBar.open('Failed to load budget', 'Close', { duration: 3000 })
    });
  }

  loadMilestones(): void {
    this.projectService.getMilestones(this.projectId).subscribe({
      next: (res: any) => this.milestones = res.data || [],
      error: () => this.snackBar.open('Failed to load milestones', 'Close', { duration: 3000 })
    });
  }

  loadRisks(): void {
    this.projectService.getRisks(this.projectId).subscribe({
      next: (res: any) => this.risks = res.data || [],
      error: () => this.snackBar.open('Failed to load risks', 'Close', { duration: 3000 })
    });
  }

  loadIssues(): void {
    this.projectService.getIssues(this.projectId).subscribe({
      next: (res: any) => this.issues = res.data || [],
      error: () => this.snackBar.open('Failed to load issues', 'Close', { duration: 3000 })
    });
  }

  loadHistory(): void {
    this.projectService.getStatusHistory(this.projectId).subscribe({
      next: (res: any) => this.statusHistory = res.data || [],
      error: () => this.snackBar.open('Failed to load history', 'Close', { duration: 3000 })
    });
  }

  // ==================== PROJECT ACTIONS ====================

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  toggleEditMode(): void {
    if (!this.editMode && this.project) {
      this.editData = { ...this.project };
    }
    this.editMode = !this.editMode;
  }

  saveProject(): void {
    const payload: any = {
      name: this.editData.name,
      description: this.editData.description,
      priority: this.editData.priority,
      category: this.editData.category,
      startDate: this.editData.startDate,
      endDate: this.editData.endDate,
      actualStartDate: this.editData.actualStartDate,
      actualEndDate: this.editData.actualEndDate,
      estimatedBudget: this.editData.estimatedBudget,
      managerId: this.editData.managerId,
      sponsorId: this.editData.sponsorId,
      sbuId: this.editData.sbuId,
      completionPercentage: this.editData.completionPercentage,
      notes: this.editData.notes,
      objectives: this.editData.objectives,
      scope: this.editData.scope,
      deliverables: this.editData.deliverables,
      assumptions: this.editData.assumptions,
      constraints: this.editData.constraints
    };
    this.projectService.updateProject(this.projectId, payload).subscribe({
      next: (res: any) => {
        this.project = res.data;
        this.editMode = false;
        this.snackBar.open('Project updated successfully', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update project', 'Close', { duration: 3000 })
    });
  }

  submitForApproval(): void {
    this.projectService.submitForApproval(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data;
        this.snackBar.open('Project submitted for approval', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to submit project', 'Close', { duration: 3000 })
    });
  }

  processApproval(action: string): void {
    this.projectService.processApproval(this.projectId, action, this.approvalComments || undefined).subscribe({
      next: (res: any) => {
        this.project = res.data;
        this.approvalComments = '';
        this.snackBar.open(action === 'APPROVED' ? 'Project approved' : 'Project rejected', 'Close', { duration: 3000 });
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to process approval';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  transitionStage(targetStage: string): void {
    this.projectService.transitionStage(this.projectId, targetStage).subscribe({
      next: (res: any) => {
        this.project = res.data;
        this.snackBar.open(`Project moved to ${targetStage}`, 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to transition stage', 'Close', { duration: 3000 })
    });
  }

  getStageIndex(stage: string): number {
    return this.stages.indexOf(stage);
  }

  getNextStages(): string[] {
    if (!this.project) return [];
    const currentIndex = this.getStageIndex(this.project.stage);
    if (currentIndex < 0 || currentIndex >= this.stages.length - 1) return [];
    return [this.stages[currentIndex + 1]];
  }

  // ==================== TASK ACTIONS ====================

  addTask(): void {
    this.taskService.createTask(this.projectId, this.newTask).subscribe({
      next: (res: any) => {
        this.tasks = [...this.tasks, res.data];
        this.newTask = { priority: 'MEDIUM', status: 'TODO' };
        this.showAddTask = false;
        this.snackBar.open('Task added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add task', 'Close', { duration: 3000 })
    });
  }

  updateTaskStatus(task: ProjectTaskDTO, status: string): void {
    this.taskService.updateTask(this.projectId, task.id, { status }).subscribe({
      next: (res: any) => {
        const idx = this.tasks.findIndex(t => t.id === task.id);
        if (idx >= 0) {
          this.tasks[idx] = res.data;
          this.tasks = [...this.tasks];
        }
        this.snackBar.open(`Task set to ${status}`, 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update task', 'Close', { duration: 3000 })
    });
  }

  startTaskEdit(task: ProjectTaskDTO): void {
    this.editingTaskId = task.id;
    this.editTaskData = {
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      startDate: task.startDate,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      completionPercentage: task.completionPercentage,
      milestoneId: task.milestoneId || '',
      tags: task.tags,
      isCriticalPath: task.isCriticalPath
    };
    // Ensure milestones are loaded for dropdown
    if (this.milestones.length === 0) {
      this.projectService.getMilestones(this.projectId).subscribe({
        next: (res: any) => this.milestones = res.data || []
      });
    }
  }

  cancelTaskEdit(): void {
    this.editingTaskId = null;
    this.editTaskData = {};
  }

  saveTaskEdit(): void {
    if (!this.editingTaskId) return;
    const payload = { ...this.editTaskData };
    // Clear empty string IDs so backend treats them as null
    if (!payload.assigneeId) delete payload.assigneeId;
    if (!payload.milestoneId) delete payload.milestoneId;
    this.taskService.updateTask(this.projectId, this.editingTaskId, payload).subscribe({
      next: (res: any) => {
        const idx = this.tasks.findIndex(t => t.id === this.editingTaskId);
        if (idx >= 0) {
          this.tasks[idx] = res.data;
          this.tasks = [...this.tasks];
        }
        this.editingTaskId = null;
        this.editTaskData = {};
        this.snackBar.open('Task updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update task', 'Close', { duration: 3000 })
    });
  }

  deleteTask(task: ProjectTaskDTO): void {
    const ref = this.snackBar.open(`Delete task "${task.name}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.taskService.deleteTask(this.projectId, task.id).subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 })
      });
    });
  }

  // ==================== TEAM ACTIONS ====================

  addTeamMember(): void {
    this.projectService.addTeamMember(this.projectId, this.newMember).subscribe({
      next: (res: any) => {
        this.teamMembers = [...this.teamMembers, res.data];
        this.newMember = { role: 'MEMBER', allocationPercentage: 100 };
        this.showAddMember = false;
        this.snackBar.open('Team member added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add team member', 'Close', { duration: 3000 })
    });
  }

  startMemberEdit(member: ProjectTeamMemberDTO): void {
    this.editingMemberId = member.id;
    this.editMemberData = {
      role: member.role,
      allocationPercentage: member.allocationPercentage,
      responsibilities: member.responsibilities || ''
    };
  }

  cancelMemberEdit(): void {
    this.editingMemberId = null;
    this.editMemberData = {};
  }

  saveMemberEdit(): void {
    if (!this.editingMemberId) return;
    this.projectService.updateTeamMember(this.projectId, this.editingMemberId, this.editMemberData).subscribe({
      next: (res: any) => {
        const idx = this.teamMembers.findIndex(m => m.id === this.editingMemberId);
        if (idx >= 0) {
          this.teamMembers[idx] = res.data;
          this.teamMembers = [...this.teamMembers];
        }
        this.editingMemberId = null;
        this.editMemberData = {};
        this.snackBar.open('Team member updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update team member', 'Close', { duration: 3000 })
    });
  }

  removeTeamMember(member: ProjectTeamMemberDTO): void {
    const ref = this.snackBar.open(`Remove ${member.userName} from team?`, 'Remove', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.removeTeamMember(this.projectId, member.id).subscribe({
        next: () => {
          this.teamMembers = this.teamMembers.filter(m => m.id !== member.id);
          this.snackBar.open('Member removed', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to remove member', 'Close', { duration: 3000 })
      });
    });
  }

  // ==================== BUDGET ACTIONS ====================

  addBudgetLine(): void {
    this.projectService.createBudgetLine(this.projectId, this.newBudgetLine).subscribe({
      next: (res: any) => {
        this.budgetLines = [...this.budgetLines, res.data];
        this.newBudgetLine = { estimatedAmount: 0, actualAmount: 0, committedAmount: 0 };
        this.showAddBudget = false;
        this.snackBar.open('Budget line added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add budget line', 'Close', { duration: 3000 })
    });
  }

  startBudgetLineEdit(line: ProjectBudgetLineDTO): void {
    this.editingBudgetLineId = line.id;
    this.editBudgetData = {
      name: line.name,
      category: line.category,
      estimatedAmount: line.estimatedAmount,
      actualAmount: line.actualAmount,
      committedAmount: line.committedAmount,
      forecastAmount: line.forecastAmount,
      notes: line.notes,
      adjustmentNotes: ''
    };
  }

  cancelBudgetLineEdit(): void {
    this.editingBudgetLineId = null;
    this.editBudgetData = {};
  }

  saveBudgetLineEdit(line: ProjectBudgetLineDTO): void {
    this.projectService.updateBudgetLine(this.projectId, line.id, this.editBudgetData).subscribe({
      next: (res: any) => {
        const idx = this.budgetLines.findIndex(b => b.id === line.id);
        if (idx >= 0) this.budgetLines[idx] = res.data;
        this.budgetLines = [...this.budgetLines];
        this.editingBudgetLineId = null;
        this.editBudgetData = {};
        this.snackBar.open('Budget line updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update budget line', 'Close', { duration: 3000 })
    });
  }

  toggleAdjustmentHistory(line: ProjectBudgetLineDTO): void {
    if (this.expandedAdjustmentLineId === line.id) {
      this.expandedAdjustmentLineId = null;
    } else {
      this.expandedAdjustmentLineId = line.id;
      // Load adjustments if not already loaded
      if (!line.adjustments || line.adjustments.length === 0) {
        this.projectService.getBudgetAdjustments(this.projectId, line.id).subscribe({
          next: (res: any) => {
            const idx = this.budgetLines.findIndex(b => b.id === line.id);
            if (idx >= 0) {
              this.budgetLines[idx] = { ...this.budgetLines[idx], adjustments: res.data || [] };
              this.budgetLines = [...this.budgetLines];
            }
          }
        });
      }
    }
  }

  deleteBudgetLine(line: ProjectBudgetLineDTO): void {
    const ref = this.snackBar.open(`Delete budget line "${line.name}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.deleteBudgetLine(this.projectId, line.id).subscribe({
        next: () => {
          this.budgetLines = this.budgetLines.filter(b => b.id !== line.id);
          this.snackBar.open('Budget line deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete budget line', 'Close', { duration: 3000 })
      });
    });
  }

  getBudgetTotal(field: string): number {
    return this.budgetLines.reduce((sum, b) => sum + ((b as any)[field] || 0), 0);
  }

  getBudgetCategories(): string[] {
    const cats = new Set(this.budgetLines.map(b => b.category).filter(c => c));
    return Array.from(cats);
  }

  getCategoryTotal(category: string, field: string): number {
    return this.budgetLines
      .filter(b => b.category === category)
      .reduce((sum, b) => sum + ((b as any)[field] || 0), 0);
  }

  getCategoryProgress(category: string): number {
    const estimated = this.getCategoryTotal(category, 'estimatedAmount');
    const actual = this.getCategoryTotal(category, 'actualAmount');
    return estimated > 0 ? (actual / estimated) * 100 : 0;
  }

  // ==================== MILESTONE ACTIONS ====================

  addMilestone(): void {
    this.projectService.createMilestone(this.projectId, this.newMilestone).subscribe({
      next: (res: any) => {
        this.milestones = [...this.milestones, res.data];
        this.newMilestone = { isCritical: false };
        this.showAddMilestone = false;
        this.snackBar.open('Milestone added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add milestone', 'Close', { duration: 3000 })
    });
  }

  startMilestoneEdit(ms: ProjectMilestoneDTO): void {
    this.editingMilestoneId = ms.id;
    this.editMilestoneData = {
      name: ms.name,
      description: ms.description || '',
      status: ms.status,
      dueDate: ms.dueDate,
      ownerId: ms.ownerId || '',
      isCritical: ms.isCritical
    };
  }

  cancelMilestoneEdit(): void {
    this.editingMilestoneId = null;
    this.editMilestoneData = {};
  }

  saveMilestoneEdit(): void {
    if (!this.editingMilestoneId) return;
    const payload = { ...this.editMilestoneData };
    if (!payload.ownerId) delete payload.ownerId;
    this.projectService.updateMilestone(this.projectId, this.editingMilestoneId, payload).subscribe({
      next: (res: any) => {
        const idx = this.milestones.findIndex(m => m.id === this.editingMilestoneId);
        if (idx >= 0) {
          this.milestones[idx] = res.data;
          this.milestones = [...this.milestones];
        }
        this.editingMilestoneId = null;
        this.editMilestoneData = {};
        this.snackBar.open('Milestone updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update milestone', 'Close', { duration: 3000 })
    });
  }

  deleteMilestone(ms: ProjectMilestoneDTO): void {
    const ref = this.snackBar.open(`Delete milestone "${ms.name}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.deleteMilestone(this.projectId, ms.id).subscribe({
        next: () => {
          this.milestones = this.milestones.filter(m => m.id !== ms.id);
          this.snackBar.open('Milestone deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete milestone', 'Close', { duration: 3000 })
      });
    });
  }

  // ==================== RISK ACTIONS ====================

  addRisk(): void {
    this.projectService.createRisk(this.projectId, this.newRisk).subscribe({
      next: (res: any) => {
        this.risks = [...this.risks, res.data];
        this.newRisk = { probability: 'MEDIUM', impact: 'MEDIUM', status: 'IDENTIFIED' };
        this.showAddRisk = false;
        this.snackBar.open('Risk added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add risk', 'Close', { duration: 3000 })
    });
  }

  startRiskEdit(risk: ProjectRiskDTO): void {
    this.editingRiskId = risk.id;
    this.editRiskData = {
      title: risk.title,
      description: risk.description || '',
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      ownerId: risk.ownerId || '',
      categoryId: risk.categoryId || '',
      mitigationPlan: risk.mitigationPlan || '',
      contingencyPlan: risk.contingencyPlan || ''
    };
  }

  cancelRiskEdit(): void {
    this.editingRiskId = null;
    this.editRiskData = {};
  }

  saveRiskEdit(): void {
    if (!this.editingRiskId) return;
    const payload = { ...this.editRiskData };
    if (!payload.ownerId) delete payload.ownerId;
    if (!payload.categoryId) delete payload.categoryId;
    this.projectService.updateRisk(this.projectId, this.editingRiskId, payload).subscribe({
      next: (res: any) => {
        const idx = this.risks.findIndex(r => r.id === this.editingRiskId);
        if (idx >= 0) {
          this.risks[idx] = res.data;
          this.risks = [...this.risks];
        }
        this.editingRiskId = null;
        this.editRiskData = {};
        this.snackBar.open('Risk updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update risk', 'Close', { duration: 3000 })
    });
  }

  deleteRisk(risk: ProjectRiskDTO): void {
    const ref = this.snackBar.open(`Delete risk "${risk.title}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.deleteRisk(this.projectId, risk.id).subscribe({
        next: () => {
          this.risks = this.risks.filter(r => r.id !== risk.id);
          this.snackBar.open('Risk deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete risk', 'Close', { duration: 3000 })
      });
    });
  }

  // ==================== ISSUE ACTIONS ====================

  addIssue(): void {
    this.projectService.createIssue(this.projectId, this.newIssue).subscribe({
      next: (res: any) => {
        this.issues = [...this.issues, res.data];
        this.newIssue = { priority: 'MEDIUM', status: 'OPEN' };
        this.showAddIssue = false;
        this.snackBar.open('Issue added', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to add issue', 'Close', { duration: 3000 })
    });
  }

  startIssueEdit(issue: ProjectIssueDTO): void {
    this.editingIssueId = issue.id;
    this.editIssueData = {
      title: issue.title,
      description: issue.description || '',
      priority: issue.priority,
      status: issue.status,
      assigneeId: issue.assigneeId || '',
      categoryId: issue.categoryId || '',
      dueDate: issue.dueDate,
      resolution: issue.resolution || ''
    };
  }

  cancelIssueEdit(): void {
    this.editingIssueId = null;
    this.editIssueData = {};
  }

  saveIssueEdit(): void {
    if (!this.editingIssueId) return;
    const payload = { ...this.editIssueData };
    if (!payload.assigneeId) delete payload.assigneeId;
    if (!payload.categoryId) delete payload.categoryId;
    this.projectService.updateIssue(this.projectId, this.editingIssueId, payload).subscribe({
      next: (res: any) => {
        const idx = this.issues.findIndex(i => i.id === this.editingIssueId);
        if (idx >= 0) {
          this.issues[idx] = res.data;
          this.issues = [...this.issues];
        }
        this.editingIssueId = null;
        this.editIssueData = {};
        this.snackBar.open('Issue updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update issue', 'Close', { duration: 3000 })
    });
  }

  deleteIssue(issue: ProjectIssueDTO): void {
    const ref = this.snackBar.open(`Delete issue "${issue.title}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.deleteIssue(this.projectId, issue.id).subscribe({
        next: () => {
          this.issues = this.issues.filter(i => i.id !== issue.id);
          this.snackBar.open('Issue deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete issue', 'Close', { duration: 3000 })
      });
    });
  }

  // ==================== CHECKLIST ACTIONS ====================

  loadChecklists(): void {
    this.projectService.getChecklists(this.projectId).subscribe({
      next: (res: any) => this.checklists = res.data || [],
      error: () => this.snackBar.open('Failed to load checklists', 'Close', { duration: 3000 })
    });
    this.projectService.getTemplateChecklists(this.projectId).subscribe({
      next: (res: any) => this.checklistTemplates = res.data || [],
      error: () => {}
    });
  }

  createChecklist(): void {
    this.projectService.createChecklist(this.projectId, this.newChecklist).subscribe({
      next: (res: any) => {
        this.checklists = [...this.checklists, res.data];
        this.newChecklist = { type: 'GENERAL' };
        this.showAddChecklist = false;
        this.snackBar.open('Checklist created', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to create checklist', 'Close', { duration: 3000 })
    });
  }

  deleteChecklist(cl: ProjectChecklistDTO): void {
    const ref = this.snackBar.open(`Delete checklist "${cl.name}"?`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.projectService.deleteChecklist(this.projectId, cl.id).subscribe({
        next: () => {
          this.checklists = this.checklists.filter(c => c.id !== cl.id);
          this.snackBar.open('Checklist deleted', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete checklist', 'Close', { duration: 3000 })
      });
    });
  }

  startChecklistEdit(cl: ProjectChecklistDTO): void {
    this.editingChecklistId = cl.id;
    this.editChecklistData = {
      name: cl.name,
      description: cl.description || '',
      type: cl.type || 'GENERAL'
    };
  }

  cancelChecklistEdit(): void {
    this.editingChecklistId = null;
    this.editChecklistData = {};
  }

  saveChecklistEdit(): void {
    if (!this.editingChecklistId) return;
    this.projectService.updateChecklist(this.projectId, this.editingChecklistId, this.editChecklistData).subscribe({
      next: (res: any) => {
        const idx = this.checklists.findIndex(c => c.id === this.editingChecklistId);
        if (idx >= 0) {
          this.checklists[idx] = { ...this.checklists[idx], ...res.data };
          this.checklists = [...this.checklists];
        }
        this.editingChecklistId = null;
        this.editChecklistData = {};
        this.snackBar.open('Checklist updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update checklist', 'Close', { duration: 3000 })
    });
  }

  addItem(cl: ProjectChecklistDTO): void {
    const name = this.newItemNames[cl.id];
    if (!name) return;
    const mandatory = this.newItemMandatory[cl.id] || false;
    this.projectService.addChecklistItem(this.projectId, cl.id, { name, isMandatory: mandatory }).subscribe({
      next: () => {
        this.newItemNames[cl.id] = '';
        this.newItemMandatory[cl.id] = false;
        this.loadChecklists();
      },
      error: () => this.snackBar.open('Failed to add item', 'Close', { duration: 3000 })
    });
  }

  toggleItem(cl: ProjectChecklistDTO, item: ProjectChecklistItemDTO): void {
    this.projectService.toggleChecklistItem(this.projectId, cl.id, item.id).subscribe({
      next: () => this.loadChecklists(),
      error: () => this.snackBar.open('Failed to toggle item', 'Close', { duration: 3000 })
    });
  }

  deleteItem(cl: ProjectChecklistDTO, item: ProjectChecklistItemDTO): void {
    this.projectService.deleteChecklistItem(this.projectId, cl.id, item.id).subscribe({
      next: () => this.loadChecklists(),
      error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
    });
  }

  applyTemplate(templateId: string): void {
    this.projectService.applyTemplate(this.projectId, templateId).subscribe({
      next: () => {
        this.showApplyTemplate = false;
        this.loadChecklists();
        this.snackBar.open('Template applied', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to apply template', 'Close', { duration: 3000 })
    });
  }

  // ==================== ACTIVITY ====================

  loadActivities(): void {
    this.projectService.getActivities(this.projectId).subscribe({
      next: (res: any) => this.recentActivities = (res.data || []).slice(0, 10),
      error: () => {}
    });
  }

  exportProject(format: 'excel' | 'pdf') {
    if (!this.project) return;
    if (format === 'excel') {
      this.exportProjectExcel();
    } else {
      this.exportProjectPdf();
    }
  }

  private exportProjectExcel() {
    const p = this.project!;
    const rows: string[][] = [];

    rows.push([p.name + ' (' + p.code + ')']);
    rows.push([]);

    // Project Details
    rows.push(['Project Details']);
    rows.push(['Field', 'Value']);
    rows.push(['Code', p.code]);
    rows.push(['Name', p.name]);
    rows.push(['Status', p.status]);
    rows.push(['Stage', p.stage]);
    rows.push(['Priority', p.priority]);
    rows.push(['Category', p.categoryCode || '-']);
    rows.push(['Manager', p.managerName || '-']);
    rows.push(['Sponsor', p.sponsorName || '-']);
    rows.push(['SBU', p.sbuName || '-']);
    rows.push(['Start Date', p.startDate || '-']);
    rows.push(['End Date', p.endDate || '-']);
    rows.push(['Actual Start', p.actualStartDate || '-']);
    rows.push(['Actual End', p.actualEndDate || '-']);
    rows.push(['Estimated Budget', String(p.estimatedBudget || 0)]);
    rows.push(['Actual Cost', String(p.actualCost || 0)]);
    rows.push(['Completion', (p.completionPercentage || 0) + '%']);
    if (p.description) rows.push(['Description', p.description]);
    if (p.objectives) rows.push(['Objectives', p.objectives]);
    if (p.scope) rows.push(['Scope', p.scope]);
    rows.push([]);

    // Tasks
    if (this.tasks.length) {
      rows.push(['Tasks']);
      rows.push(['Name', 'Status', 'Priority', 'Assignee', 'Start Date', 'Due Date', 'Completion']);
      this.tasks.forEach(t => rows.push([
        t.name, t.status, t.priority || '-', t.assigneeName || '-',
        t.startDate || '-', t.dueDate || '-', (t.completionPercentage || 0) + '%'
      ]));
      rows.push([]);
    }

    // Team Members
    if (this.teamMembers.length) {
      rows.push(['Team Members']);
      rows.push(['Name', 'Role', 'Email']);
      this.teamMembers.forEach(m => rows.push([m.userName || '-', m.role || '-', m.userEmail || '-']));
      rows.push([]);
    }

    // Budget Lines
    if (this.budgetLines.length) {
      rows.push(['Budget Lines']);
      rows.push(['Category', 'Description', 'Estimated', 'Actual', 'Variance']);
      this.budgetLines.forEach(b => rows.push([
        b.category || '-', b.description || '-',
        String(b.estimatedAmount || 0), String(b.actualAmount || 0),
        String((b.estimatedAmount || 0) - (b.actualAmount || 0))
      ]));
      rows.push([]);
    }

    // Milestones
    if (this.milestones.length) {
      rows.push(['Milestones']);
      rows.push(['Name', 'Due Date', 'Status', 'Critical']);
      this.milestones.forEach(m => rows.push([
        m.name, m.dueDate || '-', m.status || '-', m.isCritical ? 'Yes' : 'No'
      ]));
      rows.push([]);
    }

    // Risks
    if (this.risks.length) {
      rows.push(['Risks']);
      rows.push(['Title', 'Probability', 'Impact', 'Status', 'Category', 'Mitigation']);
      this.risks.forEach(r => rows.push([
        r.title, r.probability || '-', r.impact || '-',
        r.status || '-', r.categoryName || '-', r.mitigationPlan || '-'
      ]));
      rows.push([]);
    }

    // Issues
    if (this.issues.length) {
      rows.push(['Issues']);
      rows.push(['Title', 'Priority', 'Status', 'Assigned To', 'Resolution']);
      this.issues.forEach(i => rows.push([
        i.title, i.priority || '-', i.status || '-',
        i.assigneeName || '-', i.resolution || '-'
      ]));
    }

    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.project!.code}_Project_Details.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.snackBar.open('Project exported to CSV', 'Close', { duration: 3000 });
  }

  private exportProjectPdf() {
    const p = this.project!;
    const tableStyle = `width:100%;border-collapse:collapse;margin:8px 0 20px`;
    const thStyle = `background:#1976d2;color:white;padding:8px 12px;text-align:left;border:1px solid #ddd`;
    const tdStyle = `padding:8px 12px;border:1px solid #ddd`;

    const html = `<html><head><title>${p.name}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#333}
      h1{color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:8px}
      h2{color:#424242;margin-top:24px;font-size:16px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:12px 0}
      .info-item{display:flex;gap:8px;padding:4px 0}
      .info-label{font-weight:bold;min-width:130px;color:#666}
      .badges span{display:inline-block;padding:4px 12px;border-radius:12px;color:white;font-size:12px;margin-right:8px}
      .status-badge{background:#1976d2}
      .stage-badge{background:#7c4dff}
      .priority-badge{background:#ff9800}
      table{${tableStyle}}
      th{${thStyle}}
      td{${tdStyle}}
      tr:nth-child(even){background:#f9f9f9}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>${p.name}</h1>
    <div class="badges">
      <span class="status-badge">${p.status}</span>
      <span class="stage-badge">${p.stage}</span>
      <span class="priority-badge">${p.priority}</span>
    </div>

    <h2>Project Information</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Code:</span><span>${p.code}</span></div>
      <div class="info-item"><span class="info-label">Category:</span><span>${p.categoryCode || '-'}</span></div>
      <div class="info-item"><span class="info-label">Manager:</span><span>${p.managerName || '-'}</span></div>
      <div class="info-item"><span class="info-label">Sponsor:</span><span>${p.sponsorName || '-'}</span></div>
      <div class="info-item"><span class="info-label">SBU:</span><span>${p.sbuName || '-'}</span></div>
      <div class="info-item"><span class="info-label">Start Date:</span><span>${p.startDate || '-'}</span></div>
      <div class="info-item"><span class="info-label">End Date:</span><span>${p.endDate || '-'}</span></div>
      <div class="info-item"><span class="info-label">Actual Start:</span><span>${p.actualStartDate || '-'}</span></div>
      <div class="info-item"><span class="info-label">Actual End:</span><span>${p.actualEndDate || '-'}</span></div>
      <div class="info-item"><span class="info-label">Est. Budget:</span><span>$${(p.estimatedBudget || 0).toLocaleString()}</span></div>
      <div class="info-item"><span class="info-label">Actual Cost:</span><span>$${(p.actualCost || 0).toLocaleString()}</span></div>
      <div class="info-item"><span class="info-label">Completion:</span><span>${p.completionPercentage || 0}%</span></div>
    </div>

    ${p.description ? `<h2>Description</h2><p>${p.description}</p>` : ''}
    ${p.objectives ? `<h2>Objectives</h2><p>${p.objectives}</p>` : ''}
    ${p.scope ? `<h2>Scope</h2><p>${p.scope}</p>` : ''}

    ${this.tasks.length ? `<h2>Tasks (${this.tasks.length})</h2>
    <table><tr><th>Name</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Start</th><th>Due</th><th>%</th></tr>
    ${this.tasks.map(t => `<tr><td>${t.name}</td><td>${t.status}</td><td>${t.priority || '-'}</td><td>${t.assigneeName || '-'}</td><td>${t.startDate || '-'}</td><td>${t.dueDate || '-'}</td><td>${t.completionPercentage || 0}%</td></tr>`).join('')}
    </table>` : ''}

    ${this.teamMembers.length ? `<h2>Team Members (${this.teamMembers.length})</h2>
    <table><tr><th>Name</th><th>Role</th><th>Email</th></tr>
    ${this.teamMembers.map(m => `<tr><td>${m.userName || '-'}</td><td>${m.role || '-'}</td><td>${m.userEmail || '-'}</td></tr>`).join('')}
    </table>` : ''}

    ${this.budgetLines.length ? `<h2>Budget Lines</h2>
    <table><tr><th>Category</th><th>Description</th><th>Estimated</th><th>Actual</th><th>Variance</th></tr>
    ${this.budgetLines.map(b => `<tr><td>${b.category || '-'}</td><td>${b.description || '-'}</td><td>$${(b.estimatedAmount || 0).toLocaleString()}</td><td>$${(b.actualAmount || 0).toLocaleString()}</td><td>$${((b.estimatedAmount || 0) - (b.actualAmount || 0)).toLocaleString()}</td></tr>`).join('')}
    </table>` : ''}

    ${this.milestones.length ? `<h2>Milestones (${this.milestones.length})</h2>
    <table><tr><th>Name</th><th>Due Date</th><th>Status</th><th>Critical</th></tr>
    ${this.milestones.map(m => `<tr><td>${m.name}</td><td>${m.dueDate || '-'}</td><td>${m.status || '-'}</td><td>${m.isCritical ? 'Yes' : 'No'}</td></tr>`).join('')}
    </table>` : ''}

    ${this.risks.length ? `<h2>Risks (${this.risks.length})</h2>
    <table><tr><th>Title</th><th>Probability</th><th>Impact</th><th>Status</th><th>Category</th><th>Mitigation</th></tr>
    ${this.risks.map(r => `<tr><td>${r.title}</td><td>${r.probability || '-'}</td><td>${r.impact || '-'}</td><td>${r.status || '-'}</td><td>${r.categoryName || '-'}</td><td>${r.mitigationPlan || '-'}</td></tr>`).join('')}
    </table>` : ''}

    ${this.issues.length ? `<h2>Issues (${this.issues.length})</h2>
    <table><tr><th>Title</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Resolution</th></tr>
    ${this.issues.map(i => `<tr><td>${i.title}</td><td>${i.priority || '-'}</td><td>${i.status || '-'}</td><td>${i.assigneeName || '-'}</td><td>${i.resolution || '-'}</td></tr>`).join('')}
    </table>` : ''}

    </body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
    this.snackBar.open('Project PDF ready for printing', 'Close', { duration: 3000 });
  }
}
