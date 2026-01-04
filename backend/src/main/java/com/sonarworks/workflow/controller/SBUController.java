package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.SBUDTO;
import com.sonarworks.workflow.service.SBUService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sbus")
@RequiredArgsConstructor
public class SBUController {

    private final SBUService sbuService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SBUDTO>>> getAllSBUs() {
        return ResponseEntity.ok(ApiResponse.success(sbuService.getAllSBUs()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SBUDTO>>> getActiveSBUs() {
        return ResponseEntity.ok(ApiResponse.success(sbuService.getActiveSBUs()));
    }

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<SBUDTO>>> getSBUTree() {
        return ResponseEntity.ok(ApiResponse.success(sbuService.getRootSBUs()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SBUDTO>> getSBUById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sbuService.getSBUById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SBUDTO>> createSBU(@Valid @RequestBody SBUDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("SBU created", sbuService.createSBU(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SBUDTO>> updateSBU(
            @PathVariable UUID id, @Valid @RequestBody SBUDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("SBU updated", sbuService.updateSBU(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateSBU(@PathVariable UUID id) {
        sbuService.activateSBU(id);
        return ResponseEntity.ok(ApiResponse.success("SBU activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateSBU(@PathVariable UUID id) {
        sbuService.deactivateSBU(id);
        return ResponseEntity.ok(ApiResponse.success("SBU deactivated", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSBU(@PathVariable UUID id) {
        sbuService.deleteSBU(id);
        return ResponseEntity.ok(ApiResponse.success("SBU deleted", null));
    }
}
