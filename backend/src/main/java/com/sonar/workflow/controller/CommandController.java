package com.sonar.workflow.controller;

import com.sonar.workflow.command.CommandConsoleService;
import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.CommandRequest;
import com.sonar.workflow.dto.CommandResponse;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/console")
@RequiredArgsConstructor
public class CommandController {

    private final CommandConsoleService commandConsoleService;

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<CommandResponse>> executeCommand(
            @Valid @RequestBody CommandRequest request,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // Only super user can access command console
        if (!userDetails.isSuperUser()) {
            throw new BusinessException("Access denied. Only super user can access command console.");
        }

        CommandResponse response = commandConsoleService.executeCommand(
                request.getCommand(), userDetails.getUsername());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
