package com.sonar.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SBUDTO {

    private UUID id;

    @NotBlank(message = "SBU code is required")
    private String code;

    @NotBlank(message = "SBU name is required")
    private String name;

    private String description;
    private UUID corporateId;
    private String corporateName;
    private String corporateCode;
    private UUID parentId;
    private String parentName;
    private Boolean isRoot;
    private Boolean isActive;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private List<SBUDTO> children;
    private List<BranchDTO> branches;
}
