package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workflow_fields")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowField extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private WorkflowForm form;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_group_id")
    private FieldGroup fieldGroup;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String label;

    @Column
    private String placeholder;

    @Column
    private String tooltip;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false)
    private FieldType fieldType = FieldType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type")
    private DataType dataType = DataType.ALPHANUMERIC;

    @Column(name = "is_mandatory")
    private Boolean isMandatory = false;

    @Column(name = "is_searchable")
    private Boolean isSearchable = false;

    @Column(name = "is_readonly")
    private Boolean isReadonly = false;

    @Column(name = "is_hidden")
    private Boolean isHidden = false;

    @Column(name = "is_unique")
    private Boolean isUnique = false;

    @Column(name = "is_title")
    private Boolean isTitle = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "default_value")
    private String defaultValue;

    @Column(name = "min_value")
    private String minValue;

    @Column(name = "max_value")
    private String maxValue;

    @Column(name = "min_length")
    private Integer minLength;

    @Column(name = "max_length")
    private Integer maxLength;

    @Column(name = "validation_regex")
    private String validationRegex;

    @Column(name = "validation_message")
    private String validationMessage;

    @Column(name = "custom_validation_rule", columnDefinition = "TEXT")
    private String customValidationRule;

    @Column(name = "custom_validation_message")
    private String customValidationMessage;

    @Column(name = "width")
    private Integer width;

    @Column(name = "css_class")
    private String cssClass;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<FieldOption> options = new ArrayList<>();

    @Column(name = "dropdown_source")
    private String dropdownSource;

    @Column(name = "dropdown_display_field")
    private String dropdownDisplayField;

    @Column(name = "dropdown_value_field")
    private String dropdownValueField;

    @Column(name = "is_attachment")
    private Boolean isAttachment = false;

    @Column(name = "allowed_file_types")
    private String allowedFileTypes;

    @Column(name = "max_file_size")
    private Long maxFileSize;

    @Column(name = "max_files")
    private Integer maxFiles;

    public enum FieldType {
        TEXT, TEXTAREA, NUMBER, DATE, DATETIME, CHECKBOX, RADIO, SELECT, MULTISELECT,
        FILE, EMAIL, PHONE, URL, PASSWORD, HIDDEN, LABEL, DIVIDER
    }

    public enum DataType {
        NUMBER, BOOLEAN, ALPHANUMERIC
    }
}
