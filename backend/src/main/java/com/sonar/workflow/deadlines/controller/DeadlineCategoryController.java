package com.sonar.workflow.deadlines.controller;

import com.sonar.workflow.deadlines.dto.DeadlineCategoryDTO;
import com.sonar.workflow.deadlines.service.DeadlineCategoryService;
import com.sonar.workflow.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/deadlines/categories")
@RequiredArgsConstructor
public class DeadlineCategoryController {

    private final DeadlineCategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeadlineCategoryDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DeadlineCategoryDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeadlineCategoryDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeadlineCategoryDTO>> create(@RequestBody DeadlineCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Category created successfully", categoryService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeadlineCategoryDTO>> update(@PathVariable UUID id, @RequestBody DeadlineCategoryDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", categoryService.update(id, dto)));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable UUID id) {
        categoryService.toggleStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Status toggled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }
}
