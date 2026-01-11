import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmailSettings, EmailTestResult, EmailConfigurationStatus } from '../models/email-settings.model';

@Injectable({
  providedIn: 'root'
})
export class EmailSettingsService {
  private apiUrl = '/api/email-settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<EmailSettings> {
    return this.http.get<EmailSettings>(this.apiUrl);
  }

  saveSettings(settings: EmailSettings): Observable<EmailSettings> {
    return this.http.put<EmailSettings>(this.apiUrl, settings);
  }

  testConnection(recipientEmail?: string): Observable<EmailTestResult> {
    if (recipientEmail) {
      return this.http.post<EmailTestResult>(`${this.apiUrl}/test`, null, { params: { recipientEmail } });
    }
    return this.http.post<EmailTestResult>(`${this.apiUrl}/test`, null);
  }

  getStatus(): Observable<EmailConfigurationStatus> {
    return this.http.get<EmailConfigurationStatus>(`${this.apiUrl}/status`);
  }
}
