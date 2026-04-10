package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveBalanceAdjustmentDTO;
import com.sonar.workflow.leave.dto.LeaveBalanceDTO;
import com.sonar.workflow.leave.service.LeaveBalanceService;
import com.sonar.workflow.leave.service.LeaveCalculationService;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/balances")
@RequiredArgsConstructor
public class LeaveBalanceController {

    private final LeaveBalanceService leaveBalanceService;
    private final LeaveCalculationService calculationService;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getMyBalances(
            @RequestParam(required = false) Integer year) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        int targetYear = year != null ? year : calculationService.getCurrentLeaveYear();
        return ResponseEntity.ok(ApiResponse.success(leaveBalanceService.getMyBalances(employee.getId(), targetYear)));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN', 'LEAVE_APPROVE')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getEmployeeBalances(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : calculationService.getCurrentLeaveYear();
        return ResponseEntity.ok(ApiResponse.success(leaveBalanceService.getMyBalances(employeeId, targetYear)));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getAllBalances(
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : calculationService.getCurrentLeaveYear();
        return ResponseEntity.ok(ApiResponse.success(leaveBalanceService.getAllBalancesForYear(targetYear)));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveBalanceDTO>> adjustBalance(@RequestBody LeaveBalanceAdjustmentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Balance adjusted", leaveBalanceService.adjustBalance(dto)));
    }

    @PostMapping("/initialize/{year}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> initializeYear(@PathVariable int year) {
        return ResponseEntity.ok(ApiResponse.success("Balances initialized for year " + year,
                leaveBalanceService.initializeBalancesForYear(year)));
    }
}
