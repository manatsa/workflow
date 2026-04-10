import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SettingService } from '../services/setting.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated &&
      (authService.hasRole('ROLE_ADMIN') || authService.hasPrivilege('ADMIN'))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const workflowModuleGuard: CanActivateFn = (route, state) => {
  const settingService = inject(SettingService);
  const router = inject(Router);

  return settingService.getSettingValue('module.workflow.enabled').pipe(
    map(res => {
      if (res.success && res.data === 'false') {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true))
  );
};

export const projectsModuleGuard: CanActivateFn = (route, state) => {
  const settingService = inject(SettingService);
  const router = inject(Router);

  return settingService.getSettingValue('module.projects.enabled').pipe(
    map(res => {
      if (res.success && res.data === 'false') {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true))
  );
};

export const deadlinesModuleGuard: CanActivateFn = (route, state) => {
  const settingService = inject(SettingService);
  const router = inject(Router);

  return settingService.getSettingValue('module.deadlines.enabled').pipe(
    map(res => {
      if (res.success && res.data === 'false') {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true))
  );
};

export const leaveModuleGuard: CanActivateFn = (route, state) => {
  const settingService = inject(SettingService);
  const router = inject(Router);

  return settingService.getSettingValue('module.leave.enabled').pipe(
    map(res => {
      if (res.success && res.data === 'false') {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => of(true))
  );
};
