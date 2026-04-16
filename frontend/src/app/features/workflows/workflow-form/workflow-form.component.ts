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
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { WorkflowService } from '@core/services/workflow.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { environment } from '../../../../environments/environment';
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
    MatSliderModule,
    MatTooltipModule,
    MatDialogModule],
  template: `
    <div class="workflow-form-container" [class.api-loading-active]="isAnyApiFieldLoading()">
      <!-- Blocking overlay when API fields are loading -->
      @if (isAnyApiFieldLoading()) {
        <div class="api-blocking-overlay">
          <div class="api-blocking-content">
            <mat-spinner diameter="48"></mat-spinner>
            <span>Getting Data</span>
          </div>
        </div>
      }
      <div class="header">
        <button mat-icon-button matTooltip="Go Back" (click)="goBack()">
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
        @if (parentInstanceId) {
          <div class="parent-banner">
            <mat-icon>subdirectory_arrow_right</mat-icon>
            <span>This is a sub-submission. It will be linked to the parent submission.</span>
          </div>
        }
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
            @if (currentScreen && currentScreen.showDetails !== false) {
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

          <!-- Summary Screen Content -->
          @if (isSummaryScreen && hasSummaryFields()) {
            <mat-card class="form-card summary-card">
              <mat-card-content>
                <table class="summary-table">
                  <thead>
                    <tr>
                      <th class="screen-col">Screen</th>
                      <th class="label-col">Field</th>
                      <th class="value-col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (field of getSummaryFields(); track field.id) {
                      <tr>
                        <td class="screen-col">{{ getFieldScreenName(field) }}</td>
                        <td class="label-col">{{ field.label }}</td>
                        <td class="value-col">
                          @if ((field.type || field.fieldType) === 'FILE' && (getExistingAttachments(field.name).length > 0 || getSelectedFiles(field.name).length > 0)) {
                            <div class="summary-file-list">
                              @for (att of getExistingAttachments(field.name); track att.id) {
                                <mat-chip>
                                  <mat-icon matChipAvatar>description</mat-icon>
                                  {{ att.name }}
                                </mat-chip>
                              }
                              @for (file of getSelectedFiles(field.name); track $index) {
                                <mat-chip>
                                  <mat-icon matChipAvatar>description</mat-icon>
                                  {{ file.name }}
                                </mat-chip>
                              }
                            </div>
                          } @else {
                            {{ getFieldDisplayValue(field) }}
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>
          } @else if (isSummaryScreen && !hasSummaryFields()) {
            <mat-card class="form-card summary-card">
              <mat-card-content>
                <div class="no-summary-fields">
                  <mat-icon>info</mat-icon>
                  <p>No fields have been marked for summary display.</p>
                  <p class="hint">To include fields in the summary, enable "In Summary" option in the field configuration.</p>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Ungrouped Fields (not shown on Summary screen) -->
          @if (!isSummaryScreen && (isMultiStep ? getUngroupedFieldsOnScreen().length > 0 : getUngroupedFields().length > 0)) {
            <mat-card class="form-card">
              <mat-card-content>
                <div class="fields-grid">
                  @for (field of (isMultiStep ? getUngroupedFieldsOnScreen() : getUngroupedFields()); track field.id) {
                    @if (isFieldVisible(field)) {
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 1)">
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
                              <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" (opened)="onSelectOpened(field.name)">
                                <div class="select-search-box">
                                  <mat-icon>search</mat-icon>
                                  <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                </div>
                                @for (option of getFilteredOptions(field); track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                                @if (getFilteredOptions(field).length === 0) {
                                  <mat-option disabled>No matches found</mat-option>
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
                              <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple (opened)="onSelectOpened(field.name)">
                                <div class="select-search-box">
                                  <mat-icon>search</mat-icon>
                                  <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                </div>
                                @for (option of getFilteredOptions(field); track option.value) {
                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                }
                                @if (getFilteredOptions(field).length === 0) {
                                  <mat-option disabled>No matches found</mat-option>
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
                          <div class="field-container checkbox-single-field">
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
                            <input type="file" (change)="onFileSelect($event, field.name)" [multiple]="field.multiple" [accept]="field.allowedFileTypes || ''" [disabled]="isFieldReadonly(field)">
                            @if (getFileHint(field)) {
                              <div class="file-hint">{{ getFileHint(field) }}</div>
                            }
                            @if (getExistingAttachments(field.name).length > 0 || getSelectedFiles(field.name).length > 0) {
                              <div class="file-list">
                                @for (att of getExistingAttachments(field.name); track att.id) {
                                  <mat-chip (removed)="removeExistingAttachment(field.name, att.id)">
                                    <mat-icon matChipAvatar>description</mat-icon>
                                    {{ att.name }}
                                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                                  </mat-chip>
                                }
                                @for (file of getSelectedFiles(field.name); track $index) {
                                  <mat-chip (removed)="removeFile(field.name, $index)">
                                    {{ file.name }}
                                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                                  </mat-chip>
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
                            @if (allCorporates.length > 0) {
                              <mat-form-field appearance="outline" class="full-width" style="margin-bottom: 0.5rem;">
                                <mat-label>Filter by Corporate</mat-label>
                                <mat-select multiple (selectionChange)="onUserCorporateFilterChange($event.value, field.name)" (opened)="onSelectOpened('_userCorp_' + field.name)">
                                  <div class="select-search-box">
                                    <mat-icon>search</mat-icon>
                                    <input class="select-search-input" placeholder="Search corporates..." (input)="onSelectSearch($any($event.target).value, '_userCorp_' + field.name)" (keydown)="$event.stopPropagation()">
                                  </div>
                                  @for (corp of allCorporates; track corp.id) {
                                    @if (!selectSearchTerms['_userCorp_' + field.name] || corp.name?.toLowerCase().includes(selectSearchTerms['_userCorp_' + field.name])) {
                                      <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                                    }
                                  }
                                </mat-select>
                                <mat-hint>Select corporates to narrow user list</mat-hint>
                              </mat-form-field>
                            }
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
                              <button mat-stroked-button matTooltip="Select Image" type="button" (click)="imageInput.click()" [disabled]="isFieldReadonly(field)">
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
                          <div class="table-field" [class.has-error]="hasFieldError(field)" [class.readonly-table]="isFieldReadonly(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            @if (field.tableSearchable) {
                              <div class="table-search-bar">
                                <mat-icon>search</mat-icon>
                                <input type="text" placeholder="Search table..." [value]="tableSearchTerms[field.name] || ''" (input)="onTableSearch($event, field)" class="table-search-input">
                                @if (tableSearchTerms[field.name]) {
                                  <button mat-icon-button (click)="clearTableSearch(field)" matTooltip="Clear search"><mat-icon>close</mat-icon></button>
                                }
                              </div>
                            }
                            <div class="table-input">
                              <div class="table-scroll-wrapper">
                              <table class="data-table" [class.table-striped]="field.tableStriped !== false" [class.table-bordered]="field.tableBordered !== false" [class.table-resizable]="field.tableResizable">
                                <thead>
                                  <tr>
                                    @for (col of getTableColumns(field); track col.name) {
                                      <th [style.width]="col.width ? col.width + 'px' : 'auto'" [style.min-width]="field.tableResizable ? '60px' : 'auto'">
                                        <div class="th-content">
                                          <span class="th-label" (click)="onTableSort(field, col.name)">
                                            {{ col.label }}
                                            @if (tableSortState[field.name]?.column === col.name) {
                                              <mat-icon class="sort-icon">{{ tableSortState[field.name]?.direction === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                                            }
                                          </span>
                                          @if (field.tableResizable) {
                                            <div class="col-resize-handle" (mousedown)="onColumnResizeStart($event, field, col)"></div>
                                          }
                                        </div>
                                        @if (field.tableFilterable) {
                                          <input type="text" class="col-filter-input" placeholder="Filter..." [value]="getColumnFilter(field, col.name)" (input)="onColumnFilter($event, field, col.name)">
                                        }
                                      </th>
                                    }
                                    @if (!isTableFullyReadonly(field)) {
                                      <th class="actions-col">Actions</th>
                                    }
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (row of getDisplayedTableRows(field); track $index) {
                                    <tr>
                                      @for (col of getTableColumns(field); track col.name) {
                                        <td [style.width]="col.width ? col.width + 'px' : 'auto'">
                                          @switch (col.type) {
                                            @case ('NUMBER') {
                                              <input type="number" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                            @case ('DATE') {
                                              <input type="date" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                            @case ('CHECKBOX') {
                                              <mat-checkbox [checked]="row[col.name] === 'true' || row[col.name] === true" (change)="onTableCheckboxChange($event, field, getActualRowIndex(field, row), col.name)" [disabled]="isColumnReadonly(field, col)"></mat-checkbox>
                                            }
                                            @default {
                                              <input type="text" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                          }
                                        </td>
                                      }
                                      @if (!isTableFullyReadonly(field)) {
                                        <td class="actions-col">
                                          <button mat-icon-button type="button" (click)="removeTableRow(field, getActualRowIndex(field, row))" [disabled]="!canRemoveTableRow(field)" matTooltip="Remove row">
                                            <mat-icon>delete</mat-icon>
                                          </button>
                                        </td>
                                      }
                                    </tr>
                                  }
                                  @if (getDisplayedTableRows(field).length === 0) {
                                    <tr>
                                      <td [attr.colspan]="isTableFullyReadonly(field) ? getTableColumns(field).length : getTableColumns(field).length + 1" class="empty-table">
                                        @if (tableSearchTerms[field.name] || hasColumnFilters(field)) {
                                          No matching rows found.
                                        } @else if (isTableFullyReadonly(field)) {
                                          No data available.
                                        } @else {
                                          No rows added. Click "Add Row" to add data.
                                        }
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                              </div>
                              <div class="table-footer">
                                @if (!isTableFullyReadonly(field)) {
                                  <div class="table-actions">
                                    <button mat-stroked-button matTooltip="Add Row" type="button" (click)="addTableRow(field)" [disabled]="!canAddTableRow(field)" class="add-row-btn">
                                      <mat-icon>add</mat-icon> Add Row
                                    </button>
                                    @if (field.tableMaxRows) {
                                      <span class="row-count">{{ getTableRows(field).length }} / {{ field.tableMaxRows }} rows</span>
                                    }
                                  </div>
                                }
                                @if (field.tablePageable && getFilteredTableRows(field).length > (field.tablePageSize || 10)) {
                                  <div class="table-pagination">
                                    <span class="page-info">{{ getPageInfo(field) }}</span>
                                    <button mat-icon-button [disabled]="getTablePage(field) === 0" (click)="setTablePage(field, 0)" matTooltip="First"><mat-icon>first_page</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) === 0" (click)="setTablePage(field, getTablePage(field) - 1)" matTooltip="Previous"><mat-icon>chevron_left</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) >= getTableTotalPages(field) - 1" (click)="setTablePage(field, getTablePage(field) + 1)" matTooltip="Next"><mat-icon>chevron_right</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) >= getTableTotalPages(field) - 1" (click)="setTablePage(field, getTableTotalPages(field) - 1)" matTooltip="Last"><mat-icon>last_page</mat-icon></button>
                                  </div>
                                }
                              </div>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                        @case ('SQL_TABLE') {
                          <div class="sql-table-field" [class.has-error]="hasFieldError(field)">
                            @if (field.label) {
                              <label class="field-label">{{ field.label }}</label>
                            }
                            @if (sqlTableData[field.name]?.loading) {
                              <div style="text-align: center; padding: 24px;"><mat-spinner diameter="30"></mat-spinner></div>
                            } @else if (sqlTableData[field.name]?.error) {
                              <div class="api-error">
                                <mat-icon>error_outline</mat-icon>
                                <span>{{ sqlTableData[field.name].error }}</span>
                                <button mat-stroked-button (click)="loadSqlTableData(field)"><mat-icon>refresh</mat-icon> Retry</button>
                              </div>
                            } @else if (field.apiTriggerMode === 'MANUAL' && !sqlTableData[field.name]?.data) {
                              <div class="api-manual-trigger">
                                <button mat-flat-button color="primary" (click)="loadSqlTableData(field)">
                                  <mat-icon>play_arrow</mat-icon> Populate
                                </button>
                              </div>
                            } @else if (sqlTableData[field.name]?.data) {
                              <div class="sql-table-wrapper">
                                @if (field.apiTriggerMode === 'MANUAL') {
                                  <button mat-stroked-button class="api-refresh-btn" (click)="loadSqlTableData(field)" style="margin-bottom: 8px;">
                                    <mat-icon>play_arrow</mat-icon> Populate
                                  </button>
                                }
                                @if (field.tableSearchable) {
                                  <div class="sql-table-search">
                                    <mat-icon>search</mat-icon>
                                    <input type="text" placeholder="Search..." (input)="onSqlTableSearch(field.name, $event)">
                                  </div>
                                }
                                <table class="sql-result-table"
                                       [class.table-striped]="field.tableStriped !== false"
                                       [class.table-bordered]="field.tableBordered !== false">
                                  <thead>
                                    <tr>
                                      @for (col of sqlTableData[field.name].columns; track col.field) {
                                        <th (click)="onSqlTableSort(field.name, col.field)" class="sortable-th">
                                          {{ col.header }}
                                          @if (sqlTableState[field.name]?.sortField === col.field) {
                                            <mat-icon class="sort-icon">{{ sqlTableState[field.name].sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                                          }
                                        </th>
                                      }
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (row of getSqlTableDisplayRows(field); track $index) {
                                      <tr>
                                        @for (col of sqlTableData[field.name].columns; track col.field) {
                                          <td>{{ row[col.field] }}</td>
                                        }
                                      </tr>
                                    }
                                    @if (getSqlTableDisplayRows(field).length === 0) {
                                      <tr><td [attr.colspan]="sqlTableData[field.name].columns.length" style="text-align: center; color: #999; padding: 24px;">No data</td></tr>
                                    }
                                  </tbody>
                                </table>
                                <div class="sql-table-footer">
                                  @if (field.tablePageable) {
                                    <span>Showing {{ getSqlTableDisplayRows(field).length }} of {{ getSqlTableFilteredRows(field.name).length }} row(s)</span>
                                    <div class="sql-table-pager">
                                      <button mat-icon-button [disabled]="(sqlTableState[field.name]?.page || 0) === 0" (click)="sqlTablePageChange(field.name, -1)">
                                        <mat-icon>chevron_left</mat-icon>
                                      </button>
                                      <span>Page {{ (sqlTableState[field.name]?.page || 0) + 1 }} of {{ getSqlTableTotalPages(field) || 1 }}</span>
                                      <button mat-icon-button [disabled]="(sqlTableState[field.name]?.page || 0) >= getSqlTableTotalPages(field) - 1" (click)="sqlTablePageChange(field.name, 1)">
                                        <mat-icon>chevron_right</mat-icon>
                                      </button>
                                    </div>
                                  } @else {
                                    <span>{{ getSqlTableFilteredRows(field.name).length }} row(s)</span>
                                  }
                                </div>
                              </div>
                            } @else {
                              <div style="color: #999; padding: 12px;">No SQL query configured</div>
                            }
                          </div>
                        }
                        @case ('ACCORDION') {
                          <div class="accordion-field" [class.has-error]="hasFieldError(field)">
                            @if (field.label) {
                              <label class="field-label accordion-label">{{ field.label }}</label>
                            }
                            <mat-accordion [multi]="field.accordionAllowMultiple ?? false" class="workflow-accordion {{ getAccordionAnimationClass(field) }}">
                              @for (collapsible of getCollapsiblesForAccordion(field.id); track collapsible.id; let idx = $index) {
                                {{ initAccordionState(field) }}
                                <mat-expansion-panel [expanded]="isCollapsibleExpanded(field.id, idx)" (opened)="openCollapsible(field, idx)" (closed)="closeCollapsible(field, idx)">
                                  <mat-expansion-panel-header>
                                    <mat-panel-title>
                                      @if (collapsible.collapsibleIcon) {
                                        <mat-icon class="collapsible-icon">{{ collapsible.collapsibleIcon }}</mat-icon>
                                      }
                                      {{ collapsible.collapsibleTitle || collapsible.label }}
                                    </mat-panel-title>
                                  </mat-expansion-panel-header>
                                  <div class="collapsible-content fields-grid">
                                    @for (nestedField of getFieldsInCollapsible(collapsible.id); track nestedField.id) {
                                      @if (isFieldVisible(nestedField)) {
                                        <div class="field-wrapper" [style.grid-column]="'span ' + (nestedField.columnSpan || 1)">
                                          <!-- Render nested field - simplified for common types -->
                                          @switch (nestedField.type) {
                                            @case ('TEXT') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput [formControlName]="nestedField.name" [placeholder]="nestedField.placeholder || ''" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('TEXTAREA') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <textarea matInput [formControlName]="nestedField.name" rows="4" [readonly]="isFieldReadonly(nestedField)"></textarea>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('NUMBER') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput type="number" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('SELECT') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <mat-select [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">
                                                    @for (option of nestedField.options; track option.value) {
                                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                                    }
                                                  </mat-select>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('DATE') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput [matDatepicker]="nestedPicker" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                  <mat-datepicker-toggle matIconSuffix [for]="nestedPicker" [disabled]="isFieldReadonly(nestedField)"></mat-datepicker-toggle>
                                                  <mat-datepicker #nestedPicker [disabled]="isFieldReadonly(nestedField)"></mat-datepicker>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('CHECKBOX') {
                                              <div class="field-container">
                                                <mat-checkbox [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">{{ nestedField.label }}</mat-checkbox>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('RADIO') {
                                              <div class="radio-field" [class.has-error]="hasFieldError(nestedField)">
                                                <label class="field-label">{{ nestedField.label }} @if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</label>
                                                <mat-radio-group [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">
                                                  @for (option of nestedField.options; track option.value) {
                                                    <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
                                                  }
                                                </mat-radio-group>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @default {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width">
                                                  <mat-label>{{ nestedField.label }}</mat-label>
                                                  <input matInput [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                              </div>
                                            }
                                          }
                                        </div>
                                      }
                                    }
                                  </div>
                                </mat-expansion-panel>
                              }
                            </mat-accordion>
                          </div>
                        }
                        @case ('COLLAPSIBLE') {
                          <!-- Standalone collapsible (not inside accordion) -->
                          <div class="standalone-collapsible">
                            <mat-expansion-panel [expanded]="field.collapsibleDefaultExpanded ?? false">
                              <mat-expansion-panel-header>
                                <mat-panel-title>
                                  @if (field.collapsibleIcon) {
                                    <mat-icon class="collapsible-icon">{{ field.collapsibleIcon }}</mat-icon>
                                  }
                                  {{ field.collapsibleTitle || field.label }}
                                </mat-panel-title>
                              </mat-expansion-panel-header>
                              <div class="collapsible-content fields-grid">
                                @for (nestedField of getFieldsInCollapsible(field.id); track nestedField.id) {
                                  @if (isFieldVisible(nestedField)) {
                                    <div class="field-wrapper" [style.grid-column]="'span ' + (nestedField.columnSpan || 1)">
                                      @switch (nestedField.type) {
                                        @case ('TEXT') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <input matInput [formControlName]="nestedField.name" [placeholder]="nestedField.placeholder || ''" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @case ('TEXTAREA') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <textarea matInput [formControlName]="nestedField.name" rows="4" [readonly]="isFieldReadonly(nestedField)"></textarea>
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @case ('NUMBER') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <input matInput type="number" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @case ('SELECT') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <mat-select [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">
                                                @for (option of nestedField.options; track option.value) {
                                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                                }
                                              </mat-select>
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @default {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width">
                                              <mat-label>{{ nestedField.label }}</mat-label>
                                              <input matInput [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                          </div>
                                        }
                                      }
                                    </div>
                                  }
                                }
                              </div>
                            </mat-expansion-panel>
                          </div>
                        }
                        @case ('API_VALUE') {
                          <div class="field-container api-field-container">
                            <div class="api-input-row">
                              <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                                @if (apiFieldLoading[field.name]) { <div matSuffix class="api-input-spinner"><mat-spinner diameter="20"></mat-spinner></div> }
                                @if (apiFieldErrors[field.name]) { <mat-hint class="api-input-error">{{ apiFieldErrors[field.name] }}</mat-hint> }
                              </mat-form-field>
                              @if (field.apiTriggerMode === 'MANUAL') { <button mat-flat-button color="primary" class="api-go-btn" (click)="fetchApiFieldData(field)" [disabled]="apiFieldLoading[field.name]"><mat-icon>play_arrow</mat-icon> Go</button> }
                            </div>
                            @if (hasFieldError(field)) { <div class="validation-error">{{ getFieldErrorMessage(field) }}</div> }
                          </div>
                        }
                        @case ('OBJECT_VIEWER') {
                          <div class="field-container api-field-container object-viewer-container">
                            @if (apiFieldLoading[field.name]) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-loading-overlay">
                                <mat-spinner diameter="24"></mat-spinner>
                                <span>Getting Data</span>
                              </div>
                            } @else if (apiFieldErrors[field.name]) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-error">
                                <mat-icon>error_outline</mat-icon>
                                <span>{{ apiFieldErrors[field.name] }}</span>
                                <button mat-stroked-button (click)="fetchApiFieldData(field)"><mat-icon>refresh</mat-icon> Retry</button>
                              </div>
                            } @else if (field.apiTriggerMode === 'MANUAL' && apiFieldData[field.name] == null) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-manual-trigger">
                                <button mat-flat-button color="primary" (click)="fetchApiFieldData(field)">
                                  <mat-icon>play_arrow</mat-icon> Go
                                </button>
                              </div>
                            } @else if (apiFieldData[field.name] != null) {
                              <mat-expansion-panel class="ov-panel">
                                <mat-expansion-panel-header>
                                  <mat-panel-title>
                                    <mat-icon class="ov-panel-icon">account_tree</mat-icon>
                                    {{ field.label }}
                                  </mat-panel-title>
                                  <mat-panel-description>
                                    {{ getOvTypeBadge(apiFieldData[field.name]) }}
                                  </mat-panel-description>
                                </mat-expansion-panel-header>
                                <div class="object-viewer">
                                  <div class="ov-toolbar">
                                    @if (field.apiTriggerMode === 'MANUAL') {
                                      <button mat-stroked-button (click)="fetchApiFieldData(field); $event.stopPropagation()" matTooltip="Re-fetch data"><mat-icon>play_arrow</mat-icon> Go</button>
                                    }
                                    <button mat-stroked-button (click)="expandAllObjectViewer(field.name); $event.stopPropagation()" matTooltip="Expand All"><mat-icon>unfold_more</mat-icon></button>
                                    <button mat-stroked-button (click)="collapseAllObjectViewer(field.name); $event.stopPropagation()" matTooltip="Collapse All"><mat-icon>unfold_less</mat-icon></button>
                                  </div>
                                  <div class="ov-tree" (click)="onOvTreeClick($event, field.name)">
                                    @for (node of getOvNodes(apiFieldData[field.name], field.name, 0); track node.path) {
                                      @if (node.expandable) {
                                        <div class="ov-key-row ov-expandable" [style.padding-left]="(node.depth * 16) + 'px'" [attr.data-path]="node.path">
                                          <mat-icon class="ov-toggle">{{ node.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                                          <span class="ov-key">{{ node.key }}</span>
                                          <span class="ov-type-badge">{{ node.badge }}</span>
                                        </div>
                                      } @else {
                                        <div class="ov-key-row ov-leaf" [style.padding-left]="(node.depth * 16) + 'px'">
                                          <span class="ov-dot"></span>
                                          <span class="ov-key">{{ node.key }}:</span>
                                          <span class="ov-value" [class]="'ov-val-' + node.valueType">{{ node.value }}</span>
                                        </div>
                                      }
                                    }
                                  </div>
                                </div>
                              </mat-expansion-panel>
                            } @else {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-data-display"><p class="no-data-hint">No data returned</p></div>
                            }
                          </div>
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

          <!-- Grouped Fields (not shown on Summary screen) -->
          @if (!isSummaryScreen) {
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
                    <div class="field-wrapper" [style.grid-column]="'span ' + (field.columnSpan || 1)">
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
                          <div class="field-container checkbox-single-field">
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
                            <input type="file" (change)="onFileSelect($event, field.name)" [multiple]="field.multiple" [accept]="field.allowedFileTypes || ''" [disabled]="isFieldReadonly(field)">
                            @if (getFileHint(field)) {
                              <div class="file-hint">{{ getFileHint(field) }}</div>
                            }
                            @if (getExistingAttachments(field.name).length > 0 || getSelectedFiles(field.name).length > 0) {
                              <div class="file-list">
                                @for (att of getExistingAttachments(field.name); track att.id) {
                                  <mat-chip (removed)="removeExistingAttachment(field.name, att.id)">
                                    <mat-icon matChipAvatar>description</mat-icon>
                                    {{ att.name }}
                                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                                  </mat-chip>
                                }
                                @for (file of getSelectedFiles(field.name); track $index) {
                                  <mat-chip (removed)="removeFile(field.name, $index)">
                                    {{ file.name }}
                                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                                  </mat-chip>
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
                              <input matInput type="url" [formControlName]="field.name" [readonly]="isFieldReadonly(field)">
                            </mat-form-field>
                            @if (hasFieldError(field)) {
                              <div class="validation-error">{{ getFieldErrorMessage(field) }}</div>
                            }
                          </div>
                        }
                        @case ('USER') {
                          <div class="field-container">
                            @if (allCorporates.length > 0) {
                              <mat-form-field appearance="outline" class="full-width" style="margin-bottom: 0.5rem;">
                                <mat-label>Filter by Corporate</mat-label>
                                <mat-select multiple (selectionChange)="onUserCorporateFilterChange($event.value, field.name)" (opened)="onSelectOpened('_userCorp2_' + field.name)">
                                  <div class="select-search-box">
                                    <mat-icon>search</mat-icon>
                                    <input class="select-search-input" placeholder="Search corporates..." (input)="onSelectSearch($any($event.target).value, '_userCorp2_' + field.name)" (keydown)="$event.stopPropagation()">
                                  </div>
                                  @for (corp of allCorporates; track corp.id) {
                                    @if (!selectSearchTerms['_userCorp2_' + field.name] || corp.name?.toLowerCase().includes(selectSearchTerms['_userCorp2_' + field.name])) {
                                      <mat-option [value]="corp.id">{{ corp.name }}</mat-option>
                                    }
                                  }
                                </mat-select>
                                <mat-hint>Select corporates to narrow user list</mat-hint>
                              </mat-form-field>
                            }
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
                              <button mat-stroked-button matTooltip="Select Image" type="button" (click)="imageInputGroup.click()" [disabled]="isFieldReadonly(field)">
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
                          <div class="table-field" [class.has-error]="hasFieldError(field)" [class.readonly-table]="isFieldReadonly(field)">
                            <label class="field-label">{{ field.label }} @if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</label>
                            @if (field.tableSearchable) {
                              <div class="table-search-bar">
                                <mat-icon>search</mat-icon>
                                <input type="text" placeholder="Search table..." [value]="tableSearchTerms[field.name] || ''" (input)="onTableSearch($event, field)" class="table-search-input">
                                @if (tableSearchTerms[field.name]) {
                                  <button mat-icon-button (click)="clearTableSearch(field)" matTooltip="Clear search"><mat-icon>close</mat-icon></button>
                                }
                              </div>
                            }
                            <div class="table-input">
                              <div class="table-scroll-wrapper">
                              <table class="data-table" [class.table-striped]="field.tableStriped !== false" [class.table-bordered]="field.tableBordered !== false" [class.table-resizable]="field.tableResizable">
                                <thead>
                                  <tr>
                                    @for (col of getTableColumns(field); track col.name) {
                                      <th [style.width]="col.width ? col.width + 'px' : 'auto'" [style.min-width]="field.tableResizable ? '60px' : 'auto'">
                                        <div class="th-content">
                                          <span class="th-label" (click)="onTableSort(field, col.name)">
                                            {{ col.label }}
                                            @if (tableSortState[field.name]?.column === col.name) {
                                              <mat-icon class="sort-icon">{{ tableSortState[field.name]?.direction === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                                            }
                                          </span>
                                          @if (field.tableResizable) {
                                            <div class="col-resize-handle" (mousedown)="onColumnResizeStart($event, field, col)"></div>
                                          }
                                        </div>
                                        @if (field.tableFilterable) {
                                          <input type="text" class="col-filter-input" placeholder="Filter..." [value]="getColumnFilter(field, col.name)" (input)="onColumnFilter($event, field, col.name)">
                                        }
                                      </th>
                                    }
                                    @if (!isTableFullyReadonly(field)) {
                                      <th class="actions-col">Actions</th>
                                    }
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (row of getDisplayedTableRows(field); track $index) {
                                    <tr>
                                      @for (col of getTableColumns(field); track col.name) {
                                        <td [style.width]="col.width ? col.width + 'px' : 'auto'">
                                          @switch (col.type) {
                                            @case ('NUMBER') {
                                              <input type="number" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                            @case ('DATE') {
                                              <input type="date" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                            @case ('CHECKBOX') {
                                              <mat-checkbox [checked]="row[col.name] === 'true' || row[col.name] === true" (change)="onTableCheckboxChange($event, field, getActualRowIndex(field, row), col.name)" [disabled]="isColumnReadonly(field, col)"></mat-checkbox>
                                            }
                                            @default {
                                              <input type="text" [value]="row[col.name] || ''" (input)="onTableCellChange($event, field, getActualRowIndex(field, row), col.name)" [readonly]="isColumnReadonly(field, col)" class="table-cell-input">
                                            }
                                          }
                                        </td>
                                      }
                                      @if (!isTableFullyReadonly(field)) {
                                        <td class="actions-col">
                                          <button mat-icon-button type="button" (click)="removeTableRow(field, getActualRowIndex(field, row))" [disabled]="!canRemoveTableRow(field)" matTooltip="Remove row">
                                            <mat-icon>delete</mat-icon>
                                          </button>
                                        </td>
                                      }
                                    </tr>
                                  }
                                  @if (getDisplayedTableRows(field).length === 0) {
                                    <tr>
                                      <td [attr.colspan]="isTableFullyReadonly(field) ? getTableColumns(field).length : getTableColumns(field).length + 1" class="empty-table">
                                        @if (tableSearchTerms[field.name] || hasColumnFilters(field)) {
                                          No matching rows found.
                                        } @else if (isTableFullyReadonly(field)) {
                                          No data available.
                                        } @else {
                                          No rows added. Click "Add Row" to add data.
                                        }
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                              </div>
                              <div class="table-footer">
                                @if (!isTableFullyReadonly(field)) {
                                  <div class="table-actions">
                                    <button mat-stroked-button matTooltip="Add Row" type="button" (click)="addTableRow(field)" [disabled]="!canAddTableRow(field)" class="add-row-btn">
                                      <mat-icon>add</mat-icon> Add Row
                                    </button>
                                    @if (field.tableMaxRows) {
                                      <span class="row-count">{{ getTableRows(field).length }} / {{ field.tableMaxRows }} rows</span>
                                    }
                                  </div>
                                }
                                @if (field.tablePageable && getFilteredTableRows(field).length > (field.tablePageSize || 10)) {
                                  <div class="table-pagination">
                                    <span class="page-info">{{ getPageInfo(field) }}</span>
                                    <button mat-icon-button [disabled]="getTablePage(field) === 0" (click)="setTablePage(field, 0)" matTooltip="First"><mat-icon>first_page</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) === 0" (click)="setTablePage(field, getTablePage(field) - 1)" matTooltip="Previous"><mat-icon>chevron_left</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) >= getTableTotalPages(field) - 1" (click)="setTablePage(field, getTablePage(field) + 1)" matTooltip="Next"><mat-icon>chevron_right</mat-icon></button>
                                    <button mat-icon-button [disabled]="getTablePage(field) >= getTableTotalPages(field) - 1" (click)="setTablePage(field, getTableTotalPages(field) - 1)" matTooltip="Last"><mat-icon>last_page</mat-icon></button>
                                  </div>
                                }
                              </div>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" multiple (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                                  <mat-select [formControlName]="field.name" [placeholder]="field.placeholder || ''" [disabled]="isFieldReadonly(field)" (opened)="onSelectOpened(field.name)">
                                    <div class="select-search-box">
                                      <mat-icon>search</mat-icon>
                                      <input class="select-search-input" placeholder="Search..." (input)="onSelectSearch($any($event.target).value, field.name)" (keydown)="$event.stopPropagation()">
                                    </div>
                                    @for (option of getFilteredOptions(field); track option.value) {
                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                    }
                                    @if (getFilteredOptions(field).length === 0) {
                                      <mat-option disabled>No matches found</mat-option>
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
                        @case ('SQL_TABLE') {
                          <div class="sql-table-field" [class.has-error]="hasFieldError(field)">
                            @if (field.label) {
                              <label class="field-label">{{ field.label }}</label>
                            }
                            @if (sqlTableData[field.name]?.loading) {
                              <div style="text-align: center; padding: 24px;"><mat-spinner diameter="30"></mat-spinner></div>
                            } @else if (sqlTableData[field.name]?.error) {
                              <div class="api-error">
                                <mat-icon>error_outline</mat-icon>
                                <span>{{ sqlTableData[field.name].error }}</span>
                                <button mat-stroked-button (click)="loadSqlTableData(field)"><mat-icon>refresh</mat-icon> Retry</button>
                              </div>
                            } @else if (field.apiTriggerMode === 'MANUAL' && !sqlTableData[field.name]?.data) {
                              <div class="api-manual-trigger">
                                <button mat-flat-button color="primary" (click)="loadSqlTableData(field)">
                                  <mat-icon>play_arrow</mat-icon> Populate
                                </button>
                              </div>
                            } @else if (sqlTableData[field.name]?.data) {
                              <div class="sql-table-wrapper">
                                @if (field.apiTriggerMode === 'MANUAL') {
                                  <button mat-stroked-button class="api-refresh-btn" (click)="loadSqlTableData(field)" style="margin-bottom: 8px;">
                                    <mat-icon>play_arrow</mat-icon> Populate
                                  </button>
                                }
                                @if (field.tableSearchable) {
                                  <div class="sql-table-search">
                                    <mat-icon>search</mat-icon>
                                    <input type="text" placeholder="Search..." (input)="onSqlTableSearch(field.name, $event)">
                                  </div>
                                }
                                <table class="sql-result-table"
                                       [class.table-striped]="field.tableStriped !== false"
                                       [class.table-bordered]="field.tableBordered !== false">
                                  <thead>
                                    <tr>
                                      @for (col of sqlTableData[field.name].columns; track col.field) {
                                        <th (click)="onSqlTableSort(field.name, col.field)" class="sortable-th">
                                          {{ col.header }}
                                          @if (sqlTableState[field.name]?.sortField === col.field) {
                                            <mat-icon class="sort-icon">{{ sqlTableState[field.name].sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                                          }
                                        </th>
                                      }
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (row of getSqlTableDisplayRows(field); track $index) {
                                      <tr>
                                        @for (col of sqlTableData[field.name].columns; track col.field) {
                                          <td>{{ row[col.field] }}</td>
                                        }
                                      </tr>
                                    }
                                    @if (getSqlTableDisplayRows(field).length === 0) {
                                      <tr><td [attr.colspan]="sqlTableData[field.name].columns.length" style="text-align: center; color: #999; padding: 24px;">No data</td></tr>
                                    }
                                  </tbody>
                                </table>
                                <div class="sql-table-footer">
                                  @if (field.tablePageable) {
                                    <span>Showing {{ getSqlTableDisplayRows(field).length }} of {{ getSqlTableFilteredRows(field.name).length }} row(s)</span>
                                    <div class="sql-table-pager">
                                      <button mat-icon-button [disabled]="(sqlTableState[field.name]?.page || 0) === 0" (click)="sqlTablePageChange(field.name, -1)">
                                        <mat-icon>chevron_left</mat-icon>
                                      </button>
                                      <span>Page {{ (sqlTableState[field.name]?.page || 0) + 1 }} of {{ getSqlTableTotalPages(field) || 1 }}</span>
                                      <button mat-icon-button [disabled]="(sqlTableState[field.name]?.page || 0) >= getSqlTableTotalPages(field) - 1" (click)="sqlTablePageChange(field.name, 1)">
                                        <mat-icon>chevron_right</mat-icon>
                                      </button>
                                    </div>
                                  } @else {
                                    <span>{{ getSqlTableFilteredRows(field.name).length }} row(s)</span>
                                  }
                                </div>
                              </div>
                            } @else {
                              <div style="color: #999; padding: 12px;">No SQL query configured</div>
                            }
                          </div>
                        }
                        @case ('ACCORDION') {
                          <div class="accordion-field" [class.has-error]="hasFieldError(field)">
                            @if (field.label) {
                              <label class="field-label accordion-label">{{ field.label }}</label>
                            }
                            <mat-accordion [multi]="field.accordionAllowMultiple ?? false" class="workflow-accordion {{ getAccordionAnimationClass(field) }}">
                              @for (collapsible of getCollapsiblesForAccordion(field.id); track collapsible.id; let idx = $index) {
                                {{ initAccordionState(field) }}
                                <mat-expansion-panel [expanded]="isCollapsibleExpanded(field.id, idx)" (opened)="openCollapsible(field, idx)" (closed)="closeCollapsible(field, idx)">
                                  <mat-expansion-panel-header>
                                    <mat-panel-title>
                                      @if (collapsible.collapsibleIcon) {
                                        <mat-icon class="collapsible-icon">{{ collapsible.collapsibleIcon }}</mat-icon>
                                      }
                                      {{ collapsible.collapsibleTitle || collapsible.label }}
                                    </mat-panel-title>
                                  </mat-expansion-panel-header>
                                  <div class="collapsible-content fields-grid">
                                    @for (nestedField of getFieldsInCollapsible(collapsible.id); track nestedField.id) {
                                      @if (isFieldVisible(nestedField)) {
                                        <div class="field-wrapper" [style.grid-column]="'span ' + (nestedField.columnSpan || 1)">
                                          @switch (nestedField.type) {
                                            @case ('TEXT') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput [formControlName]="nestedField.name" [placeholder]="nestedField.placeholder || ''" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('TEXTAREA') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <textarea matInput [formControlName]="nestedField.name" rows="4" [readonly]="isFieldReadonly(nestedField)"></textarea>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('NUMBER') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput type="number" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('SELECT') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <mat-select [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">
                                                    @for (option of nestedField.options; track option.value) {
                                                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                                    }
                                                  </mat-select>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('DATE') {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                                  <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                                  <input matInput [matDatepicker]="groupNestedPicker" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                  <mat-datepicker-toggle matIconSuffix [for]="groupNestedPicker" [disabled]="isFieldReadonly(nestedField)"></mat-datepicker-toggle>
                                                  <mat-datepicker #groupNestedPicker [disabled]="isFieldReadonly(nestedField)"></mat-datepicker>
                                                </mat-form-field>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @case ('CHECKBOX') {
                                              <div class="field-container">
                                                <mat-checkbox [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">{{ nestedField.label }}</mat-checkbox>
                                                @if (hasFieldError(nestedField)) {
                                                  <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                                }
                                              </div>
                                            }
                                            @default {
                                              <div class="field-container">
                                                <mat-form-field appearance="outline" class="full-width">
                                                  <mat-label>{{ nestedField.label }}</mat-label>
                                                  <input matInput [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                                </mat-form-field>
                                              </div>
                                            }
                                          }
                                        </div>
                                      }
                                    }
                                  </div>
                                </mat-expansion-panel>
                              }
                            </mat-accordion>
                          </div>
                        }
                        @case ('COLLAPSIBLE') {
                          <div class="standalone-collapsible">
                            <mat-expansion-panel [expanded]="field.collapsibleDefaultExpanded ?? false">
                              <mat-expansion-panel-header>
                                <mat-panel-title>
                                  @if (field.collapsibleIcon) {
                                    <mat-icon class="collapsible-icon">{{ field.collapsibleIcon }}</mat-icon>
                                  }
                                  {{ field.collapsibleTitle || field.label }}
                                </mat-panel-title>
                              </mat-expansion-panel-header>
                              <div class="collapsible-content fields-grid">
                                @for (nestedField of getFieldsInCollapsible(field.id); track nestedField.id) {
                                  @if (isFieldVisible(nestedField)) {
                                    <div class="field-wrapper" [style.grid-column]="'span ' + (nestedField.columnSpan || 1)">
                                      @switch (nestedField.type) {
                                        @case ('TEXT') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <input matInput [formControlName]="nestedField.name" [placeholder]="nestedField.placeholder || ''" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @case ('NUMBER') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <input matInput type="number" [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @case ('SELECT') {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(nestedField)">
                                              <mat-label>{{ nestedField.label }}@if (isFieldRequired(nestedField)) { <span class="required-asterisk">*</span> }</mat-label>
                                              <mat-select [formControlName]="nestedField.name" [disabled]="isFieldReadonly(nestedField)">
                                                @for (option of nestedField.options; track option.value) {
                                                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                                                }
                                              </mat-select>
                                            </mat-form-field>
                                            @if (hasFieldError(nestedField)) {
                                              <div class="validation-error">{{ getFieldErrorMessage(nestedField) }}</div>
                                            }
                                          </div>
                                        }
                                        @default {
                                          <div class="field-container">
                                            <mat-form-field appearance="outline" class="full-width">
                                              <mat-label>{{ nestedField.label }}</mat-label>
                                              <input matInput [formControlName]="nestedField.name" [readonly]="isFieldReadonly(nestedField)">
                                            </mat-form-field>
                                          </div>
                                        }
                                      }
                                    </div>
                                  }
                                }
                              </div>
                            </mat-expansion-panel>
                          </div>
                        }
                        @case ('API_VALUE') {
                          <div class="field-container api-field-container">
                            <div class="api-input-row">
                              <mat-form-field appearance="outline" class="full-width" [class.field-invalid]="hasFieldError(field)">
                                <mat-label>{{ field.label }}@if (isFieldRequired(field)) { <span class="required-asterisk">*</span> }</mat-label>
                                <input matInput [formControlName]="field.name" [placeholder]="field.placeholder || ''" [readonly]="isFieldReadonly(field)">
                                @if (apiFieldLoading[field.name]) { <div matSuffix class="api-input-spinner"><mat-spinner diameter="20"></mat-spinner></div> }
                                @if (apiFieldErrors[field.name]) { <mat-hint class="api-input-error">{{ apiFieldErrors[field.name] }}</mat-hint> }
                              </mat-form-field>
                              @if (field.apiTriggerMode === 'MANUAL') { <button mat-flat-button color="primary" class="api-go-btn" (click)="fetchApiFieldData(field)" [disabled]="apiFieldLoading[field.name]"><mat-icon>play_arrow</mat-icon> Go</button> }
                            </div>
                            @if (hasFieldError(field)) { <div class="validation-error">{{ getFieldErrorMessage(field) }}</div> }
                          </div>
                        }
                        @case ('OBJECT_VIEWER') {
                          <div class="field-container api-field-container object-viewer-container">
                            @if (apiFieldLoading[field.name]) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-loading-overlay">
                                <mat-spinner diameter="24"></mat-spinner>
                                <span>Getting Data</span>
                              </div>
                            } @else if (apiFieldErrors[field.name]) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-error">
                                <mat-icon>error_outline</mat-icon>
                                <span>{{ apiFieldErrors[field.name] }}</span>
                                <button mat-stroked-button (click)="fetchApiFieldData(field)"><mat-icon>refresh</mat-icon> Retry</button>
                              </div>
                            } @else if (field.apiTriggerMode === 'MANUAL' && apiFieldData[field.name] == null) {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-manual-trigger">
                                <button mat-flat-button color="primary" (click)="fetchApiFieldData(field)">
                                  <mat-icon>play_arrow</mat-icon> Go
                                </button>
                              </div>
                            } @else if (apiFieldData[field.name] != null) {
                              <mat-expansion-panel class="ov-panel">
                                <mat-expansion-panel-header>
                                  <mat-panel-title>
                                    <mat-icon class="ov-panel-icon">account_tree</mat-icon>
                                    {{ field.label }}
                                  </mat-panel-title>
                                  <mat-panel-description>
                                    {{ getOvTypeBadge(apiFieldData[field.name]) }}
                                  </mat-panel-description>
                                </mat-expansion-panel-header>
                                <div class="object-viewer">
                                  <div class="ov-toolbar">
                                    @if (field.apiTriggerMode === 'MANUAL') {
                                      <button mat-stroked-button (click)="fetchApiFieldData(field); $event.stopPropagation()" matTooltip="Re-fetch data"><mat-icon>play_arrow</mat-icon> Go</button>
                                    }
                                    <button mat-stroked-button (click)="expandAllObjectViewer(field.name); $event.stopPropagation()" matTooltip="Expand All"><mat-icon>unfold_more</mat-icon></button>
                                    <button mat-stroked-button (click)="collapseAllObjectViewer(field.name); $event.stopPropagation()" matTooltip="Collapse All"><mat-icon>unfold_less</mat-icon></button>
                                  </div>
                                  <div class="ov-tree" (click)="onOvTreeClick($event, field.name)">
                                    @for (node of getOvNodes(apiFieldData[field.name], field.name, 0); track node.path) {
                                      @if (node.expandable) {
                                        <div class="ov-key-row ov-expandable" [style.padding-left]="(node.depth * 16) + 'px'" [attr.data-path]="node.path">
                                          <mat-icon class="ov-toggle">{{ node.expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                                          <span class="ov-key">{{ node.key }}</span>
                                          <span class="ov-type-badge">{{ node.badge }}</span>
                                        </div>
                                      } @else {
                                        <div class="ov-key-row ov-leaf" [style.padding-left]="(node.depth * 16) + 'px'">
                                          <span class="ov-dot"></span>
                                          <span class="ov-key">{{ node.key }}:</span>
                                          <span class="ov-value" [class]="'ov-val-' + node.valueType">{{ node.value }}</span>
                                        </div>
                                      }
                                    }
                                  </div>
                                </div>
                              </mat-expansion-panel>
                            } @else {
                              <label class="field-label">{{ field.label }}</label>
                              <div class="api-data-display"><p class="no-data-hint">No data returned</p></div>
                            }
                          </div>
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
          }

          <!-- Attachments (not shown on Summary screen) -->
          @if (!isSummaryScreen && workflow.requireAttachments) {
            <mat-card class="form-card">
              <mat-card-header>
                <mat-card-title>Attachments</mat-card-title>
                <mat-card-subtitle>Upload supporting documents</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="attachment-area">
                  <input type="file" #fileInput (change)="onAttachmentSelect($event)" multiple hidden>
                  <button mat-stroked-button matTooltip="Add Attachments" type="button" (click)="fileInput.click()">
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
                          <button mat-icon-button matTooltip="Close" (click)="removeAttachment(i)">
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

          <!-- Summary Section for Single-Page Forms - Shows fields with inSummary=true -->
          @if (!isMultiStep && workflow?.showSummary && hasSummaryFields()) {
            <mat-card class="form-card summary-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>summarize</mat-icon>
                  Summary
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <table class="summary-table">
                  <thead>
                    <tr>
                      @if (isMultiStep) {
                        <th class="screen-col">Screen</th>
                      }
                      <th class="label-col">Field</th>
                      <th class="value-col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (field of getSummaryFields(); track field.id) {
                      <tr>
                        @if (isMultiStep) {
                          <td class="screen-col">{{ getFieldScreenName(field) }}</td>
                        }
                        <td class="label-col">{{ field.label }}</td>
                        <td class="value-col">
                          @if ((field.type || field.fieldType) === 'FILE' && (getExistingAttachments(field.name).length > 0 || getSelectedFiles(field.name).length > 0)) {
                            <div class="summary-file-list">
                              @for (att of getExistingAttachments(field.name); track att.id) {
                                <mat-chip>
                                  <mat-icon matChipAvatar>description</mat-icon>
                                  {{ att.name }}
                                </mat-chip>
                              }
                              @for (file of getSelectedFiles(field.name); track $index) {
                                <mat-chip>
                                  <mat-icon matChipAvatar>description</mat-icon>
                                  {{ file.name }}
                                </mat-chip>
                              }
                            </div>
                          } @else {
                            {{ getFieldDisplayValue(field) }}
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>
          }

          <!-- Actions -->
          <!-- Form Actions - Different layouts for single page vs multi-step -->
          @if (!isMultiStep) {
            <!-- Single Page Form Actions -->
            <div class="form-actions">
              <button mat-button matTooltip="Cancel" type="button" (click)="goBack()">Cancel</button>
              <button mat-stroked-button matTooltip="Save Draft" type="button" (click)="saveDraft()" [disabled]="submitting">
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
                <button mat-button matTooltip="Cancel" type="button" (click)="goBack()">Cancel</button>
                <span class="spacer"></span>
                <button mat-raised-button matTooltip="Go Forward" color="primary" type="button" (click)="goToNextScreen()">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              } @else if (isLastScreen) {
                <!-- Last Screen: Back + Cancel/Save Draft/Submit -->
                <button mat-stroked-button matTooltip="Back" type="button" (click)="goToPreviousScreen()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <span class="spacer"></span>
                <button mat-button matTooltip="Cancel" type="button" (click)="goBack()">Cancel</button>
                <button mat-stroked-button matTooltip="Save Draft" type="button" (click)="saveDraft()" [disabled]="submitting">
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
                <button mat-stroked-button matTooltip="Back" type="button" (click)="goToPreviousScreen()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
                <span class="spacer"></span>
                <button mat-raised-button matTooltip="Go Forward" color="primary" type="button" (click)="goToNextScreen()">
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

    .parent-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      color: #1565c0;
      font-size: 0.9rem;
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
      grid-template-columns: repeat(2, 1fr);
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

    .radio-field,
    .toggle-field,
    .yes-no-field,
    .checkbox-group-field,
    .checkbox-single-field {
      padding-bottom: 0.75rem;
    }

    .radio-field .validation-error,
    .toggle-field .validation-error,
    .yes-no-field .validation-error,
    .checkbox-group-field .validation-error,
    .checkbox-single-field .validation-error {
      margin-top: 0.5rem;
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
      table-layout: fixed;
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

    .data-table td select,
    .data-table td textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid transparent;
      border-radius: 4px;
      font-size: 0.875rem;
      box-sizing: border-box;
    }

    .data-table td {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .data-table .actions-cell {
      width: 40px;
      text-align: center;
    }

    .data-table .empty-table {
      text-align: center;
      padding: 1rem;
      color: #999;
    }

    .sql-table-wrapper { overflow-x: auto; }
    .sql-table-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
    }
    .sql-table-search input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 13px;
      flex: 1;
    }
    .sql-table-search mat-icon { color: #999; font-size: 20px; width: 20px; height: 20px; }
    .sql-result-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .sql-result-table th {
      background: #f5f5f5;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    .sql-result-table td {
      padding: 6px 12px;
    }
    .sql-result-table.table-bordered th,
    .sql-result-table.table-bordered td {
      border: 1px solid #e0e0e0;
    }
    .sql-result-table.table-striped tbody tr:nth-child(odd) { background: #fafafa; }
    .sql-result-table tbody tr:hover { background: #e3f2fd; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { background: #e8e8e8; }
    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 4px; }
    .sql-table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      font-size: 12px;
      color: #666;
    }
    .sql-table-pager {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sql-table-pager button { transform: scale(0.85); }

    .data-table.table-striped tbody tr:nth-child(odd) {
      background: #fafafa;
    }

    .data-table.table-bordered {
      border: 1px solid #ddd;
    }

    .data-table.table-bordered th,
    .data-table.table-bordered td {
      border: 1px solid #ddd;
    }

    .table-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .row-count {
      font-size: 0.85rem;
      color: #666;
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

    .file-hint {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.25rem;
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

    /* Summary Section Styles */
    .summary-card {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }

    .summary-card mat-card-header {
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 1rem;
    }

    .summary-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      color: #333;
    }

    .summary-card mat-card-title mat-icon {
      color: #1976d2;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .summary-table th,
    .summary-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .summary-table th {
      background: #f5f5f5;
      font-weight: 500;
      color: #666;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-file-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .summary-table tbody tr:hover {
      background: #f9f9f9;
    }

    .summary-table tbody tr:last-child td {
      border-bottom: none;
    }

    .summary-table .screen-col {
      width: 20%;
      color: #666;
      font-size: 0.85rem;
    }

    .summary-table .label-col {
      width: 35%;
      font-weight: 500;
      color: #333;
    }

    .summary-table .value-col {
      width: 45%;
      color: #666;
    }

    /* Dark mode support for summary */
    :host-context(.dark-mode) .summary-card mat-card-header {
      border-bottom-color: #424242;
    }

    :host-context(.dark-mode) .summary-card mat-card-title {
      color: #fff;
    }

    :host-context(.dark-mode) .summary-table th {
      background: #333;
      color: #bbb;
    }

    :host-context(.dark-mode) .summary-table td {
      border-bottom-color: #424242;
    }

    :host-context(.dark-mode) .summary-table tbody tr:hover {
      background: #2a2a2a;
    }

    :host-context(.dark-mode) .summary-table .label-col {
      color: #fff;
    }

    :host-context(.dark-mode) .summary-table .value-col,
    :host-context(.dark-mode) .summary-table .screen-col {
      color: #bbb;
    }

    /* No Summary Fields Message */
    .no-summary-fields {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #666;
    }

    .no-summary-fields mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #999;
      margin-bottom: 1rem;
    }

    .no-summary-fields p {
      margin: 0.25rem 0;
    }

    .no-summary-fields .hint {
      font-size: 0.85rem;
      color: #999;
    }

    :host-context(.dark-mode) .no-summary-fields {
      color: #bbb;
    }

    :host-context(.dark-mode) .no-summary-fields mat-icon {
      color: #666;
    }

    :host-context(.dark-mode) .no-summary-fields .hint {
      color: #666;
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

    .select-search-box {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      gap: 8px;
      position: sticky;
      top: 0;
      z-index: 1;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
    }

    .select-search-box mat-icon {
      color: #999;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .select-search-input {
      border: none;
      outline: none;
      font-size: 14px;
      width: 100%;
      background: transparent;
    }

    :host-context(.dark-mode) .select-search-box {
      background: #333;
      border-color: #555;
    }

    :host-context(.dark-mode) .select-search-input {
      color: #e0e0e0;
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

    :host-context(.dark-mode) .data-table.table-striped tbody tr:nth-child(odd) {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .data-table.table-bordered {
      border-color: #444;
    }

    :host-context(.dark-mode) .data-table.table-bordered th,
    :host-context(.dark-mode) .data-table.table-bordered td {
      border-color: #444;
    }

    :host-context(.dark-mode) .row-count {
      color: #aaa;
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

    /* Accordion and Collapsible Styles */
    .accordion-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .accordion-label {
      display: block;
      margin-bottom: 12px;
      font-weight: 500;
      font-size: 14px;
      color: #333;
    }

    .workflow-accordion {
      width: 100%;
    }

    .workflow-accordion .collapsible-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .workflow-accordion ::ng-deep .mat-expansion-panel {
      margin-bottom: 8px;
      border-radius: 8px !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .workflow-accordion ::ng-deep .mat-expansion-panel-header {
      font-weight: 500;
    }

    .workflow-accordion ::ng-deep .mat-expansion-panel-header-title {
      display: flex;
      align-items: center;
    }

    .collapsible-content {
      padding: 16px 0;
    }

    .collapsible-content.fields-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .standalone-collapsible {
      width: 100%;
      margin-bottom: 16px;
    }

    .standalone-collapsible ::ng-deep .mat-expansion-panel {
      border-radius: 8px !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .standalone-collapsible .collapsible-icon {
      margin-right: 8px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Accordion Animation Classes */
    .workflow-accordion.smooth-animation ::ng-deep .mat-expansion-panel-body {
      transition: all 0.3s ease-in-out;
    }

    .workflow-accordion.bounce-animation ::ng-deep .mat-expansion-panel-body {
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .workflow-accordion.no-animation ::ng-deep .mat-expansion-panel-body {
      transition: none;
    }

    /* Dark mode styles for accordion/collapsible */
    :host-context(.dark-mode) .accordion-label {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .workflow-accordion ::ng-deep .mat-expansion-panel {
      background: #333 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
    }

    :host-context(.dark-mode) .workflow-accordion ::ng-deep .mat-expansion-panel-header {
      background: #333 !important;
    }

    :host-context(.dark-mode) .workflow-accordion ::ng-deep .mat-expansion-panel-header-title {
      color: #e0e0e0 !important;
    }

    :host-context(.dark-mode) .standalone-collapsible ::ng-deep .mat-expansion-panel {
      background: #333 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
    }

    :host-context(.dark-mode) .collapsible-icon {
      color: #aaa;
    }

    /* API field blocking overlay */
    .api-blocking-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .api-blocking-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px 48px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
    }

    :host-context(.dark-mode) .api-blocking-content {
      background: #2d2d2d;
      color: #e0e0e0;
    }

    /* API field containers */
    .api-field-container {
      position: relative;
    }

    .api-loading-overlay {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px dashed #ccc;
      color: #666;
    }

    :host-context(.dark-mode) .api-loading-overlay {
      background: #2d2d2d;
      border-color: #555;
      color: #aaa;
    }

    .api-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fff3f3;
      border: 1px solid #ffcdd2;
      border-radius: 8px;
      color: #c62828;
      font-size: 0.875rem;
    }

    .api-error button {
      margin-left: auto;
    }

    :host-context(.dark-mode) .api-error {
      background: #3e2020;
      border-color: #5a2020;
      color: #ef9a9a;
    }

    .api-input-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .api-input-row .full-width {
      flex: 1;
    }

    .api-go-btn {
      height: 56px;
      min-width: 80px;
    }

    .api-input-spinner {
      display: inline-flex;
      align-items: center;
    }

    .api-input-error {
      color: #f44336 !important;
    }

    :host-context(.dark-mode) .api-input-error {
      color: #ef9a9a !important;
    }

    .api-manual-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #f5f5f5;
      border: 2px dashed #ccc;
      border-radius: 8px;
    }

    :host-context(.dark-mode) .api-manual-trigger {
      background: #2d2d2d;
      border-color: #555;
    }

    .api-refresh-btn {
      margin-bottom: 8px;
    }

    .api-data-display {
      padding: 12px 16px;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      min-height: 48px;
    }

    :host-context(.dark-mode) .api-data-display {
      background: #2d2d2d;
      border-color: #444;
      color: #e0e0e0;
    }

    .api-value-text {
      font-size: 1rem;
      font-weight: 500;
      padding: 4px 0;
      display: block;
    }

    .api-object-props {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 12px;
    }

    .api-prop-key {
      font-weight: 600;
      color: #555;
      font-size: 0.875rem;
    }

    :host-context(.dark-mode) .api-prop-key {
      color: #aaa;
    }

    .api-prop-value {
      font-size: 0.875rem;
    }

    .api-table-wrapper {
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }

    .api-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .api-table th {
      background: #e3f2fd;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #90caf9;
      position: sticky;
      top: 0;
    }

    :host-context(.dark-mode) .api-table th {
      background: #1a3a5c;
      border-bottom-color: #2a5a8c;
      color: #e0e0e0;
    }

    .api-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #eee;
    }

    :host-context(.dark-mode) .api-table td {
      border-bottom-color: #444;
    }

    .api-table tbody tr:hover {
      background: #f5f5f5;
    }

    :host-context(.dark-mode) .api-table tbody tr:hover {
      background: #383838;
    }

    .api-list-items {
      margin: 0;
      padding-left: 20px;
    }

    .api-list-items li {
      padding: 4px 0;
      font-size: 0.9rem;
    }

    .no-data-hint {
      color: #999;
      font-style: italic;
      margin: 0;
    }

    /* Object Viewer */
    .ov-panel {
      border-radius: 8px !important;
      box-shadow: none !important;
      border: 1px solid #e0e0e0;
    }

    :host-context(.dark-mode) .ov-panel {
      border-color: #444;
    }

    .ov-panel-icon {
      margin-right: 8px;
      color: #5c2d91;
    }

    :host-context(.dark-mode) .ov-panel-icon {
      color: #ce93d8;
    }

    .object-viewer {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      overflow: hidden;
    }

    :host-context(.dark-mode) .object-viewer {
      background: #1e1e1e;
      border-color: #444;
    }

    .ov-toolbar {
      display: flex;
      gap: 4px;
      padding: 6px 12px;
      background: #f0f0f0;
      border-bottom: 1px solid #e0e0e0;
    }

    :host-context(.dark-mode) .ov-toolbar {
      background: #2a2a2a;
      border-bottom-color: #444;
    }

    .ov-toolbar button {
      min-width: 0;
      padding: 0 6px;
      line-height: 28px;
      height: 28px;
    }

    .ov-toolbar .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .ov-tree {
      padding: 8px 4px;
      max-height: 500px;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
    }

    .ov-node {
      line-height: 1.2;
    }

    .ov-key-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .ov-expandable {
      cursor: pointer;
    }

    .ov-expandable:hover {
      background: rgba(25, 118, 210, 0.08);
    }

    :host-context(.dark-mode) .ov-expandable:hover {
      background: rgba(100, 181, 246, 0.12);
    }

    .ov-toggle {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #888;
      flex-shrink: 0;
    }

    .ov-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #bbb;
      margin: 0 6px;
      flex-shrink: 0;
    }

    .ov-key {
      font-weight: 600;
      color: #5c2d91;
      margin-right: 4px;
    }

    :host-context(.dark-mode) .ov-key {
      color: #ce93d8;
    }

    .ov-value {
      word-break: break-all;
    }

    .ov-val-string { color: #0d7e3f; }
    .ov-val-number { color: #1565c0; }
    .ov-val-boolean { color: #e65100; }
    .ov-val-null { color: #999; font-style: italic; }

    :host-context(.dark-mode) .ov-val-string { color: #81c784; }
    :host-context(.dark-mode) .ov-val-number { color: #64b5f6; }
    :host-context(.dark-mode) .ov-val-boolean { color: #ffb74d; }

    .ov-type-badge {
      font-size: 0.7rem;
      padding: 0 6px;
      border-radius: 10px;
      background: #e8eaf6;
      color: #3949ab;
      margin-left: 4px;
      font-weight: 400;
    }

    :host-context(.dark-mode) .ov-type-badge {
      background: #283593;
      color: #c5cae9;
    }

    /* Table search bar */
    .table-search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      margin-bottom: 8px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    :host-context(.dark-mode) .table-search-bar {
      background: #2d2d2d;
      border-color: #444;
    }

    .table-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.9rem;
      padding: 4px 0;
      color: inherit;
    }

    /* Table scroll wrapper */
    .table-scroll-wrapper {
      overflow-x: visible;
      width: 100%;
    }

    /* Column filter input */
    .col-filter-input {
      width: 100%;
      border: none;
      border-top: 1px solid #ddd;
      outline: none;
      padding: 4px 6px;
      font-size: 0.75rem;
      background: #fafafa;
      margin-top: 4px;
      box-sizing: border-box;
    }

    :host-context(.dark-mode) .col-filter-input {
      background: #333;
      border-top-color: #555;
      color: #e0e0e0;
    }

    /* Sortable header */
    .th-content {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .th-label {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
    }

    .th-label:hover {
      color: #1976d2;
    }

    .sort-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Column resize handle */
    .col-resize-handle {
      width: 4px;
      cursor: col-resize;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      background: transparent;
    }

    .col-resize-handle:hover {
      background: #1976d2;
    }

    .table-resizable th {
      position: relative;
    }

    /* Table footer */
    .table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Pagination */
    .table-pagination {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-left: auto;
    }

    .page-info {
      font-size: 0.8rem;
      color: #666;
      margin-right: 4px;
    }

    :host-context(.dark-mode) .page-info {
      color: #aaa;
    }

    .table-pagination .mat-mdc-icon-button {
      width: 32px;
      height: 32px;
      padding: 4px;
    }

    .table-pagination .mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
  // Pre-computed arrays for different field categories (set once during initialization)
  private _ungroupedFields: WorkflowField[] = [];
  private _nestedFieldIds: Set<string> = new Set(); // IDs of fields that have a parentFieldId
  fieldGroups: FieldGroup[] = [];
  screens: Screen[] = [];
  currentScreenIndex = 0;
  selectedFiles: Record<string, File[]> = {};
  sqlTableData: Record<string, { loading: boolean; error: string | null; columns: any[]; data: any[] }> = {};
  sqlTableState: Record<string, { search: string; sortField: string; sortDir: 'asc' | 'desc'; page: number }> = {};
  existingAttachments: Record<string, any[]> = {}; // Already-uploaded attachments by field name
  existingGeneralAttachments: any[] = []; // Already-uploaded general attachments (no field name)
  attachments: File[] = [];
  instanceId: string | null = null;
  parentInstanceId: string | null = null;
  isEditMode = false;
  existingFieldValues: Record<string, any> = {};
  checkboxGroupValues: Record<string, string[]> = {};

  // Track calculated fields and their dependencies
  private calculatedFields: Map<string, { expression: string; fieldType: string; dependencies: string[] }> = new Map();
  private subscriptions: Subscription[] = [];

  // Track fields with time-based default values (NOW, TODAY, etc.) that should be evaluated at submit time
  private timeBasedFields: Map<string, { expression: string; fieldType: string }> = new Map();

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
  userCorporateFilter: Record<string, string[]> = {};
  allCorporates: any[] = [];

  // Select field search
  selectSearchTerms: Record<string, string> = {};

  // Accordion expansion state: accordionFieldId -> array of expanded collapsible indices
  accordionExpandedState: Record<string, Set<number>> = {};

  // API field data
  apiFieldData: Record<string, any> = {};
  apiFieldLoading: Record<string, boolean> = {};
  apiFieldErrors: Record<string, string | null> = {};

  // Per-screen draft saving
  private hasScreenNotifiers = false;
  private draftInstanceId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,
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
    this.parentInstanceId = this.route.snapshot.queryParamMap.get('parentInstanceId') || null;
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
    console.log('[DEBUG loadInstance] Loading instance:', this.instanceId, 'isEditMode:', this.isEditMode);
    this.workflowService.getInstance(this.instanceId!).subscribe({
      next: (res) => {
        console.log('[DEBUG loadInstance] API response:', JSON.stringify(res, null, 2).substring(0, 2000));
        if (res.success && res.data) {
          // Extract field values from instance
          // fieldValues is returned as an object/map from the backend, not an array
          if (res.data.fieldValues) {
            const fieldValues = res.data.fieldValues as any;
            console.log('[DEBUG loadInstance] fieldValues type:', typeof fieldValues, 'isArray:', Array.isArray(fieldValues));
            console.log('[DEBUG loadInstance] fieldValues:', JSON.stringify(fieldValues));
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
          } else {
            console.log('[DEBUG loadInstance] NO fieldValues in response data');
          }
          console.log('[DEBUG loadInstance] existingFieldValues after extraction:', JSON.stringify(this.existingFieldValues));

          // Load existing attachments and group by field name
          if (res.data.attachments && res.data.attachments.length > 0) {
            res.data.attachments.forEach((att: any) => {
              const a = { id: att.id, name: att.originalFileName || att.originalFilename, size: att.fileSize, fieldName: att.fieldName };
              if (att.fieldName) {
                if (!this.existingAttachments[att.fieldName]) {
                  this.existingAttachments[att.fieldName] = [];
                }
                this.existingAttachments[att.fieldName].push(a);
              } else {
                this.existingGeneralAttachments.push(a);
              }
            });
          }
        } else {
          console.log('[DEBUG loadInstance] Response not successful or no data. success:', res.success, 'data:', !!res.data);
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
    console.log('[DEBUG initializeForm] Called. isEditMode:', this.isEditMode, 'existingFieldValues:', JSON.stringify(this.existingFieldValues));
    if (!this.workflow?.forms?.[0]) {
      console.warn('No workflow forms found for initialization');
      return;
    }

    // Clear tracking maps
    this.calculatedFields.clear();
    this.timeBasedFields.clear();

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
        // Explicitly preserve parentFieldId for accordion/collapsible nesting
        allFieldsMap.set(fieldId, {
          ...f,
          fieldGroupId: groupId,
          parentFieldId: f.parentFieldId || null
        });
      }
    });

    // Then, add any fields from fieldGroups that aren't already in the map
    fieldGroups.forEach((group: any) => {
      if (group.fields && Array.isArray(group.fields)) {
        group.fields.forEach((f: any) => {
          const fieldId = f.id?.toString();
          if (fieldId && !allFieldsMap.has(fieldId)) {
            allFieldsMap.set(fieldId, {
              ...f,
              fieldGroupId: group.id?.toString(),
              parentFieldId: f.parentFieldId || null
            });
          }
        });
      }
    });

    // Convert map to array and normalize fields
    console.log('=== FIELD MAPPING DEBUG ===');
    console.log('Raw fields from allFieldsMap:', Array.from(allFieldsMap.values()).map(f => ({ id: f.id, name: f.name, type: f.type, fieldType: f.fieldType, parentFieldId: f.parentFieldId })));
    this.fields = Array.from(allFieldsMap.values()).map(f => {
      const fieldType = (f.type || f.fieldType || 'TEXT').toString().toUpperCase();
      const mapped = {
        ...f,
        type: fieldType,
        fieldType: fieldType,
        required: f.required ?? f.isMandatory ?? false,
        hidden: f.hidden ?? f.isHidden ?? false,
        readOnly: f.readOnly ?? f.isReadonly ?? false,
        // Explicitly preserve parentFieldId for accordion/collapsible nesting
        parentFieldId: f.parentFieldId || null
      };
      if (f.parentFieldId) {
        console.log(`Field "${f.name}" mapped with parentFieldId: ${mapped.parentFieldId}`);
      }
      return mapped;
    });
    console.log('Mapped fields:', this.fields.map(f => ({ id: f.id, name: f.name, type: f.type, parentFieldId: f.parentFieldId })));

    // Pre-compute nested field IDs and ungrouped fields ONCE during initialization
    this._nestedFieldIds = new Set<string>();
    this.fields.forEach(f => {
      if (f.parentFieldId) {
        this._nestedFieldIds.add(f.id);
        console.log(`NESTED FIELD REGISTERED: "${f.name}" (id=${f.id}) -> parent=${f.parentFieldId}`);
      }
    });

    // Pre-compute ungrouped fields (excluding nested fields)
    this._ungroupedFields = this.fields.filter(f => {
      const isNested = this._nestedFieldIds.has(f.id);
      const hasGroup = !!f.fieldGroupId;
      const isHidden = f.hidden || f.isHidden;
      if (isNested) {
        console.log(`EXCLUDING FROM UNGROUPED: "${f.name}" - is nested field`);
      }
      return !isNested && !hasGroup && !isHidden;
    });
    console.log('PRE-COMPUTED UNGROUPED FIELDS:', this._ungroupedFields.map(f => f.name));

    this.fieldGroups = fieldGroups;
    // Filter screens based on user's role and privilege access
    const allScreens = (mainForm.screens || []).sort((a: Screen, b: Screen) => (a.displayOrder || 0) - (b.displayOrder || 0));
    this.screens = allScreens.filter(screen => this.hasScreenAccess(screen));
    this.currentScreenIndex = 0;
    this.hasScreenNotifiers = this.screens.some(s => s.notifiers && s.notifiers.length > 0);

    // Navigate to a specific screen if ?screen=screenId is in the URL
    const targetScreenId = this.route.snapshot.queryParamMap.get('screen');
    if (targetScreenId) {
      const idx = this.screens.findIndex(s => s.id === targetScreenId);
      if (idx >= 0) {
        this.currentScreenIndex = idx;
      }
    }

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
        console.log(`[DEBUG initializeForm] EDIT MODE - field "${field.name}" (type: ${field.type}) = "${defaultValue}"`);

        // Type-specific conversions for existing values
        if (field.type === 'CHECKBOX') {
          defaultValue = defaultValue === 'true' || defaultValue === true;
        } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
          defaultValue = Number(defaultValue) || null;
        } else if (field.type === 'DATE' || field.type === 'DATETIME') {
          // Convert to proper format for datetime-local/date inputs
          if (defaultValue) {
            const dateVal = defaultValue instanceof Date ? defaultValue : new Date(defaultValue);
            if (!isNaN(dateVal.getTime())) {
              defaultValue = field.type === 'DATETIME' ? this.formatDateTime(dateVal) : this.formatDate(dateVal);
            } else {
              defaultValue = null;
            }
          } else {
            defaultValue = null;
          }
        }
      } else if (field.defaultValue) {
        if (this.isEditMode) {
          console.log(`[DEBUG initializeForm] EDIT MODE - field "${field.name}" NOT in existingFieldValues. Available keys:`, Object.keys(this.existingFieldValues));
        }
        // Resolve 'self' keyword to actual field name in default value expressions
        field.defaultValue = this.resolveSelf(field.defaultValue, field.name);
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
          // Check if this is a time-based function that should be evaluated at submit time
          const isTimeBasedFunction = this.isTimeBasedFunction(field.defaultValue);

          if (isTimeBasedFunction && !this.isEditMode) {
            // Track for evaluation at submit time, set placeholder for now
            this.timeBasedFields.set(field.name, {
              expression: field.defaultValue,
              fieldType: field.type
            });
            // Show current time as preview, but it will be refreshed at submit
            defaultValue = this.evaluateDefaultValue(field.defaultValue, field.type);

            // Convert Date objects to proper format for datetime-local/date inputs
            if (defaultValue instanceof Date) {
              if (field.type === 'DATETIME') {
                // datetime-local input requires YYYY-MM-DDTHH:MM format
                defaultValue = this.formatDateTime(defaultValue);
              } else if (field.type === 'DATE') {
                // date input requires YYYY-MM-DD format
                defaultValue = this.formatDate(defaultValue);
              }
            } else if ((field.type === 'DATE' || field.type === 'DATETIME') && defaultValue) {
              // If it's a string that looks like a date, convert it
              const dateVal = new Date(defaultValue);
              if (!isNaN(dateVal.getTime())) {
                defaultValue = field.type === 'DATETIME' ? this.formatDateTime(dateVal) : this.formatDate(dateVal);
              }
            }
          } else {
            // No field dependencies - evaluate immediately
            defaultValue = this.evaluateDefaultValue(field.defaultValue, field.type);

            // Type-specific conversions for evaluated defaults
            if (field.type === 'CHECKBOX') {
              defaultValue = defaultValue === 'true' || defaultValue === true || false;
            } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
              defaultValue = defaultValue ? Number(defaultValue) : null;
            } else if (field.type === 'DATE' || field.type === 'DATETIME') {
              // Convert Date objects to proper format for datetime-local/date inputs
              if (defaultValue instanceof Date) {
                defaultValue = field.type === 'DATETIME' ? this.formatDateTime(defaultValue) : this.formatDate(defaultValue);
              } else if (defaultValue) {
                // If it's a string that looks like a date, convert it to proper format
                const dateVal = new Date(defaultValue);
                if (!isNaN(dateVal.getTime())) {
                  defaultValue = field.type === 'DATETIME' ? this.formatDateTime(dateVal) : this.formatDate(dateVal);
                }
              }
            }
          }
        }
      }

      formControls[field.name] = [defaultValue, validators];
    });

    this.form = this.fb.group(formControls);

    // Load SQL_TABLE field data (skip manual trigger fields)
    this.fields.filter(f => (f.type === 'SQL_TABLE' || f.fieldType === 'SQL_TABLE') && f.sqlQuery && f.apiTriggerMode !== 'MANUAL')
      .forEach(field => this.loadSqlTableData(field));

    // Safety net: explicitly patch existing field values after form creation
    // This ensures values are set even if FormBuilder initial values have issues
    if (this.isEditMode && Object.keys(this.existingFieldValues).length > 0) {
      const patchData: Record<string, any> = {};
      this.fields.forEach(field => {
        if (this.existingFieldValues[field.name] !== undefined && this.form.get(field.name)) {
          let value = this.existingFieldValues[field.name];
          // Apply type-specific conversions
          if (field.type === 'CHECKBOX') {
            value = value === 'true' || value === true;
          } else if (field.type === 'NUMBER' || field.type === 'CURRENCY') {
            value = Number(value) || null;
          } else if (field.type === 'DATE' || field.type === 'DATETIME') {
            if (value) {
              const dateVal = value instanceof Date ? value : new Date(value);
              if (!isNaN(dateVal.getTime())) {
                value = field.type === 'DATETIME' ? this.formatDateTime(dateVal) : this.formatDate(dateVal);
              } else {
                value = null;
              }
            } else {
              value = null;
            }
          }
          patchData[field.name] = value;
        }
      });
      console.log('[DEBUG initializeForm] Patching form with existing values:', JSON.stringify(patchData));
      this.form.patchValue(patchData, { emitEvent: false });
    }

    // Set up reactive subscriptions for calculated fields
    this.setupCalculatedFieldSubscriptions();

    // Trigger initial calculation for all calculated fields
    this.calculatedFields.forEach((config, fieldName) => {
      this.recalculateField(fieldName, config);
    });

    // Set up validation subscriptions for fields with validation expressions
    this.setupValidationSubscriptions();

    // Fetch data for API field types
    this.initApiFields();

    // Force change detection to ensure view reflects form values
    this.cdr.detectChanges();
  }

  onSqlTableSearch(fieldName: string, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (!this.sqlTableState[fieldName]) this.sqlTableState[fieldName] = { search: '', sortField: '', sortDir: 'asc', page: 0 };
    this.sqlTableState[fieldName].search = val;
    this.sqlTableState[fieldName].page = 0;
  }

  onSqlTableSort(fieldName: string, colField: string) {
    if (!this.sqlTableState[fieldName]) this.sqlTableState[fieldName] = { search: '', sortField: '', sortDir: 'asc', page: 0 };
    const st = this.sqlTableState[fieldName];
    if (st.sortField === colField) {
      st.sortDir = st.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      st.sortField = colField;
      st.sortDir = 'asc';
    }
  }

  getSqlTableFilteredRows(fieldName: string): any[] {
    const td = this.sqlTableData[fieldName];
    if (!td?.data) return [];
    let rows = [...td.data];
    const st = this.sqlTableState[fieldName];
    if (st?.search) {
      const s = st.search.toLowerCase();
      rows = rows.filter(r => td.columns.some((c: any) => String(r[c.field] ?? '').toLowerCase().includes(s)));
    }
    if (st?.sortField) {
      rows.sort((a, b) => {
        const va = a[st.sortField] ?? '';
        const vb = b[st.sortField] ?? '';
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
        return st.sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  getSqlTableDisplayRows(field: any): any[] {
    const rows = this.getSqlTableFilteredRows(field.name);
    if (!field.tablePageable) return rows;
    const pageSize = field.tablePageSize || 10;
    const page = this.sqlTableState[field.name]?.page || 0;
    return rows.slice(page * pageSize, (page + 1) * pageSize);
  }

  getSqlTableTotalPages(field: any): number {
    const rows = this.getSqlTableFilteredRows(field.name);
    const pageSize = field.tablePageSize || 10;
    return Math.ceil(rows.length / pageSize);
  }

  sqlTablePageChange(fieldName: string, delta: number) {
    if (!this.sqlTableState[fieldName]) this.sqlTableState[fieldName] = { search: '', sortField: '', sortDir: 'asc', page: 0 };
    this.sqlTableState[fieldName].page = Math.max(0, (this.sqlTableState[fieldName].page || 0) + delta);
  }

  loadSqlTableData(field: any) {
    this.sqlTableData[field.name] = { loading: true, error: null, columns: [], data: [] };
    this.sqlTableState[field.name] = { search: '', sortField: '', sortDir: 'asc', page: 0 };
    this.http.post<any>(`${environment.apiUrl}/sql-objects/execute-query`, {
      query: field.sqlQuery,
      columns: field.sqlTableColumns || null
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sqlTableData[field.name] = {
            loading: false,
            error: null,
            columns: res.data.columns || [],
            data: res.data.data || []
          };
        } else {
          this.sqlTableData[field.name] = { loading: false, error: res.message || 'Failed to load data', columns: [], data: [] };
        }
      },
      error: (err) => {
        this.sqlTableData[field.name] = {
          loading: false,
          error: err.error?.message || 'Query execution failed',
          columns: [],
          data: []
        };
      }
    });
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
    // Parse arguments without resolving field values, respecting nested parentheses
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (const char of argsStr) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (char === ',' && !inQuotes && parenDepth === 0) {
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
      console.log(`[validateAllFields] field="${field.name}" validation="${field.validation}" customValidationRule="${field.customValidationRule}"`);
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

      // FILE field minFiles validation
      if ((field as any).fieldType === 'FILE' || (field as any).type === 'FILE') {
        const minFiles = (field as any).minFiles;
        if (minFiles && minFiles > 0) {
          const existingCount = (this.existingAttachments[field.name] || []).length;
          const selectedCount = (this.selectedFiles[field.name] || []).length;
          const totalFiles = existingCount + selectedCount;
          if (totalFiles < minFiles) {
            const errorMsg = `${field.label} requires at least ${minFiles} file${minFiles > 1 ? 's' : ''} (${totalFiles} attached)`;
            this.validationErrors[field.name] = errorMsg;
            const control = this.form.get(field.name);
            if (control) {
              control.setErrors({ ...control.errors, customValidation: errorMsg });
              control.markAsTouched();
            }
          }
        }
      }
    });
    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  private applyAllTransformations() {
    this.fields.forEach(field => {
      const transformExpr = field.customValidationRule;
      if (!transformExpr || !transformExpr.trim()) return;

      const control = this.form.get(field.name);
      if (!control) return;

      let value = control.value;
      if (value === null || value === undefined) return;

      try {
        // Resolve 'self' keyword to actual field name
        const resolvedExpr = this.resolveSelf(transformExpr, field.name);
        const transforms = this.splitOutsideQuotes(resolvedExpr, /\s+AND\s+/i).map((t: string) => t.trim());
        for (const transform of transforms) {
          value = this.applySingleTransform(transform, value);
        }
        control.setValue(value, { emitEvent: false });
      } catch (e) {
        // Skip transform errors silently
      }
    });
  }

  private applySingleTransform(expression: string, value: any): any {
    const strValue = value != null ? String(value) : '';

    // UPPER()
    if (/^UPPER\(\)$/i.test(expression)) return strValue.toUpperCase();

    // LOWER()
    if (/^LOWER\(\)$/i.test(expression)) return strValue.toLowerCase();

    // TRIM()
    if (/^TRIM\(\)$/i.test(expression)) return strValue.trim();

    // TRIM_LEFT() / LTRIM()
    if (/^(TRIM_LEFT|LTRIM)\(\)$/i.test(expression)) return strValue.trimStart();

    // TRIM_RIGHT() / RTRIM()
    if (/^(TRIM_RIGHT|RTRIM)\(\)$/i.test(expression)) return strValue.trimEnd();

    // CAPITALIZE()
    if (/^CAPITALIZE\(\)$/i.test(expression)) {
      return strValue.replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    // ROUND(decimals)
    const roundMatch = expression.match(/^ROUND\(\s*(\d+)\s*\)$/i);
    if (roundMatch) {
      const decimals = parseInt(roundMatch[1], 10);
      const num = parseFloat(strValue);
      if (!isNaN(num)) return Number(num.toFixed(decimals));
      return value;
    }

    // ROUND_UP(decimals)
    const roundUpMatch = expression.match(/^ROUND_UP\(\s*(\d+)\s*\)$/i);
    if (roundUpMatch) {
      const decimals = parseInt(roundUpMatch[1], 10);
      const num = parseFloat(strValue);
      if (!isNaN(num)) {
        const factor = Math.pow(10, decimals);
        return Math.ceil(num * factor) / factor;
      }
      return value;
    }

    // ROUND_DOWN(decimals)
    const roundDownMatch = expression.match(/^ROUND_DOWN\(\s*(\d+)\s*\)$/i);
    if (roundDownMatch) {
      const decimals = parseInt(roundDownMatch[1], 10);
      const num = parseFloat(strValue);
      if (!isNaN(num)) {
        const factor = Math.pow(10, decimals);
        return Math.floor(num * factor) / factor;
      }
      return value;
    }

    // PAD_LEFT(length, char)
    const padLeftMatch = expression.match(/^PAD_LEFT\(\s*(\d+)\s*,\s*(?:"([^"]*)"|'([^']*)'|(\S))\s*\)$/i);
    if (padLeftMatch) {
      const len = parseInt(padLeftMatch[1], 10);
      const ch = padLeftMatch[2] || padLeftMatch[3] || padLeftMatch[4] || ' ';
      return strValue.padStart(len, ch);
    }

    // PAD_RIGHT(length, char)
    const padRightMatch = expression.match(/^PAD_RIGHT\(\s*(\d+)\s*,\s*(?:"([^"]*)"|'([^']*)'|(\S))\s*\)$/i);
    if (padRightMatch) {
      const len = parseInt(padRightMatch[1], 10);
      const ch = padRightMatch[2] || padRightMatch[3] || padRightMatch[4] || ' ';
      return strValue.padEnd(len, ch);
    }

    // SUBSTRING(start, end)
    const substringMatch = expression.match(/^SUBSTRING\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (substringMatch) {
      const start = parseInt(substringMatch[1], 10);
      const end = parseInt(substringMatch[2], 10);
      return strValue.substring(start, end);
    }

    // REPLACE(search, replacement)
    const replaceMatch = expression.match(/^REPLACE\(\s*(?:"([^"]*)"|'([^']*)')\s*,\s*(?:"([^"]*)"|'([^']*)')\s*\)$/i);
    if (replaceMatch) {
      const search = replaceMatch[1] || replaceMatch[2] || '';
      const replacement = replaceMatch[3] || replaceMatch[4] || '';
      return strValue.split(search).join(replacement);
    }

    // REMOVE_SPACES()
    if (/^REMOVE_SPACES\(\)$/i.test(expression)) return strValue.replace(/\s/g, '');

    // SLUG()
    if (/^SLUG\(\)$/i.test(expression)) {
      return strValue.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    }

    return value; // Unknown transform, return unchanged
  }

  /** Replace 'self' keyword with the actual field name in expressions.
   *  Supports @{self}, @{ self }, and bare 'self' as a function argument. */
  private resolveSelf(expression: string, fieldName: string): string {
    if (!expression || !expression.includes('self')) return expression;
    // Replace @{self} with @{fieldName}
    let resolved = expression.replace(/@\{\s*self\s*\}/gi, `@{${fieldName}}`);
    // Replace bare 'self' when used as a function argument (not inside quotes, not part of a longer word)
    // e.g., Required(self) → Required(@{fieldName}), ValidWhen(self > 0) → ValidWhen(@{fieldName} > 0)
    resolved = resolved.replace(/\b(?<!')self(?!')\b/gi, (match, offset) => {
      // Don't replace if inside a quoted string
      const before = resolved.substring(0, offset);
      const singleQuotes = (before.match(/'/g) || []).length;
      const doubleQuotes = (before.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) return match;
      return `@{${fieldName}}`;
    });
    return resolved;
  }

  private evaluateValidation(field: WorkflowField): string | null {
    const expression = field.validation;
    if (!expression) return null;

    try {
      // Resolve 'self' keyword to actual field name
      const resolved = this.resolveSelf(expression, field.name);
      // Parse and evaluate validation expression(s)
      // Support combining with AND
      const parts = this.splitOutsideQuotes(resolved, /\s+AND\s+/i);

      for (const part of parts) {
        const trimmed = part.trim();
        const error = this.evaluateSingleValidation(trimmed, field);
        if (error) {
          // Custom error message from builder's "Validation & Transformation" section takes precedence
          if (field.validationMessage && field.validationMessage.trim()) {
            return field.validationMessage.trim();
          }
          return error;
        }
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
    if (/^ValidWhen\s*\(/i.test(expression)) {
      const { expr, message } = this.parseWhenFunction(expression, 'ValidWhen');
      if (expr !== null) {
        // Skip evaluation if the current field value is empty (unless combined with Required)
        if (value === null || value === undefined || value === '' ||
            (typeof value === 'string' && value.trim() === '')) {
          return null;
        }
        const result = this.evaluateCondition(expr);
        const isValid = result === true || result === 'true' || result === 0 || result === '0';
        if (!isValid) {
          return message || `${fieldLabel} validation failed`;
        }
        return null;
      }
    }

    // InvalidWhen(expression, "message") or InvalidWhen(expression)
    if (/^InvalidWhen\s*\(/i.test(expression)) {
      const { expr, message } = this.parseWhenFunction(expression, 'InvalidWhen');
      if (expr !== null) {
        // Skip evaluation if the current field value is empty (unless combined with Required)
        if (value === null || value === undefined || value === '' ||
            (typeof value === 'string' && value.trim() === '')) {
          return null;
        }
        const result = this.evaluateCondition(expr);
        const isInvalid = result === true || result === 'true' ||
                          (typeof result === 'number' && result !== 0) ||
                          (typeof result === 'string' && result !== '0' && result !== 'false' && result !== '');
        if (isInvalid) {
          return message || `${fieldLabel} validation failed`;
        }
        return null;
      }
    }

    // MinLength(n) or MinLength(n, "message")
    const minLengthMatch = expression.match(/^MinLength\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minLengthMatch) {
      const minLen = parseInt(minLengthMatch[1], 10);
      const customMessage = minLengthMatch[2] || minLengthMatch[3];
      const strValue = value ? String(value) : '';
      if (strValue && strValue.length < minLen) {
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
      if (strValue && strValue.length > maxLen) {
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

    // Email / IS_EMAIL / IsEmail ("message")
    const emailMatch = expression.match(/^(?:Email|IS_EMAIL|IsEmail)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (emailMatch) {
      const customMessage = emailMatch[1] || emailMatch[2];
      const strValue = value ? String(value) : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (strValue && !emailRegex.test(strValue)) {
        return customMessage || `${fieldLabel} must be a valid email address`;
      }
      return null;
    }

    // Phone / IS_PHONE / IsPhone ("message")
    const phoneMatch = expression.match(/^(?:Phone|IS_PHONE|IsPhone)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
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

    // URL / IS_URL / IsUrl ("message")
    const urlMatch = expression.match(/^(?:URL|IS_URL|IsUrl)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
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
      if (strValue && (strValue.length < minLen || strValue.length > maxLen)) {
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

    // Date / IS_DATE / IsDate ("message") - valid date format
    const dateMatch = expression.match(/^(?:Date|IS_DATE|IsDate)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
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

    // NotEmpty() or NotEmpty("message") - value must not be empty/whitespace
    const notEmptyMatch = expression.match(/^NotEmpty\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (notEmptyMatch) {
      const customMessage = notEmptyMatch[1] || notEmptyMatch[2];
      const strValue = value ? String(value) : '';
      if (!strValue.trim()) {
        return customMessage || `${fieldLabel} must not be empty`;
      }
      return null;
    }

    // Equals(value, "message") - must equal a specific value
    const equalsMatch = expression.match(/^Equals\(\s*(?:"([^"]*)"|'([^']*)'|(-?[\d.]+))(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (equalsMatch) {
      const expected = equalsMatch[1] || equalsMatch[2] || equalsMatch[3];
      const customMessage = equalsMatch[4] || equalsMatch[5];
      const strValue = value != null ? String(value) : '';
      if (strValue && strValue !== expected) {
        return customMessage || `${fieldLabel} must equal "${expected}"`;
      }
      return null;
    }

    // Contains(text, "message") - must contain a substring
    const containsMatch = expression.match(/^Contains\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (containsMatch) {
      const search = containsMatch[1] || containsMatch[2] || '';
      const customMessage = containsMatch[3] || containsMatch[4];
      const strValue = value ? String(value) : '';
      if (strValue && !strValue.includes(search)) {
        return customMessage || `${fieldLabel} must contain "${search}"`;
      }
      return null;
    }

    // StartsWith(text, "message")
    const startsWithMatch = expression.match(/^StartsWith\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (startsWithMatch) {
      const prefix = startsWithMatch[1] || startsWithMatch[2] || '';
      const customMessage = startsWithMatch[3] || startsWithMatch[4];
      const strValue = value ? String(value) : '';
      if (strValue && !strValue.startsWith(prefix)) {
        return customMessage || `${fieldLabel} must start with "${prefix}"`;
      }
      return null;
    }

    // EndsWith(text, "message")
    const endsWithMatch = expression.match(/^EndsWith\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (endsWithMatch) {
      const suffix = endsWithMatch[1] || endsWithMatch[2] || '';
      const customMessage = endsWithMatch[3] || endsWithMatch[4];
      const strValue = value ? String(value) : '';
      if (strValue && !strValue.endsWith(suffix)) {
        return customMessage || `${fieldLabel} must end with "${suffix}"`;
      }
      return null;
    }

    // MatchField(otherFieldName, "message") - must match another field
    const matchFieldMatch = expression.match(/^MatchField\(\s*(?:"([^"]*)"|'([^']*)'|([a-zA-Z_]\w*))(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (matchFieldMatch) {
      const otherFieldName = matchFieldMatch[1] || matchFieldMatch[2] || matchFieldMatch[3];
      const customMessage = matchFieldMatch[4] || matchFieldMatch[5];
      // Only validate if the current field has a value
      if (value !== null && value !== undefined && value !== '') {
        const otherValue = this.form.get(otherFieldName)?.value;
        const otherField = this.fields.find(f => f.name === otherFieldName);
        const otherLabel = otherField?.label || otherFieldName;
        if (value !== otherValue) {
          return customMessage || `${fieldLabel} must match ${otherLabel}`;
        }
      }
      return null;
    }

    // IsTrue("message") - boolean must be true (for checkboxes/toggles)
    const isTrueMatch = expression.match(/^IsTrue\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (isTrueMatch) {
      const customMessage = isTrueMatch[1] || isTrueMatch[2];
      if (value !== true && value !== 'true') {
        return customMessage || `${fieldLabel} must be checked`;
      }
      return null;
    }

    // IsFalse("message") - boolean must be false
    const isFalseMatch = expression.match(/^IsFalse\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (isFalseMatch) {
      const customMessage = isFalseMatch[1] || isFalseMatch[2];
      // null/undefined counts as false (unchecked)
      if (value === true || value === 'true') {
        return customMessage || `${fieldLabel} must not be checked`;
      }
      return null;
    }

    // MinItems(n, "message") - for multi-select, array must have min items
    const minItemsMatch = expression.match(/^MinItems\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minItemsMatch) {
      const minCount = parseInt(minItemsMatch[1], 10);
      const customMessage = minItemsMatch[2] || minItemsMatch[3];
      const arr = Array.isArray(value) ? value : [];
      if (arr.length < minCount) {
        return customMessage || `${fieldLabel} must have at least ${minCount} items`;
      }
      return null;
    }

    // MaxItems(n, "message") - for multi-select, array must have max items
    const maxItemsMatch = expression.match(/^MaxItems\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxItemsMatch) {
      const maxCount = parseInt(maxItemsMatch[1], 10);
      const customMessage = maxItemsMatch[2] || maxItemsMatch[3];
      const arr = Array.isArray(value) ? value : [];
      if (arr.length > maxCount) {
        return customMessage || `${fieldLabel} must have at most ${maxCount} items`;
      }
      return null;
    }

    // Positive("message") - number must be positive
    const positiveMatch = expression.match(/^Positive\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (positiveMatch) {
      const customMessage = positiveMatch[1] || positiveMatch[2];
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue <= 0) {
        return customMessage || `${fieldLabel} must be a positive number`;
      }
      return null;
    }

    // Negative("message") - number must be negative
    const negativeMatch = expression.match(/^Negative\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (negativeMatch) {
      const customMessage = negativeMatch[1] || negativeMatch[2];
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        return customMessage || `${fieldLabel} must be a negative number`;
      }
      return null;
    }

    // Integer("message") - must be a whole number
    const integerMatch = expression.match(/^Integer\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (integerMatch) {
      const customMessage = integerMatch[1] || integerMatch[2];
      const strValue = value != null ? String(value) : '';
      if (strValue && (isNaN(Number(strValue)) || !Number.isInteger(Number(strValue)))) {
        return customMessage || `${fieldLabel} must be a whole number`;
      }
      return null;
    }

    // Decimal(places, "message") - must have up to N decimal places
    const decimalMatch = expression.match(/^Decimal\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (decimalMatch) {
      const places = parseInt(decimalMatch[1], 10);
      const customMessage = decimalMatch[2] || decimalMatch[3];
      const strValue = value != null ? String(value) : '';
      if (strValue) {
        const num = Number(strValue);
        if (isNaN(num)) {
          return customMessage || `${fieldLabel} must be a valid number`;
        }
        const decimalPart = strValue.includes('.') ? strValue.split('.')[1] : '';
        if (decimalPart.length > places) {
          return customMessage || `${fieldLabel} must have at most ${places} decimal places`;
        }
      }
      return null;
    }

    // MinRows(n, "message") - for TABLE fields
    const minRowsMatch = expression.match(/^MinRows\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minRowsMatch) {
      const minCount = parseInt(minRowsMatch[1], 10);
      const customMessage = minRowsMatch[2] || minRowsMatch[3];
      let rows: any[] = [];
      if (Array.isArray(value)) {
        rows = value;
      } else if (typeof value === 'string' && value.startsWith('[')) {
        try { rows = JSON.parse(value); } catch (_) { rows = []; }
      }
      // Filter out completely empty rows (all values blank)
      rows = rows.filter((r: any) => r && typeof r === 'object' && Object.values(r).some((v: any) => v !== '' && v !== null && v !== undefined));
      if (rows.length < minCount) {
        return customMessage || `${fieldLabel} must have at least ${minCount} rows`;
      }
      return null;
    }

    // MaxRows(n, "message") - for TABLE fields
    const maxRowsMatch = expression.match(/^MaxRows\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxRowsMatch) {
      const maxCount = parseInt(maxRowsMatch[1], 10);
      const customMessage = maxRowsMatch[2] || maxRowsMatch[3];
      let rows: any[] = [];
      if (Array.isArray(value)) {
        rows = value;
      } else if (typeof value === 'string' && value.startsWith('[')) {
        try { rows = JSON.parse(value); } catch (_) { rows = []; }
      }
      if (rows.length > maxCount) {
        return customMessage || `${fieldLabel} must have at most ${maxCount} rows`;
      }
      return null;
    }

    // MinFiles(n, "message") - for FILE fields
    const minFilesMatch = expression.match(/^MinFiles\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minFilesMatch) {
      const minCount = parseInt(minFilesMatch[1], 10);
      const customMessage = minFilesMatch[2] || minFilesMatch[3];
      const fieldName = field.name;
      const existingCount = (this.existingAttachments[fieldName] || []).length;
      const selectedCount = (this.selectedFiles[fieldName] || []).length;
      const totalFiles = existingCount + selectedCount;
      if (totalFiles < minCount) {
        return customMessage || `${fieldLabel} requires at least ${minCount} file${minCount > 1 ? 's' : ''} (${totalFiles} attached)`;
      }
      return null;
    }

    // MaxFiles(n, "message") - for FILE fields
    const maxFilesMatch = expression.match(/^MaxFiles\(\s*(\d+)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxFilesMatch) {
      const maxCount = parseInt(maxFilesMatch[1], 10);
      const customMessage = maxFilesMatch[2] || maxFilesMatch[3];
      const fieldName = field.name;
      const existingCount = (this.existingAttachments[fieldName] || []).length;
      const selectedCount = (this.selectedFiles[fieldName] || []).length;
      const totalFiles = existingCount + selectedCount;
      if (totalFiles > maxCount) {
        return customMessage || `${fieldLabel} allows at most ${maxCount} file${maxCount > 1 ? 's' : ''} (${totalFiles} attached)`;
      }
      return null;
    }

    // FilesRequired("message") - at least one file must be attached (alias for MinFiles(1))
    const filesRequiredMatch = expression.match(/^FilesRequired\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (filesRequiredMatch) {
      const customMessage = filesRequiredMatch[1] || filesRequiredMatch[2];
      const fieldName = field.name;
      const existingCount = (this.existingAttachments[fieldName] || []).length;
      const selectedCount = (this.selectedFiles[fieldName] || []).length;
      if (existingCount + selectedCount === 0) {
        return customMessage || `${fieldLabel} requires at least one file`;
      }
      return null;
    }

    // FileType("ext1,ext2", "message") - validate allowed file extensions
    const fileTypeMatch = expression.match(/^FileType\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (fileTypeMatch) {
      const allowedExts = (fileTypeMatch[1] || fileTypeMatch[2] || '').split(',').map(e => e.trim().toLowerCase().replace(/^\./, ''));
      const customMessage = fileTypeMatch[3] || fileTypeMatch[4];
      const fieldName = field.name;
      const selectedFiles: File[] = this.selectedFiles[fieldName] || [];
      const invalidFiles = selectedFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return !allowedExts.includes(ext);
      });
      if (invalidFiles.length > 0) {
        return customMessage || `${fieldLabel}: file type not allowed for ${invalidFiles.map(f => f.name).join(', ')}. Allowed: ${allowedExts.join(', ')}`;
      }
      return null;
    }

    // MaxFileSize(n, "message") - validate individual file size in MB
    const maxFileSizeMatch = expression.match(/^MaxFileSize\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (maxFileSizeMatch) {
      const maxMB = parseFloat(maxFileSizeMatch[1]);
      const customMessage = maxFileSizeMatch[2] || maxFileSizeMatch[3];
      const fieldName = field.name;
      const selectedFiles: File[] = this.selectedFiles[fieldName] || [];
      const maxBytes = maxMB * 1024 * 1024;
      const oversized = selectedFiles.filter(f => f.size > maxBytes);
      if (oversized.length > 0) {
        return customMessage || `${fieldLabel}: ${oversized.map(f => f.name).join(', ')} exceeds ${maxMB}MB limit`;
      }
      return null;
    }

    // MinFileSize(n, "message") - validate minimum individual file size in MB
    const minFileSizeMatch = expression.match(/^MinFileSize\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (minFileSizeMatch) {
      const minMB = parseFloat(minFileSizeMatch[1]);
      const customMessage = minFileSizeMatch[2] || minFileSizeMatch[3];
      const fieldName = field.name;
      const selectedFiles: File[] = this.selectedFiles[fieldName] || [];
      const minBytes = minMB * 1024 * 1024;
      const tooSmall = selectedFiles.filter(f => f.size < minBytes);
      if (tooSmall.length > 0) {
        return customMessage || `${fieldLabel}: ${tooSmall.map(f => f.name).join(', ')} is smaller than ${minMB}MB minimum`;
      }
      return null;
    }

    // TotalFileSize(n, "message") - validate combined size of all files in MB
    const totalFileSizeMatch = expression.match(/^TotalFileSize\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (totalFileSizeMatch) {
      const maxTotalMB = parseFloat(totalFileSizeMatch[1]);
      const customMessage = totalFileSizeMatch[2] || totalFileSizeMatch[3];
      const fieldName = field.name;
      const selectedFiles: File[] = this.selectedFiles[fieldName] || [];
      const totalBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);
      const totalMB = totalBytes / (1024 * 1024);
      if (totalMB > maxTotalMB) {
        return customMessage || `${fieldLabel}: total file size ${totalMB.toFixed(1)}MB exceeds ${maxTotalMB}MB limit`;
      }
      return null;
    }

    // FileNamePattern("regex", "message") - validate file names against a pattern
    const fileNamePatternMatch = expression.match(/^FileNamePattern\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (fileNamePatternMatch) {
      const pattern = fileNamePatternMatch[1] || fileNamePatternMatch[2] || '';
      const customMessage = fileNamePatternMatch[3] || fileNamePatternMatch[4];
      const fieldName = field.name;
      const selectedFiles: File[] = this.selectedFiles[fieldName] || [];
      try {
        const regex = new RegExp(pattern, 'i');
        const nonMatching = selectedFiles.filter(f => !regex.test(f.name));
        if (nonMatching.length > 0) {
          return customMessage || `${fieldLabel}: ${nonMatching.map(f => f.name).join(', ')} does not match required naming pattern`;
        }
      } catch (_) { /* invalid regex, skip */ }
      return null;
    }

    // NoDuplicateFiles("message") - no two files can have the same name
    const noDupFilesMatch = expression.match(/^NoDuplicateFiles\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (noDupFilesMatch) {
      const customMessage = noDupFilesMatch[1] || noDupFilesMatch[2];
      const fieldName = field.name;
      const existingNames = (this.existingAttachments[fieldName] || []).map((a: any) => a.name?.toLowerCase());
      const selectedNames = (this.selectedFiles[fieldName] || []).map(f => f.name.toLowerCase());
      const allNames = [...existingNames, ...selectedNames];
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const name of allNames) {
        if (seen.has(name)) dupes.push(name);
        seen.add(name);
      }
      if (dupes.length > 0) {
        return customMessage || `${fieldLabel}: duplicate file names found: ${dupes.join(', ')}`;
      }
      return null;
    }

    // DateBefore / DATE_BEFORE (date, "message") - date must be before a specific date
    const dateBeforeMatch = expression.match(/^(?:DateBefore|DATE_BEFORE)\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (dateBeforeMatch) {
      const targetDate = dateBeforeMatch[1] || dateBeforeMatch[2] || '';
      const customMessage = dateBeforeMatch[3] || dateBeforeMatch[4];
      if (value) {
        const d = this.toDateOnly(value);
        const t = targetDate.toLowerCase() === 'today' ? this.toDateOnly(new Date()) : this.toDateOnly(targetDate);
        if (d && t && d.getTime() >= t.getTime()) {
          return customMessage || `${fieldLabel} must be before ${targetDate}`;
        }
      }
      return null;
    }

    // DateAfter / DATE_AFTER (date, "message") - date must be after a specific date
    const dateAfterMatch = expression.match(/^(?:DateAfter|DATE_AFTER)\(\s*(?:"([^"]*)"|'([^']*)')(?:\s*,\s*(?:"([^"]*)"|'([^']*)'))?\s*\)$/i);
    if (dateAfterMatch) {
      const targetDate = dateAfterMatch[1] || dateAfterMatch[2] || '';
      const customMessage = dateAfterMatch[3] || dateAfterMatch[4];
      if (value) {
        const d = this.toDateOnly(value);
        const t = targetDate.toLowerCase() === 'today' ? this.toDateOnly(new Date()) : this.toDateOnly(targetDate);
        if (d && t && d.getTime() <= t.getTime()) {
          return customMessage || `${fieldLabel} must be after ${targetDate}`;
        }
      }
      return null;
    }

    // FutureDate / IS_FUTURE / IsFuture ("message") - date must be in the future (strictly after today)
    const futureDateMatch = expression.match(/^(?:FutureDate|IS_FUTURE|IsFuture)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (futureDateMatch) {
      const customMessage = futureDateMatch[1] || futureDateMatch[2];
      if (value) {
        const d = this.toDateOnly(value);
        const today = this.toDateOnly(new Date())!;
        if (d && d.getTime() <= today.getTime()) {
          return customMessage || `${fieldLabel} must be a future date`;
        }
      }
      return null;
    }

    // PastDate / IS_PAST / IsPast ("message") - date must be in the past (strictly before today)
    const pastDateMatch = expression.match(/^(?:PastDate|IS_PAST|IsPast)\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)$/i);
    if (pastDateMatch) {
      const customMessage = pastDateMatch[1] || pastDateMatch[2];
      if (value) {
        const d = this.toDateOnly(value);
        const today = this.toDateOnly(new Date())!;
        if (d && d.getTime() >= today.getTime()) {
          return customMessage || `${fieldLabel} must be a past date`;
        }
      }
      return null;
    }

    // Fallback: try to evaluate as a function library expression
    // This allows ALL library functions (IS_PAST, IS_FUTURE, IS_EMPTY, IS_NUMBER,
    // BETWEEN, IN, NOT_IN, EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH, REGEX_MATCH,
    // IS_WEEKEND, IS_WORKDAY, IS_UPPERCASE, IS_LOWERCASE, etc.) to work as validators
    try {
      // Extract trailing custom message if present: FUNC(args, "message")
      let resolvedExpr = expression;
      let fallbackMessage: string | null = null;
      const trailingMsg = resolvedExpr.match(/,\s*"([^"]*)"\s*\)$/);
      const trailingMsgSingle = resolvedExpr.match(/,\s*'([^']*)'\s*\)$/);
      if (trailingMsg) {
        fallbackMessage = trailingMsg[1];
        resolvedExpr = resolvedExpr.slice(0, resolvedExpr.length - trailingMsg[0].length) + ')';
      } else if (trailingMsgSingle) {
        fallbackMessage = trailingMsgSingle[1];
        resolvedExpr = resolvedExpr.slice(0, resolvedExpr.length - trailingMsgSingle[0].length) + ')';
      }

      // If function has empty parens like IS_PAST(), inject current field value
      const emptyFuncMatch = resolvedExpr.match(/^([A-Z_]+)\(\s*\)$/i);
      if (emptyFuncMatch && value != null && value !== '') {
        const funcName = emptyFuncMatch[1].toUpperCase();
        // For functions that take a single value argument, auto-inject
        const autoInjectFuncs = [
          'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_NULL', 'IS_BLANK', 'IS_NUMBER',
          'IS_UPPERCASE', 'IS_LOWERCASE', 'IS_PAST', 'IS_FUTURE',
          'IS_WEEKEND', 'IS_WORKDAY', 'LENGTH', 'TRIM', 'UPPER', 'LOWER',
          'ABS', 'FLOOR', 'CEIL', 'TRUNC', 'SIGN', 'SQRT', 'YEAR', 'MONTH', 'DAY',
          'HOUR', 'MINUTE', 'SECOND', 'WEEKDAY', 'WEEK_OF_YEAR', 'QUARTER',
          'START_OF_MONTH', 'END_OF_MONTH', 'START_OF_YEAR', 'END_OF_YEAR',
          'START_OF_WEEK', 'AGE', 'REVERSE', 'CAPITALIZE', 'TITLE_CASE'
        ];
        if (autoInjectFuncs.includes(funcName)) {
          const injectValue = typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` :
                              value instanceof Date ? `"${value.toISOString()}"` : String(value);
          resolvedExpr = `${funcName}(${injectValue})`;
        }
      }

      // Resolve @{fieldName} references
      resolvedExpr = resolvedExpr.replace(/@\{([^}]+)\}/g, (match, fieldName) => {
        const fVal = this.form.get(fieldName.trim())?.value;
        if (fVal === null || fVal === undefined || fVal === '') return '""';
        if (fVal instanceof Date) return `"${fVal.toISOString()}"`;
        if (typeof fVal === 'string') return `"${fVal.replace(/"/g, '\\"')}"`;
        if (typeof fVal === 'number') return String(fVal);
        if (typeof fVal === 'boolean') return String(fVal);
        // For objects (e.g. Material Moment adapter date), try to extract date
        if (fVal && typeof fVal === 'object' && typeof fVal.toISOString === 'function') {
          return `"${fVal.toISOString()}"`;
        }
        if (fVal && typeof fVal === 'object' && fVal.getTime) {
          return `"${new Date(fVal.getTime()).toISOString()}"`;
        }
        return `"${String(fVal)}"`;
      });

      console.log('[Validation Fallback] Resolved:', resolvedExpr, 'isFuncExpr:', this.isFunctionExpression(resolvedExpr));

      if (this.isFunctionExpression(resolvedExpr)) {
        const result = this.evaluateFunction(resolvedExpr, field.type || 'TEXT');
        console.log('[Validation Fallback] Result:', result, 'type:', typeof result);

        // Check if result indicates invalid
        const resultStr = String(result).toLowerCase().trim();
        if (result === false || resultStr === 'false' || result === 0 || resultStr === '0' ||
            result === null || result === undefined || result === '') {
          return fallbackMessage || `${fieldLabel} validation failed`;
        }
        // Result is truthy = valid
        return null;
      }
    } catch (e) {
      console.warn('[Validation Fallback] Failed to evaluate expression:', expression, 'Error:', e);
    }

    return null; // Unknown validation expression
  }

  /**
   * Normalize a date value to date-only (midnight local time) for consistent comparison.
   * Handles Date objects, ISO strings, and date-only strings like "2025-03-15".
   */
  private toDateOnly(value: any): Date | null {
    if (!value) return null;
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else {
      const str = String(value);
      // Date-only string like "2025-03-15" — parse as local date, not UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, day] = str.split('-').map(Number);
        d = new Date(y, m - 1, day);
      } else {
        d = new Date(str);
      }
    }
    if (isNaN(d.getTime())) return null;
    // Strip time portion — set to midnight local
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

  /**
   * Robustly parse ValidWhen/InvalidWhen arguments, handling nested quotes.
   * Finds the LAST comma-separated quoted message argument before the closing paren.
   */
  private parseWhenFunction(expression: string, funcName: string): { expr: string | null; message: string | null } {
    // Strip function name and outer parens: "ValidWhen( ... )" -> "..."
    const funcPattern = new RegExp('^' + funcName + '\\s*\\(', 'i');
    let inner = expression.replace(funcPattern, '');
    if (inner.endsWith(')')) inner = inner.slice(0, -1);
    inner = inner.trim();

    if (!inner) return { expr: null, message: null };

    // Find the last argument that is a quoted string preceded by a comma
    // Scan from the end to find: , "message") or , 'message')
    let message: string | null = null;
    let expr = inner;

    // Check for trailing quoted message: ..., "msg" or ..., 'msg'
    const trailingDoubleQuote = inner.match(/,\s*"([^"]*)"\s*$/);
    const trailingSingleQuote = inner.match(/,\s*'([^']*)'\s*$/);

    if (trailingDoubleQuote) {
      message = trailingDoubleQuote[1];
      expr = inner.slice(0, inner.length - trailingDoubleQuote[0].length).trim();
    } else if (trailingSingleQuote) {
      // Make sure this trailing single quote is actually a message, not part of the expression
      // Heuristic: if removing it leaves a valid expression (has an operator), it's a message
      const candidateExpr = inner.slice(0, inner.length - trailingSingleQuote[0].length).trim();
      if (/[=!<>]|OR|AND|\|\||&&/i.test(candidateExpr)) {
        message = trailingSingleQuote[1];
        expr = candidateExpr;
      }
    }

    return { expr, message };
  }

  private evaluateCondition(condition: string): any {
    // Resolve @{fieldName} references first
    let resolved = condition.replace(/@\{([^}]+)\}/g, (match, fieldName) => {
      const value = this.form.get(fieldName.trim())?.value;
      if (value === null || value === undefined || value === '') return "''";
      if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'number') return value.toString();
      return `'${String(value)}'`;
    });

    // Normalize JS-style operators to internal format
    // Do == before = replacement; handle && and ||
    resolved = resolved.replace(/\|\|/g, ' OR ').replace(/&&/g, ' AND ');

    // Handle OR first (lower precedence)
    if (/\s+OR\s+/i.test(resolved)) {
      const parts = this.splitOutsideQuotes(resolved, /\s+OR\s+/i);
      for (const part of parts) {
        if (this.evaluateCondition(part.trim())) return true;
      }
      return false;
    }

    // Handle AND
    if (/\s+AND\s+/i.test(resolved)) {
      const parts = this.splitOutsideQuotes(resolved, /\s+AND\s+/i);
      for (const part of parts) {
        if (!this.evaluateCondition(part.trim())) return false;
      }
      return true;
    }

    // Parse comparison operators (== before =)
    const comparisonMatch = resolved.match(/^(.+?)\s*(===|!==|==|!=|>=|<=|>|<|=)\s*(.+)$/);
    if (comparisonMatch) {
      const leftExpr = comparisonMatch[1].trim();
      const operator = comparisonMatch[2];
      const rightExpr = comparisonMatch[3].trim();

      const leftValue = this.resolveValue(leftExpr);
      const rightValue = this.resolveValue(rightExpr);

      switch (operator) {
        case '===':
          return leftValue === rightValue;
        case '!==':
          return leftValue !== rightValue;
        case '==':
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

    // Try evaluating as a function expression directly (e.g. IS_PAST("2025-01-01"))
    if (this.isFunctionExpression(resolved)) {
      try {
        const funcResult = this.evaluateFunction(resolved, 'TEXT');
        // Convert string results to proper types
        if (funcResult === 'true' || funcResult === true) return true;
        if (funcResult === 'false' || funcResult === false) return false;
        return funcResult;
      } catch (e) {
        // Fall through to resolveValue
      }
    }

    // If no operator and not a function, just resolve the value
    return this.resolveValue(resolved);
  }

  private splitOutsideQuotes(str: string, separator: RegExp): string[] {
    // Split by separator but only outside quoted strings
    const result: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; current += ch; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; current += ch; continue; }

      if (!inSingle && !inDouble) {
        // Check if separator matches at this position
        const remaining = str.slice(i);
        const match = remaining.match(separator);
        if (match && match.index === 0) {
          result.push(current);
          current = '';
          i += match[0].length - 1; // skip separator
          continue;
        }
      }
      current += ch;
    }
    if (current) result.push(current);
    return result.length > 0 ? result : [str];
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
    } else if (config.fieldType === 'DATE' || config.fieldType === 'DATETIME') {
      // Convert to proper format for datetime-local/date inputs
      if (newValue instanceof Date) {
        newValue = config.fieldType === 'DATETIME' ? this.formatDateTime(newValue) : this.formatDate(newValue);
      } else if (newValue) {
        const dateVal = new Date(newValue);
        if (!isNaN(dateVal.getTime())) {
          newValue = config.fieldType === 'DATETIME' ? this.formatDateTime(dateVal) : this.formatDate(dateVal);
        }
      }
    }

    // Update the form control value without emitting to avoid loops
    const control = this.form.get(fieldName);
    if (control && control.value !== newValue) {
      control.setValue(newValue, { emitEvent: false });
    }
  }

  getUngroupedFields(): WorkflowField[] {
    // Return pre-computed ungrouped fields (computed once during initialization)
    // This ensures nested fields (with parentFieldId) are NEVER included
    return this._ungroupedFields;
  }

  /**
   * Check if a field is a nested field (has a parentFieldId)
   */
  isNestedField(fieldId: string): boolean {
    return this._nestedFieldIds.has(fieldId);
  }

  getFieldsInGroup(groupId: string): WorkflowField[] {
    const gid = groupId?.toString();

    // In multi-step mode, also filter by screenId
    if (this.isMultiStep) {
      const screenId = this.currentScreen?.id?.toString();
      const isFirstScreen = this.currentScreenIndex === 0;

      return this.fields.filter(f => {
        // Exclude nested fields (pre-computed), group mismatch, and hidden
        if (f.fieldGroupId?.toString() !== gid || this._nestedFieldIds.has(f.id) || f.hidden || f.isHidden) {
          return false;
        }
        const fieldScreenId = f.screenId?.toString();
        return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
      });
    }

    // Exclude nested fields (pre-computed)
    return this.fields.filter(f => f.fieldGroupId?.toString() === gid && !this._nestedFieldIds.has(f.id) && !(f.hidden || f.isHidden));
  }

  /**
   * Check if the current user has access to a screen based on role and privilege restrictions.
   * Returns true if:
   * - Screen has no restrictions (no roleNames and no privilegeNames)
   * - User is ADMIN
   * - If privileges are specified: user has any of the required privileges (roles ignored)
   * - If only roles are specified: user has any of the required roles
   */
  hasScreenAccess(screen: Screen): boolean {
    // If no restrictions, everyone has access
    const hasRoleRestrictions = screen.roleNames && screen.roleNames.length > 0;
    const hasPrivilegeRestrictions = screen.privilegeNames && screen.privilegeNames.length > 0;

    if (!hasRoleRestrictions && !hasPrivilegeRestrictions) {
      return true;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }

    // ADMIN users bypass all restrictions
    if (currentUser.roles?.includes('ADMIN') || currentUser.roles?.includes('ROLE_ADMIN')) {
      return true;
    }

    // If privileges are specified, they take precedence over roles
    if (hasPrivilegeRestrictions) {
      const hasMatchingPrivilege = screen.privilegeNames!.some(privName =>
        currentUser.privileges?.includes(privName)
      );
      // Return the result - don't fall through to role check
      return hasMatchingPrivilege;
    }

    // Check role restrictions only if no privileges are specified
    if (hasRoleRestrictions) {
      const hasMatchingRole = screen.roleNames!.some(roleName =>
        currentUser.roles?.includes(roleName)
      );
      return hasMatchingRole;
    }

    return false;
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

  get isSummaryScreen(): boolean {
    return this.currentScreen?.isSummaryScreen === true;
  }

  getUngroupedFieldsOnScreen(): WorkflowField[] {
    if (!this.isMultiStep) {
      return this._ungroupedFields;
    }
    const screenId = this.currentScreen?.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    // Filter pre-computed ungrouped fields by screen
    return this._ungroupedFields.filter(f => {
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

  // Get all fields marked for summary (inSummary: true) from all screens
  getSummaryFields(): WorkflowField[] {
    return this.fields.filter(f => f.inSummary === true && !(f.hidden || f.isHidden));
  }

  // Check if there are any summary fields to display
  hasSummaryFields(): boolean {
    return this.getSummaryFields().length > 0;
  }

  // Get the display value for a field (human-readable format)
  getFieldDisplayValue(field: WorkflowField): string {
    const value = this.form.get(field.name)?.value;

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (field.type || field.fieldType) {
      case 'SELECT':
      case 'RADIO':
        // Find the label for the selected value
        const option = field.options?.find(o => o.value === value);
        return option?.label || value;

      case 'MULTISELECT':
      case 'CHECKBOX_GROUP':
        // Handle array of values
        if (Array.isArray(value)) {
          const labels = value.map(v => {
            const opt = field.options?.find(o => o.value === v);
            return opt?.label || v;
          });
          return labels.join(', ') || '-';
        }
        // Handle comma-separated string
        if (typeof value === 'string' && value.includes(',')) {
          const vals = value.split(',').map(v => v.trim());
          const labels = vals.map(v => {
            const opt = field.options?.find(o => o.value === v);
            return opt?.label || v;
          });
          return labels.join(', ') || '-';
        }
        return value;

      case 'CHECKBOX':
      case 'TOGGLE':
        return value === true || value === 'true' ? 'Yes' : 'No';

      case 'YES_NO':
        return value === true || value === 'true' || value === 'yes' ? 'Yes' : 'No';

      case 'DATE':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        // Try to parse and format the date string
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        } catch (e) {}
        return value;

      case 'DATETIME':
        if (value instanceof Date) {
          return value.toLocaleString();
        }
        // Try to parse and format the datetime string
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString();
          }
        } catch (e) {}
        return value;

      case 'TIME':
        return value;

      case 'CURRENCY':
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return '$' + num.toFixed(2);
        }
        return value;

      case 'FILE':
      case 'IMAGE':
        const existingNames = (this.existingAttachments[field.name] || []).map((a: any) => a.name);
        const newNames = (this.selectedFiles[field.name] || []).map(f => f.name);
        const allNames = [...existingNames, ...newNames];
        if (allNames.length > 0) {
          return allNames.join(', ');
        }
        return '-';

      case 'USER':
        if (this.selectedUsers[field.name]) {
          const user = this.selectedUsers[field.name];
          return `${user.firstName} ${user.lastName}`;
        }
        return value;

      case 'RATING':
        return `${value} / ${field.ratingMax || 5}`;

      case 'SLIDER':
        return String(value);

      case 'TABLE':
        // For table fields, show row count
        const rows = this.getTableRows(field);
        return `${rows.length} row${rows.length !== 1 ? 's' : ''}`;

      case 'SQL_OBJECT':
        // Find label from field options
        if (field.options) {
          if (Array.isArray(value)) {
            const labels = value.map(v => {
              const opt = field.options?.find(o => o.value === v);
              return opt?.label || v;
            });
            return labels.join(', ') || '-';
          }
          const opt = field.options.find(o => o.value === value);
          return opt?.label || value;
        }
        return value;

      case 'COLOR':
        return value;

      case 'LOCATION':
        return value;

      case 'BARCODE':
        return value;

      case 'RICH_TEXT':
        // Strip HTML tags for display
        const stripped = String(value).replace(/<[^>]*>/g, '');
        return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;

      case 'HIDDEN':
      case 'DIVIDER':
      case 'LABEL':
        return '-';

      default:
        return String(value);
    }
  }

  // Get the screen name for a field (for multi-step forms)
  getFieldScreenName(field: WorkflowField): string {
    if (!this.isMultiStep || !field.screenId) {
      return '';
    }
    const screen = this.screens.find(s => s.id?.toString() === field.screenId?.toString());
    return screen?.title || '';
  }

  goToNextScreen(): void {
    if (this.validateCurrentScreen()) {
      if (this.hasScreenNotifiers) {
        // Save draft first so we have an instanceId for the review link
        this.saveScreenDraft().subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.draftInstanceId = res.data.id;
            }
            this.sendScreenNotification(this.currentScreen);
            this.advanceScreen();
          },
          error: () => {
            // Draft save failed — still advance and send notification
            this.sendScreenNotification(this.currentScreen);
            this.advanceScreen();
          }
        });
      } else {
        // No notifiers on any screen — original behavior
        this.sendScreenNotification(this.currentScreen);
        this.advanceScreen();
      }
    }
  }

  private advanceScreen(): void {
    if (this.currentScreenIndex < this.screens.length - 1) {
      this.currentScreenIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private getCurrentScreenFieldValues(): Record<string, any> {
    const screen = this.currentScreen;
    if (!screen) return {};
    const screenId = screen.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    const fieldValues: Record<string, any> = {};
    for (const field of this.fields) {
      const fieldScreenId = field.screenId?.toString();
      if (fieldScreenId === screenId || (isFirstScreen && !fieldScreenId)) {
        let value = this.form.value[field.name];
        if (field.type === 'USER' && value && typeof value === 'object' && value.id) {
          value = value.id;
        }
        fieldValues[field.name] = value;
      }
    }
    return fieldValues;
  }

  private saveScreenDraft(): Observable<any> {
    const formData = new FormData();
    formData.append('workflowCode', this.workflowCode);
    formData.append('isDraft', 'true');

    const fieldValues = this.getCurrentScreenFieldValues();
    formData.append('fieldValues', JSON.stringify(fieldValues));

    const effectiveInstanceId = this.instanceId || this.draftInstanceId;
    if (effectiveInstanceId) {
      return this.workflowService.updateInstance(effectiveInstanceId, formData);
    } else {
      return this.workflowService.submitInstance(formData);
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

    this.hasAttemptedSubmit = true;

    const screenId = this.currentScreen.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    const fieldsOnScreen = this.fields.filter(f => {
      const fieldScreenId = f.screenId?.toString();
      return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
    });

    // Apply transformations for fields on this screen first
    fieldsOnScreen.forEach(field => {
      const transformExpr = field.customValidationRule;
      if (!transformExpr || !transformExpr.trim()) return;
      const control = this.form.get(field.name);
      if (!control) return;
      let value = control.value;
      if (value === null || value === undefined) return;
      try {
        const resolvedExpr = this.resolveSelf(transformExpr, field.name);
        const transforms = this.splitOutsideQuotes(resolvedExpr, /\s+AND\s+/i).map((t: string) => t.trim());
        for (const transform of transforms) {
          value = this.applySingleTransform(transform, value);
        }
        control.setValue(value, { emitEvent: false });
      } catch (e) { /* skip */ }
    });

    let isValid = true;

    // Run custom validation expressions for fields on this screen
    fieldsOnScreen.forEach(field => {
      if (field.validation) {
        const error = this.evaluateValidation(field);
        this.validationErrors[field.name] = error;

        const control = this.form.get(field.name);
        if (control) {
          if (error) {
            control.setErrors({ ...control.errors, customValidation: error });
            control.markAsTouched();
            isValid = false;
          } else {
            if (control.errors) {
              const { customValidation, ...otherErrors } = control.errors;
              control.setErrors(Object.keys(otherErrors).length > 0 ? otherErrors : null);
            }
          }
        }
      }
    });

    // Also check Angular built-in validators (required, email, etc.)
    fieldsOnScreen.forEach(field => {
      const control = this.form.get(field.name);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    // Check custom validation errors for fields on this screen
    fieldsOnScreen.forEach(field => {
      if (this.validationErrors[field.name]) {
        isValid = false;
      }
    });

    // Check pending unique validations for fields on this screen
    if (isValid) {
      const hasPendingUnique = fieldsOnScreen.some(field =>
        field.validation && /Unique\(/i.test(field.validation) &&
        Array.from(this.pendingUniqueChecks.keys()).some(key => key.startsWith(field.name + ':'))
      );
      if (hasPendingUnique) {
        this.snackBar.open('Please wait for validation checks to complete', 'Close', { duration: 3000 });
        return false;
      }
    }

    if (!isValid) {
      const firstError = this.getFirstValidationError(fieldsOnScreen);
      this.snackBar.open(firstError || 'Please fill in all required fields on this screen', 'Close', { duration: 5000 });
    }

    this.cdr.detectChanges();
    return isValid;
  }

  isFieldReadonly(field: WorkflowField): boolean {
    return field.readOnly || field.isReadonly || false;
  }

  /**
   * Check if a specific table column is readonly.
   * A column is readonly if the table-wide readonly is set OR the column's own readonly is set.
   */
  isColumnReadonly(field: WorkflowField, col: any): boolean {
    // If the entire table is readonly, all columns are readonly
    if (this.isFieldReadonly(field)) {
      return true;
    }
    // Otherwise, check the column's own readonly property
    return col.readOnly === true;
  }

  /**
   * Check if all columns in a table are readonly (either table-wide or all individual columns).
   * Used to determine if the actions column should be hidden.
   */
  isTableFullyReadonly(field: any): boolean {
    // If table-wide readonly is set, return true
    if (this.isFieldReadonly(field)) {
      return true;
    }
    // Check if all individual columns are readonly
    const columns = this.getTableColumns(field);
    if (columns.length === 0) return false;
    return columns.every(col => col.readOnly === true);
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
    // API fields with apiShowInForm=false are hidden
    if ((field as any).apiShowInForm === false) {
      return false;
    }

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
      // Resolve 'self' keyword and evaluate the visibility expression
      const resolved = this.resolveSelf(expression, field.name);
      return this.evaluateVisibilityExpression(resolved);
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
    // If the expression is a function call (e.g. IF_EMPTY(@{x}), AND(...), IS_NOT_EMPTY(@{y})),
    // delegate to the full function evaluator so all 180+ functions work in visibility too.
    const trimmed = expression.trim();
    if (this.isFunctionExpression(trimmed)) {
      try {
        const result = this.evaluateFunction(trimmed, 'TEXT');
        if (typeof result === 'boolean') return result;
        if (typeof result === 'string') {
          const s = result.toLowerCase();
          return !(s === 'false' || s === '' || s === '0' || s === 'null' || s === 'undefined');
        }
        if (typeof result === 'number') return result !== 0;
        return !!result;
      } catch (e) {
        // Fall through to the simple evaluator below
      }
    }

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
  private getFirstValidationError(fields: WorkflowField[]): string | null {
    for (const field of fields) {
      const msg = this.getFieldErrorMessage(field);
      if (msg) return msg;
    }
    return null;
  }

  getFieldErrorMessage(field: WorkflowField): string | null {
    const control = this.form.get(field.name);
    const customMsg = field.validationMessage?.trim();

    // First check custom validation errors (from validation expressions)
    if (this.validationErrors[field.name]) {
      return this.validationErrors[field.name];
    }

    // Check if control has our custom validation error
    if (control?.hasError('customValidation')) {
      return control.getError('customValidation');
    }

    // Then check form control errors - custom message from builder takes precedence
    if (control?.hasError('required')) {
      return customMsg || `${field.label} is required`;
    }
    if (control?.hasError('email')) {
      return customMsg || 'Please enter a valid email';
    }
    if (control?.hasError('minlength')) {
      const err = control.getError('minlength');
      return customMsg || `${field.label} must be at least ${err.requiredLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      const err = control.getError('maxlength');
      return customMsg || `${field.label} must be at most ${err.requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      const err = control.getError('min');
      return customMsg || `${field.label} must be at least ${err.min}`;
    }
    if (control?.hasError('max')) {
      const err = control.getError('max');
      return customMsg || `${field.label} must be at most ${err.max}`;
    }
    if (control?.hasError('pattern')) {
      return customMsg || `${field.label} format is invalid`;
    }

    // Fallback for any other control error
    if (control?.invalid) {
      return customMsg || `${field.label} is invalid`;
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
                               'CURRENT_USER_BRANCH', 'CURRENT_USER_ROLES', 'CURRENT_USER_PRIVILEGES',
                               'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_DATETIME',
                               'CURRENT_YEAR', 'CURRENT_MONTH', 'UUID', 'SHORT_UUID', 'TIMESTAMP',
                               'PI', 'E', 'RANDOM', 'ROW', 'WORKFLOW_ID', 'WORKFLOW_NAME', 'INSTANCE_ID',
                               'INSTANCE_STATUS', 'SUBMISSION_DATE', 'SUBMITTER_NAME', 'SUBMITTER_EMAIL',
                               'APPROVAL_LEVEL', 'APPROVER_NAME', 'ENVIRONMENT', 'VERSION', 'LOCALE',
                               'TIMEZONE', 'BROWSER', 'PLATFORM', 'IS_MOBILE', 'SCREEN_WIDTH', 'SCREEN_HEIGHT'];
    return functionPattern.test(value) || noParenFunctions.includes(value.toUpperCase());
  }

  private isTimeBasedFunction(value: string): boolean {
    // Check if the value is a time-based function that should be evaluated at submit time
    if (!value) return false;
    const upperValue = value.toUpperCase().trim();
    const timeBasedFunctions = [
      'NOW', 'NOW()',
      'TODAY', 'TODAY()',
      'CURRENT_DATE', 'CURRENT_DATE()',
      'CURRENT_TIME', 'CURRENT_TIME()',
      'CURRENT_DATETIME', 'CURRENT_DATETIME()',
      'TIMESTAMP', 'TIMESTAMP()',
      'SUBMISSION_DATE', 'SUBMISSION_DATE()'
    ];
    return timeBasedFunctions.includes(upperValue);
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
      case 'RTRIM':
        return toStr(args[0]).trimEnd();
      case 'LTRIM':
        return toStr(args[0]).trimStart();
      case 'CONCAT':
        return args.join('');
      case 'CONCAT_WS': {
        // Concatenate with separator: CONCAT_WS(separator, a, b, ...)
        const separator = toStr(args[0]);
        const parts = args.slice(1).filter(a => a && toStr(a).trim() !== '');
        return parts.join(separator);
      }
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
      case 'REPLACE_ALL':
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
      case 'FORMAT_PERCENT':
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
        return this.formatDateForField(new Date(), upperFieldType || 'DATE');
      case 'NOW':
        return this.formatDateForField(new Date(), upperFieldType || 'DATETIME');
      case 'TIMESTAMP':
        return Date.now().toString();
      case 'DATE': {
        const d = new Date(toInt(args[0]), toInt(args[1]) - 1, toInt(args[2]));
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'DATETIME': {
        const d = new Date(toInt(args[0]), toInt(args[1]) - 1, toInt(args[2]), toInt(args[3]), toInt(args[4]), toInt(args[5]));
        return this.formatDateForField(d, upperFieldType || 'DATETIME');
      }
      case 'DATE_FORMAT': {
        const d = toDate(args[0]), fmt = toStr(args[1]);
        return this.formatDateWithPattern(d, fmt);
      }
      case 'DATE_PARSE':
        return new Date(toStr(args[0])).toISOString();
      case 'DATE_ADD': {
        const d = toDate(args[0]), n = toInt(args[1]), unit = toStr(args[2]).toLowerCase();
        return this.addToDate(d, n, unit, upperFieldType);
      }
      case 'DATE_SUBTRACT': {
        const d = toDate(args[0]), n = toInt(args[1]), unit = toStr(args[2]).toLowerCase();
        return this.addToDate(d, -n, unit, upperFieldType);
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
      case 'WEEK_NUMBER':
      case 'WEEK_OF_YEAR': {
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
        return this.formatDateForField(d, upperFieldType || 'DATETIME');
      }
      case 'END_OF_DAY': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setHours(23, 59, 59, 999);
        return this.formatDateForField(d, upperFieldType || 'DATETIME');
      }
      case 'START_OF_WEEK': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'END_OF_WEEK': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        const day = d.getDay() || 7;
        d.setDate(d.getDate() + (7 - day));
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'START_OF_MONTH': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setDate(1);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'END_OF_MONTH': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(d.getMonth() + 1, 0);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'START_OF_QUARTER': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'END_OF_QUARTER': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3, 0);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'START_OF_YEAR': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(0, 1);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'END_OF_YEAR': {
        const d = new Date(args[0] ? toDate(args[0]) : new Date());
        d.setMonth(11, 31);
        return this.formatDateForField(d, upperFieldType || 'DATE');
      }
      case 'IS_WEEKEND': {
        const day = (args[0] ? toDate(args[0]) : new Date()).getDay();
        return (day === 0 || day === 6).toString();
      }
      case 'IS_WEEKDAY':
      case 'IS_WORKDAY': {
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
      case 'IS_PAST': {
        const dp = args[0] ? toDate(args[0]) : new Date();
        const todayP = new Date(); todayP.setHours(0,0,0,0);
        const dpOnly = new Date(dp); dpOnly.setHours(0,0,0,0);
        return (dpOnly < todayP).toString();
      }
      case 'IS_FUTURE': {
        const df = args[0] ? toDate(args[0]) : new Date();
        const todayF = new Date(); todayF.setHours(0,0,0,0);
        const dfOnly = new Date(df); dfOnly.setHours(0,0,0,0);
        return (dfOnly > todayF).toString();
      }
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
      case 'IS_BEFORE': {
        const db1 = new Date(toDate(args[0])); db1.setHours(0,0,0,0);
        const db2 = new Date(toDate(args[1])); db2.setHours(0,0,0,0);
        return (db1 < db2).toString();
      }
      case 'IS_AFTER': {
        const da1 = new Date(toDate(args[0])); da1.setHours(0,0,0,0);
        const da2 = new Date(toDate(args[1])); da2.setHours(0,0,0,0);
        return (da1 > da2).toString();
      }
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
        return this.formatDateForField(d, upperFieldType || 'DATE');
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

      // ==================== CONDITIONAL FUNCTIONS ====================
      case 'IF':
        // IF(condition, trueValue, falseValue) — ternary; falseValue is optional (defaults to "")
        return this.evaluateCondition(args[0]) ? (args[1] ?? '') : (args[2] ?? '');
      case 'IF_ELSE':
      case 'IFELSE':
        // IF_ELSE(condition, trueValue, falseValue) — explicit if-else, same as IF but requires both branches
        return this.evaluateCondition(args[0]) ? (args[1] ?? '') : (args[2] ?? '');
      case 'IF_EMPTY':
        // IF_EMPTY(value, fallback) — return fallback if value is empty/null
        return (!args[0] || toStr(args[0]).trim() === '') ? (args[1] ?? '') : args[0];
      case 'IF_NOT_EMPTY':
        // IF_NOT_EMPTY(value, result) — return result only if value is not empty, else ""
        return (args[0] && toStr(args[0]).trim() !== '') ? (args[1] ?? '') : (args[2] ?? '');
      case 'IF_EQUALS':
        // IF_EQUALS(a, b, trueValue, falseValue) — compare and return
        return (toStr(args[0]) === toStr(args[1])) ? (args[2] ?? '') : (args[3] ?? '');
      case 'IF_GREATER':
        // IF_GREATER(a, b, trueValue, falseValue)
        return (toNum(args[0]) > toNum(args[1])) ? (args[2] ?? '') : (args[3] ?? '');
      case 'IF_LESS':
        // IF_LESS(a, b, trueValue, falseValue)
        return (toNum(args[0]) < toNum(args[1])) ? (args[2] ?? '') : (args[3] ?? '');
      case 'IF_CONTAINS':
        // IF_CONTAINS(text, search, trueValue, falseValue)
        return toStr(args[0]).toLowerCase().includes(toStr(args[1]).toLowerCase()) ? (args[2] ?? '') : (args[3] ?? '');
      case 'IF_BETWEEN':
        // IF_BETWEEN(value, min, max, trueValue, falseValue)
        { const v = toNum(args[0]); return (v >= toNum(args[1]) && v <= toNum(args[2])) ? (args[3] ?? '') : (args[4] ?? ''); }
      case 'IFS': {
        // IFS(cond1, val1, cond2, val2, ..., default) — multi-branch conditional
        for (let i = 0; i < args.length - 1; i += 2) {
          if (this.evaluateCondition(args[i])) return args[i + 1];
        }
        return args.length % 2 === 1 ? args[args.length - 1] : '';
      }
      case 'SWITCH': {
        // SWITCH(value, match1, result1, match2, result2, ..., default)
        const val = args[0];
        for (let i = 1; i < args.length - 1; i += 2) {
          if (val === args[i]) return args[i + 1];
        }
        return args.length % 2 === 0 ? args[args.length - 1] : '';
      }
      case 'CHOOSE': {
        // CHOOSE(index, val1, val2, val3, ...) — 1-based index selection
        const idx = toInt(args[0]);
        return (idx >= 1 && idx < args.length) ? args[idx] : '';
      }

      // ==================== BOOLEAN/LOGIC FUNCTIONS ====================
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
      case 'GREATER_OR_EQUAL':
        return (toNum(args[0]) >= toNum(args[1])).toString();
      case 'LESS_THAN':
        return (toNum(args[0]) < toNum(args[1])).toString();
      case 'LESS_THAN_OR_EQUAL':
      case 'LESS_OR_EQUAL':
        return (toNum(args[0]) <= toNum(args[1])).toString();
      case 'BETWEEN':
        return (toNum(args[0]) >= toNum(args[1]) && toNum(args[0]) <= toNum(args[2])).toString();
      case 'NOT_BETWEEN':
        return (toNum(args[0]) < toNum(args[1]) || toNum(args[0]) > toNum(args[2])).toString();
      case 'IN': {
        if (args.length > 2) {
          // IN(value, "a", "b", "c") — multiple args
          return args.slice(1).includes(args[0]).toString();
        }
        try { const arr = JSON.parse(args[1]); return arr.includes(args[0]).toString(); } catch { return (args[0] === args[1]).toString(); }
      }
      case 'NOT_IN': {
        if (args.length > 2) {
          return (!args.slice(1).includes(args[0])).toString();
        }
        try { const arr = JSON.parse(args[1]); return (!arr.includes(args[0])).toString(); } catch { return (args[0] !== args[1]).toString(); }
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
      case 'TRUE':
        return 'true';
      case 'FALSE':
        return 'false';
      case 'IS_TEXT':
        return (typeof args[0] === 'string').toString();
      case 'IS_DATE':
        return (!isNaN(new Date(args[0]).getTime())).toString();
      case 'IS_BOOLEAN':
        return (args[0] === 'true' || args[0] === 'false' || typeof args[0] === 'boolean').toString();
      case 'IS_EMAIL':
      case 'IS_VALID_EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toStr(args[0])).toString();
      case 'IS_URL':
      case 'IS_VALID_URL':
        try { new URL(toStr(args[0])); return 'true'; } catch { return 'false'; }
      case 'IS_PHONE':
      case 'IS_VALID_PHONE':
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

      // ==================== VALIDATION FUNCTION ALIASES ====================
      // These map validation-style names to their library equivalents
      // so all functions work consistently in both default values and validation expressions

      // String validation
      case 'REQUIRED':
      case 'NOT_EMPTY':
      case 'NOTEMPTY': {
        const v = args[0] !== undefined ? toStr(args[0]) : '';
        return (v.trim() !== '').toString();
      }
      case 'MIN_LENGTH':
      case 'MINLENGTH':
        return (toStr(args[0]).length >= toInt(args[1])).toString();
      case 'MAX_LENGTH':
      case 'MAXLENGTH':
        return (toStr(args[0]).length <= toInt(args[1])).toString();
      case 'LENGTH_RANGE':
      case 'LENGTHRANGE': {
        const len = toStr(args[0]).length;
        return (len >= toInt(args[1]) && len <= toInt(args[2])).toString();
      }
      case 'ALPHA':
        return /^[a-zA-Z]*$/.test(toStr(args[0])).toString();
      case 'ALPHA_NUMERIC':
      case 'ALPHANUMERIC':
        return /^[a-zA-Z0-9]*$/.test(toStr(args[0])).toString();
      case 'DIGITS':
        return /^\d*$/.test(toStr(args[0])).toString();
      case 'PATTERN': {
        try {
          const pat = toStr(args[1]).replace(/^\/|\/[gimsuy]*$/g, '');
          return new RegExp(pat).test(toStr(args[0])).toString();
        } catch { return 'false'; }
      }

      // Number validation
      case 'MIN_VALUE':
        return (toNum(args[0]) >= toNum(args[1])).toString();
      case 'MAX_VALUE':
        return (toNum(args[0]) <= toNum(args[1])).toString();
      case 'VALUE_RANGE':
        return (toNum(args[0]) >= toNum(args[1]) && toNum(args[0]) <= toNum(args[2])).toString();
      case 'POSITIVE':
        return (toNum(args[0]) > 0).toString();
      case 'NEGATIVE':
        return (toNum(args[0]) < 0).toString();
      case 'INTEGER':
        return Number.isInteger(toNum(args[0])).toString();
      case 'DECIMAL_PLACES': {
        const str = toStr(args[0]);
        const maxPlaces = toInt(args[1]);
        const decPart = str.includes('.') ? str.split('.')[1] : '';
        return (decPart.length <= maxPlaces).toString();
      }

      // Date validation
      case 'PAST_DATE':
      case 'PASTDATE':
      case 'ISPAST': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const today = new Date(); today.setHours(0,0,0,0);
        const dOnly = new Date(d); dOnly.setHours(0,0,0,0);
        return (dOnly < today).toString();
      }
      case 'FUTURE_DATE':
      case 'FUTUREDATE':
      case 'ISFUTURE': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const today = new Date(); today.setHours(0,0,0,0);
        const dOnly = new Date(d); dOnly.setHours(0,0,0,0);
        return (dOnly > today).toString();
      }
      case 'DATE_BEFORE':
      case 'DATEBEFORE': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const target = toStr(args[1]).toLowerCase() === 'today' ? new Date() : toDate(args[1]);
        const dOnly = new Date(d); dOnly.setHours(0,0,0,0);
        const tOnly = new Date(target); tOnly.setHours(0,0,0,0);
        return (dOnly < tOnly).toString();
      }
      case 'DATE_AFTER':
      case 'DATEAFTER': {
        const d = args[0] ? toDate(args[0]) : new Date();
        const target = toStr(args[1]).toLowerCase() === 'today' ? new Date() : toDate(args[1]);
        const dOnly = new Date(d); dOnly.setHours(0,0,0,0);
        const tOnly = new Date(target); tOnly.setHours(0,0,0,0);
        return (dOnly > tOnly).toString();
      }

      // Format validation
      case 'IS_CREDIT_CARD':
      case 'CREDITCARD':
      case 'CREDIT_CARD': {
        const card = toStr(args[0]).replace(/[\s-]/g, '');
        if (!/^\d{13,19}$/.test(card)) return 'false';
        let s = 0, even = false;
        for (let i = card.length - 1; i >= 0; i--) {
          let d = parseInt(card[i], 10);
          if (even) { d *= 2; if (d > 9) d -= 9; }
          s += d; even = !even;
        }
        return (s % 10 === 0).toString();
      }

      // Cross-field / list validation
      case 'MATCH_FIELD':
      case 'MATCHFIELD':
        return (toStr(args[0]) === toStr(args[1])).toString();
      case 'MIN_ITEMS':
      case 'MINITEMS': {
        const arr = Array.isArray(args[0]) ? args[0] : [];
        return (arr.length >= toInt(args[1])).toString();
      }
      case 'MAX_ITEMS':
      case 'MAXITEMS': {
        const arr = Array.isArray(args[0]) ? args[0] : [];
        return (arr.length <= toInt(args[1])).toString();
      }
      case 'MIN_ROWS':
      case 'MINROWS': {
        const rows = Array.isArray(args[0]) ? args[0] : [];
        return (rows.length >= toInt(args[1])).toString();
      }
      case 'MAX_ROWS':
      case 'MAXROWS': {
        const rows = Array.isArray(args[0]) ? args[0] : [];
        return (rows.length <= toInt(args[1])).toString();
      }
      case 'IS_TRUE':
      case 'ISTRUE':
        return toBool(args[0]).toString();
      case 'IS_FALSE':
      case 'ISFALSE':
        return (!toBool(args[0])).toString();

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
      case 'CURRENT_USER_DEPT':
        return currentUser?.department || '';
      case 'CURRENT_USER_STAFFID':
        return currentUser?.staffId || '';
      case 'CURRENT_USER_ROLE':
        return currentUser?.userType || '';
      case 'CURRENT_USER_SBU':
        return currentUser?.sbuIds?.[0] || '';
      case 'CURRENT_USER_BRANCH':
        return currentUser?.branchIds?.[0] || '';
      case 'CURRENT_USER_ROLES':
        return currentUser?.roles || [];
      case 'CURRENT_USER_PRIVILEGES':
        return currentUser?.privileges || [];

      // ==================== UTILITY FUNCTIONS ====================
      case 'UUID':
        return this.generateUUID();
      case 'HASH': {
        // Simple hash function for strings
        const str = toStr(args[0]);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      }
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
      case 'SETVALUE': {
        // SETVALUE(fieldName, value) — set another field's value
        // First arg must be an unquoted field name (not resolved to its value)
        const rawArgs = this.parseArgsRaw(argsStr);
        const targetFieldName = rawArgs[0]?.trim();
        if (!targetFieldName) return '';
        // Resolve the value (second arg) — could be a literal, field ref, or function
        const rawValueArg = rawArgs.slice(1).join(',').trim();
        let resolvedValue: any;
        if (rawValueArg.startsWith('"') && rawValueArg.endsWith('"')) {
          resolvedValue = rawValueArg.slice(1, -1);
        } else if (rawValueArg.startsWith("'") && rawValueArg.endsWith("'")) {
          resolvedValue = rawValueArg.slice(1, -1);
        } else if (this.isFunctionExpression(rawValueArg)) {
          resolvedValue = this.evaluateFunction(rawValueArg, fieldType);
        } else {
          // Try as field reference first, then literal
          const fieldVal = this.getFieldValue(rawValueArg);
          resolvedValue = fieldVal !== null ? String(fieldVal) : rawValueArg;
        }
        const targetControl = this.form?.get(targetFieldName);
        if (targetControl) {
          targetControl.setValue(String(resolvedValue ?? ''));
          targetControl.markAsTouched();
        }
        return resolvedValue ?? '';
      }

      // ==================== TABLE FUNCTIONS ====================
      case 'ROW':
        // Returns 1-based row number for table context
        return (this.currentTableRowIndex + 1).toString();

      case 'ROW_COUNT': {
        // Get total number of rows in a table
        const tableName = this.resolveTableName(args[0]);
        const tableData = this.tableData[tableName];
        return tableData ? tableData.length.toString() : '0';
      }

      case 'COLUMN_COUNT': {
        // Get total number of columns in a table
        const tableName = this.resolveTableName(args[0]);
        const tableField = this.fields.find(f => f.name === tableName && f.fieldType === 'TABLE');
        if (tableField) {
          const columns = this.getTableColumns(tableField);
          return columns.length.toString();
        }
        return '0';
      }

      case 'GET_CELL': {
        // Get value of a specific cell: GET_CELL(tableName, rowIndex, columnName)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const columnName = toStr(args[2]);
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          return tableData[rowIndex][columnName] || '';
        }
        return '';
      }

      case 'SET_CELL': {
        // Set value of a specific cell: SET_CELL(tableName, rowIndex, columnName, value)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const columnName = toStr(args[2]);
        const value = toStr(args[3]);
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          tableData[rowIndex][columnName] = value;
          return value;
        }
        return '';
      }

      case 'GET_ROW': {
        // Get entire row as JSON: GET_ROW(tableName, rowIndex)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          return JSON.stringify(tableData[rowIndex]);
        }
        return '{}';
      }

      case 'SET_ROW': {
        // Set entire row values from JSON: SET_ROW(tableName, rowIndex, valuesJson)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const valuesJson = toStr(args[2]);
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          try {
            const values = JSON.parse(valuesJson);
            Object.keys(values).forEach(key => {
              tableData[rowIndex][key] = values[key];
            });
            return 'true';
          } catch { return 'false'; }
        }
        return 'false';
      }

      case 'GET_COLUMN': {
        // Get all values from a column as JSON array: GET_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          const values = tableData.map(row => row[columnName] || '');
          return JSON.stringify(values);
        }
        return '[]';
      }

      case 'SUM_COLUMN': {
        // Sum all numeric values in a column: SUM_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          const sum = tableData.reduce((acc, row) => {
            const val = parseFloat(row[columnName]);
            return acc + (isNaN(val) ? 0 : val);
          }, 0);
          return sum.toString();
        }
        return '0';
      }

      case 'AVG_COLUMN': {
        // Calculate average of numeric values in a column: AVG_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData && tableData.length > 0) {
          const numericValues = tableData
            .map(row => parseFloat(row[columnName]))
            .filter(val => !isNaN(val));
          if (numericValues.length > 0) {
            const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            return avg.toString();
          }
        }
        return '0';
      }

      case 'MIN_COLUMN': {
        // Get minimum value in a column: MIN_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData && tableData.length > 0) {
          const numericValues = tableData
            .map(row => parseFloat(row[columnName]))
            .filter(val => !isNaN(val));
          if (numericValues.length > 0) {
            return Math.min(...numericValues).toString();
          }
        }
        return '';
      }

      case 'MAX_COLUMN': {
        // Get maximum value in a column: MAX_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData && tableData.length > 0) {
          const numericValues = tableData
            .map(row => parseFloat(row[columnName]))
            .filter(val => !isNaN(val));
          if (numericValues.length > 0) {
            return Math.max(...numericValues).toString();
          }
        }
        return '';
      }

      case 'COUNT_COLUMN': {
        // Count non-empty values in a column: COUNT_COLUMN(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          const count = tableData.filter(row => {
            const val = row[columnName];
            return val !== undefined && val !== null && val !== '';
          }).length;
          return count.toString();
        }
        return '0';
      }

      case 'FIND_ROW': {
        // Find row index where column matches value: FIND_ROW(tableName, columnName, searchValue)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const searchValue = toStr(args[2]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          const index = tableData.findIndex(row => row[columnName] === searchValue);
          return (index + 1).toString(); // 1-based, 0 if not found
        }
        return '0';
      }

      case 'CLEAR_ROW': {
        // Clear all values in a row: CLEAR_ROW(tableName, rowIndex)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          Object.keys(tableData[rowIndex]).forEach(key => {
            tableData[rowIndex][key] = '';
          });
          return 'true';
        }
        return 'false';
      }

      case 'DELETE_ROW': {
        // Delete a row from the table: DELETE_ROW(tableName, rowIndex)
        const tableName = this.resolveTableName(args[0]);
        const rowIndex = toNum(args[1]) - 1; // Convert to 0-based
        const tableData = this.tableData[tableName];
        if (tableData && rowIndex >= 0 && rowIndex < tableData.length) {
          tableData.splice(rowIndex, 1);
          return 'true';
        }
        return 'false';
      }

      case 'ADD_ROW': {
        // Add a new row to the table: ADD_ROW(tableName, valuesJson?)
        const tableName = this.resolveTableName(args[0]);
        const valuesJson = args[1] ? toStr(args[1]) : null;
        const tableField = this.fields.find(f => f.name === tableName && f.fieldType === 'TABLE');
        if (tableField) {
          if (!this.tableData[tableName]) {
            this.tableData[tableName] = [];
          }
          const columns = this.getTableColumns(tableField);
          const newRow: Record<string, string> = {};
          columns.forEach(col => {
            newRow[col.name] = col.defaultValue || (col.type === 'CHECKBOX' ? 'false' : '');
          });
          // Apply values from JSON if provided
          if (valuesJson) {
            try {
              const values = JSON.parse(valuesJson);
              Object.keys(values).forEach(key => {
                newRow[key] = values[key];
              });
            } catch { /* ignore parse errors */ }
          }
          this.tableData[tableName].push(newRow);
          return (this.tableData[tableName].length).toString(); // Return new row count
        }
        return '0';
      }

      case 'COPY_ROW': {
        // Copy row values to another row or new row: COPY_ROW(tableName, sourceRowIndex, targetRowIndex?)
        const tableName = this.resolveTableName(args[0]);
        const sourceIndex = toNum(args[1]) - 1; // Convert to 0-based
        const targetIndex = args[2] ? toNum(args[2]) - 1 : -1; // -1 means add new row
        const tableData = this.tableData[tableName];
        if (tableData && sourceIndex >= 0 && sourceIndex < tableData.length) {
          const copiedRow = { ...tableData[sourceIndex] };
          if (targetIndex >= 0 && targetIndex < tableData.length) {
            // Copy to existing row
            Object.keys(copiedRow).forEach(key => {
              tableData[targetIndex][key] = copiedRow[key];
            });
          } else {
            // Add as new row
            tableData.push(copiedRow);
          }
          return 'true';
        }
        return 'false';
      }

      case 'TABLE_JSON': {
        // Get entire table data as JSON array: TABLE_JSON(tableName)
        const tableName = this.resolveTableName(args[0]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          return JSON.stringify(tableData);
        }
        return '[]';
      }

      case 'SET_TABLE_FROM_JSON': {
        // Populate table from JSON array: SET_TABLE_FROM_JSON(tableName, jsonData, clearExisting?)
        const tgtTableName = this.resolveTableName(args[0]);
        const jsonData = toStr(args[1]);
        const clearExisting = args.length > 2 ? toBool(args[2]) : true;

        if (!this.tableData[tgtTableName]) {
          this.tableData[tgtTableName] = [];
        }

        if (clearExisting) {
          this.tableData[tgtTableName] = [];
        }

        try {
          const parsedData = JSON.parse(jsonData);
          if (Array.isArray(parsedData)) {
            for (const row of parsedData) {
              this.tableData[tgtTableName].push({ ...row });
            }
            return this.tableData[tgtTableName].length.toString();
          }
          return '0';
        } catch (e) {
          console.error('SET_TABLE_FROM_JSON: Invalid JSON', e);
          return '0';
        }
      }

      case 'CLEAR_TABLE': {
        // Remove all rows from table: CLEAR_TABLE(tableName)
        const tgtTableName = this.resolveTableName(args[0]);
        if (this.tableData[tgtTableName]) {
          const count = this.tableData[tgtTableName].length;
          this.tableData[tgtTableName] = [];
          return count.toString();
        }
        return '0';
      }

      case 'FILTER_TABLE': {
        // Filter table rows based on condition: FILTER_TABLE(tableName, columnName, operator, value)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const operator = toStr(args[2]);
        const value = toStr(args[3]);
        const tableData = this.tableData[tableName];

        if (!tableData) return '[]';

        const filtered = tableData.filter(row => {
          const cellValue = toStr(row[columnName] || '');
          switch (operator) {
            case '=': return cellValue === value;
            case '!=': return cellValue !== value;
            case '<': return parseFloat(cellValue) < parseFloat(value);
            case '>': return parseFloat(cellValue) > parseFloat(value);
            case '<=': return parseFloat(cellValue) <= parseFloat(value);
            case '>=': return parseFloat(cellValue) >= parseFloat(value);
            case 'contains': return cellValue.includes(value);
            case 'startsWith': return cellValue.startsWith(value);
            case 'endsWith': return cellValue.endsWith(value);
            case 'empty': return !cellValue || cellValue === '';
            case 'notEmpty': return cellValue && cellValue !== '';
            default: return cellValue === value;
          }
        });

        return JSON.stringify(filtered);
      }

      case 'SORT_TABLE': {
        // Sort table by column: SORT_TABLE(tableName, columnName, order?)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const order = toStr(args[2]).toLowerCase() === 'desc' ? 'desc' : 'asc';
        const tableData = this.tableData[tableName];

        if (!tableData) return 'false';

        tableData.sort((a, b) => {
          const valA = a[columnName] || '';
          const valB = b[columnName] || '';
          const numA = parseFloat(valA);
          const numB = parseFloat(valB);

          let result: number;
          if (!isNaN(numA) && !isNaN(numB)) {
            result = numA - numB;
          } else {
            result = valA.localeCompare(valB);
          }

          return order === 'desc' ? -result : result;
        });

        return 'true';
      }

      case 'UNIQUE_VALUES': {
        // Get unique values from column: UNIQUE_VALUES(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];

        if (!tableData) return '[]';

        const values = tableData.map(row => row[columnName] || '').filter(v => v && v !== '');
        const unique = [...new Set(values)].sort();
        return JSON.stringify(unique);
      }

      case 'MERGE_TABLES': {
        // Merge two tables: MERGE_TABLES(tableName1, tableName2, mode?)
        const targetTable = this.resolveTableName(args[0]);
        const sourceTable = this.resolveTableName(args[1]);
        const mode = toStr(args[2]).toLowerCase() || 'append';

        const targetData = this.tableData[targetTable];
        const sourceData = this.tableData[sourceTable];

        if (!targetData || !sourceData) return '0';

        let count = 0;
        if (mode === 'union') {
          const existing = new Set(targetData.map(r => JSON.stringify(r)));
          for (const row of sourceData) {
            const rowStr = JSON.stringify(row);
            if (!existing.has(rowStr)) {
              targetData.push({ ...row });
              count++;
            }
          }
        } else {
          for (const row of sourceData) {
            targetData.push({ ...row });
            count++;
          }
        }
        return count.toString();
      }

      case 'DUPLICATE_ROWS': {
        // Find or remove duplicate rows: DUPLICATE_ROWS(tableName, mode?)
        const tableName = this.resolveTableName(args[0]);
        const mode = toStr(args[1]).toLowerCase() || 'remove';
        const tableData = this.tableData[tableName];

        if (!tableData) return '0';

        const seen = new Set<string>();
        const duplicates: number[] = [];
        const toRemove: number[] = [];

        tableData.forEach((row, index) => {
          const rowStr = JSON.stringify(row);
          if (seen.has(rowStr)) {
            duplicates.push(index + 1);
            if (mode === 'remove') {
              toRemove.push(index);
            }
          } else {
            seen.add(rowStr);
          }
        });

        if (mode === 'remove') {
          // Remove in reverse order to maintain indices
          for (let i = toRemove.length - 1; i >= 0; i--) {
            tableData.splice(toRemove[i], 1);
          }
          return toRemove.length.toString();
        } else {
          return JSON.stringify(duplicates);
        }
      }

      case 'INSERT_ROW': {
        // Insert row at position: INSERT_ROW(tableName, position, valuesJson?)
        const tableName = this.resolveTableName(args[0]);
        const position = Math.max(0, toNum(args[1]) - 1); // Convert to 0-based
        const valuesJson = args[2] ? toStr(args[2]) : null;

        if (!this.tableData[tableName]) {
          this.tableData[tableName] = [];
        }

        const tableField = this.fields.find(f => f.name === tableName && f.fieldType === 'TABLE');
        let newRow: Record<string, string> = {};

        if (valuesJson) {
          try {
            newRow = JSON.parse(valuesJson);
          } catch { newRow = {}; }
        } else if (tableField) {
          const columns = this.getTableColumns(tableField);
          columns.forEach(col => {
            newRow[col.name] = col.defaultValue || (col.type === 'CHECKBOX' ? 'false' : '');
          });
        }

        const insertPos = Math.min(position, this.tableData[tableName].length);
        this.tableData[tableName].splice(insertPos, 0, newRow);
        return (insertPos + 1).toString();
      }

      case 'MOVE_ROW': {
        // Move row to different position: MOVE_ROW(tableName, fromPosition, toPosition)
        const tableName = this.resolveTableName(args[0]);
        const fromPos = Math.max(0, toNum(args[1]) - 1);
        const toPos = Math.max(0, toNum(args[2]) - 1);
        const tableData = this.tableData[tableName];

        if (!tableData || fromPos < 0 || toPos < 0 || fromPos >= tableData.length || toPos >= tableData.length) {
          return 'false';
        }

        const [row] = tableData.splice(fromPos, 1);
        tableData.splice(toPos, 0, row);
        return 'true';
      }

      case 'TABLE_EXISTS': {
        // Check if table has any rows: TABLE_EXISTS(tableName)
        const tableName = this.resolveTableName(args[0]);
        const tableData = this.tableData[tableName];
        return (tableData && tableData.length > 0) ? 'true' : 'false';
      }

      case 'TABLE_HAS_ROW': {
        // Check if table has row with value: TABLE_HAS_ROW(tableName, columnName, value)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const value = toStr(args[2]);
        const tableData = this.tableData[tableName];

        if (!tableData) return 'false';

        const found = tableData.some(row => row[columnName] === value);
        return found ? 'true' : 'false';
      }

      case 'UPDATE_COLUMN': {
        // Update all matching values in column: UPDATE_COLUMN(tableName, columnName, oldValue, newValue)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const oldValue = toStr(args[2]);
        const newValue = toStr(args[3]);
        const tableData = this.tableData[tableName];

        if (!tableData) return '0';

        let count = 0;
        for (const row of tableData) {
          if (row[columnName] === oldValue) {
            row[columnName] = newValue;
            count++;
          }
        }
        return count.toString();
      }

      case 'DELETE_WHERE': {
        // Delete rows matching condition: DELETE_WHERE(tableName, columnName, operator, value)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const operator = toStr(args[2]);
        const value = toStr(args[3]);
        const tableData = this.tableData[tableName];

        if (!tableData) return '0';

        const toDelete: number[] = [];
        tableData.forEach((row, index) => {
          const cellValue = toStr(row[columnName] || '');
          let match = false;
          switch (operator) {
            case '=': match = cellValue === value; break;
            case '!=': match = cellValue !== value; break;
            case '<': match = parseFloat(cellValue) < parseFloat(value); break;
            case '>': match = parseFloat(cellValue) > parseFloat(value); break;
            case '<=': match = parseFloat(cellValue) <= parseFloat(value); break;
            case '>=': match = parseFloat(cellValue) >= parseFloat(value); break;
            case 'contains': match = cellValue.includes(value); break;
            case 'empty': match = !cellValue || cellValue === ''; break;
          }
          if (match) toDelete.push(index);
        });

        for (let i = toDelete.length - 1; i >= 0; i--) {
          tableData.splice(toDelete[i], 1);
        }
        return toDelete.length.toString();
      }

      case 'REVERSE_TABLE': {
        // Reverse table order: REVERSE_TABLE(tableName)
        const tableName = this.resolveTableName(args[0]);
        const tableData = this.tableData[tableName];

        if (!tableData) return 'false';
        tableData.reverse();
        return 'true';
      }

      case 'SWAP_ROWS': {
        // Swap two rows: SWAP_ROWS(tableName, position1, position2)
        const tableName = this.resolveTableName(args[0]);
        const pos1 = Math.max(0, toNum(args[1]) - 1);
        const pos2 = Math.max(0, toNum(args[2]) - 1);
        const tableData = this.tableData[tableName];

        if (!tableData || pos1 >= tableData.length || pos2 >= tableData.length || pos1 === pos2) {
          return 'false';
        }

        const temp = tableData[pos1];
        tableData[pos1] = tableData[pos2];
        tableData[pos2] = temp;
        return 'true';
      }

      case 'REMOVE_DUPLICATES': {
        // Remove duplicate rows based on column: REMOVE_DUPLICATES(tableName, columnName)
        const tableName = this.resolveTableName(args[0]);
        const columnName = toStr(args[1]);
        const tableData = this.tableData[tableName];

        if (!tableData) return '0';

        const seen = new Set<string>();
        const uniqueRows: Record<string, any>[] = [];
        let removedCount = 0;

        tableData.forEach(row => {
          const value = row[columnName];
          if (!seen.has(value)) {
            seen.add(value);
            uniqueRows.push(row);
          } else {
            removedCount++;
          }
        });

        this.tableData[tableName] = uniqueRows;
        return removedCount.toString();
      }

      case 'GROUP_BY': {
        // Group rows and aggregate: GROUP_BY(tableName, groupColumn, aggregateColumn, operation)
        const tableName = this.resolveTableName(args[0]);
        const groupColumn = toStr(args[1]);
        const aggregateColumn = toStr(args[2]);
        const operation = (toStr(args[3]) || 'SUM').toUpperCase();
        const tableData = this.tableData[tableName];

        if (!tableData) return '[]';

        const groups: Record<string, Record<string, any>[]> = {};
        tableData.forEach(row => {
          const key = row[groupColumn];
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });

        const result = Object.keys(groups).map(key => {
          const rows = groups[key];
          const groupResult: Record<string, any> = {};
          groupResult[groupColumn] = key;

          const values = rows.map(r => parseFloat(r[aggregateColumn])).filter(v => !isNaN(v));

          switch (operation) {
            case 'SUM':
              groupResult[aggregateColumn] = values.reduce((a, b) => a + b, 0);
              break;
            case 'AVG':
              groupResult[aggregateColumn] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
              break;
            case 'COUNT':
              groupResult[aggregateColumn] = rows.length;
              break;
            case 'MIN':
              groupResult[aggregateColumn] = values.length > 0 ? Math.min(...values) : 0;
              break;
            case 'MAX':
              groupResult[aggregateColumn] = values.length > 0 ? Math.max(...values) : 0;
              break;
            default:
              groupResult[aggregateColumn] = values.reduce((a, b) => a + b, 0);
          }

          return groupResult;
        });

        return JSON.stringify(result);
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
      case 'JSON_GET': {
        // Get value from JSON by path: JSON_GET(json, path)
        try {
          const json = JSON.parse(toStr(args[0]));
          const path = toStr(args[1]).split('.');
          let result = json;
          for (const key of path) {
            if (result === undefined || result === null) return '';
            result = result[key];
          }
          return result !== undefined ? JSON.stringify(result) : '';
        } catch { return ''; }
      }
      case 'JSON_SET': {
        // Set value in JSON: JSON_SET(json, path, value)
        try {
          const json = JSON.parse(toStr(args[0]));
          const path = toStr(args[1]).split('.');
          const value = args[2];
          let obj = json;
          for (let i = 0; i < path.length - 1; i++) {
            if (!obj[path[i]]) obj[path[i]] = {};
            obj = obj[path[i]];
          }
          obj[path[path.length - 1]] = value;
          return JSON.stringify(json);
        } catch { return args[0]; }
      }
      case 'LOOKUP': {
        // Lookup value in table: LOOKUP(tableName, searchColumn, searchValue, returnColumn)
        const tableName = this.resolveTableName(args[0]);
        const searchColumn = toStr(args[1]);
        const searchValue = toStr(args[2]);
        const returnColumn = toStr(args[3]);
        const tableData = this.tableData[tableName];
        if (tableData) {
          const row = tableData.find(r => r[searchColumn] === searchValue);
          if (row) return row[returnColumn] || '';
        }
        return '';
      }
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
      case 'ARRAY_CONTAINS':
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
      case 'ENCODE_URL':
        return encodeURIComponent(toStr(args[0]));
      case 'URL_DECODE':
      case 'DECODE_URL':
        return decodeURIComponent(toStr(args[0]));
      case 'TRY':
        try { return this.evaluateFunction(toStr(args[0]), fieldType); } catch { return args[1] || ''; }
      case 'TYPEOF':
      case 'TYPE_OF':
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

      // ==================== SQL FUNCTIONS ====================
      case 'SQL_LOOKUP': {
        // SQL_LOOKUP(table, returnColumn, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_LOOKUP', toStr(args[0]), toStr(args[1]), toStr(args[2]), toStr(args[3]));
          return result != null ? String(result) : '';
        } catch { return ''; }
      }
      case 'SQL_QUERY': {
        // SQL_QUERY(table, columns, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_QUERY', toStr(args[0]), args[1] ? toStr(args[1]) : '*', args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return JSON.stringify(result || []);
        } catch { return '[]'; }
      }
      case 'SQL_COUNT': {
        // SQL_COUNT(table, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_COUNT', toStr(args[0]), '', args[1] ? toStr(args[1]) : '', args[2] ? toStr(args[2]) : '');
          return String(result ?? 0);
        } catch { return '0'; }
      }
      case 'SQL_SUM': {
        // SQL_SUM(table, column, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_SUM', toStr(args[0]), toStr(args[1]), args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return String(result ?? 0);
        } catch { return '0'; }
      }
      case 'SQL_AVG': {
        // SQL_AVG(table, column, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_AVG', toStr(args[0]), toStr(args[1]), args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return String(result ?? 0);
        } catch { return '0'; }
      }
      case 'SQL_MIN': {
        // SQL_MIN(table, column, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_MIN', toStr(args[0]), toStr(args[1]), args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return String(result ?? '');
        } catch { return ''; }
      }
      case 'SQL_MAX': {
        // SQL_MAX(table, column, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_MAX', toStr(args[0]), toStr(args[1]), args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return String(result ?? '');
        } catch { return ''; }
      }
      case 'SQL_DISTINCT': {
        // SQL_DISTINCT(table, column, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_DISTINCT', toStr(args[0]), toStr(args[1]), args[2] ? toStr(args[2]) : '', args[3] ? toStr(args[3]) : '');
          return JSON.stringify(result || []);
        } catch { return '[]'; }
      }
      case 'SQL_EXISTS': {
        // SQL_EXISTS(table, whereColumn, whereValue)
        try {
          const result = this.executeSqlFunctionSync('SQL_EXISTS', toStr(args[0]), '', toStr(args[1]), toStr(args[2]));
          return String(result ?? false);
        } catch { return 'false'; }
      }

      default:
        return expression;
    }
  }

  private executeSqlFunctionSync(func: string, table: string, column: string, whereColumn: string, whereValue: string): any {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${environment.apiUrl}/sql-objects/function-query`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const token = localStorage.getItem('auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(JSON.stringify({ function: func, table, column, whereColumn, whereValue }));
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      return response?.data;
    }
    return null;
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

  private addToDate(date: Date, amount: number, unit: string, fieldType?: string): string {
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
    return this.formatDateForField(d, fieldType || 'DATE');
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
    // Argument parser - splits by comma, respecting quoted strings and nested parentheses
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0;

    for (const char of argsStr) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (!inQuotes && char === '(') {
        parenDepth++;
        current += char;
      } else if (!inQuotes && char === ')') {
        parenDepth--;
        current += char;
      } else if (char === ',' && !inQuotes && parenDepth === 0) {
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

    // If it's a nested function expression, evaluate it
    if (this.isFunctionExpression(arg)) {
      const result = this.evaluateFunction(arg, 'TEXT');
      return result != null ? String(result) : '';
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

  /**
   * Resolve table name from @{tableName} syntax or plain name
   */
  private resolveTableName(value: any): string {
    const str = String(value || '');
    // Remove @{...} wrapper if present
    const match = str.match(/@\{([^}]+)\}/);
    if (match) {
      return match[1];
    }
    return str;
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
    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    // Use local time instead of UTC to match user expectations
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Formats a Date object for the appropriate field type
   * Returns formatted string for DATE/DATETIME fields, or the formatted string representation otherwise
   */
  private formatDateForField(date: Date, fieldType: string): string {
    const upperFieldType = (fieldType || '').toUpperCase();
    if (upperFieldType === 'DATETIME') {
      return this.formatDateTime(date);
    } else if (upperFieldType === 'DATE') {
      return this.formatDate(date);
    }
    // For non-date fields, return ISO string
    return date.toISOString();
  }

  onFileSelect(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      let newFiles = Array.from(input.files);
      const field = this.fields.find((f: any) => f.name === fieldName);

      if (field) {
        // Validate allowed file types
        if (field.allowedFileTypes) {
          const allowedExts = field.allowedFileTypes.split(',').map((t: string) => t.trim().toLowerCase());
          const invalid = newFiles.filter(f => {
            const ext = '.' + f.name.split('.').pop()?.toLowerCase();
            return !allowedExts.some((a: string) => a === ext);
          });
          if (invalid.length > 0) {
            this.snackBar.open(`File type not allowed: ${invalid.map(f => f.name).join(', ')}. Allowed: ${field.allowedFileTypes}`, 'Close', { duration: 5000 });
            input.value = '';
            return;
          }
        }

        // Validate file size (maxFileSize is stored in MB)
        if (field.maxFileSize) {
          const maxBytes = field.maxFileSize * 1024 * 1024;
          const oversized = newFiles.filter(f => f.size > maxBytes);
          if (oversized.length > 0) {
            this.snackBar.open(`File too large: ${oversized.map(f => f.name).join(', ')}. Max size: ${field.maxFileSize}MB`, 'Close', { duration: 5000 });
            input.value = '';
            return;
          }
        }

        // Check for duplicates against existing attachments and already-selected files
        const existingNames = new Set<string>([
          ...(this.existingAttachments[fieldName] || []).map((a: any) => a.name),
          ...(this.selectedFiles[fieldName] || []).map(f => f.name)
        ]);
        const duplicates = newFiles.filter(f => existingNames.has(f.name));
        if (duplicates.length > 0) {
          this.snackBar.open(`Duplicate file(s): ${duplicates.map(f => f.name).join(', ')}`, 'Close', { duration: 5000 });
          newFiles = newFiles.filter(f => !existingNames.has(f.name));
          if (newFiles.length === 0) {
            input.value = '';
            return;
          }
        }

        // Merge with existing files if multiple
        const existing = field.multiple ? (this.selectedFiles[fieldName] || []) : [];
        const combined = [...existing, ...newFiles];

        // Validate max files (include already-uploaded attachments)
        const existingAttCount = (this.existingAttachments[fieldName] || []).length;
        if (field.maxFiles && (combined.length + existingAttCount) > field.maxFiles) {
          this.snackBar.open(`Too many files. Maximum ${field.maxFiles} files allowed (${existingAttCount} already uploaded).`, 'Close', { duration: 5000 });
          input.value = '';
          return;
        }

        this.selectedFiles[fieldName] = combined;
      } else {
        this.selectedFiles[fieldName] = newFiles;
      }
      input.value = '';
    }
  }

  getSelectedFiles(fieldName: string): File[] {
    return this.selectedFiles[fieldName] || [];
  }

  getExistingAttachments(fieldName: string): any[] {
    return this.existingAttachments[fieldName] || [];
  }

  removeExistingAttachment(fieldName: string, attachmentId: string) {
    this.workflowService.deleteAttachment(attachmentId).subscribe({
      next: () => {
        if (this.existingAttachments[fieldName]) {
          this.existingAttachments[fieldName] = this.existingAttachments[fieldName].filter(
            (a: any) => a.id !== attachmentId
          );
        }
        this.snackBar.open('Attachment removed', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to remove attachment', 'Close', { duration: 3000 });
      }
    });
  }

  removeFile(fieldName: string, index: number) {
    if (this.selectedFiles[fieldName]) {
      this.selectedFiles[fieldName].splice(index, 1);
    }
  }

  getFileHint(field: any): string {
    const hints: string[] = [];
    if (field.minFiles && field.minFiles > 0) {
      hints.push(`Min ${field.minFiles} file${field.minFiles > 1 ? 's' : ''}`);
    }
    if (field.multiple && field.maxFiles) {
      hints.push(`Max ${field.maxFiles} files`);
    }
    if (field.maxFileSize) {
      hints.push(`up to ${field.maxFileSize}MB each`);
    }
    if (field.allowedFileTypes) {
      hints.push(`Accepted: ${field.allowedFileTypes}`);
    }
    return hints.join(', ');
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
      const existingNames = new Set<string>([
        ...this.attachments.map(f => f.name),
        ...this.existingGeneralAttachments.map((a: any) => a.name)
      ]);
      const newFiles = Array.from(input.files);
      const duplicates = newFiles.filter(f => existingNames.has(f.name));
      if (duplicates.length > 0) {
        this.snackBar.open(`Duplicate file(s) skipped: ${duplicates.map(f => f.name).join(', ')}`, 'Close', { duration: 5000 });
      }
      const unique = newFiles.filter(f => !existingNames.has(f.name));
      this.attachments.push(...unique);
      input.value = '';
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

    if (this.form.invalid || Object.values(this.validationErrors).some(e => e !== null)) {
      const firstError = this.getFirstValidationError(this.fields);
      this.snackBar.open(firstError || 'Please fill in all required fields', 'Close', { duration: 5000 });
      return;
    }

    // Check if there are pending unique validations
    if (this.pendingUniqueChecks.size > 0) {
      this.snackBar.open('Please wait for validation checks to complete', 'Close', { duration: 3000 });
      return;
    }

    // Fire-and-forget screen notification for the current (last) screen
    this.sendScreenNotification(this.currentScreen);

    this.submitForm(false);
  }

  private sendScreenNotification(screen: Screen | null): void {
    if (!screen || !screen.notifiers || screen.notifiers.length === 0) {
      return;
    }
    // Only send for screens with a persisted ID (not temp IDs)
    if (!screen.id || screen.id.startsWith('temp_')) {
      return;
    }
    // Collect field values for this screen (only fields marked inSummary)
    const screenId = screen.id?.toString();
    const isFirstScreen = this.currentScreenIndex === 0;
    const fieldsOnScreen = this.fields.filter(f => {
      const fieldScreenId = f.screenId?.toString();
      return (fieldScreenId === screenId || (isFirstScreen && !fieldScreenId)) && f.inSummary === true;
    });

    const fieldValues: { label: string; value: string }[] = [];
    for (const field of fieldsOnScreen) {
      const control = this.form.get(field.name);
      if (control) {
        let value = control.value;
        if (value instanceof Date) {
          value = value.toLocaleDateString();
        } else if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        fieldValues.push({ label: field.label || field.name, value: value != null ? String(value) : '' });
      }
    }

    this.workflowService.sendScreenNotification({
      screenId: screen.id,
      workflowName: this.workflow?.name || '',
      screenTitle: screen.title || 'Untitled Screen',
      fieldValues,
      notificationMessage: screen.notificationMessage || '',
      instanceId: this.instanceId || this.draftInstanceId || '',
      workflowCode: this.workflowCode || ''
    }).subscribe({
      error: (err: any) => console.warn('Screen notification failed (non-blocking):', err)
    });
  }

  submitForm(isDraft: boolean) {
    this.submitting = true;

    // Apply transformations before collecting values
    this.applyAllTransformations();

    const formData = new FormData();
    formData.append('workflowCode', this.workflowCode);
    formData.append('isDraft', isDraft.toString());
    if (this.parentInstanceId) {
      formData.append('parentInstanceId', this.parentInstanceId);
    }

    const fieldValues: Record<string, any> = {};
    this.fields.forEach(field => {
      let value = this.form.value[field.name];

      // Re-evaluate time-based fields at submit time (only for new submissions, not edits)
      if (!this.isEditMode && this.timeBasedFields.has(field.name)) {
        const config = this.timeBasedFields.get(field.name)!;
        value = this.evaluateDefaultValue(config.expression, config.fieldType);
        // Convert to proper format for DATE/DATETIME fields
        if ((field.type === 'DATE' || field.type === 'DATETIME') && value instanceof Date) {
          value = value.toISOString();
        }
      }

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

    // Use update API if in edit mode or if a draft was created during per-screen saving
    const effectiveInstanceId = this.instanceId || this.draftInstanceId;
    const apiCall = effectiveInstanceId
      ? this.workflowService.updateInstance(effectiveInstanceId, formData)
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
    // Also load corporates for user field filtering
    this.userService.getActiveCorporates().subscribe({
      next: (corps: any) => {
        this.allCorporates = Array.isArray(corps) ? corps : (corps?.data || []);
      },
      error: () => { this.allCorporates = []; }
    });

    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allUsers = res.data;
          console.log('Loaded', this.allUsers.length, 'users for USER field');
        }
      },
      error: (err) => {
        console.error('Failed to load users:', err?.status, err?.message || err);
        // Retry once after a short delay in case token wasn't ready
        setTimeout(() => {
          this.userService.getUsers().subscribe({
            next: (res) => {
              if (res.success && res.data) {
                this.allUsers = res.data;
                console.log('Loaded', this.allUsers.length, 'users on retry');
              }
            },
            error: (retryErr) => {
              console.error('Retry failed to load users:', retryErr?.status);
            }
          });
        }, 1000);
      }
    });
  }

  onUserSearch(event: Event, fieldName: string) {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value?.toLowerCase() || '';
    this.userSearchTerms[fieldName] = searchTerm;

    if (!searchTerm && !(this.userCorporateFilter[fieldName]?.length > 0)) {
      this.filteredUsersMap[fieldName] = [];
      return;
    }

    this.filterUsersWithCorporate(searchTerm, fieldName);
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

  // ========== SELECT SEARCH METHODS ==========

  onSelectSearch(term: string, fieldName: string): void {
    this.selectSearchTerms[fieldName] = (term || '').toLowerCase();
  }

  getFilteredOptions(field: any): any[] {
    const term = this.selectSearchTerms[field.name];
    const options = field.options || [];
    if (!term) return options;
    return options.filter((o: any) => (o.label || '').toLowerCase().includes(term) || (o.value || '').toLowerCase().includes(term));
  }

  onSelectOpened(fieldName: string): void {
    this.selectSearchTerms[fieldName] = '';
  }

  // ========== USER CORPORATE FILTER METHODS ==========

  onUserCorporateFilterChange(corporateIds: string[], fieldName: string): void {
    this.userCorporateFilter[fieldName] = corporateIds || [];
    // Re-run user search with corporate filter applied
    const searchTerm = this.userSearchTerms[fieldName] || '';
    this.filterUsersWithCorporate(searchTerm, fieldName);
  }

  private filterUsersWithCorporate(searchTerm: string, fieldName: string): void {
    const corpFilter = this.userCorporateFilter[fieldName] || [];
    let filtered = this.allUsers;

    // Apply corporate filter
    if (corpFilter.length > 0) {
      filtered = filtered.filter(user => {
        const userCorps = user.corporateIds || [];
        return corpFilter.some(c => userCorps.includes(c));
      });
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        return fullName.includes(term) || email.includes(term) || username.includes(term);
      });
    }

    this.filteredUsersMap[fieldName] = filtered.slice(0, 20);
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
  private currentTableRowIndex: number = 0; // 0-based index for ROW() function

  // Table search, filter, sort, pagination state
  tableSearchTerms: Record<string, string> = {};
  private tableColumnFilters: Record<string, Record<string, string>> = {};
  tableSortState: Record<string, { column: string; direction: 'asc' | 'desc' }> = {};
  private tableCurrentPage: Record<string, number> = {};

  getTableColumns(field: any): { name: string; label: string; type: string; width?: number; defaultValue?: string; readOnly?: boolean }[] {
    // First check the new tableColumns property
    if (field.tableColumns && Array.isArray(field.tableColumns) && field.tableColumns.length > 0) {
      return field.tableColumns.map((col: any) => ({
        name: col.name || 'column',
        label: col.label || col.name || 'Column',
        type: col.type || 'TEXT',
        width: col.width,
        defaultValue: col.defaultValue,
        readOnly: col.readOnly || false
      }));
    }

    // Legacy: parse columns from JSON string in tableColumns
    if (field.tableColumns && typeof field.tableColumns === 'string') {
      try {
        const parsed = JSON.parse(field.tableColumns);
        if (Array.isArray(parsed)) {
          return parsed.map((col: any) => ({
            name: col.name || 'column',
            label: col.label || col.name || 'Column',
            type: col.type || 'TEXT',
            width: col.width,
            defaultValue: col.defaultValue,
            readOnly: col.readOnly || false
          }));
        }
      } catch (e) {
        // Fall through to default columns
      }
    }

    // Legacy: parse columns from field options
    if (field.options && typeof field.options === 'string') {
      try {
        const parsed = JSON.parse(field.options);
        if (Array.isArray(parsed)) {
          return parsed.map((col: any) => ({
            name: col.name || col.value || 'column',
            label: col.label || col.name || 'Column',
            type: col.type || 'TEXT',
            width: col.width,
            defaultValue: col.defaultValue
          }));
        }
      } catch (e) {
        // Fall through to default columns
      }
    }

    // Default columns if not specified
    return [
      { name: 'col1', label: 'Column 1', type: 'TEXT' },
      { name: 'col2', label: 'Column 2', type: 'TEXT' },
      { name: 'col3', label: 'Column 3', type: 'TEXT' }
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

      // If table is empty and we're creating a new submission, initialize with minimum rows
      // Skip for tables with a data source - their data comes from the API
      if (this.tableData[field.name].length === 0 && !this.isEditMode && !field.tableDataSource) {
        const minRows = field.tableMinRows || 1; // Default to at least 1 row
        const columns = this.getTableColumns(field);

        for (let rowIndex = 0; rowIndex < minRows; rowIndex++) {
          // Set current row index for ROW() function
          this.currentTableRowIndex = rowIndex;

          const newRow: Record<string, string> = {};
          columns.forEach(col => {
            // Use default value if specified, otherwise empty/false for checkbox
            if (col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue !== '') {
              // Check if default value contains a function expression and evaluate it
              if (this.isFunctionExpression(col.defaultValue)) {
                newRow[col.name] = String(this.evaluateFunction(col.defaultValue, col.type));
              } else {
                newRow[col.name] = col.defaultValue;
              }
            } else {
              newRow[col.name] = col.type === 'CHECKBOX' ? 'false' : '';
            }
          });
          this.tableData[field.name].push(newRow);
        }

        // Update the form value with the initialized rows
        if (this.tableData[field.name].length > 0) {
          this.updateTableValue(field);
        }
      }
    }
    return this.tableData[field.name];
  }

  addTableRow(field: any): void {
    if (this.isFieldReadonly(field)) return;
    if (!this.tableData[field.name]) {
      this.tableData[field.name] = [];
    }

    // Check max rows limit
    if (field.tableMaxRows && this.tableData[field.name].length >= field.tableMaxRows) {
      return; // Don't add more rows
    }

    // Set current row index for ROW() function (0-based, will be converted to 1-based in function)
    this.currentTableRowIndex = this.tableData[field.name].length;

    const columns = this.getTableColumns(field);
    const newRow: Record<string, string> = {};
    columns.forEach(col => {
      // Use default value if specified, otherwise empty/false for checkbox
      if (col.defaultValue !== undefined && col.defaultValue !== null && col.defaultValue !== '') {
        // Check if default value contains a function expression and evaluate it
        if (this.isFunctionExpression(col.defaultValue)) {
          newRow[col.name] = String(this.evaluateFunction(col.defaultValue, col.type));
        } else {
          newRow[col.name] = col.defaultValue;
        }
      } else {
        newRow[col.name] = col.type === 'CHECKBOX' ? 'false' : '';
      }
    });
    this.tableData[field.name].push(newRow);
    this.updateTableValue(field);
  }

  canAddTableRow(field: any): boolean {
    if (!field.tableMaxRows) return true;
    const rows = this.getTableRows(field);
    return rows.length < field.tableMaxRows;
  }

  canRemoveTableRow(field: any): boolean {
    const rows = this.getTableRows(field);
    const minRows = field.tableMinRows || 0;
    return rows.length > minRows;
  }

  removeTableRow(field: any, index: number): void {
    if (this.isFieldReadonly(field)) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Row',
        message: 'Are you sure you want to delete this row? This action cannot be undone.',
        type: 'delete',
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && this.tableData[field.name]) {
        this.tableData[field.name].splice(index, 1);
        this.updateTableValue(field);
        this.cdr.detectChanges();
        this.snackBar.open('Row deleted successfully', 'Close', { duration: 3000 });
      }
    });
  }

  onTableCellChange(event: Event, field: any, rowIndex: number, columnName: string): void {
    if (this.isFieldReadonly(field)) return;
    const input = event.target as HTMLInputElement;
    if (this.tableData[field.name] && this.tableData[field.name][rowIndex]) {
      this.tableData[field.name][rowIndex][columnName] = input.value;
      this.updateTableValue(field);
    }
  }

  onTableCheckboxChange(event: any, field: any, rowIndex: number, columnName: string): void {
    if (this.isFieldReadonly(field)) return;
    if (this.tableData[field.name] && this.tableData[field.name][rowIndex]) {
      this.tableData[field.name][rowIndex][columnName] = event.checked ? 'true' : 'false';
      this.updateTableValue(field);
    }
  }

  private updateTableValue(field: any): void {
    const value = JSON.stringify(this.tableData[field.name] || []);
    this.form.get(field.name)?.setValue(value);
    this.form.get(field.name)?.markAsTouched();
  }

  // ==================== ACCORDION AND COLLAPSIBLE FIELD METHODS ====================

  /**
   * Get all ACCORDION type fields that are ungrouped on the current screen
   */
  getAccordionFields(): WorkflowField[] {
    if (this.isMultiStep) {
      const screenId = this.currentScreen?.id?.toString();
      const isFirstScreen = this.currentScreenIndex === 0;
      return this.fields.filter(f => {
        if (f.type !== 'ACCORDION' || f.fieldGroupId || f.hidden || f.isHidden) {
          return false;
        }
        const fieldScreenId = f.screenId?.toString();
        return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
      });
    }
    return this.fields.filter(f => f.type === 'ACCORDION' && !f.fieldGroupId && !(f.hidden || f.isHidden));
  }

  /**
   * Get all ACCORDION type fields within a specific field group
   */
  getAccordionFieldsInGroup(groupId: string): WorkflowField[] {
    const gid = groupId?.toString();
    if (this.isMultiStep) {
      const screenId = this.currentScreen?.id?.toString();
      const isFirstScreen = this.currentScreenIndex === 0;
      return this.fields.filter(f => {
        if (f.type !== 'ACCORDION' || f.fieldGroupId?.toString() !== gid || f.hidden || f.isHidden) {
          return false;
        }
        const fieldScreenId = f.screenId?.toString();
        return fieldScreenId === screenId || (isFirstScreen && !fieldScreenId);
      });
    }
    return this.fields.filter(f => f.type === 'ACCORDION' && f.fieldGroupId?.toString() === gid && !(f.hidden || f.isHidden));
  }

  /**
   * Get COLLAPSIBLE fields that belong to a specific accordion
   */
  getCollapsiblesForAccordion(accordionFieldId: string): WorkflowField[] {
    const accordionId = accordionFieldId?.toString();
    if (!accordionId) return [];
    return this.fields
      .filter(f => f.type === 'COLLAPSIBLE' && f.parentFieldId?.toString() === accordionId && !(f.hidden || f.isHidden))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Get regular (non-accordion, non-collapsible) fields that belong to a collapsible
   */
  getFieldsInCollapsible(collapsibleFieldId: string): WorkflowField[] {
    const collapsibleId = collapsibleFieldId?.toString();
    if (!collapsibleId) return [];
    return this.fields
      .filter(f => {
        if (f.type === 'ACCORDION' || f.type === 'COLLAPSIBLE') return false;
        if (f.hidden || f.isHidden) return false;
        return f.parentFieldId?.toString() === collapsibleId;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Initialize accordion expansion state based on field configuration
   */
  initAccordionState(accordionField: WorkflowField): void {
    const accordionId = accordionField.id?.toString();
    if (!accordionId || this.accordionExpandedState[accordionId]) return;

    const collapsibles = this.getCollapsiblesForAccordion(accordionId);
    const expandedSet = new Set<number>();

    // Check default open index
    const defaultOpenIndex = accordionField.accordionDefaultOpenIndex ?? 0;
    if (defaultOpenIndex >= 0 && defaultOpenIndex < collapsibles.length) {
      expandedSet.add(defaultOpenIndex);
    }

    // Also check each collapsible's default expanded state
    collapsibles.forEach((collapsible, index) => {
      if (collapsible.collapsibleDefaultExpanded) {
        expandedSet.add(index);
      }
    });

    this.accordionExpandedState[accordionId] = expandedSet;
  }

  /**
   * Check if a collapsible panel is expanded
   */
  isCollapsibleExpanded(accordionFieldId: string, collapsibleIndex: number): boolean {
    const accordionId = accordionFieldId?.toString();
    return this.accordionExpandedState[accordionId]?.has(collapsibleIndex) ?? false;
  }

  /**
   * Open a collapsible panel
   */
  openCollapsible(accordionField: WorkflowField, collapsibleIndex: number): void {
    const accordionId = accordionField.id?.toString();
    if (!accordionId) return;

    if (!this.accordionExpandedState[accordionId]) {
      this.accordionExpandedState[accordionId] = new Set();
    }

    const allowMultiple = accordionField.accordionAllowMultiple ?? false;
    const expandedSet = this.accordionExpandedState[accordionId];

    if (!allowMultiple) {
      // Close all other panels first
      expandedSet.clear();
    }
    expandedSet.add(collapsibleIndex);
  }

  /**
   * Close a collapsible panel
   */
  closeCollapsible(accordionField: WorkflowField, collapsibleIndex: number): void {
    const accordionId = accordionField.id?.toString();
    if (!accordionId) return;

    if (this.accordionExpandedState[accordionId]) {
      this.accordionExpandedState[accordionId].delete(collapsibleIndex);
    }
  }

  /**
   * Get the animation duration for an accordion in milliseconds
   */
  getAccordionAnimationDuration(accordionField: WorkflowField): string {
    const duration = accordionField.accordionAnimationDuration ?? 300;
    return `${duration}ms`;
  }

  /**
   * Get the animation class based on accordion configuration
   */
  getAccordionAnimationClass(accordionField: WorkflowField): string {
    const animationType = accordionField.accordionAnimationType ?? 'smooth';
    switch (animationType) {
      case 'none':
        return 'no-animation';
      case 'bounce':
        return 'bounce-animation';
      default:
        return 'smooth-animation';
    }
  }

  // --- API Field Methods ---

  isApiFieldType(type: string): boolean {
    return ['API_VALUE', 'OBJECT_VIEWER'].includes(type);
  }

  isAnyApiFieldLoading(): boolean {
    return Object.values(this.apiFieldLoading).some(v => v);
  }

  /** Replace @{fieldName} placeholders in a string with current form field values.
   *  Note: 'self' must be resolved before calling this method. */
  private resolveFieldPlaceholders(text: string): string {
    if (!text) return text;
    return text.replace(/@\{([^}]+)\}/g, (_match, fieldName) => {
      const control = this.form?.get(fieldName.trim());
      return control ? (control.value ?? '') : '';
    });
  }

  fetchApiFieldData(field: any): void {
    if (!field.apiUrl) return;

    this.apiFieldLoading[field.name] = true;
    this.apiFieldErrors[field.name] = null;
    this.cdr.detectChanges();

    let headers: {key: string, value: string}[] = [];
    if (field.apiHeaders) {
      if (typeof field.apiHeaders === 'string') {
        try { headers = JSON.parse(field.apiHeaders); } catch { headers = []; }
      } else {
        headers = field.apiHeaders;
      }
    }

    let params: {key: string, value: string}[] = [];
    if (field.apiParams) {
      if (typeof field.apiParams === 'string') {
        try { params = JSON.parse(field.apiParams); } catch { params = []; }
      } else {
        params = field.apiParams;
      }
    }

    // Resolve {{fieldName}} placeholders in URL, params, headers, auth, and body
    const resolvedHeaders = headers
      .filter((h: any) => h.key && h.key.trim())
      .map((h: any) => ({ key: h.key, value: this.resolveFieldPlaceholders(h.value) }));
    const resolvedParams = params
      .filter((p: any) => p.key && p.key.trim())
      .map((p: any) => ({ ...p, value: this.resolveFieldPlaceholders(p.value) }));

    const payload: any = {
      url: this.resolveFieldPlaceholders(field.apiUrl),
      method: field.apiMethod || 'GET',
      authType: field.apiAuthType || 'NONE',
      authValue: this.resolveFieldPlaceholders(field.apiAuthValue || ''),
      headers: resolvedHeaders,
      params: resolvedParams,
      responsePath: field.apiResponsePath || '',
      body: field.apiBody ? this.resolveFieldPlaceholders(field.apiBody) : null
    };

    this.http.post<any>(`${environment.apiUrl}/proxy/call`, payload).subscribe({
      next: (res) => {
        this.apiFieldLoading[field.name] = false;
        if (res.success) {
          this.apiFieldData[field.name] = res.data;

          // If an onResponse expression is defined, evaluate it with APIResponse injected
          let finalValue: any = res.data;
          if (field.apiOnResponse && field.apiOnResponse.trim()) {
            try {
              finalValue = this.evaluateOnResponse(field.apiOnResponse, res.data);
            } catch (e) {
              console.warn('[onResponse] Failed to evaluate expression', e);
              finalValue = res.data;
            }
          }

          // Store the value in the form control
          if (this.form.controls[field.name]) {
            this.form.controls[field.name].setValue(
              typeof finalValue === 'object' && finalValue !== null
                ? JSON.stringify(finalValue)
                : String(finalValue ?? '')
            );
          }
        } else {
          this.apiFieldErrors[field.name] = res.message || 'API call failed';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.apiFieldLoading[field.name] = false;
        this.apiFieldErrors[field.name] = err.error?.message || 'Failed to connect to API';
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Evaluate an "onResponse" expression with APIResponse injected.
   * Supports:
   *   - Dot/bracket paths: APIResponse.user.name, APIResponse.items[0].title
   *   - Function calls: CONCAT(APIResponse.firstName, ' ', APIResponse.lastName)
   *   - Any function from evaluateFunction can be used; nested APIResponse references are resolved first.
   */
  private evaluateOnResponse(expression: string, apiResponse: any): any {
    if (!expression) return apiResponse;
    const expr = expression.trim();

    // Shortcut: the whole expression is just APIResponse or APIResponse.path
    const pathMatch = expr.match(/^APIResponse(\.[\w.\[\]]+|\[[\d'"\w]+\])*$/);
    if (pathMatch) {
      return this.resolveApiResponsePath(expr, apiResponse);
    }

    // Otherwise: replace every APIResponse(.xxx)* occurrence with a JSON literal of its resolved value,
    // then feed to the existing evaluateFunction pipeline.
    const resolved = expr.replace(/APIResponse(?:\[[^\]]*\]|\.[\w]+)*/g, (match) => {
      const v = this.resolveApiResponsePath(match, apiResponse);
      if (v === null || v === undefined) return '""';
      if (typeof v === 'string') return JSON.stringify(v);
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return JSON.stringify(JSON.stringify(v)); // nested object -> quoted JSON string
    });

    if (this.isFunctionExpression(resolved)) {
      return this.evaluateFunction(resolved, 'TEXT');
    }
    return resolved;
  }

  /**
   * Walk a path like "APIResponse.user.name" or "APIResponse[0].title" against the given object.
   */
  private resolveApiResponsePath(path: string, root: any): any {
    if (!path.startsWith('APIResponse')) return undefined;
    let rest = path.substring('APIResponse'.length);
    let current: any = root;
    const tokenRegex = /\.([a-zA-Z_$][\w$]*)|\[\s*(\d+|'([^']*)'|"([^"]*)")\s*\]/g;
    let m: RegExpExecArray | null;
    let lastIndex = 0;
    while ((m = tokenRegex.exec(rest)) !== null) {
      if (m.index !== lastIndex) return undefined; // non-contiguous path
      lastIndex = m.index + m[0].length;
      if (current === null || current === undefined) return undefined;
      if (m[1] !== undefined) {
        // .property
        current = current[m[1]];
      } else if (m[2] !== undefined) {
        // [index] or ['key']
        const idx = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[2]);
        current = Array.isArray(current) ? current[parseInt(m[2], 10)] : current[idx];
      }
    }
    if (lastIndex !== rest.length) return undefined;
    return current;
  }

  initApiFields(): void {
    const apiFields = this.fields.filter(f => this.isApiFieldType(f.type || f.fieldType as string));
    for (const field of apiFields) {
      if (field.apiUrl && field.apiTriggerMode !== 'MANUAL') {
        this.fetchApiFieldData(field);
      }
    }
  }

  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  // --- Table Search, Filter, Sort, Pagination ---

  onTableSearch(event: Event, field: any): void {
    this.tableSearchTerms[field.name] = (event.target as HTMLInputElement).value;
    this.tableCurrentPage[field.name] = 0;
  }

  clearTableSearch(field: any): void {
    this.tableSearchTerms[field.name] = '';
    this.tableCurrentPage[field.name] = 0;
  }

  getColumnFilter(field: any, colName: string): string {
    return this.tableColumnFilters[field.name]?.[colName] || '';
  }

  onColumnFilter(event: Event, field: any, colName: string): void {
    if (!this.tableColumnFilters[field.name]) this.tableColumnFilters[field.name] = {};
    this.tableColumnFilters[field.name][colName] = (event.target as HTMLInputElement).value;
    this.tableCurrentPage[field.name] = 0;
  }

  hasColumnFilters(field: any): boolean {
    const filters = this.tableColumnFilters[field.name];
    return filters ? Object.values(filters).some(v => v && v.trim()) : false;
  }

  onTableSort(field: any, colName: string): void {
    const current = this.tableSortState[field.name];
    if (current?.column === colName) {
      this.tableSortState[field.name] = { column: colName, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    } else {
      this.tableSortState[field.name] = { column: colName, direction: 'asc' };
    }
  }

  getFilteredTableRows(field: any): any[] {
    let rows = this.getTableRows(field);
    // Apply global search
    const search = (this.tableSearchTerms[field.name] || '').toLowerCase().trim();
    if (search) {
      rows = rows.filter(row => Object.values(row).some(v => String(v || '').toLowerCase().includes(search)));
    }
    // Apply column filters
    const filters = this.tableColumnFilters[field.name];
    if (filters) {
      for (const [col, val] of Object.entries(filters)) {
        if (val && val.trim()) {
          const filterVal = val.toLowerCase().trim();
          rows = rows.filter(row => String(row[col] || '').toLowerCase().includes(filterVal));
        }
      }
    }
    // Apply sort
    const sort = this.tableSortState[field.name];
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[sort.column] || '');
        const bv = String(b[sort.column] || '');
        const numA = Number(av), numB = Number(bv);
        let cmp: number;
        if (!isNaN(numA) && !isNaN(numB) && av !== '' && bv !== '') {
          cmp = numA - numB;
        } else {
          cmp = av.localeCompare(bv);
        }
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  getDisplayedTableRows(field: any): any[] {
    const filtered = this.getFilteredTableRows(field);
    if (!field.tablePageable) return filtered;
    const pageSize = field.tablePageSize || 10;
    const page = this.getTablePage(field);
    return filtered.slice(page * pageSize, (page + 1) * pageSize);
  }

  getActualRowIndex(field: any, row: any): number {
    return this.getTableRows(field).indexOf(row);
  }

  getTablePage(field: any): number {
    return this.tableCurrentPage[field.name] || 0;
  }

  setTablePage(field: any, page: number): void {
    this.tableCurrentPage[field.name] = Math.max(0, page);
  }

  getTableTotalPages(field: any): number {
    const total = this.getFilteredTableRows(field).length;
    const pageSize = field.tablePageSize || 10;
    return Math.ceil(total / pageSize);
  }

  getPageInfo(field: any): string {
    const filtered = this.getFilteredTableRows(field);
    const pageSize = field.tablePageSize || 10;
    const page = this.getTablePage(field);
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, filtered.length);
    return `${start}–${end} of ${filtered.length}`;
  }

  // Column resize
  onColumnResizeStart(event: MouseEvent, field: any, col: any): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = col.width || 150;

    const onMouseMove = (e: MouseEvent) => {
      col.width = Math.max(60, startWidth + (e.clientX - startX));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // --- Object Viewer methods ---
  private ovExpandedNodes: Set<string> = new Set();

  isOvObject(data: any): boolean {
    return data !== null && typeof data === 'object' && !Array.isArray(data);
  }

  isOvArray(data: any): boolean {
    return Array.isArray(data);
  }

  isOvExpandable(val: any): boolean {
    return val !== null && typeof val === 'object';
  }

  isOvExpanded(path: string): boolean {
    return this.ovExpandedNodes.has(path);
  }

  toggleOvNode(path: string): void {
    if (this.ovExpandedNodes.has(path)) {
      this.ovExpandedNodes.delete(path);
    } else {
      this.ovExpandedNodes.add(path);
    }
  }

  expandAllObjectViewer(fieldName: string): void {
    const data = this.apiFieldData[fieldName];
    if (data) this.expandOvRecursive(data, fieldName);
  }

  collapseAllObjectViewer(fieldName: string): void {
    const toRemove = [...this.ovExpandedNodes].filter(p => p.startsWith(fieldName));
    toRemove.forEach(p => this.ovExpandedNodes.delete(p));
  }

  private expandOvRecursive(data: any, path: string): void {
    if (data === null || typeof data !== 'object') return;
    if (Array.isArray(data)) {
      data.forEach((item: any, i: number) => {
        const childPath = path + '.' + i;
        if (typeof item === 'object' && item !== null) {
          this.ovExpandedNodes.add(childPath);
          this.expandOvRecursive(item, childPath);
        }
      });
    } else {
      for (const key of Object.keys(data)) {
        const childPath = path + '.' + key;
        if (typeof data[key] === 'object' && data[key] !== null) {
          this.ovExpandedNodes.add(childPath);
          this.expandOvRecursive(data[key], childPath);
        }
      }
    }
  }

  getOvTypeBadge(val: any): string {
    if (Array.isArray(val)) return `Array[${val.length}]`;
    if (typeof val === 'object' && val !== null) return `Object{${Object.keys(val).length}}`;
    return '';
  }

  getOvValueType(val: any): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'number') return 'number';
    return 'string';
  }

  formatOvValue(val: any): string {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  }

  getOvNodes(data: any, basePath: string, depth: number): any[] {
    const nodes: any[] = [];
    if (data === null || data === undefined) return nodes;

    const entries: [string, any][] = Array.isArray(data)
      ? data.map((item, i) => [`[${i}]`, item])
      : (typeof data === 'object' ? Object.entries(data) : []);

    for (const [key, val] of entries) {
      const path = basePath + '.' + key;
      const expandable = val !== null && typeof val === 'object';

      if (expandable) {
        const expanded = this.ovExpandedNodes.has(path);
        nodes.push({ key, path, depth, expandable: true, expanded, badge: this.getOvTypeBadge(val) });
        if (expanded) {
          nodes.push(...this.getOvNodes(val, path, depth + 1));
        }
      } else {
        nodes.push({ key, path, depth, expandable: false, value: this.formatOvValue(val), valueType: this.getOvValueType(val) });
      }
    }
    return nodes;
  }

  onOvTreeClick(event: MouseEvent, fieldName: string): void {
    const target = (event.target as HTMLElement).closest('.ov-expandable');
    if (target) {
      const path = target.getAttribute('data-path');
      if (path) {
        this.toggleOvNode(path);
      }
    }
  }

  /** Flatten nested object keys into dot-notation paths, skipping arrays */
  flattenObjectKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];
    if (!obj || typeof obj !== 'object') return keys;
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        keys.push(...this.flattenObjectKeys(val, fullKey));
      } else if (!Array.isArray(val)) {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  /** Resolve a dot-notation path like "ability.name" from a nested object */
  resolveNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  populateLinkedOptionFields(apiFieldName: string, data: any[]): void {
    const optionTypes = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX_GROUP'];
    const linkedFields = this.fields.filter(
      f => optionTypes.includes(f.type || f.fieldType as string)
        && (f as any).optionsSource === 'API'
        && (f as any).apiDataSourceField === apiFieldName
    );

    for (const field of linkedFields) {
      const displayPath = (field as any).apiDisplayField || '';
      const valuePath = (field as any).apiValueField || '';

      field.options = data.map((item: any) => {
        let label: string, value: string;
        if (typeof item === 'object' && item !== null) {
          label = displayPath ? String(this.resolveNestedValue(item, displayPath) ?? '') : JSON.stringify(item);
          value = valuePath ? String(this.resolveNestedValue(item, valuePath) ?? '') : label;
        } else {
          label = String(item ?? '');
          value = label;
        }
        return { label, value };
      });
    }
  }

  populateLinkedTables(apiFieldName: string, data: any[]): void {
    // Find TABLE fields that use this API field as data source
    const linkedTables = this.fields.filter(
      f => (f.type === 'TABLE' || f.fieldType === 'TABLE') && f.tableDataSource === apiFieldName
    );

    for (const tableField of linkedTables) {
      if (!data || data.length === 0) continue;

      // Get configured table columns
      let columns = tableField.tableColumns;
      if (typeof columns === 'string') {
        try { columns = JSON.parse(columns); } catch { columns = []; }
      }

      // Check if data is a simple array (not objects)
      const isSimpleArray = data.length > 0 && typeof data[0] !== 'object';

      // Auto-generate columns from API data if no columns configured or if columns are defaults (col1, col2, etc.)
      const isDefaultColumns = columns && columns.length > 0 &&
        columns.every((c: any) => /^col\d+$/.test(c.name));
      if (!columns || columns.length === 0 || isDefaultColumns) {
        if (isSimpleArray) {
          columns = [{ name: 'value', label: 'Value', type: 'TEXT' as any }];
        } else {
          columns = this.flattenObjectKeys(data[0]).map((k: string) => ({
            name: k, label: k.replace(/\./g, ' '), type: 'TEXT' as any
          }));
        }
        tableField.tableColumns = columns;
      }

      // Map API data to table rows using column names (supports dot notation for nested values)
      const columnNames = (columns || []).map((c: any) => c.name);
      const rows = data.map((item: any) => {
        const row: Record<string, string> = {};
        if (isSimpleArray) {
          row['value'] = String(item ?? '');
        } else {
          for (const colName of columnNames) {
            const val = this.resolveNestedValue(item, colName);
            row[colName] = val !== undefined && val !== null ? String(val) : '';
          }
        }
        return row;
      });

      // Set table data
      this.tableData[tableField.name] = rows;
      if (this.form.controls[tableField.name]) {
        this.form.controls[tableField.name].setValue(JSON.stringify(rows));
      }
    }
  }
}
