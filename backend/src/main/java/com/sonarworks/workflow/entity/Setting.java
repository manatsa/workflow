package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Setting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;

    @Column(name = "setting_label")
    private String label;

    @Column
    private String description;

    @Column(name = "setting_type")
    @Enumerated(EnumType.STRING)
    private SettingType type = SettingType.STRING;

    @Column(name = "setting_category")
    private String category;

    @Column(name = "setting_tab")
    private String tab;

    @Column(name = "is_encrypted")
    private Boolean isEncrypted = false;

    @Column(name = "is_system")
    private Boolean isSystem = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "validation_regex")
    private String validationRegex;

    @Column(name = "default_value")
    private String defaultValue;

    public enum SettingType {
        STRING, NUMBER, BOOLEAN, COLOR, EMAIL, URL, PASSWORD, JSON, LIST
    }
}
