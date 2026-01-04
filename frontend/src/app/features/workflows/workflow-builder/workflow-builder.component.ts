import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
import { WorkflowService } from '@core/services/workflow.service';
import { UserService } from '@core/services/user.service';
import { Workflow, FieldType, WorkflowField, FieldGroup } from '@core/models/workflow.model';
import { User } from '@core/models/user.model';
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
    MatDialogModule
  ],
  template: `
    <div class="workflow-builder-container">
      <div class="header">
        <button mat-icon-button routerLink="/workflows">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEdit ? 'Edit Workflow' : 'Create Workflow' }}</h1>
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
                  <mat-card-header>
                    <mat-card-title>Field Types</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
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

                            @if (field.type === 'SELECT' || field.type === 'RADIO' || field.type === 'CHECKBOX_GROUP') {
                              <mat-form-field appearance="outline" class="form-field full-width">
                                <mat-label>Options (one per line)</mat-label>
                                <textarea matInput [(ngModel)]="field.optionsText" rows="4"
                                          placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
                              </mat-form-field>
                            }

                            @if (field.type === 'DATE' || field.type === 'DATETIME') {
                              <mat-form-field appearance="outline" class="form-field full-width">
                                <mat-label>Default Value</mat-label>
                                <mat-select [(ngModel)]="field.defaultValue">
                                  <mat-option [value]="null">No default</mat-option>
                                  <mat-option value="TODAY">Today (Current Date)</mat-option>
                                </mat-select>
                                <mat-hint>Set a default value for this date field</mat-hint>
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
                  Add Level
                </button>
              </mat-card-header>
              <mat-card-content>
                <div cdkDropList (cdkDropListDropped)="dropApprover($event)" class="approver-list">
                  @for (approver of approvers; track approver.level; let i = $index) {
                    <mat-expansion-panel cdkDrag class="approver-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <mat-icon cdkDragHandle>drag_indicator</mat-icon>
                          Level {{ approver.level }}: {{ approver.label || 'Approver' }}
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
                            <mat-label>Label</mat-label>
                            <input matInput [(ngModel)]="approver.label">
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="form-field">
                            <mat-label>Approver Type</mat-label>
                            <mat-select [(ngModel)]="approver.approverType">
                              <mat-option value="USER">Specific User</mat-option>
                              <mat-option value="ROLE">Role</mat-option>
                              <mat-option value="MANAGER">Line Manager</mat-option>
                              <mat-option value="SBU_HEAD">SBU Head</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>

                        @if (approver.approverType === 'USER') {
                          <mat-form-field appearance="outline" class="form-field full-width">
                            <mat-label>Select Users</mat-label>
                            <mat-select [(ngModel)]="approver.approverIds" multiple>
                              @for (user of users; track user.id) {
                                <mat-option [value]="user.id">{{ user.fullName }}</mat-option>
                              }
                            </mat-select>
                            <mat-hint>Select one or more users</mat-hint>
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
                            <input matInput type="email" [(ngModel)]="approver.email">
                            <mat-hint>For email notifications</mat-hint>
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
      grid-template-columns: 250px 1fr;
      gap: 1rem;
    }

    .field-palette {
      position: sticky;
      top: 1rem;
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
  `]
})
export class WorkflowBuilderComponent implements OnInit {
  isEdit = false;
  loading = false;
  workflowId: string | null = null;
  formId: string | null = null;  // Track the main form ID

  basicForm: FormGroup;
  fields: any[] = [];
  fieldGroups: any[] = [];
  approvers: any[] = [];

  workflowTypes: any[] = [];
  users: User[] = [];
  roles: any[] = [];

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

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private userService: UserService,
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
      isActive: [true],
      commentsMandatory: [false],
      commentsMandatoryOnReject: [true],
      commentsMandatoryOnEscalate: [true]
    });
  }

  ngOnInit() {
    this.loadWorkflowTypes();
    this.loadUsers();
    this.loadRoles();

    this.workflowId = this.route.snapshot.paramMap.get('id');
    if (this.workflowId && this.workflowId !== 'new') {
      this.isEdit = true;
      this.loadWorkflow();
    }
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

  loadWorkflow() {
    if (!this.workflowId) return;
    this.workflowService.getWorkflow(this.workflowId).subscribe(res => {
      if (res.success) {
        const workflow = res.data;
        this.basicForm.patchValue({
          name: workflow.name,
          code: workflow.code,
          description: workflow.description,
          icon: workflow.icon,
          workflowTypeId: workflow.workflowType?.id,
          active: workflow.active,
          requireAttachments: workflow.requireAttachments,
          requireComments: workflow.requireComments
        });

        if (workflow.forms?.[0]) {
          this.formId = workflow.forms[0].id;  // Store the form ID for updates
          this.fields = workflow.forms[0].fields?.map((f: any) => ({
            ...f,
            // Map backend property names to frontend property names
            type: f.fieldType || f.type,
            required: f.isMandatory ?? f.required ?? false,
            readOnly: f.isReadonly ?? f.readOnly ?? false,
            hidden: f.isHidden ?? f.hidden ?? false,
            optionsText: f.options?.map((o: any) => o.value).join('\n') || ''
          })) || [];
          this.fieldGroups = workflow.forms[0].fieldGroups || [];
        }

        this.approvers = workflow.approvers || [];
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
      required: false,
      readOnly: false,
      hidden: false,
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

  addApprover() {
    const approver = {
      level: this.approvers.length + 1,
      label: '',
      approverType: 'USER',
      approverIds: [] as string[],
      roleId: null,
      email: '',
      amountLimit: null,
      canEscalate: true,
      requireComment: false,
      emailNotification: true
    };
    this.approvers.push(approver);
  }

  removeApprover(index: number) {
    this.approvers.splice(index, 1);
    this.approvers.forEach((a, i) => a.level = i + 1);
  }

  dropApprover(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.approvers, event.previousIndex, event.currentIndex);
    this.approvers.forEach((a, i) => a.level = i + 1);
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
      isMandatory: f.required ?? f.isMandatory ?? false,
      isReadonly: f.readOnly ?? f.isReadonly ?? false,
      isHidden: f.hidden ?? f.isHidden ?? false,
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
