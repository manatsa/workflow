package com.sonarworks.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowDTO {

    private UUID id;

    private String name;

    private String code;  // Auto-generated if blank

    private String description;
    private UUID workflowTypeId;
    private String workflowTypeName;
    private String icon;
    private Integer displayOrder;
    private Boolean requiresApproval;
    private Boolean isPublished;
    private Boolean isActive;
    private Integer versionNumber;
    private Boolean commentsMandatory;
    private Boolean commentsMandatoryOnReject;
    private Boolean commentsMandatoryOnEscalate;
    private List<WorkflowFormDTO> forms;
    private List<WorkflowApproverDTO> approvers;
    private Set<UUID> corporateIds;
    private Set<UUID> sbuIds;
    private Set<UUID> branchIds;
    private Set<UUID> departmentIds;
}
