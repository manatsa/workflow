package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.ProjectDocumentTemplateDTO;
import com.sonar.workflow.projects.service.ProjectDocumentTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/document-templates")
@RequiredArgsConstructor
public class ProjectDocumentTemplateController {

    private final ProjectDocumentTemplateService templateService;

    @GetMapping
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectDocumentTemplateDTO>>> getAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success(templateService.getAllTemplates()));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectDocumentTemplateDTO>>> getTemplatesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.success(templateService.getTemplatesByCategory(category)));
    }

    @PostMapping
    @PreAuthorize("@priv.has('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDocumentTemplateDTO>> uploadTemplate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false, defaultValue = "GENERAL") String category) {
        return ResponseEntity.ok(ApiResponse.success("Template uploaded", templateService.uploadTemplate(file, code, name, description, category)));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<Resource> downloadTemplate(@PathVariable UUID id) {
        ProjectDocumentTemplateDTO dto = templateService.getTemplateById(id);
        Resource resource = templateService.downloadTemplate(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(dto.getContentType() != null ? dto.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dto.getFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@priv.has('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted", null));
    }
}
