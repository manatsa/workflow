package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.PasswordChangeRequest;
import com.sonarworks.workflow.dto.UserDTO;
import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.*;
import com.sonarworks.workflow.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SBURepository sbuRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidator passwordValidator;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SettingService settingService;

    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllActiveUsers() {
        return userRepository.findAllActiveUsers().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<UserDTO> searchUsers(String search, Pageable pageable) {
        return userRepository.searchUsers(search, pageable).map(this::toDTO);
    }

    public UserDTO getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
        return toDTO(user);
    }

    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        return toDTO(user);
    }

    @Transactional
    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new BusinessException("Username already exists");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email already exists");
        }

        if (dto.getPassword() != null) {
            var validation = passwordValidator.validate(dto.getPassword());
            if (!validation.valid()) {
                throw new BusinessException("Password validation failed: " + String.join(", ", validation.errors()));
            }
        }

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "TempPassword123!"))
                .email(dto.getEmail())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .phoneNumber(dto.getPhoneNumber())
                .userType(dto.getUserType() != null ? dto.getUserType() : User.UserType.STAFF)
                .isActive(true)
                .isLocked(false)
                .mustChangePassword(dto.getPassword() == null)
                .passwordChangedAt(LocalDateTime.now())
                .build();

        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            user.setRoles(roles);
        }

        if (dto.getSbuIds() != null && !dto.getSbuIds().isEmpty()) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            user.setSbus(sbus);
        }

        User saved = userRepository.save(user);
        auditService.log(AuditLog.AuditAction.CREATE, "User", saved.getId(),
                saved.getUsername(), "User created: " + saved.getUsername(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public UserDTO updateUser(UUID id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));

        UserDTO oldValues = toDTO(user);

        if (!user.getEmail().equals(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessException("Email already exists");
        }

        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setUserType(dto.getUserType());
        user.setProfilePicture(dto.getProfilePicture());

        if (dto.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            user.setRoles(roles);
        }

        if (dto.getSbuIds() != null) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            user.setSbus(sbus);
        }

        User saved = userRepository.save(user);
        auditService.log(AuditLog.AuditAction.UPDATE, "User", saved.getId(),
                saved.getUsername(), "User updated: " + saved.getUsername(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void changePassword(String username, PasswordChangeRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("New passwords do not match");
        }

        var validation = passwordValidator.validate(request.getNewPassword());
        if (!validation.valid()) {
            throw new BusinessException("Password validation failed: " + String.join(", ", validation.errors()));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.PASSWORD_CHANGE, "User", user.getId(),
                user.getUsername(), "Password changed for user: " + user.getUsername(), null, null);
    }

    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found with this email"));

        String token = UUID.randomUUID().toString();
        int expiryHours = settingService.getIntValue("password.reset.token.expiry.hours", 24);

        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(expiryHours));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);

        auditService.log(AuditLog.AuditAction.PASSWORD_RESET, "User", user.getId(),
                user.getUsername(), "Password reset initiated for: " + user.getUsername(), null, null);
    }

    @Transactional
    public void confirmPasswordReset(String token, String newPassword, String confirmPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BusinessException("Invalid or expired token"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Password reset token has expired");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new BusinessException("Passwords do not match");
        }

        var validation = passwordValidator.validate(newPassword);
        if (!validation.valid()) {
            throw new BusinessException("Password validation failed: " + String.join(", ", validation.errors()));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setMustChangePassword(false);
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.PASSWORD_RESET, "User", user.getId(),
                user.getUsername(), "Password reset completed for: " + user.getUsername(), null, null);
    }

    @Transactional
    public void activateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setIsActive(true);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.UPDATE, "User", user.getId(),
                user.getUsername(), "User activated: " + user.getUsername(), null, null);
    }

    @Transactional
    public void deactivateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.UPDATE, "User", user.getId(),
                user.getUsername(), "User deactivated: " + user.getUsername(), null, null);
    }

    @Transactional
    public void lockUser(String username, String reason) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setIsLocked(true);
        user.setLockReason(reason);
        user.setLockedAt(LocalDateTime.now());
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.LOCK, "User", user.getId(),
                user.getUsername(), "User locked: " + user.getUsername() + ". Reason: " + reason, null, null);
    }

    @Transactional
    public void unlockUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setIsLocked(false);
        user.setLockReason(null);
        user.setLockedAt(null);
        user.setLockedBy(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.UNLOCK, "User", user.getId(),
                user.getUsername(), "User unlocked: " + user.getUsername(), null, null);
    }

    @Transactional
    public void recordFailedLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            int maxAttempts = settingService.getIntValue("password.lock.max.attempts", 5);
            if (attempts >= maxAttempts) {
                user.setIsLocked(true);
                user.setLockReason("Account locked due to too many failed login attempts");
                user.setLockedAt(LocalDateTime.now());
            }
            userRepository.save(user);
        });
    }

    @Transactional
    public void recordSuccessfulLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public void adminResetPassword(UUID userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        var validation = passwordValidator.validate(newPassword);
        if (!validation.valid()) {
            throw new BusinessException("Password validation failed: " + String.join(", ", validation.errors()));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setMustChangePassword(true);
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        userRepository.save(user);

        auditService.log(AuditLog.AuditAction.PASSWORD_RESET, "User", user.getId(),
                user.getUsername(), "Password reset by admin for: " + user.getUsername(), null, null);
    }

    private UserDTO toDTO(User user) {
        String fullName = (user.getFirstName() != null ? user.getFirstName() : "") +
                          (user.getLastName() != null ? " " + user.getLastName() : "");
        fullName = fullName.trim();
        if (fullName.isEmpty()) {
            fullName = user.getUsername();
        }

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(fullName)
                .phoneNumber(user.getPhoneNumber())
                .userType(user.getUserType())
                .isActive(user.getIsActive())
                .isLocked(user.getIsLocked())
                .lockReason(user.getLockReason())
                .lastLogin(user.getLastLogin())
                .passwordChangedAt(user.getPasswordChangedAt())
                .mustChangePassword(user.getMustChangePassword())
                .roleIds(user.getRoles().stream().map(Role::getId).collect(Collectors.toSet()))
                .sbuIds(user.getSbus().stream().map(SBU::getId).collect(Collectors.toSet()))
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .privileges(user.getRoles().stream()
                        .flatMap(role -> role.getPrivileges().stream())
                        .map(Privilege::getName)
                        .collect(Collectors.toSet()))
                .profilePicture(user.getProfilePicture())
                .createdAt(user.getCreatedAt())
                .createdBy(user.getCreatedBy())
                .build();
    }
}
