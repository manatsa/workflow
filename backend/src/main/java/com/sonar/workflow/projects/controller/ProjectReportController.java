package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.ProjectReportDTO;
import com.sonar.workflow.projects.service.ProjectReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/reports")
@RequiredArgsConstructor
public class ProjectReportController {

    private final ProjectReportService reportService;

    @GetMapping("/status/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getStatusReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getStatusReport(projectId)));
    }

    @GetMapping("/budget/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getBudgetReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getBudgetReport(projectId)));
    }

    @GetMapping("/tasks/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getTaskReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTaskReport(projectId)));
    }

    @GetMapping("/risks/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getRiskReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getRiskReport(projectId)));
    }

    @GetMapping("/time/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getTimeReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTimeReport(projectId)));
    }

    @GetMapping("/milestones/{projectId}")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getMilestoneReport(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getMilestoneReport(projectId)));
    }

    @GetMapping("/portfolio")
    @PreAuthorize("@priv.hasAny('PROJECT_VIEW','PROJECT_REPORT')")
    public ResponseEntity<ApiResponse<ProjectReportDTO>> getPortfolioReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPortfolioReport()));
    }
}
