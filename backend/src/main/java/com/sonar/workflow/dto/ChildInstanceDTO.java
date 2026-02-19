package com.sonar.workflow.dto;

import com.sonar.workflow.entity.WorkflowInstance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChildInstanceDTO {
    private UUID id;
    private String workflowName;
    private String workflowCode;
    private String referenceNumber;
    private String title;
    private WorkflowInstance.Status status;
    private String initiatorName;
    private LocalDateTime createdAt;
}
