package com.sonar.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDTO {

    private UUID id;

    @NotBlank(message = "Branch code is required")
    private String code;

    @NotBlank(message = "Branch name is required")
    private String name;

    private String description;
    private String address;

    @NotNull(message = "SBU is required")
    private UUID sbuId;
    private String sbuName;
    private String sbuCode;

    private UUID corporateId;
    private String corporateName;

    private String contactEmail;
    private String contactPhone;
    private Boolean isActive;
}
