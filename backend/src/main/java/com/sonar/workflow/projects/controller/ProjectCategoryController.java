package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.ProjectCategoryDTO;
import com.sonar.workflow.projects.service.ProjectCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project-categories")
@RequiredArgsConstructor
public class ProjectCategoryController {

    private final ProjectCategoryService projectCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectCategoryDTO>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(projectCategoryService.getAllCategories()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ProjectCategoryDTO>>> getActiveCategories() {
        return ResponseEntity.ok(ApiResponse.success(projectCategoryService.getActiveCategories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectCategoryDTO>> getCategoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectCategoryService.getCategoryById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectCategoryDTO>> createCategory(@Valid @RequestBody ProjectCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Project category created", projectCategoryService.createCategory(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ProjectCategoryDTO>> updateCategory(
            @PathVariable UUID id, @Valid @RequestBody ProjectCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Project category updated", projectCategoryService.updateCategory(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateCategory(@PathVariable UUID id) {
        projectCategoryService.activateCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Project category activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateCategory(@PathVariable UUID id) {
        projectCategoryService.deactivateCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Project category deactivated", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        projectCategoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Project category deleted", null));
    }
}
