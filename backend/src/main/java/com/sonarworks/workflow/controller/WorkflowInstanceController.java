package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.*;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.service.AttachmentService;
import com.sonarworks.workflow.service.WorkflowInstanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflow-instances")
@RequiredArgsConstructor
public class WorkflowInstanceController {

    private final WorkflowInstanceService workflowInstanceService;
    private final AttachmentService attachmentService;
    private final ObjectMapper objectMapper;

    @GetMapping("/workflow/{workflowId}")
    public ResponseEntity<ApiResponse<Page<WorkflowInstanceDTO>>> getWorkflowInstances(
            @PathVariable UUID workflowId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getWorkflowInstances(workflowId, pageable)));
    }

    @GetMapping("/workflow/code/{workflowCode}")
    public ResponseEntity<ApiResponse<Page<WorkflowInstanceDTO>>> getWorkflowInstancesByCode(
            @PathVariable String workflowCode, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getWorkflowInstancesByCode(workflowCode, pageable)));
    }

    @GetMapping("/my-submissions")
    public ResponseEntity<ApiResponse<Page<WorkflowInstanceDTO>>> getMySubmissions(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getMySubmissions(pageable)));
    }

    @GetMapping("/my-submissions/count")
    public ResponseEntity<ApiResponse<Long>> getMySubmissionsCount() {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getMySubmissionsCount()));
    }

    @GetMapping("/my-submissions/pending-count")
    public ResponseEntity<ApiResponse<Long>> getMyPendingSubmissionsCount() {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getMyPendingSubmissionsCount()));
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<ApiResponse<Page<WorkflowInstanceDTO>>> getPendingApprovals(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getPendingApprovals(pageable)));
    }

    @GetMapping("/pending-approvals/count")
    public ResponseEntity<ApiResponse<Long>> getPendingApprovalsCount() {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getPendingApprovalsCount()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<WorkflowInstanceDTO>>> searchInstances(
            @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.searchInstances(q, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> getInstanceById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getInstanceById(id)));
    }

    @GetMapping("/reference/{referenceNumber}")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> getInstanceByReference(@PathVariable String referenceNumber) {
        return ResponseEntity.ok(ApiResponse.success(workflowInstanceService.getInstanceByReferenceNumber(referenceNumber)));
    }

    @PostMapping("/workflow/{workflowId}")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> createInstance(
            @PathVariable UUID workflowId,
            @RequestBody Map<String, Object> fieldValues,
            @RequestParam(required = false) UUID sbuId) {
        return ResponseEntity.ok(ApiResponse.success("Instance created",
                workflowInstanceService.createInstance(workflowId, fieldValues, sbuId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> updateInstance(
            @PathVariable UUID id, @RequestBody Map<String, Object> fieldValues) {
        return ResponseEntity.ok(ApiResponse.success("Instance updated",
                workflowInstanceService.updateInstance(id, fieldValues)));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> submitInstance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Instance submitted",
                workflowInstanceService.submitInstance(id)));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> createAndSubmitInstance(
            @RequestParam("workflowCode") String workflowCode,
            @RequestParam("isDraft") Boolean isDraft,
            @RequestParam(value = "comments", required = false) String comments,
            @RequestParam("fieldValues") String fieldValuesJson,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        try {
            Map<String, Object> fieldValues = objectMapper.readValue(fieldValuesJson,
                    new TypeReference<Map<String, Object>>() {});

            WorkflowInstanceDTO instance = workflowInstanceService.createAndSubmitInstance(
                    workflowCode, fieldValues, isDraft, comments, attachments);

            String message = isDraft ? "Draft saved successfully" : "Submission created successfully";
            return ResponseEntity.ok(ApiResponse.success(message, instance));
        } catch (BusinessException e) {
            throw e; // Re-throw business exceptions as-is
        } catch (Exception e) {
            throw new RuntimeException("Failed to process submission: " + e.getMessage(), e);
        }
    }

    @PostMapping("/{id}/update")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> updateInstance(
            @PathVariable UUID id,
            @RequestParam("workflowCode") String workflowCode,
            @RequestParam("isDraft") Boolean isDraft,
            @RequestParam(value = "comments", required = false) String comments,
            @RequestParam("fieldValues") String fieldValuesJson,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments) {
        try {
            Map<String, Object> fieldValues = objectMapper.readValue(fieldValuesJson,
                    new TypeReference<Map<String, Object>>() {});

            WorkflowInstanceDTO instance = workflowInstanceService.updateAndSubmitInstance(
                    id, fieldValues, isDraft, comments, attachments);

            String message = isDraft ? "Draft updated successfully" : "Submission updated successfully";
            return ResponseEntity.ok(ApiResponse.success(message, instance));
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update submission: " + e.getMessage(), e);
        }
    }

    @PostMapping("/approve")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> processApproval(@Valid @RequestBody ApprovalRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Approval processed",
                workflowInstanceService.processApproval(request)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelInstance(
            @PathVariable UUID id, @RequestParam(required = false) String reason) {
        workflowInstanceService.cancelInstance(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Instance cancelled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInstance(@PathVariable UUID id) {
        workflowInstanceService.deleteInstance(id);
        return ResponseEntity.ok(ApiResponse.success("Instance deleted", null));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> cloneInstance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Instance cloned",
                workflowInstanceService.cloneInstance(id)));
    }

    @PostMapping("/{id}/recall")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> recallInstance(
            @PathVariable UUID id, @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success("Instance recalled",
                workflowInstanceService.recallInstance(id, reason)));
    }

    @PostMapping("/{id}/resubmit")
    public ResponseEntity<ApiResponse<WorkflowInstanceDTO>> resubmitInstance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Instance resubmitted",
                workflowInstanceService.resubmitInstance(id)));
    }

    // Attachment endpoints
    @GetMapping("/{instanceId}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable UUID instanceId) {
        return ResponseEntity.ok(ApiResponse.success(attachmentService.getAttachments(instanceId)));
    }

    @PostMapping("/{instanceId}/attachments")
    public ResponseEntity<ApiResponse<AttachmentDTO>> uploadAttachment(
            @PathVariable UUID instanceId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(ApiResponse.success("Attachment uploaded",
                attachmentService.uploadAttachment(instanceId, file, description)));
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID attachmentId) {
        Resource resource = attachmentService.downloadAttachment(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"download\"")
                .body(resource);
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted", null));
    }
}
