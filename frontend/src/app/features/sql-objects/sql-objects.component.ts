import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { SqlObjectService } from '@core/services/sql-object.service';
import { SqlObject, SqlColumn, SqlColumnDataType } from '@core/models/workflow.model';

@Component({
  selector: 'app-sql-objects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    DragDropModule
  ],
  template: `
    <div class="sql-objects-container">
      <div class="header">
        <div class="header-content">
          <h1>
            <mat-icon>storage</mat-icon>
            SQL Objects
          </h1>
          <p class="subtitle">Manage custom data tables for dropdown options</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          New SQL Object
        </button>
      </div>

      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading SQL Objects...</p>
        </div>
      } @else {
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="sqlObjects" class="full-width">
              <ng-container matColumnDef="displayName">
                <th mat-header-cell *matHeaderCellDef>Display Name</th>
                <td mat-cell *matCellDef="let obj">
                  <div class="name-cell">
                    <mat-icon>table_chart</mat-icon>
                    <span>{{ obj.displayName }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="tableName">
                <th mat-header-cell *matHeaderCellDef>Table Name</th>
                <td mat-cell *matCellDef="let obj">
                  <code>sql_data_{{ obj.tableName }}</code>
                </td>
              </ng-container>

              <ng-container matColumnDef="columns">
                <th mat-header-cell *matHeaderCellDef>Columns</th>
                <td mat-cell *matCellDef="let obj">
                  <mat-chip-set>
                    @for (col of obj.columns?.slice(0, 3); track col.columnName) {
                      <mat-chip>{{ col.displayName }}</mat-chip>
                    }
                    @if (obj.columns?.length > 3) {
                      <mat-chip>+{{ obj.columns.length - 3 }} more</mat-chip>
                    }
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="optionsConfig">
                <th mat-header-cell *matHeaderCellDef>Options Config</th>
                <td mat-cell *matCellDef="let obj">
                  @if (obj.valueColumn && obj.labelColumn) {
                    <span class="config-info">
                      Value: <strong>{{ obj.valueColumn }}</strong>,
                      Label: <strong>{{ obj.labelColumn }}</strong>
                    </span>
                  } @else {
                    <span class="not-configured">Not configured</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let obj">
                  <span class="status-badge" [class.active]="obj.isActive" [class.inactive]="!obj.isActive">
                    {{ obj.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let obj">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="More actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openDataManager(obj)">
                      <mat-icon>table_rows</mat-icon>
                      <span>Manage Data</span>
                    </button>
                    <button mat-menu-item (click)="openEditDialog(obj)">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <mat-divider></mat-divider>
                    @if (obj.isActive) {
                      <button mat-menu-item (click)="deactivate(obj)">
                        <mat-icon>visibility_off</mat-icon>
                        <span>Deactivate</span>
                      </button>
                    } @else {
                      <button mat-menu-item (click)="activate(obj)">
                        <mat-icon>visibility</mat-icon>
                        <span>Activate</span>
                      </button>
                    }
                    <button mat-menu-item (click)="confirmDelete(obj)" [disabled]="obj.isSystem">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            @if (sqlObjects.length === 0) {
              <div class="empty-state">
                <mat-icon>storage</mat-icon>
                <h3>No SQL Objects</h3>
                <p>Create your first SQL Object to use as dropdown options in your workflows.</p>
                <button mat-raised-button color="primary" (click)="openCreateDialog()">
                  <mat-icon>add</mat-icon>
                  Create SQL Object
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- Create/Edit Dialog -->
      @if (showDialog) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog-container" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editingObject ? 'Edit SQL Object' : 'Create SQL Object' }}</h2>
              <button mat-icon-button (click)="closeDialog()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="dialog-content">
              <mat-tab-group>
                <mat-tab label="Basic Info">
                  <div class="tab-content">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Display Name</mat-label>
                      <input matInput [(ngModel)]="formData.displayName" placeholder="e.g., Countries">
                      <mat-hint>User-friendly name for this data table</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Table Name</mat-label>
                      <input matInput [(ngModel)]="formData.tableName" [disabled]="!!editingObject"
                             placeholder="e.g., countries" (input)="sanitizeTableName()">
                      <mat-hint>Database table name (lowercase, no spaces). Prefixed with sql_data_</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput [(ngModel)]="formData.description" rows="2"></textarea>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Value Column</mat-label>
                        <mat-select [(ngModel)]="formData.valueColumn">
                          <mat-option [value]="null">-- Select --</mat-option>
                          @for (col of formData.columns; track col.columnName) {
                            <mat-option [value]="col.columnName">{{ col.displayName }}</mat-option>
                          }
                        </mat-select>
                        <mat-hint>Column to use as option value</mat-hint>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Label Column</mat-label>
                        <mat-select [(ngModel)]="formData.labelColumn">
                          <mat-option [value]="null">-- Select --</mat-option>
                          @for (col of formData.columns; track col.columnName) {
                            <mat-option [value]="col.columnName">{{ col.displayName }}</mat-option>
                          }
                        </mat-select>
                        <mat-hint>Column to display as option label</mat-hint>
                      </mat-form-field>
                    </div>
                  </div>
                </mat-tab>

                <mat-tab label="Columns" [disabled]="!!editingObject">
                  <div class="tab-content">
                    <div class="columns-header">
                      <h3>Define Columns</h3>
                      <button mat-stroked-button color="primary" (click)="addColumn()">
                        <mat-icon>add</mat-icon>
                        Add Column
                      </button>
                    </div>

                    <div class="columns-list" cdkDropList (cdkDropListDropped)="dropColumn($event)">
                      @for (col of formData.columns; track col.columnName; let i = $index) {
                        <div class="column-item" cdkDrag>
                          <mat-icon cdkDragHandle class="drag-handle">drag_indicator</mat-icon>

                          <mat-form-field appearance="outline" class="col-field">
                            <mat-label>Column Name</mat-label>
                            <input matInput [(ngModel)]="col.columnName" (input)="sanitizeColumnName(col)">
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="col-field">
                            <mat-label>Display Name</mat-label>
                            <input matInput [(ngModel)]="col.displayName">
                          </mat-form-field>

                          <mat-form-field appearance="outline" class="col-field-small">
                            <mat-label>Type</mat-label>
                            <mat-select [(ngModel)]="col.dataType">
                              <mat-option value="VARCHAR">Text</mat-option>
                              <mat-option value="TEXT">Long Text</mat-option>
                              <mat-option value="INTEGER">Integer</mat-option>
                              <mat-option value="BIGINT">Big Integer</mat-option>
                              <mat-option value="DECIMAL">Decimal</mat-option>
                              <mat-option value="BOOLEAN">Boolean</mat-option>
                              <mat-option value="DATE">Date</mat-option>
                              <mat-option value="TIMESTAMP">Timestamp</mat-option>
                            </mat-select>
                          </mat-form-field>

                          @if (col.dataType === 'VARCHAR') {
                            <mat-form-field appearance="outline" class="col-field-tiny">
                              <mat-label>Length</mat-label>
                              <input matInput type="number" [(ngModel)]="col.columnLength">
                            </mat-form-field>
                          }

                          <mat-checkbox [(ngModel)]="col.isNullable">Nullable</mat-checkbox>

                          <button mat-icon-button color="warn" (click)="removeColumn(i)" matTooltip="Remove column">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>

                    @if (!formData.columns || formData.columns.length === 0) {
                      <div class="empty-columns">
                        <mat-icon>view_column</mat-icon>
                        <p>No columns defined. Add at least one column.</p>
                      </div>
                    }
                  </div>
                </mat-tab>
              </mat-tab-group>
            </div>

            <div class="dialog-actions">
              <button mat-button (click)="closeDialog()">Cancel</button>
              <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
                @if (saving) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  {{ editingObject ? 'Save Changes' : 'Create' }}
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Data Manager Dialog -->
      @if (showDataManager) {
        <div class="dialog-overlay" (click)="closeDataManager()">
          <div class="dialog-container data-manager" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>
                <mat-icon>table_rows</mat-icon>
                Manage Data: {{ selectedObject?.displayName }}
              </h2>
              <button mat-icon-button (click)="closeDataManager()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="dialog-content">
              <div class="data-toolbar">
                <button mat-raised-button color="primary" (click)="addRow()">
                  <mat-icon>add</mat-icon>
                  Add Row
                </button>
                <button mat-stroked-button (click)="refreshData()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              @if (loadingData) {
                <div class="loading">
                  <mat-spinner diameter="30"></mat-spinner>
                  <p>Loading data...</p>
                </div>
              } @else {
                <div class="data-table-container">
                  <table mat-table [dataSource]="tableData" class="full-width data-table">
                    <ng-container matColumnDef="id">
                      <th mat-header-cell *matHeaderCellDef>ID</th>
                      <td mat-cell *matCellDef="let row">{{ row.id }}</td>
                    </ng-container>

                    @for (col of selectedObject?.columns || []; track col.columnName) {
                      <ng-container [matColumnDef]="col.columnName">
                        <th mat-header-cell *matHeaderCellDef>{{ col.displayName }}</th>
                        <td mat-cell *matCellDef="let row">
                          @if (editingRowId === row.id) {
                            <input matInput [(ngModel)]="editingRowData[col.columnName]" class="inline-edit">
                          } @else {
                            {{ row[col.columnName] }}
                          }
                        </td>
                      </ng-container>
                    }

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let row">
                        @if (editingRowId === row.id) {
                          <button mat-icon-button color="primary" (click)="saveRow()" matTooltip="Save">
                            <mat-icon>check</mat-icon>
                          </button>
                          <button mat-icon-button (click)="cancelEditRow()" matTooltip="Cancel">
                            <mat-icon>close</mat-icon>
                          </button>
                        } @else {
                          <button mat-icon-button (click)="editRow(row)" matTooltip="Edit">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" (click)="deleteRow(row)" matTooltip="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="dataColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: dataColumns;"></tr>
                  </table>
                </div>

                @if (tableData.length === 0) {
                  <div class="empty-data">
                    <mat-icon>inbox</mat-icon>
                    <p>No data in this table. Add some rows to get started.</p>
                  </div>
                }
              }

              <!-- Add/Edit Row Form -->
              @if (showRowForm) {
                <div class="row-form">
                  <h4>{{ editingRowId ? 'Edit Row' : 'Add New Row' }}</h4>
                  <div class="row-fields">
                    @for (col of selectedObject?.columns || []; track col.columnName) {
                      <mat-form-field appearance="outline">
                        <mat-label>{{ col.displayName }}</mat-label>
                        @if (col.dataType === 'TEXT') {
                          <textarea matInput [(ngModel)]="newRowData[col.columnName]"></textarea>
                        } @else if (col.dataType === 'BOOLEAN') {
                          <mat-select [(ngModel)]="newRowData[col.columnName]">
                            <mat-option [value]="true">Yes</mat-option>
                            <mat-option [value]="false">No</mat-option>
                          </mat-select>
                        } @else if (col.dataType === 'INTEGER' || col.dataType === 'BIGINT' || col.dataType === 'DECIMAL') {
                          <input matInput type="number" [(ngModel)]="newRowData[col.columnName]">
                        } @else if (col.dataType === 'DATE') {
                          <input matInput type="date" [(ngModel)]="newRowData[col.columnName]">
                        } @else {
                          <input matInput [(ngModel)]="newRowData[col.columnName]">
                        }
                      </mat-form-field>
                    }
                  </div>
                  <div class="row-form-actions">
                    <button mat-button (click)="cancelRowForm()">Cancel</button>
                    <button mat-raised-button color="primary" (click)="saveNewRow()">
                      {{ editingRowId ? 'Update' : 'Add' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sql-objects-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .subtitle {
      margin: 0.25rem 0 0 0;
      color: #666;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #666;
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    code {
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85em;
    }

    .config-info {
      font-size: 0.85em;
      color: #666;
    }

    .not-configured {
      color: #999;
      font-style: italic;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.inactive {
      background: #fafafa;
      color: #999;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem 0;
    }

    /* Dialog styles */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-container {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-container.data-manager {
      max-width: 1000px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dialog-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #eee;
    }

    .tab-content {
      padding: 1.5rem 0;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    /* Columns section */
    .columns-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .columns-header h3 {
      margin: 0;
    }

    .column-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #fafafa;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .drag-handle {
      cursor: move;
      color: #999;
    }

    .col-field {
      flex: 1;
    }

    .col-field-small {
      width: 120px;
    }

    .col-field-tiny {
      width: 80px;
    }

    .empty-columns {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .empty-columns mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    /* Data manager */
    .data-toolbar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .data-table-container {
      overflow-x: auto;
    }

    .data-table {
      min-width: 600px;
    }

    .inline-edit {
      width: 100%;
      border: 1px solid #1976d2;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
    }

    .empty-data {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .row-form {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .row-form h4 {
      margin: 0 0 1rem 0;
    }

    .row-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .row-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class SqlObjectsComponent implements OnInit {
  sqlObjects: SqlObject[] = [];
  loading = false;
  saving = false;

  displayedColumns = ['displayName', 'tableName', 'columns', 'optionsConfig', 'status', 'actions'];

  // Dialog state
  showDialog = false;
  editingObject: SqlObject | null = null;
  formData: Partial<SqlObject> = this.getEmptyForm();

  // Data manager state
  showDataManager = false;
  selectedObject: SqlObject | null = null;
  tableData: any[] = [];
  dataColumns: string[] = [];
  loadingData = false;
  showRowForm = false;
  newRowData: any = {};
  editingRowId: number | null = null;
  editingRowData: any = {};

  constructor(
    private sqlObjectService: SqlObjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSqlObjects();
  }

  loadSqlObjects() {
    this.loading = true;
    this.sqlObjectService.getAllSqlObjects().subscribe({
      next: (objects) => {
        this.sqlObjects = objects;
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load SQL Objects', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getEmptyForm(): Partial<SqlObject> {
    return {
      displayName: '',
      tableName: '',
      description: '',
      valueColumn: '',
      labelColumn: '',
      columns: []
    };
  }

  openCreateDialog() {
    this.editingObject = null;
    this.formData = this.getEmptyForm();
    this.showDialog = true;
  }

  openEditDialog(obj: SqlObject) {
    this.editingObject = obj;
    this.formData = {
      displayName: obj.displayName,
      tableName: obj.tableName,
      description: obj.description,
      valueColumn: obj.valueColumn,
      labelColumn: obj.labelColumn,
      columns: [...(obj.columns || [])]
    };
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editingObject = null;
  }

  sanitizeTableName() {
    if (this.formData.tableName) {
      this.formData.tableName = this.formData.tableName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^[0-9]/, '_$&')
        .replace(/__+/g, '_');
    }
  }

  sanitizeColumnName(col: SqlColumn) {
    if (col.columnName) {
      col.columnName = col.columnName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^[0-9]/, '_$&')
        .replace(/__+/g, '_');
    }
  }

  addColumn() {
    if (!this.formData.columns) {
      this.formData.columns = [];
    }
    this.formData.columns.push({
      columnName: '',
      displayName: '',
      dataType: SqlColumnDataType.VARCHAR,
      columnLength: 255,
      isNullable: true,
      isPrimaryKey: false,
      displayOrder: this.formData.columns.length
    });
  }

  removeColumn(index: number) {
    this.formData.columns?.splice(index, 1);
  }

  dropColumn(event: CdkDragDrop<SqlColumn[]>) {
    if (this.formData.columns) {
      moveItemInArray(this.formData.columns, event.previousIndex, event.currentIndex);
      this.formData.columns.forEach((col, i) => col.displayOrder = i);
    }
  }

  save() {
    if (!this.formData.displayName || !this.formData.tableName) {
      this.snackBar.open('Please fill in required fields', 'Close', { duration: 3000 });
      return;
    }

    if (!this.editingObject && (!this.formData.columns || this.formData.columns.length === 0)) {
      this.snackBar.open('Please add at least one column', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;

    if (this.editingObject) {
      this.sqlObjectService.updateSqlObject(this.editingObject.id, this.formData).subscribe({
        next: () => {
          this.snackBar.open('SQL Object updated', 'Close', { duration: 3000 });
          this.closeDialog();
          this.loadSqlObjects();
          this.saving = false;
        },
        error: (err) => {
          this.snackBar.open('Failed to update SQL Object', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.sqlObjectService.createSqlObject(this.formData).subscribe({
        next: () => {
          this.snackBar.open('SQL Object created', 'Close', { duration: 3000 });
          this.closeDialog();
          this.loadSqlObjects();
          this.saving = false;
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to create SQL Object', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  activate(obj: SqlObject) {
    this.sqlObjectService.activateSqlObject(obj.id).subscribe({
      next: () => {
        this.snackBar.open('SQL Object activated', 'Close', { duration: 3000 });
        this.loadSqlObjects();
      },
      error: () => {
        this.snackBar.open('Failed to activate', 'Close', { duration: 3000 });
      }
    });
  }

  deactivate(obj: SqlObject) {
    this.sqlObjectService.deactivateSqlObject(obj.id).subscribe({
      next: () => {
        this.snackBar.open('SQL Object deactivated', 'Close', { duration: 3000 });
        this.loadSqlObjects();
      },
      error: () => {
        this.snackBar.open('Failed to deactivate', 'Close', { duration: 3000 });
      }
    });
  }

  confirmDelete(obj: SqlObject) {
    if (confirm(`Are you sure you want to delete "${obj.displayName}"? This will also delete all data in the table.`)) {
      this.sqlObjectService.deleteSqlObject(obj.id).subscribe({
        next: () => {
          this.snackBar.open('SQL Object deleted', 'Close', { duration: 3000 });
          this.loadSqlObjects();
        },
        error: () => {
          this.snackBar.open('Failed to delete', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Data Manager methods
  openDataManager(obj: SqlObject) {
    this.selectedObject = obj;
    this.showDataManager = true;
    this.dataColumns = ['id', ...(obj.columns?.map(c => c.columnName) || []), 'actions'];
    this.refreshData();
  }

  closeDataManager() {
    this.showDataManager = false;
    this.selectedObject = null;
    this.tableData = [];
    this.showRowForm = false;
    this.editingRowId = null;
  }

  refreshData() {
    if (!this.selectedObject) return;
    this.loadingData = true;
    this.sqlObjectService.getTableData(this.selectedObject.id).subscribe({
      next: (data) => {
        this.tableData = data;
        this.loadingData = false;
      },
      error: () => {
        this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
        this.loadingData = false;
      }
    });
  }

  addRow() {
    this.showRowForm = true;
    this.editingRowId = null;
    this.newRowData = {};
  }

  editRow(row: any) {
    this.editingRowId = row.id;
    this.editingRowData = { ...row };
  }

  cancelEditRow() {
    this.editingRowId = null;
    this.editingRowData = {};
  }

  saveRow() {
    if (!this.selectedObject || !this.editingRowId) return;
    this.sqlObjectService.updateTableRow(this.selectedObject.id, this.editingRowId, this.editingRowData).subscribe({
      next: () => {
        this.snackBar.open('Row updated', 'Close', { duration: 3000 });
        this.editingRowId = null;
        this.refreshData();
      },
      error: () => {
        this.snackBar.open('Failed to update row', 'Close', { duration: 3000 });
      }
    });
  }

  cancelRowForm() {
    this.showRowForm = false;
    this.newRowData = {};
  }

  saveNewRow() {
    if (!this.selectedObject) return;
    this.sqlObjectService.addTableRow(this.selectedObject.id, this.newRowData).subscribe({
      next: () => {
        this.snackBar.open('Row added', 'Close', { duration: 3000 });
        this.showRowForm = false;
        this.newRowData = {};
        this.refreshData();
      },
      error: () => {
        this.snackBar.open('Failed to add row', 'Close', { duration: 3000 });
      }
    });
  }

  deleteRow(row: any) {
    if (!this.selectedObject) return;
    if (confirm('Are you sure you want to delete this row?')) {
      this.sqlObjectService.deleteTableRow(this.selectedObject.id, row.id).subscribe({
        next: () => {
          this.snackBar.open('Row deleted', 'Close', { duration: 3000 });
          this.refreshData();
        },
        error: () => {
          this.snackBar.open('Failed to delete row', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
