package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveDashboardDTO {
    private List<LeaveBalanceDTO> balances;
    private List<LeaveRequestDTO> pendingRequests;
    private List<LeaveRequestDTO> upcomingLeave;
    private List<LeaveRequestDTO> teamOnLeave;
    private long totalPendingApprovals;
}
