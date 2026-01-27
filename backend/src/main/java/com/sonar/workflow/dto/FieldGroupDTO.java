package com.sonar.workflow.dto;

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
public class FieldGroupDTO {

    private String id;  // String to accept temp IDs from frontend
    private String formId;  // String to match temp form IDs
    private String screenId;  // String to match temp screen IDs

    private String title;

    private String description;
    private Integer displayOrder;
    private Integer columns;
    private Boolean isCollapsible;
    private Boolean isCollapsedByDefault;
    private String cssClass;
    private List<WorkflowFieldDTO> fields;
}
