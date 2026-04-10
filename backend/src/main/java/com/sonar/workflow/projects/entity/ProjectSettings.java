package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSettings extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "setting_type")
    @Builder.Default
    private String settingType = "STRING";

    @Column(name = "setting_group")
    private String settingGroup;

    @Column(nullable = false)
    @Builder.Default
    private String category = "General";

    @Column(name = "setting_options")
    private String options;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = false;
}
