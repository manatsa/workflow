import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
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

  importFromExcel(entity: string, file: File): Observable<HttpResponse<Blob>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/import/${entity}`, formData, {
      responseType: 'blob',
      observe: 'response'
    });
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

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Extract filename from Content-Disposition header, falling back to a default.
   */
  extractFilename(response: HttpResponse<Blob>, defaultName: string): string {
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      // Try filename*= (RFC 5987) first, then filename=
      const filenameStarMatch = contentDisposition.match(/filename\*=(?:UTF-8''|utf-8'')(.+?)(?:;|$)/i);
      if (filenameStarMatch) {
        return decodeURIComponent(filenameStarMatch[1]);
      }
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
      if (filenameMatch) {
        return filenameMatch[1].trim();
      }
    }
    return defaultName;
  }
}
