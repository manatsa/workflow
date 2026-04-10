import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SqlObject } from '../models/workflow.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class SqlObjectService {
  private apiUrl = `${environment.apiUrl}/sql-objects`;

  constructor(private http: HttpClient) {}

  getAllSqlObjects(): Observable<SqlObject[]> {
    return this.http.get<ApiResponse<SqlObject[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getActiveSqlObjects(): Observable<SqlObject[]> {
    return this.http.get<ApiResponse<SqlObject[]>>(`${this.apiUrl}/active`).pipe(
      map(response => response.data)
    );
  }

  getSqlObjectById(id: string): Observable<SqlObject> {
    return this.http.get<ApiResponse<SqlObject>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createSqlObject(sqlObject: Partial<SqlObject>): Observable<SqlObject> {
    return this.http.post<ApiResponse<SqlObject>>(this.apiUrl, sqlObject).pipe(
      map(response => response.data)
    );
  }

  updateSqlObject(id: string, sqlObject: Partial<SqlObject>): Observable<SqlObject> {
    return this.http.put<ApiResponse<SqlObject>>(`${this.apiUrl}/${id}`, sqlObject).pipe(
      map(response => response.data)
    );
  }

  activateSqlObject(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      map(response => response.data)
    );
  }

  deactivateSqlObject(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map(response => response.data)
    );
  }

  deleteSqlObject(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Data management
  getTableData(sqlObjectId: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${sqlObjectId}/data`).pipe(
      map(response => response.data)
    );
  }

  addTableRow(sqlObjectId: string, rowData: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${sqlObjectId}/data`, rowData).pipe(
      map(response => response.data)
    );
  }

  updateTableRow(sqlObjectId: string, rowId: number, rowData: any): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${sqlObjectId}/data/${rowId}`, rowData).pipe(
      map(response => response.data)
    );
  }

  deleteTableRow(sqlObjectId: string, rowId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${sqlObjectId}/data/${rowId}`).pipe(
      map(response => response.data)
    );
  }

  // Get options for dropdown fields
  getOptions(sqlObjectId: string): Observable<{ value: string; label: string }[]> {
    return this.http.get<ApiResponse<{ value: string; label: string }[]>>(`${this.apiUrl}/${sqlObjectId}/options`).pipe(
      map(response => response.data)
    );
  }

  // Template / Import / Export
  downloadTemplate(sqlObjectId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${sqlObjectId}/template`, { responseType: 'blob' });
  }

  exportData(sqlObjectId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${sqlObjectId}/export`, { responseType: 'blob' });
  }

  importData(sqlObjectId: string, file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${sqlObjectId}/import`, formData, { responseType: 'blob' });
  }
}
