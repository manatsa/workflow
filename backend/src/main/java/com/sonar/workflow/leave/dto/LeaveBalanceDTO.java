package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeStaffId;
    private String department;
    private UUID leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String leaveTypeColor;
    private Integer year;
    private BigDecimal entitled;
    private BigDecimal carriedOver;
    private BigDecimal adjustment;
    private BigDecimal used;
    private BigDecimal pending;
    private BigDecimal encashed;
    private BigDecimal available;
}
