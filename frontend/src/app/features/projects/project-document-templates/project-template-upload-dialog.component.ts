import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDocumentTemplateService } from '../services/project.service';

@Component({
  selector: 'app-project-template-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>upload_file</mat-icon>
        Upload Document Template
      </h2>
      <button mat-icon-button matTooltip="Close" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="uploadCode" placeholder="e.g. TPL-001" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Template Name</mat-label>
          <input matInput [(ngModel)]="uploadName" placeholder="Template name" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="uploadCategory">
            <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat.replace('_', ' ') }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="uploadDescription" rows="2" placeholder="Optional description"></textarea>
        </mat-form-field>
      </div>

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

      <mat-progress-bar *ngIf="uploading" mode="indeterminate"></mat-progress-bar>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button matTooltip="Cancel" (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!selectedFile || !uploadCode?.trim() || !uploadName?.trim() || uploading" (click)="upload()">
        <mat-icon>upload</mat-icon>
        Upload
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    mat-dialog-content {
      min-width: 450px;
    }

    .upload-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 16px;
    }

    .upload-zone:hover, .upload-zone.drag-over {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #9e9e9e;
    }

    .upload-zone.drag-over .upload-icon { color: #1976d2; }

    .full-width {
      width: 100%;
      margin-bottom: 0.25rem;
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  `]
})
export class ProjectTemplateUploadDialogComponent {
  categories = ['GENERAL', 'CONTRACT', 'SPECIFICATION', 'DESIGN', 'REPORT', 'MEETING_NOTES', 'DELIVERABLE', 'OTHER'];

  selectedFile: File | null = null;
  uploadCode = '';
  uploadName = '';
  uploadCategory = 'GENERAL';
  uploadDescription = '';
  uploading = false;
  isDragOver = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ProjectTemplateUploadDialogComponent>,
    private templateService: ProjectDocumentTemplateService,
    private snackBar: MatSnackBar
  ) {}

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

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.templateService.upload(this.selectedFile, this.uploadCode, this.uploadName, this.uploadDescription, this.uploadCategory).subscribe({
      next: res => {
        this.uploading = false;
        if (res.success) {
          this.snackBar.open('Template uploaded successfully', 'Close', { duration: 3000 });
          this.dialogRef.close('saved');
        }
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Upload failed', 'Close', { duration: 3000 });
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

  close() {
    this.dialogRef.close();
  }
}
