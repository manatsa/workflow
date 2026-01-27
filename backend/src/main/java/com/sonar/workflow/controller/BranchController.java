package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.BranchDTO;
import com.sonar.workflow.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.success(branchService.getAllBranches()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getActiveBranches() {
        return ResponseEntity.ok(ApiResponse.success(branchService.getActiveBranches()));
    }

    @GetMapping("/by-sbu/{sbuId}")
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getBranchesBySbu(@PathVariable UUID sbuId) {
        return ResponseEntity.ok(ApiResponse.success(branchService.getBranchesBySbuId(sbuId)));
    }

    @GetMapping("/by-sbus")
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getBranchesBySbus(@RequestParam List<UUID> sbuIds) {
        return ResponseEntity.ok(ApiResponse.success(branchService.getBranchesBySbuIds(sbuIds)));
    }

    @GetMapping("/by-corporate/{corporateId}")
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getBranchesByCorporate(@PathVariable UUID corporateId) {
        return ResponseEntity.ok(ApiResponse.success(branchService.getBranchesByCorporateId(corporateId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchDTO>> getBranchById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(branchService.getBranchById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<BranchDTO>> createBranch(@Valid @RequestBody BranchDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Branch created", branchService.createBranch(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<BranchDTO>> updateBranch(
            @PathVariable UUID id, @Valid @RequestBody BranchDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Branch updated", branchService.updateBranch(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateBranch(@PathVariable UUID id) {
        branchService.activateBranch(id);
        return ResponseEntity.ok(ApiResponse.success("Branch activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateBranch(@PathVariable UUID id) {
        branchService.deactivateBranch(id);
        return ResponseEntity.ok(ApiResponse.success("Branch deactivated", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBranch(@PathVariable UUID id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(ApiResponse.success("Branch deleted", null));
    }
}
