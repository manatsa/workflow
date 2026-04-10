import { Routes } from '@angular/router';

export const DEADLINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./deadlines-dashboard.component').then(m => m.DeadlinesDashboardComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./deadline-categories/deadline-category-list.component').then(m => m.DeadlineCategoryListComponent)
  },
  {
    path: 'items',
    loadComponent: () => import('./deadline-list/deadline-list.component').then(m => m.DeadlineListComponent)
  },
  {
    path: 'items/:id',
    loadComponent: () => import('./deadline-detail/deadline-detail.component').then(m => m.DeadlineDetailComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./deadline-calendar/deadline-calendar.component').then(m => m.DeadlineCalendarComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./deadline-settings/deadline-settings.component').then(m => m.DeadlineSettingsComponent)
  }
];
