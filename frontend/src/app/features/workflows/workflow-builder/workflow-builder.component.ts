import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { WorkflowService } from '@core/services/workflow.service';
import { UserService } from '@core/services/user.service';
import { DepartmentService } from '@core/services/department.service';
import { Workflow, FieldType, WorkflowField, FieldGroup, WorkflowCategory } from '@core/models/workflow.model';
import { User, SBU, Corporate, Branch } from '@core/models/user.model';
import { Department } from '@core/models/department.model';
import { WorkflowPreviewDialogComponent } from './workflow-preview-dialog.component';

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
    MatTooltipModule
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
                      <mat-label>Workflow Type</mat-label>
                      <mat-select formControlName="workflowTypeId">
                        @for (type of workflowTypes; track type.id) {
                          <mat-option [value]="type.id">{{ type.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
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
                    <mat-checkbox formControlName="commentsMandatory">Comments Mandatory on Approval</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnReject">Comments Mandatory on Reject</mat-checkbox>
                    <mat-checkbox formControlName="commentsMandatoryOnEscalate">Comments Mandatory on Escalate</mat-checkbox>
                  </div>
                </form>
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
                                  <div class="function-name">{{ fn.name }}</div>
                                  <div class="function-desc">{{ fn.description }}</div>
                                  <div class="function-category-tag">{{ fn.category }}</div>
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
                            <div class="function-category">
                              <h4><mat-icon>text_fields</mat-icon> String Functions</h4>
                              <div class="function-list">
                                @for (fn of stringFunctions; track fn.name) {
                                  <div class="function-item" (click)="insertFunction(fn)">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                  </div>
                                }
                              </div>
                            </div>

                            <div class="function-category">
                              <h4><mat-icon>pin</mat-icon> Number Functions</h4>
                              <div class="function-list">
                                @for (fn of numberFunctions; track fn.name) {
                                  <div class="function-item" (click)="insertFunction(fn)">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                  </div>
                                }
                              </div>
                            </div>

                            <div class="function-category">
                              <h4><mat-icon>calendar_today</mat-icon> Date Functions</h4>
                              <div class="function-list">
                                @for (fn of dateFunctions; track fn.name) {
                                  <div class="function-item" (click)="insertFunction(fn)">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                  </div>
                                }
                              </div>
                            </div>

                            <div class="function-category">
                              <h4><mat-icon>toggle_on</mat-icon> Boolean/Logic Functions</h4>
                              <div class="function-list">
                                @for (fn of booleanFunctions; track fn.name) {
                                  <div class="function-item" (click)="insertFunction(fn)">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                  </div>
                                }
                              </div>
                            </div>

                            <div class="function-category">
                              <h4><mat-icon>functions</mat-icon> Utility Functions</h4>
                              <div class="function-list">
                                @for (fn of utilityFunctions; track fn.name) {
                                  <div class="function-item" (click)="insertFunction(fn)">
                                    <div class="function-name">{{ fn.name }}</div>
                                    <div class="function-desc">{{ fn.description }}</div>
                                  </div>
                                }
                              </div>
                            </div>
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
                  </mat-card-header>
                  <mat-card-content>
                    <div cdkDropList (cdkDropListDropped)="dropField($event)" class="field-list">
                      @for (field of fields; track field.id; let i = $index) {
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

                            <mat-form-field appearance="outline" class="form-field full-width">
                              <mat-label>Placeholder</mat-label>
                              <input matInput [(ngModel)]="field.placeholder">
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="form-field full-width">
                              <mat-label>Value</mat-label>
                              <input matInput [(ngModel)]="field.value" placeholder="Static value or function e.g. TODAY(), CURRENT_USER()">
                              <mat-hint>Enter a preset value or use a function (click Functions tab to copy syntax)</mat-hint>
                            </mat-form-field>

                            @if (field.type === 'SELECT' || field.type === 'RADIO' || field.type === 'CHECKBOX_GROUP') {
                              <mat-form-field appearance="outline" class="form-field full-width">
                                <mat-label>Options (one per line)</mat-label>
                                <textarea matInput [(ngModel)]="field.optionsText" rows="4"
                                          placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
                              </mat-form-field>
                            }

                            <div class="form-row">
                              <mat-form-field appearance="outline" class="form-field">
                                <mat-label>Field Group</mat-label>
                                <mat-select [(ngModel)]="field.fieldGroupId">
                                  <mat-option [value]="null">None</mat-option>
                                  @for (group of fieldGroups; track group.id) {
                                    <mat-option [value]="group.id">{{ group.title }}</mat-option>
                                  }
                                </mat-select>
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

                            <div class="checkbox-row">
                              <mat-checkbox [(ngModel)]="field.required">Required</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.readOnly">Read Only</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.hidden">Hidden</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.isUnique">Unique</mat-checkbox>
                              <mat-checkbox [(ngModel)]="field.isTitle">Make Title</mat-checkbox>
                              @if (isFinancialWorkflow() && isAmountField(field.type)) {
                                <mat-checkbox [(ngModel)]="field.isLimited"
                                              [disabled]="!field.isLimited && hasLimitedField()"
                                              (change)="onLimitedChange(field)"
                                              matTooltip="Mark this field as the amount to check against approver limits for auto-escalation">
                                  Limited
                                </mat-checkbox>
                              }
                            </div>

                            <div class="field-actions">
                              <button mat-button color="warn" (click)="removeField(i)">
                                <mat-icon>delete</mat-icon>
                                Remove
                              </button>
                            </div>
                          </div>
                        </mat-expansion-panel>
                      }

                      @if (fields.length === 0) {
                        <div class="empty-canvas">
                          <mat-icon>touch_app</mat-icon>
                          <p>Click on field types to add them to your form</p>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
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
                          @if (approver.amountLimit) {
                            Up to {{ approver.amountLimit | currency }}
                          } @else {
                            No limit
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
                            <mat-select [(ngModel)]="approver.approverId" (selectionChange)="onUserSelected(approver)">
                              @for (user of users; track user.id) {
                                <mat-option [value]="user.id">{{ user.fullName }} ({{ user.email }})</mat-option>
                              }
                            </mat-select>
                            <mat-hint>Select the approver for this level</mat-hint>
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
      gap: 2rem;
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
      padding: 0.375rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      border: 1px solid transparent;
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

    .field-list {
      min-height: 200px;
    }

    .field-panel, .group-panel, .approver-panel {
      margin-bottom: 0.5rem;
    }

    .field-config, .group-config, .approver-config {
      padding: 1rem;
    }

    .field-actions, .group-actions, .approver-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
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
  approvers: any[] = [];

  workflowTypes: any[] = [];
  users: User[] = [];
  roles: any[] = [];
  corporates: Corporate[] = [];
  sbus: SBU[] = [];
  filteredSbus: SBU[] = [];
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  departments: Department[] = [];
  filteredDepartments: Department[] = [];

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
    { value: 'DATE', label: 'Date', icon: 'calendar_today' },
    { value: 'DATETIME', label: 'Date & Time', icon: 'schedule' },
    { value: 'SELECT', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
    { value: 'RADIO', label: 'Radio Buttons', icon: 'radio_button_checked' },
    { value: 'CHECKBOX', label: 'Checkbox', icon: 'check_box' },
    { value: 'CHECKBOX_GROUP', label: 'Checkbox Group', icon: 'checklist' },
    { value: 'FILE', label: 'File Upload', icon: 'attach_file' },
    { value: 'CURRENCY', label: 'Currency', icon: 'attach_money' },
    { value: 'URL', label: 'URL', icon: 'link' }
  ];

  // String Functions
  stringFunctions = [
    { name: 'UPPER(field)', description: 'Convert text to uppercase', syntax: 'UPPER(fieldName)' },
    { name: 'LOWER(field)', description: 'Convert text to lowercase', syntax: 'LOWER(fieldName)' },
    { name: 'TRIM(field)', description: 'Remove leading/trailing spaces', syntax: 'TRIM(fieldName)' },
    { name: 'CONCAT(a, b)', description: 'Join two or more text values', syntax: 'CONCAT(field1, field2)' },
    { name: 'LEFT(field, n)', description: 'Get first n characters', syntax: 'LEFT(fieldName, 5)' },
    { name: 'RIGHT(field, n)', description: 'Get last n characters', syntax: 'RIGHT(fieldName, 5)' },
    { name: 'SUBSTRING(field, start, len)', description: 'Extract part of text', syntax: 'SUBSTRING(fieldName, 1, 5)' },
    { name: 'LENGTH(field)', description: 'Get text length', syntax: 'LENGTH(fieldName)' },
    { name: 'REPLACE(field, old, new)', description: 'Replace text', syntax: 'REPLACE(fieldName, "old", "new")' },
    { name: 'CONTAINS(field, text)', description: 'Check if text contains value', syntax: 'CONTAINS(fieldName, "search")' },
    { name: 'STARTS_WITH(field, text)', description: 'Check if text starts with value', syntax: 'STARTS_WITH(fieldName, "prefix")' },
    { name: 'ENDS_WITH(field, text)', description: 'Check if text ends with value', syntax: 'ENDS_WITH(fieldName, "suffix")' }
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
    { name: 'ABS(field)', description: 'Get absolute value', syntax: 'ABS(fieldName)' },
    { name: 'MIN(a, b, ...)', description: 'Get minimum value', syntax: 'MIN(field1, field2)' },
    { name: 'MAX(a, b, ...)', description: 'Get maximum value', syntax: 'MAX(field1, field2)' },
    { name: 'AVERAGE(a, b, ...)', description: 'Calculate average', syntax: 'AVERAGE(field1, field2, field3)' },
    { name: 'PERCENTAGE(value, total)', description: 'Calculate percentage', syntax: 'PERCENTAGE(part, total)' },
    { name: 'MOD(a, b)', description: 'Get remainder of division', syntax: 'MOD(field1, field2)' },
    { name: 'POWER(base, exp)', description: 'Raise to power', syntax: 'POWER(fieldName, 2)' }
  ];

  // Date Functions
  dateFunctions = [
    { name: 'TODAY()', description: 'Get current date', syntax: 'TODAY()' },
    { name: 'NOW()', description: 'Get current date and time', syntax: 'NOW()' },
    { name: 'DATE_FORMAT(field, format)', description: 'Format date', syntax: 'DATE_FORMAT(fieldName, "DD/MM/YYYY")' },
    { name: 'DATE_ADD(field, n, unit)', description: 'Add time to date', syntax: 'DATE_ADD(fieldName, 7, "days")' },
    { name: 'DATE_SUBTRACT(field, n, unit)', description: 'Subtract time from date', syntax: 'DATE_SUBTRACT(fieldName, 1, "month")' },
    { name: 'DATE_DIFF(a, b, unit)', description: 'Difference between dates', syntax: 'DATE_DIFF(startDate, endDate, "days")' },
    { name: 'YEAR(field)', description: 'Extract year from date', syntax: 'YEAR(fieldName)' },
    { name: 'MONTH(field)', description: 'Extract month from date', syntax: 'MONTH(fieldName)' },
    { name: 'DAY(field)', description: 'Extract day from date', syntax: 'DAY(fieldName)' },
    { name: 'WEEKDAY(field)', description: 'Get day of week (1-7)', syntax: 'WEEKDAY(fieldName)' },
    { name: 'START_OF_MONTH(field)', description: 'Get first day of month', syntax: 'START_OF_MONTH(fieldName)' },
    { name: 'END_OF_MONTH(field)', description: 'Get last day of month', syntax: 'END_OF_MONTH(fieldName)' },
    { name: 'IS_WEEKEND(field)', description: 'Check if date is weekend', syntax: 'IS_WEEKEND(fieldName)' },
    { name: 'BUSINESS_DAYS(a, b)', description: 'Count business days between dates', syntax: 'BUSINESS_DAYS(startDate, endDate)' }
  ];

  // Boolean/Logic Functions
  booleanFunctions = [
    { name: 'IF(condition, then, else)', description: 'Conditional logic', syntax: 'IF(field > 100, "High", "Low")' },
    { name: 'AND(a, b, ...)', description: 'All conditions must be true', syntax: 'AND(condition1, condition2)' },
    { name: 'OR(a, b, ...)', description: 'Any condition must be true', syntax: 'OR(condition1, condition2)' },
    { name: 'NOT(condition)', description: 'Reverse boolean value', syntax: 'NOT(fieldName)' },
    { name: 'IS_EMPTY(field)', description: 'Check if field is empty', syntax: 'IS_EMPTY(fieldName)' },
    { name: 'IS_NOT_EMPTY(field)', description: 'Check if field has value', syntax: 'IS_NOT_EMPTY(fieldName)' },
    { name: 'EQUALS(a, b)', description: 'Check if values are equal', syntax: 'EQUALS(field1, field2)' },
    { name: 'NOT_EQUALS(a, b)', description: 'Check if values differ', syntax: 'NOT_EQUALS(field1, field2)' },
    { name: 'GREATER_THAN(a, b)', description: 'Check if a > b', syntax: 'GREATER_THAN(field1, field2)' },
    { name: 'LESS_THAN(a, b)', description: 'Check if a < b', syntax: 'LESS_THAN(field1, field2)' },
    { name: 'BETWEEN(field, min, max)', description: 'Check if value is in range', syntax: 'BETWEEN(fieldName, 10, 100)' },
    { name: 'IN(field, list)', description: 'Check if value is in list', syntax: 'IN(fieldName, ["A", "B", "C"])' }
  ];

  // Utility Functions
  utilityFunctions = [
    { name: 'COALESCE(a, b, ...)', description: 'Return first non-empty value', syntax: 'COALESCE(field1, field2, "default")' },
    { name: 'DEFAULT(field, value)', description: 'Set default if empty', syntax: 'DEFAULT(fieldName, "N/A")' },
    { name: 'FORMAT_CURRENCY(field, currency)', description: 'Format as currency', syntax: 'FORMAT_CURRENCY(amount, "USD")' },
    { name: 'FORMAT_NUMBER(field, decimals)', description: 'Format number with decimals', syntax: 'FORMAT_NUMBER(fieldName, 2)' },
    { name: 'TO_NUMBER(field)', description: 'Convert text to number', syntax: 'TO_NUMBER(fieldName)' },
    { name: 'TO_TEXT(field)', description: 'Convert value to text', syntax: 'TO_TEXT(fieldName)' },
    { name: 'UUID()', description: 'Generate unique identifier', syntax: 'UUID()' },
    { name: 'SEQUENCE(prefix)', description: 'Generate sequential number', syntax: 'SEQUENCE("INV-")' },
    { name: 'CURRENT_USER()', description: 'Get current user name', syntax: 'CURRENT_USER()' },
    { name: 'CURRENT_USER_EMAIL()', description: 'Get current user email', syntax: 'CURRENT_USER_EMAIL()' },
    { name: 'FIELD_VALUE(name)', description: 'Get value of another field', syntax: 'FIELD_VALUE("otherFieldName")' },
    { name: 'LOOKUP(field, source)', description: 'Lookup value from data source', syntax: 'LOOKUP(fieldName, "employees")' }
  ];

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private userService: UserService,
    private departmentService: DepartmentService,
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
      commentsMandatory: [false],
      commentsMandatoryOnReject: [true],
      commentsMandatoryOnEscalate: [true],
      corporateIds: [[]],
      sbuIds: [[]],
      branchIds: [[]],
      departmentIds: [[]]
    });
  }

  ngOnInit() {
    this.loadWorkflowTypes();
    this.loadUsers();
    this.loadRoles();
    this.loadCorporates();
    this.loadSbus();
    this.loadBranches();
    this.loadDepartments();

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
      departmentIds: []
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

  onCorporateChange() {
    const corporateIds: string[] = this.basicForm.get('corporateIds')?.value || [];

    if (corporateIds.length > 0) {
      this.filteredSbus = this.sbus.filter(sbu => corporateIds.includes(sbu.corporateId || ''));
      this.filteredDepartments = this.departments.filter(dept => corporateIds.includes(dept.corporateId || ''));
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

    if (sbuIds.length > 0) {
      this.filteredBranches = this.branches.filter(branch => sbuIds.includes(branch.sbuId));
    } else if (corporateIds.length > 0) {
      // If corporates selected but no SBUs, show branches for all SBUs in selected corporates
      const sbuIdsForCorporates = this.sbus
        .filter(s => corporateIds.includes(s.corporateId || ''))
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
          commentsMandatory: workflow.commentsMandatory ?? false,
          commentsMandatoryOnReject: workflow.commentsMandatoryOnReject ?? true,
          commentsMandatoryOnEscalate: workflow.commentsMandatoryOnEscalate ?? true,
          workflowCategory: workflow.workflowCategory || 'NON_FINANCIAL',
          corporateIds: workflow.corporateIds || [],
          sbuIds: workflow.sbuIds || [],
          branchIds: workflow.branchIds || [],
          departmentIds: workflow.departmentIds || []
        });

        // Apply cascading filters after loading workflow data
        setTimeout(() => {
          this.onCorporateChange();
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
            optionsText: f.options?.map((o: any) => o.value).join('\n') || ''
          })) || [];
          this.fieldGroups = workflow.forms[0].fieldGroups || [];
        }

        // Map approvers and convert userId to approverId for the dropdown
        this.approvers = (workflow.approvers || []).map((a: any) => ({
          ...a,
          approverId: a.userId || a.approverId || null,
          email: a.approverEmail || a.email || ''
        }));
      }
    });
  }

  getFieldIcon(type: string): string {
    const fieldType = this.fieldTypes.find(f => f.value === type);
    return fieldType?.icon || 'text_fields';
  }

  addField(type: string) {
    const field = {
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
      columnSpan: 2,
      displayOrder: this.fields.length,
      fieldGroupId: null,
      optionsText: ''
    };
    this.fields.push(field);
  }

  removeField(index: number) {
    this.fields.splice(index, 1);
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
    const groupId = this.fieldGroups[index].id;
    this.fields.forEach(f => {
      if (f.fieldGroupId === groupId) {
        f.fieldGroupId = null;
      }
    });
    this.fieldGroups.splice(index, 1);
  }

  getFieldsInGroup(groupId: string): any[] {
    return this.fields.filter(f => f.fieldGroupId === groupId);
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
      ...this.stringFunctions.map(f => ({ ...f, category: 'String' })),
      ...this.numberFunctions.map(f => ({ ...f, category: 'Number' })),
      ...this.dateFunctions.map(f => ({ ...f, category: 'Date' })),
      ...this.booleanFunctions.map(f => ({ ...f, category: 'Boolean/Logic' })),
      ...this.utilityFunctions.map(f => ({ ...f, category: 'Utility' }))
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

    return summary;
  }

  isFinancialWorkflow(): boolean {
    return this.basicForm.get('workflowCategory')?.value === 'FINANCIAL';
  }

  isAmountField(type: string): boolean {
    // Only field types that can represent currency/monetary values
    return type === 'NUMBER' || type === 'CURRENCY';
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
      approverId: null as string | null,
      email: '',
      amountLimit: null,
      canEscalate: true,
      requireComment: false,
      emailNotification: true
    };
    this.approvers.push(approver);
  }

  onApproverTypeChange(approver: any) {
    // Clear user-specific fields when changing type
    approver.approverId = null;
    approver.roleId = null;
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

  getApproverDisplayName(approver: any): string {
    const userId = approver.approverId || approver.userId;
    if (userId) {
      const user = this.users.find(u => u.id === userId);
      if (user?.fullName) {
        return user.fullName;
      }
    }
    // Fallback to backend-provided name
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
    this.dialog.open(WorkflowPreviewDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        workflowName: this.basicForm.get('name')?.value || 'Untitled Workflow',
        workflowDescription: this.basicForm.get('description')?.value || '',
        workflowIcon: this.basicForm.get('icon')?.value || 'description',
        fields: this.fields,
        fieldGroups: this.fieldGroups
      }
    });
  }

  saveWorkflow() {
    if (this.basicForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    const processedFields = this.fields.map(f => ({
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
        fieldGroups: this.fieldGroups
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
