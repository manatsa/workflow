package com.sonarworks.workflow.dto;

import com.sonarworks.workflow.entity.Setting;
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
public class SettingDTO {

    private UUID id;

    @NotBlank(message = "Setting key is required")
    private String key;

    private String value;

    @NotBlank(message = "Setting label is required")
    private String label;

    private String description;
    private Setting.SettingType type;
    private String category;
    private String tab;
    private Boolean isEncrypted;
    private Boolean isSystem;
    private Integer displayOrder;
    private String validationRegex;
    private String defaultValue;
}
