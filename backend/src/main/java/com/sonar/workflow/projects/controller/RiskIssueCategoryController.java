package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.RiskIssueCategoryDTO;
import com.sonar.workflow.projects.service.RiskIssueCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/risk-issue-categories")
@RequiredArgsConstructor
public class RiskIssueCategoryController {

    private final RiskIssueCategoryService service;

    @GetMapping
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<RiskIssueCategoryDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/by-type/{type}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<RiskIssueCategoryDTO>>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.success(service.getByType(type)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<RiskIssueCategoryDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<RiskIssueCategoryDTO>> create(@RequestBody RiskIssueCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Category created", service.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<RiskIssueCategoryDTO>> update(@PathVariable UUID id, @RequestBody RiskIssueCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", service.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }
}
