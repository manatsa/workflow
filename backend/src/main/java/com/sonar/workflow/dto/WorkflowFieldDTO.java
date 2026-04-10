package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sonar.workflow.entity.WorkflowField;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowFieldDTO {

    private String id;  // String to accept temp IDs from frontend
    private String formId;  // String to match temp form IDs
    private String screenId;  // String to match temp screen IDs
    private String fieldGroupId;  // String to match temp group IDs

    private String name;

    private String label;

    private String placeholder;
    private String tooltip;
    private WorkflowField.FieldType fieldType;
    private WorkflowField.DataType dataType;
    private Boolean isMandatory;
    private Boolean isSearchable;
    private Boolean isReadonly;
    private Boolean isHidden;
    private Boolean isUnique;
    private Boolean isTitle;
    private Boolean isLimited;
    private Boolean inSummary;
    private Integer displayOrder;

    // Alias getters for frontend compatibility
    public WorkflowField.FieldType getType() {
        return fieldType;
    }

    public Boolean getRequired() {
        return isMandatory;
    }

    public Boolean getHidden() {
        return isHidden;
    }

    public Boolean getReadOnly() {
        return isReadonly;
    }

    // Alias setters for frontend compatibility (Jackson deserialization)
    public void setType(WorkflowField.FieldType type) {
        this.fieldType = type;
    }

    public void setRequired(Boolean required) {
        this.isMandatory = required;
    }

    public void setHidden(Boolean hidden) {
        this.isHidden = hidden;
    }

    public void setReadOnly(Boolean readOnly) {
        this.isReadonly = readOnly;
    }
    private String defaultValue;
    private String minValue;
    private String maxValue;
    private Integer minLength;
    private Integer maxLength;
    private String validationRegex;
    private String validationMessage;
    private String customValidationRule;
    private String customValidationMessage;
    private String validation;
    private String visibilityExpression;
    private Integer columnSpan;
    private Integer width;
    private String cssClass;
    private List<FieldOptionDTO> options;
    private String optionsLayout;
    private String dropdownSource;
    private String dropdownDisplayField;
    private String dropdownValueField;

    // SQL Object based options
    private UUID sqlObjectId;
    private String optionsSource;
    private String viewType; // SELECT, MULTISELECT, RADIO, CHECKBOX_GROUP - for SQL_OBJECT field type

    private Boolean isAttachment;
    private String allowedFileTypes;
    private Long maxFileSize;
    private Integer maxFiles;
    private Boolean multiple;

    // New field type specific configurations
    private Integer ratingMax;
    private Double sliderMin;
    private Double sliderMax;
    private Double sliderStep;

    // TABLE field specific configurations
    private String tableColumns; // JSON array of column definitions
    private Integer tableMinRows;
    private Integer tableMaxRows;
    private Boolean tableStriped;
    private Boolean tableBordered;
    private Boolean tableResizable;
    private Boolean tableSearchable;
    private Boolean tableFilterable;
    private Boolean tablePageable;
    private Integer tablePageSize;

    // ACCORDION field specific configurations
    private Boolean accordionAllowMultiple;
    private Integer accordionDefaultOpenIndex;
    private String accordionAnimationType;
    private Integer accordionAnimationDuration;

    // COLLAPSIBLE field specific configurations
    private String collapsibleTitle;
    private String collapsibleIcon;
    private Boolean collapsibleDefaultExpanded;

    // Parent field ID for nested fields (collapsibles belong to accordions)
    // String type to support both temp IDs (e.g., "temp_xxx") and real UUIDs
    private String parentFieldId;

    // API field type configurations
    private String apiUrl;
    private String apiMethod;
    private String apiAuthType;
    private String apiAuthValue;
    private String apiHeaders; // JSON array of {key, value}
    private String apiParams; // JSON array of {key, value} - query parameters
    private String apiBody;
    private String apiResponsePath;

    // Whether API_ARRAY/API_OBJECT_ARRAY fields show their own control in the form
    private Boolean apiShowInForm;

    // API data source for SELECT/RADIO/CHECKBOX_GROUP/MULTISELECT options
    private String apiDataSourceField;
    private String apiDisplayField;
    private String apiValueField;

    // TABLE data source - name of an API_OBJECT_ARRAY field to populate from
    private String tableDataSource;

    // SQL_TABLE field configuration
    private String sqlQuery;
    private String sqlTableColumns; // JSON: [{key: "db_column", label: "Display Name"}]
}
