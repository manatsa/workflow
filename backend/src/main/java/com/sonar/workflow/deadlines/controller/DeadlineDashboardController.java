package com.sonar.workflow.deadlines.controller;

import com.sonar.workflow.deadlines.dto.DeadlineDashboardDTO;
import com.sonar.workflow.deadlines.service.DeadlineDashboardService;
import com.sonar.workflow.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/deadlines/dashboard")
@RequiredArgsConstructor
public class DeadlineDashboardController {

    private final DeadlineDashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DeadlineDashboardDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard()));
    }

    @GetMapping("/badge-counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getBadgeCounts() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getBadgeCounts()));
    }
}
