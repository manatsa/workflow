package com.sonar.workflow.leave.service;

import com.sonar.workflow.dto.ReportResultDTO;
import com.sonar.workflow.leave.entity.LeaveRequest;
import com.sonar.workflow.leave.entity.LeaveRequest.LeaveRequestStatus;
import com.sonar.workflow.leave.entity.LeaveBalance;
import com.sonar.workflow.leave.repository.LeaveBalanceRepository;
import com.sonar.workflow.leave.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveReportService {

    private final LeaveRequestRepository requestRepository;
    private final LeaveBalanceRepository balanceRepository;

    @Transactional(readOnly = true)
    public ReportResultDTO generateReport(String reportId, Map<String, String> parameters) {
        return switch (reportId) {
            case "leave-balances" -> generateLeaveBalances(parameters);
            case "leave-taken" -> generateLeaveTaken(parameters);
            case "leave-running" -> generateRunningApplications(parameters);
            case "leave-approval-delays" -> generateApprovalDelays(parameters);
            case "leave-escalated" -> generateEscalated(parameters);
            default -> throw new RuntimeException("Unknown leave report: " + reportId);
        };
    }

    private ReportResultDTO generateLeaveBalances(Map<String, String> parameters) {
        int year = parseYear(parameters.get("year"), LocalDate.now().getYear());
        String departmentFilter = parameters.get("departmentId");
        String leaveTypeFilter = parameters.get("leaveTypeId");

        List<LeaveBalance> balances = balanceRepository.findByYear(year);

        if (departmentFilter != null && !departmentFilter.isEmpty()) {
            balances = balances.stream()
                    .filter(b -> departmentFilter.equals(
                            b.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
        }
        if (leaveTypeFilter != null && !leaveTypeFilter.isEmpty()) {
            UUID ltId = UUID.fromString(leaveTypeFilter);
            balances = balances.stream()
                    .filter(b -> b.getLeaveType().getId().equals(ltId))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "employeeName", "header", "Employee", "type", "string"),
                Map.of("field", "staffId", "header", "Staff ID", "type", "string"),
                Map.of("field", "department", "header", "Department", "type", "string"),
                Map.of("field", "leaveType", "header", "Leave Type", "type", "string"),
                Map.of("field", "entitled", "header", "Entitled", "type", "number"),
                Map.of("field", "carriedOver", "header", "Carried Over", "type", "number"),
                Map.of("field", "used", "header", "Used", "type", "number"),
                Map.of("field", "pending", "header", "Pending", "type", "number"),
                Map.of("field", "available", "header", "Available", "type", "number")
        );

        List<Map<String, Object>> data = balances.stream().map(b -> {
            Map<String, Object> row = new HashMap<>();
            row.put("employeeName", b.getEmployee().getFullName());
            row.put("staffId", b.getEmployee().getStaffId());
            row.put("department", b.getEmployee().getDepartment());
            row.put("leaveType", b.getLeaveType().getName());
            row.put("entitled", b.getEntitled());
            row.put("carriedOver", b.getCarriedOver());
            row.put("used", b.getUsed());
            row.put("pending", b.getPending());
            row.put("available", b.getAvailable());
            return row;
        }).collect(Collectors.toList());

        BigDecimal totalEntitled = balances.stream().map(LeaveBalance::getEntitled).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsed = balances.stream().map(LeaveBalance::getUsed).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAvailable = balances.stream().map(LeaveBalance::getAvailable).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = Map.of(
                "totalRecords", balances.size(),
                "totalEntitled", totalEntitled,
                "totalUsed", totalUsed,
                "totalAvailable", totalAvailable,
                "utilizationRate", totalEntitled.compareTo(BigDecimal.ZERO) > 0
                        ? totalUsed.multiply(BigDecimal.valueOf(100)).divide(totalEntitled, 1, RoundingMode.HALF_UP) + "%"
                        : "0%"
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    private ReportResultDTO generateLeaveTaken(Map<String, String> parameters) {
        LocalDate startDate = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(6));
        LocalDate endDate = parseDate(parameters.get("endDate"), LocalDate.now());
        String statusFilter = parameters.get("status");
        String departmentFilter = parameters.get("departmentId");
        String leaveTypeFilter = parameters.get("leaveTypeId");

        List<LeaveRequest> requests = requestRepository.findApprovedInRange(startDate, endDate);
        // Also include other statuses if requested
        if (statusFilter != null && !statusFilter.isEmpty() && !"APPROVED".equals(statusFilter)) {
            requests = getAllRequestsInRange(startDate, endDate);
            LeaveRequestStatus st = LeaveRequestStatus.valueOf(statusFilter);
            requests = requests.stream().filter(r -> r.getStatus() == st).collect(Collectors.toList());
        }

        requests = applyFilters(requests, departmentFilter, leaveTypeFilter);

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "referenceNumber", "header", "Reference", "type", "string"),
                Map.of("field", "employeeName", "header", "Employee", "type", "string"),
                Map.of("field", "department", "header", "Department", "type", "string"),
                Map.of("field", "leaveType", "header", "Leave Type", "type", "string"),
                Map.of("field", "startDate", "header", "Start Date", "type", "date"),
                Map.of("field", "endDate", "header", "End Date", "type", "date"),
                Map.of("field", "totalDays", "header", "Days", "type", "number"),
                Map.of("field", "status", "header", "Status", "type", "status"),
                Map.of("field", "approvedBy", "header", "Approved By", "type", "string"),
                Map.of("field", "approvedAt", "header", "Approved At", "type", "datetime")
        );

        List<Map<String, Object>> data = requests.stream().map(r -> {
            Map<String, Object> row = new HashMap<>();
            row.put("referenceNumber", r.getReferenceNumber());
            row.put("employeeName", r.getEmployee().getFullName());
            row.put("department", r.getEmployee().getDepartment());
            row.put("leaveType", r.getLeaveType().getName());
            row.put("startDate", r.getStartDate().toString());
            row.put("endDate", r.getEndDate().toString());
            row.put("totalDays", r.getTotalDays());
            row.put("status", r.getStatus().name());
            row.put("approvedBy", r.getApprovedBy() != null ? r.getApprovedBy().getFullName() : "-");
            row.put("approvedAt", r.getApprovedAt() != null ? r.getApprovedAt().toString() : null);
            return row;
        }).collect(Collectors.toList());

        BigDecimal totalDays = requests.stream().map(LeaveRequest::getTotalDays).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> summary = Map.of(
                "totalRecords", requests.size(),
                "totalDays", totalDays,
                "uniqueEmployees", requests.stream().map(r -> r.getEmployee().getId()).distinct().count()
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    private ReportResultDTO generateRunningApplications(Map<String, String> parameters) {
        String departmentFilter = parameters.get("departmentId");
        String leaveTypeFilter = parameters.get("leaveTypeId");

        List<LeaveRequest> pending = requestRepository.findAll().stream()
                .filter(r -> r.getStatus() == LeaveRequestStatus.PENDING)
                .collect(Collectors.toList());

        pending = applyFilters(pending, departmentFilter, leaveTypeFilter);

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "referenceNumber", "header", "Reference", "type", "string"),
                Map.of("field", "employeeName", "header", "Employee", "type", "string"),
                Map.of("field", "department", "header", "Department", "type", "string"),
                Map.of("field", "leaveType", "header", "Leave Type", "type", "string"),
                Map.of("field", "startDate", "header", "Start Date", "type", "date"),
                Map.of("field", "endDate", "header", "End Date", "type", "date"),
                Map.of("field", "totalDays", "header", "Days", "type", "number"),
                Map.of("field", "currentLevel", "header", "Current Level", "type", "string"),
                Map.of("field", "currentApprover", "header", "Current Approver", "type", "string"),
                Map.of("field", "submittedAt", "header", "Submitted", "type", "datetime"),
                Map.of("field", "waitingDays", "header", "Waiting (days)", "type", "number"),
                Map.of("field", "remindersSent", "header", "Reminders Sent", "type", "number")
        );

        List<Map<String, Object>> data = pending.stream().map(r -> {
            Map<String, Object> row = new HashMap<>();
            row.put("referenceNumber", r.getReferenceNumber());
            row.put("employeeName", r.getEmployee().getFullName());
            row.put("department", r.getEmployee().getDepartment());
            row.put("leaveType", r.getLeaveType().getName());
            row.put("startDate", r.getStartDate().toString());
            row.put("endDate", r.getEndDate().toString());
            row.put("totalDays", r.getTotalDays());
            row.put("currentLevel", r.getCurrentLevel() != null && r.getMaxLevel() != null
                    ? r.getCurrentLevel() + "/" + r.getMaxLevel() : "1/1");
            row.put("currentApprover", r.getCurrentApprover() != null ? r.getCurrentApprover().getApproverName() : "-");
            row.put("submittedAt", r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : r.getCreatedAt().toString());
            row.put("waitingDays", r.getSubmittedAt() != null
                    ? ChronoUnit.DAYS.between(r.getSubmittedAt(), LocalDateTime.now()) : 0);
            row.put("remindersSent", r.getReminderCount() != null ? r.getReminderCount() : 0);
            return row;
        }).collect(Collectors.toList());

        long overdue3Days = data.stream().filter(d -> ((Number) d.get("waitingDays")).longValue() > 3).count();
        Map<String, Object> summary = Map.of(
                "totalRecords", pending.size(),
                "overdue3Days", overdue3Days,
                "avgWaitingDays", pending.isEmpty() ? 0 : data.stream()
                        .mapToLong(d -> ((Number) d.get("waitingDays")).longValue()).average().orElse(0)
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    private ReportResultDTO generateApprovalDelays(Map<String, String> parameters) {
        LocalDate startDate = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(3));
        LocalDate endDate = parseDate(parameters.get("endDate"), LocalDate.now());
        String departmentFilter = parameters.get("departmentId");

        List<LeaveRequest> processed = getAllRequestsInRange(startDate, endDate).stream()
                .filter(r -> r.getStatus() == LeaveRequestStatus.APPROVED || r.getStatus() == LeaveRequestStatus.REJECTED)
                .filter(r -> r.getSubmittedAt() != null && r.getApprovedAt() != null)
                .collect(Collectors.toList());

        if (departmentFilter != null && !departmentFilter.isEmpty()) {
            processed = processed.stream()
                    .filter(r -> departmentFilter.equals(r.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "referenceNumber", "header", "Reference", "type", "string"),
                Map.of("field", "employeeName", "header", "Employee", "type", "string"),
                Map.of("field", "department", "header", "Department", "type", "string"),
                Map.of("field", "leaveType", "header", "Leave Type", "type", "string"),
                Map.of("field", "totalDays", "header", "Leave Days", "type", "number"),
                Map.of("field", "submittedAt", "header", "Submitted", "type", "datetime"),
                Map.of("field", "approvedAt", "header", "Decided", "type", "datetime"),
                Map.of("field", "turnaroundHours", "header", "Turnaround (hrs)", "type", "number"),
                Map.of("field", "status", "header", "Decision", "type", "status"),
                Map.of("field", "approvedBy", "header", "Decided By", "type", "string"),
                Map.of("field", "remindersSent", "header", "Reminders Sent", "type", "number")
        );

        List<Map<String, Object>> data = processed.stream().map(r -> {
            long hours = ChronoUnit.HOURS.between(r.getSubmittedAt(), r.getApprovedAt());
            Map<String, Object> row = new HashMap<>();
            row.put("referenceNumber", r.getReferenceNumber());
            row.put("employeeName", r.getEmployee().getFullName());
            row.put("department", r.getEmployee().getDepartment());
            row.put("leaveType", r.getLeaveType().getName());
            row.put("totalDays", r.getTotalDays());
            row.put("submittedAt", r.getSubmittedAt().toString());
            row.put("approvedAt", r.getApprovedAt().toString());
            row.put("turnaroundHours", hours);
            row.put("status", r.getStatus().name());
            row.put("approvedBy", r.getApprovedBy() != null ? r.getApprovedBy().getFullName() : "-");
            row.put("remindersSent", r.getReminderCount() != null ? r.getReminderCount() : 0);
            return row;
        }).collect(Collectors.toList());

        double avgHours = data.stream().mapToLong(d -> ((Number) d.get("turnaroundHours")).longValue()).average().orElse(0);
        long delayed24h = data.stream().filter(d -> ((Number) d.get("turnaroundHours")).longValue() > 24).count();
        Map<String, Object> summary = Map.of(
                "totalRecords", processed.size(),
                "avgTurnaroundHours", Math.round(avgHours),
                "delayedOver24h", delayed24h,
                "delayRate", processed.isEmpty() ? "0%" : Math.round(delayed24h * 100.0 / processed.size()) + "%"
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    private ReportResultDTO generateEscalated(Map<String, String> parameters) {
        LocalDate startDate = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(6));
        LocalDate endDate = parseDate(parameters.get("endDate"), LocalDate.now());
        String departmentFilter = parameters.get("departmentId");

        List<LeaveRequest> escalated = getAllRequestsInRange(startDate, endDate).stream()
                .filter(r -> r.getEscalatedAt() != null)
                .collect(Collectors.toList());

        if (departmentFilter != null && !departmentFilter.isEmpty()) {
            escalated = escalated.stream()
                    .filter(r -> departmentFilter.equals(r.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "referenceNumber", "header", "Reference", "type", "string"),
                Map.of("field", "employeeName", "header", "Employee", "type", "string"),
                Map.of("field", "department", "header", "Department", "type", "string"),
                Map.of("field", "leaveType", "header", "Leave Type", "type", "string"),
                Map.of("field", "startDate", "header", "Leave Start", "type", "date"),
                Map.of("field", "endDate", "header", "Leave End", "type", "date"),
                Map.of("field", "totalDays", "header", "Days", "type", "number"),
                Map.of("field", "submittedAt", "header", "Submitted", "type", "datetime"),
                Map.of("field", "escalatedAt", "header", "Escalated At", "type", "datetime"),
                Map.of("field", "hoursBeforeEscalation", "header", "Hrs Before Escalation", "type", "number"),
                Map.of("field", "remindersSent", "header", "Reminders Sent", "type", "number"),
                Map.of("field", "status", "header", "Current Status", "type", "status")
        );

        List<Map<String, Object>> data = escalated.stream().map(r -> {
            Map<String, Object> row = new HashMap<>();
            row.put("referenceNumber", r.getReferenceNumber());
            row.put("employeeName", r.getEmployee().getFullName());
            row.put("department", r.getEmployee().getDepartment());
            row.put("leaveType", r.getLeaveType().getName());
            row.put("startDate", r.getStartDate().toString());
            row.put("endDate", r.getEndDate().toString());
            row.put("totalDays", r.getTotalDays());
            row.put("submittedAt", r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : null);
            row.put("escalatedAt", r.getEscalatedAt().toString());
            row.put("hoursBeforeEscalation", r.getSubmittedAt() != null
                    ? ChronoUnit.HOURS.between(r.getSubmittedAt(), r.getEscalatedAt()) : 0);
            row.put("remindersSent", r.getReminderCount() != null ? r.getReminderCount() : 0);
            row.put("status", r.getStatus().name());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> summary = Map.of(
                "totalRecords", escalated.size(),
                "stillPending", escalated.stream().filter(r -> r.getStatus() == LeaveRequestStatus.PENDING).count(),
                "resolved", escalated.stream().filter(r -> r.getStatus() != LeaveRequestStatus.PENDING).count()
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    // --- Helpers ---

    private List<LeaveRequest> getAllRequestsInRange(LocalDate startDate, LocalDate endDate) {
        return requestRepository.findAll().stream()
                .filter(r -> {
                    LocalDate created = r.getCreatedAt() != null ? r.getCreatedAt().toLocalDate() : null;
                    if (created == null) return true;
                    return !created.isBefore(startDate) && !created.isAfter(endDate);
                })
                .collect(Collectors.toList());
    }

    private List<LeaveRequest> applyFilters(List<LeaveRequest> requests, String departmentFilter, String leaveTypeFilter) {
        if (departmentFilter != null && !departmentFilter.isEmpty()) {
            requests = requests.stream()
                    .filter(r -> departmentFilter.equals(r.getEmployee().getDepartment()))
                    .collect(Collectors.toList());
        }
        if (leaveTypeFilter != null && !leaveTypeFilter.isEmpty()) {
            UUID ltId = UUID.fromString(leaveTypeFilter);
            requests = requests.stream()
                    .filter(r -> r.getLeaveType().getId().equals(ltId))
                    .collect(Collectors.toList());
        }
        return requests;
    }

    private LocalDate parseDate(String dateStr, LocalDate defaultValue) {
        if (dateStr == null || dateStr.isEmpty()) return defaultValue;
        try { return LocalDate.parse(dateStr); }
        catch (Exception e) { return defaultValue; }
    }

    private int parseYear(String yearStr, int defaultValue) {
        if (yearStr == null || yearStr.isEmpty()) return defaultValue;
        try { return Integer.parseInt(yearStr); }
        catch (Exception e) { return defaultValue; }
    }
}
