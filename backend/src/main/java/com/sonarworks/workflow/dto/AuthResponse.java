package com.sonarworks.workflow.dto;

import com.sonarworks.workflow.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UUID userId;
    private String username;
    private String email;
    private String fullName;
    private User.UserType userType;
    private Set<String> roles;
    private Set<String> privileges;
    private List<UUID> sbuIds;
    private boolean mustChangePassword;
}
