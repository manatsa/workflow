package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.*;
import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.*;
import com.sonarworks.workflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowInstanceService {

    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowFieldRepository workflowFieldRepository;
    private final WorkflowFieldValueRepository workflowFieldValueRepository;
    private final WorkflowApproverRepository workflowApproverRepository;
    private final ApprovalHistoryRepository approvalHistoryRepository;
    private final UserRepository userRepository;
    private final SBURepository sbuRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SettingService settingService;
    private final AttachmentService attachmentService;

    @Transactional(readOnly = true)
    public Page<WorkflowInstanceDTO> getWorkflowInstances(UUID workflowId, Pageable pageable) {
        return workflowInstanceRepository.findByWorkflowId(workflowId, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowInstanceDTO> getWorkflowInstancesByCode(String workflowCode, Pageable pageable) {
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new BusinessException("Workflow not found: " + workflowCode));
        return workflowInstanceRepository.findByWorkflowId(workflow.getId(), pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowInstanceDTO> getMySubmissions(Pageable pageable) {
        CustomUserDetails userDetails = getCurrentUser();
        return workflowInstanceRepository.findByInitiatorId(userDetails.getId(), pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowInstanceDTO> getPendingApprovals(Pageable pageable) {
        CustomUserDetails userDetails = getCurrentUser();
        return workflowInstanceRepository.findPendingApprovalsByUserId(userDetails.getId(), pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<WorkflowInstanceDTO> searchInstances(String search, Pageable pageable) {
        return workflowInstanceRepository.searchInstances(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public WorkflowInstanceDTO getInstanceById(UUID id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));
        return toFullDTO(instance);
    }

    @Transactional(readOnly = true)
    public WorkflowInstanceDTO getInstanceByReferenceNumber(String referenceNumber) {
        WorkflowInstance instance = workflowInstanceRepository.findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));
        return toFullDTO(instance);
    }

    @Transactional
    public WorkflowInstanceDTO createInstance(UUID workflowId, Map<String, Object> fieldValues, UUID sbuId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        if (!workflow.getIsPublished() || !workflow.getIsActive()) {
            throw new BusinessException("Workflow is not available");
        }

        CustomUserDetails userDetails = getCurrentUser();
        User initiator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BusinessException("User not found"));

        String referenceNumber = generateReferenceNumber(workflow.getCode());

        WorkflowInstance instance = WorkflowInstance.builder()
                .workflow(workflow)
                .referenceNumber(referenceNumber)
                .status(WorkflowInstance.Status.DRAFT)
                .initiator(initiator)
                .currentLevel(0)
                .build();

        if (sbuId != null) {
            SBU sbu = sbuRepository.findById(sbuId)
                    .orElseThrow(() -> new BusinessException("SBU not found"));
            instance.setSbu(sbu);
        }

        WorkflowInstance saved = workflowInstanceRepository.save(instance);

        // Save field values
        if (fieldValues != null) {
            saveFieldValues(saved, fieldValues);
        }

        auditService.logWorkflowAction(AuditLog.AuditAction.CREATE, saved,
                "Workflow instance created: " + referenceNumber, null, fieldValues);

        return toDTO(saved);
    }

    @Transactional
    public WorkflowInstanceDTO updateInstance(UUID id, Map<String, Object> fieldValues) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (instance.getStatus() != WorkflowInstance.Status.DRAFT) {
            throw new BusinessException("Cannot update submitted workflow instance");
        }

        Map<String, Object> oldValues = getFieldValuesMap(instance);

        if (fieldValues != null) {
            saveFieldValues(instance, fieldValues);
        }

        WorkflowInstance saved = workflowInstanceRepository.save(instance);

        auditService.logWorkflowAction(AuditLog.AuditAction.UPDATE, saved,
                "Workflow instance updated: " + saved.getReferenceNumber(), oldValues, fieldValues);

        return toDTO(saved);
    }

    @Transactional
    public WorkflowInstanceDTO submitInstance(UUID id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (instance.getStatus() != WorkflowInstance.Status.DRAFT) {
            throw new BusinessException("Workflow instance already submitted");
        }

        // Validate mandatory fields
        validateMandatoryFields(instance);

        instance.setStatus(WorkflowInstance.Status.PENDING);
        instance.setSubmittedAt(LocalDateTime.now());
        instance.setCurrentLevel(1);

        // Find first level approver
        List<WorkflowApprover> approvers = workflowApproverRepository
                .findByWorkflowIdAndLevel(instance.getWorkflow().getId(), 1);

        if (!approvers.isEmpty()) {
            WorkflowApprover approver = findEligibleApprover(approvers, instance);
            instance.setCurrentApprover(approver);

            // Send notification
            if (approver.getNotifyOnPending()) {
                sendApprovalRequestNotification(instance, approver);
            }
        }

        WorkflowInstance saved = workflowInstanceRepository.save(instance);

        // Create approval history entry
        ApprovalHistory history = ApprovalHistory.builder()
                .workflowInstance(saved)
                .approver(instance.getInitiator())
                .approverName(instance.getInitiator().getFullName())
                .approverEmail(instance.getInitiator().getEmail())
                .level(0)
                .action(ApprovalHistory.Action.SUBMITTED)
                .actionDate(LocalDateTime.now())
                .actionSource(ApprovalHistory.ActionSource.SYSTEM)
                .build();
        approvalHistoryRepository.save(history);

        auditService.logWorkflowAction(AuditLog.AuditAction.SUBMIT, saved,
                "Workflow instance submitted: " + saved.getReferenceNumber(), null, null);

        return toDTO(saved);
    }

    @Transactional
    public WorkflowInstanceDTO createAndSubmitInstance(String workflowCode, Map<String, Object> fieldValues,
                                                        Boolean isDraft, String comments, List<MultipartFile> attachments) {
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new BusinessException("Workflow not found: " + workflowCode));

        if (!workflow.getIsPublished() || !workflow.getIsActive()) {
            throw new BusinessException("Workflow is not available");
        }

        CustomUserDetails userDetails = getCurrentUser();
        User initiator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BusinessException("User not found"));

        String referenceNumber = generateReferenceNumber(workflow.getCode());

        WorkflowInstance instance = WorkflowInstance.builder()
                .workflow(workflow)
                .referenceNumber(referenceNumber)
                .status(WorkflowInstance.Status.DRAFT)
                .initiator(initiator)
                .currentLevel(0)
                .build();

        WorkflowInstance saved = workflowInstanceRepository.save(instance);

        // Save field values
        if (fieldValues != null) {
            saveFieldValues(saved, fieldValues);
        }

        // Handle attachments
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                if (!file.isEmpty()) {
                    attachmentService.uploadAttachment(saved.getId(), file, null);
                }
            }
        }

        auditService.logWorkflowAction(AuditLog.AuditAction.CREATE, saved,
                "Workflow instance created: " + referenceNumber, null, fieldValues);

        // If not a draft, submit the instance
        if (!isDraft) {
            return submitInstance(saved.getId());
        }

        return toDTO(saved);
    }

    @Transactional
    public WorkflowInstanceDTO processApproval(ApprovalRequest request) {
        WorkflowInstance instance = workflowInstanceRepository.findById(request.getWorkflowInstanceId())
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (instance.getStatus() != WorkflowInstance.Status.PENDING &&
            instance.getStatus() != WorkflowInstance.Status.ESCALATED) {
            throw new BusinessException("Workflow instance is not pending approval");
        }

        Workflow workflow = instance.getWorkflow();
        CustomUserDetails userDetails = getCurrentUser();
        User approver = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BusinessException("User not found"));

        // Validate approver
        if (!isValidApprover(instance, approver)) {
            throw new BusinessException("You are not authorized to approve this workflow");
        }

        // Validate comments
        validateComments(workflow, request);

        ApprovalHistory history = ApprovalHistory.builder()
                .workflowInstance(instance)
                .approver(approver)
                .approverName(approver.getFullName())
                .approverEmail(approver.getEmail())
                .level(instance.getCurrentLevel())
                .action(request.getAction())
                .comments(request.getComments())
                .actionDate(LocalDateTime.now())
                .actionSource(request.getActionSource() != null ?
                        ApprovalHistory.ActionSource.valueOf(request.getActionSource()) :
                        ApprovalHistory.ActionSource.SYSTEM)
                .build();
        approvalHistoryRepository.save(history);

        switch (request.getAction()) {
            case APPROVED -> handleApproval(instance, approver);
            case REJECTED -> handleRejection(instance, approver, request.getComments());
            case ESCALATED -> handleEscalation(instance, approver, request.getEscalateToUserId());
            default -> throw new BusinessException("Invalid action");
        }

        WorkflowInstance saved = workflowInstanceRepository.save(instance);

        auditService.logWorkflowAction(
                request.getAction() == ApprovalHistory.Action.APPROVED ? AuditLog.AuditAction.APPROVE :
                request.getAction() == ApprovalHistory.Action.REJECTED ? AuditLog.AuditAction.REJECT :
                AuditLog.AuditAction.ESCALATE,
                saved,
                "Workflow " + request.getAction().name().toLowerCase() + ": " + saved.getReferenceNumber() +
                        (request.getComments() != null ? ". Comments: " + request.getComments() : ""),
                null, null);

        return toDTO(saved);
    }

    private void handleApproval(WorkflowInstance instance, User approver) {
        Integer maxLevel = workflowApproverRepository.findMaxLevelByWorkflowId(instance.getWorkflow().getId());

        if (maxLevel == null || instance.getCurrentLevel() >= maxLevel) {
            // Final approval
            instance.setStatus(WorkflowInstance.Status.APPROVED);
            instance.setCompletedAt(LocalDateTime.now());
            instance.setCurrentApprover(null);

            // Notify initiator
            emailService.sendApprovalNotificationEmail(
                    instance.getInitiator().getEmail(),
                    instance.getInitiator().getFirstName(),
                    instance.getWorkflow().getName(),
                    instance.getReferenceNumber(),
                    "APPROVED",
                    approver.getFullName(),
                    null
            );
        } else {
            // Move to next level
            int nextLevel = instance.getCurrentLevel() + 1;
            instance.setCurrentLevel(nextLevel);

            List<WorkflowApprover> nextApprovers = workflowApproverRepository
                    .findByWorkflowIdAndLevel(instance.getWorkflow().getId(), nextLevel);

            if (!nextApprovers.isEmpty()) {
                WorkflowApprover nextApprover = findEligibleApprover(nextApprovers, instance);
                instance.setCurrentApprover(nextApprover);

                if (nextApprover.getNotifyOnPending()) {
                    sendApprovalRequestNotification(instance, nextApprover);
                }
            }
        }
    }

    private void handleRejection(WorkflowInstance instance, User approver, String comments) {
        instance.setStatus(WorkflowInstance.Status.REJECTED);
        instance.setCompletedAt(LocalDateTime.now());
        instance.setCurrentApprover(null);

        // Notify initiator
        emailService.sendApprovalNotificationEmail(
                instance.getInitiator().getEmail(),
                instance.getInitiator().getFirstName(),
                instance.getWorkflow().getName(),
                instance.getReferenceNumber(),
                "REJECTED",
                approver.getFullName(),
                comments
        );
    }

    private void handleEscalation(WorkflowInstance instance, User approver, UUID escalateToUserId) {
        instance.setStatus(WorkflowInstance.Status.ESCALATED);

        if (escalateToUserId != null) {
            WorkflowApprover escalateTo = workflowApproverRepository
                    .findByUserIdAndWorkflowId(escalateToUserId, instance.getWorkflow().getId())
                    .orElseThrow(() -> new BusinessException("Escalation target not found"));
            instance.setCurrentApprover(escalateTo);

            if (escalateTo.getNotifyOnPending()) {
                sendApprovalRequestNotification(instance, escalateTo);
            }
        } else {
            // Escalate to next level
            int nextLevel = instance.getCurrentLevel() + 1;
            List<WorkflowApprover> nextApprovers = workflowApproverRepository
                    .findByWorkflowIdAndLevel(instance.getWorkflow().getId(), nextLevel);

            if (!nextApprovers.isEmpty()) {
                instance.setCurrentLevel(nextLevel);
                WorkflowApprover nextApprover = findEligibleApprover(nextApprovers, instance);
                instance.setCurrentApprover(nextApprover);

                if (nextApprover.getNotifyOnPending()) {
                    sendApprovalRequestNotification(instance, nextApprover);
                }
            }
        }
    }

    @Transactional
    public void cancelInstance(UUID id, String reason) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (instance.getStatus() == WorkflowInstance.Status.APPROVED ||
            instance.getStatus() == WorkflowInstance.Status.REJECTED) {
            throw new BusinessException("Cannot cancel completed workflow instance");
        }

        instance.setStatus(WorkflowInstance.Status.CANCELLED);
        instance.setCompletedAt(LocalDateTime.now());

        ApprovalHistory history = ApprovalHistory.builder()
                .workflowInstance(instance)
                .action(ApprovalHistory.Action.CANCELLED)
                .comments(reason)
                .actionDate(LocalDateTime.now())
                .build();
        approvalHistoryRepository.save(history);

        workflowInstanceRepository.save(instance);

        auditService.logWorkflowAction(AuditLog.AuditAction.CANCEL, instance,
                "Workflow instance cancelled: " + instance.getReferenceNumber() + ". Reason: " + reason, null, null);
    }

    @Transactional
    public void deleteInstance(UUID id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        // Only allow deletion of draft or cancelled instances, or by admin
        CustomUserDetails currentUser = getCurrentUser();
        if (!currentUser.isSuperUser() &&
            instance.getStatus() != WorkflowInstance.Status.DRAFT &&
            instance.getStatus() != WorkflowInstance.Status.CANCELLED) {
            throw new BusinessException("Only draft or cancelled instances can be deleted");
        }

        // Check ownership
        if (!currentUser.isSuperUser() &&
            !instance.getInitiator().getId().equals(currentUser.getId())) {
            throw new BusinessException("You can only delete your own submissions");
        }

        // Soft delete - set isActive to false
        instance.setIsActive(false);
        workflowInstanceRepository.save(instance);

        auditService.logWorkflowAction(AuditLog.AuditAction.DELETE, instance,
                "Workflow instance deleted: " + instance.getReferenceNumber(), null, null);
    }

    @Transactional
    public WorkflowInstanceDTO cloneInstance(UUID id) {
        WorkflowInstance original = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        CustomUserDetails currentUser = getCurrentUser();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BusinessException("User not found"));

        // Create new instance with same field values
        WorkflowInstance clone = WorkflowInstance.builder()
                .workflow(original.getWorkflow())
                .referenceNumber(generateReferenceNumber(original.getWorkflow().getCode()))
                .title(original.getTitle() != null ? original.getTitle() + " (Copy)" : null)
                .summary(original.getSummary())
                .status(WorkflowInstance.Status.DRAFT)
                .initiator(user)
                .currentLevel(0)
                .sbu(original.getSbu())
                .amount(original.getAmount())
                .build();

        WorkflowInstance savedClone = workflowInstanceRepository.save(clone);

        // Copy field values
        Map<String, Object> fieldValues = getFieldValuesMap(original);
        saveFieldValues(savedClone, fieldValues);

        auditService.logWorkflowAction(AuditLog.AuditAction.CREATE, savedClone,
                "Workflow instance cloned from: " + original.getReferenceNumber(), null, null);

        return toDTO(savedClone);
    }

    @Transactional
    public WorkflowInstanceDTO recallInstance(UUID id, String reason) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        CustomUserDetails currentUser = getCurrentUser();

        // Only the initiator can recall
        if (!currentUser.isSuperUser() &&
            !instance.getInitiator().getId().equals(currentUser.getId())) {
            throw new BusinessException("Only the initiator can recall this submission");
        }

        // Can only recall pending instances
        if (instance.getStatus() != WorkflowInstance.Status.PENDING) {
            throw new BusinessException("Can only recall pending submissions");
        }

        instance.setStatus(WorkflowInstance.Status.DRAFT);
        instance.setCurrentLevel(0);
        instance.setCurrentApprover(null);
        instance.setSubmittedAt(null);

        ApprovalHistory history = ApprovalHistory.builder()
                .workflowInstance(instance)
                .action(ApprovalHistory.Action.RECALLED)
                .comments(reason)
                .actionDate(LocalDateTime.now())
                .approverName(currentUser.getFullName())
                .approverEmail(currentUser.getEmail())
                .build();
        approvalHistoryRepository.save(history);

        workflowInstanceRepository.save(instance);

        auditService.logWorkflowAction(AuditLog.AuditAction.UPDATE, instance,
                "Workflow instance recalled: " + instance.getReferenceNumber() + ". Reason: " + reason, null, null);

        return toDTO(instance);
    }

    @Transactional
    public WorkflowInstanceDTO resubmitInstance(UUID id) {
        WorkflowInstance instance = workflowInstanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        // Can only resubmit rejected or draft instances
        if (instance.getStatus() != WorkflowInstance.Status.REJECTED &&
            instance.getStatus() != WorkflowInstance.Status.DRAFT) {
            throw new BusinessException("Can only resubmit rejected or draft submissions");
        }

        return submitInstance(id);
    }

    private void saveFieldValues(WorkflowInstance instance, Map<String, Object> fieldValues) {
        List<WorkflowField> fields = workflowFieldRepository.findByWorkflowId(instance.getWorkflow().getId());
        Map<String, WorkflowField> fieldMap = fields.stream()
                .collect(Collectors.toMap(WorkflowField::getName, f -> f));

        for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
            WorkflowField field = fieldMap.get(entry.getKey());
            if (field != null) {
                WorkflowFieldValue fieldValue = workflowFieldValueRepository
                        .findByInstanceIdAndFieldId(instance.getId(), field.getId())
                        .orElse(new WorkflowFieldValue());

                fieldValue.setWorkflowInstance(instance);
                fieldValue.setField(field);
                fieldValue.setFieldName(field.getName());
                fieldValue.setFieldLabel(field.getLabel());
                fieldValue.setValue(entry.getValue() != null ? entry.getValue().toString() : null);
                fieldValue.setDisplayValue(entry.getValue() != null ? entry.getValue().toString() : null);

                workflowFieldValueRepository.save(fieldValue);

                // Check for amount field
                if ("amount".equalsIgnoreCase(field.getName()) && entry.getValue() != null) {
                    try {
                        instance.setAmount(new BigDecimal(entry.getValue().toString()));
                    } catch (NumberFormatException e) {
                        log.warn("Could not parse amount value: {}", entry.getValue());
                    }
                }
            }
        }
    }

    private void validateMandatoryFields(WorkflowInstance instance) {
        List<WorkflowField> mandatoryFields = instance.getWorkflow().getForms().stream()
                .flatMap(form -> form.getFields().stream())
                .filter(WorkflowField::getIsMandatory)
                .collect(Collectors.toList());

        Map<String, String> fieldValueMap = instance.getFieldValues().stream()
                .collect(Collectors.toMap(WorkflowFieldValue::getFieldName, v -> v.getValue() != null ? v.getValue() : ""));

        List<String> missingFields = mandatoryFields.stream()
                .filter(f -> !fieldValueMap.containsKey(f.getName()) || fieldValueMap.get(f.getName()).isEmpty())
                .map(WorkflowField::getLabel)
                .collect(Collectors.toList());

        if (!missingFields.isEmpty()) {
            throw new BusinessException("Missing mandatory fields: " + String.join(", ", missingFields));
        }
    }

    private void validateComments(Workflow workflow, ApprovalRequest request) {
        if (workflow.getCommentsMandatory() && (request.getComments() == null || request.getComments().isBlank())) {
            throw new BusinessException("Comments are mandatory");
        }
        if (request.getAction() == ApprovalHistory.Action.REJECTED &&
            workflow.getCommentsMandatoryOnReject() &&
            (request.getComments() == null || request.getComments().isBlank())) {
            throw new BusinessException("Comments are mandatory for rejection");
        }
        if (request.getAction() == ApprovalHistory.Action.ESCALATED &&
            workflow.getCommentsMandatoryOnEscalate() &&
            (request.getComments() == null || request.getComments().isBlank())) {
            throw new BusinessException("Comments are mandatory for escalation");
        }
    }

    private boolean isValidApprover(WorkflowInstance instance, User user) {
        if (user.isSuperUser()) return true;

        WorkflowApprover currentApprover = instance.getCurrentApprover();
        if (currentApprover == null) return false;

        if (currentApprover.getUser() != null) {
            return currentApprover.getUser().getId().equals(user.getId());
        }
        return currentApprover.getApproverEmail().equalsIgnoreCase(user.getEmail());
    }

    private WorkflowApprover findEligibleApprover(List<WorkflowApprover> approvers, WorkflowInstance instance) {
        BigDecimal amount = instance.getAmount();
        if (amount != null) {
            for (WorkflowApprover approver : approvers) {
                if (approver.getIsUnlimited() ||
                    (approver.getApprovalLimit() != null && approver.getApprovalLimit().compareTo(amount) >= 0)) {
                    return approver;
                }
            }
        }
        return approvers.get(0);
    }

    private void sendApprovalRequestNotification(WorkflowInstance instance, WorkflowApprover approver) {
        String baseUrl = settingService.getValue("app.base.url", "http://localhost:4200");
        String approvalLink = baseUrl + "/approvals/" + instance.getId();

        emailService.sendApprovalRequestEmail(
                approver.getApproverEmail(),
                approver.getApproverName(),
                instance.getWorkflow().getName(),
                instance.getReferenceNumber(),
                instance.getInitiator().getFullName(),
                approvalLink
        );
    }

    private String generateReferenceNumber(String workflowCode) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return workflowCode + "-" + timestamp + "-" + random;
    }

    private Map<String, Object> getFieldValuesMap(WorkflowInstance instance) {
        return instance.getFieldValues().stream()
                .collect(Collectors.toMap(
                        WorkflowFieldValue::getFieldName,
                        v -> v.getValue() != null ? v.getValue() : ""
                ));
    }

    private CustomUserDetails getCurrentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private WorkflowInstanceDTO toDTO(WorkflowInstance instance) {
        return WorkflowInstanceDTO.builder()
                .id(instance.getId())
                .workflowId(instance.getWorkflow().getId())
                .workflowName(instance.getWorkflow().getName())
                .workflowCode(instance.getWorkflow().getCode())
                .referenceNumber(instance.getReferenceNumber())
                .title(instance.getTitle())
                .summary(instance.getSummary())
                .status(instance.getStatus())
                .initiatorId(instance.getInitiator().getId())
                .initiatorName(instance.getInitiator().getFullName())
                .initiatorEmail(instance.getInitiator().getEmail())
                .currentLevel(instance.getCurrentLevel())
                .currentApproverName(instance.getCurrentApprover() != null ? instance.getCurrentApprover().getApproverName() : null)
                .currentApproverEmail(instance.getCurrentApprover() != null ? instance.getCurrentApprover().getApproverEmail() : null)
                .submittedAt(instance.getSubmittedAt())
                .completedAt(instance.getCompletedAt())
                .amount(instance.getAmount())
                .sbuId(instance.getSbu() != null ? instance.getSbu().getId() : null)
                .sbuName(instance.getSbu() != null ? instance.getSbu().getName() : null)
                .createdAt(instance.getCreatedAt())
                .createdBy(instance.getCreatedBy())
                .build();
    }

    private WorkflowInstanceDTO toFullDTO(WorkflowInstance instance) {
        WorkflowInstanceDTO dto = toDTO(instance);
        dto.setFieldValues(getFieldValuesMap(instance));
        dto.setApprovalHistory(instance.getApprovalHistory().stream()
                .map(this::toHistoryDTO)
                .collect(Collectors.toList()));
        dto.setAttachments(instance.getAttachments().stream()
                .map(this::toAttachmentDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private ApprovalHistoryDTO toHistoryDTO(ApprovalHistory history) {
        return ApprovalHistoryDTO.builder()
                .id(history.getId())
                .workflowInstanceId(history.getWorkflowInstance().getId())
                .approverId(history.getApprover() != null ? history.getApprover().getId() : null)
                .approverName(history.getApproverName())
                .approverEmail(history.getApproverEmail())
                .level(history.getLevel())
                .action(history.getAction())
                .comments(history.getComments())
                .actionDate(history.getActionDate())
                .actionSource(history.getActionSource())
                .build();
    }

    private AttachmentDTO toAttachmentDTO(Attachment attachment) {
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .workflowInstanceId(attachment.getWorkflowInstance().getId())
                .originalFilename(attachment.getOriginalFilename())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .description(attachment.getDescription())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedAt(attachment.getCreatedAt())
                .build();
    }
}
