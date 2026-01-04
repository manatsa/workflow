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
import { AuthService } from '@core/services/auth.service';
import { WorkflowService } from '@core/services/workflow.service';
import { Workflow } from '@core/models/workflow.model';

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
    MatExpansionModule
  ],
  template: `
    <div class="layout-container">
      <aside class="sidebar">
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
                <a class="menu-item" routerLink="/sbus" routerLinkActive="active">
                  <mat-icon>business</mat-icon>
                  <span>SBU Management</span>
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
            <mat-icon>thumb_up</mat-icon>
            <span>Pending Approvals</span>
          </a>

          <a class="menu-item" routerLink="/my-submissions" routerLinkActive="active">
            <mat-icon>send</mat-icon>
            <span>My Submissions</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <small>v1.0.0</small>
        </div>
      </aside>

      <main class="main-content">
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
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item routerLink="/change-password">
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
      background: #263238;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 1000;
    }

    .sidebar-header {
      padding: 1rem;
      background: #1e272c;
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
      background: #1e272c;
      border-bottom: 1px solid #37474f;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1976d2;
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
      color: white;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
    }

    .menu-item:hover { background: #37474f; }
    .menu-item.active { background: #1976d2; }

    .nav-panel {
      background: transparent !important;
      box-shadow: none !important;
      color: white;
    }

    .nav-panel ::ng-deep .mat-expansion-panel-header {
      padding: 0 1rem;
      color: white;
    }

    .nav-panel ::ng-deep .mat-expansion-panel-body {
      padding: 0;
    }

    .submenu .menu-item {
      padding-left: 2.5rem;
      font-size: 0.875rem;
    }

    .sidebar-footer {
      padding: 1rem;
      text-align: center;
      border-top: 1px solid #37474f;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-header {
      background: white;
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-content {
      flex: 1;
      padding: 1.5rem;
      background: #f5f5f5;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  workflows: Workflow[] = [];
  activeWorkflows: Workflow[] = [];

  constructor(
    private authService: AuthService,
    private workflowService: WorkflowService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWorkflows();
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
    // Toggle sidebar for mobile
  }

  logout() {
    this.authService.logout();
  }
}
