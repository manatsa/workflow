package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.*;
import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    /**
     * Helper method to parse String ID to UUID.
     * Returns null if the ID is null, empty, or a temporary ID (starts with "temp_").
     */
    private UUID parseUuid(String id) {
        if (id == null || id.isEmpty() || id.startsWith("temp_")) {
            return null;
        }
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Generate a workflow code from the name.
     * Converts to uppercase, replaces spaces with underscores, removes special characters.
     */
    private String generateWorkflowCode(String name) {
        String baseCode = name.toUpperCase()
                .replaceAll("[^A-Z0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .replaceAll("_+", "_");
        if (baseCode.length() > 50) {
            baseCode = baseCode.substring(0, 50);
        }
        // Add timestamp suffix to ensure uniqueness
        return baseCode + "_" + System.currentTimeMillis() % 10000;
    }

    private final WorkflowRepository workflowRepository;
    private final WorkflowTypeRepository workflowTypeRepository;
    private final WorkflowFormRepository workflowFormRepository;
    private final WorkflowFieldRepository workflowFieldRepository;
    private final FieldGroupRepository fieldGroupRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final WorkflowApproverRepository workflowApproverRepository;
    private final SBURepository sbuRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public List<WorkflowDTO> getAllWorkflows() {
        return workflowRepository.findAll().stream()
                .map(this::toFullDTO)
                .collect(Collectors.toList());
    }

    public List<WorkflowDTO> getActivePublishedWorkflows() {
        return workflowRepository.findActivePublishedWorkflows().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<WorkflowDTO> getWorkflowsForUser(List<UUID> sbuIds) {
        if (sbuIds == null || sbuIds.isEmpty()) {
            return getActivePublishedWorkflows();
        }
        return workflowRepository.findBySbuIds(sbuIds).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<WorkflowDTO> searchWorkflows(String search, Pageable pageable) {
        return workflowRepository.searchWorkflows(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public WorkflowDTO getWorkflowById(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));
        return toFullDTO(workflow);
    }

    @Transactional(readOnly = true)
    public WorkflowDTO getWorkflowByCode(String code) {
        Workflow workflow = workflowRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("Workflow not found"));
        return toFullDTO(workflow);
    }

    @Transactional
    public WorkflowDTO createWorkflow(WorkflowDTO dto) {
        // Validate name
        String name = dto.getName();
        if (name == null || name.isBlank()) {
            throw new BusinessException("Workflow name is required");
        }
        if (workflowRepository.existsByName(name)) {
            throw new BusinessException("Workflow name already exists");
        }

        // Generate code if blank
        String code = dto.getCode();
        if (code == null || code.isBlank()) {
            code = generateWorkflowCode(name);
        }
        if (workflowRepository.existsByCode(code)) {
            throw new BusinessException("Workflow code already exists");
        }

        Workflow workflow = Workflow.builder()
                .name(name)
                .code(code)
                .description(dto.getDescription())
                .icon(dto.getIcon())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .requiresApproval(dto.getRequiresApproval() != null ? dto.getRequiresApproval() : true)
                .isPublished(false)
                .versionNumber(1)
                .commentsMandatory(dto.getCommentsMandatory() != null ? dto.getCommentsMandatory() : false)
                .commentsMandatoryOnReject(dto.getCommentsMandatoryOnReject() != null ? dto.getCommentsMandatoryOnReject() : true)
                .commentsMandatoryOnEscalate(dto.getCommentsMandatoryOnEscalate() != null ? dto.getCommentsMandatoryOnEscalate() : true)
                .build();

        // Set isActive from DTO (defaults to true)
        workflow.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        if (dto.getWorkflowTypeId() != null) {
            WorkflowType type = workflowTypeRepository.findById(dto.getWorkflowTypeId())
                    .orElseThrow(() -> new BusinessException("Workflow type not found"));
            workflow.setWorkflowType(type);
        }

        if (dto.getSbuIds() != null && !dto.getSbuIds().isEmpty()) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            workflow.setSbus(sbus);
        }

        Workflow saved = workflowRepository.save(workflow);

        // Process forms, fields, groups from DTO
        if (dto.getForms() != null && !dto.getForms().isEmpty()) {
            processFormsForWorkflow(saved, dto.getForms());
        } else {
            // Create default main form if no forms provided
            WorkflowForm mainForm = WorkflowForm.builder()
                    .workflow(saved)
                    .name("Main Form")
                    .displayOrder(0)
                    .isMainForm(true)
                    .build();
            workflowFormRepository.save(mainForm);
        }

        // Process approvers from DTO
        if (dto.getApprovers() != null && !dto.getApprovers().isEmpty()) {
            processApproversForWorkflow(saved, dto.getApprovers());
        }

        auditService.log(AuditLog.AuditAction.CREATE, "Workflow", saved.getId(),
                saved.getName(), "Workflow created: " + saved.getName(), null, toDTO(saved));

        return toFullDTO(saved);
    }

    @Transactional
    public WorkflowDTO updateWorkflow(UUID id, WorkflowDTO dto) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        WorkflowDTO oldValues = toDTO(workflow);

        workflow.setName(dto.getName());
        workflow.setDescription(dto.getDescription());
        workflow.setIcon(dto.getIcon());
        workflow.setDisplayOrder(dto.getDisplayOrder());
        workflow.setRequiresApproval(dto.getRequiresApproval());
        workflow.setCommentsMandatory(dto.getCommentsMandatory());
        workflow.setCommentsMandatoryOnReject(dto.getCommentsMandatoryOnReject());
        workflow.setCommentsMandatoryOnEscalate(dto.getCommentsMandatoryOnEscalate());

        if (dto.getWorkflowTypeId() != null) {
            WorkflowType type = workflowTypeRepository.findById(dto.getWorkflowTypeId())
                    .orElseThrow(() -> new BusinessException("Workflow type not found"));
            workflow.setWorkflowType(type);
        }

        if (dto.getSbuIds() != null) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            workflow.setSbus(sbus);
        }

        Workflow saved = workflowRepository.save(workflow);

        // Process forms, fields, groups from DTO
        if (dto.getForms() != null && !dto.getForms().isEmpty()) {
            processFormsForWorkflow(saved, dto.getForms());
        }

        // Process approvers from DTO
        if (dto.getApprovers() != null && !dto.getApprovers().isEmpty()) {
            processApproversForWorkflow(saved, dto.getApprovers());
        }

        auditService.log(AuditLog.AuditAction.UPDATE, "Workflow", saved.getId(),
                saved.getName(), "Workflow updated: " + saved.getName(), oldValues, toDTO(saved));

        return toFullDTO(saved);
    }

    @Transactional
    public void publishWorkflow(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        workflow.setIsPublished(true);
        workflow.setVersionNumber(workflow.getVersionNumber() + 1);
        workflowRepository.save(workflow);

        auditService.log(AuditLog.AuditAction.UPDATE, "Workflow", workflow.getId(),
                workflow.getName(), "Workflow published: " + workflow.getName(), null, null);
    }

    @Transactional
    public void unpublishWorkflow(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        workflow.setIsPublished(false);
        workflowRepository.save(workflow);

        auditService.log(AuditLog.AuditAction.UPDATE, "Workflow", workflow.getId(),
                workflow.getName(), "Workflow unpublished: " + workflow.getName(), null, null);
    }

    @Transactional
    public WorkflowFormDTO saveForm(UUID workflowId, WorkflowFormDTO dto) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        WorkflowForm form;
        UUID formId = parseUuid(dto.getId());
        if (formId != null) {
            form = workflowFormRepository.findById(formId)
                    .orElseThrow(() -> new BusinessException("Form not found"));
        } else {
            form = new WorkflowForm();
            form.setWorkflow(workflow);
        }

        form.setName(dto.getName());
        form.setDescription(dto.getDescription());
        form.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        form.setIcon(dto.getIcon());
        form.setIsMainForm(dto.getIsMainForm() != null ? dto.getIsMainForm() : false);

        WorkflowForm saved = workflowFormRepository.save(form);
        return toFormDTO(saved);
    }

    @Transactional
    public FieldGroupDTO saveFieldGroup(UUID formId, FieldGroupDTO dto) {
        WorkflowForm form = workflowFormRepository.findById(formId)
                .orElseThrow(() -> new BusinessException("Form not found"));

        FieldGroup group;
        UUID groupId = parseUuid(dto.getId());
        if (groupId != null) {
            group = fieldGroupRepository.findById(groupId)
                    .orElseThrow(() -> new BusinessException("Field group not found"));
        } else {
            group = new FieldGroup();
            group.setForm(form);
        }

        group.setTitle(dto.getTitle());
        group.setDescription(dto.getDescription());
        group.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        group.setColumns(dto.getColumns() != null ? dto.getColumns() : 2);
        group.setIsCollapsible(dto.getIsCollapsible() != null ? dto.getIsCollapsible() : false);
        group.setIsCollapsedByDefault(dto.getIsCollapsedByDefault() != null ? dto.getIsCollapsedByDefault() : false);
        group.setCssClass(dto.getCssClass());

        FieldGroup saved = fieldGroupRepository.save(group);
        return toFieldGroupDTO(saved);
    }

    @Transactional
    public WorkflowFieldDTO saveField(UUID formId, WorkflowFieldDTO dto) {
        WorkflowForm form = workflowFormRepository.findById(formId)
                .orElseThrow(() -> new BusinessException("Form not found"));

        WorkflowField field;
        UUID fieldId = parseUuid(dto.getId());
        if (fieldId != null) {
            field = workflowFieldRepository.findById(fieldId)
                    .orElseThrow(() -> new BusinessException("Field not found"));
        } else {
            field = new WorkflowField();
            field.setForm(form);
        }

        UUID fieldGroupId = parseUuid(dto.getFieldGroupId());
        if (fieldGroupId != null) {
            FieldGroup group = fieldGroupRepository.findById(fieldGroupId)
                    .orElseThrow(() -> new BusinessException("Field group not found"));
            field.setFieldGroup(group);
        } else {
            field.setFieldGroup(null);
        }

        field.setName(dto.getName());
        field.setLabel(dto.getLabel());
        field.setPlaceholder(dto.getPlaceholder());
        field.setTooltip(dto.getTooltip());
        field.setFieldType(dto.getFieldType() != null ? dto.getFieldType() : WorkflowField.FieldType.TEXT);
        field.setDataType(dto.getDataType() != null ? dto.getDataType() : WorkflowField.DataType.ALPHANUMERIC);
        field.setIsMandatory(dto.getIsMandatory() != null ? dto.getIsMandatory() : false);
        field.setIsSearchable(dto.getIsSearchable() != null ? dto.getIsSearchable() : false);
        field.setIsReadonly(dto.getIsReadonly() != null ? dto.getIsReadonly() : false);
        field.setIsHidden(dto.getIsHidden() != null ? dto.getIsHidden() : false);
        field.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        field.setDefaultValue(dto.getDefaultValue());
        field.setMinValue(dto.getMinValue());
        field.setMaxValue(dto.getMaxValue());
        field.setMinLength(dto.getMinLength());
        field.setMaxLength(dto.getMaxLength());
        field.setValidationRegex(dto.getValidationRegex());
        field.setValidationMessage(dto.getValidationMessage());
        field.setCustomValidationRule(dto.getCustomValidationRule());
        field.setCustomValidationMessage(dto.getCustomValidationMessage());
        field.setWidth(dto.getWidth());
        field.setCssClass(dto.getCssClass());
        field.setDropdownSource(dto.getDropdownSource());
        field.setDropdownDisplayField(dto.getDropdownDisplayField());
        field.setDropdownValueField(dto.getDropdownValueField());
        field.setIsAttachment(dto.getIsAttachment() != null ? dto.getIsAttachment() : false);
        field.setAllowedFileTypes(dto.getAllowedFileTypes());
        field.setMaxFileSize(dto.getMaxFileSize());
        field.setMaxFiles(dto.getMaxFiles());

        WorkflowField saved = workflowFieldRepository.save(field);

        // Handle options
        if (dto.getOptions() != null) {
            // Clear existing options
            fieldOptionRepository.deleteAll(saved.getOptions());
            saved.getOptions().clear();

            // Add new options
            for (FieldOptionDTO optionDto : dto.getOptions()) {
                FieldOption option = FieldOption.builder()
                        .field(saved)
                        .label(optionDto.getLabel())
                        .value(optionDto.getValue())
                        .displayOrder(optionDto.getDisplayOrder() != null ? optionDto.getDisplayOrder() : 0)
                        .isDefault(optionDto.getIsDefault() != null ? optionDto.getIsDefault() : false)
                        .description(optionDto.getDescription())
                        .icon(optionDto.getIcon())
                        .color(optionDto.getColor())
                        .build();
                fieldOptionRepository.save(option);
            }
        }

        return toFieldDTO(saved);
    }

    @Transactional
    public WorkflowApproverDTO saveApprover(UUID workflowId, WorkflowApproverDTO dto) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        WorkflowApprover approver;
        UUID approverId = parseUuid(dto.getId());
        if (approverId != null) {
            approver = workflowApproverRepository.findById(approverId)
                    .orElseThrow(() -> new BusinessException("Approver not found"));
        } else {
            approver = new WorkflowApprover();
            approver.setWorkflow(workflow);
        }

        if (dto.getUserId() != null) {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new BusinessException("User not found"));
            approver.setUser(user);
            approver.setApproverName(user.getFullName());
            approver.setApproverEmail(user.getEmail());
        } else {
            approver.setApproverName(dto.getApproverName());
            approver.setApproverEmail(dto.getApproverEmail());
        }

        approver.setLevel(dto.getLevel());
        approver.setApprovalLimit(dto.getApprovalLimit());
        approver.setIsUnlimited(dto.getApprovalLimit() == null || dto.getIsUnlimited());
        approver.setCanEscalate(dto.getCanEscalate() != null ? dto.getCanEscalate() : true);
        approver.setEscalationTimeoutHours(dto.getEscalationTimeoutHours());
        approver.setNotifyOnPending(dto.getNotifyOnPending() != null ? dto.getNotifyOnPending() : true);
        approver.setNotifyOnApproval(dto.getNotifyOnApproval() != null ? dto.getNotifyOnApproval() : true);
        approver.setNotifyOnRejection(dto.getNotifyOnRejection() != null ? dto.getNotifyOnRejection() : true);
        approver.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

        if (dto.getSbuId() != null) {
            SBU sbu = sbuRepository.findById(dto.getSbuId())
                    .orElseThrow(() -> new BusinessException("SBU not found"));
            approver.setSbu(sbu);
        }

        WorkflowApprover saved = workflowApproverRepository.save(approver);
        return toApproverDTO(saved);
    }

    @Transactional
    public void deleteForm(UUID formId) {
        WorkflowForm form = workflowFormRepository.findById(formId)
                .orElseThrow(() -> new BusinessException("Form not found"));
        workflowFormRepository.delete(form);
    }

    @Transactional
    public void deleteFieldGroup(UUID groupId) {
        FieldGroup group = fieldGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException("Field group not found"));
        fieldGroupRepository.delete(group);
    }

    @Transactional
    public void deleteField(UUID fieldId) {
        WorkflowField field = workflowFieldRepository.findById(fieldId)
                .orElseThrow(() -> new BusinessException("Field not found"));
        workflowFieldRepository.delete(field);
    }

    @Transactional
    public void deleteApprover(UUID approverId) {
        WorkflowApprover approver = workflowApproverRepository.findById(approverId)
                .orElseThrow(() -> new BusinessException("Approver not found"));
        workflowApproverRepository.delete(approver);
    }

    @Transactional
    public void deleteWorkflow(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        auditService.log(AuditLog.AuditAction.DELETE, "Workflow", workflow.getId(),
                workflow.getName(), "Workflow deleted: " + workflow.getName(), toDTO(workflow), null);

        workflowRepository.delete(workflow);
    }

    /**
     * Process forms, field groups, and fields for a workflow from DTOs.
     * Handles both create and update scenarios with temp IDs.
     */
    private void processFormsForWorkflow(Workflow workflow, List<WorkflowFormDTO> formDtos) {
        // Map to track temp IDs to real IDs for field groups
        Map<String, UUID> groupIdMap = new HashMap<>();

        // Collect form IDs that should be kept
        Set<UUID> formIdsToKeep = new HashSet<>();

        for (WorkflowFormDTO formDto : formDtos) {
            // Create or update form
            WorkflowForm form;
            UUID formId = parseUuid(formDto.getId());
            if (formId != null) {
                form = workflowFormRepository.findById(formId).orElse(null);
                if (form == null) {
                    form = new WorkflowForm();
                    form.setWorkflow(workflow);
                }
            } else {
                // No form ID provided - try to find existing main form for this workflow
                List<WorkflowForm> existingForms = workflowFormRepository.findByWorkflowId(workflow.getId());
                if (!existingForms.isEmpty()) {
                    // Reuse the first existing form
                    form = existingForms.get(0);
                } else {
                    form = new WorkflowForm();
                    form.setWorkflow(workflow);
                }
            }

            form.setName(formDto.getName() != null ? formDto.getName() : "Main Form");
            form.setDescription(formDto.getDescription());
            form.setDisplayOrder(formDto.getDisplayOrder() != null ? formDto.getDisplayOrder() : 0);
            form.setIcon(formDto.getIcon());
            form.setIsMainForm(formDto.getIsMainForm() != null ? formDto.getIsMainForm() : true);

            WorkflowForm savedForm = workflowFormRepository.save(form);
            formIdsToKeep.add(savedForm.getId());  // Track this form ID

            // Process field groups for this form
            if (formDto.getFieldGroups() != null) {
                for (FieldGroupDTO groupDto : formDto.getFieldGroups()) {
                    FieldGroup group;
                    UUID groupId = parseUuid(groupDto.getId());
                    if (groupId != null) {
                        group = fieldGroupRepository.findById(groupId).orElse(null);
                        if (group == null) {
                            group = new FieldGroup();
                            group.setForm(savedForm);
                        }
                    } else {
                        group = new FieldGroup();
                        group.setForm(savedForm);
                    }

                    group.setTitle(groupDto.getTitle() != null ? groupDto.getTitle() : "Untitled Group");
                    group.setDescription(groupDto.getDescription());
                    group.setDisplayOrder(groupDto.getDisplayOrder() != null ? groupDto.getDisplayOrder() : 0);
                    group.setColumns(groupDto.getColumns() != null ? groupDto.getColumns() : 2);
                    group.setIsCollapsible(groupDto.getIsCollapsible() != null ? groupDto.getIsCollapsible() : false);
                    group.setIsCollapsedByDefault(groupDto.getIsCollapsedByDefault() != null ? groupDto.getIsCollapsedByDefault() : false);
                    group.setCssClass(groupDto.getCssClass());

                    FieldGroup savedGroup = fieldGroupRepository.save(group);

                    // Map temp ID to real ID
                    if (groupDto.getId() != null && groupDto.getId().startsWith("temp_")) {
                        groupIdMap.put(groupDto.getId(), savedGroup.getId());
                    }
                }
            }

            // Process fields for this form
            if (formDto.getFields() != null) {
                for (WorkflowFieldDTO fieldDto : formDto.getFields()) {
                    if (fieldDto.getName() == null || fieldDto.getName().isBlank()) {
                        continue; // Skip fields without names
                    }
                    if (fieldDto.getLabel() == null || fieldDto.getLabel().isBlank()) {
                        fieldDto.setLabel(fieldDto.getName()); // Use name as label if not provided
                    }

                    WorkflowField field;
                    UUID fieldId = parseUuid(fieldDto.getId());
                    if (fieldId != null) {
                        field = workflowFieldRepository.findById(fieldId).orElse(null);
                        if (field == null) {
                            field = new WorkflowField();
                            field.setForm(savedForm);
                        }
                    } else {
                        field = new WorkflowField();
                        field.setForm(savedForm);
                    }

                    // Handle field group - check if it's a temp ID that needs mapping
                    String fieldGroupIdStr = fieldDto.getFieldGroupId();
                    if (fieldGroupIdStr != null && !fieldGroupIdStr.isBlank()) {
                        if (fieldGroupIdStr.startsWith("temp_") && groupIdMap.containsKey(fieldGroupIdStr)) {
                            FieldGroup group = fieldGroupRepository.findById(groupIdMap.get(fieldGroupIdStr)).orElse(null);
                            field.setFieldGroup(group);
                        } else {
                            UUID fieldGroupId = parseUuid(fieldGroupIdStr);
                            if (fieldGroupId != null) {
                                FieldGroup group = fieldGroupRepository.findById(fieldGroupId).orElse(null);
                                field.setFieldGroup(group);
                            }
                        }
                    } else {
                        field.setFieldGroup(null);
                    }

                    field.setName(fieldDto.getName());
                    field.setLabel(fieldDto.getLabel());
                    field.setPlaceholder(fieldDto.getPlaceholder());
                    field.setTooltip(fieldDto.getTooltip());
                    field.setFieldType(fieldDto.getFieldType() != null ? fieldDto.getFieldType() : WorkflowField.FieldType.TEXT);
                    field.setDataType(fieldDto.getDataType() != null ? fieldDto.getDataType() : WorkflowField.DataType.ALPHANUMERIC);
                    field.setIsMandatory(fieldDto.getIsMandatory() != null ? fieldDto.getIsMandatory() : false);
                    field.setIsSearchable(fieldDto.getIsSearchable() != null ? fieldDto.getIsSearchable() : false);
                    field.setIsReadonly(fieldDto.getIsReadonly() != null ? fieldDto.getIsReadonly() : false);
                    field.setIsHidden(fieldDto.getIsHidden() != null ? fieldDto.getIsHidden() : false);
                    field.setDisplayOrder(fieldDto.getDisplayOrder() != null ? fieldDto.getDisplayOrder() : 0);
                    field.setDefaultValue(fieldDto.getDefaultValue());
                    field.setMinValue(fieldDto.getMinValue());
                    field.setMaxValue(fieldDto.getMaxValue());
                    field.setMinLength(fieldDto.getMinLength());
                    field.setMaxLength(fieldDto.getMaxLength());
                    field.setValidationRegex(fieldDto.getValidationRegex());
                    field.setValidationMessage(fieldDto.getValidationMessage());
                    field.setWidth(fieldDto.getWidth());
                    field.setCssClass(fieldDto.getCssClass());
                    field.setDropdownSource(fieldDto.getDropdownSource());
                    field.setDropdownDisplayField(fieldDto.getDropdownDisplayField());
                    field.setDropdownValueField(fieldDto.getDropdownValueField());
                    field.setIsAttachment(fieldDto.getIsAttachment() != null ? fieldDto.getIsAttachment() : false);
                    field.setAllowedFileTypes(fieldDto.getAllowedFileTypes());
                    field.setMaxFileSize(fieldDto.getMaxFileSize());
                    field.setMaxFiles(fieldDto.getMaxFiles());

                    WorkflowField savedField = workflowFieldRepository.save(field);

                    // Process options for select/radio fields
                    if (fieldDto.getOptions() != null && !fieldDto.getOptions().isEmpty()) {
                        // Clear existing options
                        fieldOptionRepository.deleteAll(savedField.getOptions());
                        savedField.getOptions().clear();

                        for (FieldOptionDTO optionDto : fieldDto.getOptions()) {
                            if (optionDto.getValue() == null || optionDto.getValue().isBlank()) {
                                continue;
                            }
                            FieldOption option = FieldOption.builder()
                                    .field(savedField)
                                    .label(optionDto.getLabel() != null ? optionDto.getLabel() : optionDto.getValue())
                                    .value(optionDto.getValue())
                                    .displayOrder(optionDto.getDisplayOrder() != null ? optionDto.getDisplayOrder() : 0)
                                    .isDefault(optionDto.getIsDefault() != null ? optionDto.getIsDefault() : false)
                                    .description(optionDto.getDescription())
                                    .icon(optionDto.getIcon())
                                    .color(optionDto.getColor())
                                    .build();
                            fieldOptionRepository.save(option);
                        }
                    }
                }
            }
        }

        // Clean up orphan forms that are no longer in the workflow
        List<WorkflowForm> allForms = workflowFormRepository.findByWorkflowId(workflow.getId());
        for (WorkflowForm existingForm : allForms) {
            if (!formIdsToKeep.contains(existingForm.getId())) {
                // Delete fields in this orphan form
                workflowFieldRepository.deleteAll(existingForm.getFields());
                // Delete field groups in this orphan form
                fieldGroupRepository.deleteAll(existingForm.getFieldGroups());
                // Delete the orphan form
                workflowFormRepository.delete(existingForm);
            }
        }
    }

    /**
     * Process approvers for a workflow from DTOs.
     */
    private void processApproversForWorkflow(Workflow workflow, List<WorkflowApproverDTO> approverDtos) {
        for (WorkflowApproverDTO dto : approverDtos) {
            if (dto.getLevel() == null) {
                continue; // Skip approvers without level
            }

            WorkflowApprover approver;
            UUID approverId = parseUuid(dto.getId());
            if (approverId != null) {
                approver = workflowApproverRepository.findById(approverId).orElse(null);
                if (approver == null) {
                    approver = new WorkflowApprover();
                    approver.setWorkflow(workflow);
                }
            } else {
                approver = new WorkflowApprover();
                approver.setWorkflow(workflow);
            }

            // Handle user selection based on approverType
            String approverType = dto.getApproverType();
            if ("USER".equals(approverType)) {
                // Check for multiple user IDs first (approverIds), then fall back to single approverId
                List<String> approverIds = dto.getApproverIds();
                if (approverIds != null && !approverIds.isEmpty()) {
                    // Create multiple approver records for each user at the same level
                    boolean isFirst = true;
                    for (String userIdStr : approverIds) {
                        UUID userIdToUse = parseUuid(userIdStr);
                        if (userIdToUse != null) {
                            User user = userRepository.findById(userIdToUse).orElse(null);
                            if (user != null) {
                                WorkflowApprover multiApprover;
                                if (isFirst) {
                                    multiApprover = approver;
                                    isFirst = false;
                                } else {
                                    multiApprover = new WorkflowApprover();
                                    multiApprover.setWorkflow(workflow);
                                    multiApprover.setLevel(dto.getLevel());
                                    BigDecimal limit = dto.getAmountLimit() != null ? dto.getAmountLimit() : dto.getApprovalLimit();
                                    multiApprover.setApprovalLimit(limit);
                                    multiApprover.setIsUnlimited(limit == null || (dto.getIsUnlimited() != null && dto.getIsUnlimited()));
                                    multiApprover.setCanEscalate(dto.getCanEscalate() != null ? dto.getCanEscalate() : true);
                                    multiApprover.setEscalationTimeoutHours(dto.getEscalationTimeoutHours());
                                    Boolean emailNotification = dto.getEmailNotification() != null ? dto.getEmailNotification() : true;
                                    multiApprover.setNotifyOnPending(dto.getNotifyOnPending() != null ? dto.getNotifyOnPending() : emailNotification);
                                    multiApprover.setNotifyOnApproval(dto.getNotifyOnApproval() != null ? dto.getNotifyOnApproval() : emailNotification);
                                    multiApprover.setNotifyOnRejection(dto.getNotifyOnRejection() != null ? dto.getNotifyOnRejection() : emailNotification);
                                    multiApprover.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : dto.getLevel());
                                }
                                multiApprover.setUser(user);
                                multiApprover.setApproverName(user.getFullName());
                                multiApprover.setApproverEmail(user.getEmail());
                                if (!isFirst || multiApprover != approver) {
                                    workflowApproverRepository.save(multiApprover);
                                }
                            }
                        }
                    }
                } else {
                    // Fall back to single approverId for backward compatibility
                    UUID userIdToUse = null;
                    if (dto.getApproverId() != null && !dto.getApproverId().isEmpty()) {
                        userIdToUse = parseUuid(dto.getApproverId());
                    } else if (dto.getUserId() != null) {
                        userIdToUse = dto.getUserId();
                    }

                    if (userIdToUse != null) {
                        User user = userRepository.findById(userIdToUse).orElse(null);
                        if (user != null) {
                            approver.setUser(user);
                            approver.setApproverName(user.getFullName());
                            approver.setApproverEmail(user.getEmail());
                        }
                    }
                }
            } else if ("ROLE".equals(approverType)) {
                // Handle role-based approver
                if (dto.getRoleId() != null && !dto.getRoleId().isEmpty()) {
                    UUID roleId = parseUuid(dto.getRoleId());
                    if (roleId != null) {
                        Role role = roleRepository.findById(roleId).orElse(null);
                        if (role != null) {
                            approver.setApproverName(role.getName());
                            // For role-based, email might come from dto.email
                            approver.setApproverEmail(dto.getEmail());
                        }
                    }
                }
            } else {
                // MANAGER, SBU_HEAD, or other types
                approver.setApproverName(dto.getLabel() != null ? dto.getLabel() : dto.getApproverName());
                approver.setApproverEmail(dto.getEmail() != null ? dto.getEmail() : dto.getApproverEmail());
            }

            approver.setLevel(dto.getLevel());

            // Handle amount limit (frontend uses amountLimit, backend uses approvalLimit)
            BigDecimal limit = dto.getAmountLimit() != null ? dto.getAmountLimit() : dto.getApprovalLimit();
            approver.setApprovalLimit(limit);
            approver.setIsUnlimited(limit == null || (dto.getIsUnlimited() != null && dto.getIsUnlimited()));

            approver.setCanEscalate(dto.getCanEscalate() != null ? dto.getCanEscalate() : true);
            approver.setEscalationTimeoutHours(dto.getEscalationTimeoutHours());

            // Handle notification settings
            Boolean emailNotification = dto.getEmailNotification() != null ? dto.getEmailNotification() : true;
            approver.setNotifyOnPending(dto.getNotifyOnPending() != null ? dto.getNotifyOnPending() : emailNotification);
            approver.setNotifyOnApproval(dto.getNotifyOnApproval() != null ? dto.getNotifyOnApproval() : emailNotification);
            approver.setNotifyOnRejection(dto.getNotifyOnRejection() != null ? dto.getNotifyOnRejection() : emailNotification);

            approver.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : dto.getLevel());

            if (dto.getSbuId() != null) {
                SBU sbu = sbuRepository.findById(dto.getSbuId()).orElse(null);
                approver.setSbu(sbu);
            }

            workflowApproverRepository.save(approver);
        }
    }

    private WorkflowDTO toDTO(Workflow workflow) {
        return WorkflowDTO.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .code(workflow.getCode())
                .description(workflow.getDescription())
                .workflowTypeId(workflow.getWorkflowType() != null ? workflow.getWorkflowType().getId() : null)
                .workflowTypeName(workflow.getWorkflowType() != null ? workflow.getWorkflowType().getName() : null)
                .icon(workflow.getIcon())
                .displayOrder(workflow.getDisplayOrder())
                .requiresApproval(workflow.getRequiresApproval())
                .isPublished(workflow.getIsPublished())
                .isActive(workflow.getIsActive())
                .versionNumber(workflow.getVersionNumber())
                .commentsMandatory(workflow.getCommentsMandatory())
                .commentsMandatoryOnReject(workflow.getCommentsMandatoryOnReject())
                .commentsMandatoryOnEscalate(workflow.getCommentsMandatoryOnEscalate())
                .sbuIds(workflow.getSbus().stream().map(SBU::getId).collect(Collectors.toSet()))
                .build();
    }

    private WorkflowDTO toFullDTO(Workflow workflow) {
        WorkflowDTO dto = toDTO(workflow);
        dto.setForms(workflow.getForms().stream().map(this::toFormDTO).collect(Collectors.toList()));
        dto.setApprovers(workflow.getApprovers().stream().map(this::toApproverDTO).collect(Collectors.toList()));
        return dto;
    }

    private WorkflowFormDTO toFormDTO(WorkflowForm form) {
        return WorkflowFormDTO.builder()
                .id(form.getId() != null ? form.getId().toString() : null)
                .workflowId(form.getWorkflow().getId())
                .name(form.getName())
                .description(form.getDescription())
                .displayOrder(form.getDisplayOrder())
                .icon(form.getIcon())
                .isMainForm(form.getIsMainForm())
                .fields(form.getFields().stream().map(this::toFieldDTO).collect(Collectors.toList()))
                .fieldGroups(form.getFieldGroups().stream().map(this::toFieldGroupDTO).collect(Collectors.toList()))
                .build();
    }

    private FieldGroupDTO toFieldGroupDTO(FieldGroup group) {
        return FieldGroupDTO.builder()
                .id(group.getId() != null ? group.getId().toString() : null)
                .formId(group.getForm().getId() != null ? group.getForm().getId().toString() : null)
                .title(group.getTitle())
                .description(group.getDescription())
                .displayOrder(group.getDisplayOrder())
                .columns(group.getColumns())
                .isCollapsible(group.getIsCollapsible())
                .isCollapsedByDefault(group.getIsCollapsedByDefault())
                .cssClass(group.getCssClass())
                .fields(group.getFields().stream().map(this::toFieldDTO).collect(Collectors.toList()))
                .build();
    }

    private WorkflowFieldDTO toFieldDTO(WorkflowField field) {
        return WorkflowFieldDTO.builder()
                .id(field.getId() != null ? field.getId().toString() : null)
                .formId(field.getForm().getId() != null ? field.getForm().getId().toString() : null)
                .fieldGroupId(field.getFieldGroup() != null && field.getFieldGroup().getId() != null ? field.getFieldGroup().getId().toString() : null)
                .name(field.getName())
                .label(field.getLabel())
                .placeholder(field.getPlaceholder())
                .tooltip(field.getTooltip())
                .fieldType(field.getFieldType())
                .dataType(field.getDataType())
                .isMandatory(field.getIsMandatory())
                .isSearchable(field.getIsSearchable())
                .isReadonly(field.getIsReadonly())
                .isHidden(field.getIsHidden())
                .displayOrder(field.getDisplayOrder())
                .defaultValue(field.getDefaultValue())
                .minValue(field.getMinValue())
                .maxValue(field.getMaxValue())
                .minLength(field.getMinLength())
                .maxLength(field.getMaxLength())
                .validationRegex(field.getValidationRegex())
                .validationMessage(field.getValidationMessage())
                .customValidationRule(field.getCustomValidationRule())
                .customValidationMessage(field.getCustomValidationMessage())
                .width(field.getWidth())
                .cssClass(field.getCssClass())
                .options(field.getOptions().stream().map(this::toOptionDTO).collect(Collectors.toList()))
                .dropdownSource(field.getDropdownSource())
                .dropdownDisplayField(field.getDropdownDisplayField())
                .dropdownValueField(field.getDropdownValueField())
                .isAttachment(field.getIsAttachment())
                .allowedFileTypes(field.getAllowedFileTypes())
                .maxFileSize(field.getMaxFileSize())
                .maxFiles(field.getMaxFiles())
                .build();
    }

    private FieldOptionDTO toOptionDTO(FieldOption option) {
        return FieldOptionDTO.builder()
                .id(option.getId() != null ? option.getId().toString() : null)
                .fieldId(option.getField().getId() != null ? option.getField().getId().toString() : null)
                .label(option.getLabel())
                .value(option.getValue())
                .displayOrder(option.getDisplayOrder())
                .isDefault(option.getIsDefault())
                .description(option.getDescription())
                .icon(option.getIcon())
                .color(option.getColor())
                .build();
    }

    private WorkflowApproverDTO toApproverDTO(WorkflowApprover approver) {
        return WorkflowApproverDTO.builder()
                .id(approver.getId() != null ? approver.getId().toString() : null)
                .workflowId(approver.getWorkflow().getId())
                .userId(approver.getUser() != null ? approver.getUser().getId() : null)
                .userName(approver.getUser() != null ? approver.getUser().getUsername() : null)
                .approverName(approver.getApproverName())
                .approverEmail(approver.getApproverEmail())
                .level(approver.getLevel())
                .approvalLimit(approver.getApprovalLimit())
                .isUnlimited(approver.getIsUnlimited())
                .canEscalate(approver.getCanEscalate())
                .escalationTimeoutHours(approver.getEscalationTimeoutHours())
                .notifyOnPending(approver.getNotifyOnPending())
                .notifyOnApproval(approver.getNotifyOnApproval())
                .notifyOnRejection(approver.getNotifyOnRejection())
                .sbuId(approver.getSbu() != null ? approver.getSbu().getId() : null)
                .sbuName(approver.getSbu() != null ? approver.getSbu().getName() : null)
                .displayOrder(approver.getDisplayOrder())
                .build();
    }
}
