package com.sonar.workflow.controller;

import com.sonar.workflow.dto.*;
import com.sonar.workflow.security.CustomUserDetails;
import com.sonar.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowDTO>>> getAllWorkflows() {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getAllWorkflows()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<WorkflowDTO>>> getActiveWorkflows(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        if (userDetails.isSuperUser() || userDetails.getSbuIds().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(workflowService.getActivePublishedWorkflows()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                workflowService.getWorkflowsForUser(userDetails.getSbuIds().stream().toList())));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<WorkflowDTO>>> searchWorkflows(
            @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.searchWorkflows(q, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowDTO>> getWorkflowById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getWorkflowById(id)));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<WorkflowDTO>> getWorkflowByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getWorkflowByCode(code)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDTO>> createWorkflow(@Valid @RequestBody WorkflowDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Workflow created", workflowService.createWorkflow(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDTO>> updateWorkflow(
            @PathVariable UUID id, @Valid @RequestBody WorkflowDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Workflow updated", workflowService.updateWorkflow(id, dto)));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> publishWorkflow(@PathVariable UUID id) {
        workflowService.publishWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow published", null));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unpublishWorkflow(@PathVariable UUID id) {
        workflowService.unpublishWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow unpublished", null));
    }

    @PostMapping("/{workflowId}/forms")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowFormDTO>> saveForm(
            @PathVariable UUID workflowId, @Valid @RequestBody WorkflowFormDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Form saved", workflowService.saveForm(workflowId, dto)));
    }

    @PostMapping("/forms/{formId}/groups")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<FieldGroupDTO>> saveFieldGroup(
            @PathVariable UUID formId, @Valid @RequestBody FieldGroupDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Field group saved", workflowService.saveFieldGroup(formId, dto)));
    }

    @PostMapping("/forms/{formId}/fields")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowFieldDTO>> saveField(
            @PathVariable UUID formId, @Valid @RequestBody WorkflowFieldDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Field saved", workflowService.saveField(formId, dto)));
    }

    @PostMapping("/{workflowId}/approvers")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowApproverDTO>> saveApprover(
            @PathVariable UUID workflowId, @Valid @RequestBody WorkflowApproverDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Approver saved", workflowService.saveApprover(workflowId, dto)));
    }

    @DeleteMapping("/forms/{formId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteForm(@PathVariable UUID formId) {
        workflowService.deleteForm(formId);
        return ResponseEntity.ok(ApiResponse.success("Form deleted", null));
    }

    @DeleteMapping("/groups/{groupId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFieldGroup(@PathVariable UUID groupId) {
        workflowService.deleteFieldGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success("Field group deleted", null));
    }

    @DeleteMapping("/fields/{fieldId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable UUID fieldId) {
        workflowService.deleteField(fieldId);
        return ResponseEntity.ok(ApiResponse.success("Field deleted", null));
    }

    @DeleteMapping("/approvers/{approverId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteApprover(@PathVariable UUID approverId) {
        workflowService.deleteApprover(approverId);
        return ResponseEntity.ok(ApiResponse.success("Approver deleted", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflow(@PathVariable UUID id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow deleted", null));
    }

    @GetMapping("/{id}/export")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<byte[]> exportWorkflow(@PathVariable UUID id) {
        byte[] jsonData = workflowService.exportWorkflow(id);
        WorkflowDTO workflow = workflowService.getWorkflowById(id);
        String filename = (workflow.getCode() != null ? workflow.getCode() : "workflow") + "_export.json";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(jsonData);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('WORKFLOW_BUILDER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDTO>> importWorkflow(@RequestParam("file") MultipartFile file) {
        WorkflowDTO imported = workflowService.importWorkflow(file);
        return ResponseEntity.ok(ApiResponse.success("Workflow imported successfully", imported));
    }
}
