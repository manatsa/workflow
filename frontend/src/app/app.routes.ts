import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'email-approval',
    loadComponent: () => import('./features/email-approval/email-approval.component').then(m => m.EmailApprovalComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      // User Management
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
      },
      // Roles
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/role-list/role-list.component').then(m => m.RoleListComponent)
      },
      // Categories
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent)
      },
      // Corporates
      {
        path: 'corporates',
        loadComponent: () => import('./features/corporates/corporate-list/corporate-list.component').then(m => m.CorporateListComponent)
      },
      // SBUs
      {
        path: 'sbus',
        loadComponent: () => import('./features/sbus/sbu-list/sbu-list.component').then(m => m.SbuListComponent)
      },
      // Branches
      {
        path: 'branches',
        loadComponent: () => import('./features/branches/branch-list/branch-list.component').then(m => m.BranchListComponent)
      },
      // Departments
      {
        path: 'departments',
        loadComponent: () => import('./features/departments/department-list/department-list.component').then(m => m.DepartmentListComponent)
      },
      // Settings
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      // Audit
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-log/audit-log.component').then(m => m.AuditLogComponent)
      },
      // Workflows
      {
        path: 'workflows',
        loadComponent: () => import('./features/workflows/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent)
      },
      {
        path: 'workflows/builder/new',
        loadComponent: () => import('./features/workflows/workflow-builder/workflow-builder.component').then(m => m.WorkflowBuilderComponent)
      },
      {
        path: 'workflows/builder/:id',
        loadComponent: () => import('./features/workflows/workflow-builder/workflow-builder.component').then(m => m.WorkflowBuilderComponent),
        runGuardsAndResolvers: 'paramsChange'
      },
      {
        path: 'workflows/:workflowCode/instances',
        loadComponent: () => import('./features/workflows/workflow-instances/workflow-instances.component').then(m => m.WorkflowInstancesComponent)
      },
      {
        path: 'workflows/:workflowCode/new',
        loadComponent: () => import('./features/workflows/workflow-form/workflow-form.component').then(m => m.WorkflowFormComponent)
      },
      {
        path: 'workflows/:workflowCode/edit/:instanceId',
        loadComponent: () => import('./features/workflows/workflow-form/workflow-form.component').then(m => m.WorkflowFormComponent)
      },
      {
        path: 'workflows/:workflowCode/instances/:instanceId',
        loadComponent: () => import('./features/workflows/instance-detail/instance-detail.component').then(m => m.InstanceDetailComponent)
      },
      // Approvals
      {
        path: 'approvals',
        loadComponent: () => import('./features/approvals/approval-list/approval-list.component').then(m => m.ApprovalListComponent)
      },
      {
        path: 'approvals/:id',
        loadComponent: () => import('./features/approvals/approval-detail/approval-detail.component').then(m => m.ApprovalDetailComponent)
      },
      // My Submissions
      {
        path: 'my-submissions',
        loadComponent: () => import('./features/my-submissions/my-submissions.component').then(m => m.MySubmissionsComponent)
      },
      // Reports
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/report-list/report-list.component').then(m => m.ReportListComponent)
      },
      {
        path: 'reports/:reportId',
        loadComponent: () => import('./features/reports/report-viewer/report-viewer.component').then(m => m.ReportViewerComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
