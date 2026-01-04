import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, Role, Privilege, SBU } from '../models/user.model';
import { ApiResponse, PageResponse } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.api.get<User[]>('/users/list');
  }

  getUsersPaged(page = 0, size = 20): Observable<ApiResponse<PageResponse<User>>> {
    return this.api.getPage<User>('/users', page, size);
  }

  getUser(id: string): Observable<ApiResponse<User>> {
    return this.api.get<User>(`/users/${id}`);
  }

  searchUsers(query: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<User>>> {
    return this.api.getPage<User>('/users/search', page, size, { q: query });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.api.get<User>(`/users/${id}`);
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.api.get<User>('/users/me');
  }

  createUser(user: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.post<User>('/users', user);
  }

  updateUser(id: string, user: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.put<User>(`/users/${id}`, user);
  }

  updateProfile(user: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.put<User>('/users/me', user);
  }

  activateUser(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/deactivate`, {});
  }

  lockUser(id: string, reason?: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/lock`, { reason });
  }

  unlockUser(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/unlock`, {});
  }

  resetPassword(id: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/reset-password?newPassword=${newPassword}`, {});
  }

  adminResetPassword(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/users/${id}/admin-reset-password`, {});
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/users/${id}`);
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<ApiResponse<void>> {
    return this.api.post<void>('/password/change', { currentPassword, newPassword, confirmPassword });
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.api.post<void>('/password/forgot', { email });
  }

  confirmResetPassword(token: string, newPassword: string, confirmPassword: string): Observable<ApiResponse<void>> {
    return this.api.post<void>('/password/reset', { token, newPassword, confirmPassword });
  }

  // Roles
  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.api.get<Role[]>('/roles/list');
  }

  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.api.get<Role>(`/roles/${id}`);
  }

  createRole(role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.api.post<Role>('/roles', role);
  }

  updateRole(id: string, role: Partial<Role>): Observable<ApiResponse<Role>> {
    return this.api.put<Role>(`/roles/${id}`, role);
  }

  deleteRole(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/roles/${id}`);
  }

  // Privileges
  getPrivileges(): Observable<ApiResponse<Privilege[]>> {
    return this.api.get<Privilege[]>('/privileges');
  }

  createPrivilege(privilege: Partial<Privilege>): Observable<ApiResponse<Privilege>> {
    return this.api.post<Privilege>('/privileges', privilege);
  }

  deletePrivilege(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/privileges/${id}`);
  }

  // SBUs
  getSBUs(): Observable<ApiResponse<SBU[]>> {
    return this.api.get<SBU[]>('/sbus');
  }

  getSbus(): Observable<ApiResponse<SBU[]>> {
    return this.api.get<SBU[]>('/sbus');
  }

  getSBUTree(): Observable<ApiResponse<SBU[]>> {
    return this.api.get<SBU[]>('/sbus/tree');
  }

  getSBUById(id: string): Observable<ApiResponse<SBU>> {
    return this.api.get<SBU>(`/sbus/${id}`);
  }

  createSBU(sbu: Partial<SBU>): Observable<ApiResponse<SBU>> {
    return this.api.post<SBU>('/sbus', sbu);
  }

  createSbu(sbu: Partial<SBU>): Observable<ApiResponse<SBU>> {
    return this.api.post<SBU>('/sbus', sbu);
  }

  updateSBU(id: string, sbu: Partial<SBU>): Observable<ApiResponse<SBU>> {
    return this.api.put<SBU>(`/sbus/${id}`, sbu);
  }

  updateSbu(id: string, sbu: Partial<SBU>): Observable<ApiResponse<SBU>> {
    return this.api.put<SBU>(`/sbus/${id}`, sbu);
  }

  deleteSBU(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/sbus/${id}`);
  }

  deleteSbu(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/sbus/${id}`);
  }
}
