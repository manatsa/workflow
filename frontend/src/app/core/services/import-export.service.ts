import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {
  private baseUrl = `${environment.apiUrl}/import-export`;

  constructor(private http: HttpClient) {}

  downloadTemplate(entity: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template/${entity}`, {
      responseType: 'blob'
    });
  }

  importFromExcel(entity: string, file: File): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<number>>(
      `${this.baseUrl}/import/${entity}`,
      formData
    );
  }

  exportToExcel(entity: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${entity}`, {
      responseType: 'blob'
    });
  }

  exportSettingsJson(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/settings/export-json`, {
      responseType: 'blob'
    });
  }

  importSettingsJson(file: File): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<number>>(
      `${this.baseUrl}/settings/import-json`,
      formData
    );
  }

  // Helper method to trigger file download
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
