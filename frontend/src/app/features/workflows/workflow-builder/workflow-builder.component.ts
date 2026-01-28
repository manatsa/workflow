import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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
import { WorkflowService } from '@core/services/workflow.service';
import { UserService } from '@core/services/user.service';
import { DepartmentService } from '@core/services/department.service';
import { SqlObjectService } from '@core/services/sql-object.service';
import { Workflow, FieldType, WorkflowField, FieldGroup, WorkflowCategory, SqlObject } from '@core/models/workflow.model';
import { User, SBU, Corporate, Branch, Role, Privilege } from '@core/models/user.model';
import { Department } from '@core/models/department.model';
import { WorkflowPreviewDialogComponent } from './workflow-preview-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
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
    MatAutocompleteModule
  ],
  template: `
    <div class="workflow-builder-container">
      <div class="header">
        <button mat-icon-button routerLink="/workflows">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEdit ? 'Editing: ' + workflowName : 'Create Workflow' }}</h1>
        <div class="header-actions">
          <button mat-button (click)="preview()">
            <mat-icon>visibility</mat-icon>
            Preview
          </button>
          <button mat-raised-button color="primary" (click)="saveWorkflow()" [disabled]="loading">
            <mat-icon>save</mat-icon>
            {{ loading ? 'Saving...' : 'Save Workflow' }}
          </button>
        </div>
      </div>

      <mat-tab-group>
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
                      <mat-select formControlName="icon">
                        @for (icon of icons; track icon) {
                          <mat-option [value]="icon">
                            <mat-icon>{{ icon }}</mat-icon> {{ icon }}
                          </mat-option>
                        }
                      </mat-select>
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

                  <div class="checkbox-row">
                    <mat-checkbox formControlName="isActive">Active</mat-checkbox>
                    <mat-checkbox formControlName="showSummary">Show Summary</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatory">Comments Mandatory on Approval</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnReject">Comments Mandatory on Reject</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnEscalate">Comments Mandatory on Escalate</mat-checkbox>
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
                <button mat-raised-button color="primary" (click)="addScreen()">
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

                      <div class="screen-config">
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
                          <button mat-button color="warn" (click)="removeScreen(i)">
                            <mat-icon>delete</mat-icon>
                            Remove Screen
                          </button>
                        </div>
                      </div>
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
                <button mat-raised-button color="primary" (click)="addFieldGroup()">
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
                        <button mat-button color="warn" (click)="removeFieldGroup(i)">
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
                          <div class="field-types">
                            @for (fieldType of fieldTypes; track fieldType.value) {
                              <div class="field-type-item" (click)="addField(fieldType.value)">
                                <mat-icon>{{ fieldType.icon }}</mat-icon>
                                <span>{{ fieldType.label }}</span>
                              </div>
                            }
                          </div>
                          <div class="palette-section">
                            <h4>Groups</h4>
                            <button mat-stroked-button (click)="addFieldGroup()">
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
                                <button mat-icon-button (click)="functionSearch = ''">
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
                        <button mat-button
                                [class.active]="activeScreenId === null"
                                (click)="setActiveScreen(null)">
                          <mat-icon>apps</mat-icon>
                          All Fields ({{ fields.length }})
                        </button>
                        @for (screen of screens; track screen.id) {
                          <button mat-button
                                  [class.active]="activeScreenId === screen.id"
                                  (click)="setActiveScreen(screen.id)">
                            <mat-icon>{{ screen.icon || 'view_carousel' }}</mat-icon>
                            {{ screen.title || 'Untitled' }} ({{ getFieldsInScreen(screen.id).length }})
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
                                <input matInput [(ngModel)]="field.value" placeholder="Static value or function e.g. TODAY(), CURRENT_USER()">
                                <mat-hint>Enter a preset value or use a function (click Functions tab to copy syntax)</mat-hint>
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

                              @if (field.optionsSource !== 'SQL') {
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
                                    @for (screen of screens; track screen.id) {
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
                                <mat-checkbox [(ngModel)]="field.required">Required</mat-checkbox>
                                <mat-checkbox [(ngModel)]="field.readOnly" (change)="onTableReadOnlyChange(field)">Read Only</mat-checkbox>
                                <mat-checkbox [(ngModel)]="field.hidden">Hidden</mat-checkbox>
                                <mat-checkbox [(ngModel)]="field.isUnique">Unique</mat-checkbox>
                                <mat-checkbox [(ngModel)]="field.isTitle">Make Title</mat-checkbox>
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
                                    <button mat-stroked-button type="button" (click)="addTableColumn(field)" class="add-column-btn">
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
                                    Striped rows (alternating background)
                                  </mat-checkbox>
                                  <mat-checkbox [(ngModel)]="field.tableBordered">
                                    Show cell borders
                                  </mat-checkbox>
                                </div>
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
                                        @for (screen of screens; track screen.id) {
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
                                      @for (screen of screens; track screen.id) {
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

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Validation Expression</mat-label>
                                  <textarea matInput [(ngModel)]="field.validation" rows="2"
                                            placeholder="e.g., Required() AND MinLength(5)"></textarea>
                                  <mat-hint>Required(), MinLength(n), MaxLength(n), Min(n), Max(n), Range(min,max), Email(), Phone(), URL(), Pattern(/regex/), Unique(), Digits(), Alpha(), AlphaNumeric(), CreditCard(), ValidWhen(expr), InvalidWhen(expr). Combine with AND.</mat-hint>
                                </mat-form-field>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Transform Expression</mat-label>
                                  <textarea matInput [(ngModel)]="field.customValidationRule" rows="2"
                                            placeholder="e.g., UPPER() or TRIM()"></textarea>
                                  <mat-hint>Transform value: UPPER(), LOWER(), TRIM(), ROUND(decimals), PAD_LEFT(len, char), SUBSTRING(start, end)</mat-hint>
                                </mat-form-field>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Custom Error Message</mat-label>
                                  <input matInput [(ngModel)]="field.validationMessage"
                                         placeholder="Custom message when validation fails">
                                </mat-form-field>

                                <mat-form-field appearance="outline" class="form-field full-width">
                                  <mat-label>Visibility Expression</mat-label>
                                  <textarea matInput [(ngModel)]="field.visibilityExpression" rows="2"
                                            placeholder="e.g., true or &#64;{otherField} == 'Yes'"></textarea>
                                  <mat-hint>Expression to control visibility. Use &#64;{{ '{' }}fieldName{{ '}' }} to reference other fields. Default: true</mat-hint>
                                </mat-form-field>
                              </mat-expansion-panel>
                            }

                            <div class="field-actions">
                              <button mat-button color="warn" (click)="removeField(i)">
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

        <!-- Approvers Tab -->
        <mat-tab label="Approvers">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Approval Levels</mat-card-title>
                <button mat-raised-button color="primary" (click)="addApprover()">
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
                          {{ approver.approverType }}
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
                            <mat-label>Approver Type</mat-label>
                            <mat-select [(ngModel)]="approver.approverType" (selectionChange)="onApproverTypeChange(approver)">
                              <mat-option value="USER">Specific User</mat-option>
                              <mat-option value="ROLE">Role</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>

                        @if (approver.approverType === 'USER') {
                          <mat-form-field appearance="outline" class="form-field full-width">
                            <mat-label>Select User</mat-label>
                            <input matInput
                                   type="text"
                                   [matAutocomplete]="userAuto"
                                   [(ngModel)]="approver.userSearchText"
                                   (ngModelChange)="filterUsers(approver, $event)"
                                   placeholder="Search by name or email...">
                            <mat-autocomplete #userAuto="matAutocomplete"
                                              (optionSelected)="onUserAutoSelected(approver, $event)"
                                              [displayWith]="displayUserFn.bind(this)">
                              @for (user of approver.filteredUsers || users; track user.id) {
                                <mat-option [value]="user.id">
                                  <span class="user-option">
                                    <strong>{{ user.fullName }}</strong>
                                    <small>{{ user.email }}</small>
                                  </span>
                                </mat-option>
                              }
                              @if ((approver.filteredUsers || users).length === 0) {
                                <mat-option disabled>No users found</mat-option>
                              }
                            </mat-autocomplete>
                            <mat-icon matSuffix>search</mat-icon>
                            <mat-hint>Type to search for a user</mat-hint>
                          </mat-form-field>
                        }

                        @if (approver.approverType === 'ROLE') {
                          <mat-form-field appearance="outline" class="form-field full-width">
                            <mat-label>Select Role</mat-label>
                            <mat-select [(ngModel)]="approver.roleId">
                              @for (role of roles; track role.id) {
                                <mat-option [value]="role.id">{{ role.name }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        }

                        <div class="form-row">
                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Amount Limit</mat-label>
                            <input matInput type="number" [(ngModel)]="approver.amountLimit">
                            <mat-hint>Leave blank for no limit</mat-hint>
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Email</mat-label>
                            <input matInput type="email" [(ngModel)]="approver.email" [readonly]="approver.approverType === 'USER'">
                            <mat-hint>{{ approver.approverType === 'USER' ? 'Auto-populated from user' : 'For email notifications' }}</mat-hint>
                          </mat-form-field>
                        </div>

                        <div class="checkbox-row">
                          <mat-checkbox [(ngModel)]="approver.canEscalate">Can Escalate</mat-checkbox>
                          <mat-checkbox [(ngModel)]="approver.requireComment">Require Comment</mat-checkbox>
                          <mat-checkbox [(ngModel)]="approver.emailNotification">Email Notification</mat-checkbox>
                        </div>

                        <div class="approver-actions">
                          <button mat-button color="warn" (click)="removeApprover(i)">
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

        <!-- Access Restrictions Tab -->
        <mat-tab label="Access Restrictions">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>lock</mat-icon>
                  Access Restrictions
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="access-info">
                  <mat-icon>info</mat-icon>
                  <p>Leave all fields empty to make this workflow visible to all users. Select specific corporates, SBUs, branches, or departments to restrict access.</p>
                </div>

                <form [formGroup]="basicForm">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Corporates</mat-label>
                      <mat-select formControlName="corporateIds" multiple (selectionChange)="onCorporateChange()">
                        @for (corp of corporates; track corp.id) {
                          <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Users from selected corporates can access this workflow</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>SBUs</mat-label>
                      <mat-select formControlName="sbuIds" multiple (selectionChange)="onSbuChange()">
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
                      <mat-select formControlName="branchIds" multiple>
                        @for (branch of filteredBranches; track branch.id) {
                          <mat-option [value]="branch.id">{{ branch.name }} @if (branch.sbuName) { ({{ branch.sbuName }}) }</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Filter by SBU first for relevant branches</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Departments</mat-label>
                      <mat-select formControlName="departmentIds" multiple>
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
                      <mat-select formControlName="roleIds" multiple (selectionChange)="onWorkflowRolesChange()">
                        @for (role of roles; track role.id) {
                          <mat-option [value]="role.id">{{ role.name }}</mat-option>
                        }
                      </mat-select>
                      <mat-hint>Select roles to filter available privileges</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="form-field">
                      <mat-label>Privileges</mat-label>
                      <mat-select formControlName="privilegeIds" multiple [disabled]="filteredPrivilegesForWorkflow.length === 0">
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
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .workflow-builder-container { padding: 1rem; }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header h1 { flex: 1; margin: 0; }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .tab-content { padding: 1rem 0; }

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
      font-size: 0.8rem;
      font-weight: 600;
      color: #1976d2;
      padding-bottom: 0.375rem;
      border-bottom: 1px solid #e0e0e0;
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

    .validation-panel {
      margin-top: 1rem;
      margin-bottom: 1rem;
      background: #fafafa;
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
  formId: string | null = null;  // Track the main form ID
  private destroy$ = new Subject<void>();

  basicForm: FormGroup;
  fields: any[] = [];
  fieldGroups: any[] = [];
  screens: any[] = [];
  approvers: any[] = [];

  workflowTypes: any[] = [];
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
    'description', 'assignment', 'receipt', 'request_quote', 'shopping_cart',
    'account_balance', 'attach_money', 'credit_card', 'flight', 'hotel',
    'directions_car', 'inventory', 'local_shipping', 'build', 'engineering'
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
    { value: 'ACCORDION', label: 'Accordion', icon: 'view_agenda', description: 'Container for collapsible panels' },
    { value: 'COLLAPSIBLE', label: 'Collapsible', icon: 'expand_more', description: 'Collapsible panel for grouping fields' },
    { value: 'HIDDEN', label: 'Hidden Field', icon: 'visibility_off' },
    { value: 'LABEL', label: 'Label/Text', icon: 'label' },
    { value: 'DIVIDER', label: 'Divider', icon: 'horizontal_rule' }
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
    { name: 'PERCENTAGE(value, total)', description: 'Calculate percentage', syntax: 'PERCENTAGE(part, total)' },
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
    { name: 'BUSINESS_DAYS(a, b)', description: 'Count business days between dates', syntax: 'BUSINESS_DAYS(startDate, endDate)' },
    { name: 'ADD_BUSINESS_DAYS(field, n)', description: 'Add business days', syntax: 'ADD_BUSINESS_DAYS(fieldName, 5)' },
    { name: 'AGE(birthDate)', description: 'Calculate age in years', syntax: 'AGE(birthDateField)' }
  ];

  // Boolean/Logic Functions
  booleanFunctions = [
    { name: 'IF(condition, then, else)', description: 'Conditional logic', syntax: 'IF(field > 100, "High", "Low")' },
    { name: 'IFS(cond1, val1, ...)', description: 'Multiple conditions', syntax: 'IFS(field > 100, "High", field > 50, "Medium", true, "Low")' },
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
    { name: 'IS_VALID_URL(field)', description: 'Validate URL format', syntax: 'IS_VALID_URL(urlField)' }
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

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private sqlObjectService: SqlObjectService,
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
      workflowCategory: ['NON_FINANCIAL'],
      isActive: [true],
      showSummary: [false],
      commentsMandatory: [false],
      commentsMandatoryOnReject: [true],
      commentsMandatoryOnEscalate: [true],
      corporateIds: [[]],
      sbuIds: [[]],
      branchIds: [[]],
      departmentIds: [[]],
      roleIds: [[]],
      privilegeIds: [[]]
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
      privilegeIds: []
    });
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
          isActive: workflow.active ?? workflow.isActive ?? true,
          showSummary: workflow.showSummary ?? false,
          commentsMandatory: workflow.commentsMandatory ?? false,
          commentsMandatoryOnReject: workflow.commentsMandatoryOnReject ?? true,
          commentsMandatoryOnEscalate: workflow.commentsMandatoryOnEscalate ?? true,
          workflowCategory: workflow.workflowCategory || 'NON_FINANCIAL',
          corporateIds: workflow.corporateIds || [],
          sbuIds: workflow.sbuIds || [],
          branchIds: workflow.branchIds || [],
          departmentIds: workflow.departmentIds || [],
          roleIds: workflow.roleIds || [],
          privilegeIds: workflow.privilegeIds || []
        });

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
            tableColumns: f.tableColumns ? (typeof f.tableColumns === 'string' ? JSON.parse(f.tableColumns) : f.tableColumns) : []
          })) || [];
          this.fieldGroups = workflow.forms[0].fieldGroups || [];
          this.screens = workflow.forms[0].screens || [];
        }

        // Map approvers and convert userId to approverId for the dropdown
        this.approvers = (workflow.approvers || []).map((a: any) => ({
          ...a,
          approverId: a.userId || a.approverId || null,
          approverType: a.approverType || (a.userId ? 'USER' : (a.roleId ? 'ROLE' : 'USER'))
        }));
      }
    });
  }

  getFieldIcon(type: string): string {
    const fieldType = this.fieldTypes.find(f => f.value === type);
    return fieldType?.icon || 'text_fields';
  }

  addField(type: string) {
    // Determine the screen to assign the field to:
    // - If a specific screen is active, use that screen
    // - If "All Fields" is active (null) and screens exist, use the first screen
    // - Otherwise, use null (no screen assignment)
    let targetScreenId = this.activeScreenId;
    if (targetScreenId === null && this.screens.length > 0) {
      targetScreenId = this.screens[0].id;
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
      tableStriped: type === 'TABLE' ? true : undefined,
      tableBordered: type === 'TABLE' ? true : undefined,
      // ACCORDION specific defaults
      accordionAllowMultiple: type === 'ACCORDION' ? false : undefined,
      accordionDefaultOpenIndex: type === 'ACCORDION' ? 0 : undefined,
      accordionAnimationType: type === 'ACCORDION' ? 'smooth' : undefined,
      accordionAnimationDuration: type === 'ACCORDION' ? 300 : undefined,
      // COLLAPSIBLE specific defaults
      collapsibleTitle: type === 'COLLAPSIBLE' ? '' : undefined,
      collapsibleIcon: type === 'COLLAPSIBLE' ? '' : undefined,
      collapsibleDefaultExpanded: type === 'COLLAPSIBLE' ? false : undefined,
      parentFieldId: type === 'COLLAPSIBLE' ? null : undefined
    };
    this.fields.push(field);
  }

  removeField(index: number) {
    const field = this.fields[index];
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
        this.fields.splice(index, 1);
        this.snackBar.open(`Field "${fieldName}" has been removed. Save the workflow to apply changes.`, 'Close', {
          duration: 4000,
          panelClass: ['info-snackbar']
        });
      }
    });
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
      privilegeIds: []
    };
    this.screens.push(screen);
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

  getFilteredFunctions(): { name: string; description: string; syntax: string; category: string }[] {
    if (!this.functionSearch) return [];

    const search = this.functionSearch.toLowerCase();
    const allFunctions = [
      ...this.validationFunctions.map(f => ({ ...f, category: 'Validation' })),
      ...this.stringFunctions.map(f => ({ ...f, category: 'String' })),
      ...this.numberFunctions.map(f => ({ ...f, category: 'Number' })),
      ...this.dateFunctions.map(f => ({ ...f, category: 'Date' })),
      ...this.booleanFunctions.map(f => ({ ...f, category: 'Boolean/Logic' })),
      ...this.utilityFunctions.map(f => ({ ...f, category: 'Utility' })),
      ...this.tableFunctions.map(f => ({ ...f, category: 'Table' })),
      ...this.otherFunctions.map(f => ({ ...f, category: 'Other' }))
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
    // Field types that support placeholder text (TEXT excluded - view-only field)
    const placeholderTypes = [
      'TEXTAREA', 'NUMBER', 'CURRENCY', 'EMAIL', 'PHONE', 'URL', 'PASSWORD',
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

  displayUserFn(userId: any): string {
    if (!userId) return '';
    const user = this.users.find(u => u.id === userId);
    return user ? (user.fullName || '') : '';
  }

  getApproverDisplayName(approver: any): string {
    if (approver.approverType === 'USER') {
      const userId = approver.approverId || approver.userId;
      if (userId) {
        const user = this.users.find(u => u.id === userId);
        if (user?.fullName) {
          return user.fullName;
        }
      }
      // Fallback to backend-provided name
      if (approver.approverName) {
        return approver.approverName;
      }
    }
    if (approver.approverType === 'ROLE' && approver.roleId) {
      const role = this.roles.find(r => r.id === approver.roleId);
      if (role?.name) {
        return role.name;
      }
      // Fallback to backend-provided name
      if (approver.approverName) {
        return approver.approverName;
      }
    }
    return approver.approverName || '';
  }

  removeApprover(index: number) {
    this.approvers.splice(index, 1);
    // Don't auto-renumber levels - users set levels manually
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
      approvers: this.approvers
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
