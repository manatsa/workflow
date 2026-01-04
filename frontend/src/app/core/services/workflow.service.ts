import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Workflow, WorkflowType, WorkflowForm, WorkflowField, FieldGroup,
  WorkflowApprover, WorkflowInstance, ApprovalRequest, Attachment
} from '../models/workflow.model';
import { ApiResponse, PageResponse } from '../models/setting.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  constructor(private api: ApiService) {}

  // Workflows
  getWorkflows(): Observable<ApiResponse<Workflow[]>> {
    return this.api.get<Workflow[]>('/workflows');
  }

  getActiveWorkflows(): Observable<ApiResponse<Workflow[]>> {
    return this.api.get<Workflow[]>('/workflows/active');
  }

  getWorkflowById(id: string): Observable<ApiResponse<Workflow>> {
    return this.api.get<Workflow>(`/workflows/${id}`);
  }

  getWorkflowByCode(code: string): Observable<ApiResponse<Workflow>> {
    return this.api.get<Workflow>(`/workflows/code/${code}`);
  }

  createWorkflow(workflow: Partial<Workflow>): Observable<ApiResponse<Workflow>> {
    return this.api.post<Workflow>('/workflows', workflow);
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): Observable<ApiResponse<Workflow>> {
    return this.api.put<Workflow>(`/workflows/${id}`, workflow);
  }

  publishWorkflow(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/workflows/${id}/publish`, {});
  }

  unpublishWorkflow(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(`/workflows/${id}/unpublish`, {});
  }

  deleteWorkflow(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflows/${id}`);
  }

  // Forms
  saveForm(workflowId: string, form: Partial<WorkflowForm>): Observable<ApiResponse<WorkflowForm>> {
    return this.api.post<WorkflowForm>(`/workflows/${workflowId}/forms`, form);
  }

  deleteForm(formId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflows/forms/${formId}`);
  }

  // Field Groups
  saveFieldGroup(formId: string, group: Partial<FieldGroup>): Observable<ApiResponse<FieldGroup>> {
    return this.api.post<FieldGroup>(`/workflows/forms/${formId}/groups`, group);
  }

  deleteFieldGroup(groupId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflows/groups/${groupId}`);
  }

  // Fields
  saveField(formId: string, field: Partial<WorkflowField>): Observable<ApiResponse<WorkflowField>> {
    return this.api.post<WorkflowField>(`/workflows/forms/${formId}/fields`, field);
  }

  deleteField(fieldId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflows/fields/${fieldId}`);
  }

  // Approvers
  saveApprover(workflowId: string, approver: Partial<WorkflowApprover>): Observable<ApiResponse<WorkflowApprover>> {
    return this.api.post<WorkflowApprover>(`/workflows/${workflowId}/approvers`, approver);
  }

  deleteApprover(approverId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflows/approvers/${approverId}`);
  }

  // Workflow Types
  getWorkflowTypes(): Observable<ApiResponse<WorkflowType[]>> {
    return this.api.get<WorkflowType[]>('/workflow-types');
  }

  createWorkflowType(type: Partial<WorkflowType>): Observable<ApiResponse<WorkflowType>> {
    return this.api.post<WorkflowType>('/workflow-types', type);
  }

  updateWorkflowType(id: string, type: Partial<WorkflowType>): Observable<ApiResponse<WorkflowType>> {
    return this.api.put<WorkflowType>(`/workflow-types/${id}`, type);
  }

  deleteWorkflowType(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflow-types/${id}`);
  }

  // Instances
  getWorkflowInstances(workflowId: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<WorkflowInstance>>> {
    return this.api.getPage<WorkflowInstance>(`/workflow-instances/workflow/${workflowId}`, page, size);
  }

  getMySubmissions(page = 0, size = 20, status?: string): Observable<ApiResponse<PageResponse<WorkflowInstance>>> {
    const params = status ? { status } : {};
    return this.api.getPage<WorkflowInstance>('/workflow-instances/my-submissions', page, size, params);
  }

  getPendingApprovals(page = 0, size = 20): Observable<ApiResponse<PageResponse<WorkflowInstance>>> {
    return this.api.getPage<WorkflowInstance>('/workflow-instances/pending-approvals', page, size);
  }

  getInstanceById(id: string): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.get<WorkflowInstance>(`/workflow-instances/${id}`);
  }

  createInstance(workflowId: string, fieldValues: Record<string, any>, sbuId?: string): Observable<ApiResponse<WorkflowInstance>> {
    const params = sbuId ? `?sbuId=${sbuId}` : '';
    return this.api.post<WorkflowInstance>(`/workflow-instances/workflow/${workflowId}${params}`, fieldValues);
  }

  updateInstance(id: string, fieldValues: Record<string, any>): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.put<WorkflowInstance>(`/workflow-instances/${id}`, fieldValues);
  }

  submitDraftInstance(id: string): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.post<WorkflowInstance>(`/workflow-instances/${id}/submit`, {});
  }

  processApproval(request: ApprovalRequest): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.post<WorkflowInstance>('/workflow-instances/approve', request);
  }

  cancelInstance(id: string, reason?: string): Observable<ApiResponse<void>> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return this.api.post<void>(`/workflow-instances/${id}/cancel${params}`, {});
  }

  deleteInstance(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflow-instances/${id}`);
  }

  cloneInstance(id: string): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.post<WorkflowInstance>(`/workflow-instances/${id}/clone`, {});
  }

  recallInstance(id: string, reason?: string): Observable<ApiResponse<WorkflowInstance>> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return this.api.post<WorkflowInstance>(`/workflow-instances/${id}/recall${params}`, {});
  }

  resubmitInstance(id: string): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.post<WorkflowInstance>(`/workflow-instances/${id}/resubmit`, {});
  }

  // Attachments
  getAttachments(instanceId: string): Observable<ApiResponse<Attachment[]>> {
    return this.api.get<Attachment[]>(`/workflow-instances/${instanceId}/attachments`);
  }

  uploadAttachment(instanceId: string, file: File, description?: string): Observable<ApiResponse<Attachment>> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return this.api.upload<Attachment>(`/workflow-instances/${instanceId}/attachments`, formData);
  }

  downloadAttachment(attachmentId: string): Observable<Blob> {
    return this.api.download(`/workflow-instances/attachments/${attachmentId}/download`);
  }

  deleteAttachment(attachmentId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/workflow-instances/attachments/${attachmentId}`);
  }

  // Additional methods used by components
  getWorkflow(id: string): Observable<ApiResponse<Workflow>> {
    return this.api.get<Workflow>(`/workflows/${id}`);
  }

  getInstance(id: string): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.get<WorkflowInstance>(`/workflow-instances/${id}`);
  }

  getInstancesByWorkflow(workflowCode: string, page: number = 0, size: number = 100): Observable<ApiResponse<PageResponse<WorkflowInstance>>> {
    return this.api.getPage<WorkflowInstance>(`/workflow-instances/workflow/code/${workflowCode}`, page, size);
  }

  toggleWorkflowActive(id: string, active: boolean): Observable<ApiResponse<Workflow>> {
    return this.api.put<Workflow>(`/workflows/${id}/active`, { active });
  }

  duplicateWorkflow(id: string): Observable<ApiResponse<Workflow>> {
    return this.api.post<Workflow>(`/workflows/${id}/duplicate`, {});
  }

  exportWorkflow(id: string): Observable<Blob> {
    return this.api.download(`/workflows/${id}/export`);
  }

  submitInstance(data: FormData): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.upload<WorkflowInstance>('/workflow-instances/submit', data);
  }

  submitApproval(data: { instanceId: string; action: string; comments?: string }): Observable<ApiResponse<WorkflowInstance>> {
    return this.api.post<WorkflowInstance>('/workflow-instances/approval', data);
  }
}
