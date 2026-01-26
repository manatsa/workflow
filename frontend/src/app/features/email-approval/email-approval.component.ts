import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface TokenValidationResponse {
  instanceId: string;
  referenceNumber: string;
  workflowName: string;
  initiatorName: string;
  approverEmail: string;
  approverName: string;
  actionType: string;
  currentLevel: number;
  requiresAuth: boolean;
}

// Inline Login Component - displays login form within the page (not as a modal)
@Component({
  selector: 'app-inline-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="inline-login">
      <div class="login-header">
        <mat-icon class="lock-icon">lock</mat-icon>
        <h2>Authentication Required</h2>
        <p>Please log in to {{ actionLabel }} this request</p>
      </div>

      <div class="login-error" *ngIf="loginError">
        <mat-icon>warning</mat-icon>
        <span>{{ loginError }}</span>
      </div>

      <div class="login-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput [(ngModel)]="username" placeholder="Enter your username"
                 (keyup.enter)="onLogin()" [disabled]="loading">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="password" placeholder="Enter your password"
                 (keyup.enter)="onLogin()" [disabled]="loading">
        </mat-form-field>

        <mat-form-field *ngIf="actionType === 'reject'" appearance="outline" class="full-width">
          <mat-label>Rejection Reason (Required)</mat-label>
          <textarea matInput [(ngModel)]="comments" rows="3"
                    placeholder="Enter reason for rejection..." [disabled]="loading"></textarea>
        </mat-form-field>

        <mat-form-field *ngIf="actionType === 'escalate'" appearance="outline" class="full-width">
          <mat-label>Escalation Reason (Optional)</mat-label>
          <textarea matInput [(ngModel)]="comments" rows="3"
                    placeholder="Enter reason for escalation..." [disabled]="loading"></textarea>
        </mat-form-field>
      </div>

      <div class="request-summary" *ngIf="requestInfo">
        <div class="summary-title">Request Details</div>
        <div class="detail-row">
          <span class="label">Workflow:</span>
          <span class="value">{{ requestInfo.workflowName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Reference:</span>
          <span class="value">{{ requestInfo.referenceNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Submitted by:</span>
          <span class="value">{{ requestInfo.initiatorName }}</span>
        </div>
      </div>

      <div class="login-actions">
        <button mat-raised-button [color]="getButtonColor()" (click)="onLogin()"
                [disabled]="loading || !username || !password || (actionType === 'reject' && !comments?.trim())">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!loading">{{ getActionIcon() }}</mat-icon>
          <span *ngIf="!loading">Login & {{ actionLabel | titlecase }}</span>
        </button>
        <button mat-button (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .inline-login {
      width: 100%;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .lock-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .login-header h2 {
      margin: 16px 0 8px;
      color: #333;
    }

    .login-header p {
      margin: 0;
      color: #666;
    }

    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .login-error mat-icon {
      color: #c62828;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }

    .request-summary {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .summary-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }

    .detail-row .label {
      color: #666;
    }

    .detail-row .value {
      color: #333;
      font-weight: 500;
    }

    .login-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }

    .login-actions button[mat-raised-button] {
      width: 100%;
      height: 48px;
    }

    .login-actions button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .login-actions button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class InlineLoginComponent {
  @Input() actionType: string = 'approve';
  @Input() actionLabel: string = 'approve';
  @Input() requestInfo: TokenValidationResponse | null = null;
  @Output() loginSuccess = new EventEmitter<{ comments: string }>();
  @Output() cancelled = new EventEmitter<void>();

  username = '';
  password = '';
  comments = '';
  loading = false;
  loginError: string | null = null;

  constructor(private authService: AuthService) {}

  onLogin(): void {
    if (!this.username || !this.password) {
      this.loginError = 'Please enter username and password';
      return;
    }

    if (this.actionType === 'reject' && !this.comments?.trim()) {
      this.loginError = 'Comments are required for rejection';
      return;
    }

    this.loading = true;
    this.loginError = null;

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.loginSuccess.emit({ comments: this.comments });
        } else {
          this.loginError = response.message || 'Login failed. Please check your credentials.';
        }
      },
      error: (err) => {
        this.loading = false;
        let errorMsg = 'Login failed. Please check your credentials.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          } else if (err.error.error) {
            errorMsg = err.error.error;
          }
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.loginError = errorMsg;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getButtonColor(): string {
    switch (this.actionType) {
      case 'approve': return 'primary';
      case 'reject': return 'warn';
      case 'escalate': return 'accent';
      default: return 'primary';
    }
  }

  getActionIcon(): string {
    switch (this.actionType) {
      case 'approve': return 'check_circle';
      case 'reject': return 'cancel';
      case 'escalate': return 'arrow_upward';
      case 'review': return 'visibility';
      default: return 'pending';
    }
  }
}

// Login Dialog Component (kept for backwards compatibility)
@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-dialog">
      <div class="dialog-header">
        <mat-icon class="lock-icon">lock</mat-icon>
        <h2>Authentication Required</h2>
        <p>Please log in to {{ data.actionLabel }} this request</p>
      </div>

      <div class="login-error" *ngIf="loginError">
        <mat-icon>warning</mat-icon>
        <span>{{ loginError }}</span>
      </div>

      <div class="login-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput [(ngModel)]="username" placeholder="Enter your username"
                 (keyup.enter)="onLogin()" [disabled]="loading">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="password" placeholder="Enter your password"
                 (keyup.enter)="onLogin()" [disabled]="loading">
        </mat-form-field>

        <mat-form-field *ngIf="data.actionType === 'reject'" appearance="outline" class="full-width">
          <mat-label>Rejection Reason (Required)</mat-label>
          <textarea matInput [(ngModel)]="comments" rows="3"
                    placeholder="Enter reason for rejection..." [disabled]="loading"></textarea>
        </mat-form-field>

        <mat-form-field *ngIf="data.actionType === 'escalate'" appearance="outline" class="full-width">
          <mat-label>Escalation Reason (Optional)</mat-label>
          <textarea matInput [(ngModel)]="comments" rows="3"
                    placeholder="Enter reason for escalation..." [disabled]="loading"></textarea>
        </mat-form-field>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="onCancel()" [disabled]="loading">Cancel</button>
        <button mat-raised-button color="primary" (click)="onLogin()"
                [disabled]="loading || !username || !password || (data.actionType === 'reject' && !comments?.trim())">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <span *ngIf="!loading">Login & {{ data.actionLabel | titlecase }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-dialog {
      padding: 24px;
      min-width: 350px;
    }

    .dialog-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .lock-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .dialog-header h2 {
      margin: 16px 0 8px;
      color: #333;
    }

    .dialog-header p {
      margin: 0;
      color: #666;
    }

    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .login-error mat-icon {
      color: #c62828;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .dialog-actions button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class LoginDialogComponent {
  username = '';
  password = '';
  comments = '';
  loading = false;
  loginError: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actionType: string; actionLabel: string },
    private authService: AuthService
  ) {}

  onLogin(): void {
    if (!this.username || !this.password) {
      this.loginError = 'Please enter username and password';
      return;
    }

    if (this.data.actionType === 'reject' && !this.comments?.trim()) {
      this.loginError = 'Comments are required for rejection';
      return;
    }

    this.loading = true;
    this.loginError = null;

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.dialogRef.close({ success: true, comments: this.comments });
        } else {
          this.loginError = response.message || 'Login failed. Please check your credentials.';
        }
      },
      error: (err) => {
        this.loading = false;
        // Extract error message from various response formats
        let errorMsg = 'Login failed. Please check your credentials.';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          } else if (err.error.error) {
            errorMsg = err.error.error;
          }
        } else if (err.message) {
          errorMsg = err.message;
        }
        this.loginError = errorMsg;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}

// Main Email Approval Component
@Component({
  selector: 'app-email-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    LoginDialogComponent,
    InlineLoginComponent
  ],
  template: `
    <div class="email-approval-container">
      <mat-card class="approval-card">
        <!-- Loading State -->
        <div *ngIf="loading" class="state-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="state-container error-state">
          <mat-icon class="status-icon error">error</mat-icon>
          <h2>Unable to Process Request</h2>
          <p>{{ error }}</p>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="retry()">
              Try Again
            </button>
            <button mat-raised-button (click)="goToDashboard()">
              Go to Dashboard
            </button>
          </div>
        </div>

        <!-- Inline Login State -->
        <div *ngIf="showInlineLogin && !loading && !error && !success">
          <app-inline-login
            [actionType]="actionType"
            [actionLabel]="getActionLabel()"
            [requestInfo]="requestInfo"
            (loginSuccess)="onInlineLoginSuccess($event)"
            (cancelled)="goToDashboard()">
          </app-inline-login>
        </div>

        <!-- Request Details State (waiting for action - only shown for reject when authenticated) -->
        <div *ngIf="requestInfo && !loading && !error && !success && !showInlineLogin && showCommentsForm" class="state-container">
          <mat-icon class="status-icon" [ngClass]="getActionIconClass()">{{ getActionIcon() }}</mat-icon>
          <h2>{{ getPageTitle() }}</h2>

          <div class="request-details">
            <div class="detail-row">
              <span class="label">Workflow:</span>
              <span class="value">{{ requestInfo.workflowName }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Reference:</span>
              <span class="value">{{ requestInfo.referenceNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Submitted by:</span>
              <span class="value">{{ requestInfo.initiatorName }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Approver:</span>
              <span class="value">{{ requestInfo.approverName }}</span>
            </div>
          </div>

          <!-- Comments field for reject action -->
          <mat-form-field *ngIf="actionType === 'reject'" appearance="outline" class="full-width comments-field">
            <mat-label>Rejection Reason (Required)</mat-label>
            <textarea matInput [(ngModel)]="comments" rows="3"
                      placeholder="Enter reason for rejection..."></textarea>
          </mat-form-field>

          <mat-form-field *ngIf="actionType === 'escalate'" appearance="outline" class="full-width comments-field">
            <mat-label>Escalation Reason (Optional)</mat-label>
            <textarea matInput [(ngModel)]="comments" rows="3"
                      placeholder="Enter reason for escalation..."></textarea>
          </mat-form-field>

          <div class="action-buttons">
            <button mat-raised-button [color]="getActionButtonColor()" (click)="processAction()"
                    [disabled]="actionType === 'reject' && !comments?.trim()">
              <mat-icon>{{ getActionIcon() }}</mat-icon>
              {{ getActionButtonLabel() }}
            </button>
            <button mat-raised-button (click)="goToDashboard()">
              Cancel
            </button>
          </div>
        </div>

        <!-- Success State -->
        <div *ngIf="success && !loading" class="state-container success-state">
          <mat-icon class="status-icon success">check_circle</mat-icon>
          <h2>{{ getSuccessTitle() }}</h2>
          <p>{{ getSuccessMessage() }}</p>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="viewSubmission()">
              View Submission
            </button>
            <button mat-raised-button (click)="goToDashboard()">
              Go to Dashboard
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .email-approval-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .approval-card {
      max-width: 500px;
      width: 100%;
      padding: 40px;
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
    }

    .status-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .status-icon.error { color: #f44336; }
    .status-icon.success { color: #4caf50; }
    .status-icon.approve { color: #4caf50; }
    .status-icon.reject { color: #f44336; }
    .status-icon.escalate { color: #ff9800; }
    .status-icon.review { color: #2196f3; }

    h2 {
      margin: 0;
      color: #333;
    }

    p {
      color: #666;
      margin: 0;
    }

    .request-details {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      margin: 16px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      color: #666;
      font-weight: 500;
    }

    .detail-row .value {
      color: #333;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 16px;
    }

    .action-buttons button mat-icon {
      margin-right: 8px;
    }

    mat-spinner {
      margin: 0 auto;
    }

    .full-width {
      width: 100%;
    }

    .comments-field {
      margin-top: 16px;
    }
  `]
})
export class EmailApprovalComponent implements OnInit {
  loading = true;
  loadingMessage = 'Validating your request...';
  error: string | null = null;
  token: string | null = null;
  actionType: string = 'view';
  requestInfo: TokenValidationResponse | null = null;
  success = false;
  comments = '';
  showInlineLogin = false;       // Show inline login form
  autoProcessTriggered = false;  // Prevent multiple auto-process attempts
  showCommentsForm = false;      // Show comments form for reject when authenticated

  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.actionType = (params['action'] || 'view').toLowerCase();

      if (!this.token) {
        this.error = 'No token provided';
        this.loading = false;
        return;
      }

      this.validateToken();
    });
  }

  validateToken(): void {
    this.loading = true;
    this.loadingMessage = 'Validating your request...';
    this.error = null;

    this.http.get<any>(`${this.apiUrl}/email-approval/validate?token=${this.token}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.requestInfo = response.data;
            // Attempt to auto-process the action
            this.attemptAutoProcess();
          } else {
            this.loading = false;
            this.error = response.message || 'Invalid or expired token';
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to validate token. It may be expired or already used.';
        }
      });
  }

  /**
   * Attempts to auto-process the action based on authentication state.
   * - For reject: always needs comments, so show form (inline login if not authenticated)
   * - For approve/escalate/review: auto-process if authenticated, show login if not
   */
  attemptAutoProcess(): void {
    if (this.autoProcessTriggered) return;
    this.autoProcessTriggered = true;

    // Reject always needs comments - show appropriate form
    if (this.actionType === 'reject') {
      this.loading = false;
      if (this.authService.isAuthenticated) {
        this.showCommentsForm = true;  // Show comments form only
      } else {
        this.showInlineLogin = true;   // Show inline login with comments
      }
      return;
    }

    // Escalate may need comments - show appropriate form
    if (this.actionType === 'escalate') {
      this.loading = false;
      if (this.authService.isAuthenticated) {
        this.showCommentsForm = true;  // Show escalate form
      } else {
        this.showInlineLogin = true;   // Show inline login
      }
      return;
    }

    // For approve/review: auto-process if authenticated
    if (this.authService.isAuthenticated) {
      this.processAction(); // Auto-process immediately
    } else {
      this.loading = false;
      this.showInlineLogin = true;
    }
  }

  /**
   * Handles successful inline login - triggers action processing
   */
  onInlineLoginSuccess(result: { comments: string }): void {
    this.comments = result.comments || '';
    this.showInlineLogin = false;
    this.loading = true;
    this.loadingMessage = `Processing your ${this.getActionLabel()}...`;
    this.processAction(); // Auto-trigger after login
  }

  handleAction(): void {
    // Check if user is logged in
    if (this.authService.isAuthenticated) {
      // User is logged in, process directly
      this.processAction();
    } else {
      // User needs to log in - open dialog
      this.openLoginDialog();
    }
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        actionType: this.actionType,
        actionLabel: this.getActionLabel()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.comments = result.comments || '';
        this.processAction();
      }
    });
  }

  processAction(): void {
    if (this.actionType === 'review') {
      this.processReview();
      return;
    }

    this.loading = true;
    this.loadingMessage = `Processing your ${this.getActionLabel()}...`;

    const params = new URLSearchParams();
    params.set('token', this.token!);
    params.set('action', this.actionType.toUpperCase());
    if (this.comments) {
      params.set('comments', this.comments);
    }

    this.http.post<any>(`${this.apiUrl}/email-approval/process?${params.toString()}`, {})
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.success = true;
          } else {
            this.error = response.message || 'Failed to process the request';
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'An unexpected error occurred. Please try again.';
        }
      });
  }

  processReview(): void {
    this.loading = true;
    this.loadingMessage = 'Opening submission details...';

    const params = new URLSearchParams();
    params.set('token', this.token!);
    params.set('action', 'REVIEW');

    this.http.post<any>(`${this.apiUrl}/email-approval/process?${params.toString()}`, {})
      .subscribe({
        next: () => {
          if (this.requestInfo?.instanceId) {
            this.router.navigate(['/approvals', this.requestInfo.instanceId]);
          } else {
            this.router.navigate(['/approvals']);
          }
        },
        error: () => {
          // Even if marking as reviewed fails, still redirect
          if (this.requestInfo?.instanceId) {
            this.router.navigate(['/approvals', this.requestInfo.instanceId]);
          } else {
            this.loading = false;
            this.error = 'Failed to process review';
          }
        }
      });
  }

  retry(): void {
    this.error = null;
    this.showInlineLogin = false;
    this.showCommentsForm = false;
    this.autoProcessTriggered = false;
    this.validateToken();
  }

  viewSubmission(): void {
    if (this.requestInfo?.instanceId) {
      this.router.navigate(['/approvals', this.requestInfo.instanceId]);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getActionLabel(): string {
    switch (this.actionType) {
      case 'approve': return 'approve';
      case 'reject': return 'reject';
      case 'escalate': return 'escalate';
      case 'review': return 'review';
      default: return 'process';
    }
  }

  getPageTitle(): string {
    switch (this.actionType) {
      case 'approve': return 'Approve Request';
      case 'reject': return 'Reject Request';
      case 'escalate': return 'Escalate Request';
      case 'review': return 'Review Request';
      default: return 'Process Request';
    }
  }

  getActionIcon(): string {
    switch (this.actionType) {
      case 'approve': return 'check_circle';
      case 'reject': return 'cancel';
      case 'escalate': return 'arrow_upward';
      case 'review': return 'visibility';
      default: return 'pending';
    }
  }

  getActionIconClass(): string {
    return this.actionType;
  }

  getActionButtonLabel(): string {
    switch (this.actionType) {
      case 'approve': return 'Approve';
      case 'reject': return 'Reject';
      case 'escalate': return 'Escalate';
      case 'review': return 'Review';
      default: return 'Process';
    }
  }

  getActionButtonColor(): string {
    switch (this.actionType) {
      case 'approve': return 'primary';
      case 'reject': return 'warn';
      case 'escalate': return 'accent';
      default: return 'primary';
    }
  }

  getSuccessTitle(): string {
    switch (this.actionType) {
      case 'approve': return 'Request Approved';
      case 'reject': return 'Request Rejected';
      case 'escalate': return 'Request Escalated';
      case 'review': return 'Reviewed';
      default: return 'Processed Successfully';
    }
  }

  getSuccessMessage(): string {
    switch (this.actionType) {
      case 'approve': return 'The request has been approved successfully.';
      case 'reject': return 'The request has been rejected.';
      case 'escalate': return 'The request has been escalated to the next level.';
      case 'review': return 'The request has been marked as reviewed.';
      default: return 'The request has been processed.';
    }
  }
}
