import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StampService, StampDTO } from './stamp.service';
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogType } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-stamp-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatChipsModule, MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="stamps-page">
      <div class="page-header">
        <div>
          <h1>Approval Seals</h1>
          <p class="subtitle">Manage approval seals with signature support</p>
        </div>
        <button mat-raised-button color="primary" (click)="openEditDialog(null)">
          <mat-icon>add</mat-icon> Add Custom Seal
        </button>
      </div>

      @if (loading) {
        <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="stamps-grid">
          @for (stamp of stamps; track stamp.id) {
            <mat-card class="stamp-card" [class.inactive]="!stamp.isActive">
              <div class="stamp-preview" [style.color]="stamp.stampColor">
                <div class="stamp-svg" [innerHTML]="getSafeSvg(stamp.svgContent, stamp.stampColor)"></div>
              </div>
              <mat-card-content>
                <div class="stamp-info">
                  <h3>{{ stamp.name }}</h3>
                  <p class="stamp-desc">{{ stamp.description || '' }}</p>
                  <div class="stamp-badges">
                    @if (stamp.isSystem) {
                      <span class="badge system">System</span>
                    }
                    <span class="badge signature-badge"><mat-icon class="badge-icon">gesture</mat-icon> Signature</span>
                    <span class="badge" [class.active]="stamp.isActive" [class.inactive-badge]="!stamp.isActive">
                      {{ stamp.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-icon-button matTooltip="Preview" (click)="previewStamp(stamp)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Edit" (click)="openEditDialog(stamp)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [matTooltip]="stamp.isActive ? 'Deactivate' : 'Activate'" (click)="toggleStatus(stamp)">
                  <mat-icon>{{ stamp.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (!stamp.isSystem) {
                  <button mat-icon-button matTooltip="Delete" color="warn" (click)="deleteStamp(stamp)">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>

        @if (stamps.length === 0) {
          <div class="empty-state">
            <mat-icon>verified</mat-icon>
            <h3>No approval seals found</h3>
            <p>System approval seals will be created automatically on first run.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .stamps-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }

    .stamps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

    .stamp-card { overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
    .stamp-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .stamp-card.inactive { opacity: 0.6; }

    .stamp-preview { display: flex; align-items: center; justify-content: center; padding: 24px 16px; background: #fafafa; border-bottom: 1px solid #eee; min-height: 140px; }
    .stamp-svg { width: 160px; height: 140px; display: flex; align-items: center; justify-content: center; }
    .stamp-svg :deep(svg) { width: 100%; height: 100%; }

    .stamp-info { padding: 8px 0; }
    .stamp-info h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
    .stamp-desc { color: #666; font-size: 12px; margin: 0 0 8px; line-height: 1.4; }

    .stamp-badges { display: flex; gap: 6px; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
    .badge.system { background: #e3f2fd; color: #1565c0; }
    .badge.signature-badge { background: #fce4ec; color: #c62828; display: flex; align-items: center; gap: 2px; }
    .badge-icon { font-size: 13px; width: 13px; height: 13px; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive-badge { background: #f5f5f5; color: #999; }

    mat-card-actions { display: flex; justify-content: flex-end; padding: 0 8px 8px; }

    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
    .empty-state h3 { color: #666; }
  `]
})
export class StampListComponent implements OnInit {
  stamps: StampDTO[] = [];
  loading = true;

  constructor(
    private stampService: StampService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() { this.loadStamps(); }

  loadStamps() {
    this.loading = true;
    this.stampService.getAll().subscribe({
      next: (res: any) => {
        if (res.success) this.stamps = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; this.snackBar.open('Failed to load stamps', 'Close', { duration: 3000 }); }
    });
  }

  getSafeSvg(svgContent: string, color?: string): SafeHtml {
    let svg = svgContent;
    if (color) {
      svg = svg.replace(/currentColor/g, color);
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  previewStamp(stamp: StampDTO) {
    this.dialog.open(StampPreviewDialogComponent, {
      width: '400px',
      data: stamp
    });
  }

  openEditDialog(stamp: StampDTO | null) {
    const dialogRef = this.dialog.open(StampEditDialogComponent, {
      width: '600px',
      data: stamp ? { ...stamp } : null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStamps();
    });
  }

  toggleStatus(stamp: StampDTO) {
    this.stampService.toggleStatus(stamp.id!).subscribe({
      next: () => { this.snackBar.open('Status updated', 'Close', { duration: 3000 }); this.loadStamps(); },
      error: () => this.snackBar.open('Failed to toggle status', 'Close', { duration: 3000 })
    });
  }

  deleteStamp(stamp: StampDTO) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Seal',
        message: `Are you sure you want to delete "${stamp.name}"?`,
        itemName: stamp.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        type: 'delete' as ConfirmDialogType
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.stampService.delete(stamp.id!).subscribe({
          next: () => { this.snackBar.open('Seal deleted', 'Close', { duration: 3000 }); this.loadStamps(); },
          error: (err: any) => this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 })
        });
      }
    });
  }
}

// Preview dialog
@Component({
  selector: 'app-stamp-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.name }}</h2>
    <mat-dialog-content>
      <div class="preview-container" [innerHTML]="safeSvg"></div>
      @if (data.description) {
        <p class="preview-desc">{{ data.description }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-container { display: flex; justify-content: center; padding: 24px; }
    .preview-container :deep(svg) { width: 250px; height: 250px; }
    .preview-desc { text-align: center; color: #666; font-size: 13px; }
  `]
})
export class StampPreviewDialogComponent {
  safeSvg: SafeHtml;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StampDTO,
    private sanitizer: DomSanitizer
  ) {
    let svg = data.svgContent;
    if (data.stampColor) svg = svg.replace(/currentColor/g, data.stampColor);
    this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}

// Edit dialog
@Component({
  selector: 'app-stamp-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Seal' : 'New Custom Seal' }}</h2>
    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="stamp.name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="stamp.description">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input matInput [(ngModel)]="stamp.stampColor" placeholder="#c62828">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Display Order</mat-label>
          <input matInput type="number" [(ngModel)]="stamp.displayOrder">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SVG Content</mat-label>
          <textarea matInput [(ngModel)]="stamp.svgContent" rows="6" placeholder="Paste SVG markup here"></textarea>
          <mat-hint>Paste raw SVG XML. Use 'currentColor' for dynamic color.</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving || !stamp.name || !stamp.svgContent">
        {{ isEdit ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-wrap: wrap; gap: 0 16px; }
    .full-width { width: 100%; }
    mat-form-field:not(.full-width) { width: calc(50% - 8px); }
  `]
})
export class StampEditDialogComponent {
  stamp: StampDTO;
  isEdit: boolean;
  saving = false;

  constructor(
    private stampService: StampService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<StampEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StampDTO | null
  ) {
    this.isEdit = !!data;
    this.stamp = data ? { ...data } : { name: '', svgContent: '', stampColor: '#c62828', displayOrder: 0 };
  }

  save() {
    this.saving = true;
    const req = this.isEdit
      ? this.stampService.update(this.data!.id!, this.stamp)
      : this.stampService.create(this.stamp);
    req.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.snackBar.open(this.isEdit ? 'Seal updated' : 'Seal created', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save', 'Close', { duration: 3000 });
      }
    });
  }
}
