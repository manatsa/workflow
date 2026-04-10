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
public class LeavePolicyDTO {
    private UUID id;
    private UUID leaveTypeId;
    private String leaveTypeName;
    private String leaveTypeCode;
    private String name;
    private Integer daysAllowed;
    private Integer maxCarryOverDays;
    private Integer carryOverExpiryMonths;
    private String accrualMethod;
    private Boolean proRataForNewJoiners;
    private Integer probationMonths;
    private BigDecimal probationDaysAllowed;
    private Boolean allowNegativeBalance;
    private Integer maxNegativeDays;
    private Boolean allowHalfDay;
    private Boolean encashmentAllowed;
    private BigDecimal maxEncashmentDays;
    private Integer minServiceMonthsForEncashment;
    private Integer minDaysBeforeRequest;
    private Boolean isDefault;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}
