package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowChildParameterDTO {

    private UUID id;

    private UUID childWorkflowId;

    private String childWorkflowName;

    private String childWorkflowCode;

    private String sourceField;

    private String targetField;

    private Boolean showInSummary = true;

    private Boolean showInEmailSummary = true;

    private String defaultValue;

    private Integer displayOrder = 0;
}
