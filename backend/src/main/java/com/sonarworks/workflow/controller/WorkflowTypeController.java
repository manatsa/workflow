package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.WorkflowTypeDTO;
import com.sonarworks.workflow.service.WorkflowTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflow-types")
@RequiredArgsConstructor
public class WorkflowTypeController {

    private final WorkflowTypeService workflowTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkflowTypeDTO>>> getAllWorkflowTypes() {
        return ResponseEntity.ok(ApiResponse.success(workflowTypeService.getAllWorkflowTypes()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<WorkflowTypeDTO>>> getActiveWorkflowTypes() {
        return ResponseEntity.ok(ApiResponse.success(workflowTypeService.getActiveWorkflowTypes()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkflowTypeDTO>> getWorkflowTypeById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowTypeService.getWorkflowTypeById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowTypeDTO>> createWorkflowType(@Valid @RequestBody WorkflowTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Workflow type created", workflowTypeService.createWorkflowType(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowTypeDTO>> updateWorkflowType(
            @PathVariable UUID id, @Valid @RequestBody WorkflowTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Workflow type updated", workflowTypeService.updateWorkflowType(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteWorkflowType(@PathVariable UUID id) {
        workflowTypeService.deleteWorkflowType(id);
        return ResponseEntity.ok(ApiResponse.success("Workflow type deleted", null));
    }
}
