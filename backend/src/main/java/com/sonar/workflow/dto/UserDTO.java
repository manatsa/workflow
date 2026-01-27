package com.sonar.workflow.dto;

import com.sonar.workflow.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private UUID id;

    @NotBlank(message = "Username is required")
    private String username;

    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String firstName;
    private String lastName;
    private String fullName;
    private String phoneNumber;
    private String staffId;
    private String department;
    private User.UserType userType;
    private Boolean enabled;
    private Boolean isActive;
    private Boolean isLocked;
    private Boolean locked;
    private String lockReason;
    private LocalDateTime lastLogin;
    private LocalDateTime passwordChangedAt;
    private Boolean mustChangePassword;
    private Set<UUID> roleIds;
    private Set<UUID> corporateIds;
    private Set<UUID> sbuIds;
    private Set<UUID> branchIds;
    private Set<UUID> departmentIds;
    private Set<String> roles;
    private Set<String> privileges;
    private Set<CorporateDTO> corporates;
    private Set<SBUDTO> sbus;
    private Set<BranchDTO> branches;
    private Set<DepartmentDTO> departments;
    private String profilePicture;
    private LocalDateTime createdAt;
    private String createdBy;
}
