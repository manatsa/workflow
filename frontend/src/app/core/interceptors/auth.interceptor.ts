import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get token from service or directly from localStorage as fallback
  const token = authService.token || localStorage.getItem('auth_token');

  // Build headers object
  const headers: { [key: string]: string } = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add cache-busting headers for API requests to prevent stale data
  if (req.url.includes('/api/')) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({ setHeaders: headers });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
