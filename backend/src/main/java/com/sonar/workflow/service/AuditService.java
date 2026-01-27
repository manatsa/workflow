package com.sonar.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonar.workflow.dto.AuditLogDTO;
import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.WorkflowInstance;
import com.sonar.workflow.repository.AuditLogRepository;
import com.sonar.workflow.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void log(AuditLog.AuditAction action, String entityType, UUID entityId,
                    String entityName, String summary, Object oldValues, Object newValues) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "system";
            UUID userId = null;
            String fullName = null;

            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                userId = userDetails.getId();
                fullName = userDetails.getFullName();
            }

            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .summary(summary)
                    .username(username)
                    .userId(userId)
                    .userFullName(fullName)
                    .actionDate(LocalDateTime.now())
                    .oldValues(oldValues != null ? objectMapper.writeValueAsString(oldValues) : null)
                    .newValues(newValues != null ? objectMapper.writeValueAsString(newValues) : null)
                    .ipAddress(getClientIpAddress())
                    .userAgent(getUserAgent())
                    .build();

            if (oldValues != null && newValues != null) {
                auditLog.setChanges(computeChanges(oldValues, newValues));
            }

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Error creating audit log", e);
        }
    }

    @Transactional
    public void logWorkflowAction(AuditLog.AuditAction action, WorkflowInstance instance,
                                   String summary, Object oldValues, Object newValues) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "system";
            UUID userId = null;
            String fullName = null;

            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                userId = userDetails.getId();
                fullName = userDetails.getFullName();
            }

            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType("WorkflowInstance")
                    .entityId(instance.getId())
                    .entityName(instance.getReferenceNumber())
                    .summary(summary)
                    .username(username)
                    .userId(userId)
                    .userFullName(fullName)
                    .actionDate(LocalDateTime.now())
                    .oldValues(oldValues != null ? objectMapper.writeValueAsString(oldValues) : null)
                    .newValues(newValues != null ? objectMapper.writeValueAsString(newValues) : null)
                    .ipAddress(getClientIpAddress())
                    .userAgent(getUserAgent())
                    .workflowInstance(instance)
                    .sbu(instance.getSbu())
                    .module("Workflow")
                    .build();

            if (oldValues != null && newValues != null) {
                auditLog.setChanges(computeChanges(oldValues, newValues));
            }

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Error creating workflow audit log", e);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForWorkflowInstance(UUID instanceId) {
        return auditLogRepository.findByWorkflowInstanceId(instanceId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllOrderByDate(pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> searchAuditLogs(String search, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportAuditLogs(String username, String action, String entityType,
                                   LocalDateTime fromDate, LocalDateTime toDate) throws IOException {
        List<AuditLog> logs = auditLogRepository.findAllFiltered(
                username != null && username.isEmpty() ? null : username,
                action != null && action.isEmpty() ? null : action,
                entityType != null && entityType.isEmpty() ? null : entityType,
                fromDate,
                toDate
        );

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Audit Logs");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create header row
            String[] headers = {"Date/Time", "User", "Action", "Entity Type", "Entity Name", "Summary", "IP Address", "Module"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Populate data
            int rowNum = 1;
            for (AuditLog auditLog : logs) {
                Row row = sheet.createRow(rowNum++);

                Cell cell0 = row.createCell(0);
                cell0.setCellValue(auditLog.getActionDate() != null ? auditLog.getActionDate().format(dtf) : "");
                cell0.setCellStyle(dataStyle);

                Cell cell1 = row.createCell(1);
                cell1.setCellValue(auditLog.getUserFullName() != null ? auditLog.getUserFullName() : auditLog.getUsername());
                cell1.setCellStyle(dataStyle);

                Cell cell2 = row.createCell(2);
                cell2.setCellValue(auditLog.getAction() != null ? auditLog.getAction().name() : "");
                cell2.setCellStyle(dataStyle);

                Cell cell3 = row.createCell(3);
                cell3.setCellValue(auditLog.getEntityType() != null ? auditLog.getEntityType() : "");
                cell3.setCellStyle(dataStyle);

                Cell cell4 = row.createCell(4);
                cell4.setCellValue(auditLog.getEntityName() != null ? auditLog.getEntityName() : "");
                cell4.setCellStyle(dataStyle);

                Cell cell5 = row.createCell(5);
                cell5.setCellValue(auditLog.getSummary() != null ? auditLog.getSummary() : "");
                cell5.setCellStyle(dataStyle);

                Cell cell6 = row.createCell(6);
                cell6.setCellValue(auditLog.getIpAddress() != null ? auditLog.getIpAddress() : "");
                cell6.setCellStyle(dataStyle);

                Cell cell7 = row.createCell(7);
                cell7.setCellValue(auditLog.getModule() != null ? auditLog.getModule() : "");
                cell7.setCellStyle(dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not get client IP address", e);
        }
        return null;
    }

    private String getUserAgent() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                return attrs.getRequest().getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.debug("Could not get user agent", e);
        }
        return null;
    }

    private String computeChanges(Object oldValues, Object newValues) {
        try {
            Map<String, Object> oldMap = objectMapper.convertValue(oldValues, Map.class);
            Map<String, Object> newMap = objectMapper.convertValue(newValues, Map.class);

            StringBuilder changes = new StringBuilder();
            for (String key : newMap.keySet()) {
                Object oldVal = oldMap.get(key);
                Object newVal = newMap.get(key);
                if (oldVal == null && newVal != null) {
                    changes.append(key).append(": added '").append(newVal).append("'\n");
                } else if (oldVal != null && newVal == null) {
                    changes.append(key).append(": removed '").append(oldVal).append("'\n");
                } else if (oldVal != null && !oldVal.equals(newVal)) {
                    changes.append(key).append(": changed from '").append(oldVal)
                           .append("' to '").append(newVal).append("'\n");
                }
            }
            return changes.toString();
        } catch (Exception e) {
            log.debug("Could not compute changes", e);
            return null;
        }
    }

    private AuditLogDTO toDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .entityName(log.getEntityName())
                .action(log.getAction())
                .username(log.getUsername())
                .userId(log.getUserId())
                .userFullName(log.getUserFullName())
                .actionDate(log.getActionDate())
                .summary(log.getSummary())
                .oldValues(log.getOldValues())
                .newValues(log.getNewValues())
                .changes(log.getChanges())
                .ipAddress(log.getIpAddress())
                .module(log.getModule())
                .workflowInstanceId(log.getWorkflowInstance() != null ? log.getWorkflowInstance().getId() : null)
                .workflowInstanceRef(log.getWorkflowInstance() != null ? log.getWorkflowInstance().getReferenceNumber() : null)
                .sbuId(log.getSbu() != null ? log.getSbu().getId() : null)
                .sbuName(log.getSbu() != null ? log.getSbu().getName() : null)
                .build();
    }
}
