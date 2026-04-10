package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.ProjectSettingsDTO;
import com.sonar.workflow.projects.service.ProjectSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/settings")
@RequiredArgsConstructor
public class ProjectSettingsController {

    private final ProjectSettingsService settingsService;

    @GetMapping
    @PreAuthorize("@priv.hasAny('ADMIN','PROJECT_SETTINGS')")
    public ResponseEntity<ApiResponse<List<ProjectSettingsDTO>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllSettings()));
    }

    @GetMapping("/group/{group}")
    @PreAuthorize("@priv.hasAny('ADMIN','PROJECT_SETTINGS')")
    public ResponseEntity<ApiResponse<List<ProjectSettingsDTO>>> getSettingsByGroup(@PathVariable String group) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSettingsByGroup(group)));
    }

    @GetMapping("/key/{key}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<ProjectSettingsDTO>> getSettingByKey(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSettingByKey(key)));
    }

    @PostMapping
    @PreAuthorize("@priv.hasAny('ADMIN','PROJECT_SETTINGS')")
    public ResponseEntity<ApiResponse<ProjectSettingsDTO>> createOrUpdateSetting(@RequestBody ProjectSettingsDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Setting saved", settingsService.createOrUpdateSetting(dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@priv.hasAny('ADMIN','PROJECT_SETTINGS')")
    public ResponseEntity<ApiResponse<Void>> deleteSetting(@PathVariable UUID id) {
        settingsService.deleteSetting(id);
        return ResponseEntity.ok(ApiResponse.success("Setting deleted", null));
    }

    @PostMapping("/initialize")
    @PreAuthorize("@priv.hasAny('ADMIN','PROJECT_SETTINGS')")
    public ResponseEntity<ApiResponse<Void>> initializeDefaults() {
        settingsService.initializeDefaultSettings();
        return ResponseEntity.ok(ApiResponse.success("Default settings initialized", null));
    }
}
