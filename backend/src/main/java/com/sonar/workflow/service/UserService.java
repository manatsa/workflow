package com.sonar.workflow.service;

import com.sonar.workflow.dto.PasswordChangeRequest;
import com.sonar.workflow.dto.UserDTO;
import com.sonar.workflow.entity.*;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.*;
import com.sonar.workflow.util.PasswordValidator;
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
    private final CorporateRepository corporateRepository;
    private final SBURepository sbuRepository;
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidator passwordValidator;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SettingService settingService;

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllActiveUsers() {
        return userRepository.findAllActiveUsers().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserDTO> searchUsers(String search, Pageable pageable) {
        return userRepository.searchUsers(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("User not found"));
        return toDTO(user);
    }

    @Transactional(readOnly = true)
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
                .staffId(dto.getStaffId())
                .department(dto.getDepartment())
                .userType(dto.getUserType() != null ? dto.getUserType() : User.UserType.STAFF)
                .isActive(dto.getEnabled() != null ? dto.getEnabled() : true)
                .isLocked(false)
                .mustChangePassword(dto.getMustChangePassword() != null ? dto.getMustChangePassword() : (dto.getPassword() == null))
                .passwordChangedAt(LocalDateTime.now())
                .build();

        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            user.setRoles(roles);
        }

        if (dto.getCorporateIds() != null && !dto.getCorporateIds().isEmpty()) {
            Set<Corporate> corporates = new HashSet<>(corporateRepository.findAllById(dto.getCorporateIds()));
            user.setCorporates(corporates);
        }

        if (dto.getSbuIds() != null && !dto.getSbuIds().isEmpty()) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            user.setSbus(sbus);
        }

        if (dto.getBranchIds() != null && !dto.getBranchIds().isEmpty()) {
            Set<Branch> branches = new HashSet<>(branchRepository.findAllById(dto.getBranchIds()));
            user.setBranches(branches);
        }

        if (dto.getDepartmentIds() != null && !dto.getDepartmentIds().isEmpty()) {
            Set<Department> departments = new HashSet<>(departmentRepository.findAllById(dto.getDepartmentIds()));
            user.setDepartments(departments);
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
        user.setStaffId(dto.getStaffId());
        user.setDepartment(dto.getDepartment());
        user.setUserType(dto.getUserType());
        user.setProfilePicture(dto.getProfilePicture());
        if (dto.getEnabled() != null) {
            user.setIsActive(dto.getEnabled());
        }
        if (dto.getMustChangePassword() != null) {
            user.setMustChangePassword(dto.getMustChangePassword());
        }

        if (dto.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            user.setRoles(roles);
        }

        if (dto.getCorporateIds() != null) {
            Set<Corporate> corporates = new HashSet<>(corporateRepository.findAllById(dto.getCorporateIds()));
            user.setCorporates(corporates);
        }

        if (dto.getSbuIds() != null) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            user.setSbus(sbus);
        }

        if (dto.getBranchIds() != null) {
            Set<Branch> branches = new HashSet<>(branchRepository.findAllById(dto.getBranchIds()));
            user.setBranches(branches);
        }

        if (dto.getDepartmentIds() != null) {
            Set<Department> departments = new HashSet<>(departmentRepository.findAllById(dto.getDepartmentIds()));
            user.setDepartments(departments);
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
        if (email == null || email.trim().isEmpty()) {
            throw new BusinessException("Email is required");
        }

        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new BusinessException("User not found with this email"));

        String token = UUID.randomUUID().toString();
        int expiryHours = settingService.getIntValue("password.reset.token.expiry.hours", 24);

        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(expiryHours));
        userRepository.save(user);

        // Send email synchronously so we can report failures to the user
        try {
            String firstName = user.getFirstName() != null ? user.getFirstName() : "User";
            emailService.sendPasswordResetEmail(user.getEmail(), firstName, token);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
            // Clear the token since email failed
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiry(null);
            userRepository.save(user);
            throw new BusinessException("Failed to send password reset email. Please check that email settings are configured correctly or contact your administrator.");
        }

        // Log audit - wrapped in try-catch to not fail the main operation
        try {
            auditService.log(AuditLog.AuditAction.PASSWORD_RESET, "User", user.getId(),
                    user.getUsername(), "Password reset initiated for: " + user.getUsername(), null, null);
        } catch (Exception e) {
            log.warn("Failed to log audit for password reset", e);
        }
    }

    @Transactional
    public void confirmPasswordReset(String token, String newPassword, String confirmPassword) {
        if (token == null || token.trim().isEmpty()) {
            throw new BusinessException("Reset token is required");
        }

        if (newPassword == null || newPassword.isEmpty()) {
            throw new BusinessException("New password is required");
        }

        User user = userRepository.findByPasswordResetToken(token.trim())
                .orElseThrow(() -> new BusinessException("Invalid or expired token"));

        if (user.getPasswordResetTokenExpiry() == null ||
            user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Password reset token has expired");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new BusinessException("Passwords do not match");
        }

        var validation = passwordValidator.validate(newPassword);
        if (!validation.valid()) {
            throw new BusinessException("Password validation failed: " + String.join(", ", validation.errors()));
        }

        try {
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiry(null);
            user.setPasswordChangedAt(LocalDateTime.now());
            user.setMustChangePassword(false);
            user.setFailedLoginAttempts(0);
            user.setIsLocked(false);
            userRepository.save(user);

            // Log audit - wrapped in try-catch to not fail the main operation
            try {
                auditService.log(AuditLog.AuditAction.PASSWORD_RESET, "User", user.getId(),
                        user.getUsername(), "Password reset completed for: " + user.getUsername(), null, null);
            } catch (Exception e) {
                log.warn("Failed to log audit for password reset completion", e);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to complete password reset", e);
            throw new BusinessException("Failed to reset password. Please try again later.");
        }
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
                .staffId(user.getStaffId())
                .department(user.getDepartment())
                .userType(user.getUserType())
                .enabled(user.getIsActive())
                .isActive(user.getIsActive())
                .locked(user.getIsLocked())
                .isLocked(user.getIsLocked())
                .lockReason(user.getLockReason())
                .lastLogin(user.getLastLogin())
                .passwordChangedAt(user.getPasswordChangedAt())
                .mustChangePassword(user.getMustChangePassword())
                .roleIds(user.getRoles().stream().map(Role::getId).collect(Collectors.toSet()))
                .corporateIds(user.getCorporates().stream().map(Corporate::getId).collect(Collectors.toSet()))
                .sbuIds(user.getSbus().stream().map(SBU::getId).collect(Collectors.toSet()))
                .branchIds(user.getBranches().stream().map(Branch::getId).collect(Collectors.toSet()))
                .departmentIds(user.getDepartments().stream().map(Department::getId).collect(Collectors.toSet()))
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
