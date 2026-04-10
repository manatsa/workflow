package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.ProjectChecklistDTO;
import com.sonar.workflow.projects.dto.ProjectChecklistItemDTO;
import com.sonar.workflow.projects.service.ProjectChecklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/checklists")
@RequiredArgsConstructor
public class ProjectChecklistController {

    private final ProjectChecklistService checklistService;

    @GetMapping
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectChecklistDTO>>> getChecklists(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.getChecklists(projectId)));
    }

    @GetMapping("/templates")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectChecklistDTO>>> getTemplates(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.getTemplateChecklists()));
    }

    @GetMapping("/{checklistId}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<ProjectChecklistDTO>> getChecklist(@PathVariable UUID projectId, @PathVariable UUID checklistId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.getChecklistById(checklistId)));
    }

    @PostMapping
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistDTO>> createChecklist(@PathVariable UUID projectId, @RequestBody ProjectChecklistDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Checklist created", checklistService.createChecklist(projectId, dto)));
    }

    @PutMapping("/{checklistId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistDTO>> updateChecklist(@PathVariable UUID projectId, @PathVariable UUID checklistId, @RequestBody ProjectChecklistDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Checklist updated", checklistService.updateChecklist(checklistId, dto)));
    }

    @DeleteMapping("/{checklistId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteChecklist(@PathVariable UUID projectId, @PathVariable UUID checklistId) {
        checklistService.deleteChecklist(checklistId);
        return ResponseEntity.ok(ApiResponse.success("Checklist deleted", null));
    }

    @PostMapping("/apply-template/{templateId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistDTO>> applyTemplate(@PathVariable UUID projectId, @PathVariable UUID templateId) {
        return ResponseEntity.ok(ApiResponse.success("Template applied", checklistService.applyTemplate(projectId, templateId)));
    }

    // ==================== ITEMS ====================

    @GetMapping("/{checklistId}/items")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectChecklistItemDTO>>> getItems(@PathVariable UUID projectId, @PathVariable UUID checklistId) {
        return ResponseEntity.ok(ApiResponse.success(checklistService.getChecklistItems(checklistId)));
    }

    @PostMapping("/{checklistId}/items")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistItemDTO>> addItem(@PathVariable UUID projectId, @PathVariable UUID checklistId, @RequestBody ProjectChecklistItemDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Item added", checklistService.addChecklistItem(checklistId, dto)));
    }

    @PutMapping("/{checklistId}/items/{itemId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistItemDTO>> updateItem(@PathVariable UUID projectId, @PathVariable UUID checklistId, @PathVariable UUID itemId, @RequestBody ProjectChecklistItemDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Item updated", checklistService.updateChecklistItem(itemId, dto)));
    }

    @PutMapping("/{checklistId}/items/{itemId}/toggle")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectChecklistItemDTO>> toggleItem(@PathVariable UUID projectId, @PathVariable UUID checklistId, @PathVariable UUID itemId, @RequestParam(required = false) UUID completedById) {
        return ResponseEntity.ok(ApiResponse.success("Item toggled", checklistService.toggleChecklistItem(itemId, completedById)));
    }

    @DeleteMapping("/{checklistId}/items/{itemId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID projectId, @PathVariable UUID checklistId, @PathVariable UUID itemId) {
        checklistService.deleteChecklistItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Item deleted", null));
    }
}
