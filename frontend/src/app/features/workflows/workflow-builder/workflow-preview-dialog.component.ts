import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

export interface PreviewDialogData {
  workflowName: string;
  workflowDescription: string;
  workflowIcon: string;
  fields: any[];
  fieldGroups: any[];
}

@Component({
  selector: 'app-workflow-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatChipsModule
  ],
  template: `
    <div class="preview-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon class="workflow-icon">{{ data.workflowIcon || 'description' }}</mat-icon>
          <div>
            <h2>{{ data.workflowName || 'Untitled Workflow' }}</h2>
            <p class="description">{{ data.workflowDescription || 'No description' }}</p>
          </div>
        </div>
        <div class="preview-badge">
          <mat-icon>visibility</mat-icon>
          Preview Mode
        </div>
      </div>

      <mat-dialog-content>
        @if (processedFields.length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No fields have been added to this workflow yet.</p>
            <p class="hint">Add fields in the "Form Fields" tab to see them here.</p>
          </div>
        } @else {
          <form [formGroup]="previewForm">
            <!-- Ungrouped Fields -->
            @if (getUngroupedFields().length > 0) {
              <mat-card class="form-card">
                <mat-card-content>
                  <div class="fields-grid">
                    @for (field of getUngroupedFields(); track field.name) {
                      <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                        <ng-container [ngTemplateOutlet]="fieldTemplate"
                                      [ngTemplateOutletContext]="{field: field}">
                        </ng-container>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Grouped Fields -->
            @for (group of data.fieldGroups; track group.name) {
              @if (getFieldsInGroup(group.name).length > 0) {
                <mat-card class="form-card group-card">
                  <mat-expansion-panel [expanded]="!group.collapsed" [hideToggle]="!group.collapsible">
                    <mat-expansion-panel-header>
                      <mat-panel-title>{{ group.title || group.name }}</mat-panel-title>
                      @if (group.description) {
                        <mat-panel-description>{{ group.description }}</mat-panel-description>
                      }
                    </mat-expansion-panel-header>

                    <div class="fields-grid">
                      @for (field of getFieldsInGroup(group.name); track field.name) {
                        <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                          <ng-container [ngTemplateOutlet]="fieldTemplate"
                                        [ngTemplateOutletContext]="{field: field}">
                          </ng-container>
                        </div>
                      }
                    </div>
                  </mat-expansion-panel>
                </mat-card>
              }
            }

            <!-- Comments Section -->
            <mat-card class="form-card">
              <mat-card-content>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Comments (Optional)</mat-label>
                  <textarea matInput rows="3" placeholder="Add any additional comments..."></textarea>
                </mat-form-field>
              </mat-card-content>
            </mat-card>

            <!-- Attachments Section -->
            <mat-card class="form-card">
              <mat-card-content>
                <div class="attachments-section">
                  <label class="field-label">Attachments (Optional)</label>
                  <div class="file-upload-area">
                    <mat-icon>cloud_upload</mat-icon>
                    <p>Drag and drop files here or click to browse</p>
                    <input type="file" multiple disabled>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Action Buttons Preview -->
            <div class="form-actions">
              <button mat-button type="button" disabled>
                <mat-icon>drafts</mat-icon>
                Save as Draft
              </button>
              <button mat-raised-button color="primary" type="button" disabled>
                <mat-icon>send</mat-icon>
                Submit for Approval
              </button>
            </div>
          </form>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Close Preview</button>
      </mat-dialog-actions>
    </div>

    <!-- Field Template -->
    <ng-template #fieldTemplate let-field="field">
      @switch (field.fieldType || field.type) {
        @case ('TEXT') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('TEXTAREA') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <textarea matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" rows="4" [readonly]="isFieldReadonly(field)"></textarea>
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('NUMBER') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('CURRENCY') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <span matPrefix>$&nbsp;</span>
            <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('EMAIL') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput type="email" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('PHONE') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput type="tel" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('DATE') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput [matDatepicker]="picker" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
            <mat-datepicker-toggle matIconSuffix [for]="picker" [disabled]="isFieldReadonly(field)"></mat-datepicker-toggle>
            <mat-datepicker #picker [disabled]="isFieldReadonly(field)"></mat-datepicker>
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('SELECT') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || 'Select an option'" [disabled]="isFieldReadonly(field)">
              @for (option of getFieldOptions(field); track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('RADIO') {
          <div class="radio-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> } @if (isFieldReadonly(field)) { <span class="readonly-badge">(Read Only)</span> }</label>
            <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
              @for (option of getFieldOptions(field); track option.value) {
                <mat-radio-button [value]="option.value" [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-radio-button>
              }
            </mat-radio-group>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('CHECKBOX') {
          <div class="checkbox-field" [class.readonly-field]="isFieldReadonly(field)">
            <mat-checkbox [formControlName]="field.name" [disabled]="isFieldReadonly(field)">{{ field.label }} @if (isFieldReadonly(field)) { (Read Only) }</mat-checkbox>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('CHECKBOX_GROUP') {
          <div class="checkbox-group-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> } @if (isFieldReadonly(field)) { <span class="readonly-badge">(Read Only)</span> }</label>
            <div class="checkbox-options">
              @for (option of getFieldOptions(field); track option.value) {
                <mat-checkbox [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-checkbox>
              }
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('FILE') {
          <div class="file-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> } @if (isFieldReadonly(field)) { <span class="readonly-badge">(Read Only)</span> }</label>
            <div class="file-input-wrapper">
              <button mat-stroked-button type="button" [disabled]="isFieldReadonly(field)">
                <mat-icon>attach_file</mat-icon>
                Choose File
              </button>
              <span class="file-hint">No file chosen</span>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('URL') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput type="url" [formControlName]="field.name" [placeholder]="field.placeholder || 'https://'" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @default {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
      }
    </ng-template>
  `,
  styles: [`
    .preview-dialog {
      min-width: 700px;
      max-width: 900px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      margin: -24px -24px 0 -24px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .workflow-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      opacity: 0.9;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .dialog-header .description {
      margin: 0.25rem 0 0 0;
      opacity: 0.9;
      font-size: 0.875rem;
    }

    .preview-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .preview-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-dialog-content {
      padding-top: 1.5rem !important;
      max-height: 60vh;
    }

    .form-card {
      margin-bottom: 1rem;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .field-wrapper {
      min-width: 0;
    }

    .full-width {
      width: 100%;
    }

    .radio-field, .checkbox-field, .checkbox-group-field, .file-field {
      padding: 0.5rem 0;
    }

    .field-label {
      display: block;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
    }

    .required {
      color: #f44336;
    }

    .hint-text {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      margin: 0.25rem 0 0 0;
    }

    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .file-input-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .file-hint {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
    }

    .attachments-section {
      padding: 0.5rem 0;
    }

    .file-upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      color: #666;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .file-upload-area mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #999;
    }

    .file-upload-area p {
      margin: 0.5rem 0 0 0;
    }

    .file-upload-area input {
      display: none;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid #eee;
      margin-top: 1rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 1rem 0 0 0;
    }

    .empty-state .hint {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #eee;
    }

    .group-card {
      mat-expansion-panel {
        box-shadow: none;
      }
    }

    .readonly-field {
      opacity: 0.7;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .readonly-badge {
      font-size: 0.75rem;
      color: #666;
      font-style: italic;
    }
  `]
})
export class WorkflowPreviewDialogComponent {
  previewForm: FormGroup;
  processedFields: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WorkflowPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData
  ) {
    this.processedFields = this.processFields(data.fields || []);
    this.previewForm = this.buildForm();
  }

  processFields(fields: any[]): any[] {
    return fields.map(f => {
      const options = f.optionsText?.split('\n')
        .filter((o: string) => o.trim())
        .map((value: string, index: number) => ({
          value: value.trim(),
          label: value.trim(),
          displayOrder: index
        })) || f.options || [];

      return {
        ...f,
        options
      };
    });
  }

  buildForm(): FormGroup {
    const group: any = {};
    this.processedFields.forEach(field => {
      const validators = [];
      if (field.isMandatory) {
        validators.push(Validators.required);
      }
      if (field.fieldType === 'EMAIL' || field.type === 'EMAIL') {
        validators.push(Validators.email);
      }
      group[field.name] = ['', validators];
    });
    return this.fb.group(group);
  }

  getUngroupedFields(): any[] {
    return this.processedFields.filter(f => !f.fieldGroupName);
  }

  getFieldsInGroup(groupName: string): any[] {
    return this.processedFields.filter(f => f.fieldGroupName === groupName);
  }

  getFieldOptions(field: any): any[] {
    if (field.options && Array.isArray(field.options)) {
      return field.options;
    }
    if (field.optionsText) {
      return field.optionsText.split('\n')
        .filter((o: string) => o.trim())
        .map((value: string) => ({ value: value.trim(), label: value.trim() }));
    }
    return [];
  }

  isFieldReadonly(field: any): boolean {
    return field.readOnly || field.isReadonly || false;
  }

  close() {
    this.dialogRef.close();
  }
}
