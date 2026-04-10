import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  selector: 'app-signature',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="signature-page">
      <div class="page-header">
        <div>
          <h1>My Signature</h1>
          <p class="subtitle">Capture and manage your digital signature</p>
        </div>
      </div>

      <div class="signature-layout">
        <!-- Current Signature -->
        <mat-card class="current-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="section-icon">draw</mat-icon>
            <mat-card-title>Current Signature</mat-card-title>
            <mat-card-subtitle>Your active signature used in approvals and documents</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (loadingCurrent) {
              <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
            } @else if (currentSignature) {
              <div class="signature-display">
                <img [src]="currentSignature.signatureData" alt="Current Signature" class="signature-image" />
                <div class="signature-meta">
                  <span>Captured: {{ currentSignature.capturedAt | date:'dd MMM yyyy HH:mm' }}</span>
                </div>
              </div>
            } @else {
              <div class="no-signature">
                <mat-icon>gesture</mat-icon>
                <p>No signature captured yet. Draw your signature below.</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Capture Pad -->
        <mat-card class="capture-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="section-icon capture-icon">edit</mat-icon>
            <mat-card-title>Capture New Signature</mat-card-title>
            <mat-card-subtitle>Draw your signature in the pad below using your mouse or touchscreen</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="canvas-container">
              <canvas #signatureCanvas
                      width="600" height="200"
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
          </mat-card-content>
        </mat-card>

        <!-- Signature History -->
        @if (signatures.length > 0) {
          <mat-card class="history-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="section-icon history-icon">history</mat-icon>
              <mat-card-title>Signature History</mat-card-title>
              <mat-card-subtitle>All previously captured signatures are retained</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="history-list">
                @for (sig of signatures; track sig.id; let i = $index) {
                  <div class="history-item" [class.current]="sig.isCurrent">
                    <div class="history-sig">
                      <img [src]="sig.signatureData" alt="Signature" class="history-image" />
                    </div>
                    <div class="history-meta">
                      <span class="history-date">{{ sig.capturedAt | date:'dd MMM yyyy HH:mm' }}</span>
                      @if (sig.isCurrent) {
                        <span class="current-badge">Current</span>
                      }
                    </div>
                  </div>
                  @if (i < signatures.length - 1) {
                    <mat-divider></mat-divider>
                  }
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .signature-page { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .subtitle { color: #666; margin: 4px 0 0; }

    .signature-layout { display: flex; flex-direction: column; gap: 24px; }

    .section-icon { display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #e3f2fd; color: #1565c0; }
    .capture-icon { background: #e8f5e9; color: #2e7d32; }
    .history-icon { background: #f5f5f5; color: #666; }

    .loading-container { display: flex; justify-content: center; padding: 32px; }

    .signature-display { text-align: center; padding: 16px; }
    .signature-image { max-width: 100%; max-height: 160px; border: 1px solid #e0e0e0; border-radius: 8px; background: white; padding: 8px; }
    .signature-meta { margin-top: 8px; }
    .signature-meta span { font-size: 13px; color: #999; }

    .no-signature { text-align: center; padding: 32px; }
    .no-signature mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .no-signature p { color: #999; margin-top: 8px; }

    .canvas-container { position: relative; border: 2px dashed #ccc; border-radius: 8px; margin: 8px 0 16px; background: white; display: flex; justify-content: center; }
    .canvas-container canvas { cursor: crosshair; border-radius: 6px; touch-action: none; }
    .canvas-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; color: #ccc; }
    .canvas-placeholder mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .canvas-placeholder span { font-size: 14px; margin-top: 4px; }

    .capture-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .capture-actions button mat-spinner { display: inline-block; margin-right: 4px; }

    .history-list { display: flex; flex-direction: column; }
    .history-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; }
    .history-item.current { background: #f8fdf8; border-radius: 8px; padding: 12px; }
    .history-sig { flex-shrink: 0; }
    .history-image { width: 200px; height: 60px; object-fit: contain; border: 1px solid #e0e0e0; border-radius: 4px; background: white; padding: 4px; }
    .history-meta { display: flex; flex-direction: column; gap: 4px; }
    .history-date { font-size: 13px; color: #666; }
    .current-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; width: fit-content; }
  `]
})
export class SignatureComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  hasDrawn = false;
  saving = false;
  loadingCurrent = true;

  currentSignature: UserSignatureDTO | null = null;
  signatures: UserSignatureDTO[] = [];

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSignatures();
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
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
      error: () => {
        this.loadingCurrent = false;
      }
    });
  }

  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    this.hasDrawn = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.isDrawing = true;
    this.hasDrawn = true;
    this.ctx.beginPath();
    this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  onTouchDraw(event: TouchEvent) {
    event.preventDefault();
    if (!this.isDrawing) return;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
  }

  clearCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw baseline
    this.ctx.save();
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(40, canvas.height - 40);
    this.ctx.lineTo(canvas.width - 40, canvas.height - 40);
    this.ctx.stroke();
    this.ctx.restore();
    // Reset stroke
    this.ctx.strokeStyle = '#1a1a2e';
    this.ctx.lineWidth = 2.5;
    this.ctx.setLineDash([]);
    this.hasDrawn = false;
  }

  saveSignature() {
    const canvas = this.canvasRef.nativeElement;
    const signatureData = canvas.toDataURL('image/png');

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
}
