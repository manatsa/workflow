package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.*;
import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.entity.EmailApprovalToken;
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
    private final EmailApprovalService emailApprovalService;

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
        String email = userDetails.getEmail() != null ? userDetails.getEmail() : "";
        return workflowInstanceRepository.findPendingApprovalsByUserIdOrEmail(
                userDetails.getId(), email, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public long getPendingApprovalsCount() {
        CustomUserDetails userDetails = getCurrentUser();
        String email = userDetails.getEmail() != null ? userDetails.getEmail() : "";
        return workflowInstanceRepository.countPendingApprovalsByUserIdOrEmail(userDetails.getId(), email);
    }

    @Transactional(readOnly = true)
    public long getMySubmissionsCount() {
        CustomUserDetails userDetails = getCurrentUser();
        return workflowInstanceRepository.countByInitiatorId(userDetails.getId());
    }

    @Transactional(readOnly = true)
    public long getMyPendingSubmissionsCount() {
        CustomUserDetails userDetails = getCurrentUser();
        return workflowInstanceRepository.countPendingByInitiatorId(userDetails.getId());
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
        instance.setCurrentApproverOrder(0);

        Workflow workflow = instance.getWorkflow();
        int startingLevel = 1;

        // Check if this is a financial workflow and determine starting approval level based on amount
        if (workflow.getWorkflowCategory() == Workflow.WorkflowCategory.FINANCIAL) {
            BigDecimal limitedAmount = getLimitedFieldAmount(instance);
            if (limitedAmount != null) {
                // Store the amount on the instance for reference
                instance.setAmount(limitedAmount);

                // Check if skip unauthorized approvers setting is enabled
                boolean skipUnauthorized = settingService.getBooleanValue("workflow.skip.unauthorized.approvers", true);

                if (skipUnauthorized) {
                    // Find the minimum level that can approve this amount
                    Integer minLevel = workflowApproverRepository.findMinLevelForAmount(
                            workflow.getId(), limitedAmount);

                    if (minLevel != null) {
                        startingLevel = minLevel;
                        log.info("Financial workflow auto-escalation: Amount {} requires minimum level {}",
                                limitedAmount, startingLevel);
                    } else {
                        // No approver can approve this amount - escalate to max level
                        Integer maxLevel = workflowApproverRepository.findMaxLevelByWorkflowId(workflow.getId());
                        if (maxLevel != null) {
                            startingLevel = maxLevel;
                            log.warn("No approver with sufficient limit for amount {}. Escalating to max level {}",
                                    limitedAmount, startingLevel);
                        }
                    }
                } else {
                    log.info("Skip unauthorized approvers is disabled. Starting at level 1 for amount {}", limitedAmount);
                }
            }
        }

        instance.setCurrentLevel(startingLevel);

        // Find approvers at the determined level (sorted by displayOrder)
        List<WorkflowApprover> approvers = workflowApproverRepository
                .findByWorkflowIdAndLevel(workflow.getId(), startingLevel);

        if (!approvers.isEmpty()) {
            // Get the first approver at this level (lowest displayOrder)
            WorkflowApprover approver = approvers.get(0);
            instance.setCurrentApprover(approver);
            instance.setCurrentApproverOrder(0);

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
    public WorkflowInstanceDTO updateAndSubmitInstance(UUID instanceId, Map<String, Object> fieldValues,
                                                        Boolean isDraft, String comments, List<MultipartFile> attachments) {
        WorkflowInstance instance = workflowInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (instance.getStatus() != WorkflowInstance.Status.DRAFT) {
            throw new BusinessException("Only draft instances can be edited");
        }

        // Update field values
        if (fieldValues != null) {
            saveFieldValues(instance, fieldValues);
        }

        // Handle attachments
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                if (!file.isEmpty()) {
                    attachmentService.uploadAttachment(instance.getId(), file, null);
                }
            }
        }

        auditService.logWorkflowAction(AuditLog.AuditAction.UPDATE, instance,
                "Workflow instance updated: " + instance.getReferenceNumber(), null, fieldValues);

        // If not a draft, submit the instance
        if (!isDraft) {
            return submitInstance(instance.getId());
        }

        return toDTO(instance);
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
        Workflow workflow = instance.getWorkflow();
        Integer maxLevel = workflowApproverRepository.findMaxLevelByWorkflowId(workflow.getId());
        int currentLevel = instance.getCurrentLevel();
        int currentOrder = instance.getCurrentApproverOrder() != null ? instance.getCurrentApproverOrder() : 0;

        // For financial workflows, check if current approver has sufficient limit
        if (workflow.getWorkflowCategory() == Workflow.WorkflowCategory.FINANCIAL &&
                instance.getAmount() != null) {
            // Check if skip unauthorized approvers setting is enabled
            boolean skipUnauthorized = settingService.getBooleanValue("workflow.skip.unauthorized.approvers", true);

            if (skipUnauthorized) {
                WorkflowApprover currentApprover = instance.getCurrentApprover();
                if (currentApprover != null && !Boolean.TRUE.equals(currentApprover.getIsUnlimited())) {
                    BigDecimal approverLimit = currentApprover.getApprovalLimit();
                    if (approverLimit != null && instance.getAmount().compareTo(approverLimit) > 0) {
                        // Amount exceeds approver's limit - auto-escalate
                        log.info("Amount {} exceeds approver limit {}. Auto-escalating.",
                                instance.getAmount(), approverLimit);
                        autoEscalateForAmount(instance, approver);
                        return;
                    }
                }
            }
        }

        // Get all approvers at current level (sorted by displayOrder)
        List<WorkflowApprover> currentLevelApprovers = workflowApproverRepository
                .findByWorkflowIdAndLevel(workflow.getId(), currentLevel);

        // Check if there are more approvers at the same level
        int nextOrderIndex = currentOrder + 1;
        if (nextOrderIndex < currentLevelApprovers.size()) {
            // Move to next approver at the same level
            WorkflowApprover nextApprover = currentLevelApprovers.get(nextOrderIndex);
            instance.setCurrentApprover(nextApprover);
            instance.setCurrentApproverOrder(nextOrderIndex);

            if (nextApprover.getNotifyOnPending()) {
                sendApprovalRequestNotification(instance, nextApprover);
            }
        } else if (maxLevel == null || currentLevel >= maxLevel) {
            // No more approvers at this level and this is the final level
            instance.setStatus(WorkflowInstance.Status.APPROVED);
            instance.setCompletedAt(LocalDateTime.now());
            instance.setCurrentApprover(null);
            instance.setCurrentApproverOrder(null);

            // Notify initiator
            emailService.sendApprovalNotificationEmail(
                    instance.getInitiator().getEmail(),
                    instance.getInitiator().getFirstName(),
                    workflow.getName(),
                    instance.getReferenceNumber(),
                    "APPROVED",
                    approver.getFullName(),
                    null
            );
        } else {
            // Move to next level
            int nextLevel = currentLevel + 1;
            instance.setCurrentLevel(nextLevel);
            instance.setCurrentApproverOrder(0);

            List<WorkflowApprover> nextApprovers = workflowApproverRepository
                    .findByWorkflowIdAndLevel(workflow.getId(), nextLevel);

            if (!nextApprovers.isEmpty()) {
                // Get the first approver at the next level
                WorkflowApprover nextApprover = nextApprovers.get(0);
                instance.setCurrentApprover(nextApprover);

                if (nextApprover.getNotifyOnPending()) {
                    sendApprovalRequestNotification(instance, nextApprover);
                }
            }
        }
    }

    /**
     * Auto-escalates a financial workflow to an approver with sufficient limit for the amount.
     */
    private void autoEscalateForAmount(WorkflowInstance instance, User currentApprover) {
        Workflow workflow = instance.getWorkflow();
        BigDecimal amount = instance.getAmount();

        // Find the minimum level with an approver who can approve this amount
        Integer targetLevel = workflowApproverRepository.findMinLevelForAmount(workflow.getId(), amount);

        if (targetLevel == null) {
            // No approver can approve this amount - escalate to max level
            targetLevel = workflowApproverRepository.findMaxLevelByWorkflowId(workflow.getId());
            log.warn("No approver with sufficient limit for amount {}. Escalating to max level {}",
                    amount, targetLevel);
        }

        if (targetLevel != null && targetLevel > instance.getCurrentLevel()) {
            instance.setCurrentLevel(targetLevel);
            instance.setCurrentApproverOrder(0);
            instance.setStatus(WorkflowInstance.Status.ESCALATED);

            List<WorkflowApprover> targetApprovers = workflowApproverRepository
                    .findByWorkflowIdAndLevel(workflow.getId(), targetLevel);

            if (!targetApprovers.isEmpty()) {
                WorkflowApprover nextApprover = targetApprovers.get(0);
                instance.setCurrentApprover(nextApprover);

                // Create escalation history
                ApprovalHistory escalationHistory = ApprovalHistory.builder()
                        .workflowInstance(instance)
                        .approver(userRepository.findById(getCurrentUser().getId()).orElse(null))
                        .approverName(currentApprover.getFullName())
                        .approverEmail(currentApprover.getEmail())
                        .level(instance.getCurrentLevel())
                        .action(ApprovalHistory.Action.ESCALATED)
                        .comments("Auto-escalated: Amount " + amount + " exceeds approval limit")
                        .actionDate(LocalDateTime.now())
                        .actionSource(ApprovalHistory.ActionSource.SYSTEM)
                        .build();
                approvalHistoryRepository.save(escalationHistory);

                if (nextApprover.getNotifyOnPending()) {
                    sendApprovalRequestNotification(instance, nextApprover);
                }

                log.info("Auto-escalated workflow {} from level {} to level {} for amount {}",
                        instance.getReferenceNumber(), instance.getCurrentLevel() - 1, targetLevel, amount);
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
        instance.setCurrentApproverOrder(null);
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
                .collect(Collectors.toMap(WorkflowField::getName, f -> f, (existing, replacement) -> replacement));

        // First, validate unique constraints before saving any values
        validateUniqueFields(instance, fieldValues, fieldMap);

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

        // Generate title from fields marked as isTitle
        generateTitleFromFields(instance, fieldValues, fields);
    }

    private void generateTitleFromFields(WorkflowInstance instance, Map<String, Object> fieldValues, List<WorkflowField> fields) {
        // Get all fields marked as isTitle, sorted by displayOrder
        List<WorkflowField> titleFields = fields.stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsTitle()))
                .sorted(Comparator.comparingInt(WorkflowField::getDisplayOrder))
                .collect(Collectors.toList());

        if (titleFields.isEmpty()) {
            return;
        }

        // Build title by concatenating values with "_"
        List<String> titleParts = new ArrayList<>();
        for (WorkflowField field : titleFields) {
            Object value = fieldValues.get(field.getName());
            if (value != null && !value.toString().isEmpty()) {
                titleParts.add(value.toString());
            }
        }

        if (!titleParts.isEmpty()) {
            String title = String.join("_", titleParts);
            instance.setTitle(title);
        }
    }

    private void validateUniqueFields(WorkflowInstance instance, Map<String, Object> fieldValues, Map<String, WorkflowField> fieldMap) {
        List<String> duplicateFields = new ArrayList<>();

        for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
            WorkflowField field = fieldMap.get(entry.getKey());
            if (field != null && Boolean.TRUE.equals(field.getIsUnique()) && entry.getValue() != null) {
                String value = entry.getValue().toString();
                if (!value.isEmpty()) {
                    // Check if this value already exists for this field in another instance
                    List<WorkflowFieldValue> existingValues = workflowFieldValueRepository
                            .findByFieldIdAndValueExcludingInstance(field.getId(), value, instance.getId());

                    if (!existingValues.isEmpty()) {
                        duplicateFields.add(field.getLabel() + " (\"" + value + "\")");
                    }
                }
            }
        }

        if (!duplicateFields.isEmpty()) {
            throw new BusinessException("Duplicate values not allowed for unique fields: " + String.join(", ", duplicateFields));
        }
    }

    private void validateMandatoryFields(WorkflowInstance instance) {
        // Get mandatory fields for the workflow
        List<WorkflowField> mandatoryFields = workflowFieldRepository.findByWorkflowId(instance.getWorkflow().getId())
                .stream()
                .filter(WorkflowField::getIsMandatory)
                .collect(Collectors.toList());

        // Fetch field values directly from repository to avoid lazy loading issues
        List<WorkflowFieldValue> fieldValues = workflowFieldValueRepository.findByWorkflowInstanceId(instance.getId());
        Map<String, String> fieldValueMap = fieldValues.stream()
                .collect(Collectors.toMap(WorkflowFieldValue::getFieldName, v -> v.getValue() != null ? v.getValue() : "", (existing, replacement) -> replacement));

        List<String> missingFields = mandatoryFields.stream()
                .filter(f -> !fieldValueMap.containsKey(f.getName()) || fieldValueMap.get(f.getName()).isEmpty())
                .map(WorkflowField::getLabel)
                .collect(Collectors.toList());

        if (!missingFields.isEmpty()) {
            throw new BusinessException("Missing mandatory fields: " + String.join(", ", missingFields));
        }
    }

    /**
     * Gets the amount from the field marked as isLimited in a financial workflow.
     * This amount is used to determine the starting approval level based on approver limits.
     */
    private BigDecimal getLimitedFieldAmount(WorkflowInstance instance) {
        // Find the field marked as limited (the amount field for limit checks)
        Optional<WorkflowField> limitedField = workflowFieldRepository
                .findByWorkflowId(instance.getWorkflow().getId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsLimited()))
                .findFirst();

        if (limitedField.isEmpty()) {
            log.debug("No limited field found for financial workflow: {}", instance.getWorkflow().getCode());
            return null;
        }

        // Get the value of the limited field from the instance
        String fieldName = limitedField.get().getName();
        List<WorkflowFieldValue> fieldValues = workflowFieldValueRepository
                .findByWorkflowInstanceId(instance.getId());

        Optional<WorkflowFieldValue> limitedValue = fieldValues.stream()
                .filter(fv -> fv.getFieldName().equals(fieldName))
                .findFirst();

        if (limitedValue.isEmpty() || limitedValue.get().getValue() == null ||
                limitedValue.get().getValue().isBlank()) {
            log.debug("No value found for limited field '{}' in instance: {}",
                    fieldName, instance.getReferenceNumber());
            return null;
        }

        try {
            // Parse the amount value (handle potential formatting like commas)
            String valueStr = limitedValue.get().getValue()
                    .replaceAll("[^\\d.-]", ""); // Remove non-numeric characters except . and -
            return new BigDecimal(valueStr);
        } catch (NumberFormatException e) {
            log.warn("Could not parse amount from limited field '{}': {}",
                    fieldName, limitedValue.get().getValue());
            return null;
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

        // Check if email approvals are enabled
        boolean emailApprovalEnabled = emailApprovalService.isEmailApprovalEnabled();

        String approveLink = null;
        String rejectLink = null;

        if (emailApprovalEnabled) {
            // Generate approval tokens
            EmailApprovalToken approveToken = emailApprovalService.createToken(
                    instance,
                    approver.getApproverEmail(),
                    approver.getApproverName(),
                    instance.getCurrentLevel(),
                    EmailApprovalToken.ActionType.APPROVE
            );

            EmailApprovalToken rejectToken = emailApprovalService.createToken(
                    instance,
                    approver.getApproverEmail(),
                    approver.getApproverName(),
                    instance.getCurrentLevel(),
                    EmailApprovalToken.ActionType.REJECT
            );

            approveLink = emailApprovalService.generateApprovalUrl(approveToken.getToken(), EmailApprovalToken.ActionType.APPROVE);
            rejectLink = emailApprovalService.generateApprovalUrl(rejectToken.getToken(), EmailApprovalToken.ActionType.REJECT);
        }

        // Get amount if this is a financial workflow
        String amount = null;
        if (instance.getAmount() != null) {
            amount = "$" + instance.getAmount().toString();
        }

        // Collect summary fields (fields marked with inSummary=true)
        List<Map<String, String>> summaryFields = collectSummaryFields(instance);

        emailService.sendApprovalRequestEmail(
                approver.getApproverEmail(),
                approver.getApproverName(),
                instance.getWorkflow().getName(),
                instance.getReferenceNumber(),
                instance.getInitiator().getFullName(),
                approvalLink,
                approveLink,
                rejectLink,
                amount,
                emailApprovalEnabled,
                summaryFields
        );
    }

    private List<Map<String, String>> collectSummaryFields(WorkflowInstance instance) {
        List<Map<String, String>> summaryFields = new ArrayList<>();

        // Get all fields from the workflow's forms that have inSummary=true
        Workflow workflow = instance.getWorkflow();
        if (workflow.getForms() == null || workflow.getForms().isEmpty()) {
            return summaryFields;
        }

        // Get field values map for quick lookup
        Map<String, String> fieldValuesMap = instance.getFieldValues().stream()
                .collect(Collectors.toMap(
                        WorkflowFieldValue::getFieldName,
                        v -> v.getValue() != null ? v.getValue() : "",
                        (existing, replacement) -> replacement
                ));

        // Iterate through all forms and fields
        for (WorkflowForm form : workflow.getForms()) {
            if (form.getFields() == null) continue;

            for (WorkflowField field : form.getFields()) {
                if (Boolean.TRUE.equals(field.getInSummary())) {
                    Map<String, String> fieldData = new HashMap<>();
                    fieldData.put("label", field.getLabel());
                    fieldData.put("value", fieldValuesMap.getOrDefault(field.getName(), ""));
                    summaryFields.add(fieldData);
                }
            }
        }

        return summaryFields;
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
                        v -> v.getValue() != null ? v.getValue() : "",
                        (existing, replacement) -> replacement
                ));
    }

    private CustomUserDetails getCurrentUser() {
        return (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private WorkflowInstanceDTO toDTO(WorkflowInstance instance) {
        // Get total approvers at current level
        Integer totalApproversAtLevel = null;
        if (instance.getCurrentLevel() != null && instance.getCurrentLevel() > 0) {
            totalApproversAtLevel = workflowApproverRepository.countByWorkflowIdAndLevel(
                    instance.getWorkflow().getId(), instance.getCurrentLevel());
        }

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
                .currentApproverOrder(instance.getCurrentApproverOrder())
                .totalApproversAtLevel(totalApproversAtLevel)
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

    /**
     * Check if a field value is unique across all instances of a workflow.
     * Used for Unique() validation.
     */
    public boolean isFieldValueUnique(String workflowCode, String fieldName, String value, UUID excludeInstanceId) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Empty values are considered unique (or handled by Required validation)
        }

        // Find workflow by code
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElse(null);
        if (workflow == null) {
            return true; // Workflow not found, consider unique
        }

        // Check if any other instance has this field value
        List<WorkflowFieldValue> existingValues = workflowFieldValueRepository
                .findByWorkflowInstance_Workflow_CodeAndFieldNameAndValue(workflowCode, fieldName, value.trim());

        if (existingValues.isEmpty()) {
            return true; // No existing values, it's unique
        }

        // If we're editing an instance, exclude it from the check
        if (excludeInstanceId != null) {
            return existingValues.stream()
                    .noneMatch(fv -> !fv.getWorkflowInstance().getId().equals(excludeInstanceId));
        }

        return false; // Value already exists in another instance
    }
}
