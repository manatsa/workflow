package com.sonar.workflow.deadlines.controller;

import com.sonar.workflow.deadlines.dto.DeadlineInstanceDTO;
import com.sonar.workflow.deadlines.service.DeadlineItemService;
import com.sonar.workflow.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
public class DeadlineInstanceController {

    private final DeadlineItemService deadlineItemService;

    @GetMapping("/{deadlineId}/instances")
    public ResponseEntity<ApiResponse<List<DeadlineInstanceDTO>>> getInstances(@PathVariable UUID deadlineId) {
        return ResponseEntity.ok(ApiResponse.success(deadlineItemService.getInstancesByItem(deadlineId)));
    }

    @PostMapping("/instances/{instanceId}/complete")
    public ResponseEntity<ApiResponse<DeadlineInstanceDTO>> completeInstance(
            @PathVariable UUID instanceId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Deadline marked as completed",
                deadlineItemService.completeInstance(instanceId, notes)));
    }

    @PostMapping("/instances/{instanceId}/skip")
    public ResponseEntity<ApiResponse<DeadlineInstanceDTO>> skipInstance(
            @PathVariable UUID instanceId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Deadline instance skipped",
                deadlineItemService.skipInstance(instanceId, notes)));
    }

    @GetMapping("/instances/upcoming")
    public ResponseEntity<ApiResponse<List<DeadlineInstanceDTO>>> getUpcoming(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(deadlineItemService.getUpcomingInstances(days)));
    }

    @GetMapping("/instances/overdue")
    public ResponseEntity<ApiResponse<List<DeadlineInstanceDTO>>> getOverdue() {
        return ResponseEntity.ok(ApiResponse.success(deadlineItemService.getOverdueInstances()));
    }
}
