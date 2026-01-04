package com.sonarworks.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTypeDTO {

    private UUID id;

    @NotBlank(message = "Type name is required")
    private String name;

    @NotBlank(message = "Type code is required")
    private String code;

    private String description;
    private String icon;
    private String color;
    private Integer displayOrder;
    private Boolean isActive;
}
