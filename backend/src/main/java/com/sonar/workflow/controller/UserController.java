package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.UserDTO;
import com.sonar.workflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(pageable)));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsersList() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllActiveUsers()));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> searchUsers(
            @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.searchUsers(q, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserByUsername(authentication.getName())));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("User created", userService.createUser(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable UUID id, @Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("User updated", userService.updateUser(id, dto)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserDTO dto) {
        UserDTO currentUser = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                userService.updateUser(currentUser.getId(), dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable UUID id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }

    @PostMapping("/{id}/lock")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> lockUser(
            @PathVariable UUID id, @RequestParam(required = false) String reason) {
        UserDTO user = userService.getUserById(id);
        userService.lockUser(user.getUsername(), reason != null ? reason : "Locked by admin");
        return ResponseEntity.ok(ApiResponse.success("User locked", null));
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unlockUser(@PathVariable UUID id) {
        UserDTO user = userService.getUserById(id);
        userService.unlockUser(user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User unlocked", null));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminResetPassword(
            @PathVariable UUID id, @RequestParam String newPassword) {
        userService.adminResetPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password reset", null));
    }
}
