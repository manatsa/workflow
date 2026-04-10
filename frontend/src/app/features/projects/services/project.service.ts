import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PageResponse } from '../../../core/models/setting.model';

// ==================== INTERFACES ====================

export interface ProjectCategoryDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ProjectDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  stage: string;
  priority: string;
  category: string;
  categoryId: string;
  categoryCode: string;
  startDate: string;
  endDate: string;
  actualStartDate: string;
  actualEndDate: string;
  estimatedBudget: number;
  actualCost: number;
  completionPercentage: number;
  managerId: string;
  sponsorId: string;
  sbuId: string;
  managerName: string;
  sponsorName: string;
  sbuName: string;
  approvedBy: string;
  approvedAt: string;
  currentApprovalLevel: number;
  currentApproverId: string;
  currentApproverName: string;
  submittedForApprovalAt: string;
  submittedBy: string;
  isCurrentUserApprover: boolean;
  approvalSteps: ProjectApprovalStepDTO[];
  notes: string;
  objectives: string;
  scope: string;
  deliverables: string;
  assumptions: string;
  constraints: string;
  taskCount: number;
  completedTaskCount: number;
  teamMemberCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface ProjectSummaryDTO {
  id: string;
  code: string;
  name: string;
  status: string;
  stage: string;
  priority: string;
  managerName: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  taskCount: number;
  completedTaskCount: number;
  estimatedBudget: number;
  actualCost: number;
}

export interface ProjectTaskDTO {
  id: string;
  projectId: string;
  phaseId: string;
  milestoneId: string;
  parentTaskId: string;
  assigneeId: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  assigneeName: string;
  phaseName: string;
  milestoneName: string;
  startDate: string;
  dueDate: string;
  actualStartDate: string;
  actualEndDate: string;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
  sortOrder: number;
  isCriticalPath: boolean;
  dependencyTaskIds: string[];
  tags: string;
  checklists: ProjectTaskChecklistDTO[];
  comments: ProjectTaskCommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhaseDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  completionPercentage: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestoneDTO {
  id: string;
  projectId: string;
  ownerId: string;
  name: string;
  description: string;
  status: string;
  ownerName: string;
  dueDate: string;
  completedDate: string;
  sortOrder: number;
  isCritical: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTeamMemberDTO {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  userName: string;
  userEmail: string;
  joinDate: string;
  leaveDate: string;
  allocationPercentage: number;
  responsibilities: string;
  createdAt: string;
}

export interface RiskIssueCategoryDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRiskDTO {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  description: string;
  probability: string;
  impact: string;
  status: string;
  ownerName: string;
  mitigationPlan: string;
  contingencyPlan: string;
  identifiedDate: string;
  responseDate: string;
  riskCategory: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIssueDTO {
  id: string;
  projectId: string;
  assigneeId: string;
  reportedById: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  categoryId: string;
  categoryName: string;
  assigneeName: string;
  reportedByName: string;
  reportedDate: string;
  dueDate: string;
  resolvedDate: string;
  resolution: string;
  impactDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentDTO {
  id: string;
  projectId: string;
  uploadedById: string;
  name: string;
  fileName: string;
  filePath: string;
  contentType: string;
  category: string;
  description: string;
  uploadedByName: string;
  fileSize: number;
  documentVersion: number;
  createdAt: string;
}

export interface ProjectBudgetLineDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
  category: string;
  estimatedAmount: number;
  actualAmount: number;
  committedAmount: number;
  variance: number;
  originalEstimate: number;
  approvedAmount: number;
  forecastAmount: number;
  notes: string;
  adjustmentNotes: string;
  variancePercentage: number;
  adjustmentCount: number;
  adjustments: ProjectBudgetAdjustmentDTO[];
  budgetDate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBudgetAdjustmentDTO {
  id: string;
  budgetLineId: string;
  adjustmentType: string;
  previousEstimated: number;
  newEstimated: number;
  previousActual: number;
  newActual: number;
  adjustmentAmount: number;
  notes: string;
  adjustedBy: string;
  adjustedAt: string;
  createdAt: string;
}

export interface ProjectChecklistDTO {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: string;
  isTemplate: boolean;
  sortOrder: number;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  items: ProjectChecklistItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectChecklistItemDTO {
  id: string;
  checklistId: string;
  completedById: string;
  name: string;
  description: string;
  isCompleted: boolean;
  isMandatory: boolean;
  completedByName: string;
  completedAt: string;
  sortOrder: number;
}

export interface ProjectApprovalStepDTO {
  id: string;
  projectId: string;
  approverUserId: string;
  approverName: string;
  approverEmail: string;
  level: number;
  displayOrder: number;
  approvalLimit: number;
  isUnlimited: boolean;
  status: string;
  action: string;
  comments: string;
  actionDate: string;
  createdAt: string;
}

export interface ProjectSettingsDTO {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string;
  settingType: string;
  settingGroup: string;
  options: string;
  isSystem: boolean;
}

export interface ProjectStatusHistoryDTO {
  id: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
  fromStage: string;
  toStage: string;
  reason: string;
  changedBy: string;
  createdAt: string;
}

export interface ProjectTaskChecklistDTO {
  id: string;
  taskId: string;
  completedById: string;
  name: string;
  isCompleted: boolean;
  completedByName: string;
  completedAt: string;
  sortOrder: number;
}

export interface ProjectTaskCommentDTO {
  id: string;
  taskId: string;
  authorId: string;
  parentCommentId: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface ProjectTimeLogDTO {
  id: string;
  taskId: string;
  userId: string;
  taskName: string;
  userName: string;
  logDate: string;
  hours: number;
  description: string;
  isBillable: boolean;
  createdAt: string;
}

export interface ProjectDocumentTemplateDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface ProjectDashboardDTO {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalBudget: number;
  totalActualCost: number;
  averageCompletion: number;
  projectsByStatus: { [key: string]: number };
  projectsByPriority: { [key: string]: number };
  projectsByStage: { [key: string]: number };
  recentProjects: ProjectSummaryDTO[];
  recentActivities: ProjectActivityDTO[];
}

export interface ProjectActivityDTO {
  id: string;
  projectId: string;
  userId: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  userName: string;
  timestamp: string;
}

export interface GanttChartDTO {
  tasks: GanttTask[];
  projectStartDate: string;
  projectEndDate: string;
}

export interface GanttTask {
  id: string;
  parentId: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  dependencies: string[];
  assigneeName: string;
  isCriticalPath: boolean;
  isMilestone: boolean;
}

export interface ProjectReportDTO {
  reportType: string;
  reportTitle: string;
  generatedAt: string;
  generatedBy: string;
  parameters: { [key: string]: any };
  data: any;
  tableData: { [key: string]: any }[];
  summary: { [key: string]: any };
}

export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string;
  priority?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  estimatedBudget?: number;
  managerId?: string;
  sponsorId?: string;
  sbuId?: string;
  notes?: string;
  objectives?: string;
  scope?: string;
  deliverables?: string;
  assumptions?: string;
  constraints?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  priority?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedBudget?: number;
  managerId?: string;
  sponsorId?: string;
  sbuId?: string;
  completionPercentage?: number;
  notes?: string;
  objectives?: string;
  scope?: string;
  deliverables?: string;
  assumptions?: string;
  constraints?: string;
}

// ==================== PROJECT SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private basePath = '/projects';

  constructor(private api: ApiService) {}

  // Projects
  getAllProjects(): Observable<ApiResponse<ProjectSummaryDTO[]>> {
    return this.api.get(this.basePath);
  }

  searchProjects(search: string, page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc'): Observable<ApiResponse<PageResponse<ProjectSummaryDTO>>> {
    return this.api.getPage(`${this.basePath}/search`, page, size, { search, sortBy, sortDir });
  }

  getProjectsByStatus(status: string): Observable<ApiResponse<ProjectSummaryDTO[]>> {
    return this.api.get(`${this.basePath}/by-status/${status}`);
  }

  getProjectsByManager(managerId: string): Observable<ApiResponse<ProjectSummaryDTO[]>> {
    return this.api.get(`${this.basePath}/by-manager/${managerId}`);
  }

  getProjectById(id: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.get(`${this.basePath}/${id}`);
  }

  getProjectByCode(code: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.get(`${this.basePath}/code/${code}`);
  }

  generateCode(category: string): Observable<ApiResponse<string>> {
    return this.api.get(`${this.basePath}/generate-code?category=${encodeURIComponent(category || '')}`);
  }

  createProject(request: CreateProjectRequest): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(this.basePath, request);
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<ApiResponse<ProjectDTO>> {
    return this.api.put(`${this.basePath}/${id}`, request);
  }

  deleteProject(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${id}`);
  }

  // Status & Stage
  submitForApproval(id: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(`${this.basePath}/${id}/submit`, {});
  }

  approveProject(id: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(`${this.basePath}/${id}/approve`, {});
  }

  rejectProject(id: string, reason: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(`${this.basePath}/${id}/reject?reason=${encodeURIComponent(reason)}`, {});
  }

  transitionStage(id: string, targetStage: string, reason?: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(`${this.basePath}/${id}/transition`, { targetStage, reason });
  }

  updateStatus(id: string, status: string, reason?: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.put(`${this.basePath}/${id}/status?status=${status}${reason ? '&reason=' + encodeURIComponent(reason) : ''}`, {});
  }

  // Approval
  processApproval(id: string, action: string, comments?: string): Observable<ApiResponse<ProjectDTO>> {
    return this.api.post(`${this.basePath}/${id}/approval`, { action, comments });
  }

  getApprovalSteps(id: string): Observable<ApiResponse<ProjectApprovalStepDTO[]>> {
    return this.api.get(`${this.basePath}/${id}/approval-steps`);
  }

  // Team
  getTeamMembers(projectId: string): Observable<ApiResponse<ProjectTeamMemberDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/team`);
  }

  addTeamMember(projectId: string, member: Partial<ProjectTeamMemberDTO>): Observable<ApiResponse<ProjectTeamMemberDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/team`, member);
  }

  updateTeamMember(projectId: string, memberId: string, member: Partial<ProjectTeamMemberDTO>): Observable<ApiResponse<ProjectTeamMemberDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/team/${memberId}`, member);
  }

  removeTeamMember(projectId: string, memberId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/team/${memberId}`);
  }

  // Phases
  getPhases(projectId: string): Observable<ApiResponse<ProjectPhaseDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/phases`);
  }

  createPhase(projectId: string, phase: Partial<ProjectPhaseDTO>): Observable<ApiResponse<ProjectPhaseDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/phases`, phase);
  }

  updatePhase(projectId: string, phaseId: string, phase: Partial<ProjectPhaseDTO>): Observable<ApiResponse<ProjectPhaseDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/phases/${phaseId}`, phase);
  }

  deletePhase(projectId: string, phaseId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/phases/${phaseId}`);
  }

  // Milestones
  getMilestones(projectId: string): Observable<ApiResponse<ProjectMilestoneDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/milestones`);
  }

  createMilestone(projectId: string, milestone: Partial<ProjectMilestoneDTO>): Observable<ApiResponse<ProjectMilestoneDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/milestones`, milestone);
  }

  updateMilestone(projectId: string, milestoneId: string, milestone: Partial<ProjectMilestoneDTO>): Observable<ApiResponse<ProjectMilestoneDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/milestones/${milestoneId}`, milestone);
  }

  deleteMilestone(projectId: string, milestoneId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/milestones/${milestoneId}`);
  }

  // Risks
  getRisks(projectId: string): Observable<ApiResponse<ProjectRiskDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/risks`);
  }

  createRisk(projectId: string, risk: Partial<ProjectRiskDTO>): Observable<ApiResponse<ProjectRiskDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/risks`, risk);
  }

  updateRisk(projectId: string, riskId: string, risk: Partial<ProjectRiskDTO>): Observable<ApiResponse<ProjectRiskDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/risks/${riskId}`, risk);
  }

  deleteRisk(projectId: string, riskId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/risks/${riskId}`);
  }

  // Issues
  getIssues(projectId: string): Observable<ApiResponse<ProjectIssueDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/issues`);
  }

  createIssue(projectId: string, issue: Partial<ProjectIssueDTO>): Observable<ApiResponse<ProjectIssueDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/issues`, issue);
  }

  updateIssue(projectId: string, issueId: string, issue: Partial<ProjectIssueDTO>): Observable<ApiResponse<ProjectIssueDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/issues/${issueId}`, issue);
  }

  deleteIssue(projectId: string, issueId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/issues/${issueId}`);
  }

  // Budget
  getBudgetLines(projectId: string): Observable<ApiResponse<ProjectBudgetLineDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/budget`);
  }

  createBudgetLine(projectId: string, line: Partial<ProjectBudgetLineDTO>): Observable<ApiResponse<ProjectBudgetLineDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/budget`, line);
  }

  updateBudgetLine(projectId: string, lineId: string, line: Partial<ProjectBudgetLineDTO>): Observable<ApiResponse<ProjectBudgetLineDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/budget/${lineId}`, line);
  }

  deleteBudgetLine(projectId: string, lineId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/budget/${lineId}`);
  }

  getBudgetAdjustments(projectId: string, lineId: string): Observable<ApiResponse<ProjectBudgetAdjustmentDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/budget/${lineId}/adjustments`);
  }

  getProjectBudgetAdjustments(projectId: string): Observable<ApiResponse<ProjectBudgetAdjustmentDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/budget-adjustments`);
  }

  addBudgetAdjustment(projectId: string, lineId: string, dto: Partial<ProjectBudgetAdjustmentDTO>): Observable<ApiResponse<ProjectBudgetAdjustmentDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/budget/${lineId}/adjustments`, dto);
  }

  // Documents
  getDocuments(projectId: string): Observable<ApiResponse<ProjectDocumentDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/documents`);
  }

  addDocument(projectId: string, doc: Partial<ProjectDocumentDTO>): Observable<ApiResponse<ProjectDocumentDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/documents`, doc);
  }

  deleteDocument(projectId: string, documentId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/documents/${documentId}`);
  }

  // Checklists
  getChecklists(projectId: string): Observable<ApiResponse<ProjectChecklistDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/checklists`);
  }

  getTemplateChecklists(projectId: string): Observable<ApiResponse<ProjectChecklistDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/checklists/templates`);
  }

  createChecklist(projectId: string, checklist: Partial<ProjectChecklistDTO>): Observable<ApiResponse<ProjectChecklistDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/checklists`, checklist);
  }

  updateChecklist(projectId: string, checklistId: string, checklist: Partial<ProjectChecklistDTO>): Observable<ApiResponse<ProjectChecklistDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/checklists/${checklistId}`, checklist);
  }

  deleteChecklist(projectId: string, checklistId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/checklists/${checklistId}`);
  }

  applyTemplate(projectId: string, templateId: string): Observable<ApiResponse<ProjectChecklistDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/checklists/apply-template/${templateId}`, {});
  }

  addChecklistItem(projectId: string, checklistId: string, item: Partial<ProjectChecklistItemDTO>): Observable<ApiResponse<ProjectChecklistItemDTO>> {
    return this.api.post(`${this.basePath}/${projectId}/checklists/${checklistId}/items`, item);
  }

  toggleChecklistItem(projectId: string, checklistId: string, itemId: string, completedById?: string): Observable<ApiResponse<ProjectChecklistItemDTO>> {
    const params = completedById ? `?completedById=${completedById}` : '';
    return this.api.put(`${this.basePath}/${projectId}/checklists/${checklistId}/items/${itemId}/toggle${params}`, {});
  }

  deleteChecklistItem(projectId: string, checklistId: string, itemId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${projectId}/checklists/${checklistId}/items/${itemId}`);
  }

  updateChecklistItem(projectId: string, checklistId: string, itemId: string, item: Partial<ProjectChecklistItemDTO>): Observable<ApiResponse<ProjectChecklistItemDTO>> {
    return this.api.put(`${this.basePath}/${projectId}/checklists/${checklistId}/items/${itemId}`, item);
  }

  // Document Upload/Download
  uploadDocument(projectId: string, file: File, name: string, category: string, description: string): Observable<ApiResponse<ProjectDocumentDTO>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);
    formData.append('description', description || '');
    return this.api.upload(`${this.basePath}/${projectId}/documents/upload`, formData);
  }

  downloadDocument(projectId: string, documentId: string): Observable<Blob> {
    return this.api.download(`${this.basePath}/${projectId}/documents/${documentId}/download`);
  }

  // Activities
  getActivities(projectId: string): Observable<ApiResponse<ProjectActivityDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/activities`);
  }

  // Status History
  getStatusHistory(projectId: string): Observable<ApiResponse<ProjectStatusHistoryDTO[]>> {
    return this.api.get(`${this.basePath}/${projectId}/history`);
  }

  // Dashboard
  getDashboard(): Observable<ApiResponse<ProjectDashboardDTO>> {
    return this.api.get(`${this.basePath}/dashboard`);
  }
}

// ==================== TASK SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectTaskService {
  constructor(private api: ApiService) {}

  private taskPath(projectId: string) { return `/projects/${projectId}/tasks`; }

  getTasks(projectId: string): Observable<ApiResponse<ProjectTaskDTO[]>> {
    return this.api.get(this.taskPath(projectId));
  }

  getTask(projectId: string, taskId: string): Observable<ApiResponse<ProjectTaskDTO>> {
    return this.api.get(`${this.taskPath(projectId)}/${taskId}`);
  }

  getTasksByStatus(projectId: string, status: string): Observable<ApiResponse<ProjectTaskDTO[]>> {
    return this.api.get(`${this.taskPath(projectId)}/by-status/${status}`);
  }

  createTask(projectId: string, task: Partial<ProjectTaskDTO>): Observable<ApiResponse<ProjectTaskDTO>> {
    return this.api.post(this.taskPath(projectId), task);
  }

  updateTask(projectId: string, taskId: string, task: Partial<ProjectTaskDTO>): Observable<ApiResponse<ProjectTaskDTO>> {
    return this.api.put(`${this.taskPath(projectId)}/${taskId}`, task);
  }

  deleteTask(projectId: string, taskId: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.taskPath(projectId)}/${taskId}`);
  }

  addDependency(projectId: string, taskId: string, dependsOnId: string): Observable<ApiResponse<ProjectTaskDTO>> {
    return this.api.post(`${this.taskPath(projectId)}/${taskId}/dependencies/${dependsOnId}`, {});
  }

  removeDependency(projectId: string, taskId: string, dependsOnId: string): Observable<ApiResponse<ProjectTaskDTO>> {
    return this.api.delete(`${this.taskPath(projectId)}/${taskId}/dependencies/${dependsOnId}`);
  }

  getComments(projectId: string, taskId: string): Observable<ApiResponse<ProjectTaskCommentDTO[]>> {
    return this.api.get(`${this.taskPath(projectId)}/${taskId}/comments`);
  }

  addComment(projectId: string, taskId: string, comment: Partial<ProjectTaskCommentDTO>): Observable<ApiResponse<ProjectTaskCommentDTO>> {
    return this.api.post(`${this.taskPath(projectId)}/${taskId}/comments`, comment);
  }

  getTimeLogs(projectId: string, taskId: string): Observable<ApiResponse<ProjectTimeLogDTO[]>> {
    return this.api.get(`${this.taskPath(projectId)}/${taskId}/time-logs`);
  }

  logTime(projectId: string, taskId: string, log: Partial<ProjectTimeLogDTO>): Observable<ApiResponse<ProjectTimeLogDTO>> {
    return this.api.post(`${this.taskPath(projectId)}/${taskId}/time-logs`, log);
  }

  getGanttChart(projectId: string): Observable<ApiResponse<GanttChartDTO>> {
    return this.api.get(`${this.taskPath(projectId)}/gantt`);
  }
}

// ==================== REPORT SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectReportService {
  constructor(private api: ApiService) {}

  getStatusReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/status/${projectId}`);
  }

  getBudgetReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/budget/${projectId}`);
  }

  getTaskReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/tasks/${projectId}`);
  }

  getRiskReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/risks/${projectId}`);
  }

  getTimeReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/time/${projectId}`);
  }

  getMilestoneReport(projectId: string): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get(`/projects/reports/milestones/${projectId}`);
  }

  getPortfolioReport(): Observable<ApiResponse<ProjectReportDTO>> {
    return this.api.get('/projects/reports/portfolio');
  }
}

// ==================== SETTINGS SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectSettingsService {
  constructor(private api: ApiService) {}

  getAllSettings(): Observable<ApiResponse<ProjectSettingsDTO[]>> {
    return this.api.get('/projects/settings');
  }

  getSettingsByGroup(group: string): Observable<ApiResponse<ProjectSettingsDTO[]>> {
    return this.api.get(`/projects/settings/group/${group}`);
  }

  getSettingByKey(key: string): Observable<ApiResponse<ProjectSettingsDTO>> {
    return this.api.get(`/projects/settings/key/${key}`);
  }

  saveSetting(setting: Partial<ProjectSettingsDTO>): Observable<ApiResponse<ProjectSettingsDTO>> {
    return this.api.post('/projects/settings', setting);
  }

  deleteSetting(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`/projects/settings/${id}`);
  }

  initializeDefaults(): Observable<ApiResponse<void>> {
    return this.api.post('/projects/settings/initialize', {});
  }
}

// ==================== IMPORT SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectImportService {
  constructor(private api: ApiService) {}

  downloadProjectTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/projects');
  }

  downloadTaskTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/tasks');
  }

  importProjects(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/projects', formData);
  }

  importTasks(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/tasks', formData);
  }

  downloadTeamMemberTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/team-members');
  }

  importTeamMembers(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/team-members', formData);
  }

  downloadBudgetLineTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/budget-lines');
  }

  importBudgetLines(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/budget-lines', formData);
  }

  downloadRiskTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/risks');
  }

  importRisks(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/risks', formData);
  }

  downloadIssueTemplate(): Observable<Blob> {
    return this.api.download('/projects/import/template/issues');
  }

  importIssues(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.uploadBlob('/projects/import/issues', formData);
  }
}

// ==================== PROJECT CATEGORY SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ProjectCategoryService {
  private basePath = '/project-categories';

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<ProjectCategoryDTO[]>> {
    return this.api.get(this.basePath);
  }

  getActive(): Observable<ApiResponse<ProjectCategoryDTO[]>> {
    return this.api.get(`${this.basePath}/active`);
  }

  getById(id: string): Observable<ApiResponse<ProjectCategoryDTO>> {
    return this.api.get(`${this.basePath}/${id}`);
  }

  create(category: Partial<ProjectCategoryDTO>): Observable<ApiResponse<ProjectCategoryDTO>> {
    return this.api.post(this.basePath, category);
  }

  update(id: string, category: Partial<ProjectCategoryDTO>): Observable<ApiResponse<ProjectCategoryDTO>> {
    return this.api.put(`${this.basePath}/${id}`, category);
  }

  activate(id: string): Observable<ApiResponse<ProjectCategoryDTO>> {
    return this.api.post(`${this.basePath}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<ApiResponse<ProjectCategoryDTO>> {
    return this.api.post(`${this.basePath}/${id}/deactivate`, {});
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectDocumentTemplateService {
  private basePath = '/api/projects/document-templates';

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<ProjectDocumentTemplateDTO[]>> {
    return this.api.get(this.basePath);
  }

  getByCategory(category: string): Observable<ApiResponse<ProjectDocumentTemplateDTO[]>> {
    return this.api.get(`${this.basePath}/category/${category}`);
  }

  upload(file: File, code: string, name: string, description: string, category: string): Observable<ApiResponse<ProjectDocumentTemplateDTO>> {
    const formData = new FormData();
    formData.append('file', file);
    if (code) formData.append('code', code);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('category', category || 'GENERAL');
    return this.api.upload(this.basePath, formData);
  }

  download(id: string): Observable<Blob> {
    return this.api.download(`${this.basePath}/${id}/download`);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${id}`);
  }
}

// ==================== RISK/ISSUE CATEGORY SERVICE ====================

@Injectable({ providedIn: 'root' })
export class RiskIssueCategoryService {
  private basePath = '/risk-issue-categories';

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<RiskIssueCategoryDTO[]>> {
    return this.api.get(this.basePath);
  }

  getByType(type: string): Observable<ApiResponse<RiskIssueCategoryDTO[]>> {
    return this.api.get(`${this.basePath}/by-type/${type}`);
  }

  getById(id: string): Observable<ApiResponse<RiskIssueCategoryDTO>> {
    return this.api.get(`${this.basePath}/${id}`);
  }

  create(category: Partial<RiskIssueCategoryDTO>): Observable<ApiResponse<RiskIssueCategoryDTO>> {
    return this.api.post(this.basePath, category);
  }

  update(id: string, category: Partial<RiskIssueCategoryDTO>): Observable<ApiResponse<RiskIssueCategoryDTO>> {
    return this.api.put(`${this.basePath}/${id}`, category);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.basePath}/${id}`);
  }
}
