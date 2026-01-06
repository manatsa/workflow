import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthRequest, AuthResponse } from '../models/user.model';
import { ApiResponse } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSignal = signal<AuthResponse | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  get currentUser(): AuthResponse | null {
    return this.currentUserSignal();
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  login(credentials: AuthRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        })
      );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession()
    });
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/refresh?refreshToken=${refreshToken}`,
      {}
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) ?? false;
  }

  hasPrivilege(privilege: string): boolean {
    return this.currentUser?.privileges?.includes(privilege) ?? false;
  }

  hasAnyPrivilege(privileges: string[]): boolean {
    return privileges.some(p => this.hasPrivilege(p));
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/password/change`, {
      currentPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  refreshCurrentUser(): void {
    this.http.get<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const currentAuth = this.currentUser;
          if (currentAuth) {
            const updatedUser = { ...currentAuth, ...response.data };
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
            this.currentUserSignal.set(updatedUser);
          }
        }
      }
    });
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult));
    this.currentUserSignal.set(authResult);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  private loadStoredUser(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSignal.set(user);
      } catch {
        this.clearSession();
      }
    }
  }
}
