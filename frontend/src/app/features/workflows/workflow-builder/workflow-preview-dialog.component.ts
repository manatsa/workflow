import { Component, Inject, ChangeDetectorRef, AfterViewInit, OnInit, NgZone, ApplicationRef } from '@angular/core';
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
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';

export interface PreviewDialogData {
  workflowName: string;
  workflowDescription: string;
  workflowIcon: string;
  fields: any[];
  fieldGroups: any[];
  screens: any[];
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
    MatChipsModule,
    MatStepperModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatSliderModule
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
            <!-- Multi-Step Form (with screens) -->
            @if (hasMultipleScreens()) {
              <!-- Step Indicator -->
              <div class="stepper-container">
                <div class="step-indicator">
                  @for (screen of sortedScreens; track screen.id; let i = $index) {
                    <div class="step" [class.active]="i === currentScreenIndex" [class.completed]="i < currentScreenIndex" (click)="goToScreen(i)">
                      <div class="step-number">
                        @if (i < currentScreenIndex) {
                          <mat-icon>check</mat-icon>
                        } @else {
                          {{ i + 1 }}
                        }
                      </div>
                      <span class="step-label">{{ screen.title || 'Step ' + (i + 1) }}</span>
                    </div>
                    @if (i < sortedScreens.length - 1) {
                      <div class="step-connector" [class.completed]="i < currentScreenIndex"></div>
                    }
                  }
                </div>
              </div>

              <!-- Current Screen Content -->
              @if (currentScreen) {
                <div class="screen-header">
                  <mat-icon>{{ currentScreen.icon || 'view_carousel' }}</mat-icon>
                  <div>
                    <h3>{{ currentScreen.title || 'Step ' + (currentScreenIndex + 1) }}</h3>
                    @if (currentScreen.description) {
                      <p class="screen-description">{{ currentScreen.description }}</p>
                    }
                  </div>
                </div>

                <!-- Ungrouped Fields on Current Screen -->
                @if (getUngroupedFieldsOnScreen(currentScreen.id).length > 0) {
                  <mat-card class="form-card">
                    <mat-card-content>
                      <div class="fields-grid">
                        @for (field of getUngroupedFieldsOnScreen(currentScreen.id); track field.name) {
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

                <!-- Grouped Fields on Current Screen -->
                @for (group of getGroupsOnScreen(currentScreen.id); track group.id) {
                  @if (getFieldsInGroupOnScreen(group.id, currentScreen.id).length > 0) {
                    <mat-card class="form-card group-card">
                      <mat-expansion-panel
                        [expanded]="isPanelExpanded(group.id)"
                        (opened)="onPanelOpened(group.id)"
                        (closed)="onPanelClosed(group.id)"
                        [disabled]="!group.collapsible">
                        <mat-expansion-panel-header [collapsedHeight]="'48px'" [expandedHeight]="'48px'">
                          <mat-panel-title>{{ group.title || group.name }}</mat-panel-title>
                          @if (group.description) {
                            <mat-panel-description>{{ group.description }}</mat-panel-description>
                          }
                        </mat-expansion-panel-header>

                        <div class="fields-grid">
                          @for (field of getFieldsInGroupOnScreen(group.id, currentScreen.id); track field.name) {
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
              }

              <!-- Screen Navigation -->
              <div class="screen-navigation">
                <button mat-button (click)="prevScreen()" [disabled]="currentScreenIndex === 0">
                  <mat-icon>chevron_left</mat-icon>
                  Previous
                </button>
                <span class="screen-counter">Step {{ currentScreenIndex + 1 }} of {{ sortedScreens.length }}</span>
                @if (currentScreenIndex < sortedScreens.length - 1) {
                  <button mat-raised-button color="primary" (click)="nextScreen()">
                    Next
                    <mat-icon iconPositionEnd>chevron_right</mat-icon>
                  </button>
                } @else {
                  <!-- On last screen, show submit button -->
                  <button mat-raised-button color="primary" type="button" disabled>
                    <mat-icon>send</mat-icon>
                    Submit for Approval
                  </button>
                }
              </div>
            } @else {
              <!-- Single Page Form (no screens or only 1 screen) -->
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
              @for (group of data.fieldGroups; track group.id) {
                @if (getFieldsInGroup(group.id).length > 0) {
                  <mat-card class="form-card group-card">
                    <mat-expansion-panel
                      [expanded]="isPanelExpanded(group.id)"
                      (opened)="onPanelOpened(group.id)"
                      (closed)="onPanelClosed(group.id)"
                      [disabled]="!group.collapsible">
                      <mat-expansion-panel-header [collapsedHeight]="'48px'" [expandedHeight]="'48px'">
                        <mat-panel-title>{{ group.title || group.name }}</mat-panel-title>
                        @if (group.description) {
                          <mat-panel-description>{{ group.description }}</mat-panel-description>
                        }
                      </mat-expansion-panel-header>

                      <div class="fields-grid">
                        @for (field of getFieldsInGroup(group.id); track field.name) {
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
            }
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
            <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
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
            <div class="checkbox-options" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
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
        @case ('TOGGLE') {
          <div class="toggle-field">
            <mat-slide-toggle [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
              {{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }
            </mat-slide-toggle>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('YES_NO') {
          <div class="yes-no-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <mat-button-toggle-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
              <mat-button-toggle value="yes">Yes</mat-button-toggle>
              <mat-button-toggle value="no">No</mat-button-toggle>
            </mat-button-toggle-group>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('RATING') {
          <div class="rating-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="star-rating">
              @for (star of getStarArray(field); track star) {
                <mat-icon (click)="setRating(field, star)" [class.filled]="getRatingValue(field) >= star" [class.readonly]="isFieldReadonly(field)">
                  {{ getRatingValue(field) >= star ? 'star' : 'star_border' }}
                </mat-icon>
              }
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('TIME') {
          <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
            <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
            <input matInput type="time" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
            @if (field.helpText) {
              <mat-hint>{{ field.helpText }}</mat-hint>
            }
          </mat-form-field>
        }
        @case ('SLIDER') {
          <div class="slider-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }}: {{ previewForm.get(field.name)?.value || 0 }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <mat-slider [min]="field.sliderMin || 0" [max]="field.sliderMax || 100" [step]="field.sliderStep || 1" [discrete]="true" [disabled]="isFieldReadonly(field)">
              <input matSliderThumb [formControlName]="field.name">
            </mat-slider>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('COLOR') {
          <div class="color-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <input type="color" [formControlName]="field.name" class="color-input" [disabled]="isFieldReadonly(field)">
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('IMAGE') {
          <div class="image-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="placeholder-box">
              <mat-icon>image</mat-icon>
              <p>Image Upload Field</p>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('SIGNATURE') {
          <div class="signature-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="signature-pad-preview">
              <div class="signature-canvas-preview">
                <span class="signature-placeholder-text">Sign here</span>
              </div>
              <button mat-icon-button type="button" class="clear-btn" [disabled]="isFieldReadonly(field)">
                <mat-icon>clear</mat-icon>
              </button>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('RICH_TEXT') {
          <div class="rich-text-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="rich-text-preview">
              <div class="rich-text-toolbar-preview">
                <button mat-icon-button type="button" disabled><mat-icon>format_bold</mat-icon></button>
                <button mat-icon-button type="button" disabled><mat-icon>format_italic</mat-icon></button>
                <button mat-icon-button type="button" disabled><mat-icon>format_underlined</mat-icon></button>
                <span class="toolbar-divider"></span>
                <button mat-icon-button type="button" disabled><mat-icon>format_list_bulleted</mat-icon></button>
                <button mat-icon-button type="button" disabled><mat-icon>format_list_numbered</mat-icon></button>
              </div>
              <div class="rich-text-content-preview" contenteditable="false">
                <p>Rich text content area...</p>
              </div>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('ICON') {
          <div class="icon-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="icon-selector-preview">
              <div class="selected-icon-preview">
                <mat-icon>help_outline</mat-icon>
              </div>
              <span class="icon-hint">Click to select icon</span>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('BARCODE') {
          <div class="barcode-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="barcode-input-preview">
              <mat-form-field appearance="outline" class="barcode-form-field">
                <mat-label>Barcode/QR Code</mat-label>
                <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || 'Enter or scan code'" [readonly]="isFieldReadonly(field)">
                <button mat-icon-button matSuffix type="button" [disabled]="isFieldReadonly(field)">
                  <mat-icon>qr_code_scanner</mat-icon>
                </button>
              </mat-form-field>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('LOCATION') {
          <div class="location-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="location-inputs-preview">
              <mat-form-field appearance="outline" class="location-form-field">
                <mat-label>Latitude</mat-label>
                <input matInput type="number" placeholder="0.000000" [readonly]="isFieldReadonly(field)">
              </mat-form-field>
              <mat-form-field appearance="outline" class="location-form-field">
                <mat-label>Longitude</mat-label>
                <input matInput type="number" placeholder="0.000000" [readonly]="isFieldReadonly(field)">
              </mat-form-field>
              <button mat-icon-button type="button" [disabled]="isFieldReadonly(field)">
                <mat-icon>my_location</mat-icon>
              </button>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('TABLE') {
          <div class="table-field" [class.readonly-field]="isFieldReadonly(field)">
            <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
            <div class="table-preview">
              <table class="data-table-preview">
                <thead>
                  <tr>
                    <th>Column 1</th>
                    <th>Column 2</th>
                    <th>Column 3</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" class="empty-table-preview">Click "Add Row" to add data</td>
                  </tr>
                </tbody>
              </table>
              <button mat-stroked-button type="button" class="add-row-btn" [disabled]="isFieldReadonly(field)">
                <mat-icon>add</mat-icon> Add Row
              </button>
            </div>
            @if (field.helpText) {
              <p class="hint-text">{{ field.helpText }}</p>
            }
          </div>
        }
        @case ('SQL_OBJECT') {
          <!-- Render based on viewType -->
          @switch (field.viewType) {
            @case ('SELECT') {
              <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
                <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
                <mat-select [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                  @for (option of field.options || []; track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
                @if (field.helpText) {
                  <mat-hint>{{ field.helpText }}</mat-hint>
                }
              </mat-form-field>
            }
            @case ('MULTISELECT') {
              <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
                <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
                <mat-select [formControlName]="field.name" [disabled]="isFieldReadonly(field)" multiple>
                  @for (option of field.options || []; track option.value) {
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
                <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
                <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                  @for (option of field.options || []; track option.value) {
                    <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
                  }
                </mat-radio-group>
              </div>
            }
            @case ('CHECKBOX_GROUP') {
              <div class="checkbox-group-field" [class.readonly-field]="isFieldReadonly(field)">
                <label class="field-label">{{ field.label }} @if (field.isMandatory) { <span class="required">*</span> }</label>
                <div class="checkbox-group" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                  @for (option of field.options || []; track option.value) {
                    <mat-checkbox [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-checkbox>
                  }
                </div>
              </div>
            }
            @default {
              <mat-form-field appearance="outline" class="full-width" [class.readonly-field]="isFieldReadonly(field)">
                <mat-label>{{ field.label }} @if (field.isMandatory) { * } @if (isFieldReadonly(field)) { (Read Only) }</mat-label>
                <mat-select [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                  @for (option of field.options || []; track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
                @if (field.helpText) {
                  <mat-hint>{{ field.helpText }}</mat-hint>
                }
              </mat-form-field>
            }
          }
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
    :host {
      display: block;
      overflow-x: hidden;
    }

    .preview-dialog {
      min-width: 850px;
      max-width: 1000px;
      overflow-x: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      margin: 0 -24px 0 -24px;
      min-height: 70px;
      flex-wrap: nowrap;
      gap: 1.5rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .header-content > div {
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .workflow-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      opacity: 0.9;
      flex-shrink: 0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.35rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dialog-header .description {
      margin: 0.25rem 0 0 0;
      opacity: 0.9;
      font-size: 0.8rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.25);
      padding: 0.5rem 1.25rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex-shrink: 0;
      margin-right: 0.5rem;
    }

    .preview-badge mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-dialog-content {
      padding: 1.5rem !important;
      margin-top: 1.5rem;
      max-height: 60vh;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      box-sizing: border-box;
    }

    mat-dialog-content::-webkit-scrollbar {
      display: none;
    }

    mat-dialog-content {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .form-card {
      margin-bottom: 1rem;
      overflow-x: hidden;
      overflow-y: visible;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      max-width: 100%;
      overflow-x: hidden;
      overflow-y: visible;
      padding-top: 0.5rem;
    }

    .field-wrapper {
      min-width: 0;
      max-width: 100%;
      overflow: visible;
    }

    .full-width {
      width: 100%;
      max-width: 100%;
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

    mat-radio-group.horizontal-layout {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .checkbox-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-options.horizontal-layout {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem;
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

    /* New field type styles */
    .toggle-field {
      padding: 0.5rem 0;
    }

    .yes-no-field {
      padding: 0.5rem 0;
    }

    .yes-no-field .field-label {
      display: block;
      margin-bottom: 0.5rem;
    }

    .rating-field {
      padding: 0.5rem 0;
    }

    .star-rating {
      display: flex;
      gap: 0.25rem;
    }

    .star-rating mat-icon {
      cursor: pointer;
      color: #ffc107;
      font-size: 28px;
      width: 28px;
      height: 28px;
      transition: transform 0.1s ease;
    }

    .star-rating mat-icon:hover:not(.readonly) {
      transform: scale(1.1);
    }

    .star-rating mat-icon.readonly {
      cursor: default;
    }

    .star-rating mat-icon.filled {
      color: #ffc107;
    }

    .slider-field {
      padding: 0.5rem 0;
    }

    .slider-field mat-slider {
      width: 100%;
    }

    .color-field {
      padding: 0.5rem 0;
    }

    .color-field .color-input {
      width: 60px;
      height: 40px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      padding: 4px;
    }

    .image-field, .signature-field, .rich-text-field, .icon-field, .barcode-field, .location-field, .table-field {
      padding: 0.5rem 0;
    }

    .placeholder-box {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      background: #fafafa;
      color: #999;
    }

    .placeholder-box mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .placeholder-box p {
      margin: 0.5rem 0 0 0;
    }

    /* Signature Field Preview */
    .signature-pad-preview {
      position: relative;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
    }

    .signature-canvas-preview {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .signature-placeholder-text {
      color: #ccc;
      font-style: italic;
    }

    .signature-pad-preview .clear-btn {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    /* Rich Text Field Preview */
    .rich-text-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .rich-text-toolbar-preview {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }

    .rich-text-toolbar-preview button {
      min-width: 32px;
      width: 32px;
      height: 32px;
    }

    .rich-text-toolbar-preview .toolbar-divider {
      width: 1px;
      background: #ddd;
      margin: 0 0.25rem;
    }

    .rich-text-content-preview {
      min-height: 80px;
      padding: 0.75rem;
      color: #999;
    }

    /* Icon Field Preview */
    .icon-selector-preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .selected-icon-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: #fff;
    }

    .selected-icon-preview mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #666;
    }

    .icon-hint {
      color: #999;
      font-size: 0.875rem;
    }

    /* Barcode Field Preview */
    .barcode-input-preview {
      display: flex;
      align-items: flex-start;
    }

    .barcode-form-field {
      flex: 1;
    }

    /* Location Field Preview */
    .location-inputs-preview {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .location-form-field {
      flex: 1;
    }

    /* Table Field Preview */
    .table-preview {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .data-table-preview {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table-preview th {
      background: #f5f5f5;
      padding: 0.5rem;
      text-align: left;
      font-weight: 500;
      font-size: 0.875rem;
      border-bottom: 1px solid #ddd;
    }

    .data-table-preview .empty-table-preview {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-style: italic;
    }

    .add-row-btn {
      margin: 0.5rem;
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

    /* Multi-Step Stepper Styles */
    .stepper-container {
      margin-bottom: 1.5rem;
      padding: 0 1rem;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      padding: 0.5rem;
      min-width: 80px;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e0e0;
      color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.3s ease;
    }

    .step.active .step-number {
      background: #1976d2;
      color: white;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
    }

    .step.completed .step-number {
      background: #4caf50;
      color: white;
    }

    .step.completed .step-number mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .step-label {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      text-align: center;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .step.active .step-label {
      color: #1976d2;
      font-weight: 500;
    }

    .step.completed .step-label {
      color: #4caf50;
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: #e0e0e0;
      margin: 0 0.25rem;
      min-width: 40px;
      max-width: 80px;
      margin-top: -20px;
    }

    .step-connector.completed {
      background: #4caf50;
    }

    .screen-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .screen-header mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #1976d2;
    }

    .screen-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }

    .screen-description {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #666;
    }

    .screen-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-top: 1px solid #eee;
      margin-top: 1rem;
    }

    .screen-counter {
      color: #666;
      font-size: 0.875rem;
    }

    /* Dark mode support */
    :host-context(.dark-mode) .preview-header {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
    }

    :host-context(.dark-mode) .preview-content {
      background: #1e1e1e;
    }

    :host-context(.dark-mode) .preview-workflow-title,
    :host-context(.dark-mode) .preview-section-title,
    :host-context(.dark-mode) .screen-title {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .preview-workflow-desc,
    :host-context(.dark-mode) .preview-section-hint,
    :host-context(.dark-mode) .field-hint,
    :host-context(.dark-mode) .screen-description,
    :host-context(.dark-mode) .screen-counter {
      color: #aaa;
    }

    :host-context(.dark-mode) .preview-field-group {
      background: #2d2d2d;
      border-color: #444;
    }

    :host-context(.dark-mode) .preview-group-header {
      background: #333;
      border-color: #444;
    }

    :host-context(.dark-mode) .preview-group-title {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .preview-group-desc {
      color: #aaa;
    }

    :host-context(.dark-mode) .field-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .required-marker {
      color: #ff6b6b;
    }

    :host-context(.dark-mode) .file-upload-zone {
      border-color: #444;
      background: #2d2d2d;
      color: #aaa;
    }

    :host-context(.dark-mode) .star-rating mat-icon {
      color: #ffc107;
    }

    :host-context(.dark-mode) .color-preview {
      border-color: #444;
    }

    :host-context(.dark-mode) .slider-field label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .signature-pad {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .signature-pad p {
      color: #888;
    }

    :host-context(.dark-mode) .image-preview-area {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .image-preview-area p {
      color: #888;
    }

    :host-context(.dark-mode) .table-placeholder {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .table-placeholder p {
      color: #888;
    }

    :host-context(.dark-mode) .table-field table {
      border-color: #444;
    }

    :host-context(.dark-mode) .table-field th {
      background: #333;
      border-color: #444;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .table-field td {
      border-color: #444;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .table-field .empty-cell {
      color: #666;
    }

    :host-context(.dark-mode) .icon-display {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .icon-name {
      color: #aaa;
    }

    :host-context(.dark-mode) .preview-divider mat-divider {
      border-color: #444;
    }

    :host-context(.dark-mode) .preview-label-field span {
      color: #aaa;
    }

    :host-context(.dark-mode) .screen-navigation {
      border-color: #444;
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

    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    :host-context(.dark-mode) ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: #555 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-form-field-hint {
      color: #888 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-expansion-panel {
      background: #2d2d2d !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-expansion-panel-header-title {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-radio-button .mdc-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-checkbox .mdc-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-mdc-slide-toggle .mdc-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) ::ng-deep .mat-button-toggle-group {
      border-color: #444;
    }

    :host-context(.dark-mode) ::ng-deep .mat-button-toggle {
      color: #e0e0e0;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) ::ng-deep .mat-button-toggle-checked {
      background: #1976d2;
      color: white;
    }
  `]
})
export class WorkflowPreviewDialogComponent implements OnInit, AfterViewInit {
  previewForm: FormGroup;
  processedFields: any[] = [];
  isReady = false;
  currentScreenIndex = 0;
  sortedScreens: any[] = [];
  panelExpandedState: Map<string, boolean> = new Map();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WorkflowPreviewDialogComponent>,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private appRef: ApplicationRef,
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData
  ) {
    this.previewForm = this.fb.group({});
  }

  ngOnInit() {
    // Process fields and build form on init
    this.processedFields = this.processFields(this.data.fields || []);
    this.previewForm = this.buildForm();

    // Process screens - sort by displayOrder
    this.sortedScreens = [...(this.data.screens || [])].sort((a, b) =>
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    // Initialize panel expanded states from group data
    (this.data.fieldGroups || []).forEach(group => {
      // Default to expanded unless explicitly collapsed
      this.panelExpandedState.set(group.id, !group.collapsed);
    });

    // Force immediate change detection
    this.cdr.detectChanges();
  }

  // Check if a panel is expanded
  isPanelExpanded(groupId: string): boolean {
    return this.panelExpandedState.get(groupId) !== false;
  }

  // Handle panel opened event
  onPanelOpened(groupId: string): void {
    this.panelExpandedState.set(groupId, true);
    this.cdr.detectChanges();
  }

  // Handle panel closed event
  onPanelClosed(groupId: string): void {
    this.panelExpandedState.set(groupId, false);
    this.cdr.detectChanges();
  }

  get currentScreen(): any {
    if (this.sortedScreens.length > 0 && this.currentScreenIndex < this.sortedScreens.length) {
      return this.sortedScreens[this.currentScreenIndex];
    }
    return null;
  }

  hasMultipleScreens(): boolean {
    return this.sortedScreens.length >= 2;
  }

  nextScreen(): void {
    if (this.currentScreenIndex < this.sortedScreens.length - 1) {
      this.currentScreenIndex++;
      this.cdr.detectChanges();
    }
  }

  prevScreen(): void {
    if (this.currentScreenIndex > 0) {
      this.currentScreenIndex--;
      this.cdr.detectChanges();
    }
  }

  goToScreen(index: number): void {
    if (index >= 0 && index < this.sortedScreens.length) {
      this.currentScreenIndex = index;
      this.cdr.detectChanges();
    }
  }

  getUngroupedFieldsOnScreen(screenId: string): any[] {
    return this.processedFields.filter(f => !f.fieldGroupId && f.screenId === screenId);
  }

  getGroupsOnScreen(screenId: string): any[] {
    return (this.data.fieldGroups || []).filter(g => g.screenId === screenId);
  }

  // Get fields in a group that belong to a specific screen
  // Fields inherit screen from their group, or can have their own screenId
  getFieldsInGroupOnScreen(groupId: string, screenId: string): any[] {
    return this.processedFields.filter(f =>
      f.fieldGroupId === groupId &&
      (f.screenId === screenId || !f.screenId)  // Field is on this screen OR inherits from group
    );
  }

  ngAfterViewInit() {
    // Use NgZone to ensure we're in Angular's zone for change detection
    this.ngZone.run(() => {
      // First cycle - immediate
      this.isReady = true;
      this.cdr.detectChanges();

      // Second cycle - short delay
      setTimeout(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      }, 0);

      // Third cycle - medium delay for complex fields
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);

      // Fourth cycle - longer delay as fallback
      setTimeout(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      }, 250);
    });
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
    return this.processedFields.filter(f => !f.fieldGroupId);
  }

  getFieldsInGroup(groupId: string): any[] {
    return this.processedFields.filter(f => f.fieldGroupId === groupId);
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

  // New field type helper methods
  getStarArray(field: any): number[] {
    const max = field.ratingMax || 5;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getRatingValue(field: any): number {
    const value = this.previewForm.get(field.name)?.value;
    return value ? parseInt(value, 10) : 0;
  }

  setRating(field: any, rating: number): void {
    if (!this.isFieldReadonly(field)) {
      this.previewForm.get(field.name)?.setValue(rating);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
