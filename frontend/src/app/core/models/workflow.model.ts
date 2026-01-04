export interface Workflow {
  id: string;
  name: string;
  code: string;
  description: string;
  workflowTypeId?: string;
  workflowType?: WorkflowType;
  workflowTypeName?: string;
  icon?: string;
  displayOrder: number;
  requiresApproval: boolean;
  isPublished: boolean;
  isActive: boolean;
  active: boolean;
  versionNumber: number;
  commentsMandatory: boolean;
  commentsMandatoryOnReject: boolean;
  commentsMandatoryOnEscalate: boolean;
  requireAttachments: boolean;
  requireComments: boolean;
  forms?: WorkflowForm[];
  approvers?: WorkflowApprover[];
  sbuIds: string[];
}

export interface WorkflowType {
  id: string;
  name: string;
  code: string;
  description: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface WorkflowForm {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  displayOrder: number;
  icon?: string;
  isMainForm: boolean;
  fields: WorkflowField[];
  fieldGroups: FieldGroup[];
}

export interface FieldGroup {
  id: string;
  formId?: string;
  title: string;
  description?: string;
  displayOrder: number;
  columns: number;
  isCollapsible: boolean;
  collapsible: boolean;
  isCollapsedByDefault: boolean;
  collapsed: boolean;
  cssClass?: string;
  fields?: WorkflowField[];
}

export interface WorkflowField {
  id: string;
  formId?: string;
  fieldGroupId?: string;
  name: string;
  label: string;
  placeholder?: string;
  tooltip?: string;
  fieldType: FieldType;
  type: FieldType | string;
  dataType?: DataType;
  isMandatory: boolean;
  required: boolean;
  isSearchable: boolean;
  isReadonly: boolean;
  readOnly: boolean;
  isHidden: boolean;
  hidden: boolean;
  displayOrder: number;
  columnSpan: number;
  defaultValue?: string;
  minValue?: string;
  maxValue?: string;
  minLength?: number;
  maxLength?: number;
  validationRegex?: string;
  validationMessage?: string;
  customValidationRule?: string;
  customValidationMessage?: string;
  width?: number;
  cssClass?: string;
  options?: FieldOption[];
  dropdownSource?: string;
  dropdownDisplayField?: string;
  dropdownValueField?: string;
  isAttachment: boolean;
  allowedFileTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
  multiple?: boolean;
}

export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  CHECKBOX = 'CHECKBOX',
  CHECKBOX_GROUP = 'CHECKBOX_GROUP',
  RADIO = 'RADIO',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  FILE = 'FILE',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  PASSWORD = 'PASSWORD',
  HIDDEN = 'HIDDEN',
  LABEL = 'LABEL',
  DIVIDER = 'DIVIDER',
  COLOR = 'COLOR'
}

export enum DataType {
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  ALPHANUMERIC = 'ALPHANUMERIC'
}

export interface FieldOption {
  id?: string;
  fieldId?: string;
  label: string;
  value: string;
  displayOrder?: number;
  isDefault?: boolean;
  description?: string;
  icon?: string;
  color?: string;
}

export interface WorkflowApprover {
  id?: string;
  workflowId?: string;
  userId?: string;
  userName?: string;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  approverType?: string;
  roleId?: string;
  email?: string;
  label?: string;
  level: number;
  approvalLimit?: number;
  amountLimit?: number;
  isUnlimited?: boolean;
  canEscalate: boolean;
  escalationTimeoutHours?: number;
  notifyOnPending?: boolean;
  notifyOnApproval?: boolean;
  notifyOnRejection?: boolean;
  emailNotification?: boolean;
  requireComment?: boolean;
  sbuId?: string;
  sbuName?: string;
  displayOrder?: number;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowCode: string;
  workflowIcon?: string;
  referenceNumber: string;
  title?: string;
  summary?: string;
  comments?: string;
  status: InstanceStatus;
  initiatorId: string;
  initiatorName: string;
  initiatorEmail: string;
  currentLevel: number;
  currentApprovalLevel: number;
  currentApproverName?: string;
  currentApproverEmail?: string;
  submittedAt?: string;
  completedAt?: string;
  amount?: number;
  sbuId?: string;
  sbuName?: string;
  fieldValues: WorkflowFieldValue[] | Record<string, any>;
  approvalHistory: ApprovalHistory[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface WorkflowFieldValue {
  fieldName: string;
  fieldLabel: string;
  value: any;
}

export enum InstanceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export interface ApprovalHistory {
  id: string;
  workflowInstanceId: string;
  approverId?: string;
  approverName: string;
  approverEmail?: string;
  level: number;
  action: ApprovalAction | string;
  comments?: string;
  actionDate?: string;
  createdAt: string;
  actionSource?: ActionSource;
}

export enum ApprovalAction {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REASSIGNED = 'REASSIGNED'
}

export enum ActionSource {
  SYSTEM = 'SYSTEM',
  EMAIL = 'EMAIL'
}

export interface Attachment {
  id: string;
  workflowInstanceId?: string;
  originalFilename?: string;
  originalFileName: string;
  contentType?: string;
  fileSize: number;
  description?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface ApprovalRequest {
  workflowInstanceId: string;
  action: ApprovalAction;
  comments?: string;
  escalateToUserId?: string;
  actionSource?: string;
}
