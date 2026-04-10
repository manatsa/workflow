package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.leave.dto.LeaveDashboardDTO;
import com.sonar.workflow.leave.dto.LeaveRequestDTO;
import com.sonar.workflow.leave.service.LeaveDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave/dashboard")
@RequiredArgsConstructor
public class LeaveDashboardController {

    private final LeaveDashboardService leaveDashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<LeaveDashboardDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(leaveDashboardService.getDashboard()));
    }

    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getBadgeCounts() {
        return ResponseEntity.ok(ApiResponse.success(leaveDashboardService.getBadgeCounts()));
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<List<LeaveRequestDTO>>> getTeamCalendar(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveDashboardService.getTeamCalendar(LocalDate.parse(from), LocalDate.parse(to))));
    }
}
