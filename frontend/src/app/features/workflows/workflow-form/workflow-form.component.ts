import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow, WorkflowField, FieldGroup } from '@core/models/workflow.model';

@Component({
  selector: 'app-workflow-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="workflow-form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>{{ workflow?.name }}</h1>
          <p class="subtitle">New Submission</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading form...</p>
        </div>
      } @else if (workflow) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Ungrouped Fields -->
          @if (getUngroupedFields().length > 0) {
            <mat-card class="form-card">
              <mat-card-content>
                <div class="fields-grid">
                  @for (field of getUngroupedFields(); track field.id) {
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                      @switch (field.type) {
                        @case ('TEXT') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('TEXTAREA') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <textarea matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''"
                                      rows="4"></textarea>
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('NUMBER') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('CURRENCY') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            <span matPrefix>$&nbsp;</span>
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('EMAIL') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="email" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                            @if (form.get(field.name)?.hasError('email')) {
                              <mat-error>Please enter a valid email</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('PHONE') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="tel" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('DATE') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput [matDatepicker]="picker" [formControlName]="field.name">
                            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                            <mat-datepicker #picker></mat-datepicker>
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('SELECT') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                              @for (option of field.options; track option.value) {
                                <mat-option [value]="option.value">{{ option.label }}</mat-option>
                              }
                            </mat-select>
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('RADIO') {
                          <div class="radio-field">
                            <label class="field-label">{{ field.label }} @if (field.required) { <span class="required">*</span> }</label>
                            <mat-radio-group [formControlName]="field.name">
                              @for (option of field.options; track option.value) {
                                <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
                              }
                            </mat-radio-group>
                          </div>
                        }
                        @case ('CHECKBOX') {
                          <mat-checkbox [formControlName]="field.name">{{ field.label }}</mat-checkbox>
                        }
                        @case ('FILE') {
                          <div class="file-field">
                            <label class="field-label">{{ field.label }} @if (field.required) { <span class="required">*</span> }</label>
                            <input type="file" (change)="onFileSelect($event, field.name)" [multiple]="field.multiple">
                            @if (selectedFiles[field.name] && selectedFiles[field.name].length > 0) {
                              <div class="file-list">
                                @for (file of selectedFiles[field.name]; track file.name) {
                                  <mat-chip>{{ file.name }}</mat-chip>
                                }
                              </div>
                            }
                          </div>
                        }
                        @case ('URL') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="url" [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @default {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                          </mat-form-field>
                        }
                      }
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Grouped Fields -->
          @for (group of fieldGroups; track group.id) {
            <mat-card class="form-card group-card">
              <mat-expansion-panel [expanded]="!group.collapsed" [hideToggle]="!group.collapsible">
                <mat-expansion-panel-header>
                  <mat-panel-title>{{ group.title }}</mat-panel-title>
                  @if (group.description) {
                    <mat-panel-description>{{ group.description }}</mat-panel-description>
                  }
                </mat-expansion-panel-header>

                <div class="fields-grid">
                  @for (field of getFieldsInGroup(group.id); track field.id) {
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                      @switch (field.type) {
                        @case ('TEXT') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''">
                            @if (form.get(field.name)?.hasError('required')) {
                              <mat-error>{{ field.label }} is required</mat-error>
                            }
                          </mat-form-field>
                        }
                        @case ('TEXTAREA') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <textarea matInput [formControlName]="field.name" rows="4"></textarea>
                          </mat-form-field>
                        }
                        @case ('NUMBER') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput type="number" [formControlName]="field.name">
                          </mat-form-field>
                        }
                        @case ('SELECT') {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <mat-select [formControlName]="field.name">
                              @for (option of field.options; track option.value) {
                                <mat-option [value]="option.value">{{ option.label }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        }
                        @default {
                          <mat-form-field appearance="outline" class="full-width">
                            <mat-label>{{ field.label }}</mat-label>
                            <input matInput [formControlName]="field.name">
                          </mat-form-field>
                        }
                      }
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            </mat-card>
          }

          <!-- Attachments -->
          @if (workflow.requireAttachments) {
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>Attachments</mat-card-title>
                <mat-card-subtitle>Upload supporting documents</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="attachment-area">
                  <input type="file" #fileInput (change)="onAttachmentSelect($event)" multiple hidden>
                  <button mat-stroked-button type="button" (click)="fileInput.click()">
                    <mat-icon>attach_file</mat-icon>
                    Add Attachments
                  </button>
                  @if (attachments.length > 0) {
                    <div class="attachment-list">
                      @for (file of attachments; track file.name; let i = $index) {
                        <div class="attachment-item">
                          <mat-icon>description</mat-icon>
                          <span>{{ file.name }}</span>
                          <span class="size">({{ formatFileSize(file.size) }})</span>
                          <button mat-icon-button (click)="removeAttachment(i)">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Comments -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Additional Comments</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Comments</mat-label>
                <textarea matInput formControlName="comments" rows="3"
                          placeholder="Add any additional information or comments"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="form-actions">
            <button mat-button type="button" (click)="goBack()">Cancel</button>
            <button mat-stroked-button type="button" (click)="saveDraft()" [disabled]="submitting">
              Save Draft
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="submitting">
              @if (submitting) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Submit for Approval
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .workflow-form-container {
      padding: 1rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header h1 { margin: 0; }

    .subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #666;
    }

    .form-card {
      margin-bottom: 1rem;
    }

    .group-card {
      padding: 0;
    }

    .group-card mat-expansion-panel {
      box-shadow: none;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 1rem 0;
    }

    .field-wrapper {
      min-width: 0;
    }

    .full-width {
      width: 100%;
    }

    .field-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .required {
      color: #f44336;
    }

    .radio-field mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-field {
      padding: 0.5rem 0;
    }

    .file-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .attachment-area {
      padding: 1rem;
      border: 2px dashed #ddd;
      border-radius: 4px;
      text-align: center;
    }

    .attachment-list {
      margin-top: 1rem;
      text-align: left;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .attachment-item span {
      flex: 1;
    }

    .attachment-item .size {
      flex: 0;
      color: #666;
      font-size: 0.75rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  `]
})
export class WorkflowFormComponent implements OnInit {
  workflow: Workflow | null = null;
  form!: FormGroup;
  loading = true;
  submitting = false;
  workflowCode = '';

  fields: WorkflowField[] = [];
  fieldGroups: FieldGroup[] = [];
  selectedFiles: Record<string, File[]> = {};
  attachments: File[] = [];

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.workflowCode = this.route.snapshot.paramMap.get('workflowCode') || '';
    this.loadWorkflow();
  }

  loadWorkflow() {
    this.workflowService.getWorkflowByCode(this.workflowCode).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.workflow = res.data;
          this.initializeForm();
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load workflow', 'Close', { duration: 3000 });
      }
    });
  }

  initializeForm() {
    if (!this.workflow?.forms?.[0]) return;

    const mainForm = this.workflow.forms[0];
    this.fields = mainForm.fields || [];
    this.fieldGroups = mainForm.fieldGroups || [];

    const formControls: Record<string, any> = {
      comments: ['']
    };

    this.fields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'EMAIL') {
        validators.push(Validators.email);
      }

      let defaultValue: any = field.defaultValue || '';
      if (field.type === 'CHECKBOX') {
        defaultValue = false;
      } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
        defaultValue = field.defaultValue ? Number(field.defaultValue) : null;
      } else if ((field.type === 'DATE' || field.type === 'DATETIME') && field.defaultValue === 'TODAY') {
        defaultValue = new Date();
      }

      formControls[field.name] = [defaultValue, validators];
    });

    this.form = this.fb.group(formControls);
  }

  getUngroupedFields(): WorkflowField[] {
    return this.fields.filter(f => !f.fieldGroupId && !f.hidden);
  }

  getFieldsInGroup(groupId: string): WorkflowField[] {
    return this.fields.filter(f => f.fieldGroupId === groupId && !f.hidden);
  }

  onFileSelect(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles[fieldName] = Array.from(input.files);
    }
  }

  onAttachmentSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.attachments.push(...Array.from(input.files));
    }
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  goBack() {
    this.router.navigate(['/workflows', this.workflowCode, 'instances']);
  }

  saveDraft() {
    this.submitForm(true);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    this.submitForm(false);
  }

  submitForm(isDraft: boolean) {
    this.submitting = true;

    const formData = new FormData();
    formData.append('workflowCode', this.workflowCode);
    formData.append('isDraft', isDraft.toString());
    formData.append('comments', this.form.value.comments || '');

    const fieldValues: Record<string, any> = {};
    this.fields.forEach(field => {
      fieldValues[field.name] = this.form.value[field.name];
    });
    formData.append('fieldValues', JSON.stringify(fieldValues));

    this.attachments.forEach((file, index) => {
      formData.append(`attachments`, file);
    });

    Object.keys(this.selectedFiles).forEach(fieldName => {
      this.selectedFiles[fieldName].forEach(file => {
        formData.append(`files_${fieldName}`, file);
      });
    });

    this.workflowService.submitInstance(formData).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.snackBar.open(
            isDraft ? 'Draft saved successfully' : 'Submission created successfully',
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/workflows', this.workflowCode, 'instances']);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Submission failed', 'Close', { duration: 3000 });
      }
    });
  }
}
