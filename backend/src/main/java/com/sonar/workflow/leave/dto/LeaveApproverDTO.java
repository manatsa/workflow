package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveApproverDTO {
    private UUID id;
    private UUID departmentId;
    private String departmentName;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Integer level;
    private String approverName;
    private String approverEmail;
    private Boolean canEscalate;
    private Integer escalationTimeoutHours;
    private Boolean notifyOnPending;
    private Boolean notifyOnApproval;
    private Boolean notifyOnRejection;
    private Integer displayOrder;
    private Boolean isActive;
}
