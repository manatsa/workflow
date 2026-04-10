package com.sonar.workflow.deadlines.controller;

import com.sonar.workflow.deadlines.dto.DeadlineItemDTO;
import com.sonar.workflow.deadlines.service.DeadlineItemService;
import com.sonar.workflow.deadlines.service.DeadlineSchedulerService;
import com.sonar.workflow.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
public class DeadlineItemController {

    private final DeadlineItemService deadlineItemService;
    private final DeadlineSchedulerService schedulerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeadlineItemDTO>>> getAllItems() {
        return ResponseEntity.ok(ApiResponse.success(deadlineItemService.getAllItems()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<DeadlineItemDTO>>> searchItems(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(ApiResponse.success(
                deadlineItemService.searchItems(search, PageRequest.of(page, size, sort))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeadlineItemDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(deadlineItemService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeadlineItemDTO>> create(@RequestBody DeadlineItemDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Deadline created successfully", deadlineItemService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeadlineItemDTO>> update(@PathVariable UUID id, @RequestBody DeadlineItemDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Deadline updated successfully", deadlineItemService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        deadlineItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deadline deleted successfully", null));
    }

    @PostMapping("/{id}/check-reminders")
    public ResponseEntity<ApiResponse<String>> checkReminders(@PathVariable UUID id) {
        String result = schedulerService.checkAndSendReminders(id);
        return ResponseEntity.ok(ApiResponse.success(result, result));
    }
}
