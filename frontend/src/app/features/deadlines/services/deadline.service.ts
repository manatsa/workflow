import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface DeadlineCategoryDTO {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface DeadlineItemDTO {
  id?: string;
  name: string;
  code?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  priority: string;
  status: string;
  recurrenceType: string;
  reminderDaysBefore?: string;
  ownerId?: string;
  ownerName?: string;
  sbuId?: string;
  sbuName?: string;
  nextDueDate?: string;
  nextInstanceStatus?: string;
  actions?: DeadlineActionDTO[];
  recipients?: DeadlineRecipientDTO[];
  instances?: DeadlineInstanceDTO[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
}

export interface DeadlineActionDTO {
  id?: string;
  deadlineItemId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: string;
  completedAt?: string;
  completedBy?: string;
  displayOrder?: number;
  dueOffsetDays?: number;
}

export interface DeadlineRecipientDTO {
  id?: string;
  deadlineItemId?: string;
  userId?: string;
  recipientName: string;
  recipientEmail: string;
  notifyOnReminder?: boolean;
  notifyOnOverdue?: boolean;
  notifyOnCompletion?: boolean;
}

export interface DeadlineInstanceDTO {
  id?: string;
  deadlineItemId?: string;
  deadlineItemName?: string;
  deadlineItemCode?: string;
  categoryName?: string;
  priority?: string;
  dueDate?: string;
  status?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  daysRemaining?: number;
}

export interface DeadlineDashboardDTO {
  totalActive: number;
  upcomingCount: number;
  dueSoonCount: number;
  overdueCount: number;
  completedThisMonth: number;
  upcomingDeadlines: DeadlineInstanceDTO[];
  overdueDeadlines: DeadlineInstanceDTO[];
  recentlyCompleted: DeadlineInstanceDTO[];
}

@Injectable({ providedIn: 'root' })
export class DeadlineService {
  private basePath = '/deadlines';

  constructor(private api: ApiService) {}

  // Deadline Items
  getAll(): Observable<any> {
    return this.api.get(this.basePath);
  }

  search(search: string, page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc'): Observable<any> {
    return this.api.getPage(`${this.basePath}/search`, page, size, { search, sortBy, sortDir });
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/${id}`);
  }

  create(item: DeadlineItemDTO): Observable<any> {
    return this.api.post(this.basePath, item);
  }

  update(id: string, item: DeadlineItemDTO): Observable<any> {
    return this.api.put(`${this.basePath}/${id}`, item);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/${id}`);
  }

  checkReminders(id: string): Observable<any> {
    return this.api.post(`${this.basePath}/${id}/check-reminders`, {});
  }

  // Categories
  getCategories(): Observable<any> {
    return this.api.get(`${this.basePath}/categories`);
  }

  getActiveCategories(): Observable<any> {
    return this.api.get(`${this.basePath}/categories/active`);
  }

  getCategoryById(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/categories/${id}`);
  }

  createCategory(cat: DeadlineCategoryDTO): Observable<any> {
    return this.api.post(`${this.basePath}/categories`, cat);
  }

  updateCategory(id: string, cat: DeadlineCategoryDTO): Observable<any> {
    return this.api.put(`${this.basePath}/categories/${id}`, cat);
  }

  toggleCategoryStatus(id: string): Observable<any> {
    return this.api.put(`${this.basePath}/categories/${id}/toggle-status`, {});
  }

  deleteCategory(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/categories/${id}`);
  }

  // Dashboard
  getDashboard(): Observable<any> {
    return this.api.get(`${this.basePath}/dashboard`);
  }

  getBadgeCounts(): Observable<any> {
    return this.api.get(`${this.basePath}/dashboard/badge-counts`);
  }

  // Instances
  getInstances(deadlineId: string): Observable<any> {
    return this.api.get(`${this.basePath}/${deadlineId}/instances`);
  }

  getUpcoming(days = 30): Observable<any> {
    return this.api.get(`${this.basePath}/instances/upcoming?days=${days}`);
  }

  getOverdue(): Observable<any> {
    return this.api.get(`${this.basePath}/instances/overdue`);
  }

  completeInstance(instanceId: string, notes?: string): Observable<any> {
    return this.api.post(`${this.basePath}/instances/${instanceId}/complete`, { notes });
  }

  skipInstance(instanceId: string, notes?: string): Observable<any> {
    return this.api.post(`${this.basePath}/instances/${instanceId}/skip`, { notes });
  }
}
