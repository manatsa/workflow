package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.leave.dto.LeavePolicyDTO;
import com.sonar.workflow.leave.service.LeavePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/policies")
@RequiredArgsConstructor
public class LeavePolicyController {

    private final LeavePolicyService leavePolicyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeavePolicyDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(leavePolicyService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeavePolicyDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leavePolicyService.getById(id)));
    }

    @GetMapping("/by-type/{leaveTypeId}")
    public ResponseEntity<ApiResponse<List<LeavePolicyDTO>>> getByLeaveType(@PathVariable UUID leaveTypeId) {
        return ResponseEntity.ok(ApiResponse.success(leavePolicyService.getByLeaveType(leaveTypeId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeavePolicyDTO>> create(@RequestBody LeavePolicyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Leave policy created", leavePolicyService.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeavePolicyDTO>> update(@PathVariable UUID id, @RequestBody LeavePolicyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Leave policy updated", leavePolicyService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        leavePolicyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Leave policy deleted", null));
    }
}
