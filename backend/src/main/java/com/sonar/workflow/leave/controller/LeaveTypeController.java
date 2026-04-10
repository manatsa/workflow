package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.leave.dto.LeaveTypeDTO;
import com.sonar.workflow.leave.service.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/types")
@RequiredArgsConstructor
public class LeaveTypeController {

    private final LeaveTypeService leaveTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaveTypeDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(leaveTypeService.getAllActive()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveTypeDTO>>> getAllIncludingInactive() {
        return ResponseEntity.ok(ApiResponse.success(leaveTypeService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeaveTypeDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leaveTypeService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveTypeDTO>> create(@RequestBody LeaveTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Leave type created", leaveTypeService.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveTypeDTO>> update(@PathVariable UUID id, @RequestBody LeaveTypeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Leave type updated", leaveTypeService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        leaveTypeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Leave type deleted", null));
    }
}
