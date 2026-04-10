package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.sonar.workflow.entity.Workflow;

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
    private Boolean showSummary;
    private Boolean showApprovalMatrix;
    private Boolean lockApproved;
    private Boolean lockChildOnParentApproval;
    private Workflow.WorkflowCategory workflowCategory;
    private UUID stampId;
    private String stampName;
    private UUID parentWorkflowId;
    private String parentWorkflowName;
    private List<ChildWorkflowDTO> childWorkflows;
    private List<WorkflowFormDTO> forms;
    private List<WorkflowApproverDTO> approvers;
    private Set<UUID> corporateIds;
    private Set<UUID> sbuIds;
    private Set<UUID> branchIds;
    private Set<UUID> departmentIds;
    private Set<UUID> roleIds;
    private Set<UUID> privilegeIds;
    private String createdBy;

    // Reminder settings
    private Boolean reminderEnabled;
    private Integer reminderFrequencyHours;
    private Integer reminderMaxCount;
    private Integer reminderStartAfterHours;
    private Boolean escalationEnabled;
    private Integer escalationAfterHours;
    private Workflow.EscalationAction escalationAction;
    private Boolean reminderIncludeSubmitter;
    private String reminderEmailSubject;
    private String reminderEmailBody;
}
