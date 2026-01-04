package com.sonarworks.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonarworks.workflow.dto.AuditLogDTO;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.WorkflowInstance;
import com.sonarworks.workflow.repository.AuditLogRepository;
import com.sonarworks.workflow.security.CustomUserDetails;
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

import java.time.LocalDateTime;
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

    public List<AuditLogDTO> getAuditLogsForEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AuditLogDTO> getAuditLogsForWorkflowInstance(UUID instanceId) {
        return auditLogRepository.findByWorkflowInstanceId(instanceId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<AuditLogDTO> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllOrderByDate(pageable).map(this::toDTO);
    }

    public Page<AuditLogDTO> searchAuditLogs(String search, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(search, pageable).map(this::toDTO);
    }

    public List<AuditLogDTO> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
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
