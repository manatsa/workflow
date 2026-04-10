package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.leave.dto.LeaveApproverDTO;
import com.sonar.workflow.leave.service.LeaveApproverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/approvers")
@RequiredArgsConstructor
public class LeaveApproverController {

    private final LeaveApproverService leaveApproverService;

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<LeaveApproverDTO>>> getByDepartment(@PathVariable UUID departmentId) {
        return ResponseEntity.ok(ApiResponse.success(leaveApproverService.getByDepartment(departmentId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveApproverDTO>> create(@RequestBody LeaveApproverDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Approver added", leaveApproverService.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveApproverDTO>> update(@PathVariable UUID id, @RequestBody LeaveApproverDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Approver updated", leaveApproverService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        leaveApproverService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Approver removed", null));
    }

    @PutMapping("/department/{departmentId}/chain")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveApproverDTO>>> replaceChain(
            @PathVariable UUID departmentId, @RequestBody List<LeaveApproverDTO> approvers) {
        return ResponseEntity.ok(ApiResponse.success("Approval chain updated",
                leaveApproverService.replaceChain(departmentId, approvers)));
    }
}
