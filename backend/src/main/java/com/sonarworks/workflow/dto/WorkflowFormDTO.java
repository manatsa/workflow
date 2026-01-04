package com.sonarworks.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class WorkflowFormDTO {

    private String id;  // String to accept temp IDs from frontend
    private UUID workflowId;

    private String name;  // Defaults to "Main Form" if blank

    private String description;
    private Integer displayOrder;
    private String icon;
    private Boolean isMainForm;
    private List<WorkflowFieldDTO> fields;
    private List<FieldGroupDTO> fieldGroups;
}
