import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FunctionDefinition, getFunctionDefinition, FUNCTION_DEFINITIONS } from '../../../core/data/function-definitions';

export interface FunctionHelpDialogData {
  functionName: string;
}

@Component({
  selector: 'app-function-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="function-help-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <h2 class="function-title">{{ fn?.name || functionName }}</h2>
          <span class="category-tag" [attr.data-category]="fn?.category?.toLowerCase()">{{ fn?.category }}</span>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        @if (fn) {
          <!-- Syntax Section -->
          <div class="section syntax-section">
            <label class="section-label">Syntax</label>
            <div class="syntax-block">
              <code class="syntax-code">{{ fn.syntax }}</code>
              <button mat-icon-button
                      (click)="copySyntax()"
                      class="copy-btn"
                      matTooltip="Copy syntax">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>

          <!-- Description Section -->
          <div class="section description-section">
            <label class="section-label">Description</label>
            <p class="description-text">{{ fn.description }}</p>
          </div>

          <!-- Explanation Section -->
          <div class="section explanation-section">
            <label class="section-label">How It Works</label>
            <p class="explanation-text">{{ fn.explanation }}</p>
          </div>

          <!-- Parameters Section -->
          @if (fn.parameters && fn.parameters.length > 0) {
            <div class="section parameters-section">
              <label class="section-label">Parameters</label>
              <div class="parameters-table">
                <div class="param-header">
                  <span class="param-name-col">Name</span>
                  <span class="param-type-col">Type</span>
                  <span class="param-desc-col">Description</span>
                  <span class="param-req-col">Required</span>
                </div>
                @for (param of fn.parameters; track param.name) {
                  <div class="param-row">
                    <span class="param-name-col"><code>{{ param.name }}</code></span>
                    <span class="param-type-col type-badge">{{ param.type }}</span>
                    <span class="param-desc-col">{{ param.description }}</span>
                    <span class="param-req-col">
                      @if (param.required) {
                        <mat-icon class="required-icon">check_circle</mat-icon>
                      } @else {
                        <mat-icon class="optional-icon">remove_circle_outline</mat-icon>
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Examples Section -->
          @if (fn.examples && fn.examples.length > 0) {
            <div class="section examples-section">
              <label class="section-label">Examples</label>
              <div class="examples-list">
                @for (example of fn.examples; track example.usage) {
                  <div class="example-item">
                    <div class="example-usage">
                      <code>{{ example.usage }}</code>
                      <button mat-icon-button
                              (click)="copyExample(example.usage)"
                              class="copy-example-btn"
                              matTooltip="Copy example">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                    <div class="example-result">
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <span class="result-value">{{ example.result }}</span>
                    </div>
                    @if (example.description) {
                      <div class="example-desc">{{ example.description }}</div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Tips Section -->
          @if (fn.tips && fn.tips.length > 0) {
            <div class="section tips-section">
              <label class="section-label">
                <mat-icon class="section-icon">lightbulb</mat-icon>
                Tips
              </label>
              <ul class="tips-list">
                @for (tip of fn.tips; track tip) {
                  <li>{{ tip }}</li>
                }
              </ul>
            </div>
          }

          <!-- Troubleshooting Section -->
          @if (fn.troubleshooting && fn.troubleshooting.length > 0) {
            <div class="section troubleshooting-section">
              <label class="section-label">
                <mat-icon class="section-icon">build</mat-icon>
                Troubleshooting
              </label>
              <ul class="troubleshooting-list">
                @for (issue of fn.troubleshooting; track issue) {
                  <li>{{ issue }}</li>
                }
              </ul>
            </div>
          }

          <!-- Related Functions Section -->
          @if (fn.relatedFunctions && fn.relatedFunctions.length > 0) {
            <div class="section related-section">
              <label class="section-label">Related Functions</label>
              <div class="related-chips">
                @for (rel of fn.relatedFunctions; track rel) {
                  <span class="related-chip" (click)="showRelated(rel)">{{ rel }}</span>
                }
              </div>
            </div>
          }
        } @else {
          <div class="not-found">
            <mat-icon class="not-found-icon">help_outline</mat-icon>
            <p>No detailed documentation available for this function.</p>
            <p class="function-name-display"><code>{{ functionName }}</code></p>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    :host {
      display: block;
      overflow: hidden !important;
      max-width: 100%;
    }

    .function-help-dialog {
      width: 100%;
      overflow: hidden !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .dialog-header {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      margin: 0;
      border-radius: 0;
      position: relative;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .function-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .close-btn {
      position: absolute;
      right: 12px;
      top: 8px;
      color: white;
    }

    .category-tag {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.2);
    }

    .category-tag[data-category="validation"] { background: #e91e63; }
    .category-tag[data-category="string"] { background: #9c27b0; }
    .category-tag[data-category="number"] { background: #2196f3; }
    .category-tag[data-category="date"] { background: #00bcd4; }
    .category-tag[data-category="boolean"] { background: #ff9800; }
    .category-tag[data-category="utility"] { background: #4caf50; }
    .category-tag[data-category="array"] { background: #795548; }

    .dialog-content {
      padding: 20px !important;
      max-height: 65vh;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .syntax-section {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .syntax-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #263238;
      border-radius: 6px;
      padding: 12px 16px;
    }

    .syntax-code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 1rem;
      color: #80cbc4;
    }

    .copy-btn {
      color: #b0bec5;
    }

    .copy-btn:hover {
      color: white;
    }

    .description-text, .explanation-text {
      margin: 0;
      line-height: 1.6;
      color: #424242;
    }

    .explanation-text {
      background: #fff8e1;
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 4px solid #ffc107;
    }

    .parameters-table {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }

    .param-header {
      display: grid;
      grid-template-columns: 100px 80px 1fr 80px;
      gap: 12px;
      padding: 10px 16px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #616161;
    }

    .param-row {
      display: grid;
      grid-template-columns: 100px 80px 1fr 80px;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      align-items: center;
    }

    .param-row:nth-child(odd) {
      background: #fafafa;
    }

    .param-name-col code {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #e3f2fd;
      padding: 2px 6px;
      border-radius: 4px;
      color: #1565c0;
    }

    .type-badge {
      font-size: 0.75rem;
      color: #7b1fa2;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .param-desc-col {
      font-size: 0.875rem;
      color: #616161;
    }

    .param-req-col {
      text-align: center;
    }

    .required-icon {
      color: #4caf50;
      font-size: 20px;
    }

    .optional-icon {
      color: #9e9e9e;
      font-size: 20px;
    }

    .examples-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .example-item {
      background: #f5f5f5;
      border-radius: 6px;
      padding: 12px 16px;
    }

    .example-usage {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .example-usage code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9rem;
      color: #263238;
      background: white;
      padding: 6px 10px;
      border-radius: 4px;
      flex: 1;
    }

    .copy-example-btn {
      color: #9e9e9e;
      transform: scale(0.85);
    }

    .example-result {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #616161;
    }

    .arrow-icon {
      font-size: 16px;
      color: #9e9e9e;
    }

    .result-value {
      font-family: 'Consolas', 'Monaco', monospace;
      color: #2e7d32;
      font-weight: 500;
    }

    .example-desc {
      margin-top: 8px;
      font-size: 0.8rem;
      color: #757575;
      font-style: italic;
    }

    .tips-section, .troubleshooting-section {
      background: #e8f5e9;
      padding: 16px;
      border-radius: 8px;
    }

    .troubleshooting-section {
      background: #fff3e0;
    }

    .tips-list, .troubleshooting-list {
      margin: 0;
      padding-left: 20px;
    }

    .tips-list li, .troubleshooting-list li {
      margin-bottom: 6px;
      line-height: 1.5;
      color: #424242;
    }

    .related-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .related-chip {
      padding: 6px 14px;
      background: #e3f2fd;
      border-radius: 16px;
      font-size: 0.875rem;
      color: #1565c0;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .related-chip:hover {
      background: #1976d2;
      color: white;
    }

    .not-found {
      text-align: center;
      padding: 40px 20px;
      color: #757575;
    }

    .not-found-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bdbdbd;
      margin-bottom: 16px;
    }

    .function-name-display code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 1.1rem;
      background: #f5f5f5;
      padding: 8px 16px;
      border-radius: 4px;
    }

    /* Dark mode support */
    :host-context(.dark-mode) .dialog-header {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      border-bottom-color: #424242;
    }

    :host-context(.dark-mode) .syntax-section {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .syntax-block {
      background: #1e1e1e;
    }

    :host-context(.dark-mode) .syntax-code {
      color: #4dd0e1;
    }

    :host-context(.dark-mode) .description-text,
    :host-context(.dark-mode) .explanation-text {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .explanation-text {
      background: #3d3d2d;
      border-left-color: #ffc107;
    }

    :host-context(.dark-mode) .parameters-table {
      border-color: #424242;
    }

    :host-context(.dark-mode) .param-header {
      background: #2d2d2d;
      color: #aaa;
    }

    :host-context(.dark-mode) .param-row {
      border-top-color: #424242;
    }

    :host-context(.dark-mode) .param-row:nth-child(odd) {
      background: #252525;
    }

    :host-context(.dark-mode) .param-name-col code {
      background: #1e3a5f;
      color: #64b5f6;
    }

    :host-context(.dark-mode) .type-badge {
      color: #ce93d8;
    }

    :host-context(.dark-mode) .param-desc-col {
      color: #b0b0b0;
    }

    :host-context(.dark-mode) .example-item {
      background: #2d2d2d;
    }

    :host-context(.dark-mode) .example-usage code {
      background: #1e1e1e;
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .example-result {
      color: #b0b0b0;
    }

    :host-context(.dark-mode) .result-value {
      color: #81c784;
    }

    :host-context(.dark-mode) .example-desc {
      color: #9e9e9e;
    }

    :host-context(.dark-mode) .tips-section {
      background: #2d3d2d;
    }

    :host-context(.dark-mode) .troubleshooting-section {
      background: #3d3020;
    }

    :host-context(.dark-mode) .tips-list li,
    :host-context(.dark-mode) .troubleshooting-list li {
      color: #e0e0e0;
    }

    :host-context(.dark-mode) .related-chip {
      background: #1e3a5f;
      color: #64b5f6;
    }

    :host-context(.dark-mode) .related-chip:hover {
      background: #1976d2;
      color: white;
    }

    :host-context(.dark-mode) .not-found {
      color: #9e9e9e;
    }

    :host-context(.dark-mode) .function-name-display code {
      background: #2d2d2d;
      color: #e0e0e0;
    }
  `]
})
export class FunctionHelpDialogComponent {
  fn: FunctionDefinition | undefined;
  functionName: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FunctionHelpDialogData,
    private dialogRef: MatDialogRef<FunctionHelpDialogComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.functionName = data.functionName;
    this.fn = getFunctionDefinition(this.extractFunctionName(data.functionName));
  }

  private extractFunctionName(name: string): string {
    // Extract function name from various formats like "NOW()", "IF(condition, then, else)"
    const match = name.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : name;
  }

  copySyntax(): void {
    if (this.fn?.syntax) {
      navigator.clipboard.writeText(this.fn.syntax).then(() => {
        this.snackBar.open('Syntax copied to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      });
    }
  }

  copyExample(usage: string): void {
    navigator.clipboard.writeText(usage).then(() => {
      this.snackBar.open('Example copied to clipboard', 'Close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  showRelated(functionName: string): void {
    // Close current dialog and open new one for related function
    this.dialogRef.close();
    this.dialog.open(FunctionHelpDialogComponent, {
      width: '720px',
      maxHeight: '85vh',
      panelClass: 'function-help-dialog-panel',
      data: { functionName }
    });
  }
}
