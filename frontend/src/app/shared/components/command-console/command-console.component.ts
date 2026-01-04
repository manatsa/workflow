import { Component, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SettingService } from '@core/services/setting.service';

@Component({
  selector: 'app-command-console',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="command-console">
      <div class="command-console-header">
        <span>Command Console</span>
        <button mat-icon-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="command-console-body" #consoleBody>
        @for (line of output; track $index) {
          <div [class]="line.type">{{ line.text }}</div>
        }
        <div class="input-line">
          <span class="prompt">></span>
          <input #commandInput type="text" class="command-console-input"
                 [(ngModel)]="command" (keydown.enter)="executeCommand()"
                 autofocus>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .command-console {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 800px;
      background: #1e1e1e;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 9999;
    }

    .command-console-header {
      padding: 0.75rem 1rem;
      background: #333;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
    }

    .command-console-body {
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
    }

    .output { color: #0f0; }
    .error { color: #f44; }
    .info { color: #0af; }
    .success { color: #4f4; }

    .input-line {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .prompt { color: #0f0; }

    .command-console-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #0f0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      outline: none;
    }
  `]
})
export class CommandConsoleComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('commandInput') commandInput!: ElementRef;
  @ViewChild('consoleBody') consoleBody!: ElementRef;

  command = '';
  output: { text: string; type: string }[] = [
    { text: 'Sonarworks Command Console', type: 'info' },
    { text: 'Type "help" for available commands', type: 'info' },
    { text: '', type: 'output' }
  ];

  constructor(private settingService: SettingService) {}

  ngAfterViewInit() {
    this.commandInput.nativeElement.focus();
  }

  executeCommand() {
    if (!this.command.trim()) return;

    this.output.push({ text: `> ${this.command}`, type: 'output' });

    this.settingService.executeCommand(this.command).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          response.data.output.forEach(line => {
            this.output.push({
              text: line,
              type: response.data.success ? 'success' : 'error'
            });
          });
        } else {
          this.output.push({
            text: response.message || 'Command failed',
            type: 'error'
          });
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.output.push({
          text: err.error?.message || 'Error executing command',
          type: 'error'
        });
        this.scrollToBottom();
      }
    });

    this.command = '';
  }

  private scrollToBottom() {
    setTimeout(() => {
      const body = this.consoleBody.nativeElement;
      body.scrollTop = body.scrollHeight;
    }, 100);
  }
}
