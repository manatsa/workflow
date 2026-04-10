import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface LeaveTypeDTO {
  id?: string;
  name: string;
  code: string;
  description?: string;
  colorCode?: string;
  isPaid?: boolean;
  defaultDaysPerYear?: number;
  maxConsecutiveDays?: number;
  requiresAttachment?: boolean;
  attachmentRequiredAfterDays?: number;
  applicableGender?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeavePolicyDTO {
  id?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  name: string;
  daysAllowed: number;
  maxCarryOverDays?: number;
  carryOverExpiryMonths?: number;
  accrualMethod?: string;
  proRataForNewJoiners?: boolean;
  probationMonths?: number;
  probationDaysAllowed?: number;
  allowNegativeBalance?: boolean;
  maxNegativeDays?: number;
  allowHalfDay?: boolean;
  encashmentAllowed?: boolean;
  maxEncashmentDays?: number;
  minServiceMonthsForEncashment?: number;
  minDaysBeforeRequest?: number;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalanceDTO {
  id?: string;
  employeeId: string;
  employeeName?: string;
  employeeStaffId?: string;
  department?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  leaveTypeColor?: string;
  year: number;
  entitled: number;
  carriedOver: number;
  adjustment: number;
  used: number;
  pending: number;
  encashed: number;
  available: number;
}

export interface LeaveRequestDTO {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  employeeStaffId?: string;
  department?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  leaveTypeColor?: string;
  referenceNumber?: string;
  startDate: string;
  endDate: string;
  startDateHalfDay?: boolean;
  startDateHalfDayPeriod?: string;
  endDateHalfDay?: boolean;
  endDateHalfDayPeriod?: string;
  totalDays?: number;
  reason?: string;
  status?: string;
  cancellationReason?: string;
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  approverComments?: string;
  delegateToId?: string;
  delegateToName?: string;
  contactWhileOnLeave?: string;
  attachments?: any[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PublicHolidayDTO {
  id?: string;
  name: string;
  date: string;
  year?: number;
  country?: string;
  region?: string;
  isRecurring?: boolean;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface LeaveDashboardDTO {
  balances: LeaveBalanceDTO[];
  pendingRequests: LeaveRequestDTO[];
  upcomingLeave: LeaveRequestDTO[];
  teamOnLeave: LeaveRequestDTO[];
  totalPendingApprovals: number;
}

export interface LeaveBalanceAdjustmentDTO {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  adjustmentDays: number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private basePath = '/leave';

  constructor(private api: ApiService) {}

  // Leave Types
  getTypes(): Observable<any> {
    return this.api.get(`${this.basePath}/types`);
  }

  getAllTypes(): Observable<any> {
    return this.api.get(`${this.basePath}/types/all`);
  }

  getType(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/types/${id}`);
  }

  createType(dto: LeaveTypeDTO): Observable<any> {
    return this.api.post(`${this.basePath}/types`, dto);
  }

  updateType(id: string, dto: LeaveTypeDTO): Observable<any> {
    return this.api.put(`${this.basePath}/types/${id}`, dto);
  }

  deleteType(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/types/${id}`);
  }

  // Policies
  getPolicies(): Observable<any> {
    return this.api.get(`${this.basePath}/policies`);
  }

  getPolicy(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/policies/${id}`);
  }

  getPoliciesByType(leaveTypeId: string): Observable<any> {
    return this.api.get(`${this.basePath}/policies/by-type/${leaveTypeId}`);
  }

  createPolicy(dto: LeavePolicyDTO): Observable<any> {
    return this.api.post(`${this.basePath}/policies`, dto);
  }

  updatePolicy(id: string, dto: LeavePolicyDTO): Observable<any> {
    return this.api.put(`${this.basePath}/policies/${id}`, dto);
  }

  deletePolicy(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/policies/${id}`);
  }

  // Balances
  getMyBalances(year?: number): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    return this.api.get(`${this.basePath}/balances/my`, params);
  }

  getEmployeeBalances(employeeId: string, year?: number): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    return this.api.get(`${this.basePath}/balances/employee/${employeeId}`, params);
  }

  getAllBalances(year?: number): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    return this.api.get(`${this.basePath}/balances/all`, params);
  }

  adjustBalance(dto: LeaveBalanceAdjustmentDTO): Observable<any> {
    return this.api.post(`${this.basePath}/balances/adjust`, dto);
  }

  initializeYear(year: number): Observable<any> {
    return this.api.post(`${this.basePath}/balances/initialize/${year}`, {});
  }

  // Requests
  getMyRequests(page = 0, size = 20): Observable<any> {
    return this.api.get(`${this.basePath}/requests/my`, { page, size });
  }

  getPendingApprovals(page = 0, size = 20): Observable<any> {
    return this.api.get(`${this.basePath}/requests/pending`, { page, size });
  }

  searchRequests(search: string, page = 0, size = 20): Observable<any> {
    return this.api.get(`${this.basePath}/requests/search`, { search, page, size });
  }

  getRequest(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/requests/${id}`);
  }

  createRequest(dto: LeaveRequestDTO): Observable<any> {
    return this.api.post(`${this.basePath}/requests`, dto);
  }

  approveRequest(id: string, comments?: string): Observable<any> {
    return this.api.post(`${this.basePath}/requests/${id}/approve`, { comments });
  }

  rejectRequest(id: string, comments: string): Observable<any> {
    return this.api.post(`${this.basePath}/requests/${id}/reject`, { comments });
  }

  cancelRequest(id: string, reason: string): Observable<any> {
    return this.api.post(`${this.basePath}/requests/${id}/cancel`, { reason });
  }

  recallRequest(id: string): Observable<any> {
    return this.api.post(`${this.basePath}/requests/${id}/recall`, {});
  }

  calculateDays(startDate: string, endDate: string, startDateHalfDay = false, endDateHalfDay = false): Observable<any> {
    return this.api.post(`${this.basePath}/requests/calculate-days`, {
      startDate, endDate, startDateHalfDay, endDateHalfDay
    });
  }

  // Public Holidays
  getHolidays(year?: number): Observable<any> {
    const params: any = {};
    if (year) params.year = year;
    return this.api.get(`${this.basePath}/holidays`, params);
  }

  getHoliday(id: string): Observable<any> {
    return this.api.get(`${this.basePath}/holidays/${id}`);
  }

  createHoliday(dto: PublicHolidayDTO): Observable<any> {
    return this.api.post(`${this.basePath}/holidays`, dto);
  }

  updateHoliday(id: string, dto: PublicHolidayDTO): Observable<any> {
    return this.api.put(`${this.basePath}/holidays/${id}`, dto);
  }

  deleteHoliday(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/holidays/${id}`);
  }

  importHolidays(holidays: PublicHolidayDTO[]): Observable<any> {
    return this.api.post(`${this.basePath}/holidays/import`, holidays);
  }

  // Approver management
  getApprovers(departmentId: string): Observable<any> {
    return this.api.get(`${this.basePath}/approvers/department/${departmentId}`);
  }

  createApprover(dto: any): Observable<any> {
    return this.api.post(`${this.basePath}/approvers`, dto);
  }

  updateApprover(id: string, dto: any): Observable<any> {
    return this.api.put(`${this.basePath}/approvers/${id}`, dto);
  }

  deleteApprover(id: string): Observable<any> {
    return this.api.delete(`${this.basePath}/approvers/${id}`);
  }

  replaceApproverChain(departmentId: string, approvers: any[]): Observable<any> {
    return this.api.put(`${this.basePath}/approvers/department/${departmentId}/chain`, approvers);
  }

  reassignRequest(id: string, newApproverUserId: string, reason: string): Observable<any> {
    return this.api.post(`${this.basePath}/requests/${id}/reassign`, { newApproverUserId, reason });
  }

  // Dashboard
  getDashboard(): Observable<any> {
    return this.api.get(`${this.basePath}/dashboard`);
  }

  getBadgeCounts(): Observable<any> {
    return this.api.get(`${this.basePath}/dashboard/badges`);
  }

  getTeamCalendar(from: string, to: string): Observable<any> {
    return this.api.get(`${this.basePath}/dashboard/team`, { from, to });
  }
}
