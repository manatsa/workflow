package com.sonar.workflow.service;

import com.sonar.workflow.dto.AuthRequest;
import com.sonar.workflow.dto.AuthResponse;
import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.SystemState;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.SystemStateRepository;
import com.sonar.workflow.repository.UserRepository;
import com.sonar.workflow.security.CustomUserDetails;
import com.sonar.workflow.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final SystemStateRepository systemStateRepository;
    private final UserService userService;
    private final AuditService auditService;

    public AuthResponse authenticate(AuthRequest request) {
        // Check if system is locked
        SystemState systemState = systemStateRepository.findCurrentState().orElse(null);
        if (systemState != null && systemState.getIsLocked() && !"super".equals(request.getUsername())) {
            throw new BusinessException("System is currently locked. Only super user can login.");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("Invalid username or password"));

        if (user.getIsLocked()) {
            throw new LockedException("Account is locked: " + user.getLockReason());
        }

        if (!user.getIsActive()) {
            throw new BusinessException("Account is deactivated");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            String token = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(userDetails.getUsername());

            userService.recordSuccessfulLogin(user.getUsername());

            auditService.log(AuditLog.AuditAction.LOGIN, "User", user.getId(),
                    user.getUsername(), "User logged in: " + user.getUsername(), null, null);

            return AuthResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getExpirationTime())
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .fullName(userDetails.getFullName())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .phoneNumber(user.getPhoneNumber())
                    .staffId(user.getStaffId())
                    .department(user.getDepartment())
                    .userType(userDetails.getUserType())
                    .roles(userDetails.getAuthorities().stream()
                            .filter(a -> a.getAuthority().startsWith("ROLE_"))
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet()))
                    .privileges(userDetails.getAuthorities().stream()
                            .filter(a -> !a.getAuthority().startsWith("ROLE_"))
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet()))
                    .corporateIds(userDetails.getCorporateIds().stream().toList())
                    .sbuIds(userDetails.getSbuIds().stream().toList())
                    .branchIds(userDetails.getBranchIds().stream().toList())
                    .mustChangePassword(user.getMustChangePassword())
                    .lastLogin(user.getLastLogin())
                    .createdAt(user.getCreatedAt())
                    .build();
        } catch (BadCredentialsException e) {
            userService.recordFailedLogin(request.getUsername());
            throw new BusinessException("Invalid username or password");
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("Invalid or expired refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        String newToken = tokenProvider.generateToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        String fullName = (user.getFirstName() != null ? user.getFirstName() : "") +
                          (user.getLastName() != null ? " " + user.getLastName() : "");
        fullName = fullName.trim();
        if (fullName.isEmpty()) {
            fullName = user.getUsername();
        }

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationTime())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(fullName)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .staffId(user.getStaffId())
                .department(user.getDepartment())
                .userType(user.getUserType())
                .mustChangePassword(user.getMustChangePassword())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void logout(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            auditService.log(AuditLog.AuditAction.LOGOUT, "User", user.getId(),
                    user.getUsername(), "User logged out: " + user.getUsername(), null, null);
        });
    }
}
