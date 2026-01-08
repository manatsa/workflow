import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="email-approval-container">
      <mat-card class="approval-card">
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Validating your request...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="error-state">
          <mat-icon class="error-icon">error</mat-icon>
          <h2>Unable to Process Request</h2>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="goToLogin()">
            Go to Login
          </button>
        </div>

        <!-- Login Required State -->
        <div *ngIf="requiresLogin && !loading && !error" class="login-required">
          <mat-icon class="info-icon">lock</mat-icon>
          <h2>Authentication Required</h2>
          <p>Please log in to {{ actionType === 'approve' ? 'approve' : 'reject' }} this request.</p>

          <div class="request-info">
            <p><strong>Workflow:</strong> {{ requestInfo?.workflowName }}</p>
            <p><strong>Reference:</strong> {{ requestInfo?.referenceNumber }}</p>
            <p><strong>Submitted by:</strong> {{ requestInfo?.initiatorName }}</p>
          </div>

          <div class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" placeholder="Enter your username">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" placeholder="Enter your password"
                     (keyup.enter)="login()">
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="login()" [disabled]="loginLoading">
              <mat-spinner *ngIf="loginLoading" diameter="20"></mat-spinner>
              <span *ngIf="!loginLoading">Login & Continue</span>
            </button>
          </div>
        </div>

        <!-- Confirmation State -->
        <div *ngIf="showConfirmation && !loading && !error" class="confirmation-state">
          <mat-icon [class]="actionType === 'approve' ? 'approve-icon' : 'reject-icon'">
            {{ actionType === 'approve' ? 'check_circle' : 'cancel' }}
          </mat-icon>
          <h2>{{ actionType === 'approve' ? 'Approve' : 'Reject' }} Request</h2>

          <div class="request-info">
            <p><strong>Workflow:</strong> {{ requestInfo?.workflowName }}</p>
            <p><strong>Reference:</strong> {{ requestInfo?.referenceNumber }}</p>
            <p><strong>Submitted by:</strong> {{ requestInfo?.initiatorName }}</p>
          </div>

          <mat-form-field *ngIf="actionType === 'reject' || commentsMandatory" appearance="outline" class="full-width">
            <mat-label>Comments {{ actionType === 'reject' ? '(Required)' : '' }}</mat-label>
            <textarea matInput [(ngModel)]="comments" rows="3"
                      placeholder="Enter your comments..."></textarea>
          </mat-form-field>

          <div class="action-buttons">
            <button mat-raised-button (click)="cancel()">Cancel</button>
            <button mat-raised-button
                    [color]="actionType === 'approve' ? 'primary' : 'warn'"
                    (click)="processAction()"
                    [disabled]="processing || (actionType === 'reject' && !comments.trim())">
              <mat-spinner *ngIf="processing" diameter="20"></mat-spinner>
              <span *ngIf="!processing">
                {{ actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Success State -->
        <div *ngIf="success && !loading" class="success-state">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h2>{{ actionType === 'approve' ? 'Approved' : 'Rejected' }} Successfully</h2>
          <p>The request has been {{ actionType === 'approve' ? 'approved' : 'rejected' }}.</p>
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            Go to Dashboard
          </button>
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
      text-align: center;
    }

    .loading-state, .error-state, .login-required,
    .confirmation-state, .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .error-icon, .info-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .error-icon { color: #f44336; }
    .info-icon { color: #1976d2; }
    .approve-icon { color: #4caf50; font-size: 64px; width: 64px; height: 64px; }
    .reject-icon { color: #f44336; font-size: 64px; width: 64px; height: 64px; }
    .success-icon { color: #4caf50; font-size: 64px; width: 64px; height: 64px; }

    .request-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      width: 100%;
      text-align: left;
      margin: 16px 0;
    }

    .request-info p {
      margin: 8px 0;
    }

    .login-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 16px;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    p {
      color: #666;
      margin: 8px 0;
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class EmailApprovalComponent implements OnInit {
  loading = true;
  error: string | null = null;
  token: string | null = null;
  actionType: string = 'view';
  requestInfo: TokenValidationResponse | null = null;
  requiresLogin = false;
  showConfirmation = false;
  success = false;
  processing = false;
  loginLoading = false;
  commentsMandatory = false;

  username = '';
  password = '';
  comments = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.actionType = params['action'] || 'view';

      if (!this.token) {
        this.error = 'No token provided';
        this.loading = false;
        return;
      }

      this.validateToken();
    });
  }

  validateToken(): void {
    this.http.get<any>(`${this.apiUrl}/email-approval/validate?token=${this.token}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.requestInfo = response.data;
            this.loading = false;

            // Check if user is logged in
            if (this.authService.isAuthenticated) {
              this.showConfirmation = true;
            } else {
              this.requiresLogin = true;
            }
          } else {
            this.error = response.message || 'Invalid token';
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to validate token';
          this.loading = false;
        }
      });
  }

  login(): void {
    if (!this.username || !this.password) {
      this.snackBar.open('Please enter username and password', 'Close', { duration: 3000 });
      return;
    }

    this.loginLoading = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loginLoading = false;
        this.requiresLogin = false;
        this.showConfirmation = true;
      },
      error: (err) => {
        this.loginLoading = false;
        this.snackBar.open(err.error?.message || 'Login failed', 'Close', { duration: 3000 });
      }
    });
  }

  processAction(): void {
    if (this.actionType === 'reject' && !this.comments?.trim()) {
      this.snackBar.open('Comments are required for rejection', 'Close', { duration: 3000 });
      return;
    }

    this.processing = true;
    const params = new URLSearchParams();
    params.set('token', this.token!);
    params.set('action', this.actionType.toUpperCase());
    if (this.comments) {
      params.set('comments', this.comments);
    }

    this.http.post<any>(`${this.apiUrl}/email-approval/process?${params.toString()}`, {})
      .subscribe({
        next: (response) => {
          this.processing = false;
          if (response.success) {
            this.success = true;
            this.showConfirmation = false;
          } else {
            this.snackBar.open(response.message || 'Failed to process', 'Close', { duration: 3000 });
          }
        },
        error: (err) => {
          this.processing = false;
          this.snackBar.open(err.error?.message || 'Failed to process action', 'Close', { duration: 3000 });
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
