package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.dto.*;
import com.sonar.workflow.deadlines.entity.*;
import com.sonar.workflow.deadlines.repository.*;
import com.sonar.workflow.entity.SBU;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.SBURepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class DeadlineItemService {

    private final DeadlineItemRepository deadlineItemRepository;
    private final DeadlineActionRepository deadlineActionRepository;
    private final DeadlineRecipientRepository deadlineRecipientRepository;
    private final DeadlineInstanceRepository deadlineInstanceRepository;
    private final DeadlineReminderLogRepository reminderLogRepository;
    private final DeadlineCategoryRepository deadlineCategoryRepository;
    private final UserRepository userRepository;
    private final SBURepository sbuRepository;

    // ==================== CRUD ====================

    @Transactional(readOnly = true)
    public List<DeadlineItemDTO> getAllItems() {
        return deadlineItemRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<DeadlineItemDTO> searchItems(String search, Pageable pageable) {
        return deadlineItemRepository.searchDeadlines(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public DeadlineItemDTO getById(UUID id) {
        DeadlineItem item = deadlineItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline item not found"));
        return toDetailDTO(item);
    }

    @Transactional
    public DeadlineItemDTO create(DeadlineItemDTO dto) {
        DeadlineItem item = new DeadlineItem();
        mapDtoToEntity(dto, item);

        // Generate code if not provided
        if (item.getCode() == null || item.getCode().isBlank()) {
            item.setCode(generateCode(item.getName()));
        }

        if (deadlineItemRepository.existsByCode(item.getCode())) {
            throw new BusinessException("A deadline item with code '" + item.getCode() + "' already exists");
        }

        item = deadlineItemRepository.save(item);

        // Process nested entities
        processActions(item, dto.getActions());
        processRecipients(item, dto.getRecipients());

        // Create the first instance based on the due date
        if (dto.getNextDueDate() != null) {
            createInstance(item, dto.getNextDueDate());
        }

        log.info("Created deadline item: {} ({})", item.getName(), item.getCode());
        return toDetailDTO(deadlineItemRepository.findById(item.getId()).orElse(item));
    }

    @Transactional
    public DeadlineItemDTO update(UUID id, DeadlineItemDTO dto) {
        DeadlineItem item = deadlineItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline item not found"));

        mapDtoToEntity(dto, item);
        item = deadlineItemRepository.save(item);

        // Process nested entities
        processActions(item, dto.getActions());
        processRecipients(item, dto.getRecipients());

        // Update/create instance if due date changed
        if (dto.getNextDueDate() != null) {
            List<DeadlineInstance> activeInstances = deadlineInstanceRepository.findActiveByDeadlineItemId(id);
            if (activeInstances.isEmpty()) {
                createInstance(item, dto.getNextDueDate());
            } else {
                DeadlineInstance nextInstance = activeInstances.get(0);
                nextInstance.setDueDate(dto.getNextDueDate());
                deadlineInstanceRepository.save(nextInstance);
            }
        }

        log.info("Updated deadline item: {} ({})", item.getName(), item.getCode());
        return toDetailDTO(deadlineItemRepository.findById(item.getId()).orElse(item));
    }

    @Transactional
    public void delete(UUID id) {
        DeadlineItem item = deadlineItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline item not found"));
        item.setIsActive(false);
        deadlineItemRepository.save(item);
        log.info("Soft-deleted deadline item: {} ({})", item.getName(), item.getCode());
    }

    // ==================== INSTANCES ====================

    @Transactional
    public DeadlineInstanceDTO completeInstance(UUID instanceId, String notes) {
        DeadlineInstance instance = deadlineInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BusinessException("Deadline instance not found"));

        instance.setStatus(DeadlineInstance.InstanceStatus.COMPLETED);
        instance.setCompletedAt(LocalDateTime.now());
        instance.setCompletedBy(getCurrentUser());
        if (notes != null) {
            instance.setNotes(notes);
        }
        deadlineInstanceRepository.save(instance);

        // Auto-advance: create next instance for recurring deadlines
        DeadlineItem item = instance.getDeadlineItem();
        if (item.getRecurrenceType() != DeadlineItem.RecurrenceType.ONE_TIME) {
            LocalDate nextDueDate = calculateNextDueDate(instance.getDueDate(), item.getRecurrenceType());
            // Only create if no active instance exists for that date
            if (deadlineInstanceRepository.findByDeadlineItemIdAndDueDate(item.getId(), nextDueDate).isEmpty()) {
                createInstance(item, nextDueDate);
                log.info("Auto-created next instance for {} due {}", item.getName(), nextDueDate);
            }
        }

        return toInstanceDTO(instance);
    }

    @Transactional
    public DeadlineInstanceDTO skipInstance(UUID instanceId, String notes) {
        DeadlineInstance instance = deadlineInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BusinessException("Deadline instance not found"));

        instance.setStatus(DeadlineInstance.InstanceStatus.SKIPPED);
        instance.setCompletedAt(LocalDateTime.now());
        instance.setCompletedBy(getCurrentUser());
        if (notes != null) {
            instance.setNotes(notes);
        }
        deadlineInstanceRepository.save(instance);

        return toInstanceDTO(instance);
    }

    @Transactional(readOnly = true)
    public List<DeadlineInstanceDTO> getInstancesByItem(UUID deadlineItemId) {
        return deadlineInstanceRepository.findByDeadlineItemIdOrderByDueDateAsc(deadlineItemId).stream()
                .map(this::toInstanceDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeadlineInstanceDTO> getUpcomingInstances(int days) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return deadlineInstanceRepository.findUpcomingWithItem(from, to).stream()
                .map(this::toInstanceDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeadlineInstanceDTO> getOverdueInstances() {
        return deadlineInstanceRepository.findOverdueWithItem().stream()
                .map(this::toInstanceDTO)
                .collect(Collectors.toList());
    }


    // ==================== HELPERS ====================

    private DeadlineInstance createInstance(DeadlineItem item, LocalDate dueDate) {
        DeadlineInstance instance = DeadlineInstance.builder()
                .deadlineItem(item)
                .dueDate(dueDate)
                .status(DeadlineInstance.InstanceStatus.UPCOMING)
                .build();
        return deadlineInstanceRepository.save(instance);
    }

    private LocalDate calculateNextDueDate(LocalDate currentDueDate, DeadlineItem.RecurrenceType type) {
        return switch (type) {
            case MONTHLY -> currentDueDate.plusMonths(1);
            case QUARTERLY -> currentDueDate.plusMonths(3);
            case SEMI_ANNUAL -> currentDueDate.plusMonths(6);
            case ANNUAL -> currentDueDate.plusYears(1);
            default -> currentDueDate;
        };
    }

    private void processActions(DeadlineItem item, List<DeadlineActionDTO> actionDtos) {
        if (actionDtos == null) return;

        // Get existing actions
        List<DeadlineAction> existingActions = deadlineActionRepository.findByDeadlineItemId(item.getId());
        Set<UUID> incomingIds = actionDtos.stream()
                .map(DeadlineActionDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Delete removed actions
        existingActions.stream()
                .filter(a -> !incomingIds.contains(a.getId()))
                .forEach(deadlineActionRepository::delete);

        // Create/update actions
        for (int i = 0; i < actionDtos.size(); i++) {
            DeadlineActionDTO dto = actionDtos.get(i);
            DeadlineAction action;
            if (dto.getId() != null) {
                action = deadlineActionRepository.findById(dto.getId()).orElse(new DeadlineAction());
            } else {
                action = new DeadlineAction();
            }
            action.setDeadlineItem(item);
            action.setTitle(dto.getTitle());
            action.setDescription(dto.getDescription());
            action.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : i);
            action.setDueOffsetDays(dto.getDueOffsetDays());

            if (dto.getAssigneeId() != null) {
                User assignee = userRepository.findById(dto.getAssigneeId()).orElse(null);
                if (assignee != null) {
                    action.setAssignee(assignee);
                    action.setAssigneeName(assignee.getFullName());
                    action.setAssigneeEmail(assignee.getEmail());
                }
            } else {
                action.setAssigneeName(dto.getAssigneeName());
                action.setAssigneeEmail(dto.getAssigneeEmail());
            }

            if (dto.getStatus() != null) {
                action.setStatus(DeadlineAction.ActionStatus.valueOf(dto.getStatus()));
            }
            deadlineActionRepository.save(action);
        }
    }

    private void processRecipients(DeadlineItem item, List<DeadlineRecipientDTO> recipientDtos) {
        if (recipientDtos == null) return;

        // Get existing recipients
        List<DeadlineRecipient> existing = deadlineRecipientRepository.findByDeadlineItemId(item.getId());
        Set<UUID> incomingIds = recipientDtos.stream()
                .map(DeadlineRecipientDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Delete removed recipients
        existing.stream()
                .filter(r -> !incomingIds.contains(r.getId()))
                .forEach(deadlineRecipientRepository::delete);

        // Create/update recipients
        for (DeadlineRecipientDTO dto : recipientDtos) {
            DeadlineRecipient recipient;
            if (dto.getId() != null) {
                recipient = deadlineRecipientRepository.findById(dto.getId()).orElse(new DeadlineRecipient());
            } else {
                recipient = new DeadlineRecipient();
            }
            recipient.setDeadlineItem(item);
            recipient.setRecipientEmail(dto.getRecipientEmail());
            recipient.setRecipientName(dto.getRecipientName());
            recipient.setNotifyOnReminder(dto.getNotifyOnReminder() != null ? dto.getNotifyOnReminder() : true);
            recipient.setNotifyOnOverdue(dto.getNotifyOnOverdue() != null ? dto.getNotifyOnOverdue() : true);
            recipient.setNotifyOnCompletion(dto.getNotifyOnCompletion() != null ? dto.getNotifyOnCompletion() : true);

            if (dto.getUserId() != null) {
                User user = userRepository.findById(dto.getUserId()).orElse(null);
                if (user != null) {
                    recipient.setUser(user);
                    if (recipient.getRecipientName() == null || recipient.getRecipientName().isBlank()) {
                        recipient.setRecipientName(user.getFullName());
                    }
                    if (recipient.getRecipientEmail() == null || recipient.getRecipientEmail().isBlank()) {
                        recipient.setRecipientEmail(user.getEmail());
                    }
                }
            }
            deadlineRecipientRepository.save(recipient);
        }
    }

    private void mapDtoToEntity(DeadlineItemDTO dto, DeadlineItem item) {
        item.setName(dto.getName());
        if (dto.getCode() != null) item.setCode(dto.getCode());
        item.setDescription(dto.getDescription());
        if (dto.getCategoryId() != null) {
            DeadlineCategory category = deadlineCategoryRepository.findById(dto.getCategoryId()).orElse(null);
            item.setCategory(category);
        } else {
            item.setCategory(null);
        }
        if (dto.getReminderDaysBefore() != null) item.setReminderDaysBefore(dto.getReminderDaysBefore());

        if (dto.getPriority() != null) {
            item.setPriority(DeadlineItem.DeadlinePriority.valueOf(dto.getPriority()));
        }
        if (dto.getStatus() != null) {
            item.setStatus(DeadlineItem.DeadlineItemStatus.valueOf(dto.getStatus()));
        }
        if (dto.getRecurrenceType() != null) {
            item.setRecurrenceType(DeadlineItem.RecurrenceType.valueOf(dto.getRecurrenceType()));
        }

        if (dto.getOwnerId() != null) {
            User owner = userRepository.findById(dto.getOwnerId()).orElse(null);
            item.setOwner(owner);
        }
        if (dto.getSbuId() != null) {
            SBU sbu = sbuRepository.findById(dto.getSbuId()).orElse(null);
            item.setSbu(sbu);
        }
    }

    private String generateCode(String name) {
        String base = name.toUpperCase().replaceAll("[^A-Z0-9]", "_").replaceAll("_+", "_");
        if (base.length() > 20) base = base.substring(0, 20);
        String code = "DL_" + base;
        int counter = 1;
        while (deadlineItemRepository.existsByCode(code)) {
            code = "DL_" + base + "_" + counter++;
        }
        return code;
    }

    private String getCurrentUser() {
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : "system";
        } catch (Exception e) {
            return "system";
        }
    }

    // ==================== DTO MAPPING ====================

    private DeadlineItemDTO toDTO(DeadlineItem item) {
        // Find next active instance
        List<DeadlineInstance> activeInstances = deadlineInstanceRepository.findActiveByDeadlineItemId(item.getId());
        DeadlineInstance nextInstance = activeInstances.isEmpty() ? null : activeInstances.get(0);

        UUID ownerId = null;
        String ownerName = null;
        try {
            if (item.getOwner() != null) {
                ownerId = item.getOwner().getId();
                ownerName = item.getOwner().getFullName();
            }
        } catch (Exception e) { /* lazy load issue */ }

        UUID sbuId = null;
        String sbuName = null;
        try {
            if (item.getSbu() != null) {
                sbuId = item.getSbu().getId();
                sbuName = item.getSbu().getName();
            }
        } catch (Exception e) { /* lazy load issue */ }

        UUID categoryId = null;
        String categoryName = null;
        try {
            if (item.getCategory() != null) {
                categoryId = item.getCategory().getId();
                categoryName = item.getCategory().getName();
            }
        } catch (Exception e) { /* lazy load issue */ }

        return DeadlineItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .code(item.getCode())
                .description(item.getDescription())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .priority(item.getPriority().name())
                .status(item.getStatus().name())
                .recurrenceType(item.getRecurrenceType().name())
                .reminderDaysBefore(item.getReminderDaysBefore())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .sbuId(sbuId)
                .sbuName(sbuName)
                .nextDueDate(nextInstance != null ? nextInstance.getDueDate() : null)
                .nextInstanceStatus(nextInstance != null ? nextInstance.getStatus().name() : null)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .createdBy(item.getCreatedBy())
                .isActive(item.getIsActive())
                .build();
    }

    private DeadlineItemDTO toDetailDTO(DeadlineItem item) {
        DeadlineItemDTO dto = toDTO(item);

        // Add nested collections
        dto.setActions(deadlineActionRepository.findByDeadlineItemIdOrderByDisplayOrderAsc(item.getId()).stream()
                .map(this::toActionDTO)
                .collect(Collectors.toList()));

        dto.setRecipients(deadlineRecipientRepository.findByDeadlineItemId(item.getId()).stream()
                .map(this::toRecipientDTO)
                .collect(Collectors.toList()));

        dto.setInstances(deadlineInstanceRepository.findByDeadlineItemIdOrderByDueDateAsc(item.getId()).stream()
                .map(this::toInstanceDTO)
                .collect(Collectors.toList()));

        return dto;
    }

    private DeadlineActionDTO toActionDTO(DeadlineAction action) {
        UUID assigneeId = null;
        try {
            if (action.getAssignee() != null) assigneeId = action.getAssignee().getId();
        } catch (Exception e) { /* lazy load */ }

        return DeadlineActionDTO.builder()
                .id(action.getId())
                .deadlineItemId(action.getDeadlineItem().getId())
                .title(action.getTitle())
                .description(action.getDescription())
                .assigneeId(assigneeId)
                .assigneeName(action.getAssigneeName())
                .assigneeEmail(action.getAssigneeEmail())
                .status(action.getStatus().name())
                .completedAt(action.getCompletedAt())
                .completedBy(action.getCompletedBy())
                .displayOrder(action.getDisplayOrder())
                .dueOffsetDays(action.getDueOffsetDays())
                .build();
    }

    DeadlineRecipientDTO toRecipientDTO(DeadlineRecipient recipient) {
        UUID userId = null;
        try {
            if (recipient.getUser() != null) userId = recipient.getUser().getId();
        } catch (Exception e) { /* lazy load */ }

        return DeadlineRecipientDTO.builder()
                .id(recipient.getId())
                .deadlineItemId(recipient.getDeadlineItem().getId())
                .userId(userId)
                .recipientName(recipient.getRecipientName())
                .recipientEmail(recipient.getRecipientEmail())
                .notifyOnReminder(recipient.getNotifyOnReminder())
                .notifyOnOverdue(recipient.getNotifyOnOverdue())
                .notifyOnCompletion(recipient.getNotifyOnCompletion())
                .build();
    }

    DeadlineInstanceDTO toInstanceDTO(DeadlineInstance instance) {
        DeadlineItem item = instance.getDeadlineItem();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), instance.getDueDate());

        String catName = null;
        try {
            if (item.getCategory() != null) catName = item.getCategory().getName();
        } catch (Exception e) { /* lazy load */ }

        return DeadlineInstanceDTO.builder()
                .id(instance.getId())
                .deadlineItemId(item.getId())
                .deadlineItemName(item.getName())
                .deadlineItemCode(item.getCode())
                .categoryName(catName)
                .priority(item.getPriority().name())
                .dueDate(instance.getDueDate())
                .status(instance.getStatus().name())
                .completedAt(instance.getCompletedAt())
                .completedBy(instance.getCompletedBy())
                .notes(instance.getNotes())
                .daysRemaining(daysRemaining)
                .build();
    }
}
