import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { WorkflowService } from '@core/services/workflow.service';
import { UserService } from '@core/services/user.service';
import { DepartmentService } from '@core/services/department.service';
import { SqlObjectService } from '@core/services/sql-object.service';
import { StampDTO } from '../../stamps/stamp.service';
import { SettingService } from '@core/services/setting.service';
import { StampSelectorDialogComponent } from '../../stamps/stamp-selector-dialog.component';
import { Workflow, FieldType, WorkflowField, FieldGroup, WorkflowCategory, SqlObject } from '@core/models/workflow.model';
import { User, SBU, Corporate, Branch, Role, Privilege } from '@core/models/user.model';
import { Department } from '@core/models/department.model';
import { WorkflowPreviewDialogComponent } from './workflow-preview-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogType } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { FunctionHelpDialogComponent } from '@shared/components/function-help-dialog/function-help-dialog.component';

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  template: `
    <div class="workflow-builder-container">
      <div class="header">
        <button mat-icon-button matTooltip="Go Back" routerLink="/workflows">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEdit ? 'Editing: ' + workflowName : 'Create Workflow' }}</h1>
        <div class="header-actions">
          <button mat-button matTooltip="Preview" (click)="preview()">
            <mat-icon>visibility</mat-icon>
            Preview
          </button>
          <button mat-raised-button matTooltip="{{ loading ? 'Saving...' : 'Save Workflow' }}" color="primary" (click)="saveWorkflow()" [disabled]="loading">
            <mat-icon>save</mat-icon>
            {{ loading ? 'Saving...' : 'Save Workflow' }}
          </button>
        </div>
      </div>

      <mat-tab-group class="workflow-tabs" dynamicHeight>
        <!-- Basic Info Tab -->
        <mat-tab label="Basic Info">
          <div class="tab-content">
            <mat-card>
              <mat-card-content>
                <form [formGroup]="basicForm">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Workflow Name</mat-label>
                      <input matInput formControlName="name">
                      @if (basicForm.get('name')?.hasError('required')) {
                        <mat-error>Name is required</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Code</mat-label>
                      <input matInput formControlName="code" [readonly]="isEdit">
                      <mat-hint>Unique identifier (auto-generated if blank)</mat-hint>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="form-field full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="3"></textarea>
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Icon</mat-label>
                      @if (basicForm.get('icon')?.value) {
                        <mat-icon matPrefix style="margin-right: 8px;">{{ basicForm.get('icon')?.value }}</mat-icon>
                      }
                      <input type="text" matInput formControlName="icon" [matAutocomplete]="iconAuto" placeholder="Type to search icons...">
                      <mat-icon matSuffix>search</mat-icon>
                      <mat-autocomplete #iconAuto="matAutocomplete">
                        @for (icon of getFilteredIcons(); track icon) {
                          <mat-option [value]="icon">
                            <mat-icon>{{ icon }}</mat-icon> {{ icon }}
                          </mat-option>
                        }
                        @if (getFilteredIcons().length === 0) {
                          <mat-option disabled>
                            <span style="color: #999;">No icons match your search</span>
                          </mat-option>
                        }
                      </mat-autocomplete>
                      <mat-hint>Type to filter — over 100 Material Icons available</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Workflow Category</mat-label>
                      <mat-select formControlName="workflowCategory">
                        <mat-option value="NON_FINANCIAL">Non-Financial</mat-option>
                        <mat-option value="FINANCIAL">Financial</mat-option>
                      </mat-select>
                      <mat-hint>Financial workflows enable amount-based approval limits</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Industry</mat-label>
                      <mat-select formControlName="industryId">
                        <mat-option [value]="null">— Not specified —</mat-option>
                        @for (ind of industries; track ind.id) {
                          <mat-option [value]="ind.id">{{ ind.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Industry this workflow belongs to (managed under Admin &rarr; Categories)</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Workflow Type</mat-label>
                      <mat-select formControlName="workflowTypeId">
                        <mat-option [value]="null">— General —</mat-option>
                        @for (t of workflowTypes; track t.id) {
                          <mat-option [value]="t.id">{{ t.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Managed under Admin &rarr; Workflow Types</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Parent Workflow</mat-label>
                      <mat-select formControlName="parentWorkflowId">
                        <mat-option [value]="null">None</mat-option>
                        @for (w of availableParentWorkflows; track w.id) {
                          <mat-option [value]="w.id">{{ w.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Set a parent to make this a sub-workflow</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Approval Seal</mat-label>
                      <input matInput [value]="selectedStampName || 'Use Default Seal'" readonly>
                      <button mat-icon-button matSuffix matTooltip="Browse seals" (click)="openSealPicker()">
                        <mat-icon>search</mat-icon>
                      </button>
                      @if (basicForm.get('stampId')?.value) {
                        <button mat-icon-button matSuffix matTooltip="Clear seal" (click)="clearSeal()">
                          <mat-icon>clear</mat-icon>
                        </button>
                      }
                      <mat-hint>Seal stamped on documents at final approval (leave blank to use default)</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="checkbox-row">
                    <mat-checkbox formControlName="isActive">Active</mat-checkbox>
                    <mat-checkbox formControlName="showSummary">Show Summary</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatory">Comments Mandatory on Approval</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnReject">Comments Mandatory on Reject</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnEscalate">Comments Mandatory on Escalate</mat-checkbox>
                    <mat-checkbox formControlName="showApprovalMatrix">Show Approval Matrix in Emails</mat-checkbox>
                    <mat-checkbox formControlName="lockApproved">No Editing Approved Submissions</mat-checkbox>
                    <mat-checkbox formControlName="lockChildOnParentApproval">Lock Editing When Parent Approved</mat-checkbox>
                  </div>

                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Screens Tab -->
        <mat-tab label="Screens">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Form Screens</mat-card-title>
                <button mat-raised-button matTooltip="Add Screen" color="primary" (click)="addScreen()">
                  <mat-icon>add</mat-icon>
                  Add Screen
                </button>
              </mat-card-header>
              <mat-card-content>
                <div class="screen-info" *ngIf="screens.length === 0">
                  <mat-icon>info</mat-icon>
                  <p>Without screens, the form displays as a single page. Add 2+ screens to create a multi-step wizard.</p>
                </div>

                <div cdkDropList (cdkDropListDropped)="dropScreen($event)" class="screen-list">
                  @for (screen of screens; track screen.id; let i = $index) {
                    <mat-expansion-panel cdkDrag class="screen-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                          <mat-icon>{{ screen.icon || 'view_carousel' }}</mat-icon>
                          {{ screen.title || 'Untitled Screen' }}
                        </mat-panel-title>
                        <mat-panel-description>
                          {{ getFieldsInScreen(screen.id).length }} fields, {{ getFieldGroupsInScreen(screen.id).length }} groups
                        </mat-panel-description>
                      </mat-expansion-panel-header>

                      <mat-tab-group>
                        <mat-tab label="Settings">
                          <div class="screen-config" style="padding-top: 16px;">
                            <div class="form-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Title</mat-label>
                                <input matInput [(ngModel)]="screen.title">
                              </mat-form-field>

                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Display Order</mat-label>
                                <input matInput type="number" [(ngModel)]="screen.displayOrder">
                              </mat-form-field>
                            </div>

                            <mat-form-field appearance="outline" class="form-field full-width">
                              <mat-label>Description</mat-label>
                              <input matInput [(ngModel)]="screen.description">
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="form-field">
                              <mat-label>Icon</mat-label>
                              <mat-select [(ngModel)]="screen.icon">
                                <mat-option value="view_carousel">view_carousel</mat-option>
                                <mat-option value="article">article</mat-option>
                                <mat-option value="assignment">assignment</mat-option>
                                <mat-option value="description">description</mat-option>
                                <mat-option value="info">info</mat-option>
                                <mat-option value="checklist">checklist</mat-option>
                                <mat-option value="fact_check">fact_check</mat-option>
                                <mat-option value="summarize">summarize</mat-option>
                              </mat-select>
                            </mat-form-field>

                            <!-- Screen Access Restrictions -->
                            <div class="form-row" style="margin-top: 16px;">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Restrict by Roles</mat-label>
                                <mat-select [(ngModel)]="screen.roleIds" multiple (selectionChange)="onScreenRolesChange(screen)">
                                  @for (role of roles; track role.id) {
                                    <mat-option [value]="role.id">{{ role.name }}</mat-option>
                                  }
                                </mat-select>
                                <mat-hint>Select roles to filter available privileges</mat-hint>
                              </mat-form-field>

                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Restrict by Privileges</mat-label>
                                <mat-select [(ngModel)]="screen.privilegeIds" multiple [disabled]="getFilteredPrivilegesForScreen(screen).length === 0">
                                  @for (privilege of getFilteredPrivilegesForScreen(screen); track privilege.id) {
                                    <mat-option [value]="privilege.id">
                                      {{ privilege.name }} @if (privilege.category) { ({{ privilege.category }}) }
                                    </mat-option>
                                  }
                                </mat-select>
                                <mat-hint>@if (getFilteredPrivilegesForScreen(screen).length === 0) { Select roles first } @else { If selected, overrides role restrictions }</mat-hint>
                              </mat-form-field>
                            </div>

                            <div class="screen-actions">
                              <button mat-button matTooltip="Remove Screen" color="warn" (click)="removeScreen(i)">
                                <mat-icon>delete</mat-icon>
                                Remove Screen
                              </button>
                            </div>
                          </div>
                        </mat-tab>

                        <mat-tab>
                          <ng-template mat-tab-label>
                            <mat-icon style="margin-right: 4px; font-size: 18px;">notifications</mat-icon>
                            Notifications
                            @if (screen.notifiers?.length) {
                              <span style="margin-left: 6px; background: #1976d2; color: white; border-radius: 10px; padding: 1px 7px; font-size: 11px;">{{ screen.notifiers.length }}</span>
                            }
                          </ng-template>
                          <div class="screen-config" style="padding-top: 16px;">
                            <p style="color: #666; font-size: 13px; margin-bottom: 12px;">
                              Configure recipients to be notified when this screen is completed.
                            </p>

                            <mat-form-field appearance="outline" style="width: 100%; margin-bottom: 16px;">
                              <mat-label>Notification Message</mat-label>
                              <textarea matInput [(ngModel)]="screen.notificationMessage" rows="3"
                                placeholder="A workflow stage has been completed. Please review the details below."></textarea>
                              <mat-hint>Custom message for the notification email. Leave blank to use the default message.</mat-hint>
                            </mat-form-field>

                            @if (screen.notifiers?.length) {
                              @for (notifier of screen.notifiers; track notifier; let ni = $index) {
                                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                                  <mat-form-field appearance="outline" style="width: 140px;">
                                    <mat-label>Type</mat-label>
                                    <mat-select [(ngModel)]="notifier.notifierType" (selectionChange)="onNotifierTypeChange(notifier)">
                                      <mat-option value="EMAIL">Email</mat-option>
                                      <mat-option value="USER">User</mat-option>
                                      <mat-option value="ROLE">Role</mat-option>
                                    </mat-select>
                                  </mat-form-field>

                                  @if (notifier.notifierType === 'EMAIL') {
                                    <mat-form-field appearance="outline" style="flex: 1;">
                                      <mat-label>Email Address</mat-label>
                                      <input matInput type="email" [(ngModel)]="notifier.email" placeholder="user@example.com">
                                    </mat-form-field>
                                  }

                                  @if (notifier.notifierType === 'USER') {
                                    <mat-form-field appearance="outline" style="flex: 1;">
                                      <mat-label>User</mat-label>
                                      <mat-select [(ngModel)]="notifier.userId" (selectionChange)="onNotifierUserSelected(notifier, $event)">
                                        @for (user of users; track user.id) {
                                          <mat-option [value]="user.id">{{ user.firstName }} {{ user.lastName }} ({{ user.username }})</mat-option>
                                        }
                                      </mat-select>
                                    </mat-form-field>
                                  }

                                  @if (notifier.notifierType === 'ROLE') {
                                    <mat-form-field appearance="outline" style="flex: 1;">
                                      <mat-label>Role</mat-label>
                                      <mat-select [(ngModel)]="notifier.roleId" (selectionChange)="onNotifierRoleSelected(notifier, $event)">
                                        @for (role of roles; track role.id) {
                                          <mat-option [value]="role.id">{{ role.name }}</mat-option>
                                        }
                                      </mat-select>
                                    </mat-form-field>
                                  }

                                  <button mat-icon-button matTooltip="Close" color="warn" (click)="removeScreenNotifier(screen, ni)" style="margin-top: 8px;">
                                    <mat-icon>close</mat-icon>
                                  </button>
                                </div>
                              }
                            }

                            <button mat-stroked-button matTooltip="Add Notification Recipient" color="primary" (click)="addScreenNotifier(screen)">
                              <mat-icon>add</mat-icon>
                              Add Notification Recipient
                            </button>
                          </div>
                        </mat-tab>
                      </mat-tab-group>
                    </mat-expansion-panel>
                  }
                </div>

                @if (screens.length === 1) {
                  <div class="screen-warning">
                    <mat-icon>warning</mat-icon>
                    <p>Add at least one more screen to enable multi-step navigation.</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Field Groups Tab -->
        <mat-tab label="Field Groups">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Field Groups</mat-card-title>
                <button mat-raised-button matTooltip="Add Group" color="primary" (click)="addFieldGroup()">
                  <mat-icon>add</mat-icon>
                  Add Group
                </button>
              </mat-card-header>
              <mat-card-content>
                @for (group of fieldGroups; track group.id; let i = $index) {
                  <mat-expansion-panel class="group-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>{{ group.title || 'Untitled Group' }}</mat-panel-title>
                      <mat-panel-description>
                        {{ getFieldsInGroup(group.id).length }} fields
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="group-config">
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Title</mat-label>
                          <input matInput [(ngModel)]="group.title">
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Display Order</mat-label>
                          <input matInput type="number" [(ngModel)]="group.displayOrder">
                        </mat-form-field>
                      </div>

                      <mat-form-field appearance="outline" class="form-field full-width">
                        <mat-label>Description</mat-label>
                        <input matInput [(ngModel)]="group.description">
                      </mat-form-field>

                      @if (screens.length > 0) {
                        <mat-form-field appearance="outline" class="form-field full-width">
                          <mat-label>Screen</mat-label>
                          <mat-select [(ngModel)]="group.screenId">
                            <mat-option [value]="null">None</mat-option>
                            @for (screen of screens; track screen.id) {
                              <mat-option [value]="screen.id">{{ screen.title || 'Untitled Screen' }}</mat-option>
                            }
                          </mat-select>
                          <mat-hint>Assign this group to a screen</mat-hint>
                        </mat-form-field>
                      }

                      <div class="checkbox-row">
                        <mat-checkbox [(ngModel)]="group.collapsible">Collapsible</mat-checkbox>
                        <mat-checkbox [(ngModel)]="group.collapsed">Start Collapsed</mat-checkbox>
                      </div>

                      <div class="group-actions">
                        <button mat-button matTooltip="Remove Group" color="warn" (click)="removeFieldGroup(i)">
                          <mat-icon>delete</mat-icon>
                          Remove Group
                        </button>
                      </div>
                    </div>
                  </mat-expansion-panel>
                }

                @if (fieldGroups.length === 0) {
                  <div class="empty-state">
                    <mat-icon>dashboard</mat-icon>
                    <p>No field groups defined. Groups help organize fields into titled sections.</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Form Builder Tab -->
        <mat-tab label="Form Builder">
          <div class="tab-content">
            <div class="builder-layout">
              <div class="field-palette">
                <mat-card>
                  <mat-card-content class="palette-content">
                    <mat-tab-group class="palette-tabs">
                      <!-- Field Types Tab -->
                      <mat-tab label="Field Types">
                        <div class="palette-tab-content">
                          @if (isActiveSummaryScreen) {
                            <div class="summary-screen-notice">
                              <mat-icon>info</mat-icon>
                              <p>The Summary screen is automatically populated by fields marked as "Summary" from other screens. You cannot add fields directly to this screen.</p>
                            </div>
                          }
                          <div class="field-types" [class.disabled]="isActiveSummaryScreen">
                            @for (fieldType of fieldTypes; track fieldType.value) {
                              <div class="field-type-item" [class.disabled]="isActiveSummaryScreen" (click)="addField(fieldType.value)">
                                <mat-icon>{{ fieldType.icon }}</mat-icon>
                                <span>{{ fieldType.label }}</span>
                              </div>
                            }
                          </div>
                          <div class="palette-section">
                            <h4>Groups</h4>
                            <button mat-stroked-button matTooltip="Add Field Group" (click)="addFieldGroup()">
                              <mat-icon>dashboard</mat-icon>
                              Add Field Group
                            </button>
                          </div>
                        </div>
                      </mat-tab>

                      <!-- Functions Tab -->
                      <mat-tab label="Functions">
                        <div class="palette-tab-content">
                          <!-- Search Box -->
                          <div class="function-search">
                            <mat-form-field appearance="outline" class="search-field">
                              <mat-label>Search functions</mat-label>
                              <input matInput [(ngModel)]="functionSearch" placeholder="Search by name or category...">
                              <mat-icon matSuffix>search</mat-icon>
                            </mat-form-field>
                          </div>

                          <!-- Usage Guide -->
                          <div class="function-usage-guide" *ngIf="!functionSearch">
                            <div class="guide-header" (click)="showUsageGuide = !showUsageGuide">
                              <mat-icon>{{ showUsageGuide ? 'expand_less' : 'help_outline' }}</mat-icon>
                              <span>How to use functions</span>
                            </div>
                            <div class="guide-content" *ngIf="showUsageGuide">
                              <p><strong>1.</strong> Click a function to copy its syntax to clipboard</p>
                              <p><strong>2.</strong> Use functions in field default values or calculated fields</p>
                              <p><strong>3.</strong> Replace <code>fieldName</code> with your actual field names</p>
                              <p><strong>4.</strong> Functions can be nested: <code>UPPER(TRIM(fieldName))</code></p>
                              <p><strong>Example:</strong></p>
                              <code class="example">IF(amount > 1000, "High Value", "Standard")</code>
                            </div>
                          </div>

                          <!-- Search Results or Categories -->
                          @if (functionSearch) {
                            <div class="search-results">
                              <div class="search-results-header">
                                <span>{{ getFilteredFunctions().length }} results</span>
                                <button mat-icon-button matTooltip="Close" (click)="functionSearch = ''">
                                  <mat-icon>close</mat-icon>
                                </button>
                              </div>
                              @for (fn of getFilteredFunctions(); track fn.name) {
                                <div class="function-item" (click)="insertFunction(fn)">
                                  <div class="function-main">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                    <div class="function-category-tag">{{ fn.category }}</div>
                                  </div>
                                  <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                    <mat-icon>help_outline</mat-icon>
                                  </button>
                                </div>
                              }
                              @if (getFilteredFunctions().length === 0) {
                                <div class="no-results">
                                  <mat-icon>search_off</mat-icon>
                                  <p>No functions found for "{{ functionSearch }}"</p>
                                </div>
                              }
                            </div>
                          } @else {
                            <mat-accordion class="function-accordion" multi>
                              <mat-expansion-panel [expanded]="expandedCategories['validation']" (opened)="expandedCategories['validation']=true" (closed)="expandedCategories['validation']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>rule</mat-icon> Validation Functions ({{ validationFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of validationFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['string']" (opened)="expandedCategories['string']=true" (closed)="expandedCategories['string']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>text_fields</mat-icon> String Functions ({{ stringFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of stringFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['number']" (opened)="expandedCategories['number']=true" (closed)="expandedCategories['number']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>pin</mat-icon> Number Functions ({{ numberFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of numberFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['date']" (opened)="expandedCategories['date']=true" (closed)="expandedCategories['date']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>calendar_today</mat-icon> Date Functions ({{ dateFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of dateFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['conditional']" (opened)="expandedCategories['conditional']=true" (closed)="expandedCategories['conditional']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>call_split</mat-icon> Conditional Functions ({{ conditionalFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of conditionalFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['boolean']" (opened)="expandedCategories['boolean']=true" (closed)="expandedCategories['boolean']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>toggle_on</mat-icon> Boolean/Logic Functions ({{ booleanFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of booleanFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['utility']" (opened)="expandedCategories['utility']=true" (closed)="expandedCategories['utility']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>functions</mat-icon> Utility Functions ({{ utilityFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of utilityFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['table']" (opened)="expandedCategories['table']=true" (closed)="expandedCategories['table']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>table_chart</mat-icon> Table Functions ({{ tableFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of tableFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['sql']" (opened)="expandedCategories['sql']=true" (closed)="expandedCategories['sql']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>storage</mat-icon> SQL Functions ({{ sqlFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of sqlFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['other']" (opened)="expandedCategories['other']=true" (closed)="expandedCategories['other']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>more_horiz</mat-icon> Other Functions ({{ otherFunctions.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  @for (fn of otherFunctions; track fn.name) {
                                    <div class="function-item" (click)="insertFunction(fn)">
                                      <div class="function-main">
                                        <div class="function-name">{{ fn.name }}</div>
                                        <div class="function-desc">{{ fn.description }}</div>
                                      </div>
                                      <button mat-icon-button class="function-help-btn" (click)="showFunctionHelp(fn, $event)" matTooltip="View function help">
                                        <mat-icon>help_outline</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>

                              <mat-expansion-panel [expanded]="expandedCategories['placeholders']" (opened)="expandedCategories['placeholders']=true" (closed)="expandedCategories['placeholders']=false">
                                <mat-expansion-panel-header>
                                  <mat-panel-title><mat-icon>data_object</mat-icon> Placeholders ({{ placeholderItems.length }})</mat-panel-title>
                                </mat-expansion-panel-header>
                                <div class="function-list">
                                  <div class="placeholder-guide">Use in Value, Visibility, Email Templates, API URLs, and more</div>
                                  @for (ph of placeholderItems; track ph.name) {
                                    <div class="function-item" (click)="copyToClipboard(ph.syntax)" matTooltip="Click to copy">
                                      <div class="function-main">
                                        <div class="function-name">{{ ph.name }}</div>
                                        <div class="function-desc">{{ ph.description }}</div>
                                      </div>
                                      <mat-icon class="copy-icon">content_copy</mat-icon>
                                    </div>
                                  }
                                </div>
                              </mat-expansion-panel>
                            </mat-accordion>
                          }
                        </div>
                      </mat-tab>
                    </mat-tab-group>
                  </mat-card-content>
                </mat-card>
              </div>

              <div class="form-canvas">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Form Layout</mat-card-title>
                    @if (screens.length > 0) {
                      <span class="screen-info-badge">
                        <mat-icon>info</mat-icon>
                        Fields added will be assigned to the active screen tab
                      </span>
                    }
                  </mat-card-header>
                  <mat-card-content>
                    @if (screens.length > 0) {
                      <div class="screen-tabs">
                        <button mat-button matTooltip="All Fields ({{ fields.length }})"
                                [class.active]="activeScreenId === null"
                                (click)="setActiveScreen(null)">
                          <mat-icon>apps</mat-icon>
                          All Fields ({{ fields.length }})
                        </button>
                        @for (screen of screens; track screen.id) {
                          <button mat-button matTooltip="{{ screen.isSummaryScreen ? 'Summary (auto-populated)' : (screen.title || 'Untitled') }} ({{ getFieldsInScreen(screen.id).length }})"
                                  [class.active]="activeScreenId === screen.id"
                                  [class.summary-tab]="screen.isSummaryScreen"
                                  (click)="setActiveScreen(screen.id)">
                            <mat-icon>{{ screen.icon || 'view_carousel' }}</mat-icon>
                            {{ screen.title || 'Untitled' }} ({{ getFieldsInScreen(screen.id).length }})
                            @if (screen.isSummaryScreen) {
                              <mat-icon class="lock-icon">lock</mat-icon>
                            }
                          </button>
                        }
                      </div>
                    }
                    <div cdkDropList (cdkDropListDropped)="dropField($event)" class="field-list">
                      @for (field of getFilteredFields(); track field.id; let i = $index) {
                        <mat-expansion-panel cdkDrag class="field-panel">
                          <mat-expansion-panel-header>
                            <mat-panel-title>
                              <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                              <mat-icon>{{ getFieldIcon(field.type) }}</mat-icon>
                              {{ field.label || 'Untitled Field' }}
                            </mat-panel-title>
                            <mat-panel-description>
                              {{ field.type }}
                              @if (field.required) {
                                <mat-chip>Required</mat-chip>
                              }
                              @if (field.isTitle) {
                                <mat-chip>Title</mat-chip>
                              }
                              @if (field.inSummary) {
                                <mat-chip>Summary</mat-chip>
                              }
                              @if (field.readOnly) {
                                <mat-chip>ReadOnly</mat-chip>
                              }
                              @if (field.hidden) {
                                <mat-chip>Hidden</mat-chip>
                              }
                              @if (field.isUnique) {
                                <mat-chip>Unique</mat-chip>
                              }
                            </mat-panel-description>
                          </mat-expansion-panel-header>

                          <div class="field-config">
                            <div class="form-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Label</mat-label>
                                <input matInput [(ngModel)]="field.label">
                              </mat-form-field>

                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Name</mat-label>
                                <input matInput [(ngModel)]="field.name">
                              </mat-form-field>
                            </div>

                            @if (hasPlaceholderOption(field.type)) {
                              <mat-form-field appearance="outline" class="form-field full-width">
                                <mat-label>Placeholder</mat-label>
                                <input matInput [(ngModel)]="field.placeholder">
                              </mat-form-field>
                            }

                            @if (hasValueOption(field.type)) {
                              <mat-form-field appearance="outline" class="form-field full-width">
                                <mat-label>Value</mat-label>
                                <textarea matInput [(ngModel)]="field.value" rows="1"
                                          placeholder="Static value or function: TODAY(), NOW(), CURRENT_USER(), CONCAT(), SUM(), UUID(), etc."></textarea>
                                <mat-hint>Static value or function expression. See Functions tab for full list.</mat-hint>
                              </mat-form-field>
                            }

                            @if (field.type === 'SELECT' || field.type === 'MULTISELECT' || field.type === 'RADIO' || field.type === 'CHECKBOX_GROUP') {
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Options Source</mat-label>
                                <mat-select [(ngModel)]="field.optionsSource" (selectionChange)="onOptionsSourceChange(field)">
                                  <mat-option value="STATIC">Static Options</mat-option>
                                  <mat-option value="SQL">SQL Object</mat-option>
                                </mat-select>
                                <mat-hint>Choose where to get options from</mat-hint>
                              </mat-form-field>

                              @if (field.optionsSource !== 'SQL' && field.optionsSource !== 'API') {
                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Options (one per line)</mat-label>
                                  <textarea matInput [(ngModel)]="field.optionsText" rows="4"
                                            placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
                                </mat-form-field>
                              }

                              @if (field.optionsSource === 'SQL') {
                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>SQL Object</mat-label>
                                  <mat-select [(ngModel)]="field.sqlObjectId">
                                    <mat-option [value]="null">-- Select SQL Object --</mat-option>
                                    @for (sqlObj of sqlObjects; track sqlObj.id) {
                                      <mat-option [value]="sqlObj.id">
                                        {{ sqlObj.displayName }}
                                        @if (sqlObj.valueColumn && sqlObj.labelColumn) {
                                          <span class="sql-obj-hint">({{ sqlObj.labelColumn }})</span>
                                        }
                                      </mat-option>
                                    }
                                  </mat-select>
                                  <mat-hint>Select an SQL Object to populate options dynamically</mat-hint>
                                </mat-form-field>
                                @if (sqlObjects.length === 0) {
                                  <p class="sql-hint">No SQL Objects available. <a routerLink="/sql-objects">Create one</a></p>
                                }
                              }

                            }

                            @if (field.type === 'RADIO' || field.type === 'CHECKBOX_GROUP') {
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Options Layout</mat-label>
                                <mat-select [(ngModel)]="field.optionsLayout">
                                  <mat-option value="vertical">Vertical</mat-option>
                                  <mat-option value="horizontal">Horizontal</mat-option>
                                </mat-select>
                                <mat-hint>How to display the options</mat-hint>
                              </mat-form-field>
                            }

                            @if (screens.length > 0) {
                              <div class="form-row">
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Screen</mat-label>
                                  <mat-select [(ngModel)]="field.screenId">
                                    <mat-option [value]="null">None</mat-option>
                                    @for (screen of getNonSummaryScreens(); track screen.id) {
                                      <mat-option [value]="screen.id">{{ screen.title || 'Untitled Screen' }}</mat-option>
                                    }
                                  </mat-select>
                                  <mat-hint>Assign field to a screen for multi-step forms</mat-hint>
                                </mat-form-field>
                              </div>
                            }

                            <div class="form-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Field Group</mat-label>
                                <mat-select [(ngModel)]="field.fieldGroupId">
                                  <mat-option [value]="null">None</mat-option>
                                  @for (group of getAvailableFieldGroups(field); track group.id) {
                                    <mat-option [value]="group.id">{{ group.title }}</mat-option>
                                  }
                                </mat-select>
                                @if (screens.length > 0 && activeScreenId) {
                                  <mat-hint>Only showing groups for this screen</mat-hint>
                                }
                              </mat-form-field>

                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Column Span</mat-label>
                                <mat-select [(ngModel)]="field.columnSpan">
                                  <mat-option [value]="1">1 Column</mat-option>
                                  <mat-option [value]="2">2 Columns</mat-option>
                                  <mat-option [value]="3">3 Columns</mat-option>
                                  <mat-option [value]="4">Full Width</mat-option>
                                </mat-select>
                              </mat-form-field>
                            </div>

                            @if (field.type !== 'ACCORDION' && field.type !== 'COLLAPSIBLE') {
                              <div class="checkbox-row">
                                @if (field.type !== 'SQL_TABLE') {
                                  <mat-checkbox [(ngModel)]="field.required">Required</mat-checkbox>
                                }
                                <mat-checkbox [(ngModel)]="field.readOnly" (change)="onTableReadOnlyChange(field)">Read Only</mat-checkbox>
                                <mat-checkbox [(ngModel)]="field.hidden">Hidden</mat-checkbox>
                                @if (field.type !== 'SQL_TABLE') {
                                  <mat-checkbox [(ngModel)]="field.isUnique">Unique</mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.isTitle" (change)="onIsTitleChange(field)" matTooltip="Makes this field available in the Title tab for building the submission title">Contributes to Title</mat-checkbox>
                                }
                                <mat-checkbox [(ngModel)]="field.inSummary" matTooltip="Include this field in approval email summary">Summary</mat-checkbox>
                                @if (isFinancialWorkflow() && isAmountField(field.type)) {
                                  <mat-checkbox [(ngModel)]="field.isLimited"
                                                [disabled]="!field.isLimited && hasLimitedField()"
                                                (change)="onLimitedChange(field)"
                                                matTooltip="Mark this field as the amount to check against approver limits for auto-escalation">
                                    Limited
                                  </mat-checkbox>
                                }
                              </div>
                            }

                            <!-- RATING field specific config -->
                            @if (field.type === 'RATING') {
                              <div class="form-row">
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Max Rating</mat-label>
                                  <mat-select [(ngModel)]="field.ratingMax">
                                    <mat-option [value]="3">3 Stars</mat-option>
                                    <mat-option [value]="5">5 Stars</mat-option>
                                    <mat-option [value]="10">10 Stars</mat-option>
                                  </mat-select>
                                </mat-form-field>
                              </div>
                            }

                            <!-- SLIDER field specific config -->
                            @if (field.type === 'SLIDER') {
                              <div class="form-row">
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Min Value</mat-label>
                                  <input matInput type="number" [(ngModel)]="field.sliderMin">
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Max Value</mat-label>
                                  <input matInput type="number" [(ngModel)]="field.sliderMax">
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Step</mat-label>
                                  <input matInput type="number" [(ngModel)]="field.sliderStep">
                                </mat-form-field>
                              </div>
                            }

                            <!-- FILE field specific config -->
                            @if (field.type === 'FILE') {
                              <div class="form-row">
                                <mat-checkbox [(ngModel)]="field.multiple" color="primary">Allow multiple files</mat-checkbox>
                              </div>
                              <div class="form-row">
                                @if (field.multiple) {
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Max number of files</mat-label>
                                    <input matInput type="number" [(ngModel)]="field.maxFiles" min="1">
                                  </mat-form-field>
                                }
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Max file size (MB)</mat-label>
                                  <input matInput type="number" [(ngModel)]="field.maxFileSize" min="1">
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="form-field">
                                  <mat-label>Allowed file types</mat-label>
                                  <input matInput [(ngModel)]="field.allowedFileTypes" placeholder=".pdf,.doc,.jpg">
                                  <mat-hint>Comma-separated extensions</mat-hint>
                                </mat-form-field>
                              </div>
                            }

                            <!-- SQL_OBJECT field specific config -->
                            @if (field.type === 'SQL_OBJECT') {
                              <div class="sql-object-config">
                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>SQL Object</mat-label>
                                    <mat-select [(ngModel)]="field.sqlObjectId" required>
                                      <mat-option [value]="null">-- Select SQL Object --</mat-option>
                                      @for (sqlObj of sqlObjects; track sqlObj.id) {
                                        <mat-option [value]="sqlObj.id">
                                          {{ sqlObj.displayName }}
                                          @if (sqlObj.valueColumn && sqlObj.labelColumn) {
                                            <span class="sql-obj-hint">({{ sqlObj.labelColumn }})</span>
                                          }
                                        </mat-option>
                                      }
                                    </mat-select>
                                    <mat-hint>Select the SQL Object to fetch options from</mat-hint>
                                  </mat-form-field>

                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>View Type</mat-label>
                                    <mat-select [(ngModel)]="field.viewType" required>
                                      @for (vt of viewTypes; track vt.value) {
                                        <mat-option [value]="vt.value">
                                          <mat-icon>{{ vt.icon }}</mat-icon>
                                          {{ vt.label }}
                                        </mat-option>
                                      }
                                    </mat-select>
                                    <mat-hint>How to display the options</mat-hint>
                                  </mat-form-field>
                                </div>

                                @if (sqlObjects.length === 0) {
                                  <div class="sql-hint warning">
                                    <mat-icon>warning</mat-icon>
                                    No SQL Objects available. <a routerLink="/sql-objects">Create one first</a>
                                  </div>
                                }

                                @if (field.viewType === 'RADIO' || field.viewType === 'CHECKBOX_GROUP') {
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Options Layout</mat-label>
                                    <mat-select [(ngModel)]="field.optionsLayout">
                                      <mat-option value="vertical">Vertical</mat-option>
                                      <mat-option value="horizontal">Horizontal</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                }
                              </div>
                            }

                            <!-- SQL_TABLE field config -->
                            @if (field.type === 'SQL_TABLE') {
                              <div class="sql-table-config">
                                <h4 class="config-section-title">
                                  <mat-icon>grid_on</mat-icon>
                                  SQL Table Configuration
                                </h4>

                                <div class="api-show-toggle">
                                  <mat-slide-toggle color="primary"
                                    [checked]="field.apiTriggerMode === 'MANUAL'"
                                    (change)="field.apiTriggerMode = $event.checked ? 'MANUAL' : 'AUTO'">
                                    Manual trigger
                                  </mat-slide-toggle>
                                  <span class="toggle-hint">
                                    @if (field.apiTriggerMode === 'MANUAL') {
                                      User must click 'Populate' to load data
                                    } @else {
                                      Data is loaded automatically when the form loads
                                    }
                                  </span>
                                </div>

                                <mat-form-field appearance="outline" class="full-width">
                                  <mat-label>SQL Query</mat-label>
                                  <textarea matInput [(ngModel)]="field.sqlQuery" rows="4" required
                                            placeholder="SELECT id, name, email FROM users WHERE active = true"></textarea>
                                  @if (!field.sqlQuery || !field.sqlQuery.trim()) {
                                    <mat-error>SQL Query is required</mat-error>
                                  } @else {
                                    <mat-hint>Only SELECT queries allowed. The results will be displayed as a read-only table.</mat-hint>
                                  }
                                </mat-form-field>

                                <h4 class="config-section-title" style="margin-top: 16px;">
                                  <mat-icon>view_column</mat-icon>
                                  Column Definitions (Optional)
                                </h4>
                                <p class="config-hint">Define columns to control display names. Leave empty to auto-detect from query results.</p>

                                @if (!field.sqlTableColumnsDef) {
                                  <button mat-stroked-button (click)="field.sqlTableColumnsDef = [{key: '', label: ''}]">
                                    <mat-icon>add</mat-icon> Define Columns
                                  </button>
                                } @else {
                                  @for (col of field.sqlTableColumnsDef; track $index) {
                                    <div class="sql-col-row">
                                      <mat-form-field appearance="outline" class="form-field">
                                        <mat-label>Column Key</mat-label>
                                        <input matInput [(ngModel)]="col.key" placeholder="db_column_name">
                                        <mat-hint>Column name in the query result</mat-hint>
                                      </mat-form-field>
                                      <mat-form-field appearance="outline" class="form-field">
                                        <mat-label>Display Label</mat-label>
                                        <input matInput [(ngModel)]="col.label" placeholder="Friendly Name">
                                      </mat-form-field>
                                      <button mat-icon-button color="warn" (click)="field.sqlTableColumnsDef.splice($index, 1); syncSqlTableColumns(field)">
                                        <mat-icon>delete</mat-icon>
                                      </button>
                                    </div>
                                  }
                                  <button mat-stroked-button (click)="field.sqlTableColumnsDef.push({key: '', label: ''})" style="margin-top: 8px;">
                                    <mat-icon>add</mat-icon> Add Column
                                  </button>
                                  <button mat-button color="warn" (click)="field.sqlTableColumnsDef = null; field.sqlTableColumns = null" style="margin-top: 8px; margin-left: 8px;">
                                    Clear Columns (Auto-detect)
                                  </button>
                                }

                                <h4 class="config-section-title" style="margin-top: 16px;">
                                  <mat-icon>tune</mat-icon>
                                  Display Options
                                </h4>
                                <div class="checkbox-row" style="flex-wrap: wrap; gap: 16px;">
                                  <mat-checkbox [(ngModel)]="field.tableStriped">Striped Rows</mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableBordered">Bordered</mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableSearchable">Searchable</mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tablePageable">Paginated</mat-checkbox>
                                </div>
                                @if (field.tablePageable) {
                                  <mat-form-field appearance="outline" style="width: 150px; margin-top: 8px;">
                                    <mat-label>Page Size</mat-label>
                                    <mat-select [(ngModel)]="field.tablePageSize">
                                      <mat-option [value]="5">5</mat-option>
                                      <mat-option [value]="10">10</mat-option>
                                      <mat-option [value]="25">25</mat-option>
                                      <mat-option [value]="50">50</mat-option>
                                      <mat-option [value]="100">100</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                }
                              </div>
                            }

                            <!-- API field types config -->
                            @if (field.type === 'API_VALUE' || field.type === 'OBJECT_VIEWER') {
                              <div class="api-config">
                                <h4 class="config-section-title">
                                  <mat-icon>api</mat-icon>
                                  API Configuration
                                </h4>

                                <div class="api-show-toggle">
                                  <mat-slide-toggle color="primary"
                                    [checked]="field.apiTriggerMode === 'MANUAL'"
                                    (change)="field.apiTriggerMode = $event.checked ? 'MANUAL' : 'AUTO'">
                                    Manual trigger
                                  </mat-slide-toggle>
                                  <span class="toggle-hint">
                                    @if (field.apiTriggerMode === 'MANUAL') {
                                      User must click 'Go' to fetch data
                                    } @else {
                                      Data is fetched automatically when the form loads
                                    }
                                  </span>
                                </div>

                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field" style="flex: 2">
                                    <mat-label>API URL</mat-label>
                                    <input matInput [(ngModel)]="field.apiUrl" [placeholder]="'https://api.example.com/data/@\u007Bid\u007D'" required>
                                    <mat-hint>Endpoint URL. Use <code>{{ '@{fieldName}' }}</code> to insert form field values</mat-hint>
                                  </mat-form-field>

                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>HTTP Method</mat-label>
                                    <mat-select [(ngModel)]="field.apiMethod">
                                      <mat-option value="GET">GET</mat-option>
                                      <mat-option value="POST">POST</mat-option>
                                      <mat-option value="PUT">PUT</mat-option>
                                      <mat-option value="DELETE">DELETE</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                </div>

                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Authentication Type</mat-label>
                                    <mat-select [(ngModel)]="field.apiAuthType">
                                      <mat-option value="NONE">None</mat-option>
                                      <mat-option value="BASIC">Basic Auth</mat-option>
                                      <mat-option value="BEARER">Bearer Token (JWT)</mat-option>
                                      <mat-option value="API_KEY">API Key</mat-option>
                                    </mat-select>
                                  </mat-form-field>

                                  @if (field.apiAuthType && field.apiAuthType !== 'NONE') {
                                    <mat-form-field appearance="outline" class="form-field" style="flex: 2">
                                      <mat-label>
                                        @switch (field.apiAuthType) {
                                          @case ('BASIC') { Base64 Credentials (user:pass) }
                                          @case ('BEARER') { Bearer Token }
                                          @case ('API_KEY') { Header:Value (e.g. X-API-Key:abc123) }
                                        }
                                      </mat-label>
                                      <input matInput [(ngModel)]="field.apiAuthValue" type="password">
                                      <mat-hint>
                                        @switch (field.apiAuthType) {
                                          @case ('BASIC') { Base64 encoded username:password }
                                          @case ('BEARER') { JWT or OAuth token }
                                          @case ('API_KEY') { Format: HeaderName:Value }
                                        }
                                      </mat-hint>
                                    </mat-form-field>
                                  }
                                </div>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Response Path</mat-label>
                                  <input matInput [(ngModel)]="field.apiResponsePath" placeholder="data.results">
                                  <mat-hint>Dot notation path to extract data (e.g. data.items, response.results)</mat-hint>
                                </mat-form-field>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>On Response</mat-label>
                                  <textarea matInput [(ngModel)]="field.apiOnResponse" rows="2"
                                            placeholder="e.g. APIResponse.user.name or CONCAT(APIResponse.firstName, ' ', APIResponse.lastName)"></textarea>
                                  <mat-hint>Expression evaluated when the API response arrives. The response is accessible as <code>APIResponse</code>. Use dot notation (<code>APIResponse.user.email</code>) or any function (<code>CONCAT</code>, <code>IF</code>, etc.). Overrides Response Path when set.</mat-hint>
                                </mat-form-field>

                                @if (field.apiMethod === 'POST' || field.apiMethod === 'PUT') {
                                  <mat-form-field appearance="outline" class="form-field full-width">
                                    <mat-label>Request Body (JSON)</mat-label>
                                    <textarea matInput [(ngModel)]="field.apiBody" rows="3" [placeholder]="'{&quot;key&quot;: &quot;@\u007BfieldName\u007D&quot;}'"></textarea>
                                    <mat-hint>JSON body. Use <code>{{ '@{fieldName}' }}</code> to insert form field values</mat-hint>
                                  </mat-form-field>
                                }

                                <!-- Parameters -->
                                <div class="api-headers-section">
                                  <div class="columns-header">
                                    <span class="columns-title">Parameters</span>
                                    <button mat-stroked-button matTooltip="Add Parameter" type="button" (click)="addApiParam(field)" class="add-column-btn">
                                      <mat-icon>add</mat-icon> Add Parameter
                                    </button>
                                  </div>
                                  @for (param of getApiParams(field); track $index; let i = $index) {
                                    <div class="column-row">
                                      <mat-form-field appearance="outline" class="col-type-field">
                                        <mat-label>Type</mat-label>
                                        <mat-select [(ngModel)]="param.type">
                                          <mat-option value="QUERY">
                                            <mat-icon class="param-type-icon">search</mat-icon> Query
                                          </mat-option>
                                          <mat-option value="PATH">
                                            <mat-icon class="param-type-icon">route</mat-icon> Path
                                          </mat-option>
                                          <mat-option value="BODY">
                                            <mat-icon class="param-type-icon">data_object</mat-icon> Body
                                          </mat-option>
                                          <mat-option value="HEADER">
                                            <mat-icon class="param-type-icon">title</mat-icon> Header
                                          </mat-option>
                                        </mat-select>
                                      </mat-form-field>
                                      <mat-form-field appearance="outline" class="col-name-field">
                                        <mat-label>Name</mat-label>
                                        <input matInput [(ngModel)]="param.key" [placeholder]="param.type === 'PATH' ? 'e.g. id, userId' : 'e.g. page, limit'">
                                      </mat-form-field>
                                      <mat-form-field appearance="outline" class="col-label-field">
                                        <mat-label>Value</mat-label>
                                        <input matInput [(ngModel)]="param.value" [placeholder]="param.type === 'PATH' ? 'e.g. 123 or @\u007BfieldName\u007D' : 'e.g. 1, @\u007BfieldName\u007D'">
                                        <mat-hint>Use <code>{{ '@{fieldName}' }}</code> to reference a form field value</mat-hint>
                                      </mat-form-field>
                                      <button mat-icon-button matTooltip="Remove" color="warn" (click)="removeApiParam(field, i)">
                                        <mat-icon>delete</mat-icon>
                                      </button>
                                    </div>
                                    @if (param.type === 'PATH') {
                                      <div class="param-hint">
                                        <mat-icon>info</mat-icon>
                                        Use <code>{{"{"}}{{ param.key || 'name' }}{{"}" }}</code> or <code>:{{ param.key || 'name' }}</code> in the URL to mark the placeholder
                                      </div>
                                    }
                                  }
                                </div>

                                <!-- Custom Headers -->
                                <div class="api-headers-section">
                                  <div class="columns-header">
                                    <span class="columns-title">Custom Headers</span>
                                    <button mat-stroked-button matTooltip="Add Header" type="button" (click)="addApiHeader(field)" class="add-column-btn">
                                      <mat-icon>add</mat-icon> Add Header
                                    </button>
                                  </div>
                                  @for (header of getApiHeaders(field); track $index; let i = $index) {
                                    <div class="column-row">
                                      <mat-form-field appearance="outline" class="col-name-field">
                                        <mat-label>Header Name</mat-label>
                                        <input matInput [(ngModel)]="header.key" placeholder="Content-Type">
                                      </mat-form-field>
                                      <mat-form-field appearance="outline" class="col-label-field">
                                        <mat-label>Header Value</mat-label>
                                        <input matInput [(ngModel)]="header.value" [placeholder]="'application/json or @\u007BfieldName\u007D'">
                                        <mat-hint>Use <code>{{ '@{fieldName}' }}</code> to reference a form field value</mat-hint>
                                      </mat-form-field>
                                      <button mat-icon-button matTooltip="Remove" color="warn" (click)="removeApiHeader(field, i)">
                                        <mat-icon>delete</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>
                              </div>
                            }

                            <!-- TABLE field specific config -->
                            @if (field.type === 'TABLE') {
                              <div class="table-config">
                                <h4 class="config-section-title">
                                  <mat-icon>table_chart</mat-icon>
                                  Table Configuration
                                </h4>

                                <!-- Column definitions -->
                                <div class="columns-section">
                                  <div class="columns-header">
                                    <span class="columns-title">Columns</span>
                                    <button mat-stroked-button matTooltip="Add Column" type="button" (click)="addTableColumn(field)" class="add-column-btn">
                                      <mat-icon>add</mat-icon> Add Column
                                    </button>
                                  </div>

                                  @if (!field.tableColumns || field.tableColumns.length === 0) {
                                    <div class="no-columns-hint">
                                      <mat-icon>info</mat-icon>
                                      No columns defined. Click "Add Column" to define table columns.
                                    </div>
                                  }

                                  @for (col of field.tableColumns || []; track $index; let colIndex = $index) {
                                    <div class="column-row">
                                      <mat-form-field appearance="outline" class="col-name-field">
                                        <mat-label>Column Name</mat-label>
                                        <input matInput [(ngModel)]="col.name" placeholder="e.g., item_name" required>
                                      </mat-form-field>

                                      <mat-form-field appearance="outline" class="col-label-field">
                                        <mat-label>Column Label</mat-label>
                                        <input matInput [(ngModel)]="col.label" placeholder="e.g., Item Name" required>
                                      </mat-form-field>

                                      <mat-form-field appearance="outline" class="col-type-field">
                                        <mat-label>Type</mat-label>
                                        <mat-select [(ngModel)]="col.type">
                                          <mat-option value="TEXT">Text</mat-option>
                                          <mat-option value="NUMBER">Number</mat-option>
                                          <mat-option value="DATE">Date</mat-option>
                                          <mat-option value="CHECKBOX">Checkbox</mat-option>
                                        </mat-select>
                                      </mat-form-field>

                                      <mat-form-field appearance="outline" class="col-width-field">
                                        <mat-label>Width</mat-label>
                                        <input matInput type="number" [(ngModel)]="col.width" placeholder="Auto">
                                        <span matSuffix>px</span>
                                      </mat-form-field>

                                      <mat-form-field appearance="outline" class="col-default-field">
                                        <mat-label>Default</mat-label>
                                        <input matInput [(ngModel)]="col.defaultValue" placeholder="Default value">
                                      </mat-form-field>

                                      <mat-checkbox [(ngModel)]="col.readOnly" (change)="onColumnReadOnlyChange(field)" class="col-readonly-checkbox" matTooltip="Make this column read-only">
                                        <mat-icon class="readonly-icon">lock</mat-icon>
                                      </mat-checkbox>

                                      <button mat-icon-button color="warn" type="button" (click)="removeTableColumn(field, colIndex)" matTooltip="Remove column">
                                        <mat-icon>delete</mat-icon>
                                      </button>
                                    </div>
                                  }
                                </div>

                                <!-- Row configuration -->
                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Min Rows</mat-label>
                                    <input matInput type="number" [(ngModel)]="field.tableMinRows" min="0">
                                    <mat-hint>Minimum number of rows required</mat-hint>
                                  </mat-form-field>

                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Max Rows</mat-label>
                                    <input matInput type="number" [(ngModel)]="field.tableMaxRows" min="1">
                                    <mat-hint>Maximum rows allowed (empty = unlimited)</mat-hint>
                                  </mat-form-field>
                                </div>

                                <!-- Styling options -->
                                <div class="table-styling">
                                  <mat-checkbox [(ngModel)]="field.tableStriped">
                                    Striped rows
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableBordered">
                                    Cell borders
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableResizable">
                                    Resizable columns
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableSearchable">
                                    Global search
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableFilterable">
                                    Column filters
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tablePageable">
                                    Pagination
                                  </mat-checkbox>
                                </div>
                                @if (field.tablePageable) {
                                  <mat-form-field appearance="outline" class="form-field" style="max-width: 200px; margin-top: 8px;">
                                    <mat-label>Page Size</mat-label>
                                    <mat-select [(ngModel)]="field.tablePageSize">
                                      <mat-option [value]="5">5 rows</mat-option>
                                      <mat-option [value]="10">10 rows</mat-option>
                                      <mat-option [value]="15">15 rows</mat-option>
                                      <mat-option [value]="25">25 rows</mat-option>
                                      <mat-option [value]="50">50 rows</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                }
                              </div>
                            }

                            <!-- ACCORDION field specific config -->
                            @if (field.type === 'ACCORDION') {
                              <div class="accordion-config">
                                <h4 class="config-section-title">
                                  <mat-icon>view_agenda</mat-icon>
                                  Accordion Configuration
                                </h4>

                                @if (screens.length > 0) {
                                  <div class="form-row">
                                    <mat-form-field appearance="outline" class="form-field full-width">
                                      <mat-label>Screen</mat-label>
                                      <mat-select [(ngModel)]="field.screenId">
                                        <mat-option [value]="null">None (All Screens)</mat-option>
                                        @for (screen of getNonSummaryScreens(); track screen.id) {
                                          <mat-option [value]="screen.id">{{ screen.title || 'Untitled Screen' }}</mat-option>
                                        }
                                      </mat-select>
                                      <mat-hint>Assign this accordion to a specific screen</mat-hint>
                                    </mat-form-field>
                                  </div>
                                }

                                <div class="form-row">
                                  <mat-checkbox [(ngModel)]="field.accordionAllowMultiple">
                                    Allow multiple panels open at once
                                  </mat-checkbox>
                                </div>

                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Default Open Panel Index</mat-label>
                                    <input matInput type="number" [(ngModel)]="field.accordionDefaultOpenIndex" min="-1">
                                    <mat-hint>0 = first panel, -1 = none open by default</mat-hint>
                                  </mat-form-field>

                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Animation Type</mat-label>
                                    <mat-select [(ngModel)]="field.accordionAnimationType">
                                      <mat-option value="smooth">Smooth</mat-option>
                                      <mat-option value="none">None</mat-option>
                                      <mat-option value="bounce">Bounce</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                </div>

                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Animation Duration (ms)</mat-label>
                                    <input matInput type="number" [(ngModel)]="field.accordionAnimationDuration" min="0" max="2000">
                                    <mat-hint>Duration in milliseconds (0-2000)</mat-hint>
                                  </mat-form-field>
                                </div>

                                <div class="accordion-info">
                                  <mat-icon>info</mat-icon>
                                  <span>Add Collapsible fields after this accordion to create nested panels. Collapsibles will be assigned to this accordion automatically.</span>
                                </div>
                              </div>
                            }

                            <!-- COLLAPSIBLE field specific config -->
                            @if (field.type === 'COLLAPSIBLE') {
                              <div class="collapsible-config">
                                <h4 class="config-section-title">
                                  <mat-icon>expand_more</mat-icon>
                                  Collapsible Configuration
                                </h4>

                                <div class="form-row">
                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Panel Title</mat-label>
                                    <input matInput [(ngModel)]="field.collapsibleTitle" placeholder="e.g., Personal Details">
                                    <mat-hint>Title displayed in the collapsible header</mat-hint>
                                  </mat-form-field>

                                  <mat-form-field appearance="outline" class="form-field">
                                    <mat-label>Icon</mat-label>
                                    <mat-select [(ngModel)]="field.collapsibleIcon">
                                      <mat-option value="">None</mat-option>
                                      <mat-option value="person">person</mat-option>
                                      <mat-option value="info">info</mat-option>
                                      <mat-option value="description">description</mat-option>
                                      <mat-option value="assignment">assignment</mat-option>
                                      <mat-option value="folder">folder</mat-option>
                                      <mat-option value="settings">settings</mat-option>
                                      <mat-option value="attach_money">attach_money</mat-option>
                                      <mat-option value="calendar_today">calendar_today</mat-option>
                                      <mat-option value="work">work</mat-option>
                                      <mat-option value="home">home</mat-option>
                                    </mat-select>
                                  </mat-form-field>
                                </div>

                                <div class="form-row">
                                  <mat-checkbox [(ngModel)]="field.collapsibleDefaultExpanded">
                                    Expanded by default
                                  </mat-checkbox>
                                </div>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Parent Accordion</mat-label>
                                  <mat-select [(ngModel)]="field.parentFieldId" (selectionChange)="onCollapsibleParentChange(field)">
                                    <mat-option [value]="null">None (Standalone)</mat-option>
                                    @for (accordion of getAccordionFields(); track accordion.id) {
                                      <mat-option [value]="accordion.id">{{ accordion.label || accordion.name || 'Untitled Accordion' }}</mat-option>
                                    }
                                  </mat-select>
                                  <mat-hint>Assign this collapsible to an accordion, or leave standalone</mat-hint>
                                </mat-form-field>

                                <!-- Show screen selection only for standalone collapsibles -->
                                @if (!field.parentFieldId && screens.length > 0) {
                                  <mat-form-field appearance="outline" class="form-field full-width">
                                    <mat-label>Screen</mat-label>
                                    <mat-select [(ngModel)]="field.screenId">
                                      <mat-option [value]="null">None (All Screens)</mat-option>
                                      @for (screen of getNonSummaryScreens(); track screen.id) {
                                        <mat-option [value]="screen.id">{{ screen.title || 'Untitled Screen' }}</mat-option>
                                      }
                                    </mat-select>
                                    <mat-hint>Assign this standalone collapsible to a specific screen</mat-hint>
                                  </mat-form-field>
                                }

                                <div class="collapsible-info">
                                  <mat-icon>info</mat-icon>
                                  @if (field.parentFieldId) {
                                    <span>This collapsible belongs to an accordion. Fields placed after it will be contained within this panel.</span>
                                  } @else {
                                    <span>This is a standalone collapsible. Fields placed after it (until the next collapsible or accordion) will be contained within this panel.</span>
                                  }
                                </div>
                              </div>
                            }

                            <!-- Validation & Transformation Section (not for container fields) -->
                            @if (field.type !== 'ACCORDION' && field.type !== 'COLLAPSIBLE') {
                              <mat-expansion-panel class="validation-panel">
                                <mat-expansion-panel-header>
                                  <mat-panel-title>
                                    <mat-icon>rule</mat-icon>
                                    Validation & Transformation
                                  </mat-panel-title>
                                </mat-expansion-panel-header>

                                <div class="vt-section">
                                  <mat-form-field appearance="outline" class="form-field full-width"
                                                  [class.expr-error]="validateExpression(field.validation, 'validation')">
                                    <mat-label>Validation Expression</mat-label>
                                    <textarea matInput [(ngModel)]="field.validation" rows="2"
                                              [style.color]="validateExpression(field.validation, 'validation') ? '#f44336' : null"
                                              placeholder="e.g., Required() AND MinLength(5)"></textarea>
                                    <mat-hint>Combine functions with AND</mat-hint>
                                  </mat-form-field>
                                  @if (validateExpression(field.validation, 'validation')) {
                                    <div class="expr-error-msg">{{ validateExpression(field.validation, 'validation') }}</div>
                                  }
                                  <details class="vt-help">
                                    <summary>Available functions</summary>
                                    <div class="vt-help-content">
                                      <strong>String:</strong> <code>Required()</code> <code>NotEmpty()</code> <code>MinLength(n)</code> <code>MaxLength(n)</code> <code>LengthRange(min,max)</code> <code>Alpha()</code> <code>AlphaNumeric()</code> <code>Digits()</code> <code>Pattern(/regex/)</code> <code>Contains("text")</code> <code>StartsWith("text")</code> <code>EndsWith("text")</code> <code>Equals("value")</code>
                                      <br><strong>Number:</strong> <code>Min(n)</code> <code>Max(n)</code> <code>Range(min,max)</code> <code>Positive()</code> <code>Negative()</code> <code>Integer()</code> <code>Decimal(places)</code>
                                      <br><strong>Boolean:</strong> <code>IsTrue()</code> <code>IsFalse()</code>
                                      <br><strong>Date:</strong> <code>Date()</code> <code>FutureDate()</code> <code>PastDate()</code> <code>DateBefore("date")</code> <code>DateAfter("date")</code> <em style="font-size:0.75rem">(aliases: IS_PAST, IS_FUTURE, IS_DATE)</em>
                                      <br><strong>Format:</strong> <code>Email()</code> <code>Phone()</code> <code>URL()</code> <code>CreditCard()</code>
                                      <br><strong>List/Table:</strong> <code>MinItems(n)</code> <code>MaxItems(n)</code> <code>MinRows(n)</code> <code>MaxRows(n)</code>
                                      <br><strong>Cross-field:</strong> <code>MatchField(fieldName)</code> <code>ValidWhen(expr)</code> <code>InvalidWhen(expr)</code> <code>Unique()</code>
                                      <br><em>All functions accept an optional custom message: e.g., Required("Please fill this in"). Use &#64;&#123;fieldName&#125; in ValidWhen/InvalidWhen. Combine with AND.</em>
                                    </div>
                                  </details>
                                </div>

                                <div class="vt-section">
                                  <mat-form-field appearance="outline" class="form-field full-width"
                                                  [class.expr-error]="validateExpression(field.customValidationRule, 'transform')">
                                    <mat-label>Transform Expression</mat-label>
                                    <textarea matInput [(ngModel)]="field.customValidationRule" rows="2"
                                              [style.color]="validateExpression(field.customValidationRule, 'transform') ? '#f44336' : null"
                                              placeholder="e.g., UPPER() or TRIM()"></textarea>
                                    <mat-hint>Transform the field value</mat-hint>
                                  </mat-form-field>
                                  @if (validateExpression(field.customValidationRule, 'transform')) {
                                    <div class="expr-error-msg">{{ validateExpression(field.customValidationRule, 'transform') }}</div>
                                  }
                                  <details class="vt-help">
                                    <summary>Available transforms</summary>
                                    <div class="vt-help-content">
                                      <strong>String:</strong> <code>UPPER()</code> <code>LOWER()</code> <code>CAPITALIZE()</code> <code>TRIM()</code> <code>LTRIM()</code> <code>RTRIM()</code> <code>SLUG()</code> <code>REMOVE_SPACES()</code> <code>SUBSTRING(start, end)</code> <code>REPLACE("search", "replace")</code> <code>PAD_LEFT(len, "char")</code> <code>PAD_RIGHT(len, "char")</code>
                                      <br><strong>Number:</strong> <code>ROUND(decimals)</code> <code>ROUND_UP(decimals)</code> <code>ROUND_DOWN(decimals)</code>
                                      <br><em>Combine with AND: e.g., TRIM() AND UPPER()</em>
                                    </div>
                                  </details>
                                </div>

                                <div class="vt-section">
                                  <mat-form-field appearance="outline" class="form-field full-width">
                                    <mat-label>Custom Error Message</mat-label>
                                    <input matInput [(ngModel)]="field.validationMessage"
                                           placeholder="Custom message when validation fails">
                                  </mat-form-field>
                                </div>

                                <div class="vt-section">
                                  <mat-form-field appearance="outline" class="form-field full-width"
                                                  [class.expr-error]="validateExpression(field.visibilityExpression, 'visibility')">
                                    <mat-label>Visibility Expression</mat-label>
                                    <textarea matInput [(ngModel)]="field.visibilityExpression" rows="2"
                                              [style.color]="validateExpression(field.visibilityExpression, 'visibility') ? '#f44336' : null"
                                              placeholder="e.g., true or &#64;{otherField} == 'Yes'"></textarea>
                                    <mat-hint>Use &#64;{{ '{' }}fieldName{{ '}' }} to reference other fields. Default: true</mat-hint>
                                  </mat-form-field>
                                  @if (validateExpression(field.visibilityExpression, 'visibility')) {
                                    <div class="expr-error-msg">{{ validateExpression(field.visibilityExpression, 'visibility') }}</div>
                                  }
                                </div>
                              </mat-expansion-panel>
                            }

                            <div class="field-actions">
                              <button mat-button matTooltip="Remove" color="warn" (click)="removeField(field)">
                                <mat-icon>delete</mat-icon>
                                Remove
                              </button>
                            </div>
                          </div>
                        </mat-expansion-panel>
                      }

                      @if (getFilteredFields().length === 0) {
                        <div class="empty-canvas">
                          <mat-icon>touch_app</mat-icon>
                          @if (activeScreenId) {
                            <p>No fields in this screen. Click on field types to add fields to "{{ getScreenTitle(activeScreenId) }}"</p>
                          } @else {
                            <p>Click on field types to add them to your form</p>
                          }
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Title Tab -->
        <mat-tab label="Title">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>title</mat-icon>
                  Title Advanced Settings
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="title-help">
                  Build the submission title by picking fields (or workflow placeholders) in order and defining connector text between them.
                  Only fields marked as <strong>"Contributes to Title"</strong> in the Form Builder appear in the Field dropdown.
                  Titles regenerate on every save/submit. When a field is deleted, its reference is removed automatically.
                </p>

                @if (getTitleContributingFields().length === 0 && titleTemplateParts.length === 0) {
                  <div class="access-info" style="background: #fff3e0; border-left: 4px solid #ff9800;">
                    <mat-icon style="color: #ff9800;">info</mat-icon>
                    <p>No fields are marked as <strong>"Contributes to Title"</strong> yet. Go to the Form Builder tab, open a field, and enable <em>"Contributes to Title"</em> to make it available here. Workflow placeholders are always available.</p>
                  </div>
                }

                @if (titleTemplateParts.length === 0) {
                  <p class="empty-parts">No parts added. Click "Add Field" below to start building the title.</p>
                }

                <div class="title-parts-list">
                  @for (part of titleTemplateParts; track $index; let i = $index; let isLast = $last) {
                    <div class="title-part-row">
                      <mat-form-field appearance="outline" class="title-part-field">
                        <mat-label>Field</mat-label>
                        <mat-select [(ngModel)]="part.field" [ngModelOptions]="{standalone: true}" (selectionChange)="updateTitleTemplate()">
                          @if (getTitleContributingFields().length > 0) {
                            <mat-optgroup label="Form Fields (marked as Contributes to Title)">
                              @for (f of getTitleContributingFields(); track f.name) {
                                <mat-option [value]="f.name">{{ f.label || f.name }}</mat-option>
                              }
                            </mat-optgroup>
                          }
                          <mat-optgroup label="Workflow Placeholders">
                            @for (p of titleWorkflowPlaceholders; track p.key) {
                              <mat-option [value]="p.key">{{ p.label }}</mat-option>
                            }
                          </mat-optgroup>
                        </mat-select>
                      </mat-form-field>

                      @if (!isLast) {
                        <mat-form-field appearance="outline" class="title-connector-field">
                          <mat-label>Connector</mat-label>
                          <input matInput [(ngModel)]="part.connector" [ngModelOptions]="{standalone: true}" (input)="updateTitleTemplate()" placeholder=" - ">
                        </mat-form-field>
                      }

                      <button mat-icon-button type="button" matTooltip="Move up" [disabled]="i === 0" (click)="moveTitlePart(i, -1)">
                        <mat-icon>arrow_upward</mat-icon>
                      </button>
                      <button mat-icon-button type="button" matTooltip="Move down" [disabled]="isLast" (click)="moveTitlePart(i, 1)">
                        <mat-icon>arrow_downward</mat-icon>
                      </button>
                      <button mat-icon-button type="button" matTooltip="Remove" color="warn" (click)="removeTitlePart(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }
                </div>

                <button mat-stroked-button type="button" color="primary" (click)="addTitlePart()" style="margin-top: 0.5rem;">
                  <mat-icon>add</mat-icon>
                  Add Field
                </button>

                <div class="title-preview" style="margin-top: 1rem;">
                  <strong>Preview:</strong>
                  <code class="title-preview-code">{{ getTitlePreview() }}</code>
                </div>

                <form [formGroup]="basicForm">
                  <mat-form-field appearance="outline" class="full-width" style="margin-top: 1rem;">
                    <mat-label>Template (raw)</mat-label>
                    <input matInput formControlName="titleTemplate" readonly>
                    <mat-hint>Auto-generated from the builder above</mat-hint>
                  </mat-form-field>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Approvers Tab -->
        <mat-tab label="Approvers">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Approval Levels</mat-card-title>
                <button mat-raised-button matTooltip="Add Approver" color="primary" (click)="addApprover()">
                  <mat-icon>add</mat-icon>
                  Add Approver
                </button>
              </mat-card-header>
              <mat-card-content>
                <div cdkDropList (cdkDropListDropped)="dropApprover($event)" class="approver-list">
                  @for (approver of approvers; track $index; let i = $index) {
                    <mat-expansion-panel cdkDrag class="approver-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                          Level {{ approver.level }}: {{ getApproverDisplayName(approver) || 'Approver' }}
                        </mat-panel-title>
                        <mat-panel-description>
                          {{ approver.email }}
                          @if (approver.amountLimit) {
                            - Up to {{ approver.amountLimit | currency }}
                          }
                        </mat-panel-description>
                      </mat-expansion-panel-header>

                      <div class="approver-config">
                        <div class="form-row">
                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Level</mat-label>
                            <input matInput type="number" [(ngModel)]="approver.level" min="1">
                            <mat-hint>Same level = parallel approval</mat-hint>
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Select User</mat-label>
                            <mat-select [(ngModel)]="approver.approverId" (selectionChange)="onApproverUserSelected(approver)">
                              @for (user of users; track user.id) {
                                <mat-option [value]="user.id">{{ user.fullName }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Amount Limit</mat-label>
                            <input matInput type="number" [(ngModel)]="approver.amountLimit">
                            <mat-hint>Leave blank for no limit</mat-hint>
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Email</mat-label>
                            <input matInput type="email" [(ngModel)]="approver.email" readonly>
                            <mat-hint>Auto-populated from selected user</mat-hint>
                          </mat-form-field>
                        </div>

                        <div class="checkbox-row">
                          <mat-checkbox [(ngModel)]="approver.canEscalate">Can Escalate</mat-checkbox>
                          <mat-checkbox [(ngModel)]="approver.requireComment">Require Comment</mat-checkbox>
                          <mat-checkbox [(ngModel)]="approver.emailNotification">Email Notification</mat-checkbox>
                        </div>

                        <div class="approver-actions">
                          <button mat-button matTooltip="Remove Level" color="warn" (click)="removeApprover(i)">
                            <mat-icon>delete</mat-icon>
                            Remove Level
                          </button>
                        </div>
                      </div>
                    </mat-expansion-panel>
                  }
                </div>

                @if (approvers.length === 0) {
                  <div class="empty-state">
                    <mat-icon>approval</mat-icon>
                    <p>No approval levels defined. Add levels to create an approval chain.</p>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Access Tab -->
        <mat-tab label="Access">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>lock</mat-icon>
                  Access
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (childInheritAccess && basicForm.get('parentWorkflowId')?.value) {
                  <div class="access-info" style="background: var(--warn-bg, #fff3e0); border-left: 4px solid var(--warn-color, #ff9800);">
                    <mat-icon style="color: var(--warn-color, #ff9800);">sync</mat-icon>
                    <p>This child workflow inherits access from its parent workflow. Access is automatically kept in sync when the parent's access changes. To manage access independently, disable <strong>"Child Workflows Inherit Parent Access"</strong> in Settings &gt; Workflow.</p>
                  </div>
                } @else {
                  <div class="access-info">
                    <mat-icon>info</mat-icon>
                    <p>Leave all fields empty to make this workflow visible to all users. Select specific corporates, SBUs, branches, or departments to restrict access.</p>
                  </div>
                }

                <form [formGroup]="basicForm">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Corporates</mat-label>
                      <mat-select formControlName="corporateIds" multiple (selectionChange)="onCorporateChange()" [disabled]="childInheritAccess && basicForm.get('parentWorkflowId')?.value">
                        @for (corp of corporates; track corp.id) {
                          <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Users from selected corporates can access this workflow</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>SBUs</mat-label>
                      <mat-select formControlName="sbuIds" multiple (selectionChange)="onSbuChange()" [disabled]="childInheritAccess && basicForm.get('parentWorkflowId')?.value">
                        @for (sbu of filteredSbus; track sbu.id) {
                          <mat-option [value]="sbu.id">{{ sbu.name }} @if (sbu.corporateName) { ({{ sbu.corporateName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filter by corporate first for relevant SBUs</mat-hint>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Branches</mat-label>
                      <mat-select formControlName="branchIds" multiple [disabled]="childInheritAccess && basicForm.get('parentWorkflowId')?.value">
                        @for (branch of filteredBranches; track branch.id) {
                          <mat-option [value]="branch.id">{{ branch.name }} @if (branch.sbuName) { ({{ branch.sbuName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filter by SBU first for relevant branches</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Departments</mat-label>
                      <mat-select formControlName="departmentIds" multiple [disabled]="childInheritAccess && basicForm.get('parentWorkflowId')?.value">
                        @for (dept of filteredDepartments; track dept.id) {
                          <mat-option [value]="dept.id">{{ dept.name }} @if (dept.corporateName) { ({{ dept.corporateName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filter by corporate first for relevant departments</mat-hint>
                    </mat-form-field>
                  </div>

                  <!-- Permission-Based Restrictions -->
                  <div class="form-row" style="margin-top: 20px;">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Roles</mat-label>
                      <mat-select formControlName="roleIds" multiple (selectionChange)="onWorkflowRolesChange()" [disabled]="childInheritAccess && basicForm.get('parentWorkflowId')?.value">
                        @for (role of roles; track role.id) {
                          <mat-option [value]="role.id">{{ role.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Select roles to filter available privileges</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Privileges</mat-label>
                      <mat-select formControlName="privilegeIds" multiple [disabled]="(childInheritAccess && basicForm.get('parentWorkflowId')?.value) || filteredPrivilegesForWorkflow.length === 0">
                        @for (privilege of filteredPrivilegesForWorkflow; track privilege.id) {
                          <mat-option [value]="privilege.id">
                            {{ privilege.name }} @if (privilege.category) { ({{ privilege.category }}) }
                          </mat-option>
                        }
                      </mat-select>
                      <mat-hint>@if (filteredPrivilegesForWorkflow.length === 0) { Select roles first to see privileges } @else { If selected, privileges override role restrictions }</mat-hint>
                    </mat-form-field>
                  </div>
                </form>

                <div class="access-summary">
                  <h4>Current Access Summary</h4>
                  @if (getAccessSummary().length === 0) {
                    <p class="no-restrictions">No restrictions - All users can access this workflow</p>
                  } @else {
                    <div class="restriction-chips">
                      @for (item of getAccessSummary(); track item) {
                        <mat-chip>{{ item }}</mat-chip>
                      }
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Reminders Tab -->
        <mat-tab label="Reminders">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>notifications_active</mat-icon>
                  Approval Reminders
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="basicForm">
                  <div class="reminder-section">
                    <h4>Reminder Settings</h4>
                    <div class="access-info">
                      <mat-icon>info</mat-icon>
                      <p>Configure automatic email reminders for pending approvals. Reminders are sent to approvers at the current level who have not yet acted.</p>
                    </div>

                    <div class="form-row">
                      <mat-slide-toggle formControlName="reminderEnabled" color="primary">
                        Enable Approval Reminders
                      </mat-slide-toggle>
                    </div>

                    @if (basicForm.get('reminderEnabled')?.value) {
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Start Reminders After (hours)</mat-label>
                          <input matInput type="number" formControlName="reminderStartAfterHours" min="1">
                          <mat-hint>Hours after submission before the first reminder is sent</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Reminder Frequency (hours)</mat-label>
                          <input matInput type="number" formControlName="reminderFrequencyHours" min="1">
                          <mat-hint>Hours between each subsequent reminder</mat-hint>
                        </mat-form-field>
                      </div>

                      <div class="form-row">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Maximum Reminders</mat-label>
                          <input matInput type="number" formControlName="reminderMaxCount" min="1" max="20">
                          <mat-hint>Maximum number of reminders per pending approval</mat-hint>
                        </mat-form-field>

                        <div class="form-field" style="display: flex; align-items: center;">
                          <mat-slide-toggle formControlName="reminderIncludeSubmitter" color="primary">
                            Also Notify Submitter
                          </mat-slide-toggle>
                        </div>
                      </div>
                    }
                  </div>

                  <mat-divider style="margin: 24px 0;"></mat-divider>

                  <div class="reminder-section">
                    <h4>Escalation</h4>
                    <div class="access-info">
                      <mat-icon>info</mat-icon>
                      <p>Automatically escalate if an approval remains pending beyond the configured time. Escalation occurs after all reminders are exhausted.</p>
                    </div>

                    <div class="form-row">
                      <mat-slide-toggle formControlName="escalationEnabled" color="warn">
                        Enable Auto-Escalation
                      </mat-slide-toggle>
                    </div>

                    @if (basicForm.get('escalationEnabled')?.value) {
                      <div class="form-row">
                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Escalate After (hours)</mat-label>
                          <input matInput type="number" formControlName="escalationAfterHours" min="1">
                          <mat-hint>Hours after submission before escalation triggers</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="form-field">
                          <mat-label>Escalation Action</mat-label>
                          <mat-select formControlName="escalationAction">
                            <mat-option value="NOTIFY_ADMIN">Notify Admin</mat-option>
                            <mat-option value="AUTO_APPROVE">Auto-Approve</mat-option>
                            <mat-option value="REASSIGN_NEXT_LEVEL">Reassign to Next Level</mat-option>
                          </mat-select>
                          <mat-hint>Action to take when escalation triggers</mat-hint>
                        </mat-form-field>
                      </div>
                    }
                  </div>

                  <mat-divider style="margin: 24px 0;"></mat-divider>

                  <div class="reminder-section">
                    <h4>Custom Email Template (Optional)</h4>
                    <div class="access-info">
                      <mat-icon>info</mat-icon>
                      <p>Customize the reminder email. Leave blank to use the default template.</p>
                    </div>

                    <details class="vt-help" style="margin-bottom: 1rem;">
                      <summary>Available placeholders</summary>
                      <div class="vt-help-content" style="display: block;">
                        <strong>Workflow:</strong>
                        <code [innerText]="'@{workflowName}'"></code>
                        <code [innerText]="'@{workflowCode}'"></code>
                        <br><strong>Submission:</strong>
                        <code [innerText]="'@{referenceNumber}'"></code>
                        <code [innerText]="'@{submissionTitle}'"></code>
                        <code [innerText]="'@{status}'"></code>
                        <code [innerText]="'@{amount}'"></code>
                        <code [innerText]="'@{sbuName}'"></code>
                        <br><strong>Approver:</strong>
                        <code [innerText]="'@{approverName}'"></code>
                        <code [innerText]="'@{approverEmail}'"></code>
                        <code [innerText]="'@{approvalLevel}'"></code>
                        <br><strong>Submitter:</strong>
                        <code [innerText]="'@{submitterName}'"></code>
                        <code [innerText]="'@{submitterEmail}'"></code>
                        <code [innerText]="'@{submitterDepartment}'"></code>
                        <br><strong>Dates:</strong>
                        <code [innerText]="'@{submittedDate}'"></code>
                        <code [innerText]="'@{submittedTime}'"></code>
                        <code [innerText]="'@{submittedDateTime}'"></code>
                        <code [innerText]="'@{daysPending}'"></code>
                        <br><strong>Reminder:</strong>
                        <code [innerText]="'@{reminderNumber}'"></code>
                        <code [innerText]="'@{reminderMax}'"></code>
                      </div>
                    </details>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email Subject</mat-label>
                      <input matInput formControlName="reminderEmailSubject" [placeholder]="reminderSubjectPlaceholder">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Email Body</mat-label>
                      <textarea matInput formControlName="reminderEmailBody" rows="5"
                                [placeholder]="reminderBodyPlaceholder"></textarea>
                    </mat-form-field>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .workflow-builder-container { padding: 1rem; }

    @media (max-width: 600px) {
      .workflow-builder-container { padding: 0.5rem; }
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header h1 { flex: 1; margin: 0; font-size: 1.5rem; }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .header {
        flex-wrap: wrap;
      }
      .header h1 { font-size: 1.2rem; width: 100%; }
      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .tab-content { padding: 1rem 0; }

    ::ng-deep .mat-mdc-tab {
      min-width: 0 !important;
      padding: 0 12px !important;
      font-size: 13px;
    }

    /* Responsive workflow tabs — always stretch to fill the available width.
       Each tab gets an equal share; padding and font shrink on narrower screens
       so labels keep fitting without needing horizontal scrolling. */
    .workflow-tabs {
      width: 100%;
    }

    ::ng-deep .workflow-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid rgba(0,0,0,0.12);
    }

    ::ng-deep .workflow-tabs .mat-mdc-tab-labels {
      flex-wrap: nowrap;
      width: 100%;
    }

    ::ng-deep .workflow-tabs .mat-mdc-tab {
      flex: 1 1 0 !important;
      min-width: 0 !important;
    }

    ::ng-deep .workflow-tabs .mdc-tab__text-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    @media (max-width: 1024px) {
      ::ng-deep .workflow-tabs .mat-mdc-tab {
        padding: 0 8px !important;
        font-size: 12px;
        min-height: 44px !important;
        letter-spacing: 0;
      }
    }

    @media (max-width: 768px) {
      ::ng-deep .workflow-tabs .mat-mdc-tab {
        padding: 0 4px !important;
        font-size: 11px;
        min-height: 40px !important;
      }
    }

    @media (max-width: 600px) {
      ::ng-deep .workflow-tabs .mat-mdc-tab {
        padding: 0 2px !important;
        font-size: 10px;
        min-height: 36px !important;
      }
      .tab-content { padding: 0.5rem 0; }
    }

    /* Increase vertical spacing between fields on tablet and mobile so
       the mat-hint text (which is absolutely positioned by Material) does
       not spill into the next field below when labels wrap to 2+ lines. */
    @media (max-width: 1024px) {
      .tab-content .form-row {
        margin-bottom: 1.5rem;
      }
      .tab-content mat-form-field,
      .tab-content .mat-mdc-form-field {
        margin-bottom: 1.5rem;
      }
      .tab-content .checkbox-row {
        gap: 1rem;
        row-gap: 0.75rem;
      }
    }

    @media (max-width: 768px) {
      .tab-content .form-row {
        flex-direction: column;
        gap: 0;
        margin-bottom: 2rem;
      }
      .tab-content mat-form-field,
      .tab-content .mat-mdc-form-field {
        margin-bottom: 2rem;
        width: 100%;
      }
      .tab-content .checkbox-row {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      /* Field config inside Form Builder */
      .field-config .form-row,
      .field-config .form-field,
      .field-config .full-width {
        margin-bottom: 2rem;
      }
      /* Validation & Transformation sections */
      .vt-section .form-field {
        margin-bottom: 2.5rem;
      }
      /* Title template rows should stack vertically */
      .title-part-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px dashed #e0e0e0;
      }
      .title-part-field,
      .title-connector-field {
        width: 100%;
      }
    }

    @media (max-width: 600px) {
      .tab-content .form-row,
      .tab-content mat-form-field,
      .tab-content .mat-mdc-form-field {
        margin-bottom: 2.25rem;
      }
    }

    .sql-col-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .sql-col-row .form-field { flex: 1; }

    .config-hint {
      font-size: 12px;
      color: #666;
      margin: 0 0 12px;
    }

    .reminder-section h4 {
      margin: 0 0 12px;
      font-size: 1rem;
      font-weight: 500;
    }

    .full-width { width: 100%; }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-field { flex: 1; }

    .full-width { width: 100%; }

    .checkbox-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 2rem;
      margin: 1rem 0;
    }

    .builder-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1rem;
    }

    @media (max-width: 1024px) {
      .builder-layout {
        grid-template-columns: 260px 1fr;
      }
    }

    @media (max-width: 900px) {
      .builder-layout {
        grid-template-columns: 1fr;
      }
      .field-palette {
        position: static !important;
        height: auto !important;
        min-height: 300px !important;
        max-height: 400px;
      }
    }

    .field-palette {
      position: sticky;
      top: 0;
      height: calc(100vh - 140px);
      min-height: 500px;
    }

    .field-palette mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .field-palette mat-card-content.palette-content {
      padding: 0 !important;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    .palette-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .palette-tabs ::ng-deep .mat-mdc-tab-group {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .palette-tabs ::ng-deep .mat-mdc-tab-header {
      flex-shrink: 0;
    }

    .palette-tabs ::ng-deep .mat-mdc-tab-body-wrapper {
      flex: 1;
      min-height: 0;
    }

    .palette-tabs ::ng-deep .mat-mdc-tab-body {
      height: 100%;
    }

    .palette-tabs ::ng-deep .mat-mdc-tab-body-content {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .palette-tab-content {
      padding: 1rem;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .field-types {
      display: grid;
      gap: 0.5rem;
    }

    .field-type-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .field-type-item:hover {
      background: #e3f2fd;
      border-color: #1976d2;
    }

    .field-types.disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .field-type-item.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .summary-screen-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fff3e0;
      border: 1px solid #ffcc80;
      border-radius: 6px;
      margin-bottom: 0.75rem;
      font-size: 0.82rem;
      color: #e65100;
    }

    .summary-screen-notice mat-icon {
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .summary-screen-notice p {
      margin: 0;
      line-height: 1.4;
    }

    .summary-tab {
      font-style: italic;
    }

    .lock-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      margin-left: 2px;
      opacity: 0.6;
    }

    .palette-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .palette-section h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: #666;
    }

    .function-category {
      margin-bottom: 1.25rem;
    }

    .function-category h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem 0;
      font-size: var(--function-font-size, 0.8rem);
      font-weight: 600;
      color: var(--function-category-color, #1976d2);
      padding-bottom: 0.375rem;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }

    .function-category h4 mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .function-list {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .function-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.375rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      border: 1px solid transparent;
    }

    .function-main {
      flex: 1;
      min-width: 0;
    }

    .function-help-btn {
      opacity: 0;
      transition: opacity 0.2s;
      transform: scale(0.8);
      color: #666;
    }

    .function-item:hover .function-help-btn {
      opacity: 1;
    }

    .function-help-btn:hover {
      color: #1976d2;
    }

    .function-item:hover {
      background: #e3f2fd;
      border-color: #90caf9;
    }

    .function-name {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.7rem;
      font-weight: 500;
      color: #1565c0;
    }

    .function-desc {
      font-size: 0.65rem;
      color: #666;
      margin-top: 0.125rem;
    }

    .placeholder-guide {
      font-size: 0.75rem;
      color: #666;
      padding: 0.5rem 0.75rem;
      background: #f0f4ff;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .title-template-panel {
      background: #fafafa;
    }

    .title-template-content {
      padding: 0.5rem 0;
    }

    .title-help {
      font-size: 0.85rem;
      color: #666;
      margin: 0 0 1rem 0;
    }

    .empty-parts {
      font-size: 0.85rem;
      color: #888;
      font-style: italic;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .title-parts-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .title-part-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .title-part-field {
      flex: 2;
    }

    .title-connector-field {
      flex: 1;
      min-width: 120px;
    }

    .title-preview-code {
      display: inline-block;
      margin-left: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .copy-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }

    .function-search {
      margin-bottom: 0.75rem;
    }

    .function-search .search-field {
      width: 100%;
    }

    .function-search ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .function-usage-guide {
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .guide-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: #1976d2;
      transition: background 0.2s;
    }

    .guide-header:hover {
      background: #e3f2fd;
    }

    .guide-header mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .guide-content {
      padding: 0 0.75rem 0.75rem 0.75rem;
      font-size: 0.75rem;
      color: #555;
    }

    .guide-content p {
      margin: 0.25rem 0;
    }

    .guide-content code {
      background: #e0e0e0;
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.7rem;
    }

    .guide-content code.example {
      display: block;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #1976d2;
      color: white;
    }

    .search-results {
      margin-top: 0.5rem;
    }

    .search-results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      font-size: 0.75rem;
      color: #666;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 0.5rem;
    }

    .search-results-header button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }

    .search-results-header button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .function-category-tag {
      font-size: 0.6rem;
      color: white;
      background: #1976d2;
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      margin-top: 0.25rem;
      display: inline-block;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #999;
      text-align: center;
    }

    .no-results mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      margin-bottom: 0.5rem;
    }

    .no-results p {
      margin: 0;
      font-size: 0.8rem;
    }

    .screen-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .screen-tabs button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
      background: white;
      border: 1px solid #e0e0e0;
    }

    .screen-tabs button.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    .screen-tabs button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .screen-info-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #666;
      margin-left: auto;
      padding: 0.25rem 0.5rem;
      background: #fff3e0;
      border-radius: 4px;
    }

    .screen-info-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff9800;
    }

    .field-list {
      min-height: 200px;
    }

    .field-panel, .group-panel, .approver-panel, .screen-panel {
      margin-bottom: 0.5rem;
    }

    .field-config, .group-config, .approver-config, .screen-config {
      padding: 1rem;
    }

    .field-config ::ng-deep .mat-mdc-form-field {
      margin-bottom: 1rem;
    }

    .validation-panel {
      margin-top: 1rem;
      margin-bottom: 1rem;
      background: #fafafa;
    }

    .vt-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .vt-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .vt-section .form-field {
      margin-bottom: 1.25rem;
    }

    .expr-error .mdc-text-field--outlined .mdc-notched-outline__leading,
    .expr-error .mdc-text-field--outlined .mdc-notched-outline__notch,
    .expr-error .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: #f44336 !important;
    }

    .expr-error mat-label {
      color: #f44336 !important;
    }

    .expr-error-msg {
      color: #f44336;
      font-size: 0.75rem;
      margin-top: -0.75rem;
      margin-bottom: 0.5rem;
      padding-left: 0.75rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .expr-error-msg::before {
      content: '\\26A0';
      font-size: 0.85rem;
    }

    .vt-help {
      margin-top: 0.5rem;
      font-size: 0.8rem;
    }

    .vt-help summary {
      cursor: pointer;
      color: #1976d2;
      font-weight: 500;
      user-select: none;
    }

    .vt-help summary:hover {
      text-decoration: underline;
    }

    .vt-help-content {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #f0f4ff;
      border-radius: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .vt-help-content code {
      background: #fff;
      border: 1px solid #d0d7e2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #333;
      white-space: nowrap;
    }

    .validation-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .validation-panel mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .field-actions, .group-actions, .approver-actions, .screen-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .screen-info, .screen-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .screen-warning {
      background: #fff3e0;
    }

    .screen-info mat-icon, .screen-warning mat-icon {
      color: #1976d2;
      flex-shrink: 0;
    }

    .screen-warning mat-icon {
      color: #f57c00;
    }

    .screen-info p, .screen-warning p {
      margin: 0;
      color: #333;
    }

    .screen-list {
      min-height: 100px;
    }

    .empty-canvas, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #666;
      text-align: center;
    }

    .empty-canvas mat-icon, .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      margin: 1.5rem 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .section-hint {
      margin: 0 0 1rem 0;
      font-size: 0.85rem;
      color: #666;
    }

    .access-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .access-info mat-icon {
      color: #1976d2;
      flex-shrink: 0;
    }

    .access-info p {
      margin: 0;
      color: #1565c0;
      font-size: 0.9rem;
    }

    .access-summary {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .access-summary h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .no-restrictions {
      color: #4caf50;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .restriction-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-option {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }

    .user-option strong {
      font-size: 0.9rem;
    }

    .user-option small {
      font-size: 0.75rem;
      color: #666;
    }

    ::ng-deep .mat-mdc-autocomplete-panel {
      max-height: 300px;
    }

    .sql-obj-hint {
      font-size: 0.75rem;
      color: #666;
      margin-left: 0.5rem;
    }

    .sql-hint {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .sql-hint a {
      color: #3f51b5;
      text-decoration: none;
    }

    .sql-hint a:hover {
      text-decoration: underline;
    }

    .param-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #1976d2;
      margin: -8px 0 8px 0;
      padding: 4px 8px;
    }

    .param-hint code {
      background: #e3f2fd;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85em;
    }

    .param-hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    :host-context(.dark-mode) .param-hint {
      color: #90caf9;
    }

    :host-context(.dark-mode) .param-hint code {
      background: #1a3a5c;
    }

    .api-show-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      margin-bottom: 12px;
      background: #f0f4ff;
      border-radius: 8px;
      border: 1px solid #c5cae9;
    }

    .toggle-hint {
      font-size: 0.8rem;
      color: #666;
      font-style: italic;
    }

    :host-context(.dark-mode) .api-show-toggle {
      background: #1a2744;
      border-color: #3949ab;
    }

    :host-context(.dark-mode) .toggle-hint {
      color: #aaa;
    }

    .param-type-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    /* TABLE field configuration styles */
    .table-config {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .config-section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .config-section-title mat-icon {
      color: #1976d2;
    }

    .columns-section {
      margin-bottom: 1rem;
    }

    .columns-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .columns-title {
      font-weight: 500;
      color: #555;
    }

    .add-column-btn {
      font-size: 0.85rem;
    }

    .no-columns-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 4px;
      color: #856404;
      font-size: 0.9rem;
    }

    .column-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .col-name-field {
      flex: 0.8;
      min-width: 96px;
    }

    .col-label-field {
      flex: 0.9;
      min-width: 90px;
    }

    .col-type-field {
      width: 120px;
    }

    .col-width-field {
      width: 90px;
    }

    .col-default-field {
      width: 120px;
    }

    .col-readonly-checkbox {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }

    .col-readonly-checkbox .readonly-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .table-styling {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .table-styling mat-checkbox {
      font-size: 0.9rem;
    }

    /* ACCORDION field configuration styles */
    .accordion-config {
      margin-top: 1rem;
      padding: 1rem;
      background: #f3e5f5;
      border-radius: 8px;
      border: 1px solid #ce93d8;
    }

    .accordion-info {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #ede7f6;
      border-radius: 4px;
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #5e35b1;
    }

    .accordion-info mat-icon {
      color: #7e57c2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* COLLAPSIBLE field configuration styles */
    .collapsible-config {
      margin-top: 1rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 8px;
      border: 1px solid #81c784;
    }

    .collapsible-info {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #c8e6c9;
      border-radius: 4px;
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #2e7d32;
    }

    .collapsible-info mat-icon {
      color: #43a047;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Dark mode support - using class-based approach */
    :host-context(.dark-mode) .workflow-builder-container {
      background: #1e1e1e;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) mat-card {
      background: #2d2d2d !important;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) mat-card-title,
    :host-context(.dark-mode) mat-card-subtitle,
    :host-context(.dark-mode) .section-title,
    :host-context(.dark-mode) .access-summary h4 {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) .section-hint,
    :host-context(.dark-mode) .empty-canvas,
    :host-context(.dark-mode) .empty-state {
      color: #aaa;
    }

    :host-context(.dark-mode) .field-type-item {
      border-color: #444;
      background: #2d2d2d;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .field-type-item:hover {
      background: #3d5a80;
      border-color: #5c8dc9;
    }

    :host-context(.dark-mode) .field-panel,
    :host-context(.dark-mode) .group-panel,
    :host-context(.dark-mode) .approver-panel,
    :host-context(.dark-mode) .screen-panel {
      background: #333 !important;
    }

    :host-context(.dark-mode) .validation-panel {
      background: #2d2d2d !important;
    }

    :host-context(.dark-mode) .screen-tabs {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .screen-tabs button {
      background: #3d3d3d;
      border-color: #555;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .screen-tabs button.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    :host-context(.dark-mode) .palette-section {
      border-top-color: #444;
    }

    :host-context(.dark-mode) .palette-section h4 {
      color: #aaa;
    }

    :host-context(.dark-mode) .function-category h4 {
      color: #82b1ff;
      border-bottom-color: #444;
    }

    :host-context(.dark-mode) .function-item:hover {
      background: #3d5a80;
      border-color: #5c8dc9;
    }

    :host-context(.dark-mode) .function-help-btn {
      color: #888;
    }

    :host-context(.dark-mode) .function-help-btn:hover {
      color: #64b5f6;
    }

    :host-context(.dark-mode) .function-name {
      color: #82b1ff;
    }

    :host-context(.dark-mode) .function-desc,
    :host-context(.dark-mode) .user-option small,
    :host-context(.dark-mode) .sql-obj-hint,
    :host-context(.dark-mode) .sql-hint {
      color: #aaa;
    }

    :host-context(.dark-mode) .table-config {
      background: #2d2d2d;
      border-color: #444;
    }

    :host-context(.dark-mode) .accordion-config {
      background: #3d2d4d;
      border-color: #6d4d7d;
    }

    :host-context(.dark-mode) .accordion-info {
      background: #4d3d5d;
      color: #d1c4e9;
    }

    :host-context(.dark-mode) .collapsible-config {
      background: #2d3d2d;
      border-color: #4d6d4d;
    }

    :host-context(.dark-mode) .collapsible-info {
      background: #3d4d3d;
      color: #a5d6a7;
    }

    :host-context(.dark-mode) .config-section-title {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .columns-title {
      color: #aaa;
    }

    :host-context(.dark-mode) .no-columns-hint {
      background: #3d3020;
      color: #e0c080;
    }

    :host-context(.dark-mode) .column-row {
      background: #3d3d3d;
      border-color: #555;
    }

    :host-context(.dark-mode) .table-styling {
      border-top-color: #444;
    }

    :host-context(.dark-mode) .empty-canvas {
      background: #2d2d2d;
      color: #888;
    }

    :host-context(.dark-mode) .screen-info,
    :host-context(.dark-mode) .access-info {
      background: #2d3a4a;
      color: #b3c7e0;
    }

    :host-context(.dark-mode) .screen-info p,
    :host-context(.dark-mode) .screen-warning p,
    :host-context(.dark-mode) .access-info p {
      color: #b3c7e0;
    }

    :host-context(.dark-mode) .screen-warning {
      background: #3d3020;
      color: #e0c080;
    }

    :host-context(.dark-mode) .screen-info-badge {
      background: #3d3020;
      color: #e0c080;
    }

    :host-context(.dark-mode) .function-usage-guide {
      background: #2d3a4a;
      border-color: #3d5a80;
    }

    :host-context(.dark-mode) .guide-header {
      color: #82b1ff;
    }

    :host-context(.dark-mode) .guide-header:hover {
      background: #3d5a80;
    }

    :host-context(.dark-mode) .guide-content {
      background: #1e2a3a;
      color: #b3c7e0;
    }

    :host-context(.dark-mode) .guide-content code {
      background: #3d3d3d;
      color: #82b1ff;
    }

    :host-context(.dark-mode) .search-results-header {
      color: #aaa;
      border-bottom-color: #444;
    }

    :host-context(.dark-mode) .no-results {
      color: #888;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-form-field {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-floating-label {
      color: #aaa !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-input-element {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-select-value {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: #555 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-form-field-hint {
      color: #888 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-expansion-panel {
      background: #2d2d2d !important;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-expansion-panel-header-title,
    :host-context(.dark-mode) ::ng-deep .mat-expansion-panel-header-description {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-tab-labels {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-tab:not(.mat-mdc-tab-disabled) .mdc-tab__text-label {
      color: #aaa;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-tab:not(.mat-mdc-tab-disabled).mdc-tab--active .mdc-tab__text-label {
      color: #82b1ff;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-checkbox .mdc-checkbox__background {
      border-color: #888 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-checkbox .mdc-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-slide-toggle .mdc-label {
      color: #e0e0e0;
    }
  `]
})
export class WorkflowBuilderComponent implements OnInit, OnDestroy {
  isEdit = false;
  loading = false;
  workflowId: string | null = null;
  workflowName: string = '';  // Store workflow name for header display
  reminderBodyPlaceholder = 'Dear @{approverName}, you have a pending approval for @{workflowName} (Ref: @{referenceNumber}) submitted by @{submitterName} on @{submittedDate}.';
  reminderPlaceholderHint = '@{approverName}, @{approverEmail}, @{workflowName}, @{workflowCode}, @{referenceNumber}, @{submissionTitle}, @{status}, @{amount}, @{sbuName}, @{submitterName}, @{submitterEmail}, @{submitterDepartment}, @{submittedDate}, @{submittedTime}, @{submittedDateTime}, @{daysPending}, @{approvalLevel}, @{reminderNumber}, @{reminderMax}';
  reminderSubjectPlaceholder = 'Reminder: Pending approval for @{workflowName}';
  formId: string | null = null;  // Track the main form ID
  private destroy$ = new Subject<void>();

  basicForm: FormGroup;
  fields: any[] = [];
  fieldGroups: any[] = [];
  screens: any[] = [];
  approvers: any[] = [];

  workflowTypes: any[] = [];
  industries: any[] = [];
  availableParentWorkflows: Workflow[] = [];
  selectedStampName: string = '';
  childInheritAccess: boolean = true;
  titleTemplateParts: { field: string; connector: string }[] = [];
  titleWorkflowPlaceholders = [
    { key: 'workflowName', label: 'Workflow Name' },
    { key: 'workflowCode', label: 'Workflow Code' },
    { key: 'referenceNumber', label: 'Reference Number' },
    { key: 'status', label: 'Status' },
    { key: 'submitterName', label: 'Submitter Name' },
    { key: 'submitterEmail', label: 'Submitter Email' },
    { key: 'submitterDepartment', label: 'Submitter Department' },
    { key: 'submittedDate', label: 'Submitted Date' },
    { key: 'submittedTime', label: 'Submitted Time' },
    { key: 'submittedDateTime', label: 'Submitted Date & Time' },
    { key: 'amount', label: 'Amount' },
    { key: 'sbuName', label: 'SBU Name' }
  ];
  users: User[] = [];
  roles: Role[] = [];
  privileges: Privilege[] = [];
  filteredPrivilegesForWorkflow: Privilege[] = [];
  corporates: Corporate[] = [];
  sbus: SBU[] = [];
  filteredSbus: SBU[] = [];
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  sqlObjects: SqlObject[] = [];
  activeScreenId: string | null = null;

  functionSearch = '';
  showUsageGuide = false;

  icons = [
    // General / Documents
    'description', 'article', 'assignment', 'task', 'fact_check', 'rule',
    'receipt', 'receipt_long', 'request_quote', 'summarize', 'folder', 'topic',
    // Finance / Commerce
    'shopping_cart', 'account_balance', 'account_balance_wallet',
    'attach_money', 'payments', 'credit_card', 'savings', 'price_change',
    'point_of_sale', 'trending_up',
    // HR / People
    'person_add', 'person_remove', 'badge', 'people', 'groups',
    'supervisor_account', 'manage_accounts', 'contact_mail', 'card_membership',
    // Leave / Time
    'event_available', 'event_busy', 'event', 'calendar_today', 'today',
    'date_range', 'access_time', 'schedule', 'beach_access', 'flight_takeoff',
    // Travel / Logistics
    'flight', 'hotel', 'directions_car', 'local_taxi', 'train', 'bus_alert',
    'local_shipping', 'two_wheeler', 'location_on', 'map',
    // IT / Equipment
    'devices', 'computer', 'laptop', 'smartphone', 'tablet',
    'dns', 'cloud', 'storage', 'vpn_key', 'lock', 'shield', 'security',
    'support_agent', 'bug_report', 'build', 'engineering', 'construction',
    // Inventory / Assets
    'inventory', 'inventory_2', 'widgets', 'category', 'warehouse', 'store',
    'storefront', 'local_mall', 'shopping_bag',
    // Approval / Flow
    'approval', 'verified', 'verified_user', 'check_circle', 'done_all',
    'pending_actions', 'hourglass_empty', 'gavel', 'how_to_reg',
    // Communication
    'email', 'mail', 'message', 'chat', 'notifications', 'campaign', 'send',
    // Alerts / Risk
    'warning', 'error', 'report', 'priority_high', 'flag', 'policy',
    // Operations / Facilities
    'factory', 'precision_manufacturing', 'business', 'apartment',
    'corporate_fare', 'meeting_room', 'room_service',
    // Analytics / Reports
    'assessment', 'analytics', 'insights', 'pie_chart', 'bar_chart',
    'query_stats', 'monitoring',
    // Misc
    'school', 'science', 'settings', 'tune', 'star', 'bookmark',
    'bookmark_add', 'workspace_premium', 'emoji_events', 'lightbulb',
    'help_outline', 'handshake'
  ];

  fieldTypes = [
    { value: 'TEXT', label: 'Text', icon: 'text_fields' },
    { value: 'TEXTAREA', label: 'Text Area', icon: 'notes' },
    { value: 'NUMBER', label: 'Number', icon: 'pin' },
    { value: 'EMAIL', label: 'Email', icon: 'email' },
    { value: 'PHONE', label: 'Phone', icon: 'phone' },
    { value: 'PASSWORD', label: 'Password', icon: 'password' },
    { value: 'DATE', label: 'Date', icon: 'calendar_today' },
    { value: 'DATETIME', label: 'Date & Time', icon: 'schedule' },
    { value: 'TIME', label: 'Time', icon: 'access_time' },
    { value: 'SELECT', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
    { value: 'MULTISELECT', label: 'Multi-Select', icon: 'checklist_rtl' },
    { value: 'RADIO', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { value: 'CHECKBOX', label: 'Checkbox', icon: 'check_box' },
    { value: 'CHECKBOX_GROUP', label: 'Checkbox Group', icon: 'checklist' },
    { value: 'TOGGLE', label: 'Toggle Switch', icon: 'toggle_on' },
    { value: 'YES_NO', label: 'Yes/No', icon: 'thumbs_up_down' },
    { value: 'FILE', label: 'File Upload', icon: 'attach_file' },
    { value: 'IMAGE', label: 'Image Upload', icon: 'image' },
    { value: 'CURRENCY', label: 'Currency', icon: 'attach_money' },
    { value: 'URL', label: 'URL', icon: 'link' },
    { value: 'COLOR', label: 'Color Picker', icon: 'palette' },
    { value: 'RATING', label: 'Star Rating', icon: 'star' },
    { value: 'SLIDER', label: 'Slider', icon: 'linear_scale' },
    { value: 'SIGNATURE', label: 'Signature', icon: 'draw' },
    { value: 'RICH_TEXT', label: 'Rich Text', icon: 'format_quote' },
    { value: 'ICON', label: 'Icon Picker', icon: 'emoji_symbols' },
    { value: 'BARCODE', label: 'Barcode/QR', icon: 'qr_code_scanner' },
    { value: 'LOCATION', label: 'Location', icon: 'location_on' },
    { value: 'TABLE', label: 'Table/Grid', icon: 'table_chart' },
    { value: 'USER', label: 'User Select', icon: 'person_search' },
    { value: 'SQL_OBJECT', label: 'SQL Object', icon: 'storage', description: 'Dynamic options from SQL Object tables' },
    { value: 'SQL_TABLE', label: 'SQL Table', icon: 'grid_on', description: 'Execute SQL query and display results as a read-only table' },
    { value: 'ACCORDION', label: 'Accordion', icon: 'view_agenda', description: 'Container for collapsible panels' },
    { value: 'COLLAPSIBLE', label: 'Collapsible', icon: 'expand_more', description: 'Collapsible panel for grouping fields' },
    { value: 'HIDDEN', label: 'Hidden Field', icon: 'visibility_off' },
    { value: 'LABEL', label: 'Label/Text', icon: 'label' },
    { value: 'DIVIDER', label: 'Divider', icon: 'horizontal_rule' },
    { value: 'API_VALUE', label: 'API Value', icon: 'output', description: 'Fetch a single value from an API' },
    { value: 'OBJECT_VIEWER', label: 'Object Viewer', icon: 'account_tree', description: 'View nested JSON objects with expand/collapse' }
  ];

  // View types for SQL_OBJECT field
  viewTypes = [
    { value: 'SELECT', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
    { value: 'MULTISELECT', label: 'Multi-Select', icon: 'checklist_rtl' },
    { value: 'RADIO', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { value: 'CHECKBOX_GROUP', label: 'Checkbox Group', icon: 'checklist' }
  ];

  // Track expanded state of function categories
  expandedCategories: Record<string, boolean> = {
    validation: true,
    string: false,
    number: false,
    date: false,
    boolean: false,
    utility: false,
    table: false,
    other: false
  };

  // Validation Functions
  validationFunctions = [
    { name: 'ValidWhen(condition, message?)', description: 'Field is valid when condition is true', syntax: 'ValidWhen(@{amount} > 0, "Amount must be positive")' },
    { name: 'InvalidWhen(condition, message?)', description: 'Field is invalid when condition is true', syntax: 'InvalidWhen(@{status} == "CLOSED", "Cannot modify closed items")' },
    { name: 'CheckValid(condition, message?)', description: 'Validate field value against condition', syntax: 'CheckValid(LENGTH(@{code}) == 6, "Code must be 6 characters")' },
    { name: 'VisibleWhen(condition)', description: 'Show field when condition is true, hide otherwise', syntax: 'VisibleWhen(@{showDetails} == true)' },
    { name: 'MandatoryWhen(condition, message?)', description: 'Field is required when condition is true', syntax: 'MandatoryWhen(@{type} == "EXTERNAL", "Required for external requests")' },
    { name: 'ReadOnlyWhen(condition)', description: 'Field is readonly when condition is true', syntax: 'ReadOnlyWhen(@{status} != "DRAFT")' },
    { name: 'HiddenWhen(condition)', description: 'Hide field when condition is true', syntax: 'HiddenWhen(@{userType} == "GUEST")' },
    { name: 'RegexWhen(condition, pattern, message?)', description: 'Validate against regex when condition is true', syntax: 'RegexWhen(@{country} == "US", "^\\d{5}$", "Invalid US ZIP code")' }
  ];

  // String Functions
  stringFunctions = [
    { name: 'UPPER(field)', description: 'Convert text to uppercase', syntax: 'UPPER(fieldName)' },
    { name: 'LOWER(field)', description: 'Convert text to lowercase', syntax: 'LOWER(fieldName)' },
    { name: 'TRIM(field)', description: 'Remove leading/trailing spaces', syntax: 'TRIM(fieldName)' },
    { name: 'LTRIM(field)', description: 'Remove leading spaces', syntax: 'LTRIM(fieldName)' },
    { name: 'RTRIM(field)', description: 'Remove trailing spaces', syntax: 'RTRIM(fieldName)' },
    { name: 'CONCAT(a, b)', description: 'Join two or more text values', syntax: 'CONCAT(field1, field2)' },
    { name: 'CONCAT_WS(sep, a, b)', description: 'Join with separator', syntax: 'CONCAT_WS("-", field1, field2)' },
    { name: 'LEFT(field, n)', description: 'Get first n characters', syntax: 'LEFT(fieldName, 5)' },
    { name: 'RIGHT(field, n)', description: 'Get last n characters', syntax: 'RIGHT(fieldName, 5)' },
    { name: 'SUBSTRING(field, start, len)', description: 'Extract part of text', syntax: 'SUBSTRING(fieldName, 1, 5)' },
    { name: 'LENGTH(field)', description: 'Get text length', syntax: 'LENGTH(fieldName)' },
    { name: 'REPLACE(field, old, new)', description: 'Replace text', syntax: 'REPLACE(fieldName, "old", "new")' },
    { name: 'REPLACE_ALL(field, old, new)', description: 'Replace all occurrences', syntax: 'REPLACE_ALL(fieldName, "old", "new")' },
    { name: 'CONTAINS(field, text)', description: 'Check if text contains value', syntax: 'CONTAINS(fieldName, "search")' },
    { name: 'STARTS_WITH(field, text)', description: 'Check if text starts with value', syntax: 'STARTS_WITH(fieldName, "prefix")' },
    { name: 'ENDS_WITH(field, text)', description: 'Check if text ends with value', syntax: 'ENDS_WITH(fieldName, "suffix")' },
    { name: 'REVERSE(field)', description: 'Reverse text string', syntax: 'REVERSE(fieldName)' },
    { name: 'REPEAT(field, n)', description: 'Repeat text n times', syntax: 'REPEAT(fieldName, 3)' },
    { name: 'PAD_LEFT(field, len, char)', description: 'Pad text on left', syntax: 'PAD_LEFT(fieldName, 10, "0")' },
    { name: 'PAD_RIGHT(field, len, char)', description: 'Pad text on right', syntax: 'PAD_RIGHT(fieldName, 10, " ")' },
    { name: 'CAPITALIZE(field)', description: 'Capitalize first letter', syntax: 'CAPITALIZE(fieldName)' },
    { name: 'TITLE_CASE(field)', description: 'Title case all words', syntax: 'TITLE_CASE(fieldName)' },
    { name: 'SPLIT(field, sep)', description: 'Split text by separator', syntax: 'SPLIT(fieldName, ",")' },
    { name: 'JOIN(array, sep)', description: 'Join array with separator', syntax: 'JOIN(arrayField, ", ")' },
    { name: 'INDEX_OF(field, text)', description: 'Find position of text', syntax: 'INDEX_OF(fieldName, "search")' },
    { name: 'REGEX_MATCH(field, pattern)', description: 'Match regex pattern', syntax: 'REGEX_MATCH(fieldName, "\\\\d+")' },
    { name: 'REGEX_REPLACE(field, pattern, rep)', description: 'Replace with regex', syntax: 'REGEX_REPLACE(fieldName, "\\\\d+", "#")' }
  ];

  // Number Functions
  numberFunctions = [
    { name: 'SUM(a, b, ...)', description: 'Add numbers together', syntax: 'SUM(field1, field2, field3)' },
    { name: 'SUBTRACT(a, b)', description: 'Subtract b from a', syntax: 'SUBTRACT(field1, field2)' },
    { name: 'MULTIPLY(a, b)', description: 'Multiply numbers', syntax: 'MULTIPLY(field1, field2)' },
    { name: 'DIVIDE(a, b)', description: 'Divide a by b', syntax: 'DIVIDE(field1, field2)' },
    { name: 'ROUND(field, decimals)', description: 'Round to decimal places', syntax: 'ROUND(fieldName, 2)' },
    { name: 'FLOOR(field)', description: 'Round down to integer', syntax: 'FLOOR(fieldName)' },
    { name: 'CEIL(field)', description: 'Round up to integer', syntax: 'CEIL(fieldName)' },
    { name: 'TRUNC(field)', description: 'Truncate decimal part', syntax: 'TRUNC(fieldName)' },
    { name: 'ABS(field)', description: 'Get absolute value', syntax: 'ABS(fieldName)' },
    { name: 'SIGN(field)', description: 'Get sign (-1, 0, 1)', syntax: 'SIGN(fieldName)' },
    { name: 'MIN(a, b, ...)', description: 'Get minimum value', syntax: 'MIN(field1, field2)' },
    { name: 'MAX(a, b, ...)', description: 'Get maximum value', syntax: 'MAX(field1, field2)' },
    { name: 'AVERAGE(a, b, ...)', description: 'Calculate average', syntax: 'AVERAGE(field1, field2, field3)' },
    { name: 'MEDIAN(a, b, ...)', description: 'Calculate median', syntax: 'MEDIAN(field1, field2, field3)' },
    { name: 'COUNT(a, b, ...)', description: 'Count non-empty values', syntax: 'COUNT(field1, field2, field3)' },
    { name: 'PERCENTAGE(value, total)', description: 'Calculate percentage (value/total × 100)', syntax: 'PERCENTAGE(part, total)' },
    { name: 'PERCENT_OF(amount, percent)', description: 'Calculate N percent of amount (e.g. tax)', syntax: 'PERCENT_OF(@{subtotal}, 15)' },
    { name: 'PERCENT_CHANGE(old, new)', description: 'Percentage change from old to new value', syntax: 'PERCENT_CHANGE(@{lastYear}, @{thisYear})' },
    { name: 'FORMAT_PERCENT(n, decimals)', description: 'Format a number as percentage string', syntax: 'FORMAT_PERCENT(0.15, 1)' },
    { name: 'MOD(a, b)', description: 'Get remainder of division', syntax: 'MOD(field1, field2)' },
    { name: 'POWER(base, exp)', description: 'Raise to power', syntax: 'POWER(fieldName, 2)' },
    { name: 'SQRT(field)', description: 'Square root', syntax: 'SQRT(fieldName)' },
    { name: 'LOG(field)', description: 'Natural logarithm', syntax: 'LOG(fieldName)' },
    { name: 'LOG10(field)', description: 'Base 10 logarithm', syntax: 'LOG10(fieldName)' },
    { name: 'EXP(field)', description: 'e raised to power', syntax: 'EXP(fieldName)' },
    { name: 'CLAMP(field, min, max)', description: 'Limit to range', syntax: 'CLAMP(fieldName, 0, 100)' },
    { name: 'IS_NUMBER(field)', description: 'Check if value is number', syntax: 'IS_NUMBER(fieldName)' }
  ];

  // Date Functions
  dateFunctions = [
    { name: 'TODAY()', description: 'Get current date', syntax: 'TODAY()' },
    { name: 'NOW()', description: 'Get current date and time', syntax: 'NOW()' },
    { name: 'DATE(y, m, d)', description: 'Create date from parts', syntax: 'DATE(2024, 12, 25)' },
    { name: 'TIME(h, m, s)', description: 'Create time from parts', syntax: 'TIME(14, 30, 0)' },
    { name: 'DATE_FORMAT(field, format)', description: 'Format date', syntax: 'DATE_FORMAT(fieldName, "DD/MM/YYYY")' },
    { name: 'DATE_PARSE(text, format)', description: 'Parse date from text', syntax: 'DATE_PARSE(fieldName, "DD/MM/YYYY")' },
    { name: 'DATE_ADD(field, n, unit)', description: 'Add time to date', syntax: 'DATE_ADD(fieldName, 7, "days")' },
    { name: 'DATE_SUBTRACT(field, n, unit)', description: 'Subtract time from date', syntax: 'DATE_SUBTRACT(fieldName, 1, "month")' },
    { name: 'DATE_DIFF(a, b, unit)', description: 'Difference between dates', syntax: 'DATE_DIFF(startDate, endDate, "days")' },
    { name: 'YEAR(field)', description: 'Extract year from date', syntax: 'YEAR(fieldName)' },
    { name: 'MONTH(field)', description: 'Extract month from date', syntax: 'MONTH(fieldName)' },
    { name: 'DAY(field)', description: 'Extract day from date', syntax: 'DAY(fieldName)' },
    { name: 'HOUR(field)', description: 'Extract hour from datetime', syntax: 'HOUR(fieldName)' },
    { name: 'MINUTE(field)', description: 'Extract minute from datetime', syntax: 'MINUTE(fieldName)' },
    { name: 'SECOND(field)', description: 'Extract second from datetime', syntax: 'SECOND(fieldName)' },
    { name: 'WEEKDAY(field)', description: 'Get day of week (1-7)', syntax: 'WEEKDAY(fieldName)' },
    { name: 'WEEK_OF_YEAR(field)', description: 'Get week number', syntax: 'WEEK_OF_YEAR(fieldName)' },
    { name: 'QUARTER(field)', description: 'Get quarter (1-4)', syntax: 'QUARTER(fieldName)' },
    { name: 'START_OF_MONTH(field)', description: 'Get first day of month', syntax: 'START_OF_MONTH(fieldName)' },
    { name: 'END_OF_MONTH(field)', description: 'Get last day of month', syntax: 'END_OF_MONTH(fieldName)' },
    { name: 'START_OF_YEAR(field)', description: 'Get first day of year', syntax: 'START_OF_YEAR(fieldName)' },
    { name: 'END_OF_YEAR(field)', description: 'Get last day of year', syntax: 'END_OF_YEAR(fieldName)' },
    { name: 'START_OF_WEEK(field)', description: 'Get first day of week', syntax: 'START_OF_WEEK(fieldName)' },
    { name: 'IS_WEEKEND(field)', description: 'Check if date is weekend', syntax: 'IS_WEEKEND(fieldName)' },
    { name: 'IS_WORKDAY(field)', description: 'Check if date is workday', syntax: 'IS_WORKDAY(fieldName)' },
    { name: 'IS_PAST(field)', description: 'Check if date is in past', syntax: 'IS_PAST(fieldName)' },
    { name: 'IS_FUTURE(field)', description: 'Check if date is in future', syntax: 'IS_FUTURE(fieldName)' },
    { name: 'IS_TODAY(field)', description: 'Check if date is today', syntax: 'IS_TODAY(fieldName)' },
    { name: 'IS_YESTERDAY(field)', description: 'Check if date is yesterday', syntax: 'IS_YESTERDAY(fieldName)' },
    { name: 'IS_TOMORROW(field)', description: 'Check if date is tomorrow', syntax: 'IS_TOMORROW(fieldName)' },
    { name: 'IS_BEFORE(a, b)', description: 'Check if date a is before date b', syntax: 'IS_BEFORE(@{start}, @{end})' },
    { name: 'IS_AFTER(a, b)', description: 'Check if date a is after date b', syntax: 'IS_AFTER(@{end}, @{start})' },
    { name: 'IS_SAME_DAY(a, b)', description: 'Check if two dates fall on the same day', syntax: 'IS_SAME_DAY(@{a}, @{b})' },
    { name: 'IS_BETWEEN_DATES(d, s, e)', description: 'Check if date falls within a range (inclusive)', syntax: 'IS_BETWEEN_DATES(@{d}, @{start}, @{end})' },
    { name: 'DATE_BEFORE(field, target)', description: 'Validator: date must be before target (or "today")', syntax: 'DATE_BEFORE(@{d}, "2026-01-01")' },
    { name: 'DATE_AFTER(field, target)', description: 'Validator: date must be after target (or "today")', syntax: 'DATE_AFTER(@{d}, "today")' },
    { name: 'BUSINESS_DAYS(a, b)', description: 'Count business days between dates', syntax: 'BUSINESS_DAYS(startDate, endDate)' },
    { name: 'ADD_BUSINESS_DAYS(field, n)', description: 'Add business days', syntax: 'ADD_BUSINESS_DAYS(fieldName, 5)' },
    { name: 'AGE(birthDate)', description: 'Calculate age in years', syntax: 'AGE(birthDateField)' }
  ];

  // Conditional Functions
  conditionalFunctions = [
    { name: 'IF(cond, then, else?)', description: 'If condition is true return then, otherwise else. Nestable.', syntax: 'IF(amount > 100, "High", "Low")' },
    { name: 'IF_ELSE(cond, then, else)', description: 'Explicit if-else — alias of IF with required else branch', syntax: 'IF_ELSE(status == "Active", "Yes", "No")' },
    { name: 'IF_EMPTY(value, fallback)', description: 'Return fallback if value is empty or null', syntax: 'IF_EMPTY(nickname, firstName)' },
    { name: 'IF_NOT_EMPTY(value, result, else?)', description: 'Return result only when value is not empty', syntax: 'IF_NOT_EMPTY(phone, CONCAT("+", phone), "N/A")' },
    { name: 'IF_EQUALS(a, b, then, else?)', description: 'Compare two values and return result', syntax: 'IF_EQUALS(status, "Approved", "Done", "Pending")' },
    { name: 'IF_GREATER(a, b, then, else?)', description: 'Return result when a > b', syntax: 'IF_GREATER(score, 50, "Pass", "Fail")' },
    { name: 'IF_LESS(a, b, then, else?)', description: 'Return result when a < b', syntax: 'IF_LESS(stock, 10, "Low Stock", "OK")' },
    { name: 'IF_CONTAINS(text, search, then, else?)', description: 'Return result when text contains search string', syntax: 'IF_CONTAINS(email, "@company.com", "Internal", "External")' },
    { name: 'IF_BETWEEN(val, min, max, then, else?)', description: 'Return result when value is within range', syntax: 'IF_BETWEEN(age, 18, 65, "Eligible", "Not Eligible")' },
    { name: 'IFS(c1, v1, c2, v2, ..., default)', description: 'Multi-branch conditional — first matching condition wins', syntax: 'IFS(score > 90, "A", score > 80, "B", score > 70, "C", "F")' },
    { name: 'SWITCH(val, m1, r1, ..., default)', description: 'Match value against cases and return corresponding result', syntax: 'SWITCH(status, "A", "Active", "I", "Inactive", "Unknown")' },
    { name: 'CHOOSE(index, v1, v2, ...)', description: 'Return the value at the given 1-based index position', syntax: 'CHOOSE(quarter, "Q1", "Q2", "Q3", "Q4")' }
  ];

  // Boolean/Logic Functions
  booleanFunctions = [
    { name: 'AND(a, b, ...)', description: 'All conditions must be true', syntax: 'AND(condition1, condition2)' },
    { name: 'OR(a, b, ...)', description: 'Any condition must be true', syntax: 'OR(condition1, condition2)' },
    { name: 'XOR(a, b)', description: 'Exclusive OR', syntax: 'XOR(condition1, condition2)' },
    { name: 'NOT(condition)', description: 'Reverse boolean value', syntax: 'NOT(fieldName)' },
    { name: 'TRUE()', description: 'Returns true value', syntax: 'TRUE()' },
    { name: 'FALSE()', description: 'Returns false value', syntax: 'FALSE()' },
    { name: 'IS_EMPTY(field)', description: 'Check if field is empty', syntax: 'IS_EMPTY(fieldName)' },
    { name: 'IS_NOT_EMPTY(field)', description: 'Check if field has value', syntax: 'IS_NOT_EMPTY(fieldName)' },
    { name: 'IS_NULL(field)', description: 'Check if field is null', syntax: 'IS_NULL(fieldName)' },
    { name: 'IS_BLANK(field)', description: 'Check if empty or whitespace', syntax: 'IS_BLANK(fieldName)' },
    { name: 'EQUALS(a, b)', description: 'Check if values are equal', syntax: 'EQUALS(field1, field2)' },
    { name: 'NOT_EQUALS(a, b)', description: 'Check if values differ', syntax: 'NOT_EQUALS(field1, field2)' },
    { name: 'GREATER_THAN(a, b)', description: 'Check if a > b', syntax: 'GREATER_THAN(field1, field2)' },
    { name: 'GREATER_OR_EQUAL(a, b)', description: 'Check if a >= b', syntax: 'GREATER_OR_EQUAL(field1, field2)' },
    { name: 'LESS_THAN(a, b)', description: 'Check if a < b', syntax: 'LESS_THAN(field1, field2)' },
    { name: 'LESS_OR_EQUAL(a, b)', description: 'Check if a <= b', syntax: 'LESS_OR_EQUAL(field1, field2)' },
    { name: 'BETWEEN(field, min, max)', description: 'Check if value is in range', syntax: 'BETWEEN(fieldName, 10, 100)' },
    { name: 'IN(field, list)', description: 'Check if value is in list', syntax: 'IN(fieldName, ["A", "B", "C"])' },
    { name: 'NOT_IN(field, list)', description: 'Check if value not in list', syntax: 'NOT_IN(fieldName, ["X", "Y", "Z"])' },
    { name: 'IS_VALID_EMAIL(field)', description: 'Validate email format', syntax: 'IS_VALID_EMAIL(emailField)' },
    { name: 'IS_VALID_PHONE(field)', description: 'Validate phone format', syntax: 'IS_VALID_PHONE(phoneField)' },
    { name: 'IS_VALID_URL(field)', description: 'Validate URL format', syntax: 'IS_VALID_URL(urlField)' },
    { name: 'IS_EMAIL(field)', description: 'Alias for IS_VALID_EMAIL — check if value is a valid email', syntax: 'IS_EMAIL(@{emailField})' },
    { name: 'IS_URL(field)', description: 'Alias for IS_VALID_URL — check if value is a valid URL', syntax: 'IS_URL(@{urlField})' },
    { name: 'IS_PHONE(field)', description: 'Alias for IS_VALID_PHONE — check if value is a valid phone number', syntax: 'IS_PHONE(@{phoneField})' },
    { name: 'IS_TRUE(field)', description: 'Check if boolean value is true (handles "true"/1/true)', syntax: 'IS_TRUE(@{agreeField})' },
    { name: 'IS_FALSE(field)', description: 'Check if boolean value is false/empty/0', syntax: 'IS_FALSE(@{cancelledField})' },
    { name: 'IS_NUMBER(field)', description: 'Check if value is numeric', syntax: 'IS_NUMBER(@{amount})' },
    { name: 'IS_INTEGER(field)', description: 'Check if value is a whole number', syntax: 'IS_INTEGER(@{count})' },
    { name: 'IS_POSITIVE(field)', description: 'Check if number > 0', syntax: 'IS_POSITIVE(@{amount})' },
    { name: 'IS_NEGATIVE(field)', description: 'Check if number < 0', syntax: 'IS_NEGATIVE(@{adjustment})' },
    { name: 'IS_ZERO(field)', description: 'Check if number equals 0', syntax: 'IS_ZERO(@{balance})' },
    { name: 'IS_EVEN(field)', description: 'Check if number is even', syntax: 'IS_EVEN(@{count})' },
    { name: 'IS_ODD(field)', description: 'Check if number is odd', syntax: 'IS_ODD(@{count})' },
    { name: 'IS_DATE(field)', description: 'Check if value is a parseable date', syntax: 'IS_DATE(@{myDate})' },
    { name: 'IS_UUID(field)', description: 'Check if value is a valid UUID', syntax: 'IS_UUID(@{id})' },
    { name: 'IS_UPPERCASE(field)', description: 'Check if string is all uppercase', syntax: 'IS_UPPERCASE(@{code})' },
    { name: 'IS_LOWERCASE(field)', description: 'Check if string is all lowercase', syntax: 'IS_LOWERCASE(@{slug})' },
    { name: 'IS_ALPHA(field)', description: 'Check if string contains only letters', syntax: 'IS_ALPHA(@{name})' },
    { name: 'IS_ALPHANUMERIC(field)', description: 'Check if string is letters and digits only', syntax: 'IS_ALPHANUMERIC(@{code})' },
    { name: 'IS_NUMERIC(field)', description: 'Check if string contains only digits', syntax: 'IS_NUMERIC(@{zip})' },
    { name: 'HAS_LENGTH(field, n)', description: 'Check if string length equals n', syntax: 'HAS_LENGTH(@{code}, 6)' },
    { name: 'HAS_MIN_LENGTH(field, n)', description: 'Check if string length is at least n', syntax: 'HAS_MIN_LENGTH(@{password}, 8)' },
    { name: 'HAS_MAX_LENGTH(field, n)', description: 'Check if string length is at most n', syntax: 'HAS_MAX_LENGTH(@{title}, 100)' },
    { name: 'MATCHES_PATTERN(field, regex)', description: 'Check if value matches regex pattern', syntax: 'MATCHES_PATTERN(@{code}, "^[A-Z]{3}\\\\d+$")' }
  ];

  // Table Functions
  tableFunctions = [
    // Row number and counting
    { name: 'ROW()', description: 'Get current table row number (1-based)', syntax: 'ROW()' },
    { name: 'ROW_COUNT(table)', description: 'Get total number of rows in table', syntax: 'ROW_COUNT(@{tableName})' },
    { name: 'COLUMN_COUNT(table)', description: 'Get total number of columns', syntax: 'COLUMN_COUNT(@{tableName})' },
    // Get/Set cell values
    { name: 'GET_CELL(table, row, col)', description: 'Get value of a specific cell', syntax: 'GET_CELL(@{tableName}, 1, "columnName")' },
    { name: 'SET_CELL(table, row, col, val)', description: 'Set value of a specific cell', syntax: 'SET_CELL(@{tableName}, 1, "columnName", "value")' },
    // Get/Set row values
    { name: 'GET_ROW(table, row)', description: 'Get entire row as JSON string', syntax: 'GET_ROW(@{tableName}, 1)' },
    { name: 'SET_ROW(table, row, json)', description: 'Set entire row values from JSON', syntax: 'SET_ROW(@{tableName}, 1, \'{"col1":"val1"}\')' },
    // Column operations
    { name: 'GET_COLUMN(table, col)', description: 'Get all values from a column as array', syntax: 'GET_COLUMN(@{tableName}, "columnName")' },
    { name: 'SUM_COLUMN(table, col)', description: 'Sum all numeric values in a column', syntax: 'SUM_COLUMN(@{tableName}, "amount")' },
    { name: 'AVG_COLUMN(table, col)', description: 'Calculate average of column values', syntax: 'AVG_COLUMN(@{tableName}, "score")' },
    { name: 'MIN_COLUMN(table, col)', description: 'Get minimum value in a column', syntax: 'MIN_COLUMN(@{tableName}, "price")' },
    { name: 'MAX_COLUMN(table, col)', description: 'Get maximum value in a column', syntax: 'MAX_COLUMN(@{tableName}, "price")' },
    { name: 'COUNT_COLUMN(table, col)', description: 'Count non-empty values in column', syntax: 'COUNT_COLUMN(@{tableName}, "notes")' },
    // Row manipulation
    { name: 'ADD_ROW(table, json?)', description: 'Add a new row to the table', syntax: 'ADD_ROW(@{tableName})' },
    { name: 'DELETE_ROW(table, row)', description: 'Delete a row from the table', syntax: 'DELETE_ROW(@{tableName}, 1)' },
    { name: 'CLEAR_ROW(table, row)', description: 'Clear all values in a row', syntax: 'CLEAR_ROW(@{tableName}, 1)' },
    { name: 'COPY_ROW(table, src, tgt?)', description: 'Copy row values to another row', syntax: 'COPY_ROW(@{tableName}, 1)' },
    // Search and export
    { name: 'FIND_ROW(table, col, val)', description: 'Find row index where column matches value', syntax: 'FIND_ROW(@{tableName}, "sku", "ABC123")' },
    { name: 'TABLE_JSON(table)', description: 'Get entire table data as JSON array', syntax: 'TABLE_JSON(@{tableName})' }
  ];

  // Utility Functions
  utilityFunctions = [
    { name: 'SETVALUE(field, value)', description: 'Set another field\'s value. Use in Validation & Transformation to update fields dynamically.', syntax: 'SETVALUE(targetField, "new value")' },
    { name: 'COALESCE(a, b, ...)', description: 'Return first non-empty value', syntax: 'COALESCE(field1, field2, "default")' },
    { name: 'DEFAULT(field, value)', description: 'Set default if empty', syntax: 'DEFAULT(fieldName, "N/A")' },
    { name: 'FORMAT_CURRENCY(field, currency)', description: 'Format as currency', syntax: 'FORMAT_CURRENCY(amount, "USD")' },
    { name: 'FORMAT_NUMBER(field, decimals)', description: 'Format number with decimals', syntax: 'FORMAT_NUMBER(fieldName, 2)' },
    { name: 'FORMAT_PERCENT(field)', description: 'Format as percentage', syntax: 'FORMAT_PERCENT(fieldName)' },
    { name: 'TO_NUMBER(field)', description: 'Convert text to number', syntax: 'TO_NUMBER(fieldName)' },
    { name: 'TO_TEXT(field)', description: 'Convert value to text', syntax: 'TO_TEXT(fieldName)' },
    { name: 'TO_BOOLEAN(field)', description: 'Convert value to boolean', syntax: 'TO_BOOLEAN(fieldName)' },
    { name: 'TO_DATE(field)', description: 'Convert text to date', syntax: 'TO_DATE(fieldName)' },
    { name: 'UUID()', description: 'Generate unique identifier', syntax: 'UUID()' },
    { name: 'SEQUENCE(prefix)', description: 'Generate sequential number', syntax: 'SEQUENCE("INV-")' },
    { name: 'CURRENT_USER()', description: 'Get current user name', syntax: 'CURRENT_USER()' },
    { name: 'CURRENT_USER_EMAIL()', description: 'Get current user email', syntax: 'CURRENT_USER_EMAIL()' },
    { name: 'CURRENT_USER_ID()', description: 'Get current user ID', syntax: 'CURRENT_USER_ID()' },
    { name: 'CURRENT_USER_DEPT()', description: 'Get current user department', syntax: 'CURRENT_USER_DEPT()' },
    { name: 'CURRENT_USER_SBU()', description: 'Get current user SBU', syntax: 'CURRENT_USER_SBU()' },
    { name: 'FIELD_VALUE(name)', description: 'Get value of another field', syntax: 'FIELD_VALUE("otherFieldName")' },
    { name: 'LOOKUP(field, source)', description: 'Lookup value from data source', syntax: 'LOOKUP(fieldName, "employees")' },
    { name: 'TYPE_OF(field)', description: 'Get type of value', syntax: 'TYPE_OF(fieldName)' },
    { name: 'HASH(field)', description: 'Generate hash of value', syntax: 'HASH(fieldName)' }
  ];

  // Other Functions
  sqlFunctions = [
    { name: 'SQL_LOOKUP(table, col, where, val)', description: 'Look up a single value from an SQL Object table', syntax: 'SQL_LOOKUP("employees", "email", "emp_id", "E001")' },
    { name: 'SQL_QUERY(table, cols, where, val)', description: 'Query rows from an SQL Object table', syntax: 'SQL_QUERY("employees", "name, email", "department", "IT")' },
    { name: 'SQL_COUNT(table, where, val)', description: 'Count rows in an SQL Object table', syntax: 'SQL_COUNT("employees", "department", "IT")' },
    { name: 'SQL_SUM(table, col, where, val)', description: 'Sum a numeric column in an SQL Object table', syntax: 'SQL_SUM("orders", "amount", "status", "completed")' },
    { name: 'SQL_AVG(table, col, where, val)', description: 'Average a numeric column in an SQL Object table', syntax: 'SQL_AVG("products", "price", "category", "Electronics")' },
    { name: 'SQL_MIN(table, col, where, val)', description: 'Get minimum value from an SQL Object table', syntax: 'SQL_MIN("products", "price")' },
    { name: 'SQL_MAX(table, col, where, val)', description: 'Get maximum value from an SQL Object table', syntax: 'SQL_MAX("products", "price")' },
    { name: 'SQL_DISTINCT(table, col, where, val)', description: 'Get distinct values from an SQL Object table column', syntax: 'SQL_DISTINCT("employees", "department")' },
    { name: 'SQL_EXISTS(table, where, val)', description: 'Check if a row exists in an SQL Object table', syntax: 'SQL_EXISTS("employees", "emp_id", "E001")' }
  ];

  otherFunctions = [
    { name: 'ARRAY_LENGTH(field)', description: 'Get length of array', syntax: 'ARRAY_LENGTH(arrayField)' },
    { name: 'ARRAY_FIRST(field)', description: 'Get first element of array', syntax: 'ARRAY_FIRST(arrayField)' },
    { name: 'ARRAY_LAST(field)', description: 'Get last element of array', syntax: 'ARRAY_LAST(arrayField)' },
    { name: 'ARRAY_CONTAINS(field, val)', description: 'Check if array contains value', syntax: 'ARRAY_CONTAINS(arrayField, "value")' },
    { name: 'ARRAY_UNIQUE(field)', description: 'Remove duplicates from array', syntax: 'ARRAY_UNIQUE(arrayField)' },
    { name: 'ARRAY_SORT(field)', description: 'Sort array values', syntax: 'ARRAY_SORT(arrayField)' },
    { name: 'JSON_GET(field, path)', description: 'Get value from JSON path', syntax: 'JSON_GET(jsonField, "data.name")' },
    { name: 'JSON_SET(field, path, val)', description: 'Set value in JSON', syntax: 'JSON_SET(jsonField, "data.name", "value")' },
    { name: 'ENCODE_BASE64(field)', description: 'Encode to Base64', syntax: 'ENCODE_BASE64(fieldName)' },
    { name: 'DECODE_BASE64(field)', description: 'Decode from Base64', syntax: 'DECODE_BASE64(fieldName)' },
    { name: 'ENCODE_URL(field)', description: 'URL encode text', syntax: 'ENCODE_URL(fieldName)' },
    { name: 'DECODE_URL(field)', description: 'URL decode text', syntax: 'DECODE_URL(fieldName)' },
    { name: 'RANDOM()', description: 'Generate random number 0-1', syntax: 'RANDOM()' },
    { name: 'RANDOM_INT(min, max)', description: 'Generate random integer', syntax: 'RANDOM_INT(1, 100)' },
    { name: 'SWITCH(field, cases)', description: 'Multi-case conditional', syntax: 'SWITCH(status, "A", "Active", "I", "Inactive", "Unknown")' },
    { name: 'TEMPLATE(str, vars)', description: 'String template with variables', syntax: 'TEMPLATE("Hello {name}", {"name": fieldName})' }
  ];

  // Placeholders - available in Value, Visibility, Email Templates, API URLs
  placeholderItems = [
    // Field references
    { name: '@{fieldName}', description: 'Reference another field\'s value (replace fieldName with actual name)', syntax: '@{fieldName}', category: 'Field Reference' },
    // Workflow info
    { name: '@{workflowName}', description: 'Name of the workflow', syntax: '@{workflowName}', category: 'Workflow' },
    { name: '@{workflowCode}', description: 'Code of the workflow', syntax: '@{workflowCode}', category: 'Workflow' },
    // Submission info
    { name: '@{referenceNumber}', description: 'Submission reference number', syntax: '@{referenceNumber}', category: 'Submission' },
    { name: '@{submissionTitle}', description: 'Submission title', syntax: '@{submissionTitle}', category: 'Submission' },
    { name: '@{status}', description: 'Current submission status', syntax: '@{status}', category: 'Submission' },
    { name: '@{amount}', description: 'Financial amount on submission', syntax: '@{amount}', category: 'Submission' },
    { name: '@{sbuName}', description: 'SBU associated with submission', syntax: '@{sbuName}', category: 'Submission' },
    // Approver info
    { name: '@{approverName}', description: 'Current approver\'s name', syntax: '@{approverName}', category: 'Approver' },
    { name: '@{approverEmail}', description: 'Current approver\'s email', syntax: '@{approverEmail}', category: 'Approver' },
    { name: '@{approvalLevel}', description: 'Current approval level number', syntax: '@{approvalLevel}', category: 'Approver' },
    // Submitter info
    { name: '@{submitterName}', description: 'Submitter\'s full name', syntax: '@{submitterName}', category: 'Submitter' },
    { name: '@{submitterEmail}', description: 'Submitter\'s email address', syntax: '@{submitterEmail}', category: 'Submitter' },
    { name: '@{submitterDepartment}', description: 'Submitter\'s department', syntax: '@{submitterDepartment}', category: 'Submitter' },
    // Date/time
    { name: '@{submittedDate}', description: 'Date submitted (YYYY-MM-DD)', syntax: '@{submittedDate}', category: 'Date/Time' },
    { name: '@{submittedTime}', description: 'Time submitted (HH:mm:ss)', syntax: '@{submittedTime}', category: 'Date/Time' },
    { name: '@{submittedDateTime}', description: 'Full date and time submitted', syntax: '@{submittedDateTime}', category: 'Date/Time' },
    { name: '@{daysPending}', description: 'Number of days since submission', syntax: '@{daysPending}', category: 'Date/Time' },
    // Reminder
    { name: '@{reminderNumber}', description: 'Current reminder count (e.g. 2 of 3)', syntax: '@{reminderNumber}', category: 'Reminder' },
    { name: '@{reminderMax}', description: 'Maximum reminders configured', syntax: '@{reminderMax}', category: 'Reminder' },
  ];

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private sqlObjectService: SqlObjectService,
    private settingService: SettingService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.basicForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: [''],
      icon: ['description'],
      workflowTypeId: [null],
      industryId: [null],
      workflowCategory: ['NON_FINANCIAL'],
      parentWorkflowId: [null],
      stampId: [null],
      isActive: [true],
      showSummary: [false],
      showApprovalMatrix: [false],
      lockApproved: [false],
      lockChildOnParentApproval: [false],
      commentsMandatory: [false],
      commentsMandatoryOnReject: [true],
      commentsMandatoryOnEscalate: [true],
      corporateIds: [[]],
      sbuIds: [[]],
      branchIds: [[]],
      departmentIds: [[]],
      roleIds: [[]],
      privilegeIds: [[]],
      reminderEnabled: [false],
      reminderFrequencyHours: [24],
      reminderMaxCount: [3],
      reminderStartAfterHours: [24],
      escalationEnabled: [false],
      escalationAfterHours: [72],
      escalationAction: ['NOTIFY_ADMIN'],
      reminderIncludeSubmitter: [false],
      reminderEmailSubject: [''],
      reminderEmailBody: [''],
      titleTemplate: ['']
    });
  }

  ngOnInit() {
    this.loadWorkflowTypes();
    this.loadUsers();
    this.loadRoles();
    this.loadPrivileges();
    this.loadCorporates();
    this.loadSbus();
    this.loadBranches();
    this.loadDepartments();
    this.loadSqlObjects();
    this.loadAvailableParentWorkflows();
    this.settingService.getSettingValue('workflow.child.inherit.access').subscribe(res => {
      if (res?.success) this.childInheritAccess = res.data === 'true';
    });

    // Subscribe to route params to detect navigation changes (same pattern as workflow-instances)
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const newWorkflowId = params['id'] || null;
      // Only reload if the workflow ID actually changed
      if (newWorkflowId !== this.workflowId) {
        this.workflowId = newWorkflowId;
        this.resetForm();
        if (this.workflowId && this.workflowId !== 'new') {
          this.isEdit = true;
          this.loadWorkflow();
        } else {
          this.isEdit = false;
          // Inherit defaults from workflow settings for new workflows
          forkJoin({
            commentsMandatory: this.settingService.getSettingValue('workflow.comments.mandatory'),
            commentsMandatoryOnReject: this.settingService.getSettingValue('workflow.comments.mandatory.reject'),
            commentsMandatoryOnEscalate: this.settingService.getSettingValue('workflow.comments.mandatory.escalate'),
            showSummary: this.settingService.getSettingValue('workflow.show.summary'),
            showApprovalMatrix: this.settingService.getSettingValue('workflow.email.show.approval.matrix')
          }).subscribe((results: any) => {
            const patch: any = {};
            if (results.commentsMandatory?.success) patch.commentsMandatory = results.commentsMandatory.data === 'true';
            if (results.commentsMandatoryOnReject?.success) patch.commentsMandatoryOnReject = results.commentsMandatoryOnReject.data === 'true';
            if (results.commentsMandatoryOnEscalate?.success) patch.commentsMandatoryOnEscalate = results.commentsMandatoryOnEscalate.data === 'true';
            if (results.showSummary?.success) patch.showSummary = results.showSummary.data === 'true';
            if (results.showApprovalMatrix?.success) patch.showApprovalMatrix = results.showApprovalMatrix.data === 'true';
            this.basicForm.patchValue(patch);
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetForm() {
    this.formId = null;
    this.workflowName = '';
    this.fields = [];
    this.fieldGroups = [];
    this.screens = [];
    this.approvers = [];
    this.basicForm.reset({
      name: '',
      code: '',
      description: '',
      icon: 'description',
      workflowTypeId: '',
      industryId: null,
      workflowCategory: 'NON_FINANCIAL',
      isActive: true,
      commentsMandatory: false,
      commentsMandatoryOnReject: true,
      commentsMandatoryOnEscalate: true,
      corporateIds: [],
      sbuIds: [],
      branchIds: [],
      departmentIds: [],
      roleIds: [],
      privilegeIds: [],
      titleTemplate: ''
    });
    this.titleTemplateParts = [];
    this.filteredSbus = [...this.sbus];
    this.filteredBranches = [...this.branches];
    this.filteredDepartments = [...this.departments];
  }

  loadWorkflowTypes() {
    this.workflowService.getWorkflowTypes().subscribe(res => {
      if (res.success) {
        this.workflowTypes = res.data;
      }
    });
    this.loadIndustries();
  }

  loadIndustries() {
    this.userService.getCategories().subscribe(res => {
      if (res.success) {
        this.industries = (res.data || []).filter((c: any) => c.isActive !== false);
      }
    });
  }

  openSealPicker() {
    const dialogRef = this.dialog.open(StampSelectorDialogComponent, {
      width: '800px',
      maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe((stamp: StampDTO | null | undefined) => {
      if (stamp === null) {
        // Clear selection clicked
        this.basicForm.patchValue({ stampId: null });
        this.selectedStampName = '';
      } else if (stamp) {
        this.basicForm.patchValue({ stampId: stamp.id });
        this.selectedStampName = stamp.name;
      }
    });
  }

  clearSeal() {
    this.basicForm.patchValue({ stampId: null });
    this.selectedStampName = '';
  }

  loadAvailableParentWorkflows() {
    this.workflowService.getWorkflows().subscribe(res => {
      if (res.success) {
        // Exclude the current workflow from the parent dropdown
        this.availableParentWorkflows = (res.data || []).filter(
          (w: Workflow) => w.id !== this.workflowId
        );
      }
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe(res => {
      if (res.success) {
        this.users = res.data;
        // Update filtered users for existing approvers
        this.approvers.forEach(approver => {
          approver.filteredUsers = this.users;
          // Set display text for existing user selections
          if (approver.approverType === 'USER' && approver.approverId) {
            const user = this.users.find(u => u.id === approver.approverId);
            if (user) {
              approver.userSearchText = user.fullName;
            }
          }
        });
      }
    });
  }

  loadRoles() {
    this.userService.getRoles().subscribe(res => {
      if (res.success) {
        this.roles = res.data;
      }
    });
  }

  loadPrivileges() {
    this.userService.getPrivileges().subscribe(res => {
      if (res.success) {
        this.privileges = res.data;
      }
    });
  }

  /**
   * Filter privileges based on selected roles for workflow-level restrictions.
   * Called when workflow role selection changes.
   */
  onWorkflowRolesChange() {
    const selectedRoleIds: string[] = this.basicForm.get('roleIds')?.value || [];
    this.filteredPrivilegesForWorkflow = this.getPrivilegesForRoles(selectedRoleIds);

    // Clear selected privileges that are no longer in the filtered list
    const currentPrivilegeIds: string[] = this.basicForm.get('privilegeIds')?.value || [];
    const validPrivilegeIds = currentPrivilegeIds.filter(id =>
      this.filteredPrivilegesForWorkflow.some(p => p.id === id)
    );
    if (validPrivilegeIds.length !== currentPrivilegeIds.length) {
      this.basicForm.patchValue({ privilegeIds: validPrivilegeIds });
    }
  }

  /**
   * Handle screen role selection change.
   * Clears privileges that are no longer valid for the selected roles.
   */
  onScreenRolesChange(screen: any) {
    const filteredPrivs = this.getFilteredPrivilegesForScreen(screen);
    // Clear selected privileges that are no longer in the filtered list
    if (screen.privilegeIds && screen.privilegeIds.length > 0) {
      screen.privilegeIds = screen.privilegeIds.filter((id: string) =>
        filteredPrivs.some(p => p.id === id)
      );
    }
  }

  /**
   * Get filtered privileges for a specific screen based on its selected roles.
   */
  getFilteredPrivilegesForScreen(screen: any): Privilege[] {
    const selectedRoleIds: string[] = screen.roleIds || [];
    return this.getPrivilegesForRoles(selectedRoleIds);
  }

  /**
   * Get all privileges that belong to the specified roles.
   */
  getPrivilegesForRoles(roleIds: string[]): Privilege[] {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    // Get all privilege IDs from selected roles
    const privilegeIds = new Set<string>();
    roleIds.forEach(roleId => {
      const role = this.roles.find(r => r.id === roleId);
      if (role && role.privilegeIds) {
        role.privilegeIds.forEach(privId => privilegeIds.add(privId));
      }
    });

    // Filter privileges to only those in the selected roles
    return this.privileges.filter(p => privilegeIds.has(p.id));
  }

  loadCorporates() {
    this.userService.getActiveCorporates().subscribe(res => {
      if (res.success) {
        this.corporates = res.data;
      }
    });
  }

  loadSbus() {
    this.userService.getSbus().subscribe(res => {
      if (res.success) {
        this.sbus = res.data;
        this.filteredSbus = [...this.sbus];
      }
    });
  }

  loadBranches() {
    this.userService.getActiveBranches().subscribe(res => {
      if (res.success) {
        this.branches = res.data;
        this.filteredBranches = [...this.branches];
      }
    });
  }

  loadDepartments() {
    this.departmentService.getActiveDepartments().subscribe(res => {
      if (res.success) {
        this.departments = res.data;
        this.filteredDepartments = [...this.departments];
      }
    });
  }

  loadSqlObjects() {
    this.sqlObjectService.getActiveSqlObjects().subscribe(sqlObjects => {
      this.sqlObjects = sqlObjects;
    });
  }

  onOptionsSourceChange(field: any) {
    if (field.optionsSource === 'STATIC') {
      field.sqlObjectId = null;
    } else {
      // Clear static options when switching to SQL
      if (!field.options || field.options.length === 0) {
        field.options = [];
      }
    }
  }

  onCorporateChange() {
    const corporateIds: string[] = this.basicForm.get('corporateIds')?.value || [];

    if (corporateIds.length > 0) {
      // Include entities that have NO corporate (available to all) OR belong to selected corporates
      this.filteredSbus = this.sbus.filter(sbu => !sbu.corporateId || corporateIds.includes(sbu.corporateId));
      this.filteredDepartments = this.departments.filter(dept => !dept.corporateId || corporateIds.includes(dept.corporateId));
    } else {
      this.filteredSbus = [...this.sbus];
      this.filteredDepartments = [...this.departments];
    }

    // Clear invalid SBU selections
    const currentSbuIds: string[] = this.basicForm.get('sbuIds')?.value || [];
    const validSbuIds = currentSbuIds.filter(id => this.filteredSbus.some(s => s.id === id));
    if (validSbuIds.length !== currentSbuIds.length) {
      this.basicForm.patchValue({ sbuIds: validSbuIds });
    }

    // Clear invalid Department selections
    const currentDeptIds: string[] = this.basicForm.get('departmentIds')?.value || [];
    const validDeptIds = currentDeptIds.filter(id => this.filteredDepartments.some(d => d.id === id));
    if (validDeptIds.length !== currentDeptIds.length) {
      this.basicForm.patchValue({ departmentIds: validDeptIds });
    }

    this.onSbuChange();
  }

  onSbuChange() {
    const sbuIds: string[] = this.basicForm.get('sbuIds')?.value || [];
    const corporateIds: string[] = this.basicForm.get('corporateIds')?.value || [];

    // Get SBU IDs that have no corporate association (available to all)
    const sbuIdsWithNoCorporate = this.sbus.filter(s => !s.corporateId).map(s => s.id);

    if (sbuIds.length > 0) {
      // Include branches from selected SBUs OR branches from SBUs with no corporate
      this.filteredBranches = this.branches.filter(branch =>
        sbuIds.includes(branch.sbuId) || sbuIdsWithNoCorporate.includes(branch.sbuId)
      );
    } else if (corporateIds.length > 0) {
      // If corporates selected but no SBUs, show branches for SBUs in selected corporates OR SBUs with no corporate
      const sbuIdsForCorporates = this.sbus
        .filter(s => !s.corporateId || corporateIds.includes(s.corporateId))
        .map(s => s.id);
      this.filteredBranches = this.branches.filter(branch => sbuIdsForCorporates.includes(branch.sbuId));
    } else {
      this.filteredBranches = [...this.branches];
    }

    // Clear invalid Branch selections
    const currentBranchIds: string[] = this.basicForm.get('branchIds')?.value || [];
    const validBranchIds = currentBranchIds.filter(id => this.filteredBranches.some(b => b.id === id));
    if (validBranchIds.length !== currentBranchIds.length) {
      this.basicForm.patchValue({ branchIds: validBranchIds });
    }
  }

  loadWorkflow() {
    if (!this.workflowId) return;
    this.workflowService.getWorkflow(this.workflowId).subscribe(res => {
      if (res.success) {
        const workflow = res.data;
        this.workflowName = workflow.name || '';
        this.basicForm.patchValue({
          name: workflow.name,
          code: workflow.code,
          description: workflow.description,
          icon: workflow.icon,
          workflowTypeId: workflow.workflowTypeId || workflow.workflowType?.id,
          industryId: workflow.industryId || null,
          isActive: workflow.active ?? workflow.isActive ?? true,
          showSummary: workflow.showSummary ?? false,
          showApprovalMatrix: workflow.showApprovalMatrix ?? false,
          commentsMandatory: workflow.commentsMandatory ?? false,
          commentsMandatoryOnReject: workflow.commentsMandatoryOnReject ?? true,
          commentsMandatoryOnEscalate: workflow.commentsMandatoryOnEscalate ?? true,
          workflowCategory: workflow.workflowCategory || 'NON_FINANCIAL',
          parentWorkflowId: workflow.parentWorkflowId || null,
          stampId: workflow.stampId || null,
          corporateIds: workflow.corporateIds || [],
          sbuIds: workflow.sbuIds || [],
          branchIds: workflow.branchIds || [],
          departmentIds: workflow.departmentIds || [],
          roleIds: workflow.roleIds || [],
          privilegeIds: workflow.privilegeIds || [],
          reminderEnabled: workflow.reminderEnabled ?? false,
          reminderFrequencyHours: workflow.reminderFrequencyHours ?? 24,
          reminderMaxCount: workflow.reminderMaxCount ?? 3,
          reminderStartAfterHours: workflow.reminderStartAfterHours ?? 24,
          escalationEnabled: workflow.escalationEnabled ?? false,
          escalationAfterHours: workflow.escalationAfterHours ?? 72,
          escalationAction: workflow.escalationAction ?? 'NOTIFY_ADMIN',
          reminderIncludeSubmitter: workflow.reminderIncludeSubmitter ?? false,
          reminderEmailSubject: workflow.reminderEmailSubject || '',
          reminderEmailBody: workflow.reminderEmailBody || '',
          titleTemplate: workflow.titleTemplate || ''
        });
        this.selectedStampName = workflow.stampName || '';
        this.deserializeTitleTemplate(workflow.titleTemplate || '');

        // Apply cascading filters after loading workflow data
        setTimeout(() => {
          this.onCorporateChange();
          this.onWorkflowRolesChange();
        }, 100);

        if (workflow.forms?.[0]) {
          this.formId = workflow.forms[0].id;  // Store the form ID for updates
          this.fields = workflow.forms[0].fields?.map((f: any) => ({
            ...f,
            // Map backend property names to frontend property names
            type: f.fieldType || f.type,
            value: f.value || f.defaultValue || '',
            required: f.isMandatory ?? f.required ?? false,
            readOnly: f.isReadonly ?? f.readOnly ?? false,
            hidden: f.isHidden ?? f.hidden ?? false,
            isUnique: f.isUnique ?? false,
            isTitle: f.isTitle ?? false,
            isLimited: f.isLimited ?? false,
            inSummary: f.inSummary ?? false,
            optionsText: f.options?.map((o: any) => o.value).join('\n') || '',
            optionsLayout: f.optionsLayout || 'vertical',
            // Parse tableColumns JSON string back to array
            tableColumns: f.tableColumns ? (typeof f.tableColumns === 'string' ? JSON.parse(f.tableColumns) : f.tableColumns) : [],
            // Default apiShowInForm to true for existing API_ARRAY/API_OBJECT_ARRAY fields
            apiShowInForm: f.apiShowInForm ?? true,
            // Default apiTriggerMode to AUTO for existing fields
            apiTriggerMode: f.apiTriggerMode || 'AUTO',
            // Parse sqlTableColumns JSON string back to array for SQL_TABLE fields
            sqlTableColumnsDef: f.sqlTableColumns ? (typeof f.sqlTableColumns === 'string' ? (() => { try { return JSON.parse(f.sqlTableColumns); } catch(e) { return null; } })() : f.sqlTableColumns) : null
          })) || [];
          this.fieldGroups = workflow.forms[0].fieldGroups || [];
          this.screens = workflow.forms[0].screens || [];
        }

        // Map approvers and convert userId to approverId for the dropdown
        this.approvers = (workflow.approvers || []).map((a: any) => ({
          ...a,
          approverId: a.userId || a.approverId || null,
          email: a.approverEmail || a.email || '',
          approverType: a.approverType || (a.userId ? 'USER' : (a.roleId ? 'ROLE' : 'USER'))
        }));
      }
    });
  }

  getFieldIcon(type: string): string {
    const fieldType = this.fieldTypes.find(f => f.value === type);
    return fieldType?.icon || 'text_fields';
  }

  get isActiveSummaryScreen(): boolean {
    if (!this.activeScreenId) return false;
    const screen = this.screens.find(s => s.id === this.activeScreenId);
    return screen?.isSummaryScreen === true;
  }

  getNonSummaryScreens(): any[] {
    return this.screens.filter(s => !s.isSummaryScreen);
  }

  // Expression validation
  private knownFunctions: Set<string> | null = null;

  private getKnownFunctions(): Set<string> {
    if (!this.knownFunctions) {
      this.knownFunctions = new Set<string>();
      const allFnArrays = [
        this.validationFunctions, this.stringFunctions, this.numberFunctions,
        this.dateFunctions, this.conditionalFunctions, this.booleanFunctions, this.tableFunctions, this.utilityFunctions,
        this.sqlFunctions
      ];
      for (const arr of allFnArrays) {
        for (const fn of arr) {
          const match = fn.name.match(/^([A-Z_]+)\(/);
          if (match) this.knownFunctions.add(match[1]);
        }
      }
      // Add inline validation function names
      const inlineFns = [
        'Required', 'NotEmpty', 'MinLength', 'MaxLength', 'LengthRange',
        'Alpha', 'AlphaNumeric', 'Digits', 'Pattern', 'Contains',
        'StartsWith', 'EndsWith', 'Equals', 'Min', 'Max', 'Range',
        'Positive', 'Negative', 'Integer', 'Decimal', 'IsTrue', 'IsFalse',
        'Date', 'FutureDate', 'PastDate', 'DateBefore', 'DateAfter',
        'Email', 'Phone', 'URL', 'CreditCard', 'MinItems', 'MaxItems',
        'MinRows', 'MaxRows', 'MatchField', 'ValidWhen', 'InvalidWhen', 'Unique',
        'UPPER', 'LOWER', 'CAPITALIZE', 'TRIM', 'LTRIM', 'RTRIM', 'SLUG',
        'REMOVE_SPACES', 'ROUND', 'ROUND_UP', 'ROUND_DOWN'
      ];
      inlineFns.forEach(f => this.knownFunctions!.add(f.toUpperCase()));
    }
    return this.knownFunctions;
  }

  validateExpression(expr: string, type: 'validation' | 'transform' | 'visibility'): string | null {
    if (!expr || !expr.trim()) return null;
    const trimmed = expr.trim();

    // For visibility: allow simple "true"/"false"
    if (type === 'visibility' && (trimmed === 'true' || trimmed === 'false')) return null;

    // Check balanced parentheses and unterminated strings
    let depth = 0;
    let inString = false;
    let strChar = '';
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inString) {
        if (ch === '\\' && i + 1 < trimmed.length) { i++; continue; } // skip escaped chars
        if (ch === strChar) inString = false;
        continue;
      }
      if (ch === '"' || ch === "'") { inString = true; strChar = ch; continue; }
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth < 0) return 'Unmatched closing parenthesis ")"';
    }
    if (inString) return 'Unterminated string — missing closing quote';
    if (depth > 0) return `Unmatched opening parenthesis "(" — ${depth} unclosed`;

    // Check for empty parentheses with content issues like "Required( )" is ok but "Required(,)" is suspicious
    if (/,\s*\)/.test(trimmed)) return 'Trailing comma before closing parenthesis';
    if (/\(\s*,/.test(trimmed)) return 'Leading comma after opening parenthesis';

    // Extract function names and validate them
    const fnPattern = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
    let match;
    const known = this.getKnownFunctions();
    const unknownFns: string[] = [];
    while ((match = fnPattern.exec(trimmed)) !== null) {
      const fnName = match[1].toUpperCase();
      if (!known.has(fnName)) {
        unknownFns.push(match[1]);
      }
    }
    if (unknownFns.length > 0) {
      return `Unknown function${unknownFns.length > 1 ? 's' : ''}: ${unknownFns.join(', ')}`;
    }

    // For validation/transform: must contain at least one function call
    if (type !== 'visibility' && !/[A-Za-z_]\w*\s*\(/.test(trimmed)) {
      return 'Expression must contain at least one function call';
    }

    // For visibility: if it has parens, we already validated functions above
    // If no parens, check that it looks like a valid expression (has @{field} refs or operators)
    if (type === 'visibility' && !trimmed.includes('(') && !trimmed.includes('@{') &&
        !/[=!<>]/.test(trimmed) && trimmed !== 'true' && trimmed !== 'false') {
      return 'Expression should use @{fieldName} references, operators, or function calls';
    }

    return null;
  }

  addField(type: string) {
    // Prevent adding fields to the Summary screen
    if (this.isActiveSummaryScreen) return;

    // Determine the screen to assign the field to:
    // - If a specific screen is active, use that screen
    // - If "All Fields" is active (null) and screens exist, use the first non-summary screen
    // - Otherwise, use null (no screen assignment)
    let targetScreenId = this.activeScreenId;
    if (targetScreenId === null && this.screens.length > 0) {
      const firstNonSummary = this.screens.find(s => !s.isSummaryScreen);
      targetScreenId = firstNonSummary ? firstNonSummary.id : this.screens[0].id;
    }

    const field: any = {
      id: 'temp_' + Date.now(),
      type,
      name: '',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      readOnly: false,
      hidden: false,
      isUnique: false,
      isTitle: false,
      isLimited: false,
      inSummary: false,
      columnSpan: 2,
      displayOrder: this.fields.length,
      fieldGroupId: null,
      screenId: targetScreenId,  // Assign to active screen or first screen
      optionsText: '',
      optionsLayout: 'vertical',
      validation: '',
      validationMessage: '',
      customValidationRule: '',
      visibilityExpression: 'true',
      // Field-type specific defaults
      ratingMax: type === 'RATING' ? 5 : undefined,
      sliderMin: type === 'SLIDER' ? 0 : undefined,
      sliderMax: type === 'SLIDER' ? 100 : undefined,
      sliderStep: type === 'SLIDER' ? 1 : undefined,
      // SQL_OBJECT specific defaults
      sqlObjectId: type === 'SQL_OBJECT' ? null : undefined,
      viewType: type === 'SQL_OBJECT' ? 'SELECT' : undefined,
      optionsSource: type === 'SQL_OBJECT' ? 'SQL' : 'STATIC',
      // TABLE specific defaults
      tableColumns: type === 'TABLE' ? [
        { name: 'col1', label: 'Column 1', type: 'TEXT', width: null },
        { name: 'col2', label: 'Column 2', type: 'TEXT', width: null },
        { name: 'col3', label: 'Column 3', type: 'TEXT', width: null }
      ] : undefined,
      tableMinRows: type === 'TABLE' ? 0 : undefined,
      tableMaxRows: type === 'TABLE' ? null : undefined,
      tableStriped: (type === 'TABLE' || type === 'SQL_TABLE') ? true : undefined,
      tableBordered: (type === 'TABLE' || type === 'SQL_TABLE') ? true : undefined,
      tableResizable: type === 'TABLE' ? false : undefined,
      tableSearchable: (type === 'TABLE' || type === 'SQL_TABLE') ? false : undefined,
      tableFilterable: type === 'TABLE' ? false : undefined,
      tablePageable: (type === 'TABLE' || type === 'SQL_TABLE') ? false : undefined,
      tablePageSize: (type === 'TABLE' || type === 'SQL_TABLE') ? 10 : undefined,
      // SQL_TABLE specific defaults
      sqlQuery: type === 'SQL_TABLE' ? '' : undefined,
      sqlTableColumns: type === 'SQL_TABLE' ? null : undefined,
      sqlTableColumnsDef: type === 'SQL_TABLE' ? null : undefined,
      // ACCORDION specific defaults
      accordionAllowMultiple: type === 'ACCORDION' ? false : undefined,
      accordionDefaultOpenIndex: type === 'ACCORDION' ? 0 : undefined,
      accordionAnimationType: type === 'ACCORDION' ? 'smooth' : undefined,
      accordionAnimationDuration: type === 'ACCORDION' ? 300 : undefined,
      // COLLAPSIBLE specific defaults
      collapsibleTitle: type === 'COLLAPSIBLE' ? '' : undefined,
      collapsibleIcon: type === 'COLLAPSIBLE' ? '' : undefined,
      collapsibleDefaultExpanded: type === 'COLLAPSIBLE' ? false : undefined,
      parentFieldId: type === 'COLLAPSIBLE' ? null : undefined,
      // API trigger mode default (applies to API fields and SQL_TABLE)
      apiTriggerMode: ['API_VALUE','OBJECT_VIEWER','SQL_TABLE'].includes(type) ? 'AUTO' : undefined,
      // API field type defaults
      apiShowInForm: ['API_VALUE'].includes(type) ? true : undefined,
      apiUrl: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? '' : undefined,
      apiMethod: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? 'GET' : undefined,
      apiAuthType: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? 'NONE' : undefined,
      apiAuthValue: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? '' : undefined,
      apiHeaders: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? [] : undefined,
      apiParams: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? [] : undefined,
      apiBody: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? '' : undefined,
      apiResponsePath: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? '' : undefined,
      apiOnResponse: ['API_VALUE','OBJECT_VIEWER'].includes(type) ? '' : undefined
    };
    this.fields.push(field);
  }

  removeField(field: any) {
    const fieldName = field.label || field.name || 'this field';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Field',
        message: `Are you sure you want to delete "${fieldName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        const index = this.fields.indexOf(field);
        if (index >= 0) {
          this.fields.splice(index, 1);
        }
        // Remove any references to this field from the title template
        this.purgeFieldFromTitleTemplate(field.name);
        this.purgeFieldFromReferences(field.name, field.id);
        this.snackBar.open(`Field "${fieldName}" has been removed. Save the workflow to apply changes.`, 'Close', {
          duration: 4000,
          panelClass: ['info-snackbar']
        });
      }
    });
  }

  /**
   * Remove all references to a deleted field from other fields' configuration.
   * Prevents "unexpected error when saving" due to stale references.
   */
  private purgeFieldFromReferences(deletedFieldName: string, deletedFieldId: string | undefined) {
    if (!deletedFieldName && !deletedFieldId) return;
    const nameToken = deletedFieldName ? `@{${deletedFieldName}}` : '';
    const nameRegex = deletedFieldName ? new RegExp(`@\\{\\s*${deletedFieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}`, 'g') : null;

    for (const f of this.fields) {
      if (!f || f === null) continue;
      // Clear tableDataSource / apiDataSourceField / apiValueField / apiDisplayField if they reference the deleted field
      if (f.tableDataSource === deletedFieldName) f.tableDataSource = '';
      if (f.apiDataSourceField === deletedFieldName) f.apiDataSourceField = '';
      if (f.apiValueField === deletedFieldName) f.apiValueField = '';
      if (f.apiDisplayField === deletedFieldName) f.apiDisplayField = '';
      // Clear parentFieldId if it points to the deleted field
      if (f.parentFieldId && (f.parentFieldId === deletedFieldId || f.parentFieldId === deletedFieldName)) {
        f.parentFieldId = null;
      }
      // Strip @{deletedField} tokens from validation / transform / visibility / value expressions
      if (nameRegex) {
        if (typeof f.validation === 'string' && f.validation) f.validation = f.validation.replace(nameRegex, '""');
        if (typeof f.customValidationRule === 'string' && f.customValidationRule) f.customValidationRule = f.customValidationRule.replace(nameRegex, '""');
        if (typeof f.visibilityExpression === 'string' && f.visibilityExpression) f.visibilityExpression = f.visibilityExpression.replace(nameRegex, '""');
        if (typeof f.value === 'string' && f.value) f.value = f.value.replace(nameRegex, '""');
      }
    }
  }

  // TABLE field column management
  addTableColumn(field: any): void {
    if (!field.tableColumns) {
      field.tableColumns = [];
    }
    const colNum = field.tableColumns.length + 1;
    field.tableColumns.push({
      name: `col${colNum}`,
      label: `Column ${colNum}`,
      type: 'TEXT',
      width: null
    });
  }

  syncSqlTableColumns(field: any): void {
    if (field.sqlTableColumnsDef && field.sqlTableColumnsDef.length > 0) {
      field.sqlTableColumns = JSON.stringify(field.sqlTableColumnsDef.filter((c: any) => c.key));
    } else {
      field.sqlTableColumns = null;
    }
  }

  removeTableColumn(field: any, index: number): void {
    if (field.tableColumns && field.tableColumns.length > 1) {
      field.tableColumns.splice(index, 1);
      // Re-sync table-wide readonly after column removal
      this.syncTableReadOnlyFromColumns(field);
    } else {
      this.snackBar.open('Table must have at least one column', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  getApiHeaders(field: any): {key: string, value: string}[] {
    if (!field.apiHeaders) return [];
    if (typeof field.apiHeaders === 'string') {
      try {
        field.apiHeaders = JSON.parse(field.apiHeaders);
      } catch {
        field.apiHeaders = [];
      }
    }
    return field.apiHeaders;
  }

  addApiHeader(field: any): void {
    const headers = this.getApiHeaders(field);
    headers.push({ key: '', value: '' });
    field.apiHeaders = headers;
  }

  removeApiHeader(field: any, index: number): void {
    const headers = this.getApiHeaders(field);
    headers.splice(index, 1);
    field.apiHeaders = headers;
  }

  getApiParams(field: any): {key: string, value: string, type: string}[] {
    if (!field.apiParams) return [];
    if (typeof field.apiParams === 'string') {
      try {
        field.apiParams = JSON.parse(field.apiParams);
      } catch {
        field.apiParams = [];
      }
    }
    return field.apiParams;
  }

  addApiParam(field: any): void {
    const params = this.getApiParams(field);
    params.push({ key: '', value: '', type: 'QUERY' });
    field.apiParams = params;
  }

  removeApiParam(field: any, index: number): void {
    const params = this.getApiParams(field);
    params.splice(index, 1);
    field.apiParams = params;
  }

  getApiObjectArrayFields(): any[] {
    return this.fields.filter((f: any) => f.type === 'API_OBJECT_ARRAY');
  }

  getApiArrayFields(): any[] {
    return this.fields.filter((f: any) => f.type === 'API_ARRAY' || f.type === 'API_OBJECT_ARRAY');
  }

  /**
   * Called when the table-wide readonly checkbox changes.
   * If checked, all column readonly checkboxes are set to true.
   * If unchecked, all column readonly checkboxes are set to false.
   */
  onTableReadOnlyChange(field: any): void {
    if (field.type !== 'TABLE' || !field.tableColumns) return;

    const isReadOnly = field.readOnly;
    field.tableColumns.forEach((col: any) => {
      col.readOnly = isReadOnly;
    });
  }

  /**
   * Called when an individual column's readonly checkbox changes.
   * Syncs the table-wide readonly based on whether all columns are readonly.
   */
  onColumnReadOnlyChange(field: any): void {
    this.syncTableReadOnlyFromColumns(field);
  }

  /**
   * Syncs the table-wide readonly checkbox based on column readonly states.
   * Table-wide readonly is checked only if ALL columns are readonly.
   */
  private syncTableReadOnlyFromColumns(field: any): void {
    if (field.type !== 'TABLE' || !field.tableColumns || field.tableColumns.length === 0) return;

    const allColumnsReadOnly = field.tableColumns.every((col: any) => col.readOnly === true);
    field.readOnly = allColumnsReadOnly;
  }

  dropField(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.fields, event.previousIndex, event.currentIndex);
    this.fields.forEach((f, i) => f.displayOrder = i);
  }

  addFieldGroup() {
    const group = {
      id: 'temp_' + Date.now(),
      title: '',
      description: '',
      displayOrder: this.fieldGroups.length,
      collapsible: false,
      collapsed: false
    };
    this.fieldGroups.push(group);
  }

  removeFieldGroup(index: number) {
    const group = this.fieldGroups[index];
    const groupName = group.title || group.name || 'this group';
    const fieldsInGroup = this.fields.filter(f => f.fieldGroupId === group.id).length;

    const message = fieldsInGroup > 0
      ? `Are you sure you want to delete "${groupName}"? ${fieldsInGroup} field(s) will be moved out of the group.`
      : `Are you sure you want to delete "${groupName}"?`;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Field Group',
        message: message,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        const groupId = group.id;
        this.fields.forEach(f => {
          if (f.fieldGroupId === groupId) {
            f.fieldGroupId = null;
          }
        });
        this.fieldGroups.splice(index, 1);
        this.snackBar.open(`Group "${groupName}" has been removed. Save the workflow to apply changes.`, 'Close', {
          duration: 4000,
          panelClass: ['info-snackbar']
        });
      }
    });
  }

  getFieldsInGroup(groupId: string): any[] {
    return this.fields.filter(f => f.fieldGroupId === groupId);
  }

  getAccordionFields(): any[] {
    return this.fields.filter(f => f.type === 'ACCORDION');
  }

  getCollapsiblesForAccordion(accordionId: string): any[] {
    return this.fields.filter(f => f.type === 'COLLAPSIBLE' && f.parentFieldId === accordionId);
  }

  /**
   * Handle collapsible parent accordion change.
   * When assigned to an accordion, clear the screenId (inherits from accordion).
   * When standalone, allow setting screenId.
   */
  onCollapsibleParentChange(field: any): void {
    if (field.parentFieldId) {
      // Assigned to accordion - inherit screen from accordion, clear own screenId
      const parentAccordion = this.fields.find(f => f.id === field.parentFieldId);
      if (parentAccordion) {
        field.screenId = parentAccordion.screenId || null;
      }
    }
    // If standalone (parentFieldId is null), screenId can be set independently
  }

  /**
   * Compute parentFieldId for all fields based on their position.
   * Fields after a COLLAPSIBLE (until the next COLLAPSIBLE or ACCORDION) belong to that collapsible.
   * COLLAPSIBLE fields should already have parentFieldId set to their parent ACCORDION.
   */
  computeFieldParentIds(): any[] {
    const result: any[] = [];
    let currentCollapsibleId: string | null = null;
    let currentAccordionId: string | null = null;

    for (const field of this.fields) {
      const fieldCopy = { ...field };

      if (field.type === 'ACCORDION') {
        // ACCORDION is a top-level container - no parent
        fieldCopy.parentFieldId = null;
        currentAccordionId = field.id;
        currentCollapsibleId = null; // Reset collapsible context
      } else if (field.type === 'COLLAPSIBLE') {
        // COLLAPSIBLE belongs to its parent accordion
        if (currentAccordionId) {
          fieldCopy.parentFieldId = currentAccordionId;
        }
        currentCollapsibleId = field.id;
      } else {
        // Regular field - belongs to the current collapsible if one is active
        if (currentCollapsibleId) {
          fieldCopy.parentFieldId = currentCollapsibleId;
        }
      }

      result.push(fieldCopy);
    }

    return result;
  }

  addScreen() {
    const screen = {
      id: 'temp_' + Date.now(),
      title: '',
      description: '',
      displayOrder: this.screens.length,
      icon: 'view_carousel',
      roleIds: [],
      privilegeIds: [],
      notifiers: []
    };
    this.screens.push(screen);
  }

  addScreenNotifier(screen: any) {
    if (!screen.notifiers) {
      screen.notifiers = [];
    }
    screen.notifiers.push({
      id: 'temp_' + Date.now(),
      notifierType: 'EMAIL',
      email: '',
      userId: null,
      userName: null,
      roleId: null,
      roleName: null,
      displayOrder: screen.notifiers.length
    });
  }

  removeScreenNotifier(screen: any, index: number) {
    screen.notifiers.splice(index, 1);
  }

  onNotifierTypeChange(notifier: any) {
    notifier.email = '';
    notifier.userId = null;
    notifier.userName = null;
    notifier.roleId = null;
    notifier.roleName = null;
  }

  onNotifierUserSelected(notifier: any, event: any) {
    const user = this.users.find(u => u.id === event.value);
    if (user) {
      notifier.userName = (user.firstName || '') + ' ' + (user.lastName || '');
    }
  }

  onNotifierRoleSelected(notifier: any, event: any) {
    const role = this.roles.find(r => r.id === event.value);
    if (role) {
      notifier.roleName = role.name;
    }
  }

  removeScreen(index: number) {
    const screenId = this.screens[index].id;
    // Clear screenId from fields assigned to this screen
    this.fields.forEach(f => {
      if (f.screenId === screenId) {
        f.screenId = null;
      }
    });
    // Clear screenId from field groups assigned to this screen
    this.fieldGroups.forEach(g => {
      if (g.screenId === screenId) {
        g.screenId = null;
      }
    });
    this.screens.splice(index, 1);
  }

  dropScreen(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.screens, event.previousIndex, event.currentIndex);
    this.screens.forEach((s, i) => s.displayOrder = i);
  }

  getFieldsInScreen(screenId: string): any[] {
    return this.fields.filter(f => f.screenId === screenId);
  }

  getFieldGroupsInScreen(screenId: string): any[] {
    return this.fieldGroups.filter(g => g.screenId === screenId);
  }

  setActiveScreen(screenId: string | null) {
    this.activeScreenId = screenId;
  }

  getFilteredFields(): any[] {
    if (this.activeScreenId === null) {
      return this.fields;
    }
    return this.fields.filter(f => f.screenId === this.activeScreenId);
  }

  getAvailableFieldGroups(field: any): any[] {
    // If no screens, show all groups
    if (this.screens.length === 0) {
      return this.fieldGroups;
    }
    // Get the screen context - use field's screenId or activeScreenId
    const contextScreenId = field.screenId || this.activeScreenId;
    // If no context, show all groups
    if (!contextScreenId) {
      return this.fieldGroups;
    }
    // Filter groups: show groups with no screen or matching context screen
    return this.fieldGroups.filter(g => !g.screenId || g.screenId === contextScreenId);
  }

  getScreenTitle(screenId: string): string {
    const screen = this.screens.find(s => s.id === screenId);
    return screen?.title || 'Untitled Screen';
  }

  showFunctionHelp(fn: any, event: Event) {
    event.stopPropagation(); // Prevent insertFunction from firing
    this.dialog.open(FunctionHelpDialogComponent, {
      width: '720px',
      maxHeight: '85vh',
      panelClass: 'function-help-dialog-panel',
      data: { functionName: fn.name }
    });
  }

  insertFunction(fn: any) {
    // Copy the function syntax to clipboard and show a snackbar message
    navigator.clipboard.writeText(fn.syntax).then(() => {
      this.snackBar.open(`Copied: ${fn.syntax}`, 'Close', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open(`Function: ${fn.syntax}`, 'Close', { duration: 5000 });
    });
  }

  getFilteredIcons(): string[] {
    const search = (this.basicForm.get('icon')?.value || '').toLowerCase().trim();
    if (!search) return this.icons;
    // If the user typed an exact icon name, show all matches (helpful when they want to confirm)
    return this.icons.filter(icon => icon.toLowerCase().includes(search));
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`Copied: ${text}`, 'Close', { duration: 3000 });
    }).catch(() => {
      this.snackBar.open(`Placeholder: ${text}`, 'Close', { duration: 5000 });
    });
  }

  // ---- Title Template Builder ----
  addTitlePart() {
    this.titleTemplateParts.push({ field: '', connector: ' - ' });
    this.updateTitleTemplate();
  }

  removeTitlePart(index: number) {
    this.titleTemplateParts.splice(index, 1);
    this.updateTitleTemplate();
  }

  moveTitlePart(index: number, delta: number) {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= this.titleTemplateParts.length) return;
    const [item] = this.titleTemplateParts.splice(index, 1);
    this.titleTemplateParts.splice(newIndex, 0, item);
    this.updateTitleTemplate();
  }

  updateTitleTemplate() {
    const template = this.serializeTitleTemplate();
    this.basicForm.patchValue({ titleTemplate: template });
  }

  private serializeTitleTemplate(): string {
    let result = '';
    this.titleTemplateParts.forEach((part, i) => {
      if (!part.field) return;
      result += '@{' + part.field + '}';
      if (i < this.titleTemplateParts.length - 1) {
        result += part.connector || '';
      }
    });
    return result;
  }

  private deserializeTitleTemplate(template: string) {
    this.titleTemplateParts = [];
    if (!template) return;
    const regex = /@\{([^}]+)\}/g;
    const tokens: { field: string; start: number; end: number }[] = [];
    let m;
    while ((m = regex.exec(template)) !== null) {
      tokens.push({ field: m[1].trim(), start: m.index, end: m.index + m[0].length });
    }
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const connector = i < tokens.length - 1 ? template.substring(tok.end, tokens[i + 1].start) : '';
      this.titleTemplateParts.push({ field: tok.field, connector });
    }
  }

  getAllFormFields(): { name: string; label: string }[] {
    // Flatten all form fields from all screens/forms
    return (this.fields || [])
      .filter((f: any) => f && f.name)
      .map((f: any) => ({ name: f.name, label: f.label || f.name }));
  }

  getTitleContributingFields(): { name: string; label: string }[] {
    // Only fields explicitly marked as contributing to title
    return (this.fields || [])
      .filter((f: any) => f && f.name && f.isTitle === true)
      .map((f: any) => ({ name: f.name, label: f.label || f.name }));
  }

  getTitlePreview(): string {
    if (this.titleTemplateParts.length === 0) return '(empty)';
    // Use all form fields so previously-selected fields still display correctly even if they're
    // no longer marked as title contributors (they'll still resolve at runtime).
    const fieldMap = new Map(this.getAllFormFields().map(f => [f.name, f.label]));
    const phMap = new Map(this.titleWorkflowPlaceholders.map(p => [p.key, p.label]));
    let result = '';
    this.titleTemplateParts.forEach((part, i) => {
      if (!part.field) return;
      const label = fieldMap.get(part.field) || phMap.get(part.field) || part.field;
      result += '[' + label + ']';
      if (i < this.titleTemplateParts.length - 1) {
        result += part.connector || '';
      }
    });
    return result || '(empty)';
  }

  // Called when a form field is removed so the title template stays clean
  purgeFieldFromTitleTemplate(fieldName: string) {
    if (!fieldName) return;
    const before = this.titleTemplateParts.length;
    this.titleTemplateParts = this.titleTemplateParts.filter(p => p.field !== fieldName);
    if (this.titleTemplateParts.length !== before) {
      this.updateTitleTemplate();
    }
  }

  // Called when a field's "Contributes to Title" flag is toggled.
  // If unchecked, remove any title-template references to this field.
  onIsTitleChange(field: any) {
    if (!field.isTitle) {
      this.purgeFieldFromTitleTemplate(field.name);
    }
  }

  getFilteredFunctions(): { name: string; description: string; syntax: string; category: string }[] {
    if (!this.functionSearch) return [];

    const search = this.functionSearch.toLowerCase();
    const allFunctions = [
      ...this.validationFunctions.map(f => ({ ...f, category: 'Validation' })),
      ...this.stringFunctions.map(f => ({ ...f, category: 'String' })),
      ...this.numberFunctions.map(f => ({ ...f, category: 'Number' })),
      ...this.dateFunctions.map(f => ({ ...f, category: 'Date' })),
      ...this.conditionalFunctions.map(f => ({ ...f, category: 'Conditional' })),
      ...this.booleanFunctions.map(f => ({ ...f, category: 'Boolean/Logic' })),
      ...this.utilityFunctions.map(f => ({ ...f, category: 'Utility' })),
      ...this.tableFunctions.map(f => ({ ...f, category: 'Table' })),
      ...this.sqlFunctions.map(f => ({ ...f, category: 'SQL' })),
      ...this.otherFunctions.map(f => ({ ...f, category: 'Other' })),
      ...this.placeholderItems.map(f => ({ ...f, category: f.category || 'Placeholder' }))
    ];

    return allFunctions.filter(fn =>
      fn.name.toLowerCase().includes(search) ||
      fn.description.toLowerCase().includes(search) ||
      fn.category.toLowerCase().includes(search)
    );
  }

  getAccessSummary(): string[] {
    const summary: string[] = [];
    const corporateIds: string[] = this.basicForm.get('corporateIds')?.value || [];
    const sbuIds: string[] = this.basicForm.get('sbuIds')?.value || [];
    const branchIds: string[] = this.basicForm.get('branchIds')?.value || [];
    const departmentIds: string[] = this.basicForm.get('departmentIds')?.value || [];
    const roleIds: string[] = this.basicForm.get('roleIds')?.value || [];
    const privilegeIds: string[] = this.basicForm.get('privilegeIds')?.value || [];

    corporateIds.forEach(id => {
      const corp = this.corporates.find(c => c.id === id);
      if (corp) summary.push(`Corporate: ${corp.name}`);
    });

    sbuIds.forEach(id => {
      const sbu = this.sbus.find(s => s.id === id);
      if (sbu) summary.push(`SBU: ${sbu.name}`);
    });

    branchIds.forEach(id => {
      const branch = this.branches.find(b => b.id === id);
      if (branch) summary.push(`Branch: ${branch.name}`);
    });

    departmentIds.forEach(id => {
      const dept = this.departments.find(d => d.id === id);
      if (dept) summary.push(`Department: ${dept.name}`);
    });

    roleIds.forEach(id => {
      const role = this.roles.find(r => r.id === id);
      if (role) summary.push(`Role: ${role.name}`);
    });

    privilegeIds.forEach(id => {
      const privilege = this.privileges.find(p => p.id === id);
      if (privilege) summary.push(`Privilege: ${privilege.name}`);
    });

    return summary;
  }

  isFinancialWorkflow(): boolean {
    return this.basicForm.get('workflowCategory')?.value === 'FINANCIAL';
  }

  isAmountField(type: string): boolean {
    // Only field types that can represent currency/monetary values
    return type === 'NUMBER' || type === 'CURRENCY';
  }

  /**
   * Check if a field type supports placeholder text
   */
  hasPlaceholderOption(type: string): boolean {
    const placeholderTypes = [
      'TEXT', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'EMAIL', 'PHONE', 'URL', 'PASSWORD',
      'SELECT', 'MULTISELECT', 'USER', 'BARCODE', 'RICH_TEXT'
    ];
    return placeholderTypes.includes(type);
  }

  /**
   * Check if a field type supports default value
   */
  hasValueOption(type: string): boolean {
    // Field types that support default/preset values
    const valueTypes = [
      'TEXT', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'EMAIL', 'PHONE', 'URL', 'PASSWORD',
      'DATE', 'DATETIME', 'TIME', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX',
      'CHECKBOX_GROUP', 'TOGGLE', 'YES_NO', 'SLIDER', 'RATING', 'COLOR', 'HIDDEN',
      'USER', 'BARCODE', 'LOCATION'
    ];
    return valueTypes.includes(type);
  }

  hasLimitedField(): boolean {
    return this.fields.some(f => f.isLimited);
  }

  onLimitedChange(field: any) {
    if (field.isLimited) {
      // Uncheck all other fields' isLimited when this one is checked
      this.fields.forEach(f => {
        if (f.id !== field.id) {
          f.isLimited = false;
        }
      });
    }
  }

  addApprover() {
    const maxLevel = this.approvers.length > 0
      ? Math.max(...this.approvers.map(a => a.level))
      : 0;
    const approver = {
      level: maxLevel + 1,
      approverType: 'USER',
      approverId: null as string | null,
      roleId: null,
      email: '',
      amountLimit: null,
      canEscalate: true,
      requireComment: false,
      emailNotification: true,
      userSearchText: '',
      filteredUsers: this.users
    };
    this.approvers.push(approver);
  }

  onApproverTypeChange(approver: any) {
    // Clear user-specific fields when changing type
    approver.approverId = null;
    approver.roleId = null;
    approver.userSearchText = '';
    approver.filteredUsers = this.users;
    if (approver.approverType !== 'USER') {
      approver.email = '';
    }
  }

  onUserSelected(approver: any) {
    if (approver.approverId) {
      const selectedUser = this.users.find(u => u.id === approver.approverId);
      if (selectedUser) {
        approver.email = selectedUser.email || '';
      }
    } else {
      approver.email = '';
    }
  }

  filterUsers(approver: any, searchText: string) {
    if (!searchText || typeof searchText !== 'string') {
      approver.filteredUsers = this.users;
      return;
    }
    // Skip filtering if the value is a selected user ID (from autocomplete selection)
    if (this.users.find(u => u.id === searchText)) {
      approver.filteredUsers = this.users;
      return;
    }
    const search = searchText.toLowerCase();
    approver.filteredUsers = this.users.filter(user =>
      user.fullName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  }

  onUserAutoSelected(approver: any, event: any) {
    const userId = event.option.value;
    approver.approverId = userId;
    const selectedUser = this.users.find(u => u.id === userId);
    if (selectedUser) {
      approver.email = selectedUser.email || '';
      approver.userSearchText = selectedUser.fullName;
    }
  }

  onApproverUserSelected(approver: any) {
    const selectedUser = this.users.find(u => u.id === approver.approverId);
    if (selectedUser) {
      approver.email = selectedUser.email || '';
    }
  }

  displayUserFn(userId: any): string {
    if (!userId) return '';
    const user = this.users.find(u => u.id === userId);
    return user ? (user.fullName || '') : '';
  }

  getApproverDisplayName(approver: any): string {
    const userId = approver.approverId || approver.userId;
    if (userId) {
      const user = this.users.find(u => u.id === userId);
      if (user?.fullName) {
        return user.fullName;
      }
    }
    return approver.approverName || '';
  }

  removeApprover(index: number) {
    const approver = this.approvers[index];
    const approverName = this.getApproverDisplayName(approver) || `Level ${approver.level || index + 1}`;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Remove Approver',
        message: `Are you sure you want to remove approver "${approverName}"? This will remove this approval level from the workflow.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        type: 'delete' as ConfirmDialogType
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.approvers.splice(index, 1);
        // Don't auto-renumber levels - users set levels manually
        this.snackBar.open(`Approver "${approverName}" has been removed. Save the workflow to apply changes.`, 'Close', {
          duration: 4000,
          panelClass: ['info-snackbar']
        });
      }
    });
  }

  dropApprover(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.approvers, event.previousIndex, event.currentIndex);
    // Don't auto-renumber levels - users set levels manually
  }

  preview() {
    // Compute parentFieldId for accordion/collapsible fields for preview
    const fieldsWithParent = this.computeFieldParentIds();

    this.dialog.open(WorkflowPreviewDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'preview-dialog-container',
      data: {
        workflowName: this.basicForm.get('name')?.value || 'Untitled Workflow',
        workflowDescription: this.basicForm.get('description')?.value || '',
        workflowIcon: this.basicForm.get('icon')?.value || 'description',
        fields: fieldsWithParent,
        fieldGroups: this.fieldGroups,
        screens: this.screens
      }
    });
  }

  saveWorkflow() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Validate SQL_TABLE fields have a query
    const sqlTableFields = this.fields.filter(f => f.type === 'SQL_TABLE');
    const missingSqlQuery = sqlTableFields.find(f => !f.sqlQuery || !f.sqlQuery.trim());
    if (missingSqlQuery) {
      this.snackBar.open(`SQL Table field "${missingSqlQuery.label || missingSqlQuery.name}" requires a SQL query`, 'Close', { duration: 4000 });
      return;
    }

    this.loading = true;

    // Compute parentFieldId for fields based on their position relative to collapsibles/accordions
    const fieldsWithParent = this.computeFieldParentIds();

    const processedFields = fieldsWithParent.map(f => ({
      ...f,
      // Map frontend property names to backend property names
      fieldType: f.type || f.fieldType,
      defaultValue: f.value || f.defaultValue || '',
      isMandatory: f.required ?? f.isMandatory ?? false,
      isReadonly: f.readOnly ?? f.isReadonly ?? false,
      isHidden: f.hidden ?? f.isHidden ?? false,
      isUnique: f.isUnique ?? false,
      isTitle: f.isTitle ?? false,
      isLimited: f.isLimited ?? false,
      inSummary: f.inSummary ?? false,
      // Explicitly include parentFieldId for nested fields
      parentFieldId: f.parentFieldId || null,
      // Convert tableColumns array to JSON string for backend storage
      tableColumns: f.tableColumns ? JSON.stringify(f.tableColumns) : null,
      // Convert sqlTableColumnsDef to JSON string for SQL_TABLE fields
      sqlTableColumns: f.sqlTableColumnsDef ? JSON.stringify(f.sqlTableColumnsDef.filter((c: any) => c.key)) : f.sqlTableColumns || null,
      // Convert apiHeaders/apiParams arrays to JSON string for backend storage
      apiHeaders: f.apiHeaders && Array.isArray(f.apiHeaders) ? JSON.stringify(f.apiHeaders) : f.apiHeaders || null,
      apiParams: f.apiParams && Array.isArray(f.apiParams) ? JSON.stringify(f.apiParams) : f.apiParams || null,
      options: f.optionsText?.split('\n').filter((o: string) => o.trim()).map((value: string, index: number) => ({
        value: value.trim(),
        label: value.trim(),
        displayOrder: index
      })) || []
    }));

    const workflowData = {
      ...this.basicForm.value,
      forms: [{
        id: this.formId,  // Include form ID for updates
        name: 'Main Form',
        fields: processedFields,
        fieldGroups: this.fieldGroups,
        screens: this.screens
      }],
      approvers: this.approvers.map(a => ({
        ...a,
        // Sync userId from approverId (dropdown value) so backend always gets the current selection
        userId: a.approverId || a.userId || null,
        approverId: a.approverId || a.userId || null
      }))
    };

    const request = this.isEdit
      ? this.workflowService.updateWorkflow(this.workflowId!, workflowData)
      : this.workflowService.createWorkflow(workflowData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.snackBar.open(
            this.isEdit ? 'Workflow updated successfully' : 'Workflow created successfully',
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/workflows']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to save workflow', 'Close', { duration: 3000 });
      }
    });
  }
}
