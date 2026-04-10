package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeStaffId;
    private String department;
    private UUID leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String leaveTypeColor;
    private String referenceNumber;
    private String startDate;
    private String endDate;
    private Boolean startDateHalfDay;
    private String startDateHalfDayPeriod;
    private Boolean endDateHalfDay;
    private String endDateHalfDayPeriod;
    private BigDecimal totalDays;
    private String reason;
    private String status;
    private String cancellationReason;
    private String approvedAt;
    private UUID approvedById;
    private String approvedByName;
    private String approverComments;
    private UUID delegateToId;
    private String delegateToName;
    private String contactWhileOnLeave;
    private List<LeaveRequestAttachmentDTO> attachments;
    private String createdAt;
    private String updatedAt;
    private String createdBy;

    // Multi-level approval fields
    private Integer currentLevel;
    private Integer maxLevel;
    private String currentApproverName;
    private UUID currentApproverId;
    private UUID currentApproverUserId;
    private String submittedAt;
    private List<LeaveApprovalHistoryDTO> approvalHistory;
}
