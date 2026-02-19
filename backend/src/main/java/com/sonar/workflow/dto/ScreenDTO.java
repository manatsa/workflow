package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class ScreenDTO {

    private String id;  // String to accept temp IDs from frontend
    private String formId;  // String to match temp form IDs

    private String title;
    private String description;
    private Integer displayOrder;
    private String icon;
    private Boolean isSummaryScreen;
    private String notificationMessage;

    private Set<UUID> roleIds;
    private Set<UUID> privilegeIds;
    private Set<String> roleNames;
    private Set<String> privilegeNames;

    private List<FieldGroupDTO> fieldGroups;
    private List<WorkflowFieldDTO> fields;
    private List<ScreenNotifierDTO> notifiers;
}
