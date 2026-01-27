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
  workflowCategory?: WorkflowCategory;
  requireAttachments: boolean;
  requireComments: boolean;
  showSummary: boolean;
  forms?: WorkflowForm[];
  approvers?: WorkflowApprover[];
  corporateIds?: string[];
  sbuIds: string[];
  branchIds?: string[];
  departmentIds?: string[];
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
  screens?: Screen[];
}

export interface Screen {
  id: string;
  formId?: string;
  title: string;
  description?: string;
  displayOrder: number;
  icon?: string;
  isSummaryScreen?: boolean;
  fieldGroups?: FieldGroup[];
  fields?: WorkflowField[];
}

export interface FieldGroup {
  id: string;
  formId?: string;
  screenId?: string;
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
  screenId?: string;
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
  isUnique: boolean;
  isTitle: boolean;
  isLimited: boolean;
  displayOrder: number;
  columnSpan: number;
  defaultValue?: string;
  minValue?: string;
  maxValue?: string;
  minLength?: number;
  maxLength?: number;
  validation?: string;
  validationRegex?: string;
  validationMessage?: string;
  customValidationRule?: string;
  customValidationMessage?: string;
  visibilityExpression?: string;
  width?: number;
  cssClass?: string;
  options?: FieldOption[];
  optionsLayout?: 'vertical' | 'horizontal';
  dropdownSource?: string;
  dropdownDisplayField?: string;
  dropdownValueField?: string;
  // SQL Object based options
  sqlObjectId?: string;
  optionsSource?: 'STATIC' | 'SQL';
  viewType?: 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX_GROUP';
  isAttachment: boolean;
  allowedFileTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  inSummary?: boolean;
  // New field type specific configurations
  ratingMax?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  // TABLE field specific configurations
  tableColumns?: TableColumn[];
  tableMinRows?: number;
  tableMaxRows?: number;
  tableStriped?: boolean;
  tableBordered?: boolean;
}

export interface TableColumn {
  name: string;
  label: string;
  type: TableColumnType;
  width?: number;
  defaultValue?: string;
  readOnly?: boolean;
}

export enum TableColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX'
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
  COLOR = 'COLOR',
  USER = 'USER',
  // New field types
  TOGGLE = 'TOGGLE',
  YES_NO = 'YES_NO',
  IMAGE = 'IMAGE',
  ICON = 'ICON',
  RATING = 'RATING',
  SIGNATURE = 'SIGNATURE',
  RICH_TEXT = 'RICH_TEXT',
  TIME = 'TIME',
  SLIDER = 'SLIDER',
  BARCODE = 'BARCODE',
  LOCATION = 'LOCATION',
  TABLE = 'TABLE',
  // SQL Object field type - dynamic options from SQL Object tables
  SQL_OBJECT = 'SQL_OBJECT'
}

// View type for SQL_OBJECT field - how to display the options
export enum ViewType {
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  RADIO = 'RADIO',
  CHECKBOX_GROUP = 'CHECKBOX_GROUP'
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
  approverIds?: string[];
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
  currentApproverOrder?: number;
  totalApproversAtLevel?: number;
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
  isCurrentApprover?: boolean;
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
  ON_HOLD = 'ON_HOLD',
  RECALLED = 'RECALLED'
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

export enum WorkflowCategory {
  FINANCIAL = 'FINANCIAL',
  NON_FINANCIAL = 'NON_FINANCIAL'
}

// SQL Object models
export interface SqlObject {
  id: string;
  tableName: string;
  displayName: string;
  description?: string;
  valueColumn?: string;
  labelColumn?: string;
  columns: SqlColumn[];
  isActive: boolean;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SqlColumn {
  id?: string;
  columnName: string;
  displayName: string;
  dataType: SqlColumnDataType;
  columnLength?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  displayOrder: number;
}

export enum SqlColumnDataType {
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  BIGINT = 'BIGINT',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  TIMESTAMP = 'TIMESTAMP'
}
