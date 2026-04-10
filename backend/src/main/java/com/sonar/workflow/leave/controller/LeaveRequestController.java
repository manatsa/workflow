package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveRequestDTO;
import com.sonar.workflow.leave.service.LeaveRequestService;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDTO>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.getMyRequests(employee.getId(),
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN', 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDTO>>> getPendingApprovals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.getPendingApprovals(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt")))));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDTO>>> search(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.search(search,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> create(@RequestBody LeaveRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Leave request submitted", leaveRequestService.create(dto)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN', 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String comments = body != null ? body.get("comments") : null;
        return ResponseEntity.ok(ApiResponse.success("Leave request approved", leaveRequestService.approve(id, comments)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN', 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> reject(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String comments = body != null ? body.get("comments") : null;
        return ResponseEntity.ok(ApiResponse.success("Leave request rejected", leaveRequestService.reject(id, comments)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> cancel(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.success("Leave request cancelled", leaveRequestService.cancel(id, reason)));
    }

    @PostMapping("/{id}/recall")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> recall(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Leave request recalled", leaveRequestService.recall(id)));
    }

    @PostMapping("/{id}/reassign")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN', 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<LeaveRequestDTO>> reassign(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        UUID newApproverUserId = UUID.fromString(body.get("newApproverUserId"));
        String reason = body.get("reason");
        return ResponseEntity.ok(ApiResponse.success("Leave request reassigned",
                leaveRequestService.reassign(id, newApproverUserId, reason)));
    }

    @PostMapping("/calculate-days")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateDays(@RequestBody Map<String, Object> body) {
        String startDate = (String) body.get("startDate");
        String endDate = (String) body.get("endDate");
        boolean startHalf = Boolean.TRUE.equals(body.get("startDateHalfDay"));
        boolean endHalf = Boolean.TRUE.equals(body.get("endDateHalfDay"));
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.calculateDays(startDate, endDate, startHalf, endHalf)));
    }
}
