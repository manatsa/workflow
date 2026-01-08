package com.sonarworks.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sonarworks.workflow.entity.WorkflowField;
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
    private Integer columnSpan;
    private Integer width;
    private String cssClass;
    private List<FieldOptionDTO> options;
    private String dropdownSource;
    private String dropdownDisplayField;
    private String dropdownValueField;
    private Boolean isAttachment;
    private String allowedFileTypes;
    private Long maxFileSize;
    private Integer maxFiles;
}
