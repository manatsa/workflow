import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./projects-dashboard.component').then(m => m.ProjectsDashboardComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./project-categories/project-category-list.component').then(m => m.ProjectCategoryListComponent)
  },
  {
    path: 'gantt',
    loadComponent: () => import('./project-gantt/project-gantt.component').then(m => m.ProjectGanttComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./project-settings/project-settings.component').then(m => m.ProjectSettingsComponent)
  },
  {
    path: 'document-templates',
    loadComponent: () => import('./project-document-templates/project-document-templates.component').then(m => m.ProjectDocumentTemplatesComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: ':id/gantt',
    loadComponent: () => import('./project-gantt/project-gantt.component').then(m => m.ProjectGanttComponent)
  },
  {
    path: ':id/documents',
    loadComponent: () => import('./project-documents/project-documents.component').then(m => m.ProjectDocumentsComponent)
  },
  {
    path: ':id/tasks',
    loadComponent: () => import('./project-tasks/project-tasks.component').then(m => m.ProjectTasksComponent)
  },
  {
    path: ':id/team',
    loadComponent: () => import('./project-team/project-team.component').then(m => m.ProjectTeamComponent)
  },
  {
    path: ':id/budget',
    loadComponent: () => import('./project-budget/project-budget.component').then(m => m.ProjectBudgetComponent)
  },
  {
    path: ':id/risks',
    loadComponent: () => import('./project-risks/project-risks.component').then(m => m.ProjectRisksComponent)
  },
  {
    path: ':id/issues',
    loadComponent: () => import('./project-issues/project-issues.component').then(m => m.ProjectIssuesComponent)
  },
  {
    path: ':id/reports',
    loadComponent: () => import('./project-reports/project-reports.component').then(m => m.ProjectReportsComponent)
  }
];
