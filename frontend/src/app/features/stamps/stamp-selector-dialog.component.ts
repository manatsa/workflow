import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StampService, StampDTO } from './stamp.service';

@Component({
  selector: 'app-stamp-selector-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="selector-dialog">
      <div class="dialog-header">
        <h2>Select Approval Seal</h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>
      <mat-dialog-content>
        @if (loading) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else {
          <div class="stamp-grid">
            @for (stamp of stamps; track stamp.id) {
              <div class="stamp-card" [class.selected]="selectedId === stamp.id">
                <div class="stamp-svg" [innerHTML]="getSafeSvg(stamp)"></div>
                <div class="stamp-info">
                  <span class="stamp-name">{{ stamp.name }}</span>
                  <span class="stamp-desc">{{ stamp.description }}</span>
                </div>
                <button mat-stroked-button class="select-btn" [color]="selectedId === stamp.id ? 'primary' : undefined" (click)="selectAndClose(stamp)">
                  <mat-icon>{{ selectedId === stamp.id ? 'check_circle' : 'check' }}</mat-icon>
                  {{ selectedId === stamp.id ? 'Selected' : 'Select' }}
                </button>
              </div>
            }
          </div>
          @if (stamps.length === 0) {
            <p class="no-stamps">No active approval seals available.</p>
          }
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-button color="warn" (click)="clearSelection()">
          <mat-icon>clear</mat-icon> Clear Selection
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .selector-dialog { min-width: 720px; max-width: 900px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 0; }
    .dialog-header h2 { margin: 0; font-size: 20px; }
    .loading { display: flex; justify-content: center; padding: 40px; }
    .no-stamps { text-align: center; color: #999; padding: 40px; }

    .stamp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 12px 0; }

    .stamp-card {
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 12px 12px; border: 2px solid #e0e0e0; border-radius: 12px;
      transition: all 0.2s; background: #fafafa;
    }
    .stamp-card:hover { border-color: #90caf9; background: #f5f9ff; }
    .stamp-card.selected { border-color: #1565c0; background: #e3f2fd; box-shadow: 0 0 0 3px rgba(21,101,192,0.15); }

    .stamp-svg { width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; }
    .stamp-svg :deep(svg) { width: 100%; height: 100%; }

    .stamp-info { text-align: center; margin: 8px 0; }
    .stamp-name { display: block; font-size: 13px; font-weight: 600; color: #333; }
    .stamp-desc { display: block; font-size: 11px; color: #888; margin-top: 2px; }

    .select-btn { width: 100%; margin-top: 4px; }
  `]
})
export class StampSelectorDialogComponent implements OnInit {
  stamps: StampDTO[] = [];
  loading = true;
  selectedId: string | null = null;

  constructor(
    private stampService: StampService,
    private sanitizer: DomSanitizer,
    private dialogRef: MatDialogRef<StampSelectorDialogComponent>
  ) {}

  ngOnInit() {
    this.stampService.getActive().subscribe({
      next: (res: any) => {
        if (res.success) this.stamps = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getSafeSvg(stamp: StampDTO): SafeHtml {
    let svg = stamp.svgContent;
    if (stamp.stampColor) svg = svg.replace(/currentColor/g, stamp.stampColor);
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  selectAndClose(stamp: StampDTO) {
    this.selectedId = stamp.id!;
    this.dialogRef.close(stamp);
  }

  clearSelection() {
    this.dialogRef.close(null);
  }
}
