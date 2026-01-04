package com.sonarworks.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class FieldOptionDTO {

    private String id;  // String to accept temp IDs from frontend
    private String fieldId;  // String to match temp field IDs

    private String label;

    private String value;

    private Integer displayOrder;
    private Boolean isDefault;
    private String description;
    private String icon;
    private String color;
}
