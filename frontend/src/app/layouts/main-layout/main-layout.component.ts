import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { WorkflowService } from '@core/services/workflow.service';
import { ThemeService } from '@core/services/theme.service';
import { ReportService } from '@core/services/report.service';
import { SettingService } from '@core/services/setting.service';
import { DeadlineService } from '../../features/deadlines/services/deadline.service';
import { LeaveService } from '../../features/leave/services/leave.service';
import { Workflow } from '@core/models/workflow.model';
import { ProfileDialogComponent } from '@shared/components/profile-dialog/profile-dialog.component';
import { SignatureDialogComponent } from '../../features/signature/signature-dialog.component';
import { ChangePasswordDialogComponent } from '@shared/components/change-password-dialog/change-password-dialog.component';

interface ReportCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  reports: { id: string; name: string; icon: string }[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  animations: [
    trigger('footerExpand', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden',
        padding: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'hidden'
      })),
      transition('collapsed <=> expanded', [
        animate('200ms ease-in-out')
      ])
    ])
  ],
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
    MatDialogModule,
    MatTooltipModule],
  template: `
    <div class="layout-container">
      <aside class="sidebar" [class.collapsed]="!sidebarOpen" [class.mobile]="isMobile">
        <div class="sidebar-header">
          <img [src]="logoUrl" alt="Sona" class="brand-logo" (error)="logoUrl = 'assets/logo.png'">
          <span class="brand-name">Sona</span>
        </div>

        <div class="user-profile">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-info">
            <div class="name">{{ fullName }}</div>
            <div class="role">{{ userType }}</div>
          </div>
        </div>

        <nav class="sidebar-nav" (click)="onNavClick($event)">
          <a class="menu-item" routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Home</span>
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
                  <span>Roles And Privileges</span>
                </a>
                <a class="menu-item" routerLink="/categories" routerLinkActive="active">
                  <mat-icon>category</mat-icon>
                  <span>Categories</span>
                </a>
                <a class="menu-item" routerLink="/workflow-types" routerLinkActive="active">
                  <mat-icon>schema</mat-icon>
                  <span>Workflow Types</span>
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
                <a class="menu-item" routerLink="/stamps" routerLinkActive="active">
                  <mat-icon>verified</mat-icon>
                  <span>Approval Seals</span>
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
          @if (canBuildWorkflows && workflowModuleEnabled) {
            <mat-expansion-panel class="nav-panel">
              <mat-expansion-panel-header>
                <mat-icon>build</mat-icon>
                <span>Workflow Admin</span>
              </mat-expansion-panel-header>
              <div class="submenu">
                <a class="menu-item" routerLink="/sql-objects" routerLinkActive="active">
                  <mat-icon>storage</mat-icon>
                  <span>SQL Objects</span>
                </a>
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
          @if (workflowModuleEnabled) {
            <mat-expansion-panel class="nav-panel">
              <mat-expansion-panel-header>
                <mat-icon>timeline</mat-icon>
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
          }

          @if (leaveModuleEnabled) {
          <mat-expansion-panel class="nav-panel">
            <mat-expansion-panel-header>
              <mat-icon>beach_access</mat-icon>
              <span>Leave Management</span>
              @if (leavePendingApprovalsCount > 0) {
                <span class="sidebar-badge badge-leave-approvals" matTooltip="Pending approvals">{{ leavePendingApprovalsCount }}</span>
              }
              @if (leaveMyPendingCount > 0) {
                <span class="sidebar-badge badge-leave-pending" matTooltip="My pending requests">{{ leaveMyPendingCount }}</span>
              }
              @if (leaveApprovedUpcomingCount > 0) {
                <span class="sidebar-badge badge-leave-upcoming" matTooltip="Approved upcoming leave">{{ leaveApprovedUpcomingCount }}</span>
              }
            </mat-expansion-panel-header>
            <div class="submenu">
              <a class="menu-item" routerLink="/leave" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a class="menu-item" routerLink="/leave/requests" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <mat-icon>list_alt</mat-icon>
                <span>My Requests</span>
                @if (leaveMyPendingCount > 0) {
                  <span class="badge-count leave-pending">{{ leaveMyPendingCount }}</span>
                }
              </a>
              <a class="menu-item" routerLink="/leave/approvals" routerLinkActive="active">
                <mat-icon>thumb_up</mat-icon>
                <span>Approvals</span>
                @if (leavePendingApprovalsCount > 0) {
                  <span class="badge-count leave-approvals">{{ leavePendingApprovalsCount }}</span>
                }
              </a>
              <a class="menu-item" routerLink="/leave/calendar" routerLinkActive="active">
                <mat-icon>calendar_month</mat-icon>
                <span>Team Calendar</span>
              </a>
              @if (isAdmin) {
              <a class="menu-item" routerLink="/leave/approver-config" routerLinkActive="active">
                <mat-icon>approval</mat-icon>
                <span>Approval Chains</span>
              </a>
              <a class="menu-item" routerLink="/leave/balances" routerLinkActive="active">
                <mat-icon>account_balance</mat-icon>
                <span>Balances</span>
              </a>
              <a class="menu-item" routerLink="/leave/types" routerLinkActive="active">
                <mat-icon>category</mat-icon>
                <span>Leave Types</span>
              </a>
              <a class="menu-item" routerLink="/leave/policies" routerLinkActive="active">
                <mat-icon>policy</mat-icon>
                <span>Policies</span>
              </a>
              <a class="menu-item" routerLink="/leave/holidays" routerLinkActive="active">
                <mat-icon>event</mat-icon>
                <span>Public Holidays</span>
              </a>
              }
            </div>
          </mat-expansion-panel>
          }

          @if (deadlinesModuleEnabled) {
          <mat-expansion-panel class="nav-panel">
            <mat-expansion-panel-header>
              <mat-icon>event_busy</mat-icon>
              <span>Critical Deadlines</span>
              @if (deadlineOverdueCount > 0) {
                <span class="sidebar-badge badge-overdue" matTooltip="Overdue deadlines">{{ deadlineOverdueCount }}</span>
              }
              @if (deadlineDueSoonCount > 0) {
                <span class="sidebar-badge badge-due-soon" matTooltip="Deadlines due soon">{{ deadlineDueSoonCount }}</span>
              }
            </mat-expansion-panel-header>
            <div class="submenu">
              <a class="menu-item" routerLink="/deadlines" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a class="menu-item" routerLink="/deadlines/categories" routerLinkActive="active">
                <mat-icon>category</mat-icon>
                <span>Categories</span>
              </a>
              <a class="menu-item" routerLink="/deadlines/items" routerLinkActive="active">
                <mat-icon>list</mat-icon>
                <span>Deadline Items</span>
              </a>
              <a class="menu-item" routerLink="/deadlines/calendar" routerLinkActive="active">
                <mat-icon>calendar_month</mat-icon>
                <span>Calendar</span>
              </a>
            </div>
          </mat-expansion-panel>
          }

          @if (workflowModuleEnabled) {
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
          }

          <!-- Projects -->
          @if (projectsModuleEnabled) {
          <mat-expansion-panel class="nav-panel">
            <mat-expansion-panel-header>
              <mat-icon>folder_special</mat-icon>
              <span>Projects</span>
            </mat-expansion-panel-header>
            <div class="submenu">
              <a class="menu-item" routerLink="/projects" routerLinkActive="active">
                <mat-icon>list</mat-icon>
                <span>All Projects</span>
              </a>
              <a class="menu-item" routerLink="/projects/gantt" routerLinkActive="active">
                <mat-icon>bar_chart</mat-icon>
                <span>Gantt Chart</span>
              </a>
              <a class="menu-item" routerLink="/projects/categories" routerLinkActive="active">
                <mat-icon>category</mat-icon>
                <span>Categories</span>
              </a>
              @if (isAdmin) {
                <a class="menu-item" routerLink="/projects/document-templates" routerLinkActive="active">
                  <mat-icon>file_copy</mat-icon>
                  <span>Doc Templates</span>
                </a>
              }
            </div>
          </mat-expansion-panel>
          }

          <!-- Reports -->
          <mat-expansion-panel class="nav-panel">
            <mat-expansion-panel-header>
              <mat-icon>assessment</mat-icon>
              <span>Reports</span>
            </mat-expansion-panel-header>
            <div class="submenu">
              <a class="menu-item" routerLink="/reports" routerLinkActive="active">
                <mat-icon>list</mat-icon>
                <span>All Reports</span>
              </a>
              @for (category of reportCategories; track category.id) {
                @if ((category.id === 'workflow' && workflowModuleEnabled) || (category.id === 'project' && projectsModuleEnabled) || (category.id === 'leave' && leaveModuleEnabled) || (category.id === 'deadline' && deadlinesModuleEnabled)) {
                  <mat-expansion-panel class="nav-panel nested-panel">
                    <mat-expansion-panel-header>
                      <mat-icon>{{ category.icon }}</mat-icon>
                      <span>{{ category.name }}</span>
                    </mat-expansion-panel-header>
                    <div class="submenu nested-submenu">
                      @for (report of category.reports; track report.id) {
                        <a class="menu-item" [routerLink]="['/reports', report.id]">
                          <mat-icon>{{ report.icon }}</mat-icon>
                          <span>{{ report.name }}</span>
                        </a>
                      }
                    </div>
                  </mat-expansion-panel>
                }
              }
            </div>
          </mat-expansion-panel>
        </nav>

        <div class="sidebar-footer" [class.collapsed]="footerCollapsed">
          <div class="footer-toggle" (click)="toggleFooter()">
            @if (!footerCollapsed) {
              <span>About</span>
            }
            <mat-icon class="toggle-icon">{{ footerCollapsed ? 'expand_less' : 'expand_more' }}</mat-icon>
          </div>
          <div class="footer-content" [@footerExpand]="footerCollapsed ? 'collapsed' : 'expanded'">
            <div class="footer-brand-row">
              <img [src]="logoUrl" alt="Sona" class="footer-logo" (error)="logoUrl = 'assets/logo.png'">
              <span class="footer-brand">Sona</span>
            </div>
            <div class="developer">Developed By: Acad Arch Solutions Pvt. Ltd.</div>
            <div class="copyright">v1.5.0 | &copy; {{ currentYear }} All Rights Reserved</div>
          </div>
        </div>
      </aside>

      @if (sidebarOpen && isMobile) {
        <div class="sidebar-backdrop" (click)="toggleSidebar()"></div>
      }

      <main class="main-content" [class.expanded]="!sidebarOpen">
        <header class="main-header">
          <div class="header-left">
            <button mat-icon-button matTooltip="Menu" (click)="toggleSidebar()">
              <mat-icon>menu</mat-icon>
            </button>
          </div>

          <div class="header-right">
            <button mat-button class="account-btn" [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
              <span class="account-name">{{ fullName }}</span>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="openProfileDialog()">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item (click)="openSignatureDialog()">
                <mat-icon>draw</mat-icon>
                <span>Signature</span>
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
    .layout-container { display: flex; min-height: 100vh; overflow: visible; position: relative; }

    .sidebar {
      width: 338px;
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
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .brand-logo {
      max-width: 64px;
      max-height: 64px;
      object-fit: contain;
    }

    .brand-name {
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--brand-color, #ffffff);
      letter-spacing: 1px;
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

    .nav-panel ::ng-deep .mat-expansion-indicator::after {
      color: white !important;
      border-color: white !important;
    }

    .nav-panel ::ng-deep .mat-expansion-panel-body {
      padding: 0;
    }

    .submenu .menu-item {
      padding-left: 2.5rem;
      font-size: 0.875rem;
    }

    .nested-panel {
      margin: 0 !important;
    }

    .nested-panel ::ng-deep .mat-expansion-panel-header {
      padding-left: 2.5rem !important;
      font-size: 0.875rem;
      min-height: 40px !important;
    }

    .nested-submenu .menu-item {
      padding-left: 4rem !important;
      font-size: 0.8rem;
    }

    .reports-submenu {
      max-height: 400px;
      overflow-y: auto;
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

    .sidebar-badge {
      margin-left: 4px;
      color: white;
      border-radius: 10px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
    }

    .badge-overdue {
      background: #f44336;
    }

    .badge-due-soon {
      background: #ff9800;
    }

    .badge-leave-approvals {
      background: #ff9800;
    }

    .badge-leave-pending {
      background: #1976d2;
    }

    .badge-leave-upcoming {
      background: #4caf50;
    }

    .badge-count.leave-approvals {
      background: #ff9800;
    }

    .badge-count.leave-pending {
      background: #1976d2;
    }

    .sidebar-footer {
      border-top: 1px solid var(--menu-hover-bg, #37474f);
      opacity: 0.9;
    }

    .footer-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background 0.2s, padding 0.2s;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .footer-toggle:hover {
      background: var(--menu-hover-bg, #37474f);
    }

    .footer-toggle .toggle-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.2s, font-size 0.2s;
    }

    .footer-content {
      text-align: center;
      padding: 0.5rem 1rem 1rem;
      font-size: 0.75rem;
    }

    .footer-brand-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .footer-logo {
      max-width: 56px;
      max-height: 56px;
      object-fit: contain;
    }

    .footer-brand {
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--brand-color, #ffffff);
      letter-spacing: 1px;
    }

    .sidebar-footer .developer {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .sidebar-footer .copyright {
      opacity: 0.7;
    }

    .sidebar-footer.collapsed {
      border-top: none;
      border-bottom: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-footer.collapsed .footer-toggle {
      padding: 1px 0;
      margin: 0;
      justify-content: center;
      height: auto;
      min-height: 0;
      line-height: 1;
    }

    .sidebar-footer.collapsed .footer-toggle .toggle-icon {
      font-size: 8px !important;
      width: 8px !important;
      height: 8px !important;
      line-height: 8px !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .main-content {
      flex: 1;
      margin-left: 338px;
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

    .account-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-transform: none;
      font-weight: 500;
      font-size: 11px;
      color: var(--header-text, #333) !important;
      line-height: 1.2;

      mat-icon, .mat-icon {
        color: var(--header-text, #333) !important;
      }
    }

    .header-left .mat-mdc-icon-button {
      color: var(--header-text, #333);
    }
    .account-name {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--header-text, #333) !important;
    }

    .page-content {
      flex: 1;
      padding: 1.5rem;
      background: var(--body-bg, #f5f5f5);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* Sidebar collapsed state */
    .sidebar {
      transition: transform 0.3s ease, width 0.3s ease;
    }

    .sidebar.collapsed {
      transform: translateX(-338px);
    }

    .main-content.expanded {
      margin-left: 0;
    }

    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    /* Mobile sidebar overlay */
    .sidebar.mobile {
      width: 280px;
      z-index: 1100 !important;
      transform: translateX(0);
    }

    .sidebar.mobile.collapsed {
      transform: translateX(-280px) !important;
    }

    @media (max-width: 767px) {
      .sidebar-backdrop {
        z-index: 1099 !important;
      }

      .main-content {
        margin-left: 0 !important;
        width: 100% !important;
      }

      .main-header {
        padding: 0 0.5rem !important;
        z-index: 50 !important;
      }

      .account-name {
        font-size: 9px !important;
        max-width: 80px;
      }

      .page-content {
        padding: 0.75rem !important;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  workflows: Workflow[] = [];
  activeWorkflows: Workflow[] = [];
  reportCategories: ReportCategory[] = [];
  sidebarOpen = true;
  isMobile = false;
  footerCollapsed = false;
  pendingApprovalsCount = 0;
  mySubmissionsCount = 0;
  currentYear = new Date().getFullYear();
  logoUrl = 'assets/logo.png';
  workflowModuleEnabled = true;
  projectsModuleEnabled = true;
  deadlinesModuleEnabled = true;
  leaveModuleEnabled = true;
  deadlineOverdueCount = 0;
  deadlineDueSoonCount = 0;
  leavePendingApprovalsCount = 0;
  leaveMyPendingCount = 0;
  leaveApprovedUpcomingCount = 0;

  constructor(
    private authService: AuthService,
    private workflowService: WorkflowService,
    private themeService: ThemeService,
    private reportService: ReportService,
    private settingService: SettingService,
    private deadlineService: DeadlineService,
    private leaveService: LeaveService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
    this.themeService.loadTheme();
    this.loadModuleStates();
    this.loadWorkflows();
    this.loadPendingApprovalsCount();
    this.loadMySubmissionsCount();
    this.loadDeadlineBadgeCounts();
    this.loadLeaveBadgeCounts();
    this.loadReportCategories();
    this.loadLogoUrl();
  }

  loadModuleStates() {
    this.settingService.getSettingValue('module.workflow.enabled').subscribe({
      next: (res) => {
        if (res.success) {
          this.workflowModuleEnabled = res.data !== 'false';
        }
      }
    });
    this.settingService.getSettingValue('module.projects.enabled').subscribe({
      next: (res) => {
        if (res.success) {
          this.projectsModuleEnabled = res.data !== 'false';
        }
      }
    });
    this.settingService.getSettingValue('module.deadlines.enabled').subscribe({
      next: (res) => {
        if (res.success) {
          this.deadlinesModuleEnabled = res.data !== 'false';
        }
      }
    });
    this.settingService.getSettingValue('module.leave.enabled').subscribe({
      next: (res) => {
        if (res.success) {
          this.leaveModuleEnabled = res.data !== 'false';
        }
      }
    });
  }

  loadLogoUrl() {
    this.settingService.getSettingValue('app.logo.url').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.logoUrl = res.data;
        }
      }
    });
  }

  loadReportCategories() {
    const categories = this.reportService.getReportCategories();
    const allReports = this.reportService.getAllReports();

    this.reportCategories = categories.map(cat => ({
      ...cat,
      reports: allReports
        .filter(r => r.category === cat.id)
        .map(r => ({ id: r.id, name: r.name, icon: r.icon }))
    }));
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

  loadDeadlineBadgeCounts() {
    this.deadlineService.getBadgeCounts().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deadlineOverdueCount = res.data.overdue || 0;
          this.deadlineDueSoonCount = res.data.dueSoon || 0;
        }
      },
      error: () => {
        this.deadlineOverdueCount = 0;
        this.deadlineDueSoonCount = 0;
      }
    });
  }

  loadLeaveBadgeCounts() {
    this.leaveService.getBadgeCounts().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.leavePendingApprovalsCount = res.data.pendingApprovals || 0;
          this.leaveMyPendingCount = res.data.myPending || 0;
          this.leaveApprovedUpcomingCount = res.data.approvedUpcoming || 0;
        }
      },
      error: () => {
        this.leavePendingApprovalsCount = 0;
        this.leaveMyPendingCount = 0;
        this.leaveApprovedUpcomingCount = 0;
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

  checkMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && !wasMobile) {
      this.sidebarOpen = false;
    }
    if (!this.isMobile && wasMobile) {
      this.sidebarOpen = true;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onNavClick(event: MouseEvent) {
    if (!this.isMobile) return;
    // Only close sidebar when clicking an actual navigation link, not expansion panels
    const target = event.target as HTMLElement;
    const anchor = target.closest('a.menu-item');
    if (anchor) {
      this.sidebarOpen = false;
    }
  }

  toggleFooter() {
    this.footerCollapsed = !this.footerCollapsed;
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

  openSignatureDialog() {
    this.dialog.open(SignatureDialogComponent, {
      width: '680px',
      maxHeight: '90vh'
    });
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px',
      disableClose: true
    });
  }
}
