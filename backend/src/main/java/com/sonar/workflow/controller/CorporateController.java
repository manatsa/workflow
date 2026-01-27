package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.CorporateDTO;
import com.sonar.workflow.entity.CorporateType;
import com.sonar.workflow.service.CorporateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/corporates")
@RequiredArgsConstructor
public class CorporateController {

    private final CorporateService corporateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CorporateDTO>>> getAllCorporates() {
        return ResponseEntity.ok(ApiResponse.success(corporateService.getAllCorporates()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CorporateDTO>>> getActiveCorporates() {
        return ResponseEntity.ok(ApiResponse.success(corporateService.getActiveCorporates()));
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getCorporateTypes() {
        List<Map<String, String>> types = Arrays.stream(CorporateType.values())
                .map(type -> Map.of(
                        "value", type.name(),
                        "label", type.getDisplayName()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CorporateDTO>> getCorporateById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(corporateService.getCorporateById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CorporateDTO>> createCorporate(@Valid @RequestBody CorporateDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Corporate created", corporateService.createCorporate(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<CorporateDTO>> updateCorporate(
            @PathVariable UUID id, @Valid @RequestBody CorporateDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Corporate updated", corporateService.updateCorporate(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateCorporate(@PathVariable UUID id) {
        corporateService.activateCorporate(id);
        return ResponseEntity.ok(ApiResponse.success("Corporate activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateCorporate(@PathVariable UUID id) {
        corporateService.deactivateCorporate(id);
        return ResponseEntity.ok(ApiResponse.success("Corporate deactivated", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCorporate(@PathVariable UUID id) {
        corporateService.deleteCorporate(id);
        return ResponseEntity.ok(ApiResponse.success("Corporate deleted", null));
    }
}
