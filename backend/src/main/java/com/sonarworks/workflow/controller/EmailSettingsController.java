package com.sonarworks.workflow.controller;

import com.sonarworks.workflow.dto.EmailConfigurationStatus;
import com.sonarworks.workflow.dto.EmailTestResult;
import com.sonarworks.workflow.entity.EmailSettings;
import com.sonarworks.workflow.service.EmailSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email-settings")
@RequiredArgsConstructor
public class EmailSettingsController {

    private final EmailSettingsService emailSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'READ_SETTINGS')")
    public ResponseEntity<EmailSettings> getSettings() {
        return ResponseEntity.ok(emailSettingsService.getSettingsForDisplay());
    }

    @PutMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'UPDATE_SETTINGS')")
    public ResponseEntity<EmailSettings> updateSettings(@RequestBody EmailSettings settings) {
        emailSettingsService.updateSettings(settings);
        return ResponseEntity.ok(emailSettingsService.getSettingsForDisplay());
    }

    @PostMapping("/test")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'UPDATE_SETTINGS')")
    public ResponseEntity<EmailTestResult> testEmailConfiguration(
            @RequestParam(required = false) String recipientEmail) {
        return ResponseEntity.ok(emailSettingsService.testEmailConfiguration(recipientEmail));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'READ_SETTINGS')")
    public ResponseEntity<EmailConfigurationStatus> getEmailStatus() {
        return ResponseEntity.ok(emailSettingsService.getEmailStatus());
    }
}
