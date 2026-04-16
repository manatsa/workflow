import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { WorkflowService } from '@core/services/workflow.service';
import { WorkflowType } from '@core/models/workflow.model';
import { WorkflowTypeEditDialogComponent } from '../workflow-type-edit-dialog/workflow-type-edit-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-workflow-type-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="list-container">
      <div class="header">
        <h1>Workflow Types</h1>
        <div class="header-actions">
          <button mat-raised-button matTooltip="Add new Workflow Type" color="primary" (click)="openAdd()">
            <mat-icon>add</mat-icon>
            Add Type
          </button>
        </div>
      </div>

      <div class="content-area">
        <mat-card class="table-card">
          <mat-card-content>
            <table mat-table [dataSource]="types" class="full-width">
              <ng-container matColumnDef="icon">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <mat-icon [style.color]="row.color || null">{{ row.icon || 'category' }}</mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Code</th>
                <td mat-cell *matCellDef="let row">{{ row.code }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let row">{{ row.description }}</td>
              </ng-container>

              <ng-container matColumnDef="displayOrder">
                <th mat-header-cell *matHeaderCellDef>Order</th>
                <td mat-cell *matCellDef="let row">{{ row.displayOrder }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [color]="row.isActive ? 'primary' : 'warn'" selected>
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button matTooltip="Actions" [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEdit(row)">
                      <mat-icon>edit</mat-icon> <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="toggleStatus(row)">
                      <mat-icon>{{ row.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                      <span>{{ row.isActive ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                    <button mat-menu-item (click)="remove(row)">
                      <mat-icon color="warn">delete</mat-icon> <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="openEdit(row)"></tr>
            </table>

            @if (types.length === 0) {
              <div class="no-data">
                <mat-icon>category</mat-icon>
                <p>No workflow types found. Add your first type.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .list-container { padding: 1rem; display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-shrink: 0; }
    .header-actions { display: flex; gap: 0.5rem; align-items: center; }
    .content-area { flex: 1; min-height: 0; }
    .table-card { width: 100%; height: 100%; }
    .full-width { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f0f4ff; }
    .no-data { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: #666; }
    .no-data mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
  `]
})
export class WorkflowTypeListComponent implements OnInit {
  types: WorkflowType[] = [];
  displayedColumns = ['icon', 'code', 'name', 'description', 'displayOrder', 'status', 'actions'];

  constructor(
    private workflowService: WorkflowService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.workflowService.getWorkflowTypes().subscribe(res => {
      if (res.success) {
        this.types = [...res.data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      }
    });
  }

  openAdd() {
    const dialogRef = this.dialog.open(WorkflowTypeEditDialogComponent, {
      data: { type: null },
      width: '550px',
      maxHeight: '85vh'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') this.load();
    });
  }

  openEdit(type: WorkflowType) {
    const dialogRef = this.dialog.open(WorkflowTypeEditDialogComponent, {
      data: { type },
      width: '550px',
      maxHeight: '85vh'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') this.load();
    });
  }

  toggleStatus(type: WorkflowType) {
    const updated = { ...type, isActive: !type.isActive };
    this.workflowService.updateWorkflowType(type.id, updated).subscribe({
      next: () => {
        this.snackBar.open(type.isActive ? 'Workflow type deactivated' : 'Workflow type activated', 'Close', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Operation failed', 'Close', { duration: 3000 });
      }
    });
  }

  remove(type: WorkflowType) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Workflow Type',
        message: 'Are you sure you want to delete this workflow type? This cannot be undone.',
        itemName: type.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.workflowService.deleteWorkflowType(type.id).subscribe({
          next: () => {
            this.snackBar.open('Workflow type deleted', 'Close', { duration: 3000 });
            this.load();
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
