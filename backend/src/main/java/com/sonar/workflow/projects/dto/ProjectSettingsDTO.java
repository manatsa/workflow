package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSettingsDTO {
    private UUID id;
    private String settingKey;
    private String settingValue;
    private String description;
    private String settingType;
    private String settingGroup;
    private String options;
    private Boolean isSystem;
}
