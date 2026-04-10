import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';

interface UserSignatureDTO {
  id?: string;
  userId?: string;
  signatureData: string;
  isCurrent?: boolean;
  capturedAt?: string;
  ipAddress?: string;
}

@Component({
  selector: 'app-signature-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatTabsModule
  ],
  template: `
    <div class="sig-dialog">
      <div class="dialog-header">
        <div class="header-left">
          <mat-icon class="header-icon">draw</mat-icon>
          <div>
            <h2>My Signature</h2>
            <span class="header-sub">Capture and manage your digital signature</span>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content>
        <mat-tab-group>
          <!-- Current Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>gesture</mat-icon>&nbsp;Current
            </ng-template>
            <div class="tab-content">
              @if (loadingCurrent) {
                <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
              } @else if (currentSignature) {
                <div class="signature-display">
                  <div class="signature-image" [innerHTML]="getSafeSvg(currentSignature.signatureData)"></div>
                  <div class="signature-meta">
                    <span>Captured: {{ currentSignature.capturedAt | date:'dd MMM yyyy HH:mm' }}</span>
                  </div>
                </div>
              } @else {
                <div class="no-signature">
                  <mat-icon>gesture</mat-icon>
                  <p>No signature captured yet. Go to the "Capture" tab to draw your signature.</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Capture Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>edit</mat-icon>&nbsp;Capture
            </ng-template>
            <div class="tab-content">
              <p class="capture-hint">Draw your signature in the pad below using your mouse or touchscreen.</p>
              <div class="canvas-container">
                <canvas #signatureCanvas
                        width="560" height="180"
                        (mousedown)="startDrawing($event)"
                        (mousemove)="draw($event)"
                        (mouseup)="stopDrawing()"
                        (mouseleave)="stopDrawing()"
                        (touchstart)="onTouchStart($event)"
                        (touchmove)="onTouchDraw($event)"
                        (touchend)="stopDrawing()">
                </canvas>
                @if (!hasDrawn) {
                  <div class="canvas-placeholder">
                    <mat-icon>gesture</mat-icon>
                    <span>Draw your signature here</span>
                  </div>
                }
              </div>
              <div class="capture-actions">
                <button mat-stroked-button (click)="clearCanvas()" [disabled]="!hasDrawn">
                  <mat-icon>refresh</mat-icon> Clear
                </button>
                <button mat-raised-button color="primary" (click)="saveSignature()" [disabled]="!hasDrawn || saving">
                  @if (saving) { <mat-spinner diameter="20"></mat-spinner> }
                  <mat-icon>save</mat-icon> Save Signature
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- History Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>history</mat-icon>&nbsp;History
            </ng-template>
            <div class="tab-content">
              @if (signatures.length === 0) {
                <div class="no-signature">
                  <mat-icon>history</mat-icon>
                  <p>No signature history yet.</p>
                </div>
              } @else {
                <div class="history-list">
                  @for (sig of signatures; track sig.id; let i = $index) {
                    <div class="history-item" [class.current]="sig.isCurrent">
                      <div class="history-sig">
                        <div class="history-image" [innerHTML]="getSafeSvg(sig.signatureData)"></div>
                      </div>
                      <div class="history-meta">
                        <span class="history-date">{{ sig.capturedAt | date:'dd MMM yyyy HH:mm' }}</span>
                        @if (sig.isCurrent) {
                          <span class="current-badge">Current</span>
                        }
                      </div>
                    </div>
                    @if (i < signatures.length - 1) { <mat-divider></mat-divider> }
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .sig-dialog { width: 620px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 24px 8px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-icon { font-size: 28px; width: 28px; height: 28px; color: #1565c0; }
    .dialog-header h2 { margin: 0; font-size: 20px; font-weight: 500; }
    .header-sub { font-size: 13px; color: #666; }
    .close-btn { color: #999; }

    .tab-content { padding: 16px 0; min-height: 240px; }
    .capture-hint { color: #666; font-size: 13px; margin: 0 0 12px; }

    .loading-container { display: flex; justify-content: center; padding: 40px; }

    .signature-display { text-align: center; padding: 16px; }
    .signature-image { max-width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; background: white; padding: 8px; }
    .signature-image :deep(svg) { max-width: 100%; max-height: 150px; display: block; margin: 0 auto; }
    .signature-meta { margin-top: 8px; }
    .signature-meta span { font-size: 13px; color: #999; }

    .no-signature { text-align: center; padding: 40px; }
    .no-signature mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .no-signature p { color: #999; margin-top: 8px; }

    .canvas-container { position: relative; border: 2px dashed #ccc; border-radius: 8px; margin-bottom: 12px; background: white; display: flex; justify-content: center; }
    .canvas-container canvas { cursor: crosshair; border-radius: 6px; touch-action: none; }
    .canvas-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; color: #ccc; }
    .canvas-placeholder mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .canvas-placeholder span { font-size: 14px; margin-top: 4px; }

    .capture-actions { display: flex; gap: 12px; justify-content: flex-end; }

    .history-list { display: flex; flex-direction: column; max-height: 350px; overflow-y: auto; }
    .history-item { display: flex; align-items: center; gap: 16px; padding: 10px 0; }
    .history-item.current { background: #f8fdf8; border-radius: 8px; padding: 10px 8px; }
    .history-image { width: 180px; min-height: 40px; border: 1px solid #e0e0e0; border-radius: 4px; background: white; padding: 4px; }
    .history-image :deep(svg) { width: 100%; height: 50px; display: block; }
    .history-meta { display: flex; flex-direction: column; gap: 4px; }
    .history-date { font-size: 13px; color: #666; }
    .current-badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; width: fit-content; }
  `]
})
export class SignatureDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private canvasReady = false;
  private paths: string[][] = [];       // Array of path segments
  private currentPath: string[] = [];   // Current stroke path commands
  hasDrawn = false;
  saving = false;
  loadingCurrent = true;

  currentSignature: UserSignatureDTO | null = null;
  signatures: UserSignatureDTO[] = [];

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<SignatureDialogComponent>,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadSignatures();
  }

  ngAfterViewInit() {
    // Canvas may not be in DOM yet if tab is not active; init on first access
    setTimeout(() => this.initCanvas(), 300);
  }

  private initCanvas() {
    if (this.canvasReady || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.canvasReady = true;
    this.clearCanvas();
  }

  loadSignatures() {
    this.loadingCurrent = true;
    this.api.get('/signatures/me').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.signatures = res.data || [];
          this.currentSignature = this.signatures.find((s: any) => s.isCurrent) || null;
        }
        this.loadingCurrent = false;
      },
      error: () => { this.loadingCurrent = false; }
    });
  }

  startDrawing(event: MouseEvent) {
    this.initCanvas();
    this.isDrawing = true;
    this.hasDrawn = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.currentPath = [`M${x.toFixed(1)},${y.toFixed(1)}`];
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.currentPath.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }

  stopDrawing() {
    if (this.isDrawing && this.currentPath.length > 1) {
      this.paths.push([...this.currentPath]);
    }
    this.currentPath = [];
    this.isDrawing = false;
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.initCanvas();
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.isDrawing = true;
    this.hasDrawn = true;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.currentPath = [`M${x.toFixed(1)},${y.toFixed(1)}`];
  }

  onTouchDraw(event: TouchEvent) {
    event.preventDefault();
    if (!this.isDrawing) return;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.currentPath.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }

  clearCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(30, canvas.height - 30);
    this.ctx.lineTo(canvas.width - 30, canvas.height - 30);
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.setLineDash([]);
    this.paths = [];
    this.currentPath = [];
    this.hasDrawn = false;
  }

  private buildSvg(): string {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;
    let pathsStr = '';
    for (const p of this.paths) {
      pathsStr += `<path d="${p.join(' ')}" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${pathsStr}</svg>`;
  }

  saveSignature() {
    const signatureData = this.buildSvg();
    this.saving = true;
    this.api.post('/signatures/me', { signatureData }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.snackBar.open('Signature saved successfully', 'Close', { duration: 3000 });
          this.clearCanvas();
          this.loadSignatures();
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save signature', 'Close', { duration: 3000 });
      }
    });
  }

  getSafeSvg(data: string): SafeHtml {
    if (!data) return '';
    // Handle both SVG strings and legacy PNG data URIs
    if (data.startsWith('<svg') || data.startsWith('<?xml')) {
      return this.sanitizer.bypassSecurityTrustHtml(data);
    }
    // Legacy PNG data URI - render as img tag
    return this.sanitizer.bypassSecurityTrustHtml(`<img src="${data}" style="max-width:100%;max-height:150px;" alt="Signature"/>`);
  }
}
