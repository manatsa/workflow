package com.sonar.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sonar.workflow.dto.*;
import com.sonar.workflow.entity.*;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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

    /**
     * Validates that at least one approver is configured if the setting requires it.
     */
    private void validateApproversIfRequired(List<WorkflowApproverDTO> approvers) {
        boolean requireApprovers = settingService.getBooleanValue("workflow.require.approvers", true);
        if (requireApprovers) {
            if (approvers == null || approvers.isEmpty()) {
                throw new BusinessException("At least one approver is required. This can be changed in Settings > Workflows.");
            }
            // Also check if any approver has a valid configuration
            boolean hasValidApprover = approvers.stream().anyMatch(a -> a.getLevel() != null && a.getLevel() > 0);
            if (!hasValidApprover) {
                throw new BusinessException("At least one approver with a valid level is required. This can be changed in Settings > Workflows.");
            }
        }
    }

    private final WorkflowRepository workflowRepository;
    private final WorkflowTypeRepository workflowTypeRepository;
    private final WorkflowFormRepository workflowFormRepository;
    private final WorkflowFieldRepository workflowFieldRepository;
    private final WorkflowFieldValueRepository workflowFieldValueRepository;
    private final FieldGroupRepository fieldGroupRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final ScreenRepository screenRepository;
    private final WorkflowApproverRepository workflowApproverRepository;
    private final SBURepository sbuRepository;
    private final DepartmentRepository departmentRepository;
    private final CorporateRepository corporateRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;
    private final SettingService settingService;
    private final SqlObjectService sqlObjectService;

    @Transactional(readOnly = true)
    public List<WorkflowDTO> getAllWorkflows() {
        return workflowRepository.findAll().stream()
                .map(this::toFullDTO)
                .collect(Collectors.toList());
    }

    public List<WorkflowDTO> getActivePublishedWorkflows() {
        User currentUser = getCurrentUser();

        return workflowRepository.findActivePublishedWorkflows().stream()
                .filter(workflow -> hasWorkflowAccess(workflow, currentUser))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check if a user has access to a workflow without throwing an exception.
     * Returns true if user has access, false otherwise.
     */
    private boolean hasWorkflowAccess(Workflow workflow, User user) {
        // If no restrictions, everyone has access
        if (workflow.getCorporates().isEmpty() &&
            workflow.getSbus().isEmpty() &&
            workflow.getBranches().isEmpty() &&
            workflow.getDepartments().isEmpty()) {
            return true;
        }

        // If no user, deny access to restricted workflows
        if (user == null) {
            return false;
        }

        // Super users (ADMIN role) bypass access restrictions
        if (user.getRoles() != null && user.getRoles().stream()
                .anyMatch(role -> "ADMIN".equalsIgnoreCase(role.getName()) || "ROLE_ADMIN".equalsIgnoreCase(role.getName()))) {
            return true;
        }

        // Check if user matches any of the workflow's access restrictions
        // Check corporates
        if (!workflow.getCorporates().isEmpty() && user.getCorporates() != null) {
            if (workflow.getCorporates().stream()
                    .anyMatch(wfCorp -> user.getCorporates().stream()
                            .anyMatch(userCorp -> userCorp.getId().equals(wfCorp.getId())))) {
                return true;
            }
        }

        // Check SBUs
        if (!workflow.getSbus().isEmpty() && user.getSbus() != null) {
            if (workflow.getSbus().stream()
                    .anyMatch(wfSbu -> user.getSbus().stream()
                            .anyMatch(userSbu -> userSbu.getId().equals(wfSbu.getId())))) {
                return true;
            }
        }

        // Check branches
        if (!workflow.getBranches().isEmpty() && user.getBranches() != null) {
            if (workflow.getBranches().stream()
                    .anyMatch(wfBranch -> user.getBranches().stream()
                            .anyMatch(userBranch -> userBranch.getId().equals(wfBranch.getId())))) {
                return true;
            }
        }

        // Check departments
        if (!workflow.getDepartments().isEmpty() && user.getDepartments() != null) {
            if (workflow.getDepartments().stream()
                    .anyMatch(wfDept -> user.getDepartments().stream()
                            .anyMatch(userDept -> userDept.getId().equals(wfDept.getId())))) {
                return true;
            }
        }

        return false;
    }

    public List<WorkflowDTO> getWorkflowsForUser(List<UUID> sbuIds) {
        User currentUser = getCurrentUser();

        if (sbuIds == null || sbuIds.isEmpty()) {
            return getActivePublishedWorkflows();
        }
        return workflowRepository.findBySbuIds(sbuIds).stream()
                .filter(workflow -> hasWorkflowAccess(workflow, currentUser))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<WorkflowDTO> searchWorkflows(String search, Pageable pageable) {
        return workflowRepository.searchWorkflows(search, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public WorkflowDTO getWorkflowById(UUID id) {
        return getWorkflowById(id, true);
    }

    @Transactional(readOnly = true)
    public WorkflowDTO getWorkflowById(UUID id, boolean checkAccess) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        // Check user access restrictions if requested
        if (checkAccess) {
            checkWorkflowAccess(workflow);
        }

        return toFullDTO(workflow);
    }

    @Transactional(readOnly = true)
    public WorkflowDTO getWorkflowByCode(String code) {
        Workflow workflow = workflowRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        // Check user access restrictions
        checkWorkflowAccess(workflow);

        return toFullDTO(workflow);
    }

    /**
     * Check if the current user has access to the workflow based on access restrictions.
     * If workflow has no restrictions (all sets empty), everyone has access.
     * If workflow has restrictions, user must match at least one corporate, SBU, branch, or department.
     */
    private void checkWorkflowAccess(Workflow workflow) {
        // If no restrictions, everyone has access
        if (workflow.getCorporates().isEmpty() &&
            workflow.getSbus().isEmpty() &&
            workflow.getBranches().isEmpty() &&
            workflow.getDepartments().isEmpty()) {
            return;
        }

        // Get current user
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new BusinessException("This workflow is restricted. Please consult your system administrator.");
        }

        // Super users (ADMIN role) bypass access restrictions
        if (currentUser.getRoles() != null && currentUser.getRoles().stream()
                .anyMatch(role -> "ADMIN".equalsIgnoreCase(role.getName()) || "ROLE_ADMIN".equalsIgnoreCase(role.getName()))) {
            return;
        }

        // Check if user matches any of the workflow's access restrictions
        boolean hasAccess = false;

        // Check corporates
        if (!workflow.getCorporates().isEmpty() && currentUser.getCorporates() != null) {
            hasAccess = workflow.getCorporates().stream()
                    .anyMatch(wfCorp -> currentUser.getCorporates().stream()
                            .anyMatch(userCorp -> userCorp.getId().equals(wfCorp.getId())));
        }

        // Check SBUs
        if (!hasAccess && !workflow.getSbus().isEmpty() && currentUser.getSbus() != null) {
            hasAccess = workflow.getSbus().stream()
                    .anyMatch(wfSbu -> currentUser.getSbus().stream()
                            .anyMatch(userSbu -> userSbu.getId().equals(wfSbu.getId())));
        }

        // Check branches
        if (!hasAccess && !workflow.getBranches().isEmpty() && currentUser.getBranches() != null) {
            hasAccess = workflow.getBranches().stream()
                    .anyMatch(wfBranch -> currentUser.getBranches().stream()
                            .anyMatch(userBranch -> userBranch.getId().equals(wfBranch.getId())));
        }

        // Check departments
        if (!hasAccess && !workflow.getDepartments().isEmpty() && currentUser.getDepartments() != null) {
            hasAccess = workflow.getDepartments().stream()
                    .anyMatch(wfDept -> currentUser.getDepartments().stream()
                            .anyMatch(userDept -> userDept.getId().equals(wfDept.getId())));
        }

        if (!hasAccess) {
            throw new BusinessException("This workflow is restricted. Please consult your system administrator.");
        }
    }

    /**
     * Get the current authenticated user.
     */
    private User getCurrentUser() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.sonar.workflow.security.CustomUserDetails userDetails) {
                return userRepository.findById(userDetails.getId()).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not get current user: {}", e.getMessage());
        }
        return null;
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

        // Validate approvers if required by settings
        validateApproversIfRequired(dto.getApprovers());

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
                .showSummary(dto.getShowSummary() != null ? dto.getShowSummary() : false)
                .workflowCategory(dto.getWorkflowCategory() != null ? dto.getWorkflowCategory() : Workflow.WorkflowCategory.NON_FINANCIAL)
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

        if (dto.getDepartmentIds() != null && !dto.getDepartmentIds().isEmpty()) {
            Set<Department> departments = new HashSet<>(departmentRepository.findAllById(dto.getDepartmentIds()));
            workflow.setDepartments(departments);
        }

        if (dto.getCorporateIds() != null && !dto.getCorporateIds().isEmpty()) {
            Set<Corporate> corporates = new HashSet<>(corporateRepository.findAllById(dto.getCorporateIds()));
            workflow.setCorporates(corporates);
        }

        if (dto.getBranchIds() != null && !dto.getBranchIds().isEmpty()) {
            Set<Branch> branches = new HashSet<>(branchRepository.findAllById(dto.getBranchIds()));
            workflow.setBranches(branches);
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

        // Validate approvers if required by settings
        validateApproversIfRequired(dto.getApprovers());

        WorkflowDTO oldValues = toDTO(workflow);

        workflow.setName(dto.getName());
        workflow.setDescription(dto.getDescription());
        workflow.setIcon(dto.getIcon());
        workflow.setDisplayOrder(dto.getDisplayOrder());
        workflow.setRequiresApproval(dto.getRequiresApproval());
        workflow.setCommentsMandatory(dto.getCommentsMandatory());
        workflow.setCommentsMandatoryOnReject(dto.getCommentsMandatoryOnReject());
        workflow.setCommentsMandatoryOnEscalate(dto.getCommentsMandatoryOnEscalate());
        workflow.setShowSummary(dto.getShowSummary() != null ? dto.getShowSummary() : false);
        if (dto.getWorkflowCategory() != null) {
            workflow.setWorkflowCategory(dto.getWorkflowCategory());
        }

        if (dto.getWorkflowTypeId() != null) {
            WorkflowType type = workflowTypeRepository.findById(dto.getWorkflowTypeId())
                    .orElseThrow(() -> new BusinessException("Workflow type not found"));
            workflow.setWorkflowType(type);
        }

        if (dto.getSbuIds() != null) {
            Set<SBU> sbus = new HashSet<>(sbuRepository.findAllById(dto.getSbuIds()));
            workflow.setSbus(sbus);
        }

        if (dto.getDepartmentIds() != null) {
            Set<Department> departments = new HashSet<>(departmentRepository.findAllById(dto.getDepartmentIds()));
            workflow.setDepartments(departments);
        }

        if (dto.getCorporateIds() != null) {
            Set<Corporate> corporates = new HashSet<>(corporateRepository.findAllById(dto.getCorporateIds()));
            workflow.setCorporates(corporates);
        }

        if (dto.getBranchIds() != null) {
            Set<Branch> branches = new HashSet<>(branchRepository.findAllById(dto.getBranchIds()));
            workflow.setBranches(branches);
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
        field.setIsUnique(dto.getIsUnique() != null ? dto.getIsUnique() : false);
        field.setIsTitle(dto.getIsTitle() != null ? dto.getIsTitle() : false);
        field.setIsLimited(dto.getIsLimited() != null ? dto.getIsLimited() : false);
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
        field.setOptionsLayout(dto.getOptionsLayout() != null ? dto.getOptionsLayout() : "vertical");
        field.setDropdownSource(dto.getDropdownSource());
        field.setDropdownDisplayField(dto.getDropdownDisplayField());
        field.setDropdownValueField(dto.getDropdownValueField());
        field.setSqlObjectId(dto.getSqlObjectId());
        field.setOptionsSource(dto.getOptionsSource() != null ? dto.getOptionsSource() : "STATIC");
        if (dto.getViewType() != null) {
            field.setViewType(WorkflowField.ViewType.valueOf(dto.getViewType()));
        }
        field.setIsAttachment(dto.getIsAttachment() != null ? dto.getIsAttachment() : false);
        field.setAllowedFileTypes(dto.getAllowedFileTypes());
        field.setMaxFileSize(dto.getMaxFileSize());
        field.setMaxFiles(dto.getMaxFiles());
        field.setInSummary(dto.getInSummary() != null ? dto.getInSummary() : false);
        field.setRatingMax(dto.getRatingMax() != null ? dto.getRatingMax() : 5);
        field.setSliderMin(dto.getSliderMin() != null ? dto.getSliderMin() : 0.0);
        field.setSliderMax(dto.getSliderMax() != null ? dto.getSliderMax() : 100.0);
        field.setSliderStep(dto.getSliderStep() != null ? dto.getSliderStep() : 1.0);
        field.setTableColumns(dto.getTableColumns());
        field.setTableMinRows(dto.getTableMinRows() != null ? dto.getTableMinRows() : 0);
        field.setTableMaxRows(dto.getTableMaxRows());
        field.setTableStriped(dto.getTableStriped() != null ? dto.getTableStriped() : true);
        field.setTableBordered(dto.getTableBordered() != null ? dto.getTableBordered() : true);

        WorkflowField saved = workflowFieldRepository.save(field);

        // Handle options
        if (dto.getOptions() != null) {
            // Clear existing options - orphanRemoval=true will handle deletion
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
        try {
            // 1. Delete field values first (from workflow instances)
            workflowFieldValueRepository.deleteByFieldId(fieldId);
            workflowFieldValueRepository.flush();

            // 2. Clear options collection - orphanRemoval=true will handle deletion
            field.getOptions().clear();

            // 3. Delete the field (cascade will delete remaining options)
            workflowFieldRepository.delete(field);
            workflowFieldRepository.flush();
            log.info("Deleted field: {} (ID: {})", field.getName(), fieldId);
        } catch (Exception e) {
            log.error("Error deleting field {} (ID: {}): {}", field.getName(), fieldId, e.getMessage());
            throw new BusinessException("Failed to delete field '" + field.getName() + "': " + e.getMessage());
        }
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
     * Process forms, field groups, screens, and fields for a workflow from DTOs.
     * Handles both create and update scenarios with temp IDs.
     */
    private void processFormsForWorkflow(Workflow workflow, List<WorkflowFormDTO> formDtos) {
        // Map to track temp IDs to real IDs for field groups and screens
        Map<String, UUID> groupIdMap = new HashMap<>();
        Map<String, UUID> screenIdMap = new HashMap<>();

        // Collect IDs that should be kept
        Set<UUID> formIdsToKeep = new HashSet<>();
        Map<UUID, Set<UUID>> fieldIdsToKeepByForm = new HashMap<>();
        Map<UUID, Set<UUID>> groupIdsToKeepByForm = new HashMap<>();
        Map<UUID, Set<UUID>> screenIdsToKeepByForm = new HashMap<>();

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

            // Initialize tracking sets for this form
            fieldIdsToKeepByForm.put(savedForm.getId(), new HashSet<>());
            groupIdsToKeepByForm.put(savedForm.getId(), new HashSet<>());
            screenIdsToKeepByForm.put(savedForm.getId(), new HashSet<>());

            // Process screens for this form (before field groups so we can assign groups to screens)
            if (formDto.getScreens() != null) {
                for (ScreenDTO screenDto : formDto.getScreens()) {
                    Screen screen;
                    UUID screenId = parseUuid(screenDto.getId());
                    if (screenId != null) {
                        screen = screenRepository.findById(screenId).orElse(null);
                        if (screen == null) {
                            screen = new Screen();
                            screen.setForm(savedForm);
                        }
                    } else {
                        screen = new Screen();
                        screen.setForm(savedForm);
                    }

                    screen.setTitle(screenDto.getTitle() != null ? screenDto.getTitle() : "Untitled Screen");
                    screen.setDescription(screenDto.getDescription());
                    screen.setDisplayOrder(screenDto.getDisplayOrder() != null ? screenDto.getDisplayOrder() : 0);
                    screen.setIcon(screenDto.getIcon());
                    screen.setIsSummaryScreen(screenDto.getIsSummaryScreen() != null ? screenDto.getIsSummaryScreen() : false);

                    Screen savedScreen = screenRepository.save(screen);
                    screenIdsToKeepByForm.get(savedForm.getId()).add(savedScreen.getId());

                    // Map temp ID to real ID
                    if (screenDto.getId() != null && screenDto.getId().startsWith("temp_")) {
                        screenIdMap.put(screenDto.getId(), savedScreen.getId());
                    }
                }
            }

            // Manage Summary screen based on workflow.showSummary setting
            Boolean showSummary = workflow.getShowSummary();
            List<Screen> existingScreens = screenRepository.findByFormId(savedForm.getId());
            Screen existingSummaryScreen = existingScreens.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsSummaryScreen()))
                    .findFirst()
                    .orElse(null);

            if (Boolean.TRUE.equals(showSummary)) {
                // Calculate max display order from non-summary screens
                int maxDisplayOrder = existingScreens.stream()
                        .filter(s -> !Boolean.TRUE.equals(s.getIsSummaryScreen()))
                        .mapToInt(s -> s.getDisplayOrder() != null ? s.getDisplayOrder() : 0)
                        .max()
                        .orElse(0);

                // Create or update Summary screen
                Screen summaryScreen = existingSummaryScreen != null ? existingSummaryScreen : new Screen();
                summaryScreen.setForm(savedForm);
                summaryScreen.setTitle("Summary");
                summaryScreen.setDescription("Review your submission before submitting");
                summaryScreen.setDisplayOrder(maxDisplayOrder + 1);
                summaryScreen.setIcon("summarize");
                summaryScreen.setIsSummaryScreen(true);

                Screen savedSummaryScreen = screenRepository.save(summaryScreen);
                screenIdsToKeepByForm.get(savedForm.getId()).add(savedSummaryScreen.getId());
            } else {
                // Remove existing Summary screen if showSummary is false
                if (existingSummaryScreen != null) {
                    screenRepository.delete(existingSummaryScreen);
                }
            }

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

                    // Handle screen assignment - check if it's a temp ID that needs mapping
                    String screenIdStr = groupDto.getScreenId();
                    if (screenIdStr != null && !screenIdStr.isBlank()) {
                        if (screenIdStr.startsWith("temp_") && screenIdMap.containsKey(screenIdStr)) {
                            Screen screen = screenRepository.findById(screenIdMap.get(screenIdStr)).orElse(null);
                            group.setScreen(screen);
                        } else {
                            UUID screenIdParsed = parseUuid(screenIdStr);
                            if (screenIdParsed != null) {
                                Screen screen = screenRepository.findById(screenIdParsed).orElse(null);
                                group.setScreen(screen);
                            }
                        }
                    } else {
                        group.setScreen(null);
                    }

                    FieldGroup savedGroup = fieldGroupRepository.save(group);
                    groupIdsToKeepByForm.get(savedForm.getId()).add(savedGroup.getId());

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

                    // Handle screen assignment - check if it's a temp ID that needs mapping
                    String screenIdStr = fieldDto.getScreenId();
                    if (screenIdStr != null && !screenIdStr.isBlank()) {
                        if (screenIdStr.startsWith("temp_") && screenIdMap.containsKey(screenIdStr)) {
                            Screen screen = screenRepository.findById(screenIdMap.get(screenIdStr)).orElse(null);
                            field.setScreen(screen);
                        } else {
                            UUID screenIdParsed = parseUuid(screenIdStr);
                            if (screenIdParsed != null) {
                                Screen screen = screenRepository.findById(screenIdParsed).orElse(null);
                                field.setScreen(screen);
                            }
                        }
                    } else {
                        field.setScreen(null);
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
                    field.setIsUnique(fieldDto.getIsUnique() != null ? fieldDto.getIsUnique() : false);
                    field.setIsTitle(fieldDto.getIsTitle() != null ? fieldDto.getIsTitle() : false);
                    field.setIsLimited(fieldDto.getIsLimited() != null ? fieldDto.getIsLimited() : false);
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
                    field.setOptionsLayout(fieldDto.getOptionsLayout() != null ? fieldDto.getOptionsLayout() : "vertical");
                    field.setDropdownSource(fieldDto.getDropdownSource());
                    field.setDropdownDisplayField(fieldDto.getDropdownDisplayField());
                    field.setDropdownValueField(fieldDto.getDropdownValueField());
                    field.setSqlObjectId(fieldDto.getSqlObjectId());
                    field.setOptionsSource(fieldDto.getOptionsSource() != null ? fieldDto.getOptionsSource() : "STATIC");
                    if (fieldDto.getViewType() != null) {
                        field.setViewType(WorkflowField.ViewType.valueOf(fieldDto.getViewType()));
                    }
                    field.setIsAttachment(fieldDto.getIsAttachment() != null ? fieldDto.getIsAttachment() : false);
                    field.setAllowedFileTypes(fieldDto.getAllowedFileTypes());
                    field.setMaxFileSize(fieldDto.getMaxFileSize());
                    field.setMaxFiles(fieldDto.getMaxFiles());
                    field.setInSummary(fieldDto.getInSummary() != null ? fieldDto.getInSummary() : false);
                    field.setRatingMax(fieldDto.getRatingMax() != null ? fieldDto.getRatingMax() : 5);
                    field.setSliderMin(fieldDto.getSliderMin() != null ? fieldDto.getSliderMin() : 0.0);
                    field.setSliderMax(fieldDto.getSliderMax() != null ? fieldDto.getSliderMax() : 100.0);
                    field.setSliderStep(fieldDto.getSliderStep() != null ? fieldDto.getSliderStep() : 1.0);
                    field.setTableColumns(fieldDto.getTableColumns());
                    field.setTableMinRows(fieldDto.getTableMinRows() != null ? fieldDto.getTableMinRows() : 0);
                    field.setTableMaxRows(fieldDto.getTableMaxRows());
                    field.setTableStriped(fieldDto.getTableStriped() != null ? fieldDto.getTableStriped() : true);
                    field.setTableBordered(fieldDto.getTableBordered() != null ? fieldDto.getTableBordered() : true);
                    field.setValidation(fieldDto.getValidation());
                    field.setCustomValidationRule(fieldDto.getCustomValidationRule());
                    field.setVisibilityExpression(fieldDto.getVisibilityExpression() != null ? fieldDto.getVisibilityExpression() : "true");

                    WorkflowField savedField = workflowFieldRepository.save(field);
                    fieldIdsToKeepByForm.get(savedForm.getId()).add(savedField.getId());

                    // Process options for select/radio fields
                    if (fieldDto.getOptions() != null && !fieldDto.getOptions().isEmpty()) {
                        // Clear existing options - orphanRemoval=true will handle deletion
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

        // Clean up orphan items (fields, groups, screens) that are no longer in each form
        for (UUID formId : formIdsToKeep) {
            WorkflowForm form = workflowFormRepository.findById(formId).orElse(null);
            if (form == null) continue;

            // Delete orphan fields
            Set<UUID> fieldIdsToKeep = fieldIdsToKeepByForm.getOrDefault(formId, new HashSet<>());
            List<WorkflowField> allFields = workflowFieldRepository.findByFormId(formId);
            log.info("Form {} has {} total fields, keeping {} fields", formId, allFields.size(), fieldIdsToKeep.size());
            List<WorkflowField> fieldsToDelete = new ArrayList<>();
            for (WorkflowField field : allFields) {
                if (!fieldIdsToKeep.contains(field.getId())) {
                    fieldsToDelete.add(field);
                }
            }
            // Delete orphan fields - must delete in proper order to avoid FK constraint issues
            for (WorkflowField field : fieldsToDelete) {
                log.info("Deleting orphan field: {} (ID: {})", field.getName(), field.getId());
                try {
                    UUID fieldId = field.getId();

                    // 1. First delete field values (from workflow instances)
                    workflowFieldValueRepository.deleteByFieldId(fieldId);

                    // 2. Delete field options directly
                    fieldOptionRepository.deleteByFieldId(fieldId);

                    // 3. Delete the field using direct JPQL query to bypass entity state issues
                    workflowFieldRepository.deleteFieldById(fieldId);

                    log.info("Successfully deleted field: {} (ID: {})", field.getName(), fieldId);
                } catch (Exception e) {
                    log.error("Error deleting field {} (ID: {}): {}", field.getName(), field.getId(), e.getMessage(), e);
                    throw new BusinessException("Failed to delete field '" + field.getName() + "': " + e.getMessage());
                }
            }

            // Delete orphan field groups
            Set<UUID> groupIdsToKeep = groupIdsToKeepByForm.getOrDefault(formId, new HashSet<>());
            List<FieldGroup> allGroups = fieldGroupRepository.findByFormId(formId);
            for (FieldGroup group : allGroups) {
                if (!groupIdsToKeep.contains(group.getId())) {
                    fieldGroupRepository.delete(group);
                }
            }

            // Delete orphan screens
            Set<UUID> screenIdsToKeep = screenIdsToKeepByForm.getOrDefault(formId, new HashSet<>());
            List<Screen> allScreens = screenRepository.findByFormId(formId);
            for (Screen screen : allScreens) {
                if (!screenIdsToKeep.contains(screen.getId())) {
                    screenRepository.delete(screen);
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
                // Delete screens in this orphan form
                screenRepository.deleteAll(existingForm.getScreens());
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

            // Always use specific user as approver - get user ID from various possible fields
            UUID userIdToUse = dto.getUserId();
            if (userIdToUse == null && dto.getApproverId() != null && !dto.getApproverId().isEmpty()) {
                userIdToUse = parseUuid(dto.getApproverId());
            }
            if (userIdToUse == null && dto.getApproverIds() != null && !dto.getApproverIds().isEmpty()) {
                userIdToUse = parseUuid(dto.getApproverIds().get(0));
            }

            if (userIdToUse != null) {
                User user = userRepository.findById(userIdToUse).orElse(null);
                if (user != null) {
                    approver.setUser(user);
                    approver.setApproverName(user.getFullName());
                    approver.setApproverEmail(user.getEmail());
                }
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
                .showSummary(workflow.getShowSummary())
                .workflowCategory(workflow.getWorkflowCategory())
                .corporateIds(workflow.getCorporates().stream().map(Corporate::getId).collect(Collectors.toSet()))
                .sbuIds(workflow.getSbus().stream().map(SBU::getId).collect(Collectors.toSet()))
                .branchIds(workflow.getBranches().stream().map(Branch::getId).collect(Collectors.toSet()))
                .departmentIds(workflow.getDepartments().stream().map(Department::getId).collect(Collectors.toSet()))
                .createdBy(workflow.getCreatedBy())
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
                .screens(form.getScreens().stream().map(this::toScreenDTO).collect(Collectors.toList()))
                .build();
    }

    private ScreenDTO toScreenDTO(Screen screen) {
        return ScreenDTO.builder()
                .id(screen.getId() != null ? screen.getId().toString() : null)
                .formId(screen.getForm().getId() != null ? screen.getForm().getId().toString() : null)
                .title(screen.getTitle())
                .description(screen.getDescription())
                .displayOrder(screen.getDisplayOrder())
                .icon(screen.getIcon())
                .isSummaryScreen(screen.getIsSummaryScreen())
                .build();
    }

    private FieldGroupDTO toFieldGroupDTO(FieldGroup group) {
        return FieldGroupDTO.builder()
                .id(group.getId() != null ? group.getId().toString() : null)
                .formId(group.getForm().getId() != null ? group.getForm().getId().toString() : null)
                .screenId(group.getScreen() != null && group.getScreen().getId() != null ? group.getScreen().getId().toString() : null)
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
        // Determine options source - use SQL Object options if configured
        List<FieldOptionDTO> fieldOptions;
        // Fetch SQL Object options for SQL_OBJECT field type or if optionsSource is SQL
        if ((field.getFieldType() == WorkflowField.FieldType.SQL_OBJECT || "SQL".equals(field.getOptionsSource()))
                && field.getSqlObjectId() != null) {
            // Fetch options from SQL Object table
            fieldOptions = getSqlObjectOptionsAsFieldOptions(field.getSqlObjectId());
        } else {
            // Use static options defined on the field
            fieldOptions = field.getOptions().stream().map(this::toOptionDTO).collect(Collectors.toList());
        }

        return WorkflowFieldDTO.builder()
                .id(field.getId() != null ? field.getId().toString() : null)
                .formId(field.getForm().getId() != null ? field.getForm().getId().toString() : null)
                .fieldGroupId(field.getFieldGroup() != null && field.getFieldGroup().getId() != null ? field.getFieldGroup().getId().toString() : null)
                .screenId(field.getScreen() != null && field.getScreen().getId() != null ? field.getScreen().getId().toString() : null)
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
                .isUnique(field.getIsUnique())
                .isTitle(field.getIsTitle())
                .isLimited(field.getIsLimited())
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
                .validation(field.getValidation())
                .visibilityExpression(field.getVisibilityExpression())
                .width(field.getWidth())
                .cssClass(field.getCssClass())
                .options(fieldOptions)
                .optionsLayout(field.getOptionsLayout())
                .dropdownSource(field.getDropdownSource())
                .dropdownDisplayField(field.getDropdownDisplayField())
                .dropdownValueField(field.getDropdownValueField())
                .sqlObjectId(field.getSqlObjectId())
                .optionsSource(field.getOptionsSource())
                .viewType(field.getViewType() != null ? field.getViewType().name() : null)
                .isAttachment(field.getIsAttachment())
                .allowedFileTypes(field.getAllowedFileTypes())
                .maxFileSize(field.getMaxFileSize())
                .maxFiles(field.getMaxFiles())
                .inSummary(field.getInSummary())
                .ratingMax(field.getRatingMax())
                .sliderMin(field.getSliderMin())
                .sliderMax(field.getSliderMax())
                .sliderStep(field.getSliderStep())
                .tableColumns(field.getTableColumns())
                .tableMinRows(field.getTableMinRows())
                .tableMaxRows(field.getTableMaxRows())
                .tableStriped(field.getTableStriped())
                .tableBordered(field.getTableBordered())
                .build();
    }

    /**
     * Fetch options from SQL Object table and convert to FieldOptionDTO list
     */
    private List<FieldOptionDTO> getSqlObjectOptionsAsFieldOptions(UUID sqlObjectId) {
        try {
            List<Map<String, String>> sqlOptions = sqlObjectService.getOptionsFromSqlObject(sqlObjectId);
            List<FieldOptionDTO> options = new ArrayList<>();
            int order = 0;
            for (Map<String, String> sqlOption : sqlOptions) {
                options.add(FieldOptionDTO.builder()
                        .value(sqlOption.get("value"))
                        .label(sqlOption.get("label"))
                        .displayOrder(order++)
                        .build());
            }
            return options;
        } catch (Exception e) {
            log.warn("Failed to fetch SQL Object options for ID {}: {}", sqlObjectId, e.getMessage());
            return new ArrayList<>();
        }
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
        // Safely get user ID without triggering lazy loading of the full entity
        UUID userId = null;
        String userName = null;
        try {
            if (approver.getUser() != null) {
                userId = approver.getUser().getId();
                // Use approverName as fallback to avoid lazy loading issues
                userName = approver.getApproverName();
            }
        } catch (Exception e) {
            // If lazy loading fails, fall back to stored name
            userName = approver.getApproverName();
        }

        // Safely get SBU info
        UUID sbuId = null;
        String sbuName = null;
        try {
            if (approver.getSbu() != null) {
                sbuId = approver.getSbu().getId();
                sbuName = approver.getSbu().getName();
            }
        } catch (Exception e) {
            // Ignore lazy loading issues for SBU
        }

        return WorkflowApproverDTO.builder()
                .id(approver.getId() != null ? approver.getId().toString() : null)
                .workflowId(approver.getWorkflow().getId())
                .userId(userId)
                .userName(userName)
                .approverName(approver.getApproverName())
                .approverEmail(approver.getApproverEmail())
                .level(approver.getLevel())
                .approvalLimit(approver.getApprovalLimit())
                .amountLimit(approver.getApprovalLimit())  // Frontend uses amountLimit
                .isUnlimited(approver.getIsUnlimited())
                .canEscalate(approver.getCanEscalate())
                .escalationTimeoutHours(approver.getEscalationTimeoutHours())
                .notifyOnPending(approver.getNotifyOnPending())
                .notifyOnApproval(approver.getNotifyOnApproval())
                .notifyOnRejection(approver.getNotifyOnRejection())
                .sbuId(sbuId)
                .sbuName(sbuName)
                .displayOrder(approver.getDisplayOrder())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportWorkflow(UUID id) {
        WorkflowDTO workflow = getWorkflowById(id);

        // Clear IDs for export (they will be regenerated on import)
        WorkflowDTO exportDto = clearIdsForExport(workflow);

        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            return mapper.writeValueAsBytes(exportDto);
        } catch (IOException e) {
            log.error("Failed to export workflow", e);
            throw new BusinessException("Failed to export workflow: " + e.getMessage());
        }
    }

    private WorkflowDTO clearIdsForExport(WorkflowDTO workflow) {
        // Create a copy without IDs so they're regenerated on import
        WorkflowDTO exportDto = WorkflowDTO.builder()
                .name(workflow.getName() + " (Imported)")
                .code(null) // Will be auto-generated
                .description(workflow.getDescription())
                .icon(workflow.getIcon())
                .displayOrder(workflow.getDisplayOrder())
                .isActive(false) // Start as inactive
                .isPublished(false) // Start as unpublished
                .requiresApproval(workflow.getRequiresApproval())
                .commentsMandatory(workflow.getCommentsMandatory())
                .commentsMandatoryOnReject(workflow.getCommentsMandatoryOnReject())
                .commentsMandatoryOnEscalate(workflow.getCommentsMandatoryOnEscalate())
                .showSummary(workflow.getShowSummary())
                .workflowCategory(workflow.getWorkflowCategory())
                .build();

        // Export forms without IDs
        if (workflow.getForms() != null) {
            List<WorkflowFormDTO> exportForms = workflow.getForms().stream()
                    .map(form -> {
                        WorkflowFormDTO exportForm = WorkflowFormDTO.builder()
                                .name(form.getName())
                                .description(form.getDescription())
                                .displayOrder(form.getDisplayOrder())
                                .build();

                        // Export fields without IDs
                        if (form.getFields() != null) {
                            List<WorkflowFieldDTO> exportFields = form.getFields().stream()
                                    .map(field -> WorkflowFieldDTO.builder()
                                            .name(field.getName())
                                            .label(field.getLabel())
                                            .fieldType(field.getFieldType())
                                            .placeholder(field.getPlaceholder())
                                            .tooltip(field.getTooltip())
                                            .defaultValue(field.getDefaultValue())
                                            .displayOrder(field.getDisplayOrder())
                                            .isMandatory(field.getIsMandatory())
                                            .isReadonly(field.getIsReadonly())
                                            .isHidden(field.getIsHidden())
                                            .isUnique(field.getIsUnique())
                                            .isTitle(field.getIsTitle())
                                            .isLimited(field.getIsLimited())
                                            .minLength(field.getMinLength())
                                            .maxLength(field.getMaxLength())
                                            .minValue(field.getMinValue())
                                            .maxValue(field.getMaxValue())
                                            .validationRegex(field.getValidationRegex())
                                            .width(field.getWidth())
                                            .options(field.getOptions())
                                            .build())
                                    .collect(Collectors.toList());
                            exportForm.setFields(exportFields);
                        }

                        // Export field groups without IDs
                        if (form.getFieldGroups() != null) {
                            List<FieldGroupDTO> exportGroups = form.getFieldGroups().stream()
                                    .map(group -> FieldGroupDTO.builder()
                                            .title(group.getTitle())
                                            .description(group.getDescription())
                                            .displayOrder(group.getDisplayOrder())
                                            .isCollapsible(group.getIsCollapsible())
                                            .isCollapsedByDefault(group.getIsCollapsedByDefault())
                                            .build())
                                    .collect(Collectors.toList());
                            exportForm.setFieldGroups(exportGroups);
                        }

                        return exportForm;
                    })
                    .collect(Collectors.toList());
            exportDto.setForms(exportForms);
        }

        // Export approvers without IDs
        if (workflow.getApprovers() != null) {
            List<WorkflowApproverDTO> exportApprovers = workflow.getApprovers().stream()
                    .map(approver -> WorkflowApproverDTO.builder()
                            .level(approver.getLevel())
                            .approverName(approver.getApproverName())
                            .approverEmail(approver.getApproverEmail())
                            .approvalLimit(approver.getApprovalLimit())
                            .isUnlimited(approver.getIsUnlimited())
                            .canEscalate(approver.getCanEscalate())
                            .escalationTimeoutHours(approver.getEscalationTimeoutHours())
                            .notifyOnPending(approver.getNotifyOnPending())
                            .notifyOnApproval(approver.getNotifyOnApproval())
                            .notifyOnRejection(approver.getNotifyOnRejection())
                            .displayOrder(approver.getDisplayOrder())
                            // Note: userId is cleared - need to be reassigned after import
                            .build())
                    .collect(Collectors.toList());
            exportDto.setApprovers(exportApprovers);
        }

        return exportDto;
    }

    @Transactional
    public WorkflowDTO importWorkflow(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("No file provided for import");
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            WorkflowDTO importDto = mapper.readValue(content, WorkflowDTO.class);

            // Ensure unique name
            String baseName = importDto.getName();
            if (baseName == null || baseName.isBlank()) {
                baseName = "Imported Workflow";
            }
            String uniqueName = baseName;
            int counter = 1;
            while (workflowRepository.existsByName(uniqueName)) {
                uniqueName = baseName + " (" + counter + ")";
                counter++;
            }
            importDto.setName(uniqueName);

            // Clear the code to auto-generate
            importDto.setCode(null);

            // Ensure it starts inactive and unpublished
            importDto.setIsActive(false);
            importDto.setIsPublished(false);

            // Clear all IDs to create new records
            importDto.setId(null);
            if (importDto.getForms() != null) {
                importDto.getForms().forEach(form -> {
                    form.setId(null);
                    if (form.getFields() != null) {
                        form.getFields().forEach(field -> field.setId(null));
                    }
                    if (form.getFieldGroups() != null) {
                        form.getFieldGroups().forEach(group -> group.setId(null));
                    }
                });
            }
            if (importDto.getApprovers() != null) {
                importDto.getApprovers().forEach(approver -> {
                    approver.setId(null);
                    // Clear user references - need to be reassigned
                    approver.setUserId(null);
                });
            }

            // Create the workflow
            return createWorkflow(importDto);

        } catch (IOException e) {
            log.error("Failed to parse import file", e);
            throw new BusinessException("Failed to parse import file: " + e.getMessage());
        }
    }
}
