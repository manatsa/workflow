package com.sonar.workflow.controller;

import com.sonar.workflow.dto.*;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.security.SuperUserProvider;
import com.sonar.workflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password")
@RequiredArgsConstructor
public class PasswordController {

    private final UserService userService;
    private final SuperUserProvider superUserProvider;

    @PostMapping("/forgot")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        userService.initiatePasswordReset(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Password reset email sent", null));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        userService.confirmPasswordReset(request.getToken(), request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @PostMapping("/change")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request) {
        if (superUserProvider.isSuperUsername(authentication.getName())) {
            throw new BusinessException("The super user account cannot be modified");
        }
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
