import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Setting, AuditLog, CommandResponse } from '../models/setting.model';
import { ApiResponse, PageResponse } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  constructor(private api: ApiService) {}

  getAllSettings(): Observable<ApiResponse<Setting[]>> {
    return this.api.get<Setting[]>('/settings');
  }

  getTabs(): Observable<ApiResponse<string[]>> {
    return this.api.get<string[]>('/settings/tabs');
  }

  getSettingsByTab(tab: string): Observable<ApiResponse<Setting[]>> {
    return this.api.get<Setting[]>(`/settings/tab/${tab}`);
  }

  getSettingsGrouped(): Observable<ApiResponse<Record<string, Setting[]>>> {
    return this.api.get<Record<string, Setting[]>>('/settings/grouped');
  }

  saveSetting(setting: Partial<Setting>): Observable<ApiResponse<Setting>> {
    return this.api.post<Setting>('/settings', setting);
  }

  saveSettings(settings: Partial<Setting>[]): Observable<ApiResponse<Setting[]>> {
    return this.api.post<Setting[]>('/settings/batch', settings);
  }

  deleteSetting(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/settings/${id}`);
  }

  sendTestEmail(email: string): Observable<ApiResponse<void>> {
    return this.api.post<void>('/settings/test-email', { email });
  }

  // Audit
  searchAuditLogs(query: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<AuditLog>>> {
    return this.api.getPage<AuditLog>('/audit/search', page, size, { q: query });
  }

  getAuditLogsForEntity(entityType: string, entityId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.api.get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`);
  }

  getAuditLogsForWorkflowInstance(instanceId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.api.get<AuditLog[]>(`/audit/workflow-instance/${instanceId}`);
  }

  // Command Console
  executeCommand(command: string): Observable<ApiResponse<CommandResponse>> {
    return this.api.post<CommandResponse>('/console/execute', { command });
  }

  // Entity-specific audit logs
  getAuditLogs(entityType: string, entityId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.api.get<AuditLog[]>(`/audit/entity/${entityType}/${entityId}`);
  }

  // Paged audit logs with filters
  getAuditLogsPaged(page: number, size: number, filters?: any): Observable<ApiResponse<PageResponse<AuditLog>>> {
    const params: any = {};
    if (filters) {
      if (filters.performedBy) params.performedBy = filters.performedBy;
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.fromDate) params.fromDate = filters.fromDate.toISOString();
      if (filters.toDate) params.toDate = filters.toDate.toISOString();
    }
    return this.api.getPage<AuditLog>('/audit', page, size, params);
  }

  exportAuditLogs(filters?: any): Observable<Blob> {
    let url = '/audit/export';
    const params: string[] = [];
    if (filters) {
      if (filters.performedBy) params.push(`performedBy=${encodeURIComponent(filters.performedBy)}`);
      if (filters.action) params.push(`action=${encodeURIComponent(filters.action)}`);
      if (filters.entityType) params.push(`entityType=${encodeURIComponent(filters.entityType)}`);
      if (filters.fromDate) params.push(`fromDate=${encodeURIComponent(filters.fromDate.toISOString())}`);
      if (filters.toDate) params.push(`toDate=${encodeURIComponent(filters.toDate.toISOString())}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    return this.api.download(url);
  }
}
