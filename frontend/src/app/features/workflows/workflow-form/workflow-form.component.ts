import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, merge, Observable, of } from 'rxjs';
import { debounceTime, map, startWith, switchMap, catchError } from 'rxjs/operators';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, ErrorStateMatcher } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { WorkflowService } from '@core/services/workflow.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { Workflow, WorkflowField, FieldGroup, Screen } from '@core/models/workflow.model';
import { User } from '@core/models/user.model';

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
    MatChipsModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatSliderModule
  ],
  template: `
    <div class="workflow-form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>{{ workflow?.name }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Edit Submission' : 'New Submission' }}</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading form...</p>
        </div>
      } @else if (workflow) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Multi-Step Progress Indicator -->
          @if (isMultiStep) {
            <div class="step-indicator">
              @for (screen of screens; track screen.id; let i = $index) {
                <div class="step" [class.active]="i === currentScreenIndex" [class.completed]="i < currentScreenIndex" (click)="goToScreen(i)">
                  <div class="step-circle">
                    @if (i < currentScreenIndex) {
                      <mat-icon>check</mat-icon>
                    } @else {
                      {{ i + 1 }}
                    }
                  </div>
                  <span class="step-label">{{ screen.title || 'Step ' + (i + 1) }}</span>
                </div>
                @if (i < screens.length - 1) {
                  <div class="step-connector" [class.completed]="i < currentScreenIndex"></div>
                }
              }
            </div>

            <!-- Screen Header -->
            @if (currentScreen) {
              <div class="screen-header">
                @if (currentScreen.icon) {
                  <mat-icon>{{ currentScreen.icon }}</mat-icon>
                }
                <div>
                  <h2>{{ currentScreen.title }}</h2>
                  @if (currentScreen.description) {
                    <p>{{ currentScreen.description }}</p>
                  }
                </div>
              </div>
            }
          }

          <!-- Ungrouped Fields -->
          @if (isMultiStep ? getUngroupedFieldsOnScreen().length > 0 : getUngroupedFields().length > 0) {
            <mat-card class="form-card">
              <mat-card-content>
                <div class="fields-grid">
                  @for (field of (isMultiStep ? getUngroupedFieldsOnScreen() : getUngroupedFields()); track field.id) {
                    @if (isFieldVisible(field)) {
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                      @switch (field.type) {
                        @case ('TEXT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TEXTAREA') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <textarea matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" rows="4" [readonly]="isFieldReadonly(field)"></textarea>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('NUMBER') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CURRENCY') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="number" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                              <span matPrefix>$&nbsp;</span>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('EMAIL') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="email" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('PHONE') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="tel" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('PASSWORD') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="password" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('DATE') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput [matDatepicker]="picker" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                              <mat-datepicker-toggle matIconSuffix [for]="picker" [disabled]="isFieldReadonly(field)"></mat-datepicker-toggle>
                              <mat-datepicker #picker [disabled]="isFieldReadonly(field)"></mat-datepicker>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('DATETIME') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="datetime-local" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SELECT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)">
                                @for (option of field.options; track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('MULTISELECT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple>
                                @for (option of field.options; track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RADIO') {
                          <div class="radio-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                              @for (option of field.options; track option.value) {
                                <mat-radio-button [value]="option.value" [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-radio-button>
                              }
                            </mat-radio-group>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CHECKBOX') {
                          <div class="field-container">
                            <mat-checkbox [formControlName]="field.name" [disabled]="isFieldReadonly(field)">{{ field.label }}</mat-checkbox>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CHECKBOX_GROUP') {
                          <div class="field-container checkbox-group-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="checkbox-options" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                              @for (option of field.options || []; track option.value) {
                                <mat-checkbox
                                  [checked]="isCheckboxOptionSelected(field.name, option.value)"
                                  [disabled]="isFieldReadonly(field)"
                                  (change)="onCheckboxGroupChange(field.name, option.value, $event.checked)">
                                  {{ option.label || option.value }}
                                </mat-checkbox>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('FILE') {
                          <div class="file-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <input type="file" (change)="onFileSelect($event, field.name)" [multiple]="field.multiple" [disabled]="isFieldReadonly(field)">
                            @if (selectedFiles[field.name] && selectedFiles[field.name].length > 0) {
                              <div class="file-list">
                                @for (file of selectedFiles[field.name]; track file.name) {
                                  <mat-chip>{{ file.name }}</mat-chip>
                                }
                              </div>
                            }
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('URL') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="url" [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('USER') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-icon matPrefix>person_search</mat-icon>
                              <input matInput
                                [formControlName]="field.name"
                                [matAutocomplete]="auto"
                                [placeholder]="field.placeholder || 'Search for a user...'"
                                (input)="onUserSearch($event, field.name)"
                                [readonly]="isFieldReadonly(field)">
                              <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayUserFn" (optionSelected)="onUserSelected($event, field.name)">
                                @for (user of getFilteredUsers(field.name); track user.id) {
                                  <mat-option [value]="user">
                                    <div class="user-option">
                                      <mat-icon>person</mat-icon>
                                      <div class="user-info">
                                        <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                                        <span class="user-email">{{ user.email }}</span>
                                      </div>
                                    </div>
                                  </mat-option>
                                }
                                @if (getFilteredUsers(field.name).length === 0 && userSearchTerms[field.name]) {
                                  <mat-option disabled>No users found</mat-option>
                                }
                              </mat-autocomplete>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('HIDDEN') {
                          <input type="hidden" [formControlName]="field.name">
                        }
                        @case ('LABEL') {
                          <div class="label-field">
                            <p class="label-text">{{ field.label }}</p>
                            @if (field.defaultValue) {
                              <p class="label-description">{{ field.defaultValue }}</p>
                            }
                          </div>
                        }
                        @case ('DIVIDER') {
                          <div class="divider-field">
                            <mat-divider></mat-divider>
                            @if (field.label) {
                              <span class="divider-label">{{ field.label }}</span>
                            }
                          </div>
                        }
                        @case ('TOGGLE') {
                          <div class="toggle-field">
                            <mat-slide-toggle [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                              {{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }
                            </mat-slide-toggle>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('YES_NO') {
                          <div class="yes-no-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-button-toggle-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                              <mat-button-toggle value="yes">Yes</mat-button-toggle>
                              <mat-button-toggle value="no">No</mat-button-toggle>
                            </mat-button-toggle-group>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RATING') {
                          <div class="rating-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="star-rating">
                              @for (star of getStarArray(field); track star) {
                                <mat-icon (click)="setRating(field, star)" [class.filled]="getRatingValue(field) >= star" [class.readonly]="isFieldReadonly(field)">
                                  {{ getRatingValue(field) >= star ? 'star' : 'star_border' }}
                                </mat-icon>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TIME') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="time" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SLIDER') {
                          <div class="slider-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }}: {{ form.get(field.name)?.value || 0 }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-slider [min]="field.sliderMin || 0" [max]="field.sliderMax || 100" [step]="field.sliderStep || 1" [discrete]="true" [disabled]="isFieldReadonly(field)">
                              <input matSliderThumb [formControlName]="field.name">
                            </mat-slider>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('COLOR') {
                          <div class="color-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <input type="color" [formControlName]="field.name" class="color-input" [disabled]="isFieldReadonly(field)">
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('IMAGE') {
                          <div class="image-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="image-upload-area">
                              <input type="file" accept="image/*" (change)="onImageSelect($event, field)" #imageInput hidden>
                              <button mat-stroked-button type="button" (click)="imageInput.click()" [disabled]="isFieldReadonly(field)">
                                <mat-icon>add_photo_alternate</mat-icon>
                                Select Image
                              </button>
                              @if (getImagePreview(field)) {
                                <img [src]="getImagePreview(field)" class="image-preview">
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SIGNATURE') {
                          <div class="signature-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="signature-pad-container">
                              <canvas class="signature-canvas"
                                      [attr.data-field]="field.name"
                                      (mousedown)="startSignature($event, field)"
                                      (mousemove)="drawSignature($event, field)"
                                      (mouseup)="endSignature(field)"
                                      (mouseleave)="endSignature(field)"
                                      (touchstart)="startSignatureTouch($event, field)"
                                      (touchmove)="drawSignatureTouch($event, field)"
                                      (touchend)="endSignature(field)">
                              </canvas>
                              <div class="signature-actions">
                                <button mat-icon-button type="button" (click)="clearSignature(field)" matTooltip="Clear signature" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>clear</mat-icon>
                                </button>
                              </div>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RICH_TEXT') {
                          <div class="rich-text-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="rich-text-editor">
                              <div class="rich-text-toolbar">
                                <button mat-icon-button type="button" (click)="execRichTextCommand('bold')" matTooltip="Bold" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_bold</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('italic')" matTooltip="Italic" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_italic</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('underline')" matTooltip="Underline" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_underlined</mat-icon>
                                </button>
                                <span class="toolbar-divider"></span>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('insertUnorderedList')" matTooltip="Bullet list" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_list_bulleted</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('insertOrderedList')" matTooltip="Numbered list" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_list_numbered</mat-icon>
                                </button>
                              </div>
                              <div class="rich-text-content"
                                   contenteditable="true"
                                   [attr.data-field]="field.name"
                                   (input)="onRichTextInput($event, field)"
                                   (blur)="onRichTextBlur($event, field)"
                                   [innerHTML]="form.get(field.name)?.value || ''"
                                   [class.readonly]="isFieldReadonly(field)">
                              </div>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('ICON') {
                          <div class="icon-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="icon-picker">
                              <div class="selected-icon" (click)="toggleIconPicker(field)" [class.disabled]="isFieldReadonly(field)">
                                @if (form.get(field.name)?.value) {
                                  <mat-icon>{{ form.get(field.name)?.value }}</mat-icon>
                                  <span>{{ form.get(field.name)?.value }}</span>
                                } @else {
                                  <mat-icon>emoji_symbols</mat-icon>
                                  <span>Select an icon...</span>
                                }
                                <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
                              </div>
                              @if (isIconPickerOpen(field)) {
                                <div class="icon-picker-dropdown">
                                  <input type="text" class="icon-search" placeholder="Search icons..." [value]="iconSearchText[field.name] || ''" (input)="onIconSearch($event, field)">
                                  <div class="icon-grid">
                                    @for (icon of getFilteredIcons(field); track icon) {
                                      <div class="icon-option" (click)="selectIcon(field, icon)" [class.selected]="form.get(field.name)?.value === icon">
                                        <mat-icon>{{ icon }}</mat-icon>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('BARCODE') {
                          <div class="barcode-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="barcode-input">
                              <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Barcode/QR Code</mat-label>
                                <input matInput [formControlName]="field.name" [readonly]="isFieldReadonly(field)" placeholder="Enter or scan barcode...">
                                <button mat-icon-button matSuffix type="button" (click)="scanBarcode(field)" matTooltip="Scan barcode" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>qr_code_scanner</mat-icon>
                                </button>
                              </mat-form-field>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('LOCATION') {
                          <div class="location-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="location-input">
                              <div class="location-coords">
                                <mat-form-field appearance="outline" class="coord-field">
                                  <mat-label>Latitude</mat-label>
                                  <input matInput type="number" step="any" [value]="getLocationLat(field)" (input)="onLocationLatChange($event, field)" [readonly]="isFieldReadonly(field)">
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="coord-field">
                                  <mat-label>Longitude</mat-label>
                                  <input matInput type="number" step="any" [value]="getLocationLng(field)" (input)="onLocationLngChange($event, field)" [readonly]="isFieldReadonly(field)">
                                </mat-form-field>
                                <button mat-icon-button type="button" (click)="getCurrentLocation(field)" matTooltip="Get current location" [disabled]="isFieldReadonly(field) || isGettingLocation(field)">
                                  @if (isGettingLocation(field)) {
                                    <mat-icon class="spinning">sync</mat-icon>
                                  } @else {
                                    <mat-icon>my_location</mat-icon>
                                  }
                                </button>
                              </div>
                              @if (getLocationDisplay(field)) {
                                <div class="location-preview">
                                  <mat-icon>place</mat-icon>
                                  <span>{{ getLocationDisplay(field) }}</span>
                                </div>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TABLE') {
                          <div class="table-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="table-input">
                              <table class="data-table">
                                <thead>
                                  <tr>
                                    @for (col of getTableColumns(field); track col.name) {
                                      <th>{{ col.label }}</th>
                                    }
                                    <th class="actions-col">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (row of getTableRows(field); track $index; let rowIndex = $index) {
                                    <tr>
                                      @for (col of getTableColumns(field); track col.name) {
                                        <td>
                                          <input type="text" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, rowIndex, col.name)" [readonly]="isFieldReadonly(field)" class="table-cell-input">
                                        </td>
                                      }
                                      <td class="actions-col">
                                        <button mat-icon-button type="button" (click)="removeTableRow(field, rowIndex)" [disabled]="isFieldReadonly(field)" matTooltip="Remove row">
                                          <mat-icon>delete</mat-icon>
                                        </button>
                                      </td>
                                    </tr>
                                  }
                                  @if (getTableRows(field).length === 0) {
                                    <tr>
                                      <td [attr.colspan]="getTableColumns(field).length + 1" class="empty-table">
                                        No rows added. Click "Add Row" to add data.
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                              <button mat-stroked-button type="button" (click)="addTableRow(field)" [disabled]="isFieldReadonly(field)" class="add-row-btn">
                                <mat-icon>add</mat-icon> Add Row
                              </button>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SQL_OBJECT') {
                          <!-- Render based on viewType -->
                          @switch (field.viewType) {
                            @case ('SELECT') {
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)">
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('MULTISELECT') {
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple>
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('RADIO') {
                              <div class="radio-field" [class.has-error]="hasFieldError(field)">
                                <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                                <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                                  @for (option of field.options; track option.value) {
                                    <mat-radio-button [value]="option.value" [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-radio-button>
                                  }
                                </mat-radio-group>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('CHECKBOX_GROUP') {
                              <div class="checkbox-group-field" [class.has-error]="hasFieldError(field)">
                                <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                                <div class="checkbox-group" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                                  @for (option of field.options; track option.value) {
                                    <mat-checkbox [checked]="isCheckboxOptionSelected(field.name, option.value)"
                                                  (change)="onCheckboxGroupChange(field.name, option.value, $event.checked)"
                                                  [disabled]="isFieldReadonly(field)">
                                      {{ option.label }}
                                    </mat-checkbox>
                                  }
                                </div>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @default {
                              <!-- Default to SELECT if viewType not set -->
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)">
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                          }
                        }
                        @default {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width">
                              <mat-label>{{ field.label }}</mat-label>
                              <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                          </div>
                        }
                      }
                    </div>
                    }
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Grouped Fields -->
          @for (group of (isMultiStep ? getFieldGroupsOnScreen() : fieldGroups); track group.id) {
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
                    @if (isFieldVisible(field)) {
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 2)">
                      @switch (field.type) {
                        @case ('TEXT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TEXTAREA') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <textarea matInput [formControlName]="field.name" rows="4" [readonly]="isFieldReadonly(field)"></textarea>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('NUMBER') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="number" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SELECT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-select [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                                @for (option of field.options; track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('MULTISELECT') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-select [formControlName]="field.name" [disabled]="isFieldReadonly(field)" multiple>
                                @for (option of field.options; track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CURRENCY') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <span matTextPrefix>$&nbsp;</span>
                              <input matInput type="number" step="0.01" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('EMAIL') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="email" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('PHONE') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="tel" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('PASSWORD') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="password" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('DATE') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput [matDatepicker]="groupPicker" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                              <mat-datepicker-toggle matIconSuffix [for]="groupPicker" [disabled]="isFieldReadonly(field)"></mat-datepicker-toggle>
                              <mat-datepicker #groupPicker [disabled]="isFieldReadonly(field)"></mat-datepicker>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('DATETIME') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="datetime-local" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RADIO') {
                          <div class="radio-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                              @for (option of field.options; track option.value) {
                                <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
                              }
                            </mat-radio-group>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CHECKBOX') {
                          <div class="field-container">
                            <mat-checkbox [formControlName]="field.name" [disabled]="isFieldReadonly(field)">{{ field.label }}</mat-checkbox>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('CHECKBOX_GROUP') {
                          <div class="field-container checkbox-group-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="checkbox-options" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                              @for (option of field.options || []; track option.value) {
                                <mat-checkbox
                                  [checked]="isCheckboxOptionSelected(field.name, option.value)"
                                  [disabled]="isFieldReadonly(field)"
                                  (change)="onCheckboxGroupChange(field.name, option.value, $event.checked)">
                                  {{ option.label || option.value }}
                                </mat-checkbox>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('FILE') {
                          <div class="file-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <input type="file" (change)="onFileSelect($event, field.name)" [multiple]="field.multiple" [disabled]="isFieldReadonly(field)">
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('URL') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="url" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('USER') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <mat-icon matPrefix>person_search</mat-icon>
                              <input matInput
                                [formControlName]="field.name"
                                [matAutocomplete]="autoGroup"
                                [placeholder]="field.placeholder || 'Search for a user...'"
                                (input)="onUserSearch($event, field.name)"
                                [readonly]="isFieldReadonly(field)">
                              <mat-autocomplete #autoGroup="matAutocomplete" [displayWith]="displayUserFn" (optionSelected)="onUserSelected($event, field.name)">
                                @for (user of getFilteredUsers(field.name); track user.id) {
                                  <mat-option [value]="user">
                                    <div class="user-option">
                                      <mat-icon>person</mat-icon>
                                      <div class="user-info">
                                        <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                                        <span class="user-email">{{ user.email }}</span>
                                      </div>
                                    </div>
                                  </mat-option>
                                }
                                @if (getFilteredUsers(field.name).length === 0 && userSearchTerms[field.name]) {
                                  <mat-option disabled>No users found</mat-option>
                                }
                              </mat-autocomplete>
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('HIDDEN') {
                          <input type="hidden" [formControlName]="field.name">
                        }
                        @case ('LABEL') {
                          <div class="label-field">
                            <p class="label-text">{{ field.label }}</p>
                            @if (field.defaultValue) {
                              <p class="label-description">{{ field.defaultValue }}</p>
                            }
                          </div>
                        }
                        @case ('DIVIDER') {
                          <div class="divider-field">
                            <mat-divider></mat-divider>
                            @if (field.label) {
                              <span class="divider-label">{{ field.label }}</span>
                            }
                          </div>
                        }
                        @case ('TOGGLE') {
                          <div class="toggle-field">
                            <mat-slide-toggle [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                              {{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }
                            </mat-slide-toggle>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('YES_NO') {
                          <div class="yes-no-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-button-toggle-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)">
                              <mat-button-toggle value="yes">Yes</mat-button-toggle>
                              <mat-button-toggle value="no">No</mat-button-toggle>
                            </mat-button-toggle-group>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RATING') {
                          <div class="rating-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="star-rating">
                              @for (star of getStarArray(field); track star) {
                                <mat-icon (click)="setRating(field, star)" [class.filled]="getRatingValue(field) >= star" [class.readonly]="isFieldReadonly(field)">
                                  {{ getRatingValue(field) >= star ? 'star' : 'star_border' }}
                                </mat-icon>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TIME') {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                              <input matInput type="time" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SLIDER') {
                          <div class="slider-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }}: {{ form.get(field.name)?.value || 0 }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <mat-slider [min]="field.sliderMin || 0" [max]="field.sliderMax || 100" [step]="field.sliderStep || 1" [discrete]="true" [disabled]="isFieldReadonly(field)">
                              <input matSliderThumb [formControlName]="field.name">
                            </mat-slider>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('COLOR') {
                          <div class="color-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <input type="color" [formControlName]="field.name" class="color-input" [disabled]="isFieldReadonly(field)">
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('IMAGE') {
                          <div class="image-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="image-upload-area">
                              <input type="file" accept="image/*" (change)="onImageSelect($event, field)" #imageInputGroup hidden>
                              <button mat-stroked-button type="button" (click)="imageInputGroup.click()" [disabled]="isFieldReadonly(field)">
                                <mat-icon>add_photo_alternate</mat-icon>
                                Select Image
                              </button>
                              @if (getImagePreview(field)) {
                                <img [src]="getImagePreview(field)" class="image-preview">
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SIGNATURE') {
                          <div class="signature-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="signature-pad-container">
                              <canvas class="signature-canvas"
                                      [attr.data-field]="field.name"
                                      (mousedown)="startSignature($event, field)"
                                      (mousemove)="drawSignature($event, field)"
                                      (mouseup)="endSignature(field)"
                                      (mouseleave)="endSignature(field)"
                                      (touchstart)="startSignatureTouch($event, field)"
                                      (touchmove)="drawSignatureTouch($event, field)"
                                      (touchend)="endSignature(field)">
                              </canvas>
                              <div class="signature-actions">
                                <button mat-icon-button type="button" (click)="clearSignature(field)" matTooltip="Clear signature" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>clear</mat-icon>
                                </button>
                              </div>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('RICH_TEXT') {
                          <div class="rich-text-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="rich-text-editor">
                              <div class="rich-text-toolbar">
                                <button mat-icon-button type="button" (click)="execRichTextCommand('bold')" matTooltip="Bold" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_bold</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('italic')" matTooltip="Italic" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_italic</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('underline')" matTooltip="Underline" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_underlined</mat-icon>
                                </button>
                                <span class="toolbar-divider"></span>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('insertUnorderedList')" matTooltip="Bullet list" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_list_bulleted</mat-icon>
                                </button>
                                <button mat-icon-button type="button" (click)="execRichTextCommand('insertOrderedList')" matTooltip="Numbered list" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>format_list_numbered</mat-icon>
                                </button>
                              </div>
                              <div class="rich-text-content"
                                   contenteditable="true"
                                   [attr.data-field]="field.name"
                                   (input)="onRichTextInput($event, field)"
                                   (blur)="onRichTextBlur($event, field)"
                                   [innerHTML]="form.get(field.name)?.value || ''"
                                   [class.readonly]="isFieldReadonly(field)">
                              </div>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('ICON') {
                          <div class="icon-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="icon-picker">
                              <div class="selected-icon" (click)="toggleIconPicker(field)" [class.disabled]="isFieldReadonly(field)">
                                @if (form.get(field.name)?.value) {
                                  <mat-icon>{{ form.get(field.name)?.value }}</mat-icon>
                                  <span>{{ form.get(field.name)?.value }}</span>
                                } @else {
                                  <mat-icon>emoji_symbols</mat-icon>
                                  <span>Select an icon...</span>
                                }
                                <mat-icon class="dropdown-arrow">arrow_drop_down</mat-icon>
                              </div>
                              @if (isIconPickerOpen(field)) {
                                <div class="icon-picker-dropdown">
                                  <input type="text" class="icon-search" placeholder="Search icons..." [value]="iconSearchText[field.name] || ''" (input)="onIconSearch($event, field)">
                                  <div class="icon-grid">
                                    @for (icon of getFilteredIcons(field); track icon) {
                                      <div class="icon-option" (click)="selectIcon(field, icon)" [class.selected]="form.get(field.name)?.value === icon">
                                        <mat-icon>{{ icon }}</mat-icon>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('BARCODE') {
                          <div class="barcode-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="barcode-input">
                              <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Barcode/QR Code</mat-label>
                                <input matInput [formControlName]="field.name" [readonly]="isFieldReadonly(field)" placeholder="Enter or scan barcode...">
                                <button mat-icon-button matSuffix type="button" (click)="scanBarcode(field)" matTooltip="Scan barcode" [disabled]="isFieldReadonly(field)">
                                  <mat-icon>qr_code_scanner</mat-icon>
                                </button>
                              </mat-form-field>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('LOCATION') {
                          <div class="location-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="location-input">
                              <div class="location-coords">
                                <mat-form-field appearance="outline" class="coord-field">
                                  <mat-label>Latitude</mat-label>
                                  <input matInput type="number" step="any" [value]="getLocationLat(field)" (input)="onLocationLatChange($event, field)" [readonly]="isFieldReadonly(field)">
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="coord-field">
                                  <mat-label>Longitude</mat-label>
                                  <input matInput type="number" step="any" [value]="getLocationLng(field)" (input)="onLocationLngChange($event, field)" [readonly]="isFieldReadonly(field)">
                                </mat-form-field>
                                <button mat-icon-button type="button" (click)="getCurrentLocation(field)" matTooltip="Get current location" [disabled]="isFieldReadonly(field) || isGettingLocation(field)">
                                  @if (isGettingLocation(field)) {
                                    <mat-icon class="spinning">sync</mat-icon>
                                  } @else {
                                    <mat-icon>my_location</mat-icon>
                                  }
                                </button>
                              </div>
                              @if (getLocationDisplay(field)) {
                                <div class="location-preview">
                                  <mat-icon>place</mat-icon>
                                  <span>{{ getLocationDisplay(field) }}</span>
                                </div>
                              }
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('TABLE') {
                          <div class="table-field" [class.has-error]="hasFieldError(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            <div class="table-input">
                              <table class="data-table">
                                <thead>
                                  <tr>
                                    @for (col of getTableColumns(field); track col.name) {
                                      <th>{{ col.label }}</th>
                                    }
                                    <th class="actions-col">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (row of getTableRows(field); track $index; let rowIndex = $index) {
                                    <tr>
                                      @for (col of getTableColumns(field); track col.name) {
                                        <td>
                                          <input type="text" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, rowIndex, col.name)" [readonly]="isFieldReadonly(field)" class="table-cell-input">
                                        </td>
                                      }
                                      <td class="actions-col">
                                        <button mat-icon-button type="button" (click)="removeTableRow(field, rowIndex)" [disabled]="isFieldReadonly(field)" matTooltip="Remove row">
                                          <mat-icon>delete</mat-icon>
                                        </button>
                                      </td>
                                    </tr>
                                  }
                                  @if (getTableRows(field).length === 0) {
                                    <tr>
                                      <td [attr.colspan]="getTableColumns(field).length + 1" class="empty-table">
                                        No rows added. Click "Add Row" to add data.
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                              <button mat-stroked-button type="button" (click)="addTableRow(field)" [disabled]="isFieldReadonly(field)" class="add-row-btn">
                                <mat-icon>add</mat-icon> Add Row
                              </button>
                            </div>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('SQL_OBJECT') {
                          <!-- Render based on viewType -->
                          @switch (field.viewType) {
                            @case ('SELECT') {
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)">
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('MULTISELECT') {
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple>
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('RADIO') {
                              <div class="radio-field" [class.has-error]="hasFieldError(field)">
                                <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                                <mat-radio-group [formControlName]="field.name" [disabled]="isFieldReadonly(field)" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                                  @for (option of field.options; track option.value) {
                                    <mat-radio-button [value]="option.value" [disabled]="isFieldReadonly(field)">{{ option.label }}</mat-radio-button>
                                  }
                                </mat-radio-group>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @case ('CHECKBOX_GROUP') {
                              <div class="checkbox-group-field" [class.has-error]="hasFieldError(field)">
                                <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                                <div class="checkbox-group" [class.horizontal-layout]="field.optionsLayout === 'horizontal'">
                                  @for (option of field.options; track option.value) {
                                    <mat-checkbox [checked]="isCheckboxOptionSelected(field.name, option.value)"
                                                  (change)="onCheckboxGroupChange(field.name, option.value, $event.checked)"
                                                  [disabled]="isFieldReadonly(field)">
                                      {{ option.label }}
                                    </mat-checkbox>
                                  }
                                </div>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                            @default {
                              <!-- Default to SELECT if viewType not set -->
                              <div class="field-container">
                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                  <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)">
                                    @for (option of field.options; track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                @if (hasFieldError(field)) {
                                  <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                                }
                              </div>
                            }
                          }
                        }
                        @default {
                          <div class="field-container">
                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                              <mat-label>{{ field.label }}</mat-label>
                              <input matInput [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                      }
                    </div>
                    }
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

          <!-- Actions -->
          <!-- Form Actions - Different layouts for single page vs multi-step -->
          @if (!isMultiStep) {
            <!-- Single Page Form Actions -->
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
          } @else {
            <!-- Multi-Step Form Actions -->
            <div class="form-actions multi-step">
              @if (isFirstScreen) {
                <!-- First Screen: Cancel + Next -->
                <button mat-button type="button" (click)="goBack()">Cancel</button>
                <span class="spacer"></span>
                <button mat-raised-button color="primary" type="button" (click)="goToNextScreen()">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              } @else if (isLastScreen) {
                <!-- Last Screen: Back + Cancel/Save Draft/Submit -->
                <button mat-stroked-button type="button" (click)="goToPreviousScreen()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <span class="spacer"></span>
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
              } @else {
                <!-- Middle Screens: Back + Next -->
                <button mat-stroked-button type="button" (click)="goToPreviousScreen()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <span class="spacer"></span>
                <button mat-raised-button color="primary" type="button" (click)="goToNextScreen()">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              }
            </div>
          }
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

    .group-card ::ng-deep .mat-expansion-panel-header {
      background: var(--form-field-header-bg, #1976d2) !important;
      color: var(--form-field-header-color, #ffffff) !important;
    }

    .group-card ::ng-deep .mat-expansion-panel-header:hover {
      background: var(--form-field-header-bg, #1976d2) !important;
    }

    .group-card ::ng-deep .mat-expansion-panel-header .mat-expansion-indicator::after {
      color: var(--form-field-header-color, #ffffff) !important;
    }

    .group-card ::ng-deep .mat-expansion-panel-header .mat-content {
      color: var(--form-field-header-color, #ffffff) !important;
    }

    .group-card ::ng-deep .mat-expansion-panel-header-title,
    .group-card ::ng-deep .mat-expansion-panel-header-description {
      color: var(--form-field-header-color, #ffffff) !important;
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

    .required-asterisk {
      color: #f44336;
      font-weight: bold;
      margin-left: 2px;
    }

    .has-error {
      animation: shake 0.3s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }

    .field-error {
      color: #f44336;
      font-size: 0.75rem;
      margin-top: 4px;
    }

    .field-container {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .validation-error {
      color: #f44336;
      font-size: 0.75rem;
      margin-top: -16px;
      padding-left: 14px;
      line-height: 1.2;
    }

    .field-invalid ::ng-deep .mdc-notched-outline__leading,
    .field-invalid ::ng-deep .mdc-notched-outline__notch,
    .field-invalid ::ng-deep .mdc-notched-outline__trailing {
      border-color: #f44336 !important;
    }

    .field-invalid ::ng-deep .mat-mdc-floating-label {
      color: #f44336 !important;
    }

    .radio-field mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-field mat-radio-group.horizontal-layout {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .file-field {
      padding: 0.5rem 0;
    }

    .checkbox-group-field {
      padding: 0.5rem 0;
    }

    .checkbox-group-field .field-label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: rgba(0, 0, 0, 0.87);
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

    .label-field {
      padding: 1rem 0;
    }

    .label-field .label-text {
      font-size: 1rem;
      font-weight: 500;
      margin: 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .label-field .label-description {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0 0 0;
    }

    .divider-field {
      padding: 1rem 0;
      position: relative;
    }

    .divider-field .divider-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 0 1rem;
      color: #666;
      font-size: 0.875rem;
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

    .image-field {
      padding: 0.5rem 0;
    }

    .image-upload-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .image-preview {
      max-width: 200px;
      max-height: 150px;
      margin-top: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .signature-field, .rich-text-field, .icon-field, .barcode-field, .location-field, .table-field {
      padding: 0.5rem 0;
    }

    /* Signature Field Styles */
    .signature-pad-container {
      position: relative;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
    }

    .signature-canvas {
      width: 100%;
      height: 150px;
      cursor: crosshair;
      display: block;
      touch-action: none;
    }

    .signature-actions {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .signature-actions button {
      background: rgba(255, 255, 255, 0.9);
    }

    /* Rich Text Field Styles */
    .rich-text-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .rich-text-toolbar {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      flex-wrap: wrap;
    }

    .rich-text-toolbar button {
      min-width: 36px;
      width: 36px;
      height: 36px;
    }

    .toolbar-divider {
      width: 1px;
      background: #ddd;
      margin: 0 0.25rem;
    }

    .rich-text-content {
      min-height: 120px;
      padding: 0.75rem;
      outline: none;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .rich-text-content:focus {
      background: #fafafa;
    }

    .rich-text-content[contenteditable="false"] {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    /* Icon Field Styles */
    .icon-selector {
      position: relative;
    }

    .selected-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border: 2px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #fff;
    }

    .selected-icon:hover:not(.disabled) {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .selected-icon.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .selected-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #333;
    }

    .icon-picker-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1000;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 0.75rem;
      width: 320px;
      max-height: 350px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .icon-search {
      margin-bottom: 0.5rem;
    }

    .icon-search input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0.25rem;
      overflow-y: auto;
      max-height: 250px;
      padding: 0.25rem;
    }

    .icon-option {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .icon-option:hover {
      background: #e3f2fd;
    }

    .icon-option mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #666;
    }

    .icon-option:hover mat-icon {
      color: #1976d2;
    }

    /* Barcode Field Styles */
    .barcode-input {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .barcode-input mat-form-field {
      flex: 1;
    }

    /* Location Field Styles */
    .location-inputs {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .location-inputs mat-form-field {
      flex: 1;
    }

    .location-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .location-display {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #666;
    }

    /* Table/Grid Field Styles */
    .table-container {
      overflow-x: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: #f5f5f5;
      padding: 0.5rem;
      text-align: left;
      font-weight: 500;
      font-size: 0.875rem;
      border-bottom: 1px solid #ddd;
    }

    .data-table td {
      padding: 0.25rem;
      border-bottom: 1px solid #eee;
    }

    .data-table input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid transparent;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .data-table input:focus {
      border-color: #1976d2;
      outline: none;
    }

    .data-table input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .data-table .actions-cell {
      width: 50px;
      text-align: center;
    }

    .data-table .empty-table {
      text-align: center;
      padding: 1rem;
      color: #999;
      font-style: italic;
    }

    .table-actions {
      margin-top: 0.5rem;
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

    .form-actions.multi-step {
      justify-content: flex-start;
    }

    .form-actions .spacer {
      flex: 1;
    }

    /* Step Indicator Styles */
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 0.5rem;
      margin-bottom: 0.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      min-width: 60px;
    }

    .step-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e0e0;
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .step.active .step-circle {
      background: #1976d2;
      color: white;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
    }

    .step.completed .step-circle {
      background: #4caf50;
      color: white;
    }

    .step.completed .step-circle mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .step-label {
      margin-top: 0.25rem;
      font-size: 0.7rem;
      color: #666;
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      margin-bottom: 0.75rem;
      max-width: 80px;
      transition: background 0.3s ease;
    }

    .step-connector.completed {
      background: #4caf50;
    }

    /* Screen Header Styles */
    .screen-header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.5rem;
      background: #f5f5f5;
      border-radius: 6px;
      border-left: 3px solid #1976d2;
    }

    .screen-header mat-icon {
      color: #1976d2;
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
    }

    .screen-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .screen-header p {
      margin: 0.125rem 0 0 0;
      font-size: 0.8rem;
      color: #666;
    }

    .user-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .user-option mat-icon {
      color: #666;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .user-email {
      font-size: 0.75rem;
      color: #666;
    }

    /* Dark mode support */
    :host-context(.dark-mode) .workflow-form-container {
      background: #1e1e1e;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .form-card {
      background: #2d2d2d !important;
    }

    :host-context(.dark-mode) .form-header {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
    }

    :host-context(.dark-mode) .workflow-title,
    :host-context(.dark-mode) h3,
    :host-context(.dark-mode) .field-label,
    :host-context(.dark-mode) .group-title {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) .workflow-description,
    :host-context(.dark-mode) .field-hint,
    :host-context(.dark-mode) .group-description,
    :host-context(.dark-mode) .screen-description {
      color: #aaa !important;
    }

    :host-context(.dark-mode) .required-indicator {
      color: #ff6b6b;
    }

    :host-context(.dark-mode) .field-group {
      background: #333;
      border-color: #444;
    }

    :host-context(.dark-mode) .group-header {
      background: #3d3d3d;
      border-color: #444;
    }

    :host-context(.dark-mode) .divider-field mat-divider {
      border-color: #444;
    }

    :host-context(.dark-mode) .label-field span {
      color: #aaa;
    }

    :host-context(.dark-mode) .file-upload-area {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .file-upload-area p {
      color: #aaa;
    }

    :host-context(.dark-mode) .file-list {
      border-color: #444;
    }

    :host-context(.dark-mode) .file-item {
      background: #333;
      border-color: #444;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .star-rating mat-icon {
      color: #ffc107;
    }

    :host-context(.dark-mode) .slider-field label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .color-preview {
      border-color: #444;
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
    }

    :host-context(.dark-mode) .icon-display {
      border-color: #444;
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .icon-name {
      color: #aaa;
    }

    :host-context(.dark-mode) .screen-tabs {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .screen-tab {
      background: #333;
      border-color: #444;
      color: #aaa;
    }

    :host-context(.dark-mode) .screen-tab.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    :host-context(.dark-mode) .screen-tab.completed {
      background: #2e7d32;
      color: white;
    }

    :host-context(.dark-mode) .screen-navigation {
      border-color: #444;
    }

    :host-context(.dark-mode) .screen-counter {
      color: #aaa;
    }

    :host-context(.dark-mode) .attachments-section {
      border-color: #444;
    }

    :host-context(.dark-mode) .attachments-header h3 {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .comments-section {
      border-color: #444;
    }

    :host-context(.dark-mode) .user-option mat-icon {
      color: #aaa;
    }

    :host-context(.dark-mode) .user-email {
      color: #aaa;
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

    :host-context(.dark-mode) ::ng-deep .mat-mdc-card {
      background: #2d2d2d !important;
      color: #e0e0e0;
    }
  `]
})
export class WorkflowFormComponent implements OnInit, OnDestroy {
  workflow: Workflow | null = null;
  form!: FormGroup;
  loading = true;
  submitting = false;
  workflowCode = '';

  fields: WorkflowField[] = [];
  fieldGroups: FieldGroup[] = [];
  screens: Screen[] = [];
  currentScreenIndex = 0;
  selectedFiles: Record<string, File[]> = {};
  attachments: File[] = [];
  instanceId: string | null = null;
  isEditMode = false;
  existingFieldValues: Record<string, any> = {};
  checkboxGroupValues: Record<string, string[]> = {};

  // Track calculated fields and their dependencies
  private calculatedFields: Map<string, { expression: string; fieldType: string; dependencies: string[] }> = new Map();
  private subscriptions: Subscription[] = [];

  // Track custom validation errors from validation expressions
  validationErrors: Record<string, string | null> = {};

  // Flag to track if user has attempted to submit (validation only shows after submit attempt)
  hasAttemptedSubmit = false;

  // Track pending unique validation checks
  private pendingUniqueChecks: Map<string, boolean> = new Map();
  private uniqueCheckCache: Map<string, boolean> = new Map();

  // User field data
  allUsers: User[] = [];
  filteredUsersMap: Record<string, User[]> = {};
  userSearchTerms: Record<string, string> = {};
  selectedUsers: Record<string, User> = {};

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private workflowService: WorkflowService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.workflowCode = this.route.snapshot.paramMap.get('workflowCode') || '';
    this.instanceId = this.route.snapshot.paramMap.get('instanceId') || null;
    this.isEditMode = !!this.instanceId;
    this.loadWorkflow();
    this.loadUsers();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadWorkflow() {
    this.workflowService.getWorkflowByCode(this.workflowCode).subscribe({
      next: (res) => {
        if (res.success) {
          this.workflow = res.data;
          if (this.isEditMode && this.instanceId) {
            this.loadInstance();
          } else {
            this.loading = false;
            this.initializeForm();
          }
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load workflow', 'Close', { duration: 3000 });
      }
    });
  }

  loadInstance() {
    this.workflowService.getInstance(this.instanceId!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Extract field values from instance
          // fieldValues is returned as an object/map from the backend, not an array
          if (res.data.fieldValues) {
            const fieldValues = res.data.fieldValues as any;
            if (Array.isArray(fieldValues)) {
              // Handle legacy array format
              fieldValues.forEach((fv: any) => {
                this.existingFieldValues[fv.fieldName] = fv.value;
              });
            } else if (typeof fieldValues === 'object') {
              // Handle object/map format (current backend response)
              Object.keys(fieldValues).forEach((fieldName: string) => {
                this.existingFieldValues[fieldName] = fieldValues[fieldName];
              });
            }
          }
        }
        // Always initialize form after loading instance (workflow should already be loaded)
        this.loading = false;
        this.initializeForm();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load instance', 'Close', { duration: 3000 });
      }
    });
  }

  initializeForm() {
    if (!this.workflow?.forms?.[0]) {
      console.warn('No workflow forms found for initialization');
      return;
    }

    const mainForm = this.workflow.forms[0];
    const fieldGroups = mainForm.fieldGroups || [];

    // Build a map of field ID to group ID from the fieldGroups structure
    const fieldIdToGroupId = new Map<string, string>();
    fieldGroups.forEach((group: any) => {
      if (group.fields && Array.isArray(group.fields)) {
        group.fields.forEach((f: any) => {
          const fieldId = f.id?.toString();
          if (fieldId) {
            fieldIdToGroupId.set(fieldId, group.id?.toString());
          }
        });
      }
    });

    // Collect all fields - start with mainForm.fields
    const allFieldsMap = new Map<string, any>();

    // First, add fields from mainForm.fields
    (mainForm.fields || []).forEach((f: any) => {
      const fieldId = f.id?.toString();
      if (fieldId) {
        // Check if this field belongs to a group
        const groupId = f.fieldGroupId?.toString() || fieldIdToGroupId.get(fieldId) || null;
        allFieldsMap.set(fieldId, { ...f, fieldGroupId: groupId });
      }
    });

    // Then, add any fields from fieldGroups that aren't already in the map
    fieldGroups.forEach((group: any) => {
      if (group.fields && Array.isArray(group.fields)) {
        group.fields.forEach((f: any) => {
          const fieldId = f.id?.toString();
          if (fieldId && !allFieldsMap.has(fieldId)) {
            allFieldsMap.set(fieldId, { ...f, fieldGroupId: group.id?.toString() });
          }
        });
      }
    });

    // Convert map to array and normalize fields
    this.fields = Array.from(allFieldsMap.values()).map(f => {
      const fieldType = (f.type || f.fieldType || 'TEXT').toString().toUpperCase();
      return {
        ...f,
        type: fieldType,
        fieldType: fieldType,
        required: f.required ?? f.isMandatory ?? false,
        hidden: f.hidden ?? f.isHidden ?? false,
        readOnly: f.readOnly ?? f.isReadonly ?? false
      };
    });

    this.fieldGroups = fieldGroups;
    this.screens = (mainForm.screens || []).sort((a: Screen, b: Screen) => (a.displayOrder || 0) - (b.displayOrder || 0));
    this.currentScreenIndex = 0;

    // Get all field names for dependency tracking
    const allFieldNames = new Set(this.fields.map(f => f.name));

    const formControls: Record<string, any> = {};

    // First pass: create form controls with initial values
    this.fields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'EMAIL') {
        validators.push(Validators.email);
      }

      let defaultValue: any = '';

      // Use existing value if in edit mode
      if (this.isEditMode && this.existingFieldValues[field.name] !== undefined) {
        defaultValue = this.existingFieldValues[field.name];

        // Type-specific conversions for existing values
        if (field.type === 'CHECKBOX') {
          defaultValue = defaultValue === 'true' || defaultValue === true;
        } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
          defaultValue = Number(defaultValue) || null;
        } else if (field.type === 'DATE' || field.type === 'DATETIME') {
          defaultValue = defaultValue ? new Date(defaultValue) : null;
        }
      } else if (field.defaultValue) {
        // Check if this is a function expression that references other fields
        const dependencies = this.extractFieldDependencies(field.defaultValue, allFieldNames);

        if (dependencies.length > 0) {
          // This is a calculated field - track it for reactive updates
          this.calculatedFields.set(field.name, {
            expression: field.defaultValue,
            fieldType: field.type,
            dependencies
          });
          // Set empty initial value - will be calculated after form is created
          defaultValue = '';
        } else {
          // No field dependencies - evaluate immediately
          defaultValue = this.evaluateDefaultValue(field.defaultValue, field.type);

          // Type-specific conversions for evaluated defaults
          if (field.type === 'CHECKBOX') {
            defaultValue = defaultValue === 'true' || defaultValue === true || false;
          } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
            defaultValue = defaultValue ? Number(defaultValue) : null;
          } else if ((field.type === 'DATE' || field.type === 'DATETIME') && !(defaultValue instanceof Date)) {
            defaultValue = defaultValue ? new Date(defaultValue) : null;
          }
        }
      }

      formControls[field.name] = [defaultValue, validators];
    });

    this.form = this.fb.group(formControls);

    // Set up reactive subscriptions for calculated fields
    this.setupCalculatedFieldSubscriptions();

    // Trigger initial calculation for all calculated fields
    this.calculatedFields.forEach((config, fieldName) => {
      this.recalculateField(fieldName, config);
    });

    // Set up validation subscriptions for fields with validation expressions
    this.setupValidationSubscriptions();
  }

  private extractFieldDependencies(expression: string, allFieldNames: Set<string>): string[] {
    const dependencies: string[] = [];

    // Extract function arguments
    const match = expression.match(/^([A-Z_]+)\((.*)\)$/i);
    if (!match) return dependencies;

    const argsStr = match[2];
    if (!argsStr) return dependencies;

    // Parse arguments and check if any are field names
    const args = this.parseArgsRaw(argsStr);
    args.forEach(arg => {
      const cleanArg = arg.trim().replace(/^["']|["']$/g, '');
      // If it's not quoted and it's a field name, it's a dependency
      if (!arg.startsWith('"') && !arg.startsWith("'") && allFieldNames.has(cleanArg)) {
        dependencies.push(cleanArg);
      }
    });

    return dependencies;
  }

  private parseArgsRaw(argsStr: string): string[] {
    // Parse arguments without resolving field values
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (const char of argsStr) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (char === ',' && !inQuotes) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current) {
      args.push(current.trim());
    }
    return args;
  }

  private setupCalculatedFieldSubscriptions() {
    this.calculatedFields.forEach((config, fieldName) => {
      // Create observables for all dependency fields
      const dependencyControls = config.dependencies
        .map(dep => this.form.get(dep))
        .filter(control => control !== null);

      if (dependencyControls.length > 0) {
        const valueChanges$ = merge(...dependencyControls.map(c => c!.valueChanges));

        const sub = valueChanges$
          .pipe(debounceTime(100))
          .subscribe(() => {
            this.recalculateField(fieldName, config);
          });

        this.subscriptions.push(sub);
      }
    });
  }

  private setupValidationSubscriptions() {
    // Subscribe to form value changes to clear unique cache when values change
    const sub = this.form.valueChanges
      .pipe(debounceTime(300))
      .subscribe((values) => {
        // Clear unique cache for fields that have changed
        this.fields.forEach(field => {
          if (field.validation && /Unique\(/i.test(field.validation)) {
            const currentValue = values[field.name];
            // Clear old cache entries for this field
            const keysToDelete: string[] = [];
            this.uniqueCheckCache.forEach((_, key) => {
              if (key.startsWith(`${field.name}:`) && key !== `${field.name}:${currentValue}`) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach(key => this.uniqueCheckCache.delete(key));
          }
        });
        // Clear validation errors when user types (will re-validate on submit)
        this.clearValidationErrors();
      });
    this.subscriptions.push(sub);
  }

  private clearValidationErrors() {
    // Reset submit attempt flag so errors hide when user starts typing
    this.hasAttemptedSubmit = false;

    // Clear all validation errors and remove error styling
    this.fields.forEach(field => {
      if (this.validationErrors[field.name]) {
        this.validationErrors[field.name] = null;
        const control = this.form.get(field.name);
        if (control && control.errors) {
          const { customValidation, ...otherErrors } = control.errors;
          control.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
        }
      }
    });
  }

  private validateAllFields() {
    this.fields.forEach(field => {
      if (field.validation) {
        const error = this.evaluateValidation(field);
        this.validationErrors[field.name] = error;

        // Set/clear error on the form control to trigger mat-error display
        const control = this.form.get(field.name);
        if (control) {
          if (error) {
            control.setErrors({ ...control.errors, customValidation: error });
            control.markAsTouched();
          } else {
            // Clear only our custom validation error, preserve other errors
            if (control.errors) {
              const { customValidation, ...otherErrors } = control.errors;
              control.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
            }
          }
        }
      }
    });
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  private evaluateValidation(field: WorkflowField): string | null {
    const expression = field.validation;
    if (!expression) return null;

    try {
      // Parse and evaluate validation expression(s)
      // Support combining with AND
      const parts = expression.split(/\s+AND\s+/i);

      for (const part of parts) {
        const trimmed = part.trim();
        const error = this.evaluateSingleValidation(trimmed, field);
        if (error) return error;
      }

      return null;
    } catch (e) {
      return null; // Invalid expression - don't show error
    }
  }

  private evaluateSingleValidation(expression: string, field: WorkflowField): string | null {
    const value = this.form.get(field.name)?.value;
    const fieldLabel = field.label || field.name;

    // Required() or Required("message")
    const requiredMatch = expression.match(/^Required\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (requiredMatch) {
      const customMessage = requiredMatch[1] || requiredMatch[2];
      if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
        return customMessage || `${fieldLabel} is required`;
      }
      return null;
    }

    // Unique() or Unique("message") - async check against backend
    const uniqueMatch = expression.match(/^Unique\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (uniqueMatch) {
      const customMessage = uniqueMatch[1] || uniqueMatch[2];

      // Skip if value is empty
      if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
        return null;
      }

      const cacheKey = `${field.name}:${value}`;

      // Check cache first
      if (this.uniqueCheckCache.has(cacheKey)) {
        const isUnique = this.uniqueCheckCache.get(cacheKey);
        if (!isUnique) {
          return customMessage || `${fieldLabel} value already exists`;
        }
        return null;
      }

      // If not in cache and not already checking, trigger async check
      if (!this.pendingUniqueChecks.get(cacheKey)) {
        this.pendingUniqueChecks.set(cacheKey, true);
        this.checkUniqueField(field.name, String(value), customMessage || `${fieldLabel} value already exists`);
      }

      // Return null for now - async check will update validationErrors
      return null;
    }

    // ValidWhen(expression, "message") or ValidWhen(expression)
    const validWhenMatch = expression.match(/^ValidWhen\(\s*(.+?)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (validWhenMatch) {
      const conditionExpr = validWhenMatch[1].trim();
      const customMessage = validWhenMatch[2] || validWhenMatch[3];

      const result = this.evaluateCondition(conditionExpr);
      // Valid when result is true (or 0)
      const isValid = result === true || result === 'true' || result === 0 || result === '0';
      if (!isValid) {
        return customMessage || `${fieldLabel} validation failed`;
      }
      return null;
    }

    // InvalidWhen(expression, "message") or InvalidWhen(expression)
    const invalidWhenMatch = expression.match(/^InvalidWhen\(\s*(.+?)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (invalidWhenMatch) {
      const conditionExpr = invalidWhenMatch[1].trim();
      const customMessage = invalidWhenMatch[2] || invalidWhenMatch[3];

      const result = this.evaluateCondition(conditionExpr);
      // Invalid when result is true (or non-zero)
      const isInvalid = result === true || result === 'true' ||
                        (typeof result === 'number' && result !== 0) ||
                        (typeof result === 'string' && result !== '0' && result !== 'false' && result !== '');
      if (isInvalid) {
        return customMessage || `${fieldLabel} validation failed`;
      }
      return null;
    }

    // MinLength(n) or MinLength(n, "message")
    const minLengthMatch = expression.match(/^MinLength\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minLengthMatch) {
      const minLen = parseInt(minLengthMatch[1], 10);
      const customMessage = minLengthMatch[2] || minLengthMatch[3];
      const strValue = value ? String(value) : '';
      if (strValue.length < minLen) {
        return customMessage || `${fieldLabel} must be at least ${minLen} characters`;
      }
      return null;
    }

    // MaxLength(n) or MaxLength(n, "message")
    const maxLengthMatch = expression.match(/^MaxLength\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxLengthMatch) {
      const maxLen = parseInt(maxLengthMatch[1], 10);
      const customMessage = maxLengthMatch[2] || maxLengthMatch[3];
      const strValue = value ? String(value) : '';
      if (strValue.length > maxLen) {
        return customMessage || `${fieldLabel} must be at most ${maxLen} characters`;
      }
      return null;
    }

    // Min(n) or Min(n, "message") - minimum numeric value
    const minMatch = expression.match(/^Min\(\s*(-?[\d.]+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minMatch) {
      const minVal = parseFloat(minMatch[1]);
      const customMessage = minMatch[2] || minMatch[3];
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < minVal) {
        return customMessage || `${fieldLabel} must be at least ${minVal}`;
      }
      return null;
    }

    // Max(n) or Max(n, "message") - maximum numeric value
    const maxMatch = expression.match(/^Max\(\s*(-?[\d.]+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxMatch) {
      const maxVal = parseFloat(maxMatch[1]);
      const customMessage = maxMatch[2] || maxMatch[3];
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > maxVal) {
        return customMessage || `${fieldLabel} must be at most ${maxVal}`;
      }
      return null;
    }

    // Pattern(regex) or Pattern(regex, "message")
    const patternMatch = expression.match(/^Pattern\(\s*\/(.+)\/([gimsuy]*)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (patternMatch) {
      const pattern = patternMatch[1];
      const flags = patternMatch[2] || '';
      const customMessage = patternMatch[3] || patternMatch[4];
      try {
        const regex = new RegExp(pattern, flags);
        const strValue = value ? String(value) : '';
        if (strValue && !regex.test(strValue)) {
          return customMessage || `${fieldLabel} format is invalid`;
        }
      } catch (e) {
        // Invalid regex, skip validation
      }
      return null;
    }

    // Email() or Email("message")
    const emailMatch = expression.match(/^Email\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (emailMatch) {
      const customMessage = emailMatch[1] || emailMatch[2];
      const strValue = value ? String(value) : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (strValue && !emailRegex.test(strValue)) {
        return customMessage || `${fieldLabel} must be a valid email address`;
      }
      return null;
    }

    // Phone() or Phone("message")
    const phoneMatch = expression.match(/^Phone\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (phoneMatch) {
      const customMessage = phoneMatch[1] || phoneMatch[2];
      const strValue = value ? String(value) : '';
      // Basic phone validation - allows +, digits, spaces, dashes, parentheses
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (strValue && !phoneRegex.test(strValue.replace(/\s/g, ''))) {
        return customMessage || `${fieldLabel} must be a valid phone number`;
      }
      return null;
    }

    // URL() or URL("message")
    const urlMatch = expression.match(/^URL\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (urlMatch) {
      const customMessage = urlMatch[1] || urlMatch[2];
      const strValue = value ? String(value) : '';
      try {
        if (strValue) {
          new URL(strValue);
        }
      } catch (e) {
        return customMessage || `${fieldLabel} must be a valid URL`;
      }
      return null;
    }

    // Range(min, max) or Range(min, max, "message") - numeric range
    const rangeMatch = expression.match(/^Range\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (rangeMatch) {
      const minVal = parseFloat(rangeMatch[1]);
      const maxVal = parseFloat(rangeMatch[2]);
      const customMessage = rangeMatch[3] || rangeMatch[4];
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && (numValue < minVal || numValue > maxVal)) {
        return customMessage || `${fieldLabel} must be between ${minVal} and ${maxVal}`;
      }
      return null;
    }

    // LengthRange(min, max) or LengthRange(min, max, "message") - string length range
    const lengthRangeMatch = expression.match(/^LengthRange\(\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (lengthRangeMatch) {
      const minLen = parseInt(lengthRangeMatch[1], 10);
      const maxLen = parseInt(lengthRangeMatch[2], 10);
      const customMessage = lengthRangeMatch[3] || lengthRangeMatch[4];
      const strValue = value ? String(value) : '';
      if (strValue.length < minLen || strValue.length > maxLen) {
        return customMessage || `${fieldLabel} must be between ${minLen} and ${maxLen} characters`;
      }
      return null;
    }

    // Digits() or Digits("message") - only digits allowed
    const digitsMatch = expression.match(/^Digits\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (digitsMatch) {
      const customMessage = digitsMatch[1] || digitsMatch[2];
      const strValue = value ? String(value) : '';
      if (strValue && !/^\d+$/.test(strValue)) {
        return customMessage || `${fieldLabel} must contain only digits`;
      }
      return null;
    }

    // Alpha() or Alpha("message") - only letters allowed
    const alphaMatch = expression.match(/^Alpha\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (alphaMatch) {
      const customMessage = alphaMatch[1] || alphaMatch[2];
      const strValue = value ? String(value) : '';
      if (strValue && !/^[a-zA-Z]+$/.test(strValue)) {
        return customMessage || `${fieldLabel} must contain only letters`;
      }
      return null;
    }

    // AlphaNumeric() or AlphaNumeric("message") - letters and digits only
    const alphaNumMatch = expression.match(/^AlphaNumeric\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (alphaNumMatch) {
      const customMessage = alphaNumMatch[1] || alphaNumMatch[2];
      const strValue = value ? String(value) : '';
      if (strValue && !/^[a-zA-Z0-9]+$/.test(strValue)) {
        return customMessage || `${fieldLabel} must contain only letters and numbers`;
      }
      return null;
    }

    // Date() or Date("message") - valid date format
    const dateMatch = expression.match(/^Date\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (dateMatch) {
      const customMessage = dateMatch[1] || dateMatch[2];
      const strValue = value ? String(value) : '';
      if (strValue && isNaN(Date.parse(strValue))) {
        return customMessage || `${fieldLabel} must be a valid date`;
      }
      return null;
    }

    // CreditCard() or CreditCard("message") - basic credit card validation (Luhn algorithm)
    const creditCardMatch = expression.match(/^CreditCard\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (creditCardMatch) {
      const customMessage = creditCardMatch[1] || creditCardMatch[2];
      const strValue = value ? String(value).replace(/[\s-]/g, '') : '';
      if (strValue && !this.isValidCreditCard(strValue)) {
        return customMessage || `${fieldLabel} must be a valid credit card number`;
      }
      return null;
    }

    return null; // Unknown validation expression
  }

  // Luhn algorithm for credit card validation
  private isValidCreditCard(cardNumber: string): boolean {
    if (!/^\d{13,19}$/.test(cardNumber)) return false;
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  private evaluateCondition(condition: string): any {
    // Simple condition parser for expressions like: fieldName > 0, fieldA = fieldB, etc.
    // Support operators: =, !=, >, <, >=, <=, AND, OR

    // Handle OR first (lower precedence)
    if (/\s+OR\s+/i.test(condition)) {
      const parts = condition.split(/\s+OR\s+/i);
      for (const part of parts) {
        if (this.evaluateCondition(part.trim())) return true;
      }
      return false;
    }

    // Handle AND
    if (/\s+AND\s+/i.test(condition)) {
      const parts = condition.split(/\s+AND\s+/i);
      for (const part of parts) {
        if (!this.evaluateCondition(part.trim())) return false;
      }
      return true;
    }

    // Parse comparison operators
    const comparisonMatch = condition.match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
    if (comparisonMatch) {
      const leftExpr = comparisonMatch[1].trim();
      const operator = comparisonMatch[2];
      const rightExpr = comparisonMatch[3].trim();

      const leftValue = this.resolveValue(leftExpr);
      const rightValue = this.resolveValue(rightExpr);

      switch (operator) {
        case '=':
          return leftValue == rightValue;
        case '!=':
          return leftValue != rightValue;
        case '>':
          return Number(leftValue) > Number(rightValue);
        case '<':
          return Number(leftValue) < Number(rightValue);
        case '>=':
          return Number(leftValue) >= Number(rightValue);
        case '<=':
          return Number(leftValue) <= Number(rightValue);
      }
    }

    // If no operator, just resolve the value
    const resolved = this.resolveValue(condition);
    return resolved;
  }

  private resolveValue(expr: string): any {
    const trimmed = expr.trim();

    // Handle quoted strings
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Handle numbers
    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }

    // Handle boolean literals
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Check if it's a function expression - evaluate using the function library
    if (this.isFunctionExpression(trimmed)) {
      return this.evaluateFunction(trimmed, 'TEXT');
    }

    // Try to get form field value
    const control = this.form.get(trimmed);
    if (control) {
      return control.value;
    }

    // Check if it's a nested expression with arithmetic or functions
    if (this.containsOperatorsOrFunctions(trimmed)) {
      return this.evaluateArithmeticExpression(trimmed);
    }

    // Return as string
    return trimmed;
  }

  private containsOperatorsOrFunctions(expr: string): boolean {
    // Check for arithmetic operators (not comparison operators)
    if (/[+\-*\/]/.test(expr)) return true;
    // Check for function-like patterns
    if (/[A-Z_]+\(/i.test(expr)) return true;
    return false;
  }

  private evaluateArithmeticExpression(expr: string): any {
    // Replace field references with their values
    let processedExpr = expr;

    // Find all field references (words that aren't numbers or operators)
    const fieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;
    const replacements: { field: string; value: any }[] = [];

    while ((match = fieldPattern.exec(expr)) !== null) {
      const fieldName = match[1];
      // Skip if it's a function name or keyword
      if (this.isFunctionExpression(fieldName) ||
          ['AND', 'OR', 'TRUE', 'FALSE'].includes(fieldName.toUpperCase())) {
        continue;
      }
      const control = this.form.get(fieldName);
      if (control) {
        replacements.push({ field: fieldName, value: control.value ?? 0 });
      }
    }

    // Replace field names with values
    for (const r of replacements) {
      const value = typeof r.value === 'number' ? r.value : (parseFloat(r.value) || 0);
      processedExpr = processedExpr.replace(new RegExp(`\\b${r.field}\\b`, 'g'), value.toString());
    }

    // Evaluate any function calls in the expression
    const funcPattern = /([A-Z_]+)\(([^()]*)\)/gi;
    while (funcPattern.test(processedExpr)) {
      processedExpr = processedExpr.replace(funcPattern, (match) => {
        return this.evaluateFunction(match, 'NUMBER').toString();
      });
    }

    // Try to evaluate the arithmetic expression
    try {
      // Safe evaluation of arithmetic expressions
      const result = Function('"use strict"; return (' + processedExpr + ')')();
      return result;
    } catch {
      return processedExpr;
    }
  }

  private checkUniqueField(fieldName: string, value: string, errorMessage: string) {
    const cacheKey = `${fieldName}:${value}`;

    this.workflowService.validateUniqueField(
      this.workflowCode,
      fieldName,
      value,
      this.instanceId || undefined
    ).subscribe({
      next: (res) => {
        this.pendingUniqueChecks.delete(cacheKey);
        const isUnique = res.data;
        this.uniqueCheckCache.set(cacheKey, isUnique);

        const control = this.form.get(fieldName);
        if (!isUnique) {
          this.validationErrors[fieldName] = errorMessage;
          if (control) {
            control.setErrors({ ...control.errors, customValidation: errorMessage });
            control.markAsTouched();
          }
        } else {
          // Re-evaluate other validations for this field
          const field = this.fields.find(f => f.name === fieldName);
          if (field?.validation) {
            // Check if there are other validation errors (non-unique)
            const otherError = this.evaluateNonUniqueValidations(field);
            this.validationErrors[fieldName] = otherError;
            if (control) {
              if (otherError) {
                control.setErrors({ ...control.errors, customValidation: otherError });
                control.markAsTouched();
              } else if (control.errors) {
                const { customValidation, ...otherErrors } = control.errors;
                control.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
              }
            }
          } else {
            this.validationErrors[fieldName] = null;
            if (control && control.errors) {
              const { customValidation, ...otherErrors } = control.errors;
              control.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
            }
          }
        }
        // Trigger change detection to update the view after async check
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingUniqueChecks.delete(cacheKey);
        // On error, assume unique to not block submission
        this.uniqueCheckCache.set(cacheKey, true);
      }
    });
  }

  private evaluateNonUniqueValidations(field: WorkflowField): string | null {
    const expression = field.validation;
    if (!expression) return null;

    try {
      const parts = expression.split(/\s+AND\s+/i);
      for (const part of parts) {
        const trimmed = part.trim();
        // Skip Unique() validations
        if (/^Unique\(/i.test(trimmed)) continue;
        const error = this.evaluateSingleValidation(trimmed, field);
        if (error) return error;
      }
      return null;
    } catch {
      return null;
    }
  }

  private recalculateField(fieldName: string, config: { expression: string; fieldType: string; dependencies: string[] }) {
    let newValue = this.evaluateFunction(config.expression, config.fieldType);

    // Type-specific conversions
    if (config.fieldType === 'CHECKBOX') {
      newValue = newValue === 'true' || newValue === true || false;
    } else if (config.fieldType === 'NUMBER' || config.fieldType === 'CURRENCY') {
      newValue = newValue ? Number(newValue) : null;
    } else if ((config.fieldType === 'DATE' || config.fieldType === 'DATETIME') && !(newValue instanceof Date)) {
      newValue = newValue ? new Date(newValue) : null;
    }

    // Update the form control value without emitting to avoid loops
    const control = this.form.get(fieldName);
    if (control && control.value !== newValue) {
      control.setValue(newValue, { emitEvent: false });
    }
  }

  getUngroupedFields(): WorkflowField[] {
    return this.fields.filter(f => !f.fieldGroupId && !(f.hidden || f.isHidden));
  }

  getFieldsInGroup(groupId: string): WorkflowField[] {
    const gid = groupId?.toString();

    // In multi-step mode, also filter by screenId
    if (this.isMultiStep) {
      const screenId = this.currentScreen?.id?.toString();
      const isFirstScreen = this.currentScreenIndex === 0;

      return this.fields.filter(f => {
        if (f.fieldGroupId?.toString() !== gid || f.hidden || f.isHidden) {
          return false;
        }
        const fieldScreenId = f.screenId?.toString();
        // Field matches if: its screenId matches current screen OR (first screen AND field has no screenId)
        return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
      });
    }

    return this.fields.filter(f => f.fieldGroupId?.toString() === gid && !(f.hidden || f.isHidden));
  }

  // Multi-step screen navigation
  get isMultiStep(): boolean {
    return this.screens.length > 1;
  }

  get isFirstScreen(): boolean {
    return this.currentScreenIndex === 0;
  }

  get isLastScreen(): boolean {
    return this.currentScreenIndex === this.screens.length - 1;
  }

  get currentScreen(): Screen | null {
    return this.screens[this.currentScreenIndex] || null;
  }

  getUngroupedFieldsOnScreen(): WorkflowField[] {
    if (!this.isMultiStep) {
      return this.getUngroupedFields();
    }
    const screenId = this.currentScreen?.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    return this.fields.filter(f => {
      if (f.fieldGroupId || f.hidden || f.isHidden) {
        return false;
      }
      const fieldScreenId = f.screenId?.toString();
      // Field matches if: its screenId matches current screen OR (first screen AND field has no screenId)
      return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
    });
  }

  getFieldGroupsOnScreen(): FieldGroup[] {
    if (!this.isMultiStep) {
      return this.fieldGroups;
    }
    const screenId = this.currentScreen?.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    return this.fieldGroups.filter(g => {
      const groupScreenId = g.screenId?.toString();
      return groupScreenId === screenId || (isFirstScreen && !groupScreenId);
    });
  }

  goToNextScreen(): void {
    if (this.validateCurrentScreen()) {
      if (this.currentScreenIndex < this.screens.length - 1) {
        this.currentScreenIndex++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  goToPreviousScreen(): void {
    if (this.currentScreenIndex > 0) {
      this.currentScreenIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToScreen(index: number): void {
    // Only allow going to screens that have been completed (or current/previous)
    if (index <= this.currentScreenIndex) {
      this.currentScreenIndex = index;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateCurrentScreen(): boolean {
    if (!this.isMultiStep || !this.currentScreen) {
      return true;
    }

    const screenId = this.currentScreen.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    const fieldsOnScreen = this.fields.filter(f => {
      const fieldScreenId = f.screenId?.toString();
      return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
    });

    let isValid = true;
    fieldsOnScreen.forEach(field => {
      const control = this.form.get(field.name);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      this.snackBar.open('Please fill in all required fields on this screen', 'Close', { duration: 3000 });
    }

    return isValid;
  }

  isFieldReadonly(field: WorkflowField): boolean {
    return field.readOnly || field.isReadonly || false;
  }

  /**
   * Check if a field should be marked as required (has required property or Required() validation)
   */
  isFieldRequired(field: WorkflowField): boolean {
    if (field.required) return true;
    if (field.validation) {
      // Check for Required() validation expression
      return /Required\s*\(/i.test(field.validation);
    }
    return false;
  }

  /**
   * Check if a field should be visible based on its visibility expression
   * Returns true by default if no expression or expression is empty/true
   */
  isFieldVisible(field: WorkflowField): boolean {
    const expression = field.visibilityExpression;

    // Default to visible if no expression or empty
    if (!expression || expression.trim() === '' || expression.trim().toLowerCase() === 'true') {
      return true;
    }

    // If expression is explicitly 'false', hide the field
    if (expression.trim().toLowerCase() === 'false') {
      return false;
    }

    try {
      // Evaluate the visibility expression
      return this.evaluateVisibilityExpression(expression);
    } catch (e) {
      console.warn('Error evaluating visibility expression for field', field.name, e);
      return true; // Default to visible on error
    }
  }

  /**
   * Evaluate a visibility expression that may reference other field values
   * Supports: @{fieldName} references, comparison operators, logical operators
   */
  private evaluateVisibilityExpression(expression: string): boolean {
    // Replace field references @{fieldName} with actual values
    let evaluatedExpression = expression.replace(/@\{([^}]+)\}/g, (match, fieldName) => {
      const value = this.form.get(fieldName.trim())?.value;
      if (value === null || value === undefined || value === '') {
        return 'null';
      }
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "\\'")}'`;
      }
      if (typeof value === 'boolean') {
        return value.toString();
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      return `'${String(value)}'`;
    });

    // Safe evaluation of comparison expressions
    // Supported operators: ==, !=, >, <, >=, <=, &&, ||, !
    try {
      // Simple expression patterns
      // Check for common patterns first

      // Pattern: 'value1' == 'value2' or value1 == value2
      const eqMatch = evaluatedExpression.match(/^['"]?([^'"=!<>]+)['"]?\s*(==|!=|===|!==)\s*['"]?([^'"]+)['"]?$/);
      if (eqMatch) {
        const left = eqMatch[1].trim();
        const op = eqMatch[2];
        const right = eqMatch[3].trim();
        if (op === '==' || op === '===') {
          return left === right;
        } else {
          return left !== right;
        }
      }

      // Pattern: value > number or value < number
      const compMatch = evaluatedExpression.match(/^['"]?([^'"<>=!]+)['"]?\s*(>=|<=|>|<)\s*['"]?([^'"]+)['"]?$/);
      if (compMatch) {
        const left = parseFloat(compMatch[1].trim());
        const op = compMatch[2];
        const right = parseFloat(compMatch[3].trim());
        if (!isNaN(left) && !isNaN(right)) {
          switch (op) {
            case '>': return left > right;
            case '<': return left < right;
            case '>=': return left >= right;
            case '<=': return left <= right;
          }
        }
      }

      // Pattern with && or ||
      if (evaluatedExpression.includes('&&') || evaluatedExpression.includes('||')) {
        // Split by && and || and evaluate each part
        const parts = evaluatedExpression.split(/\s*(&&|\|\|)\s*/);
        let result = this.evaluateSimpleCondition(parts[0]);

        for (let i = 1; i < parts.length; i += 2) {
          const operator = parts[i];
          const nextCondition = this.evaluateSimpleCondition(parts[i + 1]);

          if (operator === '&&') {
            result = result && nextCondition;
          } else if (operator === '||') {
            result = result || nextCondition;
          }
        }
        return result;
      }

      // Check for NOT operator
      if (evaluatedExpression.trim().startsWith('!')) {
        const inner = evaluatedExpression.trim().substring(1).trim();
        return !this.evaluateSimpleCondition(inner);
      }

      // Default: try to evaluate as simple condition
      return this.evaluateSimpleCondition(evaluatedExpression);
    } catch (e) {
      console.warn('Error in visibility expression evaluation:', e);
      return true;
    }
  }

  private evaluateSimpleCondition(condition: string): boolean {
    condition = condition.trim();

    // Handle parentheses
    if (condition.startsWith('(') && condition.endsWith(')')) {
      condition = condition.slice(1, -1).trim();
    }

    // Check for null comparisons
    if (condition === 'null' || condition === "''" || condition === '""') {
      return false;
    }

    // Check for boolean literals
    if (condition.toLowerCase() === 'true') return true;
    if (condition.toLowerCase() === 'false') return false;

    // Check for equality
    const eqMatch = condition.match(/^['"]?([^'"=!<>]+)['"]?\s*(==|!=|===|!==)\s*['"]?([^'"]+)['"]?$/);
    if (eqMatch) {
      const left = eqMatch[1].trim().replace(/^['"]|['"]$/g, '');
      const op = eqMatch[2];
      const right = eqMatch[3].trim().replace(/^['"]|['"]$/g, '');
      if (op === '==' || op === '===') {
        return left === right;
      } else {
        return left !== right;
      }
    }

    // Check for numeric comparisons
    const compMatch = condition.match(/^['"]?([^'"<>=!]+)['"]?\s*(>=|<=|>|<)\s*['"]?([^'"]+)['"]?$/);
    if (compMatch) {
      const left = parseFloat(compMatch[1].trim());
      const op = compMatch[2];
      const right = parseFloat(compMatch[3].trim());
      if (!isNaN(left) && !isNaN(right)) {
        switch (op) {
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
        }
      }
    }

    // If it's just a value, check if it's truthy
    if (condition !== 'null' && condition !== '' && condition !== '0') {
      return true;
    }

    return false;
  }

  /**
   * Check if a field has a validation error (only shows after submit attempt)
   */
  hasFieldError(field: WorkflowField): boolean {
    // Only show errors after user has attempted to submit
    if (!this.hasAttemptedSubmit) {
      return false;
    }
    const control = this.form.get(field.name);
    const hasControlError = control?.invalid;
    const hasValidationError = !!this.validationErrors[field.name];
    const hasCustomValidation = control?.hasError('customValidation');
    return hasControlError || hasValidationError || !!hasCustomValidation;
  }

  /**
   * Get the error message for a field
   */
  getFieldErrorMessage(field: WorkflowField): string | null {
    const control = this.form.get(field.name);

    // First check custom validation errors (from validation expressions)
    if (this.validationErrors[field.name]) {
      return this.validationErrors[field.name];
    }

    // Check if control has our custom validation error
    if (control?.hasError('customValidation')) {
      return control.getError('customValidation');
    }

    // Then check form control errors
    if (control?.hasError('required')) {
      return `${field.label} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }

    return null;
  }

  /**
   * Custom error state matcher that shows errors when validation fails
   */
  getErrorStateMatcher(field: WorkflowField): ErrorStateMatcher {
    const validationErrors = this.validationErrors;
    return {
      isErrorState: (control: FormControl | null): boolean => {
        if (!control) return false;
        // Show error if:
        // 1. Control has errors and is touched/dirty
        // 2. We have custom validation errors for this field
        const hasValidationError = !!validationErrors[field.name];
        const hasControlError = control.invalid && (control.touched || control.dirty);
        return hasValidationError || hasControlError;
      }
    };
  }

  /**
   * Evaluates function expressions in default values
   * Supports all functions from the Functions tab
   */
  evaluateDefaultValue(value: string | undefined | null, fieldType: string): any {
    if (!value) return '';

    const trimmedValue = value.trim();

    // Check if it's a function call (contains parentheses or matches known function patterns)
    if (this.isFunctionExpression(trimmedValue)) {
      return this.evaluateFunction(trimmedValue, fieldType);
    }

    // Return the original value if it's not a function
    return value;
  }

  private isFunctionExpression(value: string): boolean {
    // Check if the value looks like a function call
    const functionPattern = /^[A-Z_]+\(.*\)$/i;
    const noParenFunctions = ['TODAY', 'NOW', 'CURRENT_USER', 'CURRENT_USER_EMAIL', 'CURRENT_USER_ID',
                               'CURRENT_USERNAME', 'CURRENT_USER_PHONE', 'CURRENT_USER_DEPARTMENT',
                               'CURRENT_USER_STAFFID', 'CURRENT_USER_ROLE', 'CURRENT_USER_SBU',
                               'CURRENT_USER_BRANCH', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_DATETIME',
                               'CURRENT_YEAR', 'CURRENT_MONTH', 'UUID', 'SHORT_UUID', 'TIMESTAMP',
                               'PI', 'E', 'RANDOM', 'WORKFLOW_ID', 'WORKFLOW_NAME', 'INSTANCE_ID',
                               'INSTANCE_STATUS', 'SUBMISSION_DATE', 'SUBMITTER_NAME', 'SUBMITTER_EMAIL',
                               'APPROVAL_LEVEL', 'APPROVER_NAME', 'ENVIRONMENT', 'VERSION', 'LOCALE',
                               'TIMEZONE', 'BROWSER', 'PLATFORM', 'IS_MOBILE', 'SCREEN_WIDTH', 'SCREEN_HEIGHT'];
    return functionPattern.test(value) || noParenFunctions.includes(value.toUpperCase());
  }

  private evaluateFunction(expression: string, fieldType: string): any {
    const currentUser = this.authService.currentUser;
    const upperExpr = expression.toUpperCase().trim();
    const upperFieldType = (fieldType || '').toUpperCase();

    // Extract function name and arguments
    const match = expression.match(/^([A-Z_]+)\((.*)\)$/i);
    const funcName = match ? match[1].toUpperCase() : upperExpr;
    const argsStr = match ? match[2] : '';
    const args = argsStr ? this.parseArgs(argsStr) : [];

    // Helper to get numeric value
    const toNum = (v: any) => parseFloat(v) || 0;
    const toInt = (v: any) => parseInt(v) || 0;
    const toStr = (v: any) => String(v ?? '');
    const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;
    const toDate = (v: any) => v instanceof Date ? v : new Date(v);

    switch (funcName) {
      // ==================== STRING FUNCTIONS ====================
      case 'UPPER':
        return toStr(args[0]).toUpperCase();
      case 'LOWER':
        return toStr(args[0]).toLowerCase();
      case 'TRIM':
        return toStr(args[0]).trim();
      case 'TRIM_LEFT':
        return toStr(args[0]).trimStart();
      case 'TRIM_RIGHT':
        return toStr(args[0]).trimEnd();
      case 'CONCAT':
        return args.join('');
      case 'LEFT':
        return toStr(args[0]).substring(0, toInt(args[1]));
      case 'RIGHT': {
        const s = toStr(args[0]);
        return s.substring(s.length - toInt(args[1]));
      }
      case 'SUBSTRING':
        return toStr(args[0]).substring(toInt(args[1]), toInt(args[1]) + toInt(args[2]));
      case 'LENGTH':
        return toStr(args[0]).length.toString();
      case 'REPLACE':
        return toStr(args[0]).split(toStr(args[1])).join(toStr(args[2]));
      case 'REPLACE_FIRST':
        return toStr(args[0]).replace(toStr(args[1]), toStr(args[2]));
      case 'CONTAINS':
        return toStr(args[0]).includes(toStr(args[1])).toString();
      case 'CONTAINS_IGNORE_CASE':
        return toStr(args[0]).toLowerCase().includes(toStr(args[1]).toLowerCase()).toString();
      case 'STARTS_WITH':
        return toStr(args[0]).startsWith(toStr(args[1])).toString();
      case 'ENDS_WITH':
        return toStr(args[0]).endsWith(toStr(args[1])).toString();
      case 'CAPITALIZE':
        return toStr(args[0]).charAt(0).toUpperCase() + toStr(args[0]).slice(1).toLowerCase();
      case 'TITLE_CASE':
        return toStr(args[0]).replace(/\b\w/g, c => c.toUpperCase());
      case 'SENTENCE_CASE':
        return toStr(args[0]).replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
      case 'REVERSE':
        return toStr(args[0]).split('').reverse().join('');
      case 'REPEAT':
        return toStr(args[0]).repeat(toInt(args[1]));
      case 'PAD_LEFT':
        return toStr(args[0]).padStart(toInt(args[1]), toStr(args[2]) || ' ');
      case 'PAD_RIGHT':
        return toStr(args[0]).padEnd(toInt(args[1]), toStr(args[2]) || ' ');
      case 'WORD_COUNT':
        return toStr(args[0]).trim().split(/\s+/).filter(w => w).length.toString();
      case 'CHAR_AT':
        return toStr(args[0]).charAt(toInt(args[1]));
      case 'INDEX_OF':
        return toStr(args[0]).indexOf(toStr(args[1])).toString();
      case 'LAST_INDEX_OF':
        return toStr(args[0]).lastIndexOf(toStr(args[1])).toString();
      case 'SPLIT':
        return JSON.stringify(toStr(args[0]).split(toStr(args[1])));
      case 'JOIN':
        try { return JSON.parse(toStr(args[0])).join(toStr(args[1])); } catch { return args[0]; }
      case 'INITIALS':
        return toStr(args[0]).split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('');
      case 'SLUG':
        return toStr(args[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      case 'CLEAN':
        return toStr(args[0]).replace(/[^\x20-\x7E]/g, '');
      case 'REMOVE_SPACES':
        return toStr(args[0]).replace(/\s/g, '');
      case 'COLLAPSE_SPACES':
        return toStr(args[0]).replace(/\s+/g, ' ');
      case 'EXTRACT_NUMBERS':
        return toStr(args[0]).replace(/[^0-9]/g, '');
      case 'EXTRACT_LETTERS':
        return toStr(args[0]).replace(/[^a-zA-Z]/g, '');
      case 'EXTRACT_ALPHANUMERIC':
        return toStr(args[0]).replace(/[^a-zA-Z0-9]/g, '');
      case 'MASK': {
        const s = toStr(args[0]), start = toInt(args[1]), end = toInt(args[2]), char = toStr(args[3]) || '*';
        const actualEnd = end < 0 ? s.length + end : end;
        return s.substring(0, start) + char.repeat(actualEnd - start) + s.substring(actualEnd);
      }
      case 'MASK_EMAIL': {
        const email = toStr(args[0]);
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return local.charAt(0) + '***@' + domain;
      }
      case 'MASK_PHONE': {
        const phone = toStr(args[0]).replace(/\D/g, '');
        return phone.length > 4 ? '*'.repeat(phone.length - 4) + phone.slice(-4) : phone;
      }
      case 'FORMAT_PHONE': {
        const phone = toStr(args[0]).replace(/\D/g, '');
        const fmt = toStr(args[1]).toUpperCase();
        if (fmt === 'US' && phone.length === 10) return `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
        if (fmt === 'INTL' && phone.length >= 10) return `+${phone.slice(0,-10)} ${phone.slice(-10,-7)} ${phone.slice(-7,-4)} ${phone.slice(-4)}`;
        return phone;
      }
      case 'ENCODE_HTML':
        return toStr(args[0]).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
      case 'DECODE_HTML':
        return toStr(args[0]).replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[m] || m));
      case 'WRAP':
        return toStr(args[1]) + toStr(args[0]) + toStr(args[2]);
      case 'TRUNCATE': {
        const s = toStr(args[0]), len = toInt(args[1]), suffix = toStr(args[2]) || '...';
        return s.length > len ? s.substring(0, len - suffix.length) + suffix : s;
      }
      case 'REGEX_MATCH':
        try { return new RegExp(toStr(args[1])).test(toStr(args[0])).toString(); } catch { return 'false'; }
      case 'REGEX_EXTRACT':
        try { const m = toStr(args[0]).match(new RegExp(toStr(args[1]))); return m ? m[0] : ''; } catch { return ''; }
      case 'REGEX_REPLACE':
        try { return toStr(args[0]).replace(new RegExp(toStr(args[1]), 'g'), toStr(args[2])); } catch { return args[0]; }

      // ==================== NUMBER FUNCTIONS ====================
      case 'SUM':
        return args.reduce((a, b) => a + toNum(b), 0).toString();
      case 'SUBTRACT':
        return (toNum(args[0]) - toNum(args[1])).toString();
      case 'MULTIPLY':
        return (toNum(args[0]) * toNum(args[1])).toString();
      case 'DIVIDE':
        return toNum(args[1]) === 0 ? '0' : (toNum(args[0]) / toNum(args[1])).toString();
      case 'ROUND':
        return toNum(args[0]).toFixed(toInt(args[1]));
      case 'ROUND_UP':
        const factor1 = Math.pow(10, toInt(args[1]));
        return (Math.ceil(toNum(args[0]) * factor1) / factor1).toString();
      case 'ROUND_DOWN':
        const factor2 = Math.pow(10, toInt(args[1]));
        return (Math.floor(toNum(args[0]) * factor2) / factor2).toString();
      case 'FLOOR':
        return Math.floor(toNum(args[0])).toString();
      case 'CEIL':
        return Math.ceil(toNum(args[0])).toString();
      case 'TRUNC':
        return Math.trunc(toNum(args[0])).toString();
      case 'ABS':
        return Math.abs(toNum(args[0])).toString();
      case 'SIGN':
        return Math.sign(toNum(args[0])).toString();
      case 'NEGATE':
        return (-toNum(args[0])).toString();
      case 'MIN':
        return Math.min(...args.map(toNum)).toString();
      case 'MAX':
        return Math.max(...args.map(toNum)).toString();
      case 'AVERAGE': {
        const nums = args.map(toNum);
        return (nums.reduce((a, b) => a + b, 0) / nums.length).toString();
      }
      case 'MEDIAN': {
        const sorted = args.map(toNum).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return (sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toString();
      }
      case 'MODE': {
        const counts: Record<string, number> = {};
        args.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      }
      case 'COUNT':
        return args.filter(a => a !== '' && a !== null && a !== undefined).length.toString();
      case 'PRODUCT':
        return args.reduce((a, b) => a * toNum(b), 1).toString();
      case 'PERCENTAGE':
        return toNum(args[1]) === 0 ? '0' : ((toNum(args[0]) / toNum(args[1])) * 100).toString();
      case 'PERCENT_OF':
        return ((toNum(args[0]) * toNum(args[1])) / 100).toString();
      case 'PERCENT_CHANGE':
        return toNum(args[0]) === 0 ? '0' : (((toNum(args[1]) - toNum(args[0])) / toNum(args[0])) * 100).toString();
      case 'MOD':
        return (toNum(args[0]) % toNum(args[1])).toString();
      case 'POWER':
        return Math.pow(toNum(args[0]), toNum(args[1])).toString();
      case 'SQRT':
        return Math.sqrt(toNum(args[0])).toString();
      case 'CBRT':
        return Math.cbrt(toNum(args[0])).toString();
      case 'LOG':
        return Math.log(toNum(args[0])).toString();
      case 'LOG10':
        return Math.log10(toNum(args[0])).toString();
      case 'LOG2':
        return Math.log2(toNum(args[0])).toString();
      case 'EXP':
        return Math.exp(toNum(args[0])).toString();
      case 'FACTORIAL': {
        let n = toInt(args[0]), result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result.toString();
      }
      case 'GCD': {
        let a = Math.abs(toInt(args[0])), b = Math.abs(toInt(args[1]));
        while (b) { [a, b] = [b, a % b]; }
        return a.toString();
      }
      case 'LCM': {
        let a = Math.abs(toInt(args[0])), b = Math.abs(toInt(args[1]));
        let gcd = a, temp = b;
        while (temp) { [gcd, temp] = [temp, gcd % temp]; }
        return ((a * b) / gcd).toString();
      }
      case 'RANDOM':
        return Math.random().toString();
      case 'RANDOM_INT':
        return (Math.floor(Math.random() * (toInt(args[1]) - toInt(args[0]) + 1)) + toInt(args[0])).toString();
      case 'CLAMP':
        return Math.min(Math.max(toNum(args[0]), toNum(args[1])), toNum(args[2])).toString();
      case 'INTERPOLATE':
        return (toNum(args[0]) + (toNum(args[1]) - toNum(args[0])) * toNum(args[2])).toString();
      case 'MAP_RANGE': {
        const val = toNum(args[0]), inMin = toNum(args[1]), inMax = toNum(args[2]), outMin = toNum(args[3]), outMax = toNum(args[4]);
        return (((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin).toString();
      }
      case 'SIN':
        return Math.sin(toNum(args[0])).toString();
      case 'COS':
        return Math.cos(toNum(args[0])).toString();
      case 'TAN':
        return Math.tan(toNum(args[0])).toString();
      case 'DEGREES':
        return (toNum(args[0]) * 180 / Math.PI).toString();
      case 'RADIANS':
        return (toNum(args[0]) * Math.PI / 180).toString();
      case 'PI':
        return Math.PI.toString();
      case 'E':
        return Math.E.toString();
      case 'VARIANCE': {
        const nums = args.map(toNum);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        return (nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length).toString();
      }
      case 'STDEV': {
        const nums = args.map(toNum);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        return Math.sqrt(nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length).toString();
      }
      case 'RANGE': {
        const nums = args.map(toNum);
        return (Math.max(...nums) - Math.min(...nums)).toString();
      }
      case 'COMPOUND_INTEREST':
        return (toNum(args[0]) * Math.pow(1 + toNum(args[1]), toNum(args[2]))).toString();
      case 'SIMPLE_INTEREST':
        return (toNum(args[0]) * (1 + toNum(args[1]) * toNum(args[2]))).toString();
      case 'PMT': {
        const rate = toNum(args[0]), nper = toNum(args[1]), pv = toNum(args[2]);
        return rate === 0 ? (pv / nper).toString() : (pv * rate / (1 - Math.pow(1 + rate, -nper))).toString();
      }
      case 'FV':
        return (toNum(args[2]) * ((Math.pow(1 + toNum(args[0]), toNum(args[1])) - 1) / toNum(args[0]))).toString();
      case 'PV':
        return (toNum(args[2]) * ((1 - Math.pow(1 + toNum(args[0]), -toNum(args[1]))) / toNum(args[0]))).toString();
      case 'FORMAT_NUMBER': {
        const n = toNum(args[0]), d = toInt(args[1]);
        return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
      }
      case 'FORMAT_PERCENTAGE':
        return toNum(args[0]).toFixed(toInt(args[1])) + '%';
      case 'FORMAT_BYTES': {
        const bytes = toNum(args[0]);
        if (bytes === 0) return '0 Bytes';
        const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
      }
      case 'FORMAT_ORDINAL': {
        const n = toInt(args[0]);
        const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      }
      case 'ROMAN': {
        let num = toInt(args[0]), result = '';
        const map: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
        for (const [val, sym] of map) { while (num >= val) { result += sym; num -= val; } }
        return result;
      }
      case 'HEX':
        return toInt(args[0]).toString(16).toUpperCase();
      case 'BIN':
        return toInt(args[0]).toString(2);
      case 'OCT':
        return toInt(args[0]).toString(8);
      case 'PARSE_INT':
        return parseInt(toStr(args[0]), toInt(args[1]) || 10).toString();

      // ==================== DATE FUNCTIONS ====================
      case 'TODAY':
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? new Date() : this.formatDate(new Date());
      case 'NOW':
        return upperFieldType === 'DATETIME' ? new Date() : this.formatDateTime(new Date());
      case 'TIMESTAMP':
        return Date.now().toString();
      case 'DATE': {
        const d = new Date(toInt(args[0]), toInt(args[1]) - 1, toInt(args[2]));
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'DATETIME': {
        const d = new Date(toInt(args[0]), toInt(args[1]) - 1, toInt(args[2]), toInt(args[3]), toInt(args[4]), toInt(args[5]));
        return upperFieldType === 'DATETIME' ? d : this.formatDateTime(d);
      }
      case 'DATE_FORMAT': {
        const d = toDate(args[0]), fmt = toStr(args[1]);
        return this.formatDateWithPattern(d, fmt);
      }
      case 'DATE_PARSE':
        return new Date(toStr(args[0])).toISOString();
      case 'DATE_ADD': {
        const d = toDate(args[0]), n = toInt(args[1]), unit = toStr(args[2]).toLowerCase();
        return this.addToDate(d, n, unit);
      }
      case 'DATE_SUBTRACT': {
        const d = toDate(args[0]), n = toInt(args[1]), unit = toStr(args[2]).toLowerCase();
        return this.addToDate(d, -n, unit);
      }
      case 'DATE_DIFF': {
        const a = toDate(args[0]), b = toDate(args[1]), unit = toStr(args[2]).toLowerCase();
        return this.dateDiff(a, b, unit);
      }
      case 'AGE': {
        const birth = toDate(args[0]), today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
        return age.toString();
      }
      case 'AGE_DETAILED': {
        const birth = toDate(args[0]), today = new Date();
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();
        if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
        if (months < 0) { years--; months += 12; }
        return `${years} years, ${months} months, ${days} days`;
      }
      case 'YEAR':
        return args[0] ? toDate(args[0]).getFullYear().toString() : new Date().getFullYear().toString();
      case 'MONTH':
        return args[0] ? (toDate(args[0]).getMonth() + 1).toString() : (new Date().getMonth() + 1).toString();
      case 'DAY':
        return args[0] ? toDate(args[0]).getDate().toString() : new Date().getDate().toString();
      case 'HOUR':
        return args[0] ? toDate(args[0]).getHours().toString() : new Date().getHours().toString();
      case 'MINUTE':
        return args[0] ? toDate(args[0]).getMinutes().toString() : new Date().getMinutes().toString();
      case 'SECOND':
        return args[0] ? toDate(args[0]).getSeconds().toString() : new Date().getSeconds().toString();
      case 'MILLISECOND':
        return args[0] ? toDate(args[0]).getMilliseconds().toString() : new Date().getMilliseconds().toString();
      case 'WEEKDAY': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return (d.getDay() || 7).toString();
      }
      case 'WEEKDAY_NAME': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
      }
      case 'WEEKDAY_SHORT': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      }
      case 'WEEK_NUMBER': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const oneJan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7).toString();
      }
      case 'QUARTER': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return (Math.floor(d.getMonth() / 3) + 1).toString();
      }
      case 'MONTH_NAME': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];
      }
      case 'MONTH_SHORT': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
      }
      case 'DAY_OF_YEAR': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const start = new Date(d.getFullYear(), 0, 0);
        return Math.floor((d.getTime() - start.getTime()) / 86400000).toString();
      }
      case 'DAYS_IN_MONTH': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate().toString();
      }
      case 'DAYS_IN_YEAR': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const year = d.getFullYear();
        return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365).toString();
      }
      case 'IS_LEAP_YEAR': {
        const year = args[0] ? toDate(args[0]).getFullYear() : new Date().getFullYear();
        return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0).toString();
      }
      case 'START_OF_DAY': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setHours(0, 0, 0, 0);
        return upperFieldType === 'DATETIME' ? d : this.formatDateTime(d);
      }
      case 'END_OF_DAY': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setHours(23, 59, 59, 999);
        return upperFieldType === 'DATETIME' ? d : this.formatDateTime(d);
      }
      case 'START_OF_WEEK': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'END_OF_WEEK': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        const day = d.getDay() || 7;
        d.setDate(d.getDate() + (7 - day));
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'START_OF_MONTH': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setDate(1);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'END_OF_MONTH': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(d.getMonth() + 1, 0);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'START_OF_QUARTER': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'END_OF_QUARTER': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3, 0);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'START_OF_YEAR': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(0, 1);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'END_OF_YEAR': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(11, 31);
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'IS_WEEKEND': {
        const day = (args[0] ? toDate(args[0]) : new Date()).getDay();
        return (day === 0 || day === 6).toString();
      }
      case 'IS_WEEKDAY': {
        const day = (args[0] ? toDate(args[0]) : new Date()).getDay();
        return (day !== 0 && day !== 6).toString();
      }
      case 'IS_TODAY': {
        const d = args[0] ? toDate(args[0]) : new Date(), today = new Date();
        return (d.toDateString() === today.toDateString()).toString();
      }
      case 'IS_YESTERDAY': {
        const d = args[0] ? toDate(args[0]) : new Date(), yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return (d.toDateString() === yesterday.toDateString()).toString();
      }
      case 'IS_TOMORROW': {
        const d = args[0] ? toDate(args[0]) : new Date(), tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return (d.toDateString() === tomorrow.toDateString()).toString();
      }
      case 'IS_PAST':
        return ((args[0] ? toDate(args[0]) : new Date()) < new Date()).toString();
      case 'IS_FUTURE':
        return ((args[0] ? toDate(args[0]) : new Date()) > new Date()).toString();
      case 'IS_THIS_WEEK': {
        const d = args[0] ? toDate(args[0]) : new Date(), now = new Date();
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - (now.getDay() || 7) + 1);
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
        return (d >= startOfWeek && d <= endOfWeek).toString();
      }
      case 'IS_THIS_MONTH': {
        const d = args[0] ? toDate(args[0]) : new Date(), now = new Date();
        return (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()).toString();
      }
      case 'IS_THIS_YEAR': {
        const d = args[0] ? toDate(args[0]) : new Date();
        return (d.getFullYear() === new Date().getFullYear()).toString();
      }
      case 'IS_SAME_DAY':
        return (toDate(args[0]).toDateString() === toDate(args[1]).toDateString()).toString();
      case 'IS_BEFORE':
        return (toDate(args[0]) < toDate(args[1])).toString();
      case 'IS_AFTER':
        return (toDate(args[0]) > toDate(args[1])).toString();
      case 'IS_BETWEEN_DATES': {
        const d = toDate(args[0]), start = toDate(args[1]), end = toDate(args[2]);
        return (d >= start && d <= end).toString();
      }
      case 'BUSINESS_DAYS': {
        const start = toDate(args[0]), end = toDate(args[1]);
        let count = 0, current = new Date(start);
        while (current <= end) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) count++;
          current.setDate(current.getDate() + 1);
        }
        return count.toString();
      }
      case 'ADD_BUSINESS_DAYS': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        let remaining = toInt(args[1]);
        while (remaining > 0) {
          d.setDate(d.getDate() + 1);
          if (d.getDay() !== 0 && d.getDay() !== 6) remaining--;
        }
        return upperFieldType === 'DATE' || upperFieldType === 'DATETIME' ? d : this.formatDate(d);
      }
      case 'RELATIVE_TIME': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const diff = Date.now() - d.getTime();
        const abs = Math.abs(diff);
        const future = diff < 0;
        if (abs < 60000) return future ? 'in a few seconds' : 'just now';
        if (abs < 3600000) return `${future ? 'in ' : ''}${Math.floor(abs/60000)} minutes${future ? '' : ' ago'}`;
        if (abs < 86400000) return `${future ? 'in ' : ''}${Math.floor(abs/3600000)} hours${future ? '' : ' ago'}`;
        return `${future ? 'in ' : ''}${Math.floor(abs/86400000)} days${future ? '' : ' ago'}`;
      }
      case 'ISO_STRING':
        return (args[0] ? toDate(args[0]) : new Date()).toISOString();
      case 'CURRENT_DATE':
        return this.formatDate(new Date());
      case 'CURRENT_TIME':
        return new Date().toTimeString().split(' ')[0];
      case 'CURRENT_DATETIME':
        return this.formatDateTime(new Date());
      case 'CURRENT_YEAR':
        return new Date().getFullYear().toString();
      case 'CURRENT_MONTH':
        return (new Date().getMonth() + 1).toString();

      // ==================== BOOLEAN/LOGIC FUNCTIONS ====================
      case 'IF':
        return this.evaluateCondition(args[0]) ? args[1] : args[2];
      case 'IFS': {
        for (let i = 0; i < args.length - 1; i += 2) {
          if (this.evaluateCondition(args[i])) return args[i + 1];
        }
        return args.length % 2 === 1 ? args[args.length - 1] : '';
      }
      case 'SWITCH': {
        const val = args[0];
        for (let i = 1; i < args.length - 1; i += 2) {
          if (val === args[i]) return args[i + 1];
        }
        return args.length % 2 === 0 ? args[args.length - 1] : '';
      }
      case 'AND':
        return args.every(a => toBool(a) || this.evaluateCondition(a)).toString();
      case 'OR':
        return args.some(a => toBool(a) || this.evaluateCondition(a)).toString();
      case 'NOT':
        return (!toBool(args[0])).toString();
      case 'XOR':
        return (toBool(args[0]) !== toBool(args[1])).toString();
      case 'NAND':
        return (!(toBool(args[0]) && toBool(args[1]))).toString();
      case 'NOR':
        return (!(toBool(args[0]) || toBool(args[1]))).toString();
      case 'IS_EMPTY':
        return (!args[0] || toStr(args[0]).trim() === '').toString();
      case 'IS_NOT_EMPTY':
        return (args[0] && toStr(args[0]).trim() !== '').toString();
      case 'IS_NULL':
        return (args[0] === null || args[0] === undefined || args[0] === '').toString();
      case 'IS_NOT_NULL':
        return (args[0] !== null && args[0] !== undefined && args[0] !== '').toString();
      case 'IS_BLANK':
        return (!args[0] || toStr(args[0]).trim() === '').toString();
      case 'IS_TRUE':
        return toBool(args[0]).toString();
      case 'IS_FALSE':
        return (!toBool(args[0])).toString();
      case 'EQUALS':
        return (args[0] === args[1]).toString();
      case 'EQUALS_IGNORE_CASE':
        return (toStr(args[0]).toLowerCase() === toStr(args[1]).toLowerCase()).toString();
      case 'NOT_EQUALS':
        return (args[0] !== args[1]).toString();
      case 'GREATER_THAN':
        return (toNum(args[0]) > toNum(args[1])).toString();
      case 'GREATER_THAN_OR_EQUAL':
        return (toNum(args[0]) >= toNum(args[1])).toString();
      case 'LESS_THAN':
        return (toNum(args[0]) < toNum(args[1])).toString();
      case 'LESS_THAN_OR_EQUAL':
        return (toNum(args[0]) <= toNum(args[1])).toString();
      case 'BETWEEN':
        return (toNum(args[0]) >= toNum(args[1]) && toNum(args[0]) <= toNum(args[2])).toString();
      case 'NOT_BETWEEN':
        return (toNum(args[0]) < toNum(args[1]) || toNum(args[0]) > toNum(args[2])).toString();
      case 'IN': {
        try { const arr = JSON.parse(args[1]); return arr.includes(args[0]).toString(); } catch { return 'false'; }
      }
      case 'NOT_IN': {
        try { const arr = JSON.parse(args[1]); return (!arr.includes(args[0])).toString(); } catch { return 'true'; }
      }
      case 'IS_NUMBER':
        return (!isNaN(parseFloat(args[0])) && isFinite(toNum(args[0]))).toString();
      case 'IS_INTEGER':
        return Number.isInteger(toNum(args[0])).toString();
      case 'IS_DECIMAL':
        return (toNum(args[0]) % 1 !== 0).toString();
      case 'IS_POSITIVE':
        return (toNum(args[0]) > 0).toString();
      case 'IS_NEGATIVE':
        return (toNum(args[0]) < 0).toString();
      case 'IS_ZERO':
        return (toNum(args[0]) === 0).toString();
      case 'IS_EVEN':
        return (toInt(args[0]) % 2 === 0).toString();
      case 'IS_ODD':
        return (toInt(args[0]) % 2 !== 0).toString();
      case 'IS_TEXT':
        return (typeof args[0] === 'string').toString();
      case 'IS_DATE':
        return (!isNaN(new Date(args[0]).getTime())).toString();
      case 'IS_BOOLEAN':
        return (args[0] === 'true' || args[0] === 'false' || typeof args[0] === 'boolean').toString();
      case 'IS_EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toStr(args[0])).toString();
      case 'IS_URL':
        try { new URL(toStr(args[0])); return 'true'; } catch { return 'false'; }
      case 'IS_PHONE':
        return /^[\d\s\-\+\(\)]{7,20}$/.test(toStr(args[0])).toString();
      case 'IS_UUID':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(toStr(args[0])).toString();
      case 'IS_ALPHANUMERIC':
        return /^[a-zA-Z0-9]+$/.test(toStr(args[0])).toString();
      case 'IS_ALPHA':
        return /^[a-zA-Z]+$/.test(toStr(args[0])).toString();
      case 'IS_NUMERIC':
        return /^[0-9]+$/.test(toStr(args[0])).toString();
      case 'IS_UPPERCASE':
        return (toStr(args[0]) === toStr(args[0]).toUpperCase()).toString();
      case 'IS_LOWERCASE':
        return (toStr(args[0]) === toStr(args[0]).toLowerCase()).toString();
      case 'MATCHES_PATTERN':
        try { return new RegExp(toStr(args[1])).test(toStr(args[0])).toString(); } catch { return 'false'; }
      case 'HAS_LENGTH':
        return (toStr(args[0]).length === toInt(args[1])).toString();
      case 'HAS_MIN_LENGTH':
        return (toStr(args[0]).length >= toInt(args[1])).toString();
      case 'HAS_MAX_LENGTH':
        return (toStr(args[0]).length <= toInt(args[1])).toString();

      // ==================== USER/CONTEXT FUNCTIONS ====================
      case 'CURRENT_USER':
        return currentUser?.fullName || '';
      case 'CURRENT_USER_EMAIL':
        return currentUser?.email || '';
      case 'CURRENT_USER_ID':
        return currentUser?.userId || '';
      case 'CURRENT_USERNAME':
        return currentUser?.username || '';
      case 'CURRENT_USER_PHONE':
        return currentUser?.phoneNumber || '';
      case 'CURRENT_USER_DEPARTMENT':
        return currentUser?.department || '';
      case 'CURRENT_USER_STAFFID':
        return currentUser?.staffId || '';
      case 'CURRENT_USER_ROLE':
        return currentUser?.userType || '';
      case 'CURRENT_USER_SBU':
        return currentUser?.sbuIds?.[0] || '';
      case 'CURRENT_USER_BRANCH':
        return currentUser?.branchIds?.[0] || '';

      // ==================== UTILITY FUNCTIONS ====================
      case 'UUID':
        return this.generateUUID();
      case 'SHORT_UUID':
        return this.generateUUID().substring(0, 8);
      case 'NANO_ID': {
        const len = toInt(args[0]) || 21;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
      }
      case 'SEQUENCE': {
        const prefix = toStr(args[0]);
        return prefix + Date.now().toString().slice(-8);
      }
      case 'SEQUENCE_PADDED': {
        const prefix = toStr(args[0]), len = toInt(args[1]) || 6;
        return prefix + Date.now().toString().slice(-len).padStart(len, '0');
      }
      case 'RANDOM_STRING': {
        const len = toInt(args[0]) || 10;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
      }
      case 'RANDOM_CODE': {
        const len = toInt(args[0]) || 6;
        const charset = toStr(args[1]).toUpperCase();
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        if (charset === 'ALPHA') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        else if (charset === 'NUMERIC') chars = '0123456789';
        let result = '';
        for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
      }
      case 'COALESCE':
      case 'DEFAULT':
        return args.find(a => a && toStr(a).trim() !== '') || '';
      case 'NULLIF':
        return args[0] === args[1] ? '' : args[0];
      case 'NVL':
      case 'IFNULL':
        return (args[0] === null || args[0] === undefined || args[0] === '') ? args[1] : args[0];
      case 'FORMAT_CURRENCY': {
        const amount = toNum(args[0]), currency = toStr(args[1]) || 'USD';
        try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
        catch { return amount.toFixed(2); }
      }
      case 'TO_NUMBER':
        return toNum(args[0]).toString();
      case 'TO_TEXT':
        return toStr(args[0]);
      case 'TO_BOOLEAN':
        return toBool(args[0]).toString();
      case 'TO_DATE':
        return this.formatDate(toDate(args[0]));
      case 'TO_ARRAY':
        return JSON.stringify(toStr(args[0]).split(',').map(s => s.trim()));
      case 'TO_JSON':
        try { return JSON.stringify(args[0]); } catch { return ''; }
      case 'FROM_JSON':
        try { return JSON.parse(toStr(args[0])); } catch { return args[0]; }
      case 'FIELD_VALUE': {
        const fieldName = toStr(args[0]);
        return this.getFieldValue(fieldName) || '';
      }
      case 'FIELD_LABEL': {
        const fieldName = toStr(args[0]);
        const field = this.fields.find(f => f.name === fieldName);
        return field?.label || fieldName;
      }
      case 'GET': {
        try {
          const path = toStr(args[1]).split('.');
          let obj = JSON.parse(toStr(args[0]));
          for (const key of path) { obj = obj?.[key]; }
          return obj ?? args[2] ?? '';
        } catch { return args[2] ?? ''; }
      }
      case 'KEYS':
        try { return JSON.stringify(Object.keys(JSON.parse(toStr(args[0])))); } catch { return '[]'; }
      case 'VALUES':
        try { return JSON.stringify(Object.values(JSON.parse(toStr(args[0])))); } catch { return '[]'; }
      case 'ARRAY_LENGTH':
        try { return JSON.parse(toStr(args[0])).length.toString(); } catch { return '0'; }
      case 'ARRAY_FIRST':
        try { return JSON.parse(toStr(args[0]))[0] ?? ''; } catch { return ''; }
      case 'ARRAY_LAST':
        try { const arr = JSON.parse(toStr(args[0])); return arr[arr.length - 1] ?? ''; } catch { return ''; }
      case 'ARRAY_JOIN':
        try { return JSON.parse(toStr(args[0])).join(toStr(args[1])); } catch { return ''; }
      case 'ARRAY_SUM':
        try { return JSON.parse(toStr(args[0])).reduce((a: number, b: any) => a + toNum(b), 0).toString(); } catch { return '0'; }
      case 'ARRAY_AVERAGE':
        try { const arr = JSON.parse(toStr(args[0])); return (arr.reduce((a: number, b: any) => a + toNum(b), 0) / arr.length).toString(); } catch { return '0'; }
      case 'ARRAY_MIN':
        try { return Math.min(...JSON.parse(toStr(args[0])).map(toNum)).toString(); } catch { return '0'; }
      case 'ARRAY_MAX':
        try { return Math.max(...JSON.parse(toStr(args[0])).map(toNum)).toString(); } catch { return '0'; }
      case 'ARRAY_UNIQUE':
        try { return JSON.stringify([...new Set(JSON.parse(toStr(args[0])))]); } catch { return '[]'; }
      case 'ARRAY_REVERSE':
        try { return JSON.stringify(JSON.parse(toStr(args[0])).reverse()); } catch { return '[]'; }
      case 'ARRAY_SORT':
        try {
          const arr = JSON.parse(toStr(args[0]));
          const dir = toStr(args[1]).toUpperCase();
          return JSON.stringify(arr.sort((a: any, b: any) => dir === 'DESC' ? (b > a ? 1 : -1) : (a > b ? 1 : -1)));
        } catch { return '[]'; }
      case 'ARRAY_INCLUDES':
        try { return JSON.parse(toStr(args[0])).includes(args[1]).toString(); } catch { return 'false'; }
      case 'ARRAY_INDEX_OF':
        try { return JSON.parse(toStr(args[0])).indexOf(args[1]).toString(); } catch { return '-1'; }
      case 'TEMPLATE': {
        let template = toStr(args[0]);
        try {
          const data = typeof args[1] === 'object' ? args[1] : JSON.parse(toStr(args[1]));
          return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
        } catch { return template; }
      }
      case 'BASE64_ENCODE':
        try { return btoa(toStr(args[0])); } catch { return ''; }
      case 'BASE64_DECODE':
        try { return atob(toStr(args[0])); } catch { return ''; }
      case 'URL_ENCODE':
        return encodeURIComponent(toStr(args[0]));
      case 'URL_DECODE':
        return decodeURIComponent(toStr(args[0]));
      case 'TRY':
        try { return this.evaluateFunction(toStr(args[0]), fieldType); } catch { return args[1] || ''; }
      case 'TYPEOF':
        return typeof args[0];
      case 'CLONE':
        try { return JSON.stringify(JSON.parse(JSON.stringify(args[0]))); } catch { return args[0]; }
      case 'COMPARE':
        return args[0] > args[1] ? '1' : (args[0] < args[1] ? '-1' : '0');
      case 'EQUALS_DEEP':
        try { return (JSON.stringify(args[0]) === JSON.stringify(args[1])).toString(); } catch { return 'false'; }
      case 'WORKFLOW_ID':
        return this.workflow?.id || '';
      case 'WORKFLOW_NAME':
        return this.workflow?.name || '';
      case 'INSTANCE_ID':
        return this.instanceId || '';
      case 'ENVIRONMENT':
        return 'PROD';
      case 'VERSION':
        return '1.0.0';
      case 'LOCALE':
        return navigator.language || 'en-US';
      case 'TIMEZONE':
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      case 'BROWSER':
        return navigator.userAgent.includes('Chrome') ? 'Chrome' :
               navigator.userAgent.includes('Firefox') ? 'Firefox' :
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown';
      case 'PLATFORM':
        return navigator.platform || 'Unknown';
      case 'IS_MOBILE':
        return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)).toString();
      case 'SCREEN_WIDTH':
        return window.screen.width.toString();
      case 'SCREEN_HEIGHT':
        return window.screen.height.toString();

      default:
        return expression;
    }
  }

  private formatDateWithPattern(date: Date, pattern: string): string {
    if (!date || isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const replacements: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'YY': date.getFullYear().toString().slice(-2),
      'MMMM': ['January','February','March','April','May','June','July','August','September','October','November','December'][date.getMonth()],
      'MMM': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()],
      'MM': pad(date.getMonth() + 1),
      'DD': pad(date.getDate()),
      'ddd': ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()],
      'HH': pad(date.getHours()),
      'mm': pad(date.getMinutes()),
      'ss': pad(date.getSeconds())
    };
    let result = pattern;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }
    return result;
  }

  private addToDate(date: Date, amount: number, unit: string): string {
    const d = new Date(date);
    switch (unit) {
      case 'years': d.setFullYear(d.getFullYear() + amount); break;
      case 'months': d.setMonth(d.getMonth() + amount); break;
      case 'weeks': d.setDate(d.getDate() + amount * 7); break;
      case 'days': d.setDate(d.getDate() + amount); break;
      case 'hours': d.setHours(d.getHours() + amount); break;
      case 'minutes': d.setMinutes(d.getMinutes() + amount); break;
      case 'seconds': d.setSeconds(d.getSeconds() + amount); break;
    }
    return this.formatDate(d);
  }

  private dateDiff(a: Date, b: Date, unit: string): string {
    const diff = Math.abs(b.getTime() - a.getTime());
    switch (unit) {
      case 'years': return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)).toString();
      case 'months': return Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000)).toString();
      case 'weeks': return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)).toString();
      case 'days': return Math.floor(diff / (24 * 60 * 60 * 1000)).toString();
      case 'hours': return Math.floor(diff / (60 * 60 * 1000)).toString();
      case 'minutes': return Math.floor(diff / (60 * 1000)).toString();
      case 'seconds': return Math.floor(diff / 1000).toString();
      default: return Math.floor(diff / (24 * 60 * 60 * 1000)).toString();
    }
  }

  private parseStringArg(argsStr: string, resolveFields: boolean = true): string {
    // Remove quotes from string argument
    const cleaned = argsStr.replace(/^["']|["']$/g, '').trim();

    // If resolveFields is true and it looks like a field name (not quoted), try to get field value
    if (resolveFields && !argsStr.startsWith('"') && !argsStr.startsWith("'")) {
      const fieldValue = this.getFieldValue(cleaned);
      if (fieldValue !== null) {
        return String(fieldValue);
      }
    }

    return cleaned;
  }

  private parseArgs(argsStr: string, resolveFields: boolean = true): string[] {
    // Simple argument parser - splits by comma, handling quoted strings
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (const char of argsStr) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (char === ',' && !inQuotes) {
        args.push(this.resolveArgValue(current.trim(), resolveFields));
        current = '';
      } else {
        current += char;
      }
    }
    if (current) {
      args.push(this.resolveArgValue(current.trim(), resolveFields));
    }
    return args;
  }

  private resolveArgValue(arg: string, resolveFields: boolean): string {
    // If it's a quoted string, just remove quotes
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }
    if (arg.startsWith("'") && arg.endsWith("'")) {
      return arg.slice(1, -1);
    }

    // If resolveFields is true, try to get field value
    if (resolveFields) {
      const fieldValue = this.getFieldValue(arg);
      if (fieldValue !== null) {
        return String(fieldValue);
      }
    }

    return arg;
  }

  private getFieldValue(fieldName: string): any {
    // Check if form exists and field is in the form
    if (!this.form) return null;

    const control = this.form.get(fieldName);
    if (control) {
      return control.value;
    }

    return null;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  onFileSelect(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles[fieldName] = Array.from(input.files);
    }
  }

  // Checkbox group handling
  isCheckboxOptionSelected(fieldName: string, value: string): boolean {
    if (!this.checkboxGroupValues[fieldName]) {
      // Initialize from form control if exists
      const formValue = this.form.get(fieldName)?.value;
      if (formValue) {
        this.checkboxGroupValues[fieldName] = Array.isArray(formValue) ? formValue : formValue.split(',').filter((v: string) => v);
      } else {
        this.checkboxGroupValues[fieldName] = [];
      }
    }
    return this.checkboxGroupValues[fieldName].includes(value);
  }

  onCheckboxGroupChange(fieldName: string, value: string, checked: boolean) {
    if (!this.checkboxGroupValues[fieldName]) {
      this.checkboxGroupValues[fieldName] = [];
    }
    if (checked) {
      if (!this.checkboxGroupValues[fieldName].includes(value)) {
        this.checkboxGroupValues[fieldName].push(value);
      }
    } else {
      this.checkboxGroupValues[fieldName] = this.checkboxGroupValues[fieldName].filter(v => v !== value);
    }
    // Update form control with comma-separated values
    this.form.get(fieldName)?.setValue(this.checkboxGroupValues[fieldName].join(','));
    this.form.get(fieldName)?.markAsTouched();
  }

  // New field type helper methods
  imagePreviews: { [key: string]: string } = {};

  getStarArray(field: any): number[] {
    const max = field.ratingMax || 5;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  getRatingValue(field: any): number {
    const value = this.form.get(field.name)?.value;
    return value ? parseInt(value, 10) : 0;
  }

  setRating(field: any, rating: number): void {
    if (!this.isFieldReadonly(field)) {
      this.form.get(field.name)?.setValue(rating);
      this.form.get(field.name)?.markAsTouched();
    }
  }

  getImagePreview(field: any): string | null {
    return this.imagePreviews[field.name] || null;
  }

  onImageSelect(event: Event, field: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews[field.name] = e.target.result;
        this.form.get(field.name)?.setValue(e.target.result);
        this.form.get(field.name)?.markAsTouched();
      };
      reader.readAsDataURL(file);
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
    // Mark that user has attempted to submit - this enables error display
    this.hasAttemptedSubmit = true;

    // Run validation first
    this.validateAllFields();

    if (this.form.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Check if there are pending unique validations
    if (this.pendingUniqueChecks.size > 0) {
      this.snackBar.open('Please wait for validation checks to complete', 'Close', { duration: 3000 });
      return;
    }

    // Check for custom validation errors
    const hasValidationErrors = Object.values(this.validationErrors).some(error => error !== null);
    if (hasValidationErrors) {
      this.snackBar.open('Please fix validation errors before submitting', 'Close', { duration: 3000 });
      return;
    }

    this.submitForm(false);
  }

  submitForm(isDraft: boolean) {
    this.submitting = true;

    const formData = new FormData();
    formData.append('workflowCode', this.workflowCode);
    formData.append('isDraft', isDraft.toString());

    const fieldValues: Record<string, any> = {};
    this.fields.forEach(field => {
      let value = this.form.value[field.name];
      // For USER fields, extract the user ID if value is a User object
      if (field.type === 'USER' && value && typeof value === 'object' && value.id) {
        value = value.id;
      }
      fieldValues[field.name] = value;
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

    // Use update API if in edit mode
    const apiCall = this.isEditMode && this.instanceId
      ? this.workflowService.updateInstance(this.instanceId, formData)
      : this.workflowService.submitInstance(formData);

    apiCall.subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          const message = this.isEditMode
            ? (isDraft ? 'Draft updated successfully' : 'Submission updated successfully')
            : (isDraft ? 'Draft saved successfully' : 'Submission created successfully');
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.router.navigate(['/workflows', this.workflowCode, 'instances']);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Submission failed', 'Close', { duration: 3000 });
      }
    });
  }

  // User field methods
  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allUsers = res.data;
        }
      },
      error: () => {
        console.error('Failed to load users');
      }
    });
  }

  onUserSearch(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value?.toLowerCase() || '';
    this.userSearchTerms[fieldName] = searchTerm;

    if (!searchTerm) {
      this.filteredUsersMap[fieldName] = [];
      return;
    }

    this.filteredUsersMap[fieldName] = this.allUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      return fullName.includes(searchTerm) ||
             email.includes(searchTerm) ||
             username.includes(searchTerm);
    }).slice(0, 10); // Limit to 10 results
  }

  getFilteredUsers(fieldName: string): User[] {
    return this.filteredUsersMap[fieldName] || [];
  }

  displayUserFn = (user: User | string): string => {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return `${user.firstName} ${user.lastName}`;
  }

  onUserSelected(event: any, fieldName: string) {
    const selectedUser = event.option.value as User;
    // Store the selected user for reference
    this.selectedUsers[fieldName] = selectedUser;
    // Store the user object (ID will be extracted on submit)
    this.form.get(fieldName)?.setValue(selectedUser);
    // Clear the filtered list
    this.filteredUsersMap[fieldName] = [];
    this.userSearchTerms[fieldName] = '';
  }

  getUserFieldValue(fieldName: string): string {
    const value = this.form.get(fieldName)?.value;
    if (!value) return '';
    // If it's a User object, return the ID
    if (typeof value === 'object' && value.id) {
      return value.id;
    }
    // Otherwise return as-is (should be a string ID)
    return value;
  }

  // ========== SIGNATURE FIELD METHODS ==========
  private signatureDrawing: Record<string, boolean> = {};
  private signatureContexts: Record<string, CanvasRenderingContext2D | null> = {};

  startSignature(event: MouseEvent, field: any): void {
    if (this.isFieldReadonly(field)) return;
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.signatureDrawing[field.name] = true;
    this.signatureContexts[field.name] = ctx;

    // Set canvas size if not set
    if (canvas.width !== canvas.offsetWidth) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  drawSignature(event: MouseEvent, field: any): void {
    if (!this.signatureDrawing[field.name] || this.isFieldReadonly(field)) return;
    const ctx = this.signatureContexts[field.name];
    if (!ctx) return;

    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  }

  endSignature(field: any): void {
    if (this.signatureDrawing[field.name]) {
      this.signatureDrawing[field.name] = false;
      // Save signature as base64
      const canvas = document.querySelector(`canvas[data-field="${field.name}"]`) as HTMLCanvasElement;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        this.form.get(field.name)?.setValue(dataUrl);
        this.form.get(field.name)?.markAsTouched();
      }
    }
  }

  startSignatureTouch(event: TouchEvent, field: any): void {
    if (this.isFieldReadonly(field)) return;
    event.preventDefault();
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.signatureDrawing[field.name] = true;
    this.signatureContexts[field.name] = ctx;

    if (canvas.width !== canvas.offsetWidth) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawSignatureTouch(event: TouchEvent, field: any): void {
    if (!this.signatureDrawing[field.name] || this.isFieldReadonly(field)) return;
    event.preventDefault();
    const ctx = this.signatureContexts[field.name];
    if (!ctx) return;

    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  }

  clearSignature(field: any): void {
    const canvas = document.querySelector(`canvas[data-field="${field.name}"]`) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.form.get(field.name)?.setValue('');
      this.form.get(field.name)?.markAsTouched();
    }
  }

  // ========== RICH TEXT FIELD METHODS ==========
  execRichTextCommand(command: string): void {
    document.execCommand(command, false);
  }

  onRichTextInput(event: Event, field: any): void {
    const div = event.target as HTMLDivElement;
    this.form.get(field.name)?.setValue(div.innerHTML);
  }

  onRichTextBlur(event: Event, field: any): void {
    const div = event.target as HTMLDivElement;
    this.form.get(field.name)?.setValue(div.innerHTML);
    this.form.get(field.name)?.markAsTouched();
  }

  getRichTextValue(field: any): string {
    return this.form.get(field.name)?.value || '';
  }

  // ========== ICON PICKER FIELD METHODS ==========
  iconPickerOpen: Record<string, boolean> = {};
  iconSearchText: Record<string, string> = {};

  availableIcons: string[] = [
    'home', 'search', 'settings', 'favorite', 'star', 'check_circle', 'delete', 'edit',
    'add', 'remove', 'close', 'menu', 'more_vert', 'more_horiz', 'refresh', 'sync',
    'visibility', 'visibility_off', 'lock', 'lock_open', 'person', 'people', 'group',
    'email', 'phone', 'chat', 'message', 'notifications', 'alarm', 'schedule', 'event',
    'calendar_today', 'date_range', 'access_time', 'timer', 'hourglass_empty',
    'folder', 'folder_open', 'file_copy', 'attach_file', 'cloud', 'cloud_upload', 'cloud_download',
    'image', 'photo', 'camera', 'videocam', 'mic', 'volume_up', 'music_note',
    'play_arrow', 'pause', 'stop', 'skip_next', 'skip_previous', 'replay',
    'location_on', 'map', 'directions', 'navigation', 'explore', 'public', 'language',
    'shopping_cart', 'store', 'payment', 'credit_card', 'account_balance', 'receipt',
    'work', 'business', 'business_center', 'apartment', 'domain', 'corporate_fare',
    'school', 'science', 'biotech', 'psychology', 'engineering',
    'build', 'construction', 'handyman', 'plumbing', 'electrical_services',
    'computer', 'laptop', 'smartphone', 'tablet', 'desktop_windows', 'devices',
    'wifi', 'bluetooth', 'signal_wifi_4_bar', 'network_check', 'router',
    'code', 'terminal', 'bug_report', 'memory', 'storage', 'dns',
    'security', 'verified_user', 'shield', 'admin_panel_settings', 'policy',
    'analytics', 'bar_chart', 'pie_chart', 'show_chart', 'trending_up', 'trending_down',
    'assessment', 'leaderboard', 'insights', 'query_stats',
    'local_shipping', 'flight', 'train', 'directions_car', 'directions_bus', 'two_wheeler',
    'restaurant', 'local_cafe', 'local_bar', 'fastfood', 'lunch_dining',
    'health_and_safety', 'medical_services', 'vaccines', 'medication', 'healing',
    'pets', 'park', 'nature', 'eco', 'grass', 'forest', 'water_drop',
    'sports_soccer', 'sports_basketball', 'sports_tennis', 'fitness_center', 'pool',
    'thumb_up', 'thumb_down', 'sentiment_satisfied', 'sentiment_dissatisfied', 'mood',
    'lightbulb', 'tips_and_updates', 'help', 'info', 'warning', 'error', 'report'
  ];

  toggleIconPicker(field: any): void {
    if (this.isFieldReadonly(field)) return;
    this.iconPickerOpen[field.name] = !this.iconPickerOpen[field.name];
    if (this.iconPickerOpen[field.name]) {
      this.iconSearchText[field.name] = '';
    }
  }

  isIconPickerOpen(field: any): boolean {
    return this.iconPickerOpen[field.name] || false;
  }

  selectIcon(field: any, icon: string): void {
    this.form.get(field.name)?.setValue(icon);
    this.form.get(field.name)?.markAsTouched();
    this.iconPickerOpen[field.name] = false;
  }

  getSelectedIcon(field: any): string {
    return this.form.get(field.name)?.value || 'help_outline';
  }

  getFilteredIcons(field: any): string[] {
    const search = (this.iconSearchText[field.name] || '').toLowerCase();
    if (!search) return this.availableIcons;
    return this.availableIcons.filter(icon => icon.includes(search));
  }

  onIconSearch(event: Event, field: any): void {
    const input = event.target as HTMLInputElement;
    this.iconSearchText[field.name] = input.value;
  }

  // ========== BARCODE FIELD METHODS ==========
  scanBarcode(field: any): void {
    // In a real implementation, this would use a barcode scanning library
    // For now, show an alert about the feature
    this.snackBar.open('Barcode scanning requires camera access. Please enter the code manually.', 'OK', { duration: 5000 });
  }

  // ========== LOCATION FIELD METHODS ==========
  private gettingLocation: Record<string, boolean> = {};
  private locationData: Record<string, { lat: number | null; lng: number | null }> = {};

  getLocationLat(field: any): number | null {
    const value = this.form.get(field.name)?.value;
    if (value && typeof value === 'string') {
      const parts = value.split(',');
      if (parts.length >= 2) {
        return parseFloat(parts[0]) || null;
      }
    }
    return this.locationData[field.name]?.lat || null;
  }

  getLocationLng(field: any): number | null {
    const value = this.form.get(field.name)?.value;
    if (value && typeof value === 'string') {
      const parts = value.split(',');
      if (parts.length >= 2) {
        return parseFloat(parts[1]) || null;
      }
    }
    return this.locationData[field.name]?.lng || null;
  }

  onLocationLatChange(event: Event, field: any): void {
    const input = event.target as HTMLInputElement;
    const lat = parseFloat(input.value) || null;
    if (!this.locationData[field.name]) {
      this.locationData[field.name] = { lat: null, lng: null };
    }
    this.locationData[field.name].lat = lat;
    this.updateLocationValue(field);
  }

  onLocationLngChange(event: Event, field: any): void {
    const input = event.target as HTMLInputElement;
    const lng = parseFloat(input.value) || null;
    if (!this.locationData[field.name]) {
      this.locationData[field.name] = { lat: null, lng: null };
    }
    this.locationData[field.name].lng = lng;
    this.updateLocationValue(field);
  }

  private updateLocationValue(field: any): void {
    const data = this.locationData[field.name];
    if (data && data.lat !== null && data.lng !== null) {
      this.form.get(field.name)?.setValue(`${data.lat},${data.lng}`);
    } else {
      this.form.get(field.name)?.setValue('');
    }
    this.form.get(field.name)?.markAsTouched();
  }

  getCurrentLocation(field: any): void {
    if (this.isFieldReadonly(field)) return;
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation is not supported by your browser', 'OK', { duration: 3000 });
      return;
    }

    this.gettingLocation[field.name] = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.locationData[field.name] = { lat, lng };
        this.form.get(field.name)?.setValue(`${lat},${lng}`);
        this.form.get(field.name)?.markAsTouched();
        this.gettingLocation[field.name] = false;
        this.cdr.detectChanges();
      },
      (error) => {
        this.gettingLocation[field.name] = false;
        let message = 'Could not get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        this.snackBar.open(message, 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  isGettingLocation(field: any): boolean {
    return this.gettingLocation[field.name] || false;
  }

  getLocationDisplay(field: any): string {
    const lat = this.getLocationLat(field);
    const lng = this.getLocationLng(field);
    if (lat !== null && lng !== null) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    return 'No location set';
  }

  // ========== TABLE/GRID FIELD METHODS ==========
  private tableData: Record<string, any[]> = {};

  getTableColumns(field: any): { name: string; label: string; type: string }[] {
    // Parse columns from field options or use default
    if (field.options && typeof field.options === 'string') {
      try {
        const parsed = JSON.parse(field.options);
        if (Array.isArray(parsed)) {
          return parsed.map((col: any) => ({
            name: col.name || col.value || 'column',
            label: col.label || col.name || 'Column',
            type: col.type || 'text'
          }));
        }
      } catch (e) {
        // Fall through to default columns
      }
    }
    // Default columns if not specified
    return [
      { name: 'col1', label: 'Column 1', type: 'text' },
      { name: 'col2', label: 'Column 2', type: 'text' },
      { name: 'col3', label: 'Column 3', type: 'text' }
    ];
  }

  getTableRows(field: any): any[] {
    if (!this.tableData[field.name]) {
      // Initialize from form value or empty
      const value = this.form.get(field.name)?.value;
      if (value && typeof value === 'string') {
        try {
          this.tableData[field.name] = JSON.parse(value);
        } catch (e) {
          this.tableData[field.name] = [];
        }
      } else if (Array.isArray(value)) {
        this.tableData[field.name] = value;
      } else {
        this.tableData[field.name] = [];
      }
    }
    return this.tableData[field.name];
  }

  addTableRow(field: any): void {
    if (this.isFieldReadonly(field)) return;
    if (!this.tableData[field.name]) {
      this.tableData[field.name] = [];
    }
    const columns = this.getTableColumns(field);
    const newRow: Record<string, string> = {};
    columns.forEach(col => {
      newRow[col.name] = '';
    });
    this.tableData[field.name].push(newRow);
    this.updateTableValue(field);
  }

  removeTableRow(field: any, index: number): void {
    if (this.isFieldReadonly(field)) return;
    if (this.tableData[field.name]) {
      this.tableData[field.name].splice(index, 1);
      this.updateTableValue(field);
    }
  }

  onTableCellChange(event: Event, field: any, rowIndex: number, columnName: string): void {
    if (this.isFieldReadonly(field)) return;
    const input = event.target as HTMLInputElement;
    if (this.tableData[field.name] && this.tableData[field.name][rowIndex]) {
      this.tableData[field.name][rowIndex][columnName] = input.value;
      this.updateTableValue(field);
    }
  }

  private updateTableValue(field: any): void {
    const value = JSON.stringify(this.tableData[field.name] || []);
    this.form.get(field.name)?.setValue(value);
    this.form.get(field.name)?.markAsTouched();
  }
}
