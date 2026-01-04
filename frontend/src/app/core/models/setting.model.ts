export interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  description?: string;
  type: SettingType;
  category: string;
  tab: string;
  isEncrypted: boolean;
  isSystem: boolean;
  displayOrder: number;
  validationRegex?: string;
  defaultValue?: string;
}

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
  EMAIL = 'EMAIL',
  URL = 'URL',
  PASSWORD = 'PASSWORD',
  JSON = 'JSON',
  LIST = 'LIST'
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  action: AuditAction;
  username: string;
  userId?: string;
  userFullName?: string;
  actionDate: string;
  summary?: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  oldValues?: string;
  newValues?: string;
  changes?: string;
  ipAddress?: string;
  module?: string;
  workflowInstanceId?: string;
  workflowInstanceRef?: string;
  sbuId?: string;
  sbuName?: string;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ESCALATE = 'ESCALATE',
  CANCEL = 'CANCEL',
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  SYSTEM_LOCK = 'SYSTEM_LOCK',
  SYSTEM_UNLOCK = 'SYSTEM_UNLOCK'
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  output: string[];
  command: string;
  executedAt: string;
  executedBy: string;
}
