package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.service.ScreenNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/screen-notifications")
@RequiredArgsConstructor
@Slf4j
public class ScreenNotificationController {

    private final ScreenNotificationService screenNotificationService;

    public record ScreenNotificationRequest(
            String screenId,
            String workflowName,
            String screenTitle,
            List<Map<String, String>> fieldValues
    ) {}

    @PostMapping("/notify")
    public ResponseEntity<ApiResponse<Void>> sendNotification(
            @RequestBody ScreenNotificationRequest request,
            Authentication authentication) {

        String filledByName = authentication != null ? authentication.getName() : "Unknown";

        try {
            UUID screenId = UUID.fromString(request.screenId());
            screenNotificationService.sendScreenNotifications(
                    screenId,
                    request.workflowName(),
                    request.screenTitle(),
                    filledByName,
                    request.fieldValues()
            );
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Notification triggered")
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Invalid screen ID")
                    .build());
        }
    }
}
