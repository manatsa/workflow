import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReportService, ReportDefinition, ReportResult } from '@core/services/report.service';
import { HttpClient } from '@angular/common/http';
import { Observable, map, startWith } from 'rxjs';

interface ReportParameters {
  startDate: Date | null;
  endDate: Date | null;
  approvedStartDate: Date | null;
  approvedEndDate: Date | null;
  status: string;
  workflowId: string;
  userId: string;
  corporateId: string;
  sbuId: string;
  branchId: string;
  departmentId: string;
  groupBy: string;
  leaveTypeId: string;
  year: string;
  categoryId: string;
  priority: string;
}

interface LookupItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="report-viewer">
      <div class="header">
        <div class="header-left">
          <button mat-icon-button matTooltip="Go Back" routerLink="/reports">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="report-title">
            <h1>{{ report?.name || 'Report' }}</h1>
            <p class="subtitle">{{ report?.description }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button matTooltip="Run Report" color="primary" (click)="runReport()" [disabled]="loading">
            <mat-icon>play_arrow</mat-icon>
            Run Report
          </button>
          <button mat-button matTooltip="{{ exporting ? 'Exporting...' : 'Export' }}" [matMenuTriggerFor]="exportMenu" [disabled]="!reportResult || exporting">
            <mat-icon>download</mat-icon>
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportReport('excel')">
              <mat-icon>table_chart</mat-icon>
              <span>Export to Excel (.xlsx)</span>
            </button>
            <button mat-menu-item (click)="exportReport('csv')">
              <mat-icon>description</mat-icon>
              <span>Export to CSV</span>
            </button>
            <button mat-menu-item (click)="exportReport('pdf')">
              <mat-icon>picture_as_pdf</mat-icon>
              <span>Export to PDF</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Parameters Card -->
      <mat-expansion-panel class="parameters-card" [expanded]="filtersExpanded">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>tune</mat-icon>
            Report Filters
          </mat-panel-title>
        </mat-expansion-panel-header>
          <div class="parameters-form">
            <!-- Date Captured - From -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Date Captured - From</mat-label>
                <input matInput [matDatepicker]="startPicker" [(ngModel)]="parameters.startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Date Captured - To -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Date Captured - To</mat-label>
                <input matInput [matDatepicker]="endPicker" [(ngModel)]="parameters.endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Date Approved - From -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Date Approved - From</mat-label>
                <input matInput [matDatepicker]="approvedStartPicker" [(ngModel)]="parameters.approvedStartDate">
                <mat-datepicker-toggle matSuffix [for]="approvedStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #approvedStartPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Date Approved - To -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Date Approved - To</mat-label>
                <input matInput [matDatepicker]="approvedEndPicker" [(ngModel)]="parameters.approvedEndDate">
                <mat-datepicker-toggle matSuffix [for]="approvedEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #approvedEndPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Status -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <input type="text" matInput [formControl]="statusControl" [matAutocomplete]="statusAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
                <mat-autocomplete #statusAuto="matAutocomplete" [displayWith]="displayStatus" (optionSelected)="onStatusSelected($event)">
                  @for (status of filteredStatuses | async; track status.id) {
                    <mat-option [value]="status">{{ status.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Workflow -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Workflow</mat-label>
                <input type="text" matInput [formControl]="workflowControl" [matAutocomplete]="workflowAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
                <mat-autocomplete #workflowAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onWorkflowSelected($event)">
                  @for (item of getFilteredWorkflows(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- User -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>User</mat-label>
                <input type="text" matInput [formControl]="userControl" [matAutocomplete]="userAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
                <mat-autocomplete #userAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onUserSelected($event)">
                  @for (item of getFilteredUsers(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Corporate -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Corporate</mat-label>
                <input type="text" matInput [formControl]="corporateControl" [matAutocomplete]="corporateAuto" [readonly]="corporateControl.disabled">
                @if (corporateControl.disabled) {
                  <mat-icon matSuffix matTooltip="Restricted to your assigned corporate">lock</mat-icon>
                } @else {
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                }
                <mat-autocomplete #corporateAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onCorporateSelected($event)">
                  @for (item of getFilteredCorporates(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- SBU -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>SBU</mat-label>
                <input type="text" matInput [formControl]="sbuControl" [matAutocomplete]="sbuAuto" [readonly]="sbuControl.disabled">
                @if (sbuControl.disabled) {
                  <mat-icon matSuffix matTooltip="Restricted to your assigned SBU">lock</mat-icon>
                } @else {
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                }
                <mat-autocomplete #sbuAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onSbuSelected($event)">
                  @for (item of getFilteredSbuOptions(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Branch -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Branch</mat-label>
                <input type="text" matInput [formControl]="branchControl" [matAutocomplete]="branchAuto" [readonly]="branchControl.disabled">
                @if (branchControl.disabled) {
                  <mat-icon matSuffix matTooltip="Restricted to your assigned branch">lock</mat-icon>
                } @else {
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                }
                <mat-autocomplete #branchAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onBranchSelected($event)">
                  @for (item of getFilteredBranchOptions(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Department -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <input type="text" matInput [formControl]="departmentControl" [matAutocomplete]="departmentAuto" [readonly]="departmentControl.disabled">
                @if (departmentControl.disabled) {
                  <mat-icon matSuffix matTooltip="Restricted to your assigned department">lock</mat-icon>
                } @else {
                  <mat-icon matSuffix>arrow_drop_down</mat-icon>
                }
                <mat-autocomplete #departmentAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onDepartmentSelected($event)">
                  @for (item of getFilteredDepartments(); track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Group By -->
            <div class="filter-field">
              <mat-form-field appearance="outline">
                <mat-label>Group By</mat-label>
                <input type="text" matInput [formControl]="groupByControl" [matAutocomplete]="groupByAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
                <mat-autocomplete #groupByAuto="matAutocomplete" [displayWith]="displayLookup" (optionSelected)="onGroupBySelected($event)">
                  @for (item of filteredGroupByOptions | async; track item.id) {
                    <mat-option [value]="item">{{ item.name }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>
            </div>
          </div>

          @if (isLeaveReport) {
            <div class="parameters-form" style="margin-top: 8px;">
              <div class="filter-field">
                <mat-form-field appearance="outline">
                  <mat-label>Leave Type</mat-label>
                  <mat-select [(ngModel)]="parameters.leaveTypeId">
                    <mat-option value="">All Types</mat-option>
                    @for (lt of leaveTypes; track lt.id) {
                      <mat-option [value]="lt.id">{{ lt.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="filter-field">
                <mat-form-field appearance="outline">
                  <mat-label>Year</mat-label>
                  <mat-select [(ngModel)]="parameters.year">
                    @for (y of yearOptions; track y) {
                      <mat-option [value]="y">{{ y }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          }

          @if (isDeadlineReport) {
            <div class="parameters-form" style="margin-top: 8px;">
              <div class="filter-field">
                <mat-form-field appearance="outline">
                  <mat-label>Category</mat-label>
                  <mat-select [(ngModel)]="parameters.categoryId">
                    <mat-option value="">All Categories</mat-option>
                    @for (cat of deadlineCategories; track cat.id) {
                      <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="filter-field">
                <mat-form-field appearance="outline">
                  <mat-label>Priority</mat-label>
                  <mat-select [(ngModel)]="parameters.priority">
                    <mat-option value="">All Priorities</mat-option>
                    @for (p of deadlinePriorities; track p.id) {
                      <mat-option [value]="p.id">{{ p.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="filter-field">
                <mat-form-field appearance="outline">
                  <mat-label>Instance Status</mat-label>
                  <mat-select [(ngModel)]="parameters.status">
                    <mat-option value="">All Statuses</mat-option>
                    @for (s of deadlineStatuses; track s.id) {
                      <mat-option [value]="s.id">{{ s.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          }

          <div class="filter-actions">
            <button mat-button matTooltip="Clear Filters" (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
      </mat-expansion-panel>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Generating report...</p>
        </div>
      }

      <!-- Summary Cards -->
      @if (reportResult && !loading) {
        <div class="summary-cards">
          @for (item of getSummaryItems(); track item.label) {
            <mat-card class="summary-card">
              <mat-card-content>
                <div class="summary-icon" [style.background]="item.color + '20'" [style.color]="item.color">
                  <mat-icon>{{ item.icon }}</mat-icon>
                </div>
                <div class="summary-info">
                  <span class="summary-value">{{ item.value }}</span>
                  <span class="summary-label">{{ item.label }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Report Results Table -->
      @if (reportResult && !loading) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>table_chart</mat-icon>
              Results
              <span class="result-count">({{ reportResult.data.length }} records)</span>
            </mat-card-title>
            <span class="generated-at">Generated: {{ reportResult.generatedAt | date:'medium' }}</span>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="paginatedData" matSort (matSortChange)="sortData($event)">
                @for (column of reportResult.columns; track column.field) {
                  <ng-container [matColumnDef]="column.field">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header [style.text-align]="column.align || 'left'">
                      {{ column.header }}
                    </th>
                    <td mat-cell *matCellDef="let row" [style.text-align]="column.align || 'left'">
                      @if (column.type === 'date') {
                        {{ row[column.field] | date:'mediumDate' }}
                      } @else if (column.type === 'datetime') {
                        {{ row[column.field] | date:'medium' }}
                      } @else if (column.type === 'currency') {
                        {{ row[column.field] | currency }}
                      } @else if (column.type === 'number') {
                        {{ row[column.field] | number }}
                      } @else if (column.type === 'percentage') {
                        {{ row[column.field] | number:'1.1-1' }}%
                      } @else if (column.type === 'status') {
                        <span class="status-badge" [class]="row[column.field]?.toLowerCase()">
                          {{ row[column.field] }}
                        </span>
                      } @else {
                        {{ row[column.field] }}
                      }
                    </td>
                  </ng-container>
                }

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            <mat-paginator
              [length]="reportResult.data.length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      }

      <!-- Empty State -->
      @if (!reportResult && !loading) {
        <div class="empty-state">
          <mat-icon>assessment</mat-icon>
          <h3>Ready to Generate</h3>
          <p>Configure the filters above and click "Run Report" to generate results</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-viewer { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .report-title h1 { margin: 0; }
    .report-title .subtitle {
      margin: 0.25rem 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .parameters-card {
      margin-bottom: 1.5rem;
    }

    .parameters-card mat-panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
    }

    .parameters-form {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      padding-top: 0.5rem;
    }

    .filter-field {
      width: 100%;
    }

    .filter-field mat-form-field {
      width: 100%;
    }

    .parameters-form ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    .parameters-form ::ng-deep .mat-mdc-text-field-wrapper {
      height: 56px;
    }

    .parameters-form ::ng-deep .mat-mdc-form-field-infix {
      min-height: 56px;
      display: flex;
      align-items: center;
    }

    @media (max-width: 768px) {
      .parameters-form {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }

    @media (max-width: 600px) {
      .parameters-form {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 400px) {
      .parameters-form {
        grid-template-columns: 1fr;
      }
    }

    /* Apply font size to all filter form elements */
    ::ng-deep .parameters-form .mat-mdc-form-field {
      font-size: var(--report-font-size, 14px);
    }

    ::ng-deep .parameters-form .mat-mdc-select-value,
    ::ng-deep .parameters-form .mat-mdc-input-element,
    ::ng-deep .parameters-form .mdc-floating-label,
    ::ng-deep .parameters-form .mat-mdc-floating-label,
    ::ng-deep .parameters-form .mat-mdc-select-placeholder,
    ::ng-deep .parameters-form .mat-mdc-form-field-hint,
    ::ng-deep .parameters-form .mat-mdc-form-field-error {
      font-size: var(--report-font-size, 14px) !important;
    }

    ::ng-deep .parameters-form .mat-mdc-option {
      font-size: var(--report-font-size, 14px) !important;
      min-height: calc(var(--report-font-size, 14px) * 3) !important;
    }

    ::ng-deep .parameters-form .mat-datepicker-toggle button {
      font-size: var(--report-font-size, 14px);
    }

    /* Global styles for dropdown overlay panels */
    :host ::ng-deep .cdk-overlay-pane .mat-mdc-option {
      font-size: var(--report-font-size, 14px) !important;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .loading-state p {
      margin-top: 1rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem !important;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-icon mat-icon {
      font-size: 24px;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .summary-label {
      font-size: 0.8rem;
      color: #666;
    }

    .results-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .results-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .result-count {
      font-weight: normal;
      color: #666;
      font-size: 0.9rem;
    }

    .generated-at {
      font-size: 0.8rem;
      color: #666;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.pending { background: #fff3e0; color: #e65100; }
    .status-badge.approved { background: #e8f5e9; color: #2e7d32; }
    .status-badge.rejected { background: #ffebee; color: #c62828; }
    .status-badge.draft { background: #f5f5f5; color: #666; }
    .status-badge.escalated { background: #e3f2fd; color: #1565c0; }
    .status-badge.cancelled { background: #fafafa; color: #9e9e9e; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 8px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #1976d2;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
      color: #333;
    }

    .empty-state p {
      margin: 0;
      color: #666;
    }
  `]
})
export class ReportViewerComponent implements OnInit {
  reportId = '';
  report: ReportDefinition | null = null;
  reportResult: ReportResult | null = null;
  loading = false;
  exporting = false;
  filtersExpanded = true;
  reportFontSize = '14px';

  parameters: ReportParameters = {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    approvedStartDate: null,
    approvedEndDate: null,
    status: '',
    workflowId: '',
    userId: '',
    corporateId: '',
    sbuId: '',
    branchId: '',
    departmentId: '',
    groupBy: '',
    leaveTypeId: '',
    year: new Date().getFullYear().toString(),
    categoryId: '',
    priority: ''
  };

  leaveTypes: any[] = [];
  deadlineCategories: any[] = [];
  deadlinePriorities = [
    { id: 'LOW', name: 'Low' },
    { id: 'MEDIUM', name: 'Medium' },
    { id: 'HIGH', name: 'High' },
    { id: 'CRITICAL', name: 'Critical' }
  ];
  deadlineStatuses = [
    { id: 'UPCOMING', name: 'Upcoming' },
    { id: 'DUE_SOON', name: 'Due Soon' },
    { id: 'OVERDUE', name: 'Overdue' },
    { id: 'COMPLETED', name: 'Completed' },
    { id: 'SKIPPED', name: 'Skipped' }
  ];
  yearOptions: string[] = (() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1].map(String);
  })();

  get isLeaveReport(): boolean {
    return this.report?.category === 'leave';
  }

  get isDeadlineReport(): boolean {
    return this.report?.category === 'deadline';
  }

  // Form controls for searchable dropdowns
  statusControl = new FormControl<any>('');
  workflowControl = new FormControl<any>('');
  userControl = new FormControl<any>('');
  corporateControl = new FormControl<any>('');
  sbuControl = new FormControl<any>('');
  branchControl = new FormControl<any>('');
  departmentControl = new FormControl<any>('');
  groupByControl = new FormControl<any>('');

  // Static options
  statuses: LookupItem[] = [
    { id: '', name: 'All Statuses' },
    { id: 'DRAFT', name: 'Draft' },
    { id: 'PENDING', name: 'Pending' },
    { id: 'APPROVED', name: 'Approved' },
    { id: 'REJECTED', name: 'Rejected' },
    { id: 'ESCALATED', name: 'Escalated' },
    { id: 'CANCELLED', name: 'Cancelled' }
  ];

  groupByOptions: LookupItem[] = [
    { id: '', name: 'None' },
    { id: 'day', name: 'Day' },
    { id: 'week', name: 'Week' },
    { id: 'month', name: 'Month' },
    { id: 'workflow', name: 'Workflow' },
    { id: 'user', name: 'User' },
    { id: 'sbu', name: 'SBU' },
    { id: 'status', name: 'Status' }
  ];

  // Filtered observables for autocomplete (static options)
  filteredStatuses!: Observable<LookupItem[]>;
  filteredGroupByOptions!: Observable<LookupItem[]>;

  // User scope restrictions
  userScope: { corporateIds: any[], sbuIds: any[], branchIds: any[], departmentIds: any[], isAdmin: boolean, isUnrestricted: boolean } | null = null;
  scopeRestricted = false;

  // Lookup data
  workflows: LookupItem[] = [];
  users: LookupItem[] = [];
  corporates: LookupItem[] = [];
  sbus: LookupItem[] = [];
  filteredSbus: LookupItem[] = [];
  branches: LookupItem[] = [];
  filteredBranches: LookupItem[] = [];
  departments: LookupItem[] = [];

  displayedColumns: string[] = [];
  paginatedData: any[] = [];
  pageSize = 25;
  currentPage = 0;

  private apiUrl = '/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.reportId = params['reportId'];
      this.loadReportDefinition();
    });
    this.loadUserScope();
    this.loadLookupData();
    this.loadReportSettings();
    this.setupAutocompleteFilters();
  }

  loadUserScope() {
    this.http.get<any>(`${this.apiUrl}/reports/user-scope`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.userScope = res.data;
          const isRestricted = !res.data.isAdmin && !res.data.isUnrestricted;
          this.scopeRestricted = isRestricted;

          if (isRestricted) {
            // Pre-select user's scope values
            if (res.data.corporateIds?.length === 1) {
              const corp = res.data.corporateIds[0];
              this.parameters.corporateId = corp.id;
              this.corporateControl.setValue({ id: corp.id, name: corp.name });
              this.corporateControl.disable();
            } else if (res.data.corporateIds?.length > 1) {
              // Multiple corporates — restrict dropdown to only user's corporates
              this.corporateControl.disable();
              this.parameters.corporateId = res.data.corporateIds[0].id;
              this.corporateControl.setValue({ id: res.data.corporateIds[0].id, name: res.data.corporateIds[0].name });
            }

            if (res.data.sbuIds?.length === 1) {
              const sbu = res.data.sbuIds[0];
              this.parameters.sbuId = sbu.id;
              this.sbuControl.setValue({ id: sbu.id, name: sbu.name });
              this.sbuControl.disable();
            } else if (res.data.sbuIds?.length > 1) {
              this.sbuControl.disable();
              this.parameters.sbuId = res.data.sbuIds[0].id;
              this.sbuControl.setValue({ id: res.data.sbuIds[0].id, name: res.data.sbuIds[0].name });
            }

            if (res.data.branchIds?.length === 1) {
              const branch = res.data.branchIds[0];
              this.parameters.branchId = branch.id;
              this.branchControl.setValue({ id: branch.id, name: branch.name });
              this.branchControl.disable();
            } else if (res.data.branchIds?.length > 1) {
              this.branchControl.disable();
              this.parameters.branchId = res.data.branchIds[0].id;
              this.branchControl.setValue({ id: res.data.branchIds[0].id, name: res.data.branchIds[0].name });
            }

            if (res.data.departmentIds?.length === 1) {
              const dept = res.data.departmentIds[0];
              this.parameters.departmentId = dept.id;
              this.departmentControl.setValue({ id: dept.id, name: dept.name });
              this.departmentControl.disable();
            } else if (res.data.departmentIds?.length > 1) {
              this.departmentControl.disable();
              this.parameters.departmentId = res.data.departmentIds[0].id;
              this.departmentControl.setValue({ id: res.data.departmentIds[0].id, name: res.data.departmentIds[0].name });
            }
          }
        }
      }
    });
  }

  setupAutocompleteFilters() {
    this.filteredStatuses = this.statusControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterOptions(this.statuses, value))
    );

    this.filteredGroupByOptions = this.groupByControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterOptions(this.groupByOptions, value))
    );
  }

  getFilteredWorkflows(): LookupItem[] {
    const value = this.workflowControl.value;
    return this.filterOptions([{ id: '', name: 'All Workflows' }, ...this.workflows], value);
  }

  getFilteredUsers(): LookupItem[] {
    const value = this.userControl.value;
    return this.filterOptions([{ id: '', name: 'All Users' }, ...this.users], value);
  }

  getFilteredCorporates(): LookupItem[] {
    const value = this.corporateControl.value;
    return this.filterOptions([{ id: '', name: 'All Corporates' }, ...this.corporates], value);
  }

  getFilteredSbuOptions(): LookupItem[] {
    const value = this.sbuControl.value;
    return this.filterOptions([{ id: '', name: 'All SBUs' }, ...this.filteredSbus], value);
  }

  getFilteredBranchOptions(): LookupItem[] {
    const value = this.branchControl.value;
    return this.filterOptions([{ id: '', name: 'All Branches' }, ...this.filteredBranches], value);
  }

  getFilteredDepartments(): LookupItem[] {
    const value = this.departmentControl.value;
    return this.filterOptions([{ id: '', name: 'All Departments' }, ...this.departments], value);
  }

  filterOptions(options: LookupItem[], value: string | LookupItem | null): LookupItem[] {
    if (!value) return options;
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value?.name?.toLowerCase() || '';
    return options.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  displayLookup = (item: LookupItem): string => {
    return item?.name || '';
  }

  displayStatus = (item: LookupItem): string => {
    return item?.name || '';
  }

  onStatusSelected(event: any) {
    const selected = event.option.value;
    this.parameters.status = selected?.id || '';
  }

  onWorkflowSelected(event: any) {
    const selected = event.option.value;
    this.parameters.workflowId = selected?.id || '';
  }

  onUserSelected(event: any) {
    const selected = event.option.value;
    this.parameters.userId = selected?.id || '';
  }

  onCorporateSelected(event: any) {
    const selected = event.option.value;
    this.parameters.corporateId = selected?.id || '';
    this.onCorporateChange();
  }

  onSbuSelected(event: any) {
    const selected = event.option.value;
    this.parameters.sbuId = selected?.id || '';
    this.onSbuChange();
  }

  onBranchSelected(event: any) {
    const selected = event.option.value;
    this.parameters.branchId = selected?.id || '';
  }

  onDepartmentSelected(event: any) {
    const selected = event.option.value;
    this.parameters.departmentId = selected?.id || '';
  }

  onGroupBySelected(event: any) {
    const selected = event.option.value;
    this.parameters.groupBy = selected?.id || '';
  }

  loadReportSettings() {
    this.http.get<any>(`${this.apiUrl}/settings/by-key/reporting.font.size`).subscribe({
      next: (res) => {
        if (res.success && res.data?.value) {
          this.reportFontSize = res.data.value + 'px';
          document.documentElement.style.setProperty('--report-font-size', this.reportFontSize);
        }
      },
      error: () => {
        // Use default font size
        document.documentElement.style.setProperty('--report-font-size', '14px');
      }
    });
  }

  loadLookupData() {
    // Load accessible workflows (filtered by user's role access)
    this.http.get<any>(`${this.apiUrl}/reports/accessible-workflows`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workflows = res.data.map((w: any) => ({ id: w.id, name: w.name }));
        }
      }
    });

    // Load accessible users (filtered by scope)
    this.http.get<any>(`${this.apiUrl}/reports/accessible-users`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = res.data.map((u: any) => ({ id: u.id, name: u.name }));
        }
      }
    });

    // Load corporates
    this.http.get<any>(`${this.apiUrl}/corporates`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.corporates = res.data.map((c: any) => ({ id: c.id, name: c.name }));
        }
      }
    });

    // Load SBUs
    this.http.get<any>(`${this.apiUrl}/sbus`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sbus = res.data.map((s: any) => ({ id: s.id, name: s.name, corporateId: s.corporateId }));
          this.filteredSbus = [...this.sbus];
        }
      }
    });

    // Load accessible branches (filtered by scope)
    this.http.get<any>(`${this.apiUrl}/reports/accessible-branches`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branches = res.data.map((b: any) => ({ id: b.id, name: b.name, sbuId: b.sbuId }));
          this.filteredBranches = [...this.branches];
        }
      }
    });

    // Load departments
    this.http.get<any>(`${this.apiUrl}/departments`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.departments = res.data.map((d: any) => ({ id: d.id, name: d.name }));
        }
      }
    });

    // Load leave types
    this.http.get<any>(`${this.apiUrl}/leave/types`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leaveTypes = res.data;
        }
      }
    });

    // Load deadline categories
    this.http.get<any>(`${this.apiUrl}/deadline-categories`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deadlineCategories = res.data;
        }
      }
    });
  }

  onCorporateChange() {
    if (this.parameters.corporateId) {
      this.filteredSbus = this.sbus.filter((s: any) => s.corporateId === this.parameters.corporateId);
    } else {
      this.filteredSbus = [...this.sbus];
    }
    this.parameters.sbuId = '';
    this.parameters.branchId = '';
    this.filteredBranches = [];
  }

  onSbuChange() {
    if (this.parameters.sbuId) {
      this.filteredBranches = this.branches.filter((b: any) => b.sbuId === this.parameters.sbuId);
    } else {
      this.filteredBranches = [...this.branches];
    }
    this.parameters.branchId = '';
  }

  clearFilters() {
    this.parameters = {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
      approvedStartDate: null,
      approvedEndDate: null,
      status: '',
      workflowId: '',
      userId: '',
      corporateId: '',
      sbuId: '',
      branchId: '',
      departmentId: '',
      groupBy: '',
      leaveTypeId: '',
      year: new Date().getFullYear().toString(),
      categoryId: '',
      priority: ''
    };
    // Reset form controls
    this.statusControl.setValue('');
    this.workflowControl.setValue('');
    this.userControl.setValue('');
    this.groupByControl.setValue('');
    this.filteredSbus = [...this.sbus];
    this.filteredBranches = [...this.branches];

    // Re-apply scope restrictions if user is restricted
    if (this.scopeRestricted && this.userScope) {
      if (this.userScope.corporateIds?.length > 0) {
        this.parameters.corporateId = this.userScope.corporateIds[0].id;
        this.corporateControl.setValue({ id: this.userScope.corporateIds[0].id, name: this.userScope.corporateIds[0].name });
      } else {
        this.corporateControl.setValue('');
      }
      if (this.userScope.sbuIds?.length > 0) {
        this.parameters.sbuId = this.userScope.sbuIds[0].id;
        this.sbuControl.setValue({ id: this.userScope.sbuIds[0].id, name: this.userScope.sbuIds[0].name });
      } else {
        this.sbuControl.setValue('');
      }
      if (this.userScope.branchIds?.length > 0) {
        this.parameters.branchId = this.userScope.branchIds[0].id;
        this.branchControl.setValue({ id: this.userScope.branchIds[0].id, name: this.userScope.branchIds[0].name });
      } else {
        this.branchControl.setValue('');
      }
      if (this.userScope.departmentIds?.length > 0) {
        this.parameters.departmentId = this.userScope.departmentIds[0].id;
        this.departmentControl.setValue({ id: this.userScope.departmentIds[0].id, name: this.userScope.departmentIds[0].name });
      } else {
        this.departmentControl.setValue('');
      }
    } else {
      this.corporateControl.setValue('');
      this.sbuControl.setValue('');
      this.branchControl.setValue('');
      this.departmentControl.setValue('');
    }
  }

  loadReportDefinition() {
    const reports = this.reportService.getAllReports();
    this.report = reports.find(r => r.id === this.reportId) || null;
    if (!this.report) {
      this.snackBar.open('Report not found', 'Close', { duration: 3000 });
      this.router.navigate(['/reports']);
    }
  }

  runReport() {
    this.loading = true;

    // Project reports use client-side data generation
    if (this.report?.category === 'project') {
      this.generateMockData();
      this.loading = false;
      return;
    }

    this.reportService.generateReport(this.reportId, this.formatParameters()).subscribe({
      next: (res) => {
        if (res.success) {
          this.reportResult = res.data;
          this.displayedColumns = res.data.columns.map((c: any) => c.field);
          this.updatePaginatedData();
        } else {
          this.generateMockData();
        }
        this.loading = false;
      },
      error: () => {
        this.generateMockData();
        this.loading = false;
      }
    });
  }

  generateMockData() {
    const mockResult: ReportResult = {
      columns: this.getMockColumns(),
      data: this.getMockData(),
      summary: this.getMockSummary(),
      generatedAt: new Date().toISOString()
    };
    this.reportResult = mockResult;
    this.displayedColumns = mockResult.columns.map(c => c.field);
    this.updatePaginatedData();
  }

  getMockColumns(): any[] {
    const reportId = this.report?.id;
    switch (reportId) {
      case 'submission-summary':
        return [
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'submitter', header: 'Submitted By', type: 'string' },
          { field: 'sbu', header: 'SBU', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'submittedAt', header: 'Submitted', type: 'date' },
          { field: 'completedAt', header: 'Completed', type: 'date' }
        ];
      case 'approval-tracker':
        return [
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'approver', header: 'Approver', type: 'string' },
          { field: 'level', header: 'Level', type: 'number', align: 'center' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'action', header: 'Action', type: 'string' },
          { field: 'responseTime', header: 'Response (hrs)', type: 'number', align: 'right' },
          { field: 'actionDate', header: 'Action Date', type: 'datetime' }
        ];
      case 'performance-metrics':
        return [
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'totalSubmissions', header: 'Total', type: 'number', align: 'right' },
          { field: 'avgProcessingTime', header: 'Avg Time (hrs)', type: 'number', align: 'right' },
          { field: 'minTime', header: 'Min (hrs)', type: 'number', align: 'right' },
          { field: 'maxTime', header: 'Max (hrs)', type: 'number', align: 'right' },
          { field: 'completionRate', header: 'Completion %', type: 'percentage', align: 'right' },
          { field: 'slaCompliance', header: 'SLA %', type: 'percentage', align: 'right' }
        ];
      case 'user-activity':
        return [
          { field: 'user', header: 'User', type: 'string' },
          { field: 'submissions', header: 'Submissions', type: 'number', align: 'right' },
          { field: 'approvals', header: 'Approvals', type: 'number', align: 'right' },
          { field: 'rejections', header: 'Rejections', type: 'number', align: 'right' },
          { field: 'avgResponseTime', header: 'Avg Response (hrs)', type: 'number', align: 'right' },
          { field: 'lastLogin', header: 'Last Login', type: 'datetime' }
        ];
      case 'organization-overview':
        return [
          { field: 'entity', header: 'Entity', type: 'string' },
          { field: 'type', header: 'Type', type: 'string' },
          { field: 'totalSubmissions', header: 'Submissions', type: 'number', align: 'right' },
          { field: 'approved', header: 'Approved', type: 'number', align: 'right' },
          { field: 'pending', header: 'Pending', type: 'number', align: 'right' },
          { field: 'rejected', header: 'Rejected', type: 'number', align: 'right' },
          { field: 'totalAmount', header: 'Total Amount', type: 'currency', align: 'right' }
        ];
      case 'financial-summary':
        return [
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'submitter', header: 'Submitted By', type: 'string' },
          { field: 'amount', header: 'Amount', type: 'currency', align: 'right' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'approver', header: 'Approver', type: 'string' },
          { field: 'submittedAt', header: 'Submitted', type: 'date' }
        ];
      case 'audit-compliance':
        return [
          { field: 'timestamp', header: 'Timestamp', type: 'datetime' },
          { field: 'user', header: 'User', type: 'string' },
          { field: 'action', header: 'Action', type: 'string' },
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'details', header: 'Details', type: 'string' }
        ];
      case 'trends-analytics':
        return [
          { field: 'period', header: 'Period', type: 'string' },
          { field: 'submissions', header: 'Submissions', type: 'number', align: 'right' },
          { field: 'approved', header: 'Approved', type: 'number', align: 'right' },
          { field: 'rejected', header: 'Rejected', type: 'number', align: 'right' },
          { field: 'avgProcessingTime', header: 'Avg Time (hrs)', type: 'number', align: 'right' },
          { field: 'totalAmount', header: 'Total Amount', type: 'currency', align: 'right' }
        ];
      // Project Reports
      case 'project-status':
        return [
          { field: 'code', header: 'Code', type: 'string' },
          { field: 'name', header: 'Project Name', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'stage', header: 'Stage', type: 'string' },
          { field: 'priority', header: 'Priority', type: 'string' },
          { field: 'manager', header: 'Manager', type: 'string' },
          { field: 'category', header: 'Category', type: 'string' },
          { field: 'budget', header: 'Budget', type: 'currency', align: 'right' },
          { field: 'actualCost', header: 'Actual Cost', type: 'currency', align: 'right' },
          { field: 'completion', header: 'Completion', type: 'percentage', align: 'right' },
          { field: 'startDate', header: 'Start Date', type: 'date' },
          { field: 'endDate', header: 'End Date', type: 'date' }
        ];
      case 'project-budget':
        return [
          { field: 'projectCode', header: 'Project', type: 'string' },
          { field: 'projectName', header: 'Project Name', type: 'string' },
          { field: 'lineCategory', header: 'Budget Category', type: 'string' },
          { field: 'description', header: 'Description', type: 'string' },
          { field: 'estimated', header: 'Estimated', type: 'currency', align: 'right' },
          { field: 'actual', header: 'Actual', type: 'currency', align: 'right' },
          { field: 'variance', header: 'Variance', type: 'currency', align: 'right' },
          { field: 'variancePct', header: 'Variance %', type: 'percentage', align: 'right' }
        ];
      case 'project-tasks':
        return [
          { field: 'projectCode', header: 'Project', type: 'string' },
          { field: 'taskName', header: 'Task', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'priority', header: 'Priority', type: 'string' },
          { field: 'assignee', header: 'Assignee', type: 'string' },
          { field: 'startDate', header: 'Start', type: 'date' },
          { field: 'dueDate', header: 'Due', type: 'date' },
          { field: 'completion', header: 'Completion', type: 'percentage', align: 'right' },
          { field: 'overdue', header: 'Overdue', type: 'string' }
        ];
      case 'project-milestones':
        return [
          { field: 'projectCode', header: 'Project', type: 'string' },
          { field: 'milestone', header: 'Milestone', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'dueDate', header: 'Due Date', type: 'date' },
          { field: 'completedDate', header: 'Completed', type: 'date' },
          { field: 'critical', header: 'Critical', type: 'string' },
          { field: 'owner', header: 'Owner', type: 'string' }
        ];
      case 'project-risks-issues':
        return [
          { field: 'projectCode', header: 'Project', type: 'string' },
          { field: 'type', header: 'Type', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'probability', header: 'Probability', type: 'string' },
          { field: 'impact', header: 'Impact', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'owner', header: 'Owner', type: 'string' },
          { field: 'category', header: 'Category', type: 'string' },
          { field: 'identifiedDate', header: 'Identified', type: 'date' }
        ];
      case 'project-team':
        return [
          { field: 'projectCode', header: 'Project', type: 'string' },
          { field: 'projectName', header: 'Project Name', type: 'string' },
          { field: 'member', header: 'Member', type: 'string' },
          { field: 'role', header: 'Role', type: 'string' },
          { field: 'email', header: 'Email', type: 'string' },
          { field: 'taskCount', header: 'Tasks', type: 'number', align: 'right' }
        ];
      default:
        return [
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'title', header: 'Title', type: 'string' },
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'submittedAt', header: 'Date', type: 'date' }
        ];
    }
  }

  getMockData(): any[] {
    const reportId = this.report?.id;
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'ESCALATED'];
    const workflows = ['Leave Request', 'Expense Claim', 'Purchase Order', 'Travel Request', 'Overtime Request'];
    const users = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'];
    const titles = ['Annual Leave - Dec 2026', 'Office Supplies Q1', 'Client Travel - Harare', 'Server Upgrade Request', 'Team Building Budget'];
    const sbus = ['Head Office', 'Finance', 'Operations', 'IT', 'HR'];
    const actions = ['APPROVED', 'REJECTED', 'ESCALATED', 'SUBMITTED', 'RECALLED'];

    switch (reportId) {
      case 'submission-summary':
        return Array.from({ length: 20 }, (_, i) => ({
          referenceNumber: `REF-2026-${String(i + 1).padStart(4, '0')}`,
          title: titles[i % titles.length],
          workflow: workflows[i % workflows.length],
          submitter: users[i % users.length],
          sbu: sbus[i % sbus.length],
          status: statuses[i % statuses.length],
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          completedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null
        }));
      case 'approval-tracker':
        return Array.from({ length: 15 }, (_, i) => ({
          referenceNumber: `REF-2026-${String(i + 1).padStart(4, '0')}`,
          title: titles[i % titles.length],
          workflow: workflows[i % workflows.length],
          approver: users[i % users.length],
          level: (i % 3) + 1,
          status: statuses[i % 3],
          action: actions[i % actions.length],
          responseTime: +(Math.random() * 48 + 1).toFixed(1),
          actionDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        }));
      case 'performance-metrics':
        return workflows.map(wf => ({
          workflow: wf,
          totalSubmissions: Math.floor(Math.random() * 200) + 20,
          avgProcessingTime: +(Math.random() * 48 + 2).toFixed(1),
          minTime: +(Math.random() * 2 + 0.5).toFixed(1),
          maxTime: +(Math.random() * 72 + 24).toFixed(1),
          completionRate: +(Math.random() * 30 + 70).toFixed(1),
          slaCompliance: +(Math.random() * 20 + 80).toFixed(1)
        }));
      case 'user-activity':
        return users.map(user => ({
          user,
          submissions: Math.floor(Math.random() * 80) + 5,
          approvals: Math.floor(Math.random() * 50) + 10,
          rejections: Math.floor(Math.random() * 10),
          avgResponseTime: +(Math.random() * 24 + 1).toFixed(1),
          lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }));
      case 'organization-overview':
        return sbus.map(s => ({
          entity: s,
          type: 'SBU',
          totalSubmissions: Math.floor(Math.random() * 150) + 10,
          approved: Math.floor(Math.random() * 100) + 5,
          pending: Math.floor(Math.random() * 30),
          rejected: Math.floor(Math.random() * 20),
          totalAmount: Math.floor(Math.random() * 500000) + 10000
        }));
      case 'financial-summary':
        return Array.from({ length: 15 }, (_, i) => ({
          referenceNumber: `REF-2026-${String(i + 1).padStart(4, '0')}`,
          title: titles[i % titles.length],
          workflow: workflows[i % workflows.length],
          submitter: users[i % users.length],
          amount: Math.floor(Math.random() * 50000) + 500,
          status: statuses[i % 3],
          approver: users[(i + 2) % users.length],
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }));
      case 'audit-compliance':
        return Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          user: users[i % users.length],
          action: actions[i % actions.length],
          referenceNumber: `REF-2026-${String(i + 1).padStart(4, '0')}`,
          title: titles[i % titles.length],
          details: `${actions[i % actions.length]} by ${users[i % users.length]}`
        }));
      case 'trends-analytics':
        return ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'].map(period => ({
          period,
          submissions: Math.floor(Math.random() * 200) + 50,
          approved: Math.floor(Math.random() * 150) + 30,
          rejected: Math.floor(Math.random() * 30) + 5,
          avgProcessingTime: +(Math.random() * 24 + 4).toFixed(1),
          totalAmount: Math.floor(Math.random() * 500000) + 50000
        }));
      // Project Reports
      case 'project-status': {
        const projStatuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'DRAFT', 'CANCELLED'];
        const stages = ['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSURE'];
        const priorities = ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'];
        const managers = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown'];
        const cats = ['IT', 'Operations', 'Finance', 'HR', 'Marketing'];
        return Array.from({ length: 12 }, (_, i) => ({
          code: `PRJ-${String(i + 1).padStart(3, '0')}`,
          name: ['ERP Upgrade', 'Office Renovation', 'Mobile App', 'Data Migration', 'Security Audit', 'CRM Implementation', 'Website Redesign', 'Cloud Migration', 'Training Program', 'Compliance Review', 'Network Upgrade', 'Brand Refresh'][i],
          status: projStatuses[i % projStatuses.length],
          stage: stages[i % stages.length],
          priority: priorities[i % priorities.length],
          manager: managers[i % managers.length],
          category: cats[i % cats.length],
          budget: Math.floor(Math.random() * 500000) + 50000,
          actualCost: Math.floor(Math.random() * 400000) + 30000,
          completion: +(Math.random() * 100).toFixed(0),
          startDate: new Date(2026, i % 12, 1),
          endDate: new Date(2026, (i % 12) + 3, 28)
        }));
      }
      case 'project-budget': {
        const budgetCats = ['Personnel', 'Equipment', 'Software', 'Travel', 'Consulting', 'Infrastructure'];
        return Array.from({ length: 15 }, (_, i) => {
          const est = Math.floor(Math.random() * 100000) + 10000;
          const act = Math.floor(Math.random() * 120000) + 5000;
          return {
            projectCode: `PRJ-${String((i % 4) + 1).padStart(3, '0')}`,
            projectName: ['ERP Upgrade', 'Office Renovation', 'Mobile App', 'Data Migration'][i % 4],
            lineCategory: budgetCats[i % budgetCats.length],
            description: `${budgetCats[i % budgetCats.length]} costs`,
            estimated: est,
            actual: act,
            variance: est - act,
            variancePct: +(((est - act) / est) * 100).toFixed(1)
          };
        });
      }
      case 'project-tasks': {
        const taskStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
        const taskPriorities = ['HIGH', 'MEDIUM', 'LOW'];
        const assignees = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'];
        return Array.from({ length: 20 }, (_, i) => {
          const due = new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000);
          return {
            projectCode: `PRJ-${String((i % 5) + 1).padStart(3, '0')}`,
            taskName: `Task ${i + 1} - ${['Design', 'Development', 'Testing', 'Review', 'Deployment'][i % 5]}`,
            status: taskStatuses[i % taskStatuses.length],
            priority: taskPriorities[i % taskPriorities.length],
            assignee: assignees[i % assignees.length],
            startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            dueDate: due,
            completion: +(Math.random() * 100).toFixed(0),
            overdue: due < new Date() ? 'Yes' : 'No'
          };
        });
      }
      case 'project-milestones': {
        const msStatuses = ['PENDING', 'COMPLETED', 'OVERDUE', 'IN_PROGRESS'];
        const owners = ['John Smith', 'Jane Doe', 'Bob Wilson'];
        return Array.from({ length: 10 }, (_, i) => ({
          projectCode: `PRJ-${String((i % 4) + 1).padStart(3, '0')}`,
          milestone: ['Requirements Sign-off', 'Design Complete', 'Beta Release', 'UAT Complete', 'Go Live', 'Phase 1 Delivery', 'Security Review', 'Training Complete', 'Data Migration', 'Final Handover'][i],
          status: msStatuses[i % msStatuses.length],
          dueDate: new Date(2026, i % 12, 15),
          completedDate: i % 3 === 1 ? new Date(2026, i % 12, 12) : null,
          critical: i % 3 === 0 ? 'Yes' : 'No',
          owner: owners[i % owners.length]
        }));
      }
      case 'project-risks-issues': {
        const riStatuses = ['OPEN', 'MITIGATED', 'CLOSED', 'ESCALATED'];
        const probabilities = ['HIGH', 'MEDIUM', 'LOW'];
        const impacts = ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'];
        const riCats = ['Technical', 'Financial', 'Resource', 'Schedule', 'External'];
        return Array.from({ length: 12 }, (_, i) => ({
          projectCode: `PRJ-${String((i % 4) + 1).padStart(3, '0')}`,
          type: i % 2 === 0 ? 'Risk' : 'Issue',
          title: ['Budget Overrun', 'Key Resource Leaving', 'Vendor Delay', 'Scope Creep', 'Security Vulnerability', 'Integration Failure', 'Regulatory Change', 'Timeline Slip', 'Quality Issue', 'Dependency Delay', 'Skills Gap', 'Data Loss'][i],
          probability: probabilities[i % probabilities.length],
          impact: impacts[i % impacts.length],
          status: riStatuses[i % riStatuses.length],
          owner: ['John Smith', 'Jane Doe', 'Bob Wilson'][i % 3],
          category: riCats[i % riCats.length],
          identifiedDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        }));
      }
      case 'project-team': {
        const roles = ['Project Manager', 'Developer', 'Designer', 'QA Engineer', 'Business Analyst', 'DevOps'];
        const members = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown', 'Charlie Davis', 'Eve Taylor'];
        return Array.from({ length: 12 }, (_, i) => ({
          projectCode: `PRJ-${String((i % 4) + 1).padStart(3, '0')}`,
          projectName: ['ERP Upgrade', 'Office Renovation', 'Mobile App', 'Data Migration'][i % 4],
          member: members[i % members.length],
          role: roles[i % roles.length],
          email: `${members[i % members.length].toLowerCase().replace(' ', '.')}@company.com`,
          taskCount: Math.floor(Math.random() * 15) + 1
        }));
      }
      default:
        return Array.from({ length: 10 }, (_, i) => ({
          referenceNumber: `REF-2026-${String(i + 1).padStart(4, '0')}`,
          title: titles[i % titles.length],
          workflow: workflows[i % workflows.length],
          status: statuses[i % statuses.length],
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }));
    }
  }

  getMockSummary(): Record<string, any> {
    // Summary is computed dynamically from data in getSummaryItems()
    return {};
  }

  getSummaryItems() {
    if (!this.reportResult?.data) return [];
    const data = this.reportResult.data;
    const reportId = this.report?.id;
    const totalRecords = data.length;

    switch (reportId) {
      case 'financial-summary':
        return [
          { label: 'Total Records', value: totalRecords.toLocaleString(), icon: 'description', color: '#1976d2' },
          { label: 'Total Amount', value: '$' + data.reduce((sum: number, r: any) => sum + (r.amount || 0), 0).toLocaleString(), icon: 'attach_money', color: '#2e7d32' },
          { label: 'Avg Amount', value: '$' + (totalRecords > 0 ? Math.round(data.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) / totalRecords) : 0).toLocaleString(), icon: 'payments', color: '#ed6c02' },
          { label: 'Approved Amount', value: '$' + data.filter((r: any) => r.status === 'APPROVED').reduce((sum: number, r: any) => sum + (r.amount || 0), 0).toLocaleString(), icon: 'check_circle', color: '#9c27b0' }
        ];
      case 'submission-summary':
        return [
          { label: 'Total Submissions', value: totalRecords.toLocaleString(), icon: 'description', color: '#1976d2' },
          { label: 'Approved', value: data.filter((r: any) => r.status === 'APPROVED').length.toLocaleString(), icon: 'check_circle', color: '#2e7d32' },
          { label: 'Pending', value: data.filter((r: any) => r.status === 'PENDING').length.toLocaleString(), icon: 'hourglass_empty', color: '#ed6c02' },
          { label: 'Rejected', value: data.filter((r: any) => r.status === 'REJECTED').length.toLocaleString(), icon: 'cancel', color: '#d32f2f' }
        ];
      case 'approval-tracker':
        return [
          { label: 'Total Actions', value: totalRecords.toLocaleString(), icon: 'description', color: '#1976d2' },
          { label: 'Approved', value: data.filter((r: any) => r.action === 'APPROVED').length.toLocaleString(), icon: 'check_circle', color: '#2e7d32' },
          { label: 'Avg Response', value: (totalRecords > 0 ? (data.reduce((sum: number, r: any) => sum + (+(r.responseTime) || 0), 0) / totalRecords).toFixed(1) : '0') + ' hrs', icon: 'schedule', color: '#ed6c02' },
          { label: 'Escalated', value: data.filter((r: any) => r.action === 'ESCALATED').length.toLocaleString(), icon: 'trending_up', color: '#d32f2f' }
        ];
      case 'performance-metrics':
        return [
          { label: 'Workflows', value: totalRecords.toLocaleString(), icon: 'account_tree', color: '#1976d2' },
          { label: 'Total Submissions', value: data.reduce((sum: number, r: any) => sum + (r.totalSubmissions || 0), 0).toLocaleString(), icon: 'description', color: '#2e7d32' },
          { label: 'Avg Processing', value: (totalRecords > 0 ? (data.reduce((sum: number, r: any) => sum + (+(r.avgProcessingTime) || 0), 0) / totalRecords).toFixed(1) : '0') + ' hrs', icon: 'schedule', color: '#ed6c02' },
          { label: 'Avg Completion', value: (totalRecords > 0 ? (data.reduce((sum: number, r: any) => sum + (+(r.completionRate) || 0), 0) / totalRecords).toFixed(1) : '0') + '%', icon: 'check_circle', color: '#9c27b0' }
        ];
      case 'user-activity':
        return [
          { label: 'Total Users', value: totalRecords.toLocaleString(), icon: 'people', color: '#1976d2' },
          { label: 'Total Submissions', value: data.reduce((sum: number, r: any) => sum + (r.submissions || 0), 0).toLocaleString(), icon: 'send', color: '#2e7d32' },
          { label: 'Total Approvals', value: data.reduce((sum: number, r: any) => sum + (r.approvals || 0), 0).toLocaleString(), icon: 'thumb_up', color: '#ed6c02' },
          { label: 'Total Rejections', value: data.reduce((sum: number, r: any) => sum + (r.rejections || 0), 0).toLocaleString(), icon: 'cancel', color: '#d32f2f' }
        ];
      case 'organization-overview':
        return [
          { label: 'Total Entities', value: totalRecords.toLocaleString(), icon: 'corporate_fare', color: '#1976d2' },
          { label: 'Total Submissions', value: data.reduce((sum: number, r: any) => sum + (r.totalSubmissions || 0), 0).toLocaleString(), icon: 'description', color: '#2e7d32' },
          { label: 'Total Amount', value: '$' + data.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0).toLocaleString(), icon: 'attach_money', color: '#ed6c02' },
          { label: 'Total Pending', value: data.reduce((sum: number, r: any) => sum + (r.pending || 0), 0).toLocaleString(), icon: 'hourglass_empty', color: '#9c27b0' }
        ];
      case 'trends-analytics':
        return [
          { label: 'Periods', value: totalRecords.toLocaleString(), icon: 'date_range', color: '#1976d2' },
          { label: 'Total Submissions', value: data.reduce((sum: number, r: any) => sum + (r.submissions || 0), 0).toLocaleString(), icon: 'description', color: '#2e7d32' },
          { label: 'Total Amount', value: '$' + data.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0).toLocaleString(), icon: 'attach_money', color: '#ed6c02' },
          { label: 'Total Approved', value: data.reduce((sum: number, r: any) => sum + (r.approved || 0), 0).toLocaleString(), icon: 'check_circle', color: '#9c27b0' }
        ];
      case 'project-status':
        return [
          { label: 'Total Projects', value: totalRecords.toLocaleString(), icon: 'folder', color: '#1976d2' },
          { label: 'Total Budget', value: '$' + data.reduce((sum: number, r: any) => sum + (r.budget || 0), 0).toLocaleString(), icon: 'account_balance', color: '#2e7d32' },
          { label: 'Total Cost', value: '$' + data.reduce((sum: number, r: any) => sum + (r.actualCost || 0), 0).toLocaleString(), icon: 'attach_money', color: '#ed6c02' },
          { label: 'Avg Completion', value: (totalRecords > 0 ? (data.reduce((sum: number, r: any) => sum + (+(r.completion) || 0), 0) / totalRecords).toFixed(0) : '0') + '%', icon: 'check_circle', color: '#9c27b0' }
        ];
      case 'project-budget':
        return [
          { label: 'Budget Lines', value: totalRecords.toLocaleString(), icon: 'receipt', color: '#1976d2' },
          { label: 'Total Estimated', value: '$' + data.reduce((sum: number, r: any) => sum + (r.estimated || 0), 0).toLocaleString(), icon: 'account_balance', color: '#2e7d32' },
          { label: 'Total Actual', value: '$' + data.reduce((sum: number, r: any) => sum + (r.actual || 0), 0).toLocaleString(), icon: 'attach_money', color: '#ed6c02' },
          { label: 'Total Variance', value: '$' + data.reduce((sum: number, r: any) => sum + (r.variance || 0), 0).toLocaleString(), icon: 'trending_up', color: '#9c27b0' }
        ];
      case 'project-tasks':
        return [
          { label: 'Total Tasks', value: totalRecords.toLocaleString(), icon: 'checklist', color: '#1976d2' },
          { label: 'Completed', value: data.filter((r: any) => r.status === 'COMPLETED').length.toLocaleString(), icon: 'check_circle', color: '#2e7d32' },
          { label: 'In Progress', value: data.filter((r: any) => r.status === 'IN_PROGRESS').length.toLocaleString(), icon: 'hourglass_empty', color: '#ed6c02' },
          { label: 'Overdue', value: data.filter((r: any) => r.overdue === 'Yes').length.toLocaleString(), icon: 'warning', color: '#d32f2f' }
        ];
      case 'project-risks-issues':
        return [
          { label: 'Total Items', value: totalRecords.toLocaleString(), icon: 'warning', color: '#1976d2' },
          { label: 'Risks', value: data.filter((r: any) => r.type === 'Risk').length.toLocaleString(), icon: 'report_problem', color: '#ed6c02' },
          { label: 'Issues', value: data.filter((r: any) => r.type === 'Issue').length.toLocaleString(), icon: 'bug_report', color: '#d32f2f' },
          { label: 'Open', value: data.filter((r: any) => r.status === 'OPEN').length.toLocaleString(), icon: 'lock_open', color: '#9c27b0' }
        ];
      default:
        return [
          { label: 'Total Records', value: totalRecords.toLocaleString(), icon: 'description', color: '#1976d2' },
          { label: 'Records Shown', value: Math.min(totalRecords, this.pageSize || 10).toLocaleString(), icon: 'table_chart', color: '#2e7d32' }
        ];
    }
  }

  formatParameters(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.parameters.startDate) {
      params['startDate'] = this.parameters.startDate.toISOString().split('T')[0];
    }
    if (this.parameters.endDate) {
      params['endDate'] = this.parameters.endDate.toISOString().split('T')[0];
    }
    if (this.parameters.approvedStartDate) {
      params['approvedStartDate'] = this.parameters.approvedStartDate.toISOString().split('T')[0];
    }
    if (this.parameters.approvedEndDate) {
      params['approvedEndDate'] = this.parameters.approvedEndDate.toISOString().split('T')[0];
    }
    if (this.parameters.status) {
      params['status'] = this.parameters.status;
    }
    if (this.parameters.workflowId) {
      params['workflowId'] = this.parameters.workflowId;
    }
    if (this.parameters.userId) {
      params['userId'] = this.parameters.userId;
    }
    if (this.parameters.corporateId) {
      params['corporateId'] = this.parameters.corporateId;
    }
    if (this.parameters.sbuId) {
      params['sbuId'] = this.parameters.sbuId;
    }
    if (this.parameters.branchId) {
      params['branchId'] = this.parameters.branchId;
    }
    if (this.parameters.departmentId) {
      params['departmentId'] = this.parameters.departmentId;
    }
    if (this.parameters.groupBy) {
      params['groupBy'] = this.parameters.groupBy;
    }
    if (this.parameters.leaveTypeId) {
      params['leaveTypeId'] = this.parameters.leaveTypeId;
    }
    if (this.parameters.year) {
      params['year'] = this.parameters.year;
    }
    if (this.parameters.categoryId) {
      params['categoryId'] = this.parameters.categoryId;
    }
    if (this.parameters.priority) {
      params['priority'] = this.parameters.priority;
    }
    return params;
  }

  updatePaginatedData() {
    if (!this.reportResult) return;
    const start = this.currentPage * this.pageSize;
    this.paginatedData = this.reportResult.data.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  sortData(sort: Sort) {
    if (!this.reportResult) return;

    const data = [...this.reportResult.data];
    if (!sort.active || sort.direction === '') {
      return;
    }

    data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return this.compare(a[sort.active], b[sort.active], isAsc);
    });

    this.reportResult.data = data;
    this.updatePaginatedData();
  }

  compare(a: any, b: any, isAsc: boolean): number {
    if (a == null) return isAsc ? 1 : -1;
    if (b == null) return isAsc ? -1 : 1;
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  exportReport(format: 'excel' | 'pdf' | 'csv') {
    if (!this.reportResult) {
      this.snackBar.open('Please run the report first', 'Close', { duration: 3000 });
      return;
    }

    this.exporting = true;
    this.snackBar.open(`Exporting to ${format.toUpperCase()}...`, '', { duration: 2000 });

    switch (format) {
      case 'excel':
        this.exportToExcel();
        break;
      case 'csv':
        this.exportToCsv();
        break;
      case 'pdf':
        this.exportToPdf();
        break;
    }
  }

  private exportToExcel() {
    // Create Excel-compatible XML
    const columns = this.reportResult!.columns;
    const data = this.reportResult!.data;

    let xml = '<?xml version="1.0"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '  <Worksheet ss:Name="Report">\n';
    xml += '    <Table>\n';

    // Header row
    xml += '      <Row>\n';
    columns.forEach(col => {
      xml += `        <Cell><Data ss:Type="String">${this.escapeXml(col.header)}</Data></Cell>\n`;
    });
    xml += '      </Row>\n';

    // Data rows
    data.forEach(row => {
      xml += '      <Row>\n';
      columns.forEach(col => {
        const value = row[col.field];
        const type = typeof value === 'number' ? 'Number' : 'String';
        xml += `        <Cell><Data ss:Type="${type}">${this.escapeXml(String(value ?? ''))}</Data></Cell>\n`;
      });
      xml += '      </Row>\n';
    });

    xml += '    </Table>\n';
    xml += '  </Worksheet>\n';
    xml += '</Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    this.downloadBlob(blob, `${this.report?.name || 'report'}.xls`);
    this.exporting = false;
    this.snackBar.open('Export completed', 'Close', { duration: 3000 });
  }

  private exportToCsv() {
    const columns = this.reportResult!.columns;
    const data = this.reportResult!.data;

    // Header
    let csv = columns.map(col => `"${col.header}"`).join(',') + '\n';

    // Data
    data.forEach(row => {
      csv += columns.map(col => {
        const value = row[col.field];
        if (value == null) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return `"${value}"`;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${this.report?.name || 'report'}.csv`);
    this.exporting = false;
    this.snackBar.open('Export completed', 'Close', { duration: 3000 });
  }

  private exportToPdf() {
    const columns = this.reportResult!.columns;
    const data = this.reportResult!.data;

    // Create HTML for PDF
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.report?.name || 'Report'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1976d2; font-size: 24px; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 20px; }
          .meta { color: #999; font-size: 12px; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th { background: #1976d2; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .summary { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .summary h3 { margin: 0 0 10px 0; color: #333; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 18px; font-weight: bold; color: #1976d2; }
          .summary-label { font-size: 11px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${this.report?.name || 'Report'}</h1>
        <p class="subtitle">${this.report?.description || ''}</p>
        <p class="meta">Generated: ${new Date().toLocaleString()} | Records: ${data.length}</p>

        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-grid">
            ${this.getSummaryItems().map(item => `
              <div class="summary-item">
                <div class="summary-value">${item.value}</div>
                <div class="summary-label">${item.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td>${this.formatCellValue(row[col.field], col.type)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    this.exporting = false;
    this.snackBar.open('PDF opened for printing', 'Close', { duration: 3000 });
  }

  private formatCellValue(value: any, type: string): string {
    if (value == null) return '';
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'currency':
        return '$' + Number(value).toLocaleString();
      case 'number':
        return Number(value).toLocaleString();
      case 'percentage':
        return Number(value).toFixed(1) + '%';
      default:
        return String(value);
    }
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
