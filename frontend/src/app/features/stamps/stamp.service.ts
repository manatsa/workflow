import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface StampDTO {
  id?: string;
  name: string;
  svgContent: string;
  description?: string;
  stampColor?: string;
  displayOrder?: number;
  isSystem?: boolean;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StampService {
  private basePath = '/stamps';

  constructor(private api: ApiService) {}

  getAll(): Observable<any> {
    return this.api.get(this.basePath);
  }

  getActive(): Observable<any> {
    return this.api.get(`${this.basePath}/active`);
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/${id}`);
  }

  create(stamp: StampDTO): Observable<any> {
    return this.api.post(this.basePath, stamp);
  }

  update(id: string, stamp: StampDTO): Observable<any> {
    return this.api.put(`${this.basePath}/${id}`, stamp);
  }

  toggleStatus(id: string): Observable<any> {
    return this.api.put(`${this.basePath}/${id}/toggle-status`, {});
  }

  delete(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/${id}`);
  }
}
