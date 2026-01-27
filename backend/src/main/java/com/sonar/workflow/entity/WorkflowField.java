package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "screen_id")
    private Screen screen;

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

    @Column(name = "is_limited")
    private Boolean isLimited = false;

    @Column(name = "in_summary")
    private Boolean inSummary = false;

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

    @Column(name = "validation", columnDefinition = "TEXT")
    private String validation;

    @Column(name = "visibility_expression", columnDefinition = "TEXT")
    private String visibilityExpression = "true";

    @Column(name = "column_span")
    private Integer columnSpan;

    @Column(name = "width")
    private Integer width;

    @Column(name = "css_class")
    private String cssClass;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<FieldOption> options = new ArrayList<>();

    @Column(name = "options_layout")
    private String optionsLayout = "vertical";

    @Column(name = "dropdown_source")
    private String dropdownSource;

    @Column(name = "dropdown_display_field")
    private String dropdownDisplayField;

    @Column(name = "dropdown_value_field")
    private String dropdownValueField;

    // SQL Object based options
    @Column(name = "sql_object_id")
    private UUID sqlObjectId;

    @Column(name = "options_source")
    private String optionsSource = "STATIC"; // STATIC, SQL

    // View type for SQL_OBJECT field type
    @Enumerated(EnumType.STRING)
    @Column(name = "view_type")
    private ViewType viewType = ViewType.SELECT;

    @Column(name = "is_attachment")
    private Boolean isAttachment = false;

    @Column(name = "allowed_file_types")
    private String allowedFileTypes;

    @Column(name = "max_file_size")
    private Long maxFileSize;

    @Column(name = "max_files")
    private Integer maxFiles;

    // New field type specific configurations
    @Column(name = "rating_max")
    private Integer ratingMax = 5;

    @Column(name = "slider_min")
    private Double sliderMin = 0.0;

    @Column(name = "slider_max")
    private Double sliderMax = 100.0;

    @Column(name = "slider_step")
    private Double sliderStep = 1.0;

    public enum FieldType {
        TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, CHECKBOX, CHECKBOX_GROUP, RADIO, SELECT, MULTISELECT,
        FILE, EMAIL, PHONE, URL, PASSWORD, HIDDEN, LABEL, DIVIDER, USER,
        // New field types
        TOGGLE, YES_NO, IMAGE, ICON, RATING, SIGNATURE, COLOR, RICH_TEXT, TIME, SLIDER, BARCODE, LOCATION, TABLE,
        // SQL Object field type - dynamic options from SQL Object tables
        SQL_OBJECT
    }

    // View type for SQL_OBJECT field - how to display the options
    public enum ViewType {
        SELECT, MULTISELECT, RADIO, CHECKBOX_GROUP
    }

    public enum DataType {
        NUMBER, BOOLEAN, ALPHANUMERIC
    }
}
