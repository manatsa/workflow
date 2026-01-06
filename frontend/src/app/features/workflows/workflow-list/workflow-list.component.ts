import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow } from '@core/models/workflow.model';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="workflow-list-container">
      <div class="header">
        <h1>Workflow Management</h1>
        <div class="header-actions">
          <input type="file" #fileInput accept=".json" (change)="onFileSelected($event)" style="display: none">
          <button mat-stroked-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon>
            Import Workflow
          </button>
          <button mat-raised-button color="primary" routerLink="/workflows/builder/new">
            <mat-icon>add</mat-icon>
            Create Workflow
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="table-toolbar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search workflows</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup)="applyFilter()"
                     placeholder="Search by name or code">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            <ng-container matColumnDef="icon">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let workflow">
                <mat-icon class="workflow-icon">{{ workflow.icon || 'description' }}</mat-icon>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let workflow">
                <div class="workflow-info">
                  <strong>{{ workflow.name }}</strong>
                  <span class="code">{{ workflow.code }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let workflow">
                {{ workflow.description | slice:0:100 }}{{ workflow.description?.length > 100 ? '...' : '' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
              <td mat-cell *matCellDef="let workflow">
                <mat-chip>{{ workflow.workflowTypeName || 'General' }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="approvers">
              <th mat-header-cell *matHeaderCellDef>Approvers</th>
              <td mat-cell *matCellDef="let workflow">
                {{ workflow.approvers?.length || 0 }} levels
              </td>
            </ng-container>

            <ng-container matColumnDef="published">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Published</th>
              <td mat-cell *matCellDef="let workflow">
                <mat-slide-toggle [checked]="workflow.isPublished"
                                  (change)="togglePublished(workflow, $event.checked)"
                                  color="primary">
                  {{ workflow.isPublished ? 'Published' : 'Draft' }}
                </mat-slide-toggle>
              </td>
            </ng-container>

            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let workflow">
                <mat-slide-toggle [checked]="workflow.isActive"
                                  (change)="toggleActive(workflow, $event.checked)">
                  {{ workflow.isActive ? 'Active' : 'Inactive' }}
                </mat-slide-toggle>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let workflow">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/workflows/builder', workflow.id]">
                    <mat-icon>build</mat-icon>
                    <span>Edit Builder</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/workflows', workflow.code, 'instances']">
                    <mat-icon>list</mat-icon>
                    <span>View Instances</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/workflows', workflow.code, 'new']">
                    <mat-icon>add</mat-icon>
                    <span>New Submission</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="duplicateWorkflow(workflow)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Duplicate</span>
                  </button>
                  <button mat-menu-item (click)="exportWorkflow(workflow)">
                    <mat-icon>download</mat-icon>
                    <span>Export</span>
                  </button>
                  <button mat-menu-item (click)="deleteWorkflow(workflow)" class="delete-action">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50]"
                         showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .workflow-list-container { padding: 1rem; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .table-toolbar {
      margin-bottom: 1rem;
    }

    .search-field {
      width: 400px;
    }

    .data-table {
      width: 100%;
    }

    .workflow-icon {
      color: #1976d2;
    }

    .workflow-info {
      display: flex;
      flex-direction: column;
    }

    .workflow-info .code {
      font-size: 0.75rem;
      color: #666;
    }

    .delete-action {
      color: #c62828;
    }
  `]
})
export class WorkflowListComponent implements OnInit {
  displayedColumns = ['icon', 'name', 'description', 'type', 'approvers', 'published', 'active', 'actions'];
  dataSource = new MatTableDataSource<Workflow>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private workflowService: WorkflowService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadWorkflows() {
    this.workflowService.getWorkflows().subscribe(res => {
      if (res.success) {
        this.dataSource.data = res.data;
      }
    });
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  toggleActive(workflow: Workflow, active: boolean) {
    this.workflowService.toggleWorkflowActive(workflow.id, active).subscribe(res => {
      if (res.success) {
        workflow.isActive = active;
        this.snackBar.open(
          `Workflow ${active ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  togglePublished(workflow: Workflow, published: boolean) {
    const action = published
      ? this.workflowService.publishWorkflow(workflow.id)
      : this.workflowService.unpublishWorkflow(workflow.id);

    action.subscribe(res => {
      if (res.success) {
        workflow.isPublished = published;
        this.snackBar.open(
          `Workflow ${published ? 'published' : 'unpublished'} successfully`,
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  duplicateWorkflow(workflow: Workflow) {
    this.workflowService.duplicateWorkflow(workflow.id).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Workflow duplicated successfully', 'Close', { duration: 3000 });
        this.loadWorkflows();
      }
    });
  }

  exportWorkflow(workflow: Workflow) {
    this.workflowService.exportWorkflow(workflow.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.code}_workflow.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.workflowService.importWorkflow(file).subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Workflow imported successfully', 'Close', { duration: 3000 });
            this.loadWorkflows();
          } else {
            this.snackBar.open(res.message || 'Failed to import workflow', 'Close', { duration: 5000 });
          }
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to import workflow';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
      input.value = '';
    }
  }

  deleteWorkflow(workflow: Workflow) {
    if (confirm(`Are you sure you want to delete the workflow "${workflow.name}"?`)) {
      this.workflowService.deleteWorkflow(workflow.id).subscribe(res => {
        if (res.success) {
          this.snackBar.open('Workflow deleted successfully', 'Close', { duration: 3000 });
          this.loadWorkflows();
        }
      });
    }
  }
}
