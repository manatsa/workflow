package com.sonar.workflow.leave.service;

import com.sonar.workflow.entity.Department;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveApprovalHistoryDTO;
import com.sonar.workflow.leave.dto.LeaveRequestDTO;
import com.sonar.workflow.leave.entity.LeaveApprovalHistory;
import com.sonar.workflow.leave.entity.LeaveApprover;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.entity.LeaveRequest.HalfDayPeriod;
import com.sonar.workflow.leave.entity.LeaveRequest.LeaveRequestStatus;
import com.sonar.workflow.leave.entity.LeaveType;
import com.sonar.workflow.leave.repository.LeaveApprovalHistoryRepository;
import com.sonar.workflow.leave.repository.LeaveApproverRepository;
import com.sonar.workflow.leave.repository.LeaveRequestRepository;
import com.sonar.workflow.leave.repository.LeaveTypeRepository;
import com.sonar.workflow.repository.UserRepository;
import com.sonar.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final UserRepository userRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final LeaveCalculationService calculationService;
    private final SettingService settingService;
    private final LeaveApproverRepository leaveApproverRepository;
    private final LeaveApprovalHistoryRepository approvalHistoryRepository;
    private final LeaveNotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<LeaveRequestDTO> getMyRequests(UUID employeeId, Pageable pageable) {
        return leaveRequestRepository.findByEmployeeId(employeeId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDTO> getPendingApprovals(Pageable pageable) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        // ADMIN/LEAVE_ADMIN see all pending requests
        if (currentUser.hasPrivilege("ADMIN") || currentUser.hasPrivilege("LEAVE_ADMIN")) {
            return leaveRequestRepository.findByStatus(LeaveRequestStatus.PENDING, pageable).map(this::toDTO);
        }

        // If user is a configured leave approver, show only requests assigned to them
        long assignedCount = leaveRequestRepository.countPendingForApprover(currentUser.getId());
        if (assignedCount > 0 || !leaveApproverRepository.findByUserId(currentUser.getId()).isEmpty()) {
            return leaveRequestRepository.findPendingForApprover(currentUser.getId(), pageable).map(this::toDTO);
        }

        // Fallback: LEAVE_APPROVE sees pending requests from employees in their department(s)
        if (currentUser.hasPrivilege("LEAVE_APPROVE")) {
            List<UUID> departmentIds = currentUser.getDepartments().stream()
                    .map(Department::getId)
                    .collect(Collectors.toList());
            if (!departmentIds.isEmpty()) {
                return leaveRequestRepository.findByStatusForDepartments(
                        LeaveRequestStatus.PENDING, departmentIds, pageable).map(this::toDTO);
            }
        }

        return Page.empty(pageable);
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDTO> search(String searchTerm, Pageable pageable) {
        return leaveRequestRepository.search(searchTerm != null ? searchTerm : "", pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public LeaveRequestDTO getById(UUID id) {
        return toDTO(leaveRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave request not found")));
    }

    @Transactional
    public LeaveRequestDTO create(LeaveRequestDTO dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                .orElseThrow(() -> new BusinessException("Leave type not found"));

        LocalDate startDate = LocalDate.parse(dto.getStartDate());
        LocalDate endDate = LocalDate.parse(dto.getEndDate());

        if (startDate.isAfter(endDate)) {
            throw new BusinessException("Start date must be before or equal to end date");
        }

        boolean allowOverlap = settingService.getBooleanValue("leave.overlap.allowed", false);
        if (!allowOverlap) {
            List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                    employee.getId(), startDate, endDate);
            if (!overlapping.isEmpty()) {
                throw new BusinessException("You already have a leave request for the selected dates");
            }
        }

        BigDecimal totalDays = calculationService.calculateWorkingDays(
                startDate, endDate,
                Boolean.TRUE.equals(dto.getStartDateHalfDay()),
                Boolean.TRUE.equals(dto.getEndDateHalfDay()));

        if (totalDays.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("No working days in the selected date range");
        }

        LeaveRequest request = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .referenceNumber(generateReferenceNumber())
                .startDate(startDate)
                .endDate(endDate)
                .startDateHalfDay(dto.getStartDateHalfDay() != null ? dto.getStartDateHalfDay() : false)
                .startDateHalfDayPeriod(dto.getStartDateHalfDayPeriod() != null ?
                        HalfDayPeriod.valueOf(dto.getStartDateHalfDayPeriod()) : null)
                .endDateHalfDay(dto.getEndDateHalfDay() != null ? dto.getEndDateHalfDay() : false)
                .endDateHalfDayPeriod(dto.getEndDateHalfDayPeriod() != null ?
                        HalfDayPeriod.valueOf(dto.getEndDateHalfDayPeriod()) : null)
                .totalDays(totalDays)
                .reason(dto.getReason())
                .status(LeaveRequestStatus.PENDING)
                .contactWhileOnLeave(dto.getContactWhileOnLeave())
                .submittedAt(LocalDateTime.now())
                .build();

        if (dto.getDelegateToId() != null) {
            User delegate = userRepository.findById(dto.getDelegateToId())
                    .orElseThrow(() -> new BusinessException("Delegate user not found"));
            request.setDelegateTo(delegate);
        }

        // Determine approval chain from employee's departments
        assignApprovalChain(request, employee);

        request = leaveRequestRepository.save(request);

        // Record submission history
        addHistory(request, employee, request.getCurrentLevel(), LeaveApprovalHistory.Action.SUBMITTED, null);

        // Add to pending balance
        leaveBalanceService.addPending(request);

        // Notify the current approver
        if (request.getCurrentApprover() != null) {
            notificationService.notifyApproverOfPendingRequest(request, request.getCurrentApprover());
        }

        log.info("Created leave request {} for employee {}", request.getReferenceNumber(), username);
        return toDTO(request);
    }

    @Transactional
    public LeaveRequestDTO approve(UUID requestId, String comments) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be approved");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User approver = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        int currentLevel = request.getCurrentLevel() != null ? request.getCurrentLevel() : 1;
        Integer maxLevel = request.getMaxLevel();

        // Record approval at this level
        addHistory(request, approver, currentLevel, LeaveApprovalHistory.Action.APPROVED, comments);

        // Check if more levels needed
        if (maxLevel != null && currentLevel < maxLevel) {
            // Advance to next level
            List<LeaveApprover> nextApprovers = leaveApproverRepository.findByDepartmentIdAndLevel(
                    getRequestDepartmentId(request), currentLevel + 1);

            if (!nextApprovers.isEmpty()) {
                request.setCurrentLevel(currentLevel + 1);
                request.setCurrentApprover(nextApprovers.get(0));
                request.setReminderCount(0);
                request.setLastReminderSentAt(null);
                request.setEscalatedAt(null);
                request = leaveRequestRepository.save(request);

                notificationService.notifyApproverOfPendingRequest(request, nextApprovers.get(0));
                log.info("Leave request {} approved at level {}, advanced to level {}", request.getReferenceNumber(), currentLevel, currentLevel + 1);
                return toDTO(request);
            }
        }

        // Final approval
        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request.setApproverComments(comments);
        request = leaveRequestRepository.save(request);

        leaveBalanceService.deductBalance(request);
        notificationService.notifySubmitterOfDecision(request, "APPROVED", approver.getFullName(), comments);

        log.info("Leave request {} fully approved by {}", request.getReferenceNumber(), username);
        return toDTO(request);
    }

    @Transactional
    public LeaveRequestDTO reject(UUID requestId, String comments) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be rejected");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User approver = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        addHistory(request, approver, request.getCurrentLevel(), LeaveApprovalHistory.Action.REJECTED, comments);

        request.setStatus(LeaveRequestStatus.REJECTED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request.setApproverComments(comments);
        request = leaveRequestRepository.save(request);

        leaveBalanceService.restoreBalance(request);
        notificationService.notifySubmitterOfDecision(request, "REJECTED", approver.getFullName(), comments);

        log.info("Rejected leave request {} by {}", request.getReferenceNumber(), username);
        return toDTO(request);
    }

    @Transactional
    public LeaveRequestDTO cancel(UUID requestId, String reason) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING &&
            request.getStatus() != LeaveRequestStatus.APPROVED) {
            throw new BusinessException("Only pending or approved requests can be cancelled");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);

        addHistory(request, user, request.getCurrentLevel(), LeaveApprovalHistory.Action.CANCELLED, reason);

        request.setCancellationReason(reason);
        LeaveRequestStatus previousStatus = request.getStatus();
        request.setStatus(LeaveRequestStatus.CANCELLED);
        request = leaveRequestRepository.save(request);

        if (previousStatus == LeaveRequestStatus.APPROVED) {
            leaveBalanceService.restoreBalance(request);
        } else {
            LeaveRequest tempRequest = request;
            tempRequest.setStatus(LeaveRequestStatus.PENDING);
            leaveBalanceService.restoreBalance(tempRequest);
            request.setStatus(LeaveRequestStatus.CANCELLED);
        }

        log.info("Cancelled leave request {}", request.getReferenceNumber());
        return toDTO(request);
    }

    @Transactional
    public LeaveRequestDTO recall(UUID requestId) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be recalled");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElse(null);

        addHistory(request, user, request.getCurrentLevel(), LeaveApprovalHistory.Action.RECALLED, null);

        request.setStatus(LeaveRequestStatus.RECALLED);
        request = leaveRequestRepository.save(request);

        leaveBalanceService.restoreBalance(request);

        log.info("Recalled leave request {}", request.getReferenceNumber());
        return toDTO(request);
    }

    @Transactional
    public LeaveRequestDTO reassign(UUID requestId, UUID newApproverUserId, String reason) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("Leave request not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be reassigned");
        }

        User newApproverUser = userRepository.findById(newApproverUserId)
                .orElseThrow(() -> new BusinessException("User not found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        // Find or use existing LeaveApprover for the new user in the same department
        UUID deptId = getRequestDepartmentId(request);
        LeaveApprover newApprover = null;
        if (deptId != null) {
            newApprover = leaveApproverRepository.findByDepartmentIdAndUserId(deptId, newApproverUserId)
                    .orElse(null);
        }

        // If not a configured approver, create a temporary assignment
        if (newApprover == null) {
            // Just update the tracking fields directly
            request.setCurrentApprover(null);
        } else {
            request.setCurrentApprover(newApprover);
        }

        request.setReminderCount(0);
        request.setLastReminderSentAt(null);
        request.setEscalatedAt(null);
        request = leaveRequestRepository.save(request);

        addHistory(request, currentUser, request.getCurrentLevel(), LeaveApprovalHistory.Action.REASSIGNED,
                "Reassigned to " + newApproverUser.getFullName() + (reason != null ? ": " + reason : ""));

        notificationService.notifyOfReassignment(request, newApproverUser.getFullName(), reason);

        log.info("Reassigned leave request {} to {}", request.getReferenceNumber(), newApproverUser.getFullName());
        return toDTO(request);
    }

    public BigDecimal calculateDays(String startDate, String endDate, boolean startHalf, boolean endHalf) {
        return calculationService.calculateWorkingDays(
                LocalDate.parse(startDate), LocalDate.parse(endDate), startHalf, endHalf);
    }

    // --- Private helpers ---

    private void assignApprovalChain(LeaveRequest request, User employee) {
        UUID departmentId = employee.getDepartments().stream()
                .findFirst().map(Department::getId).orElse(null);
        if (departmentId == null) return;

        List<LeaveApprover> approvers = leaveApproverRepository
                .findByDepartmentIdOrderByLevelAscDisplayOrderAsc(departmentId);
        if (approvers.isEmpty()) return;

        Integer maxLevel = leaveApproverRepository.findMaxLevelByDepartmentId(departmentId);
        List<LeaveApprover> level1 = approvers.stream()
                .filter(a -> a.getLevel() != null && a.getLevel() == 1)
                .collect(Collectors.toList());

        if (!level1.isEmpty()) {
            request.setCurrentApprover(level1.get(0));
            request.setCurrentLevel(1);
            request.setMaxLevel(maxLevel != null ? maxLevel : 1);
        }
    }

    private UUID getRequestDepartmentId(LeaveRequest request) {
        return request.getEmployee().getDepartments().stream()
                .findFirst().map(Department::getId).orElse(null);
    }

    private void addHistory(LeaveRequest request, User actor, Integer level,
                            LeaveApprovalHistory.Action action, String comments) {
        LeaveApprovalHistory history = LeaveApprovalHistory.builder()
                .leaveRequest(request)
                .approver(actor)
                .approverName(actor != null ? actor.getFullName() : "System")
                .approverEmail(actor != null ? actor.getEmail() : null)
                .level(level)
                .action(action)
                .comments(comments)
                .actionDate(LocalDateTime.now())
                .build();
        approvalHistoryRepository.save(history);
    }

    private String generateReferenceNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "LR-" + year + "-";
        try {
            int maxNum = leaveRequestRepository.findMaxReferenceNumberForPrefix(prefix + "%");
            return prefix + String.format("%04d", maxNum + 1);
        } catch (Exception e) {
            return prefix + "0001";
        }
    }

    public LeaveRequestDTO toDTO(LeaveRequest entity) {
        User employee = entity.getEmployee();
        LeaveType leaveType = entity.getLeaveType();

        LeaveRequestDTO.LeaveRequestDTOBuilder builder = LeaveRequestDTO.builder()
                .id(entity.getId())
                .employeeId(employee.getId())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .employeeStaffId(employee.getStaffId())
                .department(employee.getDepartment())
                .leaveTypeId(leaveType.getId())
                .leaveTypeName(leaveType.getName())
                .leaveTypeCode(leaveType.getCode())
                .leaveTypeColor(leaveType.getColorCode())
                .referenceNumber(entity.getReferenceNumber())
                .startDate(entity.getStartDate() != null ? entity.getStartDate().toString() : null)
                .endDate(entity.getEndDate() != null ? entity.getEndDate().toString() : null)
                .startDateHalfDay(entity.getStartDateHalfDay())
                .startDateHalfDayPeriod(entity.getStartDateHalfDayPeriod() != null ?
                        entity.getStartDateHalfDayPeriod().name() : null)
                .endDateHalfDay(entity.getEndDateHalfDay())
                .endDateHalfDayPeriod(entity.getEndDateHalfDayPeriod() != null ?
                        entity.getEndDateHalfDayPeriod().name() : null)
                .totalDays(entity.getTotalDays())
                .reason(entity.getReason())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .cancellationReason(entity.getCancellationReason())
                .approvedAt(entity.getApprovedAt() != null ? entity.getApprovedAt().toString() : null)
                .approverComments(entity.getApproverComments())
                .contactWhileOnLeave(entity.getContactWhileOnLeave())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .createdBy(entity.getCreatedBy())
                .currentLevel(entity.getCurrentLevel())
                .maxLevel(entity.getMaxLevel())
                .submittedAt(entity.getSubmittedAt() != null ? entity.getSubmittedAt().toString() : null);

        if (entity.getCurrentApprover() != null) {
            builder.currentApproverId(entity.getCurrentApprover().getId())
                    .currentApproverUserId(entity.getCurrentApprover().getUser().getId())
                    .currentApproverName(entity.getCurrentApprover().getApproverName());
        }

        if (entity.getApprovedBy() != null) {
            builder.approvedById(entity.getApprovedBy().getId())
                    .approvedByName(entity.getApprovedBy().getFirstName() + " " + entity.getApprovedBy().getLastName());
        }

        if (entity.getDelegateTo() != null) {
            builder.delegateToId(entity.getDelegateTo().getId())
                    .delegateToName(entity.getDelegateTo().getFirstName() + " " + entity.getDelegateTo().getLastName());
        }

        // Include approval history
        try {
            List<LeaveApprovalHistoryDTO> historyDtos = entity.getApprovalHistory().stream()
                    .map(h -> LeaveApprovalHistoryDTO.builder()
                            .id(h.getId())
                            .approverName(h.getApproverName())
                            .approverEmail(h.getApproverEmail())
                            .level(h.getLevel())
                            .action(h.getAction() != null ? h.getAction().name() : null)
                            .comments(h.getComments())
                            .actionDate(h.getActionDate() != null ? h.getActionDate().toString() : null)
                            .build())
                    .collect(Collectors.toList());
            builder.approvalHistory(historyDtos);
        } catch (Exception e) {
            // Lazy loading may fail in some contexts
        }

        return builder.build();
    }
}
