package com.sonar.workflow.leave.service;

import com.sonar.workflow.entity.Department;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveDashboardDTO;
import com.sonar.workflow.leave.dto.LeaveRequestDTO;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.entity.LeaveRequest.LeaveRequestStatus;
import com.sonar.workflow.leave.repository.LeaveRequestRepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveDashboardService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final LeaveRequestService leaveRequestService;
    private final LeaveCalculationService calculationService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public LeaveDashboardDTO getDashboard() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        int currentYear = calculationService.getCurrentLeaveYear();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        // My pending requests
        List<LeaveRequestDTO> pendingRequests = leaveRequestRepository
                .findByEmployeeIdAndStatusIn(employee.getId(), List.of(LeaveRequestStatus.PENDING))
                .stream().map(leaveRequestService::toDTO).collect(Collectors.toList());

        // My upcoming approved leave
        List<LeaveRequest> upcomingLeave = leaveRequestRepository
                .findApprovedInRange(today, thirtyDaysFromNow)
                .stream()
                .filter(lr -> lr.getEmployee().getId().equals(employee.getId()))
                .collect(Collectors.toList());

        // Team on leave today (filtered by approvable employees)
        List<LeaveRequest> teamOnLeave = getApprovedLeaveForUser(employee, today, today);

        long totalPendingApprovals = leaveRequestRepository.countByStatus(LeaveRequestStatus.PENDING);

        return LeaveDashboardDTO.builder()
                .balances(leaveBalanceService.getMyBalances(employee.getId(), currentYear))
                .pendingRequests(pendingRequests)
                .upcomingLeave(upcomingLeave.stream().map(leaveRequestService::toDTO).collect(Collectors.toList()))
                .teamOnLeave(teamOnLeave.stream().map(leaveRequestService::toDTO).collect(Collectors.toList()))
                .totalPendingApprovals(totalPendingApprovals)
                .build();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getTeamCalendar(LocalDate from, LocalDate to) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        return getApprovedLeaveForUser(currentUser, from, to).stream()
                .map(leaveRequestService::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getBadgeCounts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        // 1. Pending approvals for current user (based on privilege)
        long pendingApprovals = 0;
        if (employee.hasPrivilege("ADMIN") || employee.hasPrivilege("LEAVE_ADMIN")) {
            pendingApprovals = leaveRequestRepository.countByStatus(LeaveRequest.LeaveRequestStatus.PENDING);
        } else if (employee.hasPrivilege("LEAVE_APPROVE")) {
            List<UUID> departmentIds = employee.getDepartments().stream()
                    .map(Department::getId).collect(Collectors.toList());
            if (!departmentIds.isEmpty()) {
                pendingApprovals = leaveRequestRepository.countByStatusForDepartments(
                        LeaveRequest.LeaveRequestStatus.PENDING, departmentIds);
            }
        }

        // 2. My pending requests (submitted by me, awaiting approval)
        long myPending = leaveRequestRepository.countByEmployeeIdAndStatus(
                employee.getId(), LeaveRequest.LeaveRequestStatus.PENDING);

        // 3. My approved upcoming (approved but start date in the future)
        long approvedUpcoming = leaveRequestRepository.countApprovedUpcoming(
                employee.getId(), LocalDate.now());

        return Map.of(
                "pendingApprovals", pendingApprovals,
                "myPending", myPending,
                "approvedUpcoming", approvedUpcoming
        );
    }

    /**
     * Returns approved leave requests visible to the given user:
     * - ADMIN/LEAVE_ADMIN: see all employees
     * - LEAVE_APPROVE: see employees in the same department(s)
     * - Others: see only their own leave
     */
    private List<LeaveRequest> getApprovedLeaveForUser(User user, LocalDate from, LocalDate to) {
        if (user.hasPrivilege("ADMIN") || user.hasPrivilege("LEAVE_ADMIN")) {
            return leaveRequestRepository.findApprovedInRange(from, to);
        }

        if (user.hasPrivilege("LEAVE_APPROVE")) {
            List<UUID> departmentIds = user.getDepartments().stream()
                    .map(Department::getId)
                    .collect(Collectors.toList());
            if (!departmentIds.isEmpty()) {
                return leaveRequestRepository.findApprovedInRangeForDepartments(from, to, departmentIds);
            }
        }

        // Regular user: only their own approved leave
        return leaveRequestRepository.findApprovedInRange(from, to).stream()
                .filter(lr -> lr.getEmployee().getId().equals(user.getId()))
                .collect(Collectors.toList());
    }
}
