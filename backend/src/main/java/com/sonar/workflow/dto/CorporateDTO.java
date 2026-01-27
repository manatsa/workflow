package com.sonar.workflow.dto;

import com.sonar.workflow.entity.CorporateType;
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
public class CorporateDTO {

    private UUID id;

    @NotBlank(message = "Corporate code is required")
    private String code;

    @NotBlank(message = "Corporate name is required")
    private String name;

    private String description;
    private String address;
    private UUID categoryId;
    private String categoryName;
    private CorporateType corporateType;
    private String corporateTypeDisplayName;
    private String contactEmail;
    private String contactPhone;
    private String website;
    private Boolean isActive;
    private List<SBUDTO> sbus;
}
