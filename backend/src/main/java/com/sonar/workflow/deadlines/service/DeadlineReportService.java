package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.entity.*;
import com.sonar.workflow.deadlines.entity.DeadlineInstance.InstanceStatus;
import com.sonar.workflow.deadlines.entity.DeadlineItem.DeadlinePriority;
import com.sonar.workflow.deadlines.repository.*;
import com.sonar.workflow.dto.ReportResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineReportService {

    private final DeadlineInstanceRepository instanceRepository;
    private final DeadlineItemRepository itemRepository;
    private final DeadlineCategoryRepository categoryRepository;
    private final DeadlineReminderLogRepository reminderLogRepository;

    @Transactional(readOnly = true)
    public ReportResultDTO generateReport(String reportId, Map<String, String> parameters) {
        return switch (reportId) {
            case "deadline-status-overview" -> generateStatusOverview(parameters);
            case "deadline-overdue" -> generateOverdueReport(parameters);
            case "deadline-compliance" -> generateComplianceReport(parameters);
            case "deadline-reminders" -> generateReminderReport(parameters);
            default -> throw new RuntimeException("Unknown deadline report: " + reportId);
        };
    }

    /**
     * Status Overview: All deadline instances with item, category, priority, status, due date, owner.
     */
    private ReportResultDTO generateStatusOverview(Map<String, String> parameters) {
        LocalDate from = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(3));
        LocalDate to = parseDate(parameters.get("endDate"), LocalDate.now().plusMonths(3));
        String categoryFilter = parameters.get("categoryId");
        String priorityFilter = parameters.get("priority");
        String statusFilter = parameters.get("status");

        List<DeadlineInstance> instances = instanceRepository.findByStatusInAndDueDateBetween(
                List.of(InstanceStatus.values()), from, to);

        instances = applyFilters(instances, categoryFilter, priorityFilter, statusFilter);

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "itemName", "header", "Deadline", "type", "string"),
                Map.of("field", "code", "header", "Code", "type", "string"),
                Map.of("field", "category", "header", "Category", "type", "string"),
                Map.of("field", "priority", "header", "Priority", "type", "status"),
                Map.of("field", "recurrence", "header", "Recurrence", "type", "string"),
                Map.of("field", "dueDate", "header", "Due Date", "type", "date"),
                Map.of("field", "status", "header", "Status", "type", "status"),
                Map.of("field", "owner", "header", "Owner", "type", "string"),
                Map.of("field", "completedAt", "header", "Completed At", "type", "datetime"),
                Map.of("field", "daysUntilDue", "header", "Days to Due", "type", "number")
        );

        List<Map<String, Object>> data = instances.stream().map(inst -> {
            DeadlineItem item = inst.getDeadlineItem();
            Map<String, Object> row = new HashMap<>();
            row.put("itemName", item.getName());
            row.put("code", item.getCode());
            row.put("category", item.getCategory() != null ? item.getCategory().getName() : "-");
            row.put("priority", item.getPriority().name());
            row.put("recurrence", item.getRecurrenceType().name());
            row.put("dueDate", inst.getDueDate().toString());
            row.put("status", inst.getStatus().name());
            row.put("owner", item.getOwner() != null ? item.getOwner().getFullName() : "-");
            row.put("completedAt", inst.getCompletedAt() != null ? inst.getCompletedAt().toString() : null);
            long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), inst.getDueDate());
            row.put("daysUntilDue", daysUntil);
            return row;
        }).collect(Collectors.toList());

        long overdue = instances.stream().filter(i -> i.getStatus() == InstanceStatus.OVERDUE).count();
        long dueSoon = instances.stream().filter(i -> i.getStatus() == InstanceStatus.DUE_SOON).count();
        long completed = instances.stream().filter(i -> i.getStatus() == InstanceStatus.COMPLETED).count();

        Map<String, Object> summary = Map.of(
                "totalRecords", instances.size(),
                "overdue", overdue,
                "dueSoon", dueSoon,
                "completed", completed,
                "completionRate", instances.isEmpty() ? "0%" : Math.round(completed * 100.0 / instances.size()) + "%"
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    /**
     * Overdue Report: All overdue deadline instances with days overdue, priority, owner, reminders sent.
     */
    private ReportResultDTO generateOverdueReport(Map<String, String> parameters) {
        String categoryFilter = parameters.get("categoryId");
        String priorityFilter = parameters.get("priority");

        List<DeadlineInstance> overdue = instanceRepository.findByStatusIn(List.of(InstanceStatus.OVERDUE));

        overdue = applyFilters(overdue, categoryFilter, priorityFilter, null);

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "itemName", "header", "Deadline", "type", "string"),
                Map.of("field", "code", "header", "Code", "type", "string"),
                Map.of("field", "category", "header", "Category", "type", "string"),
                Map.of("field", "priority", "header", "Priority", "type", "status"),
                Map.of("field", "dueDate", "header", "Due Date", "type", "date"),
                Map.of("field", "daysOverdue", "header", "Days Overdue", "type", "number"),
                Map.of("field", "owner", "header", "Owner", "type", "string"),
                Map.of("field", "sbu", "header", "SBU", "type", "string"),
                Map.of("field", "remindersSent", "header", "Reminders Sent", "type", "number"),
                Map.of("field", "recurrence", "header", "Recurrence", "type", "string")
        );

        List<Map<String, Object>> data = overdue.stream().map(inst -> {
            DeadlineItem item = inst.getDeadlineItem();
            Map<String, Object> row = new HashMap<>();
            row.put("itemName", item.getName());
            row.put("code", item.getCode());
            row.put("category", item.getCategory() != null ? item.getCategory().getName() : "-");
            row.put("priority", item.getPriority().name());
            row.put("dueDate", inst.getDueDate().toString());
            row.put("daysOverdue", ChronoUnit.DAYS.between(inst.getDueDate(), LocalDate.now()));
            row.put("owner", item.getOwner() != null ? item.getOwner().getFullName() : "-");
            row.put("sbu", item.getSbu() != null ? item.getSbu().getName() : "-");
            row.put("remindersSent", inst.getReminderLogs() != null ? inst.getReminderLogs().size() : 0);
            row.put("recurrence", item.getRecurrenceType().name());
            return row;
        }).collect(Collectors.toList());

        long critical = overdue.stream().filter(i -> i.getDeadlineItem().getPriority() == DeadlinePriority.CRITICAL).count();
        long high = overdue.stream().filter(i -> i.getDeadlineItem().getPriority() == DeadlinePriority.HIGH).count();
        double avgDaysOverdue = data.stream().mapToLong(d -> ((Number) d.get("daysOverdue")).longValue()).average().orElse(0);

        Map<String, Object> summary = Map.of(
                "totalRecords", overdue.size(),
                "critical", critical,
                "high", high,
                "avgDaysOverdue", Math.round(avgDaysOverdue)
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    /**
     * Compliance Report: Completion rates per category/item over a date range.
     */
    private ReportResultDTO generateComplianceReport(Map<String, String> parameters) {
        LocalDate from = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(6));
        LocalDate to = parseDate(parameters.get("endDate"), LocalDate.now());
        String categoryFilter = parameters.get("categoryId");

        List<DeadlineInstance> instances = instanceRepository.findByStatusInAndDueDateBetween(
                List.of(InstanceStatus.values()), from, to);

        if (categoryFilter != null && !categoryFilter.isEmpty()) {
            UUID catId = UUID.fromString(categoryFilter);
            instances = instances.stream()
                    .filter(i -> i.getDeadlineItem().getCategory() != null &&
                            i.getDeadlineItem().getCategory().getId().equals(catId))
                    .collect(Collectors.toList());
        }

        // Group by deadline item
        Map<String, List<DeadlineInstance>> byItem = instances.stream()
                .collect(Collectors.groupingBy(i -> i.getDeadlineItem().getId().toString()));

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "itemName", "header", "Deadline", "type", "string"),
                Map.of("field", "code", "header", "Code", "type", "string"),
                Map.of("field", "category", "header", "Category", "type", "string"),
                Map.of("field", "priority", "header", "Priority", "type", "status"),
                Map.of("field", "totalInstances", "header", "Total", "type", "number"),
                Map.of("field", "completed", "header", "Completed", "type", "number"),
                Map.of("field", "overdue", "header", "Overdue", "type", "number"),
                Map.of("field", "complianceRate", "header", "Compliance %", "type", "percentage"),
                Map.of("field", "avgCompletionDays", "header", "Avg Days to Complete", "type", "number")
        );

        List<Map<String, Object>> data = byItem.entrySet().stream().map(entry -> {
            List<DeadlineInstance> group = entry.getValue();
            DeadlineItem item = group.get(0).getDeadlineItem();
            long completedCount = group.stream().filter(i -> i.getStatus() == InstanceStatus.COMPLETED).count();
            long overdueCount = group.stream().filter(i -> i.getStatus() == InstanceStatus.OVERDUE).count();
            double avgDays = group.stream()
                    .filter(i -> i.getStatus() == InstanceStatus.COMPLETED && i.getCompletedAt() != null)
                    .mapToLong(i -> ChronoUnit.DAYS.between(i.getCreatedAt().toLocalDate(), i.getCompletedAt().toLocalDate()))
                    .average().orElse(0);

            Map<String, Object> row = new HashMap<>();
            row.put("itemName", item.getName());
            row.put("code", item.getCode());
            row.put("category", item.getCategory() != null ? item.getCategory().getName() : "-");
            row.put("priority", item.getPriority().name());
            row.put("totalInstances", group.size());
            row.put("completed", completedCount);
            row.put("overdue", overdueCount);
            row.put("complianceRate", group.isEmpty() ? 0 : Math.round(completedCount * 100.0 / group.size()));
            row.put("avgCompletionDays", Math.round(avgDays));
            return row;
        }).collect(Collectors.toList());

        long totalAll = instances.size();
        long totalCompleted = instances.stream().filter(i -> i.getStatus() == InstanceStatus.COMPLETED).count();

        Map<String, Object> summary = Map.of(
                "totalRecords", data.size(),
                "totalInstances", totalAll,
                "totalCompleted", totalCompleted,
                "overallCompliance", totalAll == 0 ? "0%" : Math.round(totalCompleted * 100.0 / totalAll) + "%"
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    /**
     * Reminder Report: All reminders sent with success/failure, recipient, deadline info.
     */
    private ReportResultDTO generateReminderReport(Map<String, String> parameters) {
        LocalDate from = parseDate(parameters.get("startDate"), LocalDate.now().minusMonths(1));
        LocalDate to = parseDate(parameters.get("endDate"), LocalDate.now());
        String categoryFilter = parameters.get("categoryId");

        List<DeadlineReminderLog> logs = reminderLogRepository.findAll().stream()
                .filter(l -> {
                    LocalDate sentDate = l.getSentAt().toLocalDate();
                    return !sentDate.isBefore(from) && !sentDate.isAfter(to);
                })
                .collect(Collectors.toList());

        if (categoryFilter != null && !categoryFilter.isEmpty()) {
            UUID catId = UUID.fromString(categoryFilter);
            logs = logs.stream()
                    .filter(l -> l.getDeadlineInstance().getDeadlineItem().getCategory() != null &&
                            l.getDeadlineInstance().getDeadlineItem().getCategory().getId().equals(catId))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> columns = List.of(
                Map.of("field", "itemName", "header", "Deadline", "type", "string"),
                Map.of("field", "dueDate", "header", "Due Date", "type", "date"),
                Map.of("field", "recipientEmail", "header", "Recipient", "type", "string"),
                Map.of("field", "reminderType", "header", "Type", "type", "string"),
                Map.of("field", "sentAt", "header", "Sent At", "type", "datetime"),
                Map.of("field", "success", "header", "Success", "type", "status"),
                Map.of("field", "errorMessage", "header", "Error", "type", "string"),
                Map.of("field", "category", "header", "Category", "type", "string"),
                Map.of("field", "priority", "header", "Priority", "type", "status")
        );

        List<Map<String, Object>> data = logs.stream().map(l -> {
            DeadlineInstance inst = l.getDeadlineInstance();
            DeadlineItem item = inst.getDeadlineItem();
            Map<String, Object> row = new HashMap<>();
            row.put("itemName", item.getName());
            row.put("dueDate", inst.getDueDate().toString());
            row.put("recipientEmail", l.getRecipientEmail());
            row.put("reminderType", l.getReminderType());
            row.put("sentAt", l.getSentAt().toString());
            row.put("success", Boolean.TRUE.equals(l.getSuccess()) ? "SUCCESS" : "FAILED");
            row.put("errorMessage", l.getErrorMessage());
            row.put("category", item.getCategory() != null ? item.getCategory().getName() : "-");
            row.put("priority", item.getPriority().name());
            return row;
        }).collect(Collectors.toList());

        long successful = logs.stream().filter(l -> Boolean.TRUE.equals(l.getSuccess())).count();
        long failed = logs.size() - successful;

        Map<String, Object> summary = Map.of(
                "totalRecords", logs.size(),
                "successful", successful,
                "failed", failed,
                "successRate", logs.isEmpty() ? "0%" : Math.round(successful * 100.0 / logs.size()) + "%"
        );
        return new ReportResultDTO(columns, data, summary, LocalDateTime.now().toString());
    }

    // --- Helpers ---

    private List<DeadlineInstance> applyFilters(List<DeadlineInstance> instances, String categoryFilter,
                                                 String priorityFilter, String statusFilter) {
        if (categoryFilter != null && !categoryFilter.isEmpty()) {
            UUID catId = UUID.fromString(categoryFilter);
            instances = instances.stream()
                    .filter(i -> i.getDeadlineItem().getCategory() != null &&
                            i.getDeadlineItem().getCategory().getId().equals(catId))
                    .collect(Collectors.toList());
        }
        if (priorityFilter != null && !priorityFilter.isEmpty()) {
            DeadlinePriority prio = DeadlinePriority.valueOf(priorityFilter);
            instances = instances.stream()
                    .filter(i -> i.getDeadlineItem().getPriority() == prio)
                    .collect(Collectors.toList());
        }
        if (statusFilter != null && !statusFilter.isEmpty()) {
            InstanceStatus st = InstanceStatus.valueOf(statusFilter);
            instances = instances.stream()
                    .filter(i -> i.getStatus() == st)
                    .collect(Collectors.toList());
        }
        return instances;
    }

    private LocalDate parseDate(String dateStr, LocalDate defaultValue) {
        if (dateStr == null || dateStr.isEmpty()) return defaultValue;
        try { return LocalDate.parse(dateStr); }
        catch (Exception e) { return defaultValue; }
    }
}
