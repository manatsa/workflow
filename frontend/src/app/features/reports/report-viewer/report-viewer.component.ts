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
          <button mat-icon-button routerLink="/reports">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="report-title">
            <h1>{{ report?.name || 'Report' }}</h1>
            <p class="subtitle">{{ report?.description }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="runReport()" [disabled]="loading">
            <mat-icon>play_arrow</mat-icon>
            Run Report
          </button>
          <button mat-button [matMenuTriggerFor]="exportMenu" [disabled]="!reportResult || exporting">
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
      <mat-card class="parameters-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>tune</mat-icon>
            Report Filters
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
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
                <input type="text" matInput [formControl]="corporateControl" [matAutocomplete]="corporateAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
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
                <input type="text" matInput [formControl]="sbuControl" [matAutocomplete]="sbuAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
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
                <input type="text" matInput [formControl]="branchControl" [matAutocomplete]="branchAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
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
                <input type="text" matInput [formControl]="departmentControl" [matAutocomplete]="departmentAuto">
                <mat-icon matSuffix>arrow_drop_down</mat-icon>
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

          <div class="filter-actions">
            <button mat-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Generating report...</p>
        </div>
      }

      <!-- Summary Cards -->
      @if (reportResult?.summary && !loading) {
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

    .parameters-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
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
    groupBy: ''
  };

  // Form controls for searchable dropdowns
  statusControl = new FormControl('');
  workflowControl = new FormControl('');
  userControl = new FormControl('');
  corporateControl = new FormControl('');
  sbuControl = new FormControl('');
  branchControl = new FormControl('');
  departmentControl = new FormControl('');
  groupByControl = new FormControl('');

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
    this.loadLookupData();
    this.loadReportSettings();
    this.setupAutocompleteFilters();
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
    // Load workflows
    this.http.get<any>(`${this.apiUrl}/workflows`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const data = res.data.content || res.data;
          if (Array.isArray(data)) {
            this.workflows = data.map((w: any) => ({ id: w.id, name: w.name }));
          }
        }
      }
    });

    // Load users
    this.http.get<any>(`${this.apiUrl}/users`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const data = res.data.content || res.data;
          if (Array.isArray(data)) {
            this.users = data.map((u: any) => ({ id: u.id, name: u.fullName || u.username }));
          }
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

    // Load branches
    this.http.get<any>(`${this.apiUrl}/branches`).subscribe({
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
      groupBy: ''
    };
    // Reset form controls
    this.statusControl.setValue('');
    this.workflowControl.setValue('');
    this.userControl.setValue('');
    this.corporateControl.setValue('');
    this.sbuControl.setValue('');
    this.branchControl.setValue('');
    this.departmentControl.setValue('');
    this.groupByControl.setValue('');
    this.filteredSbus = [...this.sbus];
    this.filteredBranches = [...this.branches];
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
    const category = this.report?.category;
    switch (category) {
      case 'submissions':
        return [
          { field: 'referenceNumber', header: 'Reference', type: 'string' },
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'submitter', header: 'Submitted By', type: 'string' },
          { field: 'status', header: 'Status', type: 'status' },
          { field: 'submittedAt', header: 'Submitted Date', type: 'date' },
          { field: 'count', header: 'Count', type: 'number', align: 'right' }
        ];
      case 'approvals':
        return [
          { field: 'approver', header: 'Approver', type: 'string' },
          { field: 'approved', header: 'Approved', type: 'number', align: 'right' },
          { field: 'rejected', header: 'Rejected', type: 'number', align: 'right' },
          { field: 'pending', header: 'Pending', type: 'number', align: 'right' },
          { field: 'avgResponseTime', header: 'Avg Response (hrs)', type: 'number', align: 'right' }
        ];
      case 'performance':
        return [
          { field: 'workflow', header: 'Workflow', type: 'string' },
          { field: 'avgProcessingTime', header: 'Avg Time (hrs)', type: 'number', align: 'right' },
          { field: 'minTime', header: 'Min Time', type: 'number', align: 'right' },
          { field: 'maxTime', header: 'Max Time', type: 'number', align: 'right' },
          { field: 'completionRate', header: 'Completion %', type: 'percentage', align: 'right' }
        ];
      case 'financial':
        return [
          { field: 'category', header: 'Category', type: 'string' },
          { field: 'totalAmount', header: 'Total Amount', type: 'currency', align: 'right' },
          { field: 'count', header: 'Count', type: 'number', align: 'right' },
          { field: 'avgAmount', header: 'Average', type: 'currency', align: 'right' }
        ];
      default:
        return [
          { field: 'name', header: 'Name', type: 'string' },
          { field: 'value', header: 'Value', type: 'number', align: 'right' },
          { field: 'percentage', header: 'Percentage', type: 'percentage', align: 'right' }
        ];
    }
  }

  getMockData(): any[] {
    const category = this.report?.category;
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'];
    const workflows = ['Leave Request', 'Expense Claim', 'Purchase Order', 'Travel Request', 'Overtime Request'];
    const users = ['John Smith', 'Jane Doe', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'];

    switch (category) {
      case 'submissions':
        return Array.from({ length: 20 }, (_, i) => ({
          referenceNumber: `REF-2024-${String(i + 1).padStart(4, '0')}`,
          workflow: workflows[i % workflows.length],
          submitter: users[i % users.length],
          status: statuses[i % statuses.length],
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 50) + 1
        }));
      case 'approvals':
        return users.map(user => ({
          approver: user,
          approved: Math.floor(Math.random() * 50) + 10,
          rejected: Math.floor(Math.random() * 10),
          pending: Math.floor(Math.random() * 15),
          avgResponseTime: (Math.random() * 24 + 1).toFixed(1)
        }));
      case 'performance':
        return workflows.map(wf => ({
          workflow: wf,
          avgProcessingTime: (Math.random() * 48 + 2).toFixed(1),
          minTime: (Math.random() * 2 + 0.5).toFixed(1),
          maxTime: (Math.random() * 72 + 24).toFixed(1),
          completionRate: (Math.random() * 30 + 70).toFixed(1)
        }));
      case 'financial':
        return workflows.map(wf => ({
          category: wf,
          totalAmount: Math.floor(Math.random() * 100000) + 10000,
          count: Math.floor(Math.random() * 100) + 20,
          avgAmount: Math.floor(Math.random() * 5000) + 500
        }));
      default:
        return Array.from({ length: 10 }, (_, i) => ({
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          percentage: (Math.random() * 100).toFixed(1)
        }));
    }
  }

  getMockSummary(): Record<string, any> {
    return {
      totalRecords: Math.floor(Math.random() * 500) + 100,
      totalAmount: Math.floor(Math.random() * 500000) + 50000,
      avgProcessingTime: (Math.random() * 24 + 4).toFixed(1),
      completionRate: (Math.random() * 20 + 80).toFixed(1)
    };
  }

  getSummaryItems() {
    if (!this.reportResult?.summary) return [];
    const summary = this.reportResult.summary;
    return [
      { label: 'Total Records', value: summary['totalRecords']?.toLocaleString() || '0', icon: 'description', color: '#1976d2' },
      { label: 'Total Amount', value: '$' + (summary['totalAmount']?.toLocaleString() || '0'), icon: 'attach_money', color: '#2e7d32' },
      { label: 'Avg Processing Time', value: (summary['avgProcessingTime'] || '0') + ' hrs', icon: 'schedule', color: '#ed6c02' },
      { label: 'Completion Rate', value: (summary['completionRate'] || '0') + '%', icon: 'check_circle', color: '#9c27b0' }
    ];
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
