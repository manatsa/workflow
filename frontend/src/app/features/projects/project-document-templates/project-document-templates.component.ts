import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDocumentTemplateService, ProjectDocumentTemplateDTO } from '../services/project.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ProjectTemplateUploadDialogComponent } from './project-template-upload-dialog.component';

@Component({
  selector: 'app-project-document-templates',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatSnackBarModule, MatDialogModule, MatTooltipModule
  ],
  template: `
    <div class="templates-container">
      <div class="page-header">
        <h2>Document Templates</h2>
        <button mat-raised-button matTooltip="Upload Template" color="primary" (click)="openUploadDialog()">
          <mat-icon>add</mat-icon>
          Upload Template
        </button>
      </div>

      <mat-card>
        <table mat-table [dataSource]="templates" class="full-width" *ngIf="templates.length > 0">
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let tpl">{{ tpl.code || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let tpl">
              <div class="tpl-name">
                <mat-icon class="tpl-icon">{{ getFileIcon(tpl.contentType) }}</mat-icon>
                <div>
                  <strong>{{ tpl.name }}</strong>
                  <div class="tpl-desc" *ngIf="tpl.description">{{ tpl.description }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let tpl">
              <span class="chip">{{ tpl.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="fileName">
            <th mat-header-cell *matHeaderCellDef>File</th>
            <td mat-cell *matCellDef="let tpl">{{ tpl.fileName }}</td>
          </ng-container>
          <ng-container matColumnDef="fileSize">
            <th mat-header-cell *matHeaderCellDef>Size</th>
            <td mat-cell *matCellDef="let tpl">{{ tpl.fileSize ? formatFileSize(tpl.fileSize) : '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let tpl">{{ tpl.createdAt | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let tpl">
              <button mat-icon-button color="primary" (click)="downloadTemplate(tpl)" matTooltip="Download">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteTemplate(tpl)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <div *ngIf="templates.length === 0" class="empty-state">
          <mat-icon>file_copy</mat-icon>
          <p>No document templates yet. Upload one to get started.</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .templates-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { margin: 0; }
    .full-width { width: 100%; }
    .chip { padding: 4px 8px; border-radius: 12px; font-size: 12px; background: #e3f2fd; color: #1565c0; }
    .tpl-name { display: flex; align-items: center; gap: 12px; }
    .tpl-icon { color: #757575; }
    .tpl-desc { font-size: 12px; color: #999; margin-top: 2px; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class ProjectDocumentTemplatesComponent implements OnInit {
  templates: ProjectDocumentTemplateDTO[] = [];
  displayedColumns = ['code', 'name', 'category', 'fileName', 'fileSize', 'createdAt', 'actions'];

  constructor(
    private templateService: ProjectDocumentTemplateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.templateService.getAll().subscribe(res => {
      if (res.success) this.templates = res.data;
    });
  }

  openUploadDialog() {
    const dialogRef = this.dialog.open(ProjectTemplateUploadDialogComponent, {
      width: '550px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.loadTemplates();
      }
    });
  }

  downloadTemplate(tpl: ProjectDocumentTemplateDTO) {
    this.templateService.download(tpl.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tpl.fileName || tpl.name;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteTemplate(tpl: ProjectDocumentTemplateDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Template',
        message: 'Are you sure you want to delete this template?',
        itemName: tpl.name,
        type: 'delete'
      } as ConfirmDialogData,
      width: '420px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.templateService.delete(tpl.id).subscribe(res => {
          if (res.success) {
            this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
            this.loadTemplates();
          }
        });
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(contentType: string): string {
    if (!contentType) return 'insert_drive_file';
    if (contentType.includes('pdf')) return 'picture_as_pdf';
    if (contentType.includes('image')) return 'image';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'table_chart';
    if (contentType.includes('word') || contentType.includes('document')) return 'description';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'slideshow';
    if (contentType.includes('zip') || contentType.includes('archive')) return 'folder_zip';
    return 'insert_drive_file';
  }
}
