package com.sonar.workflow.dto;

import com.sonar.workflow.entity.WorkflowInstance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowInstanceDTO {

    private UUID id;
    private UUID workflowId;
    private String workflowName;
    private String workflowCode;
    private Boolean lockApproved;
    private Boolean lockChildOnParentApproval;
    private Boolean parentApproved;
    private String referenceNumber;
    private String title;
    private String summary;
    private WorkflowInstance.Status status;
    private UUID initiatorId;
    private String initiatorName;
    private String initiatorEmail;
    private Integer currentLevel;
    private Integer maxLevel;
    private Integer currentApproverOrder;
    private Integer totalApproversAtLevel;
    private String currentApproverName;
    private String currentApproverEmail;
    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;
    private BigDecimal amount;
    private UUID sbuId;
    private String sbuName;
    private UUID parentInstanceId;
    private String parentInstanceReferenceNumber;
    private String parentWorkflowName;
    private String parentWorkflowCode;
    private List<ChildInstanceDTO> childInstances;
    private Map<String, Object> fieldValues;
    private List<ApprovalHistoryDTO> approvalHistory;
    private List<AttachmentDTO> attachments;
    private LocalDateTime createdAt;
    private String createdBy;
    private Boolean isCurrentApprover;
    private Boolean commentsMandatory;
    private Boolean commentsMandatoryOnReject;
    private Boolean commentsMandatoryOnEscalate;
    private UUID workflowStampId;
}
