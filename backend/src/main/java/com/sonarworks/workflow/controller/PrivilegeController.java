package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.PrivilegeDTO;
import com.sonarworks.workflow.service.PrivilegeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/privileges")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
public class PrivilegeController {

    private final PrivilegeService privilegeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PrivilegeDTO>>> getAllPrivileges() {
        return ResponseEntity.ok(ApiResponse.success(privilegeService.getAllPrivileges()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrivilegeDTO>> getPrivilegeById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(privilegeService.getPrivilegeById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PrivilegeDTO>> createPrivilege(@Valid @RequestBody PrivilegeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Privilege created", privilegeService.createPrivilege(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PrivilegeDTO>> updatePrivilege(
            @PathVariable UUID id, @Valid @RequestBody PrivilegeDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Privilege updated", privilegeService.updatePrivilege(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrivilege(@PathVariable UUID id) {
        privilegeService.deletePrivilege(id);
        return ResponseEntity.ok(ApiResponse.success("Privilege deleted", null));
    }
}
