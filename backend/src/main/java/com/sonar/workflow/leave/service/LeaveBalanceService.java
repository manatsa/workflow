package com.sonar.workflow.leave.service;

import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveBalanceAdjustmentDTO;
import com.sonar.workflow.leave.dto.LeaveBalanceDTO;
import com.sonar.workflow.leave.entity.LeaveBalance;
import com.sonar.workflow.leave.entity.LeavePolicy;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.entity.LeaveType;
import com.sonar.workflow.leave.repository.LeaveBalanceRepository;
import com.sonar.workflow.leave.repository.LeavePolicyRepository;
import com.sonar.workflow.leave.repository.LeaveTypeRepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveBalanceService {

    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final UserRepository userRepository;
    private final LeaveCalculationService calculationService;

    @Transactional(readOnly = true)
    public List<LeaveBalanceDTO> getMyBalances(UUID employeeId, int year) {
        return leaveBalanceRepository.findByEmployeeWithDetailsForYear(employeeId, year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceDTO> getAllBalancesForYear(int year) {
        return leaveBalanceRepository.findAllWithDetailsForYear(year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<LeaveBalanceDTO> initializeBalancesForYear(int year) {
        List<User> activeUsers = userRepository.findAllActiveUsers();
        List<LeaveType> activeTypes = leaveTypeRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        List<LeaveBalance> created = new ArrayList<>();

        for (User user : activeUsers) {
            for (LeaveType leaveType : activeTypes) {
                if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                        user.getId(), leaveType.getId(), year).isEmpty()) {
                    LeaveBalance balance = createBalance(user, leaveType, year);
                    created.add(balance);
                }
            }
        }

        log.info("Initialized {} leave balances for year {}", created.size(), year);
        return created.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public LeaveBalanceDTO initializeBalanceForEmployee(UUID employeeId, int year) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException("Employee not found"));

        List<LeaveType> activeTypes = leaveTypeRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        for (LeaveType leaveType : activeTypes) {
            if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    employeeId, leaveType.getId(), year).isEmpty()) {
                createBalance(employee, leaveType, year);
            }
        }

        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
        return balances.isEmpty() ? null : toDTO(balances.get(0));
    }

    @Transactional
    public LeaveBalanceDTO adjustBalance(LeaveBalanceAdjustmentDTO dto) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                dto.getEmployeeId(), dto.getLeaveTypeId(), dto.getYear())
                .orElseThrow(() -> new BusinessException("Leave balance not found for the specified employee, type, and year"));

        balance.setAdjustment(balance.getAdjustment().add(dto.getAdjustmentDays()));
        balance.recalculateAvailable();
        balance = leaveBalanceRepository.save(balance);
        log.info("Adjusted leave balance for employee {} type {} by {} days. Reason: {}",
                dto.getEmployeeId(), dto.getLeaveTypeId(), dto.getAdjustmentDays(), dto.getReason());
        return toDTO(balance);
    }

    @Transactional
    public void deductBalance(LeaveRequest request) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                request.getEmployee().getId(), request.getLeaveType().getId(),
                calculationService.getCurrentLeaveYear())
                .orElseThrow(() -> new BusinessException("Leave balance not found"));

        balance.setPending(balance.getPending().subtract(request.getTotalDays()));
        balance.setUsed(balance.getUsed().add(request.getTotalDays()));
        balance.recalculateAvailable();
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void addPending(LeaveRequest request) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                request.getEmployee().getId(), request.getLeaveType().getId(),
                calculationService.getCurrentLeaveYear())
                .orElseThrow(() -> new BusinessException("Leave balance not found"));

        balance.setPending(balance.getPending().add(request.getTotalDays()));
        balance.recalculateAvailable();
        leaveBalanceRepository.save(balance);
    }

    @Transactional
    public void restoreBalance(LeaveRequest request) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                request.getEmployee().getId(), request.getLeaveType().getId(),
                calculationService.getCurrentLeaveYear())
                .orElseThrow(() -> new BusinessException("Leave balance not found"));

        if (request.getStatus() == LeaveRequest.LeaveRequestStatus.APPROVED) {
            balance.setUsed(balance.getUsed().subtract(request.getTotalDays()));
        } else {
            balance.setPending(balance.getPending().subtract(request.getTotalDays()));
        }
        balance.recalculateAvailable();
        leaveBalanceRepository.save(balance);
    }

    private LeaveBalance createBalance(User employee, LeaveType leaveType, int year) {
        BigDecimal entitled = BigDecimal.valueOf(leaveType.getDefaultDaysPerYear());

        // Check for a default policy override
        leavePolicyRepository.findByLeaveTypeIdAndIsDefaultTrue(leaveType.getId())
                .ifPresent(policy -> {
                    // Pro-rata calculation could be applied here if employee has a join date
                });

        LeaveBalance balance = LeaveBalance.builder()
                .employee(employee)
                .leaveType(leaveType)
                .year(year)
                .entitled(entitled)
                .carriedOver(BigDecimal.ZERO)
                .adjustment(BigDecimal.ZERO)
                .used(BigDecimal.ZERO)
                .pending(BigDecimal.ZERO)
                .encashed(BigDecimal.ZERO)
                .available(entitled)
                .build();

        return leaveBalanceRepository.save(balance);
    }

    public LeaveBalanceDTO toDTO(LeaveBalance entity) {
        User employee = entity.getEmployee();
        LeaveType leaveType = entity.getLeaveType();

        return LeaveBalanceDTO.builder()
                .id(entity.getId())
                .employeeId(employee.getId())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .employeeStaffId(employee.getStaffId())
                .department(employee.getDepartment())
                .leaveTypeId(leaveType.getId())
                .leaveTypeName(leaveType.getName())
                .leaveTypeCode(leaveType.getCode())
                .leaveTypeColor(leaveType.getColorCode())
                .year(entity.getYear())
                .entitled(entity.getEntitled())
                .carriedOver(entity.getCarriedOver())
                .adjustment(entity.getAdjustment())
                .used(entity.getUsed())
                .pending(entity.getPending())
                .encashed(entity.getEncashed())
                .available(entity.getAvailable())
                .build();
    }
}
