import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ProjectService, ProjectDocumentTemplateService, ProjectDTO, ProjectDocumentDTO, ProjectDocumentTemplateDTO } from '../services/project.service';

@Component({
  selector: 'app-project-documents',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatChipsModule, MatSnackBarModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, FormsModule, MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="documents-container" *ngIf="project">
      <div class="page-header">
        <button mat-icon-button matTooltip="Go Back" routerLink="/projects/{{project.id}}">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>Documents - {{ project.name }}</h2>
      </div>

      <!-- Upload Section -->
      <mat-card class="upload-card">
        <h3>Upload Document</h3>
        <div class="upload-zone"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.drag-over]="isDragOver"
             (click)="fileInput.click()">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <p *ngIf="!selectedFile">Drag & drop a file here or click to browse</p>
          <p *ngIf="selectedFile">{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</p>
          <input #fileInput type="file" hidden (change)="onFileSelected($event)">
        </div>
        <div class="upload-form" *ngIf="selectedFile">
          <mat-form-field appearance="outline">
            <mat-label>Document Name</mat-label>
            <input matInput [(ngModel)]="uploadName" [placeholder]="selectedFile.name">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="uploadCategory">
              <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat.replace('_', ' ') }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <input matInput [(ngModel)]="uploadDescription">
          </mat-form-field>
          <button mat-raised-button matTooltip="Upload" color="primary" (click)="uploadDocument()" [disabled]="uploading">
            <mat-icon>upload</mat-icon> Upload
          </button>
          <button mat-button matTooltip="Cancel" (click)="clearUpload()">Cancel</button>
        </div>
        <mat-progress-bar *ngIf="uploading" mode="indeterminate"></mat-progress-bar>
      </mat-card>

      <!-- Documents Table -->
      <mat-card>
        <table mat-table [dataSource]="documents" class="full-width" *ngIf="documents.length > 0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let doc">
              <div class="doc-name">
                <mat-icon class="doc-icon">{{ getFileIcon(doc.contentType) }}</mat-icon>
                {{ doc.name }}
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let doc">
              <span class="chip category-chip">{{ doc.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="fileSize">
            <th mat-header-cell *matHeaderCellDef>Size</th>
            <td mat-cell *matCellDef="let doc">{{ doc.fileSize ? formatFileSize(doc.fileSize) : '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="uploadedBy">
            <th mat-header-cell *matHeaderCellDef>Uploaded By</th>
            <td mat-cell *matCellDef="let doc">{{ doc.uploadedByName || '-' }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let doc">{{ doc.createdAt | date:'medium' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let doc">
              <button mat-icon-button color="primary" (click)="downloadDocument(doc)" matTooltip="Download"
                      *ngIf="doc.filePath">
                <mat-icon>download</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteDocument(doc.id)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <div *ngIf="documents.length === 0" class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <p>No documents uploaded yet.</p>
        </div>
      </mat-card>

      <!-- Document Templates -->
      <mat-card class="templates-card">
        <div class="section-header">
          <h3>Document Templates</h3>
          <button mat-button matTooltip="{{ showTemplates ? 'Hide' : 'Show' }} Templates" (click)="showTemplates = !showTemplates">
            <mat-icon>{{ showTemplates ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ showTemplates ? 'Hide' : 'Show' }} Templates
          </button>
        </div>
        <div *ngIf="showTemplates">
          <div *ngIf="templates.length === 0" class="empty-state small">
            <p>No templates available.</p>
          </div>
          <div class="template-grid" *ngIf="templates.length > 0">
            <div class="template-item" *ngFor="let tpl of templates">
              <mat-icon class="tpl-icon">{{ getFileIcon(tpl.contentType) }}</mat-icon>
              <div class="tpl-info">
                <strong>{{ tpl.name }}</strong>
                <span class="tpl-meta">{{ tpl.category }} · {{ tpl.fileSize ? formatFileSize(tpl.fileSize) : '' }}</span>
                <span class="tpl-desc" *ngIf="tpl.description">{{ tpl.description }}</span>
              </div>
              <button mat-icon-button color="primary" (click)="downloadTemplate(tpl)" matTooltip="Download Template">
                <mat-icon>download</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .documents-container { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .page-header h2 { margin: 0; }
    .upload-card { margin-bottom: 16px; padding: 16px; }
    .upload-card h3 { margin: 0 0 12px 0; }
    .upload-zone {
      border: 2px dashed #ccc; border-radius: 8px; padding: 32px;
      text-align: center; cursor: pointer; transition: all 0.2s;
      margin-bottom: 12px;
    }
    .upload-zone:hover, .upload-zone.drag-over { border-color: #1976d2; background: #e3f2fd; }
    .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #9e9e9e; }
    .upload-zone.drag-over .upload-icon { color: #1976d2; }
    .upload-form { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .upload-form mat-form-field { flex: 1; min-width: 180px; }
    .full-width { width: 100%; }
    .chip { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
    .category-chip { background: #e3f2fd; color: #1565c0; }
    .doc-name { display: flex; align-items: center; gap: 8px; }
    .doc-icon { font-size: 20px; width: 20px; height: 20px; color: #757575; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state.small { padding: 16px; }
    .templates-card { margin-top: 16px; padding: 16px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .section-header h3 { margin: 0; }
    .template-grid { display: flex; flex-direction: column; gap: 8px; }
    .template-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; background: #f5f5f5; }
    .tpl-icon { color: #757575; }
    .tpl-info { flex: 1; display: flex; flex-direction: column; }
    .tpl-meta { font-size: 12px; color: #999; }
    .tpl-desc { font-size: 12px; color: #666; margin-top: 2px; }
  `]
})
export class ProjectDocumentsComponent implements OnInit {
  project: ProjectDTO | null = null;
  documents: ProjectDocumentDTO[] = [];
  displayedColumns = ['name', 'category', 'fileSize', 'uploadedBy', 'date', 'actions'];
  categories = ['GENERAL', 'CONTRACT', 'SPECIFICATION', 'DESIGN', 'REPORT', 'MEETING_NOTES', 'DELIVERABLE', 'OTHER'];

  selectedFile: File | null = null;
  uploadName = '';
  uploadCategory = 'GENERAL';
  uploadDescription = '';
  uploading = false;
  isDragOver = false;
  templates: ProjectDocumentTemplateDTO[] = [];
  showTemplates = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private templateService: ProjectDocumentTemplateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectService.getProjectById(id).subscribe(res => {
        if (res.success) {
          this.project = res.data;
          this.loadDocuments();
        }
      });
    }
    this.templateService.getAll().subscribe(res => {
      if (res.success) this.templates = res.data;
    });
  }

  loadDocuments() {
    if (!this.project) return;
    this.projectService.getDocuments(this.project.id).subscribe(res => {
      if (res.success) this.documents = res.data;
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      if (!this.uploadName) this.uploadName = this.selectedFile.name;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      if (!this.uploadName) this.uploadName = this.selectedFile.name;
    }
  }

  uploadDocument() {
    if (!this.project || !this.selectedFile) return;
    this.uploading = true;
    this.projectService.uploadDocument(
      this.project.id, this.selectedFile, this.uploadName, this.uploadCategory, this.uploadDescription
    ).subscribe({
      next: res => {
        if (res.success) {
          this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
          this.clearUpload();
          this.loadDocuments();
        }
        this.uploading = false;
      },
      error: () => {
        this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
        this.uploading = false;
      }
    });
  }

  clearUpload() {
    this.selectedFile = null;
    this.uploadName = '';
    this.uploadCategory = 'GENERAL';
    this.uploadDescription = '';
  }

  downloadDocument(doc: ProjectDocumentDTO) {
    if (!this.project) return;
    this.projectService.downloadDocument(this.project.id, doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || doc.name;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteDocument(docId: string) {
    if (!this.project) return;
    this.projectService.deleteDocument(this.project.id, docId).subscribe(res => {
      if (res.success) {
        this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
        this.loadDocuments();
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
}
