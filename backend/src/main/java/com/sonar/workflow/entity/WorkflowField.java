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

    @Column(name = "multiple")
    private Boolean multiple = false;

    // New field type specific configurations
    @Column(name = "rating_max")
    private Integer ratingMax = 5;

    @Column(name = "slider_min")
    private Double sliderMin = 0.0;

    @Column(name = "slider_max")
    private Double sliderMax = 100.0;

    @Column(name = "slider_step")
    private Double sliderStep = 1.0;

    // TABLE field specific configurations
    @Column(name = "table_columns", columnDefinition = "TEXT")
    private String tableColumns; // JSON array of column definitions: [{name, label, type, width}]

    @Column(name = "table_min_rows")
    private Integer tableMinRows = 0;

    @Column(name = "table_max_rows")
    private Integer tableMaxRows;

    @Column(name = "table_striped")
    private Boolean tableStriped = true;

    @Column(name = "table_bordered")
    private Boolean tableBordered = true;

    @Column(name = "table_resizable")
    private Boolean tableResizable = false;

    @Column(name = "table_searchable")
    private Boolean tableSearchable = false;

    @Column(name = "table_filterable")
    private Boolean tableFilterable = false;

    @Column(name = "table_pageable")
    private Boolean tablePageable = false;

    @Column(name = "table_page_size")
    private Integer tablePageSize = 10;

    // ACCORDION field specific configurations
    @Column(name = "accordion_allow_multiple")
    private Boolean accordionAllowMultiple = false;

    @Column(name = "accordion_default_open_index")
    private Integer accordionDefaultOpenIndex = 0;

    @Column(name = "accordion_animation_type")
    private String accordionAnimationType = "smooth"; // smooth, none, bounce

    @Column(name = "accordion_animation_duration")
    private Integer accordionAnimationDuration = 300; // milliseconds

    // COLLAPSIBLE field specific configurations
    @Column(name = "collapsible_title")
    private String collapsibleTitle;

    @Column(name = "collapsible_icon")
    private String collapsibleIcon;

    @Column(name = "collapsible_default_expanded")
    private Boolean collapsibleDefaultExpanded = false;

    // Parent field ID for nested fields (collapsibles belong to accordions)
    @Column(name = "parent_field_id")
    private UUID parentFieldId;

    // API field type configurations
    @Column(name = "api_url", columnDefinition = "TEXT")
    private String apiUrl;

    @Column(name = "api_method")
    private String apiMethod = "GET"; // GET, POST, PUT, DELETE

    @Column(name = "api_auth_type")
    private String apiAuthType; // NONE, BASIC, BEARER, API_KEY

    @Column(name = "api_auth_value", columnDefinition = "TEXT")
    private String apiAuthValue; // credentials value (token, base64, key)

    @Column(name = "api_headers", columnDefinition = "TEXT")
    private String apiHeaders; // JSON array of {key, value} pairs

    @Column(name = "api_params", columnDefinition = "TEXT")
    private String apiParams; // JSON array of {key, value} pairs - query parameters

    @Column(name = "api_body", columnDefinition = "TEXT")
    private String apiBody; // Request body for POST/PUT

    @Column(name = "api_response_path")
    private String apiResponsePath; // JSONPath-like dot notation to extract data from response

    @Column(name = "api_on_response", columnDefinition = "TEXT")
    private String apiOnResponse; // Expression evaluated after API response; response accessible as APIResponse

    // Whether API_ARRAY/API_OBJECT_ARRAY fields show their own control in the form
    @Column(name = "api_show_in_form")
    private Boolean apiShowInForm = true;

    // API trigger mode: AUTO = fetch on form load, MANUAL = fetch on button click
    @Column(name = "api_trigger_mode")
    private String apiTriggerMode = "AUTO";

    // API data source for SELECT/RADIO/CHECKBOX_GROUP/MULTISELECT options
    @Column(name = "api_data_source_field")
    private String apiDataSourceField;

    @Column(name = "api_display_field")
    private String apiDisplayField;

    @Column(name = "api_value_field")
    private String apiValueField;

    // TABLE data source - name of an API_OBJECT_ARRAY field to populate from
    @Column(name = "table_data_source")
    private String tableDataSource;

    // SQL_TABLE field - execute SQL query and display results as a table
    @Column(name = "sql_query", columnDefinition = "TEXT")
    private String sqlQuery;

    @Column(name = "sql_table_columns", columnDefinition = "TEXT")
    private String sqlTableColumns; // JSON: [{key: "db_column", label: "Display Name"}]

    public enum FieldType {
        TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, CHECKBOX, CHECKBOX_GROUP, RADIO, SELECT, MULTISELECT,
        FILE, EMAIL, PHONE, URL, PASSWORD, HIDDEN, LABEL, DIVIDER, USER,
        // New field types
        TOGGLE, YES_NO, IMAGE, ICON, RATING, SIGNATURE, COLOR, RICH_TEXT, TIME, SLIDER, BARCODE, LOCATION, TABLE,
        // SQL Object field type - dynamic options from SQL Object tables
        SQL_OBJECT,
        // Container field types
        ACCORDION, COLLAPSIBLE,
        // API field types - fetch data from external APIs
        API_VALUE,
        // Object viewer - displays nested JSON objects with expand/collapse
        OBJECT_VIEWER,
        // SQL Table - execute SQL query and display results as read-only table
        SQL_TABLE
    }

    // View type for SQL_OBJECT field - how to display the options
    public enum ViewType {
        SELECT, MULTISELECT, RADIO, CHECKBOX_GROUP
    }

    public enum DataType {
        NUMBER, BOOLEAN, ALPHANUMERIC
    }
}
