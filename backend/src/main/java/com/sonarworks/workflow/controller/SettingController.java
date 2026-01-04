package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.SettingDTO;
import com.sonarworks.workflow.service.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<SettingDTO>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getAllSettings()));
    }

    @GetMapping("/tabs")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> getAllTabs() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getAllTabs()));
    }

    @GetMapping("/tab/{tab}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<SettingDTO>>> getSettingsByTab(@PathVariable String tab) {
        return ResponseEntity.ok(ApiResponse.success(settingService.getSettingsByTab(tab)));
    }

    @GetMapping("/grouped")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, List<SettingDTO>>>> getSettingsGroupedByTab() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getSettingsGroupedByTab()));
    }

    @GetMapping("/value/{key}")
    public ResponseEntity<ApiResponse<String>> getSettingValue(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success(settingService.getValue(key, null)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SettingDTO>> saveSetting(@Valid @RequestBody SettingDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Setting saved", settingService.saveSetting(dto)));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<SettingDTO>>> saveSettings(@Valid @RequestBody List<SettingDTO> settings) {
        return ResponseEntity.ok(ApiResponse.success("Settings saved", settingService.saveSettings(settings)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSetting(@PathVariable UUID id) {
        settingService.deleteSetting(id);
        return ResponseEntity.ok(ApiResponse.success("Setting deleted", null));
    }
}
