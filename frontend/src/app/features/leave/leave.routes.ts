import { Routes } from '@angular/router';

export const LEAVE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./leave-dashboard/leave-dashboard.component').then(m => m.LeaveDashboardComponent)
  },
  {
    path: 'requests',
    loadComponent: () => import('./leave-request-list/leave-request-list.component').then(m => m.LeaveRequestListComponent)
  },
  {
    path: 'requests/:id',
    loadComponent: () => import('./leave-request-detail/leave-request-detail.component').then(m => m.LeaveRequestDetailComponent)
  },
  {
    path: 'approvals',
    loadComponent: () => import('./leave-approval-list/leave-approval-list.component').then(m => m.LeaveApprovalListComponent)
  },
  {
    path: 'approver-config',
    loadComponent: () => import('./leave-approver-config/leave-approver-config.component').then(m => m.LeaveApproverConfigComponent)
  },
  {
    path: 'balances',
    loadComponent: () => import('./leave-balance-list/leave-balance-list.component').then(m => m.LeaveBalanceListComponent)
  },
  {
    path: 'types',
    loadComponent: () => import('./leave-type-list/leave-type-list.component').then(m => m.LeaveTypeListComponent)
  },
  {
    path: 'policies',
    loadComponent: () => import('./leave-policy-list/leave-policy-list.component').then(m => m.LeavePolicyListComponent)
  },
  {
    path: 'holidays',
    loadComponent: () => import('./leave-holiday-list/leave-holiday-list.component').then(m => m.LeaveHolidayListComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./leave-calendar/leave-calendar.component').then(m => m.LeaveCalendarComponent)
  }
];
