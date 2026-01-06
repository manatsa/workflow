import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { WorkflowService } from '@core/services/workflow.service';
import { ThemeService } from '@core/services/theme.service';
import { Workflow } from '@core/models/workflow.model';
import { ProfileDialogComponent } from '@shared/components/profile-dialog/profile-dialog.component';
import { ChangePasswordDialogComponent } from '@shared/components/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule
  ],
  template: `
    <div class="layout-container">
      <aside class="sidebar" [class.collapsed]="!sidebarOpen">
        <div class="sidebar-header">
          <mat-icon>workflow</mat-icon>
          <span class="brand-text">Sonarworks</span>
        </div>

        <div class="user-profile">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-info">
            <div class="name">{{ fullName }}</div>
            <div class="role">{{ userType }}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a class="menu-item" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>

          <!-- System Admin -->
          @if (isAdmin) {
            <mat-expansion-panel class="nav-panel">
              <mat-expansion-panel-header>
                <mat-icon>admin_panel_settings</mat-icon>
                <span>System Admin</span>
              </mat-expansion-panel-header>
              <div class="submenu">
                <a class="menu-item" routerLink="/users" routerLinkActive="active">
                  <mat-icon>people</mat-icon>
                  <span>Users</span>
                </a>
                <a class="menu-item" routerLink="/roles" routerLinkActive="active">
                  <mat-icon>security</mat-icon>
                  <span>Roles</span>
                </a>
                <a class="menu-item" routerLink="/categories" routerLinkActive="active">
                  <mat-icon>category</mat-icon>
                  <span>Categories</span>
                </a>
                <a class="menu-item" routerLink="/corporates" routerLinkActive="active">
                  <mat-icon>corporate_fare</mat-icon>
                  <span>Corporates</span>
                </a>
                <a class="menu-item" routerLink="/sbus" routerLinkActive="active">
                  <mat-icon>business</mat-icon>
                  <span>SBU Management</span>
                </a>
                <a class="menu-item" routerLink="/branches" routerLinkActive="active">
                  <mat-icon>store</mat-icon>
                  <span>Branches</span>
                </a>
                <a class="menu-item" routerLink="/departments" routerLinkActive="active">
                  <mat-icon>account_tree</mat-icon>
                  <span>Departments</span>
                </a>
                <a class="menu-item" routerLink="/settings" routerLinkActive="active">
                  <mat-icon>settings</mat-icon>
                  <span>Settings</span>
                </a>
                <a class="menu-item" routerLink="/audit" routerLinkActive="active">
                  <mat-icon>history</mat-icon>
                  <span>Audit Logs</span>
                </a>
              </div>
            </mat-expansion-panel>
          }

          <!-- Workflow Admin -->
          @if (canBuildWorkflows) {
            <mat-expansion-panel class="nav-panel">
              <mat-expansion-panel-header>
                <mat-icon>build</mat-icon>
                <span>Workflow Admin</span>
              </mat-expansion-panel-header>
              <div class="submenu">
                <a class="menu-item" routerLink="/workflows" routerLinkActive="active">
                  <mat-icon>list</mat-icon>
                  <span>Manage Workflows</span>
                </a>
                @for (workflow of workflows; track workflow.id) {
                  <a class="menu-item" [routerLink]="['/workflows/builder', workflow.id]">
                    <mat-icon>edit</mat-icon>
                    <span>{{ workflow.name }}</span>
                  </a>
                }
              </div>
            </mat-expansion-panel>
          }

          <!-- Workflows -->
          <mat-expansion-panel class="nav-panel" [expanded]="true">
            <mat-expansion-panel-header>
              <mat-icon>folder</mat-icon>
              <span>Workflows</span>
            </mat-expansion-panel-header>
            <div class="submenu">
              @for (workflow of activeWorkflows; track workflow.id) {
                <a class="menu-item" [routerLink]="['/workflows', workflow.code, 'instances']">
                  <mat-icon>{{ workflow.icon || 'description' }}</mat-icon>
                  <span>{{ workflow.name }}</span>
                </a>
              }
            </div>
          </mat-expansion-panel>

          <a class="menu-item" routerLink="/approvals" routerLinkActive="active">
            <mat-icon [matBadge]="pendingApprovalsCount > 0 ? pendingApprovalsCount : null"
                      matBadgeColor="warn"
                      matBadgeSize="small"
                      [matBadgeHidden]="pendingApprovalsCount === 0">thumb_up</mat-icon>
            <span>Pending Approvals</span>
            @if (pendingApprovalsCount > 0) {
              <span class="badge-count">{{ pendingApprovalsCount }}</span>
            }
          </a>

          <a class="menu-item" routerLink="/my-submissions" routerLinkActive="active">
            <mat-icon [matBadge]="mySubmissionsCount > 0 ? mySubmissionsCount : null"
                      matBadgeColor="primary"
                      matBadgeSize="small"
                      [matBadgeHidden]="mySubmissionsCount === 0">send</mat-icon>
            <span>My Submissions</span>
            @if (mySubmissionsCount > 0) {
              <span class="badge-count primary">{{ mySubmissionsCount }}</span>
            }
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="version">v1.0.0</div>
          <div class="developer">Developed By: Sonar Microsystems</div>
          <div class="copyright">&copy; {{ currentYear }} All Rights Reserved</div>
        </div>
      </aside>

      <main class="main-content" [class.expanded]="!sidebarOpen">
        <header class="main-header">
          <div class="header-left">
            <button mat-icon-button (click)="toggleSidebar()">
              <mat-icon>menu</mat-icon>
            </button>
          </div>

          <div class="header-right">
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="openProfileDialog()">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item (click)="openChangePasswordDialog()">
                <mat-icon>lock</mat-icon>
                <span>Change Password</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout-container { display: flex; min-height: 100vh; }

    .sidebar {
      width: 260px;
      background: var(--sidebar-bg, #263238);
      color: var(--sidebar-text, white);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      z-index: 1000;
    }

    .sidebar-header {
      padding: 1rem;
      background: var(--sidebar-header-bg, #1e272c);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--user-profile-bg, #1e272c);
      color: var(--user-profile-text, white);
      border-bottom: 1px solid var(--menu-hover-bg, #37474f);
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-color, #1976d2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
    }

    .user-info .name { font-weight: 500; }
    .user-info .role { font-size: 0.75rem; opacity: 0.7; }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--sidebar-text, white);
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
    }

    .menu-item:hover { background: var(--menu-hover-bg, #37474f); }
    .menu-item.active { background: var(--menu-active-bg, #1976d2); }

    .nav-panel {
      background: transparent !important;
      box-shadow: none !important;
      color: var(--sidebar-text, white);
    }

    .nav-panel ::ng-deep .mat-expansion-panel-header {
      padding: 0 1rem;
      color: var(--sidebar-text, white);
    }

    .nav-panel ::ng-deep .mat-expansion-panel-body {
      padding: 0;
    }

    .submenu .menu-item {
      padding-left: 2.5rem;
      font-size: 0.875rem;
    }

    .badge-count {
      margin-left: auto;
      background: #f44336;
      color: white;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 500;
      min-width: 20px;
      text-align: center;
    }

    .badge-count.primary {
      background: #1976d2;
    }

    .sidebar-footer {
      padding: 1rem;
      text-align: center;
      border-top: 1px solid var(--menu-hover-bg, #37474f);
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .sidebar-footer .version {
      margin-bottom: 0.25rem;
    }

    .sidebar-footer .developer {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .sidebar-footer .copyright {
      opacity: 0.7;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
    }

    .main-header {
      background: var(--header-bg, white);
      color: var(--header-text, #333);
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-content {
      flex: 1;
      padding: 1.5rem;
      background: var(--body-bg, #f5f5f5);
    }

    /* Sidebar collapsed state */
    .sidebar {
      transition: transform 0.3s ease, width 0.3s ease;
    }

    .sidebar.collapsed {
      transform: translateX(-260px);
    }

    .main-content.expanded {
      margin-left: 0;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  workflows: Workflow[] = [];
  activeWorkflows: Workflow[] = [];
  sidebarOpen = true;
  pendingApprovalsCount = 0;
  mySubmissionsCount = 0;
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private workflowService: WorkflowService,
    private themeService: ThemeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.themeService.loadTheme();
    this.loadWorkflows();
    this.loadPendingApprovalsCount();
    this.loadMySubmissionsCount();
  }

  loadPendingApprovalsCount() {
    this.workflowService.getPendingApprovalsCount().subscribe({
      next: (res) => {
        if (res.success) {
          this.pendingApprovalsCount = res.data || 0;
        }
      },
      error: () => {
        this.pendingApprovalsCount = 0;
      }
    });
  }

  loadMySubmissionsCount() {
    this.workflowService.getMySubmissionsCount().subscribe({
      next: (res) => {
        if (res.success) {
          this.mySubmissionsCount = res.data || 0;
        }
      },
      error: () => {
        this.mySubmissionsCount = 0;
      }
    });
  }

  get fullName(): string {
    return this.authService.currentUser?.fullName || 'User';
  }

  get userInitials(): string {
    const name = this.fullName;
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  get userType(): string {
    return this.authService.currentUser?.userType || 'STAFF';
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ROLE_ADMIN') || this.authService.hasPrivilege('ADMIN');
  }

  get canBuildWorkflows(): boolean {
    return this.isAdmin || this.authService.hasPrivilege('WORKFLOW_BUILDER');
  }

  loadWorkflows() {
    this.workflowService.getWorkflows().subscribe(res => {
      if (res.success) {
        this.workflows = res.data;
      }
    });

    this.workflowService.getActiveWorkflows().subscribe(res => {
      if (res.success) {
        this.activeWorkflows = res.data;
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
  }

  openProfileDialog() {
    const user = this.authService.currentUser;
    if (user) {
      this.dialog.open(ProfileDialogComponent, {
        width: '600px',
        data: {
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          staffId: user.staffId,
          department: user.department,
          userType: user.userType,
          roles: user.roles || [],
          sbus: [],
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          isActive: true,
          isLocked: false
        }
      });
    }
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      disableClose: true
    });
  }
}
