package com.sonarworks.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {

    private UUID id;

    @NotBlank(message = "Role name is required")
    private String name;

    private String description;
    private Boolean isSystemRole;
    private Set<UUID> privilegeIds;
    private Set<String> privileges;
}
