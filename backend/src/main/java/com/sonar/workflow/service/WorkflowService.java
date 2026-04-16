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

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private final OrphanFieldDeleteService orphanFieldDeleteService;
    private final WorkflowRepository workflowRepository;
    private final WorkflowTypeRepository workflowTypeRepository;
    private final CategoryRepository categoryRepository;
    private final WorkflowFormRepository workflowFormRepository;
    private final WorkflowFieldRepository workflowFieldRepository;
    private final WorkflowFieldValueRepository workflowFieldValueRepository;
    private final FieldGroupRepository fieldGroupRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final ScreenRepository screenRepository;
    private final ScreenNotifierRepository screenNotifierRepository;
    private final WorkflowApproverRepository workflowApproverRepository;
    private final SBURepository sbuRepository;
    private final DepartmentRepository departmentRepository;
    private final CorporateRepository corporateRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PrivilegeRepository privilegeRepository;
    private final StampRepository stampRepository;
    private final AuditService auditService;
    private final SettingService settingService;
    private final SqlObjectService sqlObjectService;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<WorkflowDTO> getAllWorkflows() {
        User currentUser = accessScopeService.getCurrentUser();
        if (currentUser != null && !accessScopeService.isUnrestricted(currentUser)) {
            return workflowRepository.findAll().stream()
                    .filter(wf -> accessScopeService.canAccessWorkflow(wf, currentUser))
                    .map(this::toFullDTO)
                    .collect(Collectors.toList());
        }
        return workflowRepository.findAll().stream()
                .map(this::toFullDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkflowDTO> getActivePublishedWorkflows() {
        User currentUser = accessScopeService.getCurrentUser();

        return workflowRepository.findActivePublishedWorkflows().stream()
                .filter(workflow -> accessScopeService.canAccessWorkflow(workflow, currentUser))
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
            workflow.getDepartments().isEmpty() &&
            workflow.getRoles().isEmpty() &&
            workflow.getPrivileges().isEmpty()) {
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

        // Check if user matches any of the workflow's access restrictions (OR logic)
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

        // Check privileges first - if privileges are specified, they take precedence over roles
        // (user privileges come from their roles)
        if (!workflow.getPrivileges().isEmpty() && user.getRoles() != null) {
            Set<UUID> userPrivilegeIds = user.getRoles().stream()
                    .flatMap(role -> role.getPrivileges().stream())
                    .map(Privilege::getId)
                    .collect(Collectors.toSet());
            if (workflow.getPrivileges().stream()
                    .anyMatch(wfPriv -> userPrivilegeIds.contains(wfPriv.getId()))) {
                return true;
            }
            // If privileges are specified but user doesn't have any, deny access
            // (don't fall through to role check)
            return false;
        }

        // Check roles only if no privileges are specified
        if (!workflow.getRoles().isEmpty() && user.getRoles() != null) {
            if (workflow.getRoles().stream()
                    .anyMatch(wfRole -> user.getRoles().stream()
                            .anyMatch(userRole -> userRole.getId().equals(wfRole.getId())))) {
                return true;
            }
        }

        return false;
    }

    @Transactional(readOnly = true)
    public List<WorkflowDTO> getWorkflowsForUser(List<UUID> sbuIds) {
        User currentUser = accessScopeService.getCurrentUser();

        if (sbuIds == null || sbuIds.isEmpty()) {
            return getActivePublishedWorkflows();
        }
        return workflowRepository.findBySbuIds(sbuIds).stream()
                .filter(workflow -> accessScopeService.canAccessWorkflow(workflow, currentUser))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
        User currentUser = accessScopeService.getCurrentUser();
        if (!accessScopeService.canAccessWorkflow(workflow, currentUser)) {
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
                .commentsMandatory(dto.getCommentsMandatory() != null ? dto.getCommentsMandatory() :
                        settingService.getBooleanValue("workflow.comments.mandatory", false))
                .commentsMandatoryOnReject(dto.getCommentsMandatoryOnReject() != null ? dto.getCommentsMandatoryOnReject() :
                        settingService.getBooleanValue("workflow.comments.mandatory.reject", true))
                .commentsMandatoryOnEscalate(dto.getCommentsMandatoryOnEscalate() != null ? dto.getCommentsMandatoryOnEscalate() :
                        settingService.getBooleanValue("workflow.comments.mandatory.escalate", true))
                .showSummary(dto.getShowSummary() != null ? dto.getShowSummary() :
                        settingService.getBooleanValue("workflow.show.summary", true))
                .showApprovalMatrix(dto.getShowApprovalMatrix() != null ? dto.getShowApprovalMatrix() :
                        settingService.getBooleanValue("workflow.email.show.approval.matrix", true))
                .lockApproved(dto.getLockApproved() != null ? dto.getLockApproved() : false)
                .lockChildOnParentApproval(dto.getLockChildOnParentApproval() != null ? dto.getLockChildOnParentApproval() : false)
                .workflowCategory(dto.getWorkflowCategory() != null ? dto.getWorkflowCategory() : Workflow.WorkflowCategory.NON_FINANCIAL)
                .titleTemplate(dto.getTitleTemplate())
                .reminderEnabled(dto.getReminderEnabled() != null ? dto.getReminderEnabled() : false)
                .reminderFrequencyHours(dto.getReminderFrequencyHours() != null ? dto.getReminderFrequencyHours() : 24)
                .reminderMaxCount(dto.getReminderMaxCount() != null ? dto.getReminderMaxCount() : 3)
                .reminderStartAfterHours(dto.getReminderStartAfterHours() != null ? dto.getReminderStartAfterHours() : 24)
                .escalationEnabled(dto.getEscalationEnabled() != null ? dto.getEscalationEnabled() : false)
                .escalationAfterHours(dto.getEscalationAfterHours() != null ? dto.getEscalationAfterHours() : 72)
                .escalationAction(dto.getEscalationAction() != null ? dto.getEscalationAction() : Workflow.EscalationAction.NOTIFY_ADMIN)
                .reminderIncludeSubmitter(dto.getReminderIncludeSubmitter() != null ? dto.getReminderIncludeSubmitter() : false)
                .reminderEmailSubject(dto.getReminderEmailSubject())
                .reminderEmailBody(dto.getReminderEmailBody())
                .build();

        // Set isActive from DTO (defaults to true)
        workflow.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        // Set stamp if specified
        if (dto.getStampId() != null) {
            stampRepository.findById(dto.getStampId()).ifPresent(workflow::setStamp);
        }

        if (dto.getWorkflowTypeId() != null) {
            WorkflowType type = workflowTypeRepository.findById(dto.getWorkflowTypeId())
                    .orElseThrow(() -> new BusinessException("Workflow type not found"));
            workflow.setWorkflowType(type);
        } else if (dto.getWorkflowTypeCode() != null && !dto.getWorkflowTypeCode().isBlank()) {
            workflowTypeRepository.findByCode(dto.getWorkflowTypeCode().trim())
                    .ifPresent(workflow::setWorkflowType);
        }

        resolveIndustry(workflow, dto);

        if (dto.getParentWorkflowId() != null) {
            Workflow parent = workflowRepository.findById(dto.getParentWorkflowId())
                    .orElseThrow(() -> new BusinessException("Parent workflow not found"));
            workflow.setParentWorkflow(parent);

            // Inherit access from parent if setting is enabled
            if (settingService.getBooleanValue("workflow.child.inherit.access", true)) {
                copyAccessFromParent(workflow, parent);
            }
        }

        // Only set access from DTO if not inheriting from parent
        if (workflow.getParentWorkflow() == null || !settingService.getBooleanValue("workflow.child.inherit.access", true)) {
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

            if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
                Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
                workflow.setRoles(roles);
            }

            if (dto.getPrivilegeIds() != null && !dto.getPrivilegeIds().isEmpty()) {
                Set<Privilege> privileges = new HashSet<>(privilegeRepository.findAllById(dto.getPrivilegeIds()));
                workflow.setPrivileges(privileges);
            }
        }

        Workflow saved = workflowRepository.save(workflow);

        // Process forms, fields, groups from DTO
        if (dto.getForms() != null && !dto.getForms().isEmpty()) {
            saved = processFormsForWorkflow(saved, dto.getForms());
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

        // Re-fetch to ensure all relationships are fresh
        saved = workflowRepository.findById(saved.getId()).orElse(saved);

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
        workflow.setShowApprovalMatrix(dto.getShowApprovalMatrix() != null ? dto.getShowApprovalMatrix() : false);
        workflow.setLockApproved(dto.getLockApproved() != null ? dto.getLockApproved() : false);
        workflow.setLockChildOnParentApproval(dto.getLockChildOnParentApproval() != null ? dto.getLockChildOnParentApproval() : false);
        workflow.setTitleTemplate(dto.getTitleTemplate());
        if (dto.getWorkflowCategory() != null) {
            workflow.setWorkflowCategory(dto.getWorkflowCategory());
        }

        // Update reminder settings
        workflow.setReminderEnabled(dto.getReminderEnabled() != null ? dto.getReminderEnabled() : false);
        workflow.setReminderFrequencyHours(dto.getReminderFrequencyHours() != null ? dto.getReminderFrequencyHours() : 24);
        workflow.setReminderMaxCount(dto.getReminderMaxCount() != null ? dto.getReminderMaxCount() : 3);
        workflow.setReminderStartAfterHours(dto.getReminderStartAfterHours() != null ? dto.getReminderStartAfterHours() : 24);
        workflow.setEscalationEnabled(dto.getEscalationEnabled() != null ? dto.getEscalationEnabled() : false);
        workflow.setEscalationAfterHours(dto.getEscalationAfterHours() != null ? dto.getEscalationAfterHours() : 72);
        workflow.setEscalationAction(dto.getEscalationAction() != null ? dto.getEscalationAction() : Workflow.EscalationAction.NOTIFY_ADMIN);
        workflow.setReminderIncludeSubmitter(dto.getReminderIncludeSubmitter() != null ? dto.getReminderIncludeSubmitter() : false);
        workflow.setReminderEmailSubject(dto.getReminderEmailSubject());
        workflow.setReminderEmailBody(dto.getReminderEmailBody());

        // Update stamp - allow setting to null to clear
        if (dto.getStampId() != null) {
            stampRepository.findById(dto.getStampId()).ifPresent(workflow::setStamp);
        } else {
            workflow.setStamp(null);
        }

        if (dto.getWorkflowTypeId() != null) {
            WorkflowType type = workflowTypeRepository.findById(dto.getWorkflowTypeId())
                    .orElseThrow(() -> new BusinessException("Workflow type not found"));
            workflow.setWorkflowType(type);
        } else if (dto.getWorkflowTypeCode() != null && !dto.getWorkflowTypeCode().isBlank()) {
            workflowTypeRepository.findByCode(dto.getWorkflowTypeCode().trim())
                    .ifPresent(workflow::setWorkflowType);
        }

        resolveIndustry(workflow, dto);

        // Handle parent workflow
        if (dto.getParentWorkflowId() != null) {
            validateNoCircularReference(id, dto.getParentWorkflowId());
            Workflow parent = workflowRepository.findById(dto.getParentWorkflowId())
                    .orElseThrow(() -> new BusinessException("Parent workflow not found"));
            workflow.setParentWorkflow(parent);
        } else {
            workflow.setParentWorkflow(null);
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

        if (dto.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            workflow.setRoles(roles);
        }

        if (dto.getPrivilegeIds() != null) {
            Set<Privilege> privileges = new HashSet<>(privilegeRepository.findAllById(dto.getPrivilegeIds()));
            workflow.setPrivileges(privileges);
        }

        Workflow saved = workflowRepository.save(workflow);

        // Propagate access to child workflows if setting is enabled
        if (settingService.getBooleanValue("workflow.child.inherit.access", true)) {
            propagateAccessToChildren(saved);
        }

        // Process forms, fields, groups from DTO
        if (dto.getForms() != null && !dto.getForms().isEmpty()) {
            saved = processFormsForWorkflow(saved, dto.getForms());
        }

        // Process approvers from DTO (including empty list to allow deletion of all approvers)
        if (dto.getApprovers() != null) {
            processApproversForWorkflow(saved, dto.getApprovers());
        }

        // Re-fetch to ensure all relationships (including approvers) are fresh
        saved = workflowRepository.findById(saved.getId()).orElse(saved);

        auditService.log(AuditLog.AuditAction.UPDATE, "Workflow", saved.getId(),
                saved.getName(), "Workflow updated: " + saved.getName(), oldValues, toDTO(saved));

        return toFullDTO(saved);
    }

    @Transactional
    public WorkflowDTO setWorkflowActive(UUID id, boolean active) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow not found"));

        workflow.setIsActive(active);
        Workflow saved = workflowRepository.save(workflow);

        auditService.log(AuditLog.AuditAction.UPDATE, "Workflow", saved.getId(),
                saved.getName(),
                "Workflow " + (active ? "activated" : "deactivated") + ": " + saved.getName(),
                null, null);

        return toDTO(saved);
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
        field.setColumnSpan(dto.getColumnSpan());
        field.setInSummary(dto.getInSummary() != null ? dto.getInSummary() : false);
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
        field.setMultiple(dto.getMultiple() != null ? dto.getMultiple() : false);
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
        field.setTableResizable(dto.getTableResizable() != null ? dto.getTableResizable() : false);
        field.setTableSearchable(dto.getTableSearchable() != null ? dto.getTableSearchable() : false);
        field.setTableFilterable(dto.getTableFilterable() != null ? dto.getTableFilterable() : false);
        field.setTablePageable(dto.getTablePageable() != null ? dto.getTablePageable() : false);
        field.setTablePageSize(dto.getTablePageSize() != null ? dto.getTablePageSize() : 10);
        field.setAccordionAllowMultiple(dto.getAccordionAllowMultiple() != null ? dto.getAccordionAllowMultiple() : false);
        field.setAccordionDefaultOpenIndex(dto.getAccordionDefaultOpenIndex() != null ? dto.getAccordionDefaultOpenIndex() : 0);
        field.setAccordionAnimationType(dto.getAccordionAnimationType() != null ? dto.getAccordionAnimationType() : "smooth");
        field.setAccordionAnimationDuration(dto.getAccordionAnimationDuration() != null ? dto.getAccordionAnimationDuration() : 300);
        field.setCollapsibleTitle(dto.getCollapsibleTitle());
        field.setCollapsibleIcon(dto.getCollapsibleIcon());
        field.setCollapsibleDefaultExpanded(dto.getCollapsibleDefaultExpanded() != null ? dto.getCollapsibleDefaultExpanded() : false);
        // Parse parentFieldId from String to UUID
        if (dto.getParentFieldId() != null && !dto.getParentFieldId().isBlank()) {
            UUID parentId = parseUuid(dto.getParentFieldId());
            field.setParentFieldId(parentId);
        } else {
            field.setParentFieldId(null);
        }
        // API field type configurations
        field.setApiUrl(dto.getApiUrl());
        field.setApiMethod(dto.getApiMethod());
        field.setApiAuthType(dto.getApiAuthType());
        field.setApiAuthValue(dto.getApiAuthValue());
        field.setApiHeaders(dto.getApiHeaders());
        field.setApiParams(dto.getApiParams());
        field.setApiBody(dto.getApiBody());
        field.setApiResponsePath(dto.getApiResponsePath());
        field.setApiOnResponse(dto.getApiOnResponse());
        field.setApiShowInForm(dto.getApiShowInForm() != null ? dto.getApiShowInForm() : true);
        field.setApiDataSourceField(dto.getApiDataSourceField());
        field.setApiDisplayField(dto.getApiDisplayField());
        field.setApiValueField(dto.getApiValueField());
        field.setTableDataSource(dto.getTableDataSource());
        field.setSqlQuery(dto.getSqlQuery());
        field.setSqlTableColumns(dto.getSqlTableColumns());

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

        String name = workflow.getName();
        WorkflowDTO snapshot = toDTO(workflow);

        // Log the delete BEFORE actually removing rows (audit trail preserved).
        auditService.log(AuditLog.AuditAction.DELETE, "Workflow", id,
                name, "Workflow deleted: " + name, snapshot, null);

        // Cascade clean-up in FK-safe order. These all need to succeed — no try/catch
        // here since PostgreSQL aborts the whole transaction on any single error.
        // Step 1: Preserve audit history by NULLing out workflow_instance_id on any
        //         audit_logs row referencing this workflow's instances.
        entityManager.createNativeQuery(
            "UPDATE audit_logs SET workflow_instance_id = NULL " +
            "WHERE workflow_instance_id IN (SELECT id FROM workflow_instances WHERE workflow_id = ?1)")
            .setParameter(1, id).executeUpdate();

        // Step 2: Delete all dependent instance data (field values, history, attachments).
        entityManager.createNativeQuery(
            "DELETE FROM workflow_field_values WHERE workflow_instance_id IN " +
            "(SELECT id FROM workflow_instances WHERE workflow_id = ?1)")
            .setParameter(1, id).executeUpdate();
        entityManager.createNativeQuery(
            "DELETE FROM approval_history WHERE workflow_instance_id IN " +
            "(SELECT id FROM workflow_instances WHERE workflow_id = ?1)")
            .setParameter(1, id).executeUpdate();
        entityManager.createNativeQuery(
            "DELETE FROM attachments WHERE workflow_instance_id IN " +
            "(SELECT id FROM workflow_instances WHERE workflow_id = ?1)")
            .setParameter(1, id).executeUpdate();
        // Email approval tokens reference instances
        try {
            entityManager.createNativeQuery(
                "DELETE FROM email_approval_tokens WHERE workflow_instance_id IN " +
                "(SELECT id FROM workflow_instances WHERE workflow_id = ?1)")
                .setParameter(1, id).executeUpdate();
        } catch (Exception ignore) {
            // Table may not exist on all schemas; swallow silently
        }

        // Step 3: Delete the instances themselves.
        entityManager.createNativeQuery(
            "DELETE FROM workflow_instances WHERE workflow_id = ?1")
            .setParameter(1, id).executeUpdate();

        // Step 4: Safety net — any field_values that reference fields directly.
        entityManager.createNativeQuery(
            "DELETE FROM workflow_field_values WHERE field_id IN " +
            "(SELECT wf.id FROM workflow_fields wf JOIN workflow_forms wfm ON wf.form_id = wfm.id " +
            " WHERE wfm.workflow_id = ?1)")
            .setParameter(1, id).executeUpdate();

        // Step 5: NULL out parent_workflow_id on any child workflows so the delete
        //         doesn't fail with a self-referencing FK.
        entityManager.createNativeQuery(
            "UPDATE workflows SET parent_workflow_id = NULL WHERE parent_workflow_id = ?1")
            .setParameter(1, id).executeUpdate();

        entityManager.flush();

        // Step 6: Clear PC and let JPA cascade delete the definition side
        //         (workflow → forms → fields → options, approvers, etc.).
        entityManager.clear();
        workflowRepository.deleteById(id);
    }

    /**
     * Process forms, field groups, screens, and fields for a workflow from DTOs.
     * Handles both create and update scenarios with temp IDs.
     */
    private Workflow processFormsForWorkflow(Workflow workflow, List<WorkflowFormDTO> formDtos) {
        // PRE-PASS: Delete orphan fields in a SEPARATE transaction so the deletes
        // commit before any subsequent entity reads. Only refresh/clear the PC if
        // orphans were actually deleted — otherwise for CREATE scenarios the
        // workflow isn't yet committed and a clear+refetch would lose it.
        boolean anyDeleted = orphanFieldDeleteService.deleteOrphans(workflow.getId(), formDtos);
        if (anyDeleted) {
            try { entityManager.clear(); } catch (Exception ignore) {}
            Workflow fresh = workflowRepository.findById(workflow.getId()).orElse(null);
            if (fresh != null) workflow = fresh;
        }

        // Map to track temp IDs to real IDs for field groups and screens
        Map<String, UUID> groupIdMap = new HashMap<>();
        Map<String, UUID> screenIdMap = new HashMap<>();
        Map<String, UUID> fieldIdMap = new HashMap<>(); // Track field temp/original IDs to saved IDs

        // Track fields that need parentFieldId update (key: saved field ID, value: original parentFieldId string)
        Map<UUID, String> fieldsNeedingParentUpdate = new HashMap<>();

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
                    screen.setNotificationMessage(screenDto.getNotificationMessage());

                    // Handle screen role restrictions
                    if (screenDto.getRoleIds() != null) {
                        Set<Role> roles = new HashSet<>(roleRepository.findAllById(screenDto.getRoleIds()));
                        screen.setRoles(roles);
                    } else {
                        screen.setRoles(new HashSet<>());
                    }

                    // Handle screen privilege restrictions
                    if (screenDto.getPrivilegeIds() != null) {
                        Set<Privilege> privileges = new HashSet<>(privilegeRepository.findAllById(screenDto.getPrivilegeIds()));
                        screen.setPrivileges(privileges);
                    } else {
                        screen.setPrivileges(new HashSet<>());
                    }

                    Screen savedScreen = screenRepository.save(screen);
                    screenIdsToKeepByForm.get(savedForm.getId()).add(savedScreen.getId());

                    // Map temp ID to real ID
                    if (screenDto.getId() != null && screenDto.getId().startsWith("temp_")) {
                        screenIdMap.put(screenDto.getId(), savedScreen.getId());
                    }

                    // Process screen notifiers
                    processScreenNotifiers(savedScreen, screenDto.getNotifiers());
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
                    field.setColumnSpan(fieldDto.getColumnSpan());
                    field.setDefaultValue(fieldDto.getDefaultValue());
                    field.setMinValue(fieldDto.getMinValue());
                    field.setMaxValue(fieldDto.getMaxValue());
                    field.setMinLength(fieldDto.getMinLength());
                    field.setMaxLength(fieldDto.getMaxLength());
                    field.setValidationRegex(fieldDto.getValidationRegex());
                    field.setValidationMessage(fieldDto.getValidationMessage());
                    field.setCustomValidationRule(fieldDto.getCustomValidationRule());
                    field.setCustomValidationMessage(fieldDto.getCustomValidationMessage());
                    field.setInSummary(fieldDto.getInSummary() != null ? fieldDto.getInSummary() : false);
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
                    field.setMultiple(fieldDto.getMultiple() != null ? fieldDto.getMultiple() : false);
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
                    field.setTableResizable(fieldDto.getTableResizable() != null ? fieldDto.getTableResizable() : false);
                    field.setTableSearchable(fieldDto.getTableSearchable() != null ? fieldDto.getTableSearchable() : false);
                    field.setTableFilterable(fieldDto.getTableFilterable() != null ? fieldDto.getTableFilterable() : false);
                    field.setTablePageable(fieldDto.getTablePageable() != null ? fieldDto.getTablePageable() : false);
                    field.setTablePageSize(fieldDto.getTablePageSize() != null ? fieldDto.getTablePageSize() : 10);
                    field.setAccordionAllowMultiple(fieldDto.getAccordionAllowMultiple() != null ? fieldDto.getAccordionAllowMultiple() : false);
                    field.setAccordionDefaultOpenIndex(fieldDto.getAccordionDefaultOpenIndex() != null ? fieldDto.getAccordionDefaultOpenIndex() : 0);
                    field.setAccordionAnimationType(fieldDto.getAccordionAnimationType() != null ? fieldDto.getAccordionAnimationType() : "smooth");
                    field.setAccordionAnimationDuration(fieldDto.getAccordionAnimationDuration() != null ? fieldDto.getAccordionAnimationDuration() : 300);
                    field.setCollapsibleTitle(fieldDto.getCollapsibleTitle());
                    field.setCollapsibleIcon(fieldDto.getCollapsibleIcon());
                    field.setCollapsibleDefaultExpanded(fieldDto.getCollapsibleDefaultExpanded() != null ? fieldDto.getCollapsibleDefaultExpanded() : false);
                    // Don't set parentFieldId yet - save it for second pass after all fields are saved
                    field.setParentFieldId(null);
                    field.setValidation(fieldDto.getValidation());
                    field.setCustomValidationRule(fieldDto.getCustomValidationRule());
                    field.setVisibilityExpression(fieldDto.getVisibilityExpression() != null ? fieldDto.getVisibilityExpression() : "true");
                    // API field type configurations
                    field.setApiUrl(fieldDto.getApiUrl());
                    field.setApiMethod(fieldDto.getApiMethod());
                    field.setApiAuthType(fieldDto.getApiAuthType());
                    field.setApiAuthValue(fieldDto.getApiAuthValue());
                    field.setApiHeaders(fieldDto.getApiHeaders());
                    field.setApiParams(fieldDto.getApiParams());
                    field.setApiBody(fieldDto.getApiBody());
                    field.setApiResponsePath(fieldDto.getApiResponsePath());
                    field.setApiOnResponse(fieldDto.getApiOnResponse());
                    field.setApiShowInForm(fieldDto.getApiShowInForm() != null ? fieldDto.getApiShowInForm() : true);
                    field.setApiTriggerMode(fieldDto.getApiTriggerMode() != null ? fieldDto.getApiTriggerMode() : "AUTO");
                    field.setApiDataSourceField(fieldDto.getApiDataSourceField());
                    field.setApiDisplayField(fieldDto.getApiDisplayField());
                    field.setApiValueField(fieldDto.getApiValueField());
                    field.setTableDataSource(fieldDto.getTableDataSource());
                    field.setSqlQuery(fieldDto.getSqlQuery());
                    field.setSqlTableColumns(fieldDto.getSqlTableColumns());

                    WorkflowField savedField = workflowFieldRepository.save(field);
                    fieldIdsToKeepByForm.get(savedForm.getId()).add(savedField.getId());

                    // Track field ID mapping (original/temp ID -> saved ID)
                    String originalFieldId = fieldDto.getId();
                    if (originalFieldId != null && !originalFieldId.isBlank()) {
                        fieldIdMap.put(originalFieldId, savedField.getId());
                    }

                    // Track if this field needs parentFieldId update
                    String parentIdStr = fieldDto.getParentFieldId();
                    if (parentIdStr != null && !parentIdStr.isBlank()) {
                        fieldsNeedingParentUpdate.put(savedField.getId(), parentIdStr);
                    }

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

        // Second pass: Update parentFieldId for collapsible fields
        for (Map.Entry<UUID, String> entry : fieldsNeedingParentUpdate.entrySet()) {
            UUID fieldId = entry.getKey();
            String parentIdStr = entry.getValue();

            // Resolve the parent field ID (could be temp ID or real UUID)
            UUID parentFieldId = null;
            if (parentIdStr.startsWith("temp_") || parentIdStr.startsWith("field_")) {
                // It's a temp ID - look up the real ID from the map
                parentFieldId = fieldIdMap.get(parentIdStr);
            } else {
                // Try to parse as UUID directly
                parentFieldId = parseUuid(parentIdStr);
                // If not found directly, check if it's in the map (in case frontend sent a string version of existing UUID)
                if (parentFieldId == null) {
                    parentFieldId = fieldIdMap.get(parentIdStr);
                }
            }

            if (parentFieldId != null) {
                WorkflowField field = workflowFieldRepository.findById(fieldId).orElse(null);
                if (field != null) {
                    field.setParentFieldId(parentFieldId);
                    workflowFieldRepository.save(field);
                }
            }
        }

        // Clean up orphan items (fields, groups, screens) that are no longer in each form
        for (UUID formId : formIdsToKeep) {
            WorkflowForm form = workflowFormRepository.findById(formId).orElse(null);
            if (form == null) continue;

            // Orphan fields were already deleted in preDeleteOrphanFields() at the
            // start of processFormsForWorkflow(). No action needed here.

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
        return workflow;
    }

    /**
     * Process approvers for a workflow from DTOs.
     */
    private void processApproversForWorkflow(Workflow workflow, List<WorkflowApproverDTO> approverDtos) {
        // Build set of incoming IDs to determine which existing approvers to remove
        Set<UUID> incomingIds = approverDtos.stream()
                .map(dto -> parseUuid(dto.getId()))
                .filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());

        // Remove approvers no longer in the incoming list
        workflow.getApprovers().removeIf(existing -> !incomingIds.contains(existing.getId()));
        workflowRepository.saveAndFlush(workflow);

        for (WorkflowApproverDTO dto : approverDtos) {
            if (dto.getLevel() == null) {
                continue; // Skip approvers without level
            }

            WorkflowApprover approver;
            boolean isNew = false;
            UUID approverId = parseUuid(dto.getId());
            if (approverId != null) {
                approver = workflowApproverRepository.findById(approverId).orElse(null);
                if (approver == null) {
                    approver = new WorkflowApprover();
                    approver.setWorkflow(workflow);
                    isNew = true;
                }
            } else {
                approver = new WorkflowApprover();
                approver.setWorkflow(workflow);
                isNew = true;
            }

            // Resolve user ID — prefer approverId (the dropdown selection), then userId, then approverIds
            UUID userIdToUse = null;
            if (dto.getApproverId() != null && !dto.getApproverId().isEmpty()) {
                userIdToUse = parseUuid(dto.getApproverId());
            }
            if (userIdToUse == null) {
                userIdToUse = dto.getUserId();
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
            } else {
                // Fallback: use email from DTO if no user ID provided
                String email = dto.getApproverEmail() != null ? dto.getApproverEmail() : dto.getEmail();
                if (email != null && !email.isBlank()) {
                    approver.setApproverEmail(email);
                }
                if (dto.getApproverName() != null && !dto.getApproverName().isBlank()) {
                    approver.setApproverName(dto.getApproverName());
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
            } else {
                approver.setSbu(null);
            }

            WorkflowApprover saved = workflowApproverRepository.saveAndFlush(approver);

            // Ensure new approvers are added to the workflow's collection
            if (isNew) {
                workflow.getApprovers().add(saved);
            }
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
                .workflowTypeCode(workflow.getWorkflowType() != null ? workflow.getWorkflowType().getCode() : null)
                .industryId(workflow.getIndustry() != null ? workflow.getIndustry().getId() : null)
                .industryName(workflow.getIndustry() != null ? workflow.getIndustry().getName() : null)
                .industryCode(workflow.getIndustry() != null ? workflow.getIndustry().getCode() : null)
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
                .showApprovalMatrix(workflow.getShowApprovalMatrix())
                .lockApproved(workflow.getLockApproved())
                .lockChildOnParentApproval(workflow.getLockChildOnParentApproval())
                .workflowCategory(workflow.getWorkflowCategory())
                .titleTemplate(workflow.getTitleTemplate())
                .stampId(workflow.getStamp() != null ? workflow.getStamp().getId() : null)
                .stampName(workflow.getStamp() != null ? workflow.getStamp().getName() : null)
                .parentWorkflowId(workflow.getParentWorkflow() != null ? workflow.getParentWorkflow().getId() : null)
                .parentWorkflowName(workflow.getParentWorkflow() != null ? workflow.getParentWorkflow().getName() : null)
                .corporateIds(workflow.getCorporates().stream().map(Corporate::getId).collect(Collectors.toSet()))
                .sbuIds(workflow.getSbus().stream().map(SBU::getId).collect(Collectors.toSet()))
                .branchIds(workflow.getBranches().stream().map(Branch::getId).collect(Collectors.toSet()))
                .departmentIds(workflow.getDepartments().stream().map(Department::getId).collect(Collectors.toSet()))
                .roleIds(workflow.getRoles().stream().map(Role::getId).collect(Collectors.toSet()))
                .privilegeIds(workflow.getPrivileges().stream().map(Privilege::getId).collect(Collectors.toSet()))
                .createdBy(workflow.getCreatedBy())
                .reminderEnabled(workflow.getReminderEnabled())
                .reminderFrequencyHours(workflow.getReminderFrequencyHours())
                .reminderMaxCount(workflow.getReminderMaxCount())
                .reminderStartAfterHours(workflow.getReminderStartAfterHours())
                .escalationEnabled(workflow.getEscalationEnabled())
                .escalationAfterHours(workflow.getEscalationAfterHours())
                .escalationAction(workflow.getEscalationAction())
                .reminderIncludeSubmitter(workflow.getReminderIncludeSubmitter())
                .reminderEmailSubject(workflow.getReminderEmailSubject())
                .reminderEmailBody(workflow.getReminderEmailBody())
                .build();
    }

    private void resolveIndustry(Workflow workflow, WorkflowDTO dto) {
        if (dto.getIndustryId() != null) {
            Category industry = categoryRepository.findById(dto.getIndustryId())
                    .orElseThrow(() -> new BusinessException("Industry (category) not found"));
            workflow.setIndustry(industry);
        } else if (dto.getIndustryCode() != null && !dto.getIndustryCode().isBlank()) {
            categoryRepository.findByCode(dto.getIndustryCode().trim())
                    .ifPresent(workflow::setIndustry);
        }
    }

    private WorkflowDTO toFullDTO(Workflow workflow) {
        WorkflowDTO dto = toDTO(workflow);
        dto.setForms(workflow.getForms().stream().map(this::toFormDTO).collect(Collectors.toList()));
        dto.setApprovers(workflow.getApprovers().stream().map(this::toApproverDTO).collect(Collectors.toList()));
        // Load child workflows
        List<Workflow> children = workflowRepository.findChildWorkflows(workflow.getId());
        if (!children.isEmpty()) {
            dto.setChildWorkflows(children.stream().map(this::toChildWorkflowDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    private ChildWorkflowDTO toChildWorkflowDTO(Workflow workflow) {
        int screenCount = workflow.getForms() != null
                ? workflow.getForms().stream().mapToInt(f -> f.getScreens() != null ? f.getScreens().size() : 0).sum()
                : 0;
        return ChildWorkflowDTO.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .code(workflow.getCode())
                .description(workflow.getDescription())
                .icon(workflow.getIcon())
                .isPublished(workflow.getIsPublished())
                .isActive(workflow.getIsActive())
                .displayOrder(workflow.getDisplayOrder())
                .screenCount(screenCount)
                .build();
    }

    public List<ChildWorkflowDTO> getChildWorkflows(UUID workflowId) {
        return workflowRepository.findChildWorkflows(workflowId).stream()
                .map(this::toChildWorkflowDTO)
                .collect(Collectors.toList());
    }

    private void validateNoCircularReference(UUID workflowId, UUID proposedParentId) {
        if (workflowId.equals(proposedParentId)) {
            throw new BusinessException("A workflow cannot be its own parent");
        }
        // Walk the ancestor chain to detect cycles
        UUID currentId = proposedParentId;
        Set<UUID> visited = new HashSet<>();
        visited.add(workflowId);
        while (currentId != null) {
            if (!visited.add(currentId)) {
                throw new BusinessException("Circular parent-child reference detected");
            }
            Workflow current = workflowRepository.findById(currentId).orElse(null);
            if (current == null || current.getParentWorkflow() == null) {
                break;
            }
            currentId = current.getParentWorkflow().getId();
        }
    }

    /**
     * Delete orphan fields from the DB BEFORE the save loop processes incoming DTOs.
     * Uses native SQL and surgically detaches ONLY the deleted field entities and
     * their parent collection references — leaving the rest of the PC intact so
     * downstream operations (save, approvers, etc.) can still use the managed graph.
     */
    private void preDeleteOrphanFields(UUID workflowId, List<WorkflowFormDTO> formDtos) {
        // Collect field IDs being KEPT according to the incoming DTOs
        Set<UUID> incomingFieldIds = new HashSet<>();
        for (WorkflowFormDTO formDto : formDtos) {
            if (formDto.getFields() != null) {
                for (WorkflowFieldDTO f : formDto.getFields()) {
                    UUID id = parseUuid(f.getId());
                    if (id != null) incomingFieldIds.add(id);
                }
            }
        }

        // Find existing fields and their orphans
        List<WorkflowField> existingFields = workflowFieldRepository.findByWorkflowId(workflowId);
        List<WorkflowField> orphans = new ArrayList<>();
        List<String> orphanNames = new ArrayList<>();
        for (WorkflowField f : existingFields) {
            if (!incomingFieldIds.contains(f.getId())) {
                orphans.add(f);
                orphanNames.add(f.getName());
            }
        }

        if (orphans.isEmpty()) {
            log.info("No orphan fields to delete for workflow {}", workflowId);
            return;
        }

        log.info("Pre-deleting {} orphan field(s) for workflow {}: {}", orphans.size(), workflowId, orphanNames);

        Set<UUID> orphanIds = new HashSet<>();
        for (WorkflowField f : orphans) orphanIds.add(f.getId());

        // STEP 1: Delete workflow_field_values first via native SQL (no cascade from field side).
        // These are instance data, not definition data, so native SQL is safe.
        try {
            for (UUID fieldId : orphanIds) {
                entityManager.createNativeQuery("DELETE FROM workflow_field_values WHERE field_id = ?1")
                        .setParameter(1, fieldId).executeUpdate();
            }
            entityManager.flush();
        } catch (Exception e) {
            log.error("Failed to delete field values for orphans: {}", e.getMessage(), e);
            throw new BusinessException("Failed to delete field values: " + e.getMessage());
        }

        // STEP 2: Use JPA orphanRemoval cascade — remove fields from their parent
        // collections, then flush. Hibernate will issue the DELETE on the field
        // row (and cascade to field_options via the WorkflowField→FieldOption
        // relationship which also has cascade=ALL, orphanRemoval=true).
        Workflow managedWorkflow = workflowRepository.findById(workflowId).orElse(null);
        if (managedWorkflow != null && managedWorkflow.getForms() != null) {
            for (WorkflowForm form : managedWorkflow.getForms()) {
                if (form.getFields() != null) {
                    form.getFields().removeIf(f -> f.getId() != null && orphanIds.contains(f.getId()));
                }
                if (form.getFieldGroups() != null) {
                    for (FieldGroup g : form.getFieldGroups()) {
                        if (g.getFields() != null) {
                            g.getFields().removeIf(f -> f.getId() != null && orphanIds.contains(f.getId()));
                        }
                    }
                }
            }
        }

        try {
            entityManager.flush();
            log.info("Pre-deleted {} orphan field(s) via JPA orphanRemoval cascade", orphanIds.size());
        } catch (Exception e) {
            log.error("JPA orphanRemoval failed, falling back to native DELETE: {}", e.getMessage());
            // FALLBACK: native DELETE if JPA cascade fails
            try {
                for (UUID fieldId : orphanIds) {
                    entityManager.createNativeQuery("DELETE FROM field_options WHERE field_id = ?1")
                            .setParameter(1, fieldId).executeUpdate();
                    int d = entityManager.createNativeQuery("DELETE FROM workflow_fields WHERE id = ?1")
                            .setParameter(1, fieldId).executeUpdate();
                    log.info("Native-deleted orphan field {} (rows: {})", fieldId, d);
                }
                entityManager.flush();
            } catch (Exception ex) {
                log.error("Native delete fallback also failed: {}", ex.getMessage(), ex);
                throw new BusinessException("Failed to delete orphan fields: " + ex.getMessage());
            }
        }

        // CRITICAL: The `workflow` parameter passed to this service method was loaded
        // BEFORE this delete happened. Its in-memory forms.fields collection still
        // references the now-deleted field entities. If we leave this stale state in
        // the PC, a subsequent saveAndFlush(workflow) (e.g. in processApproversForWorkflow)
        // will try to merge/update those deleted fields → StaleObjectStateException.
        //
        // Fix: explicitly refresh the workflow and its forms from the DB, so their
        // collections reflect post-delete state.
        if (managedWorkflow != null) {
            try {
                entityManager.refresh(managedWorkflow);
                if (managedWorkflow.getForms() != null) {
                    for (WorkflowForm form : managedWorkflow.getForms()) {
                        try { entityManager.refresh(form); } catch (Exception ignore) {}
                    }
                }
            } catch (Exception ignore) {
                log.debug("Could not refresh workflow/forms after orphan delete (non-fatal)");
            }
        }
    }

    private void copyAccessFromParent(Workflow child, Workflow parent) {
        child.setCorporates(new HashSet<>(parent.getCorporates()));
        child.setSbus(new HashSet<>(parent.getSbus()));
        child.setBranches(new HashSet<>(parent.getBranches()));
        child.setDepartments(new HashSet<>(parent.getDepartments()));
        child.setRoles(new HashSet<>(parent.getRoles()));
        child.setPrivileges(new HashSet<>(parent.getPrivileges()));
    }

    private void propagateAccessToChildren(Workflow parent) {
        List<Workflow> children = workflowRepository.findChildWorkflows(parent.getId());
        for (Workflow child : children) {
            copyAccessFromParent(child, parent);
            workflowRepository.save(child);
            // Recursively propagate to grandchildren
            propagateAccessToChildren(child);
        }
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
                .notificationMessage(screen.getNotificationMessage())
                .roleIds(screen.getRoles().stream().map(Role::getId).collect(Collectors.toSet()))
                .privilegeIds(screen.getPrivileges().stream().map(Privilege::getId).collect(Collectors.toSet()))
                .roleNames(screen.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .privilegeNames(screen.getPrivileges().stream().map(Privilege::getName).collect(Collectors.toSet()))
                .notifiers(screen.getNotifiers() != null ? screen.getNotifiers().stream()
                        .map(this::toScreenNotifierDTO).collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private ScreenNotifierDTO toScreenNotifierDTO(ScreenNotifier notifier) {
        return ScreenNotifierDTO.builder()
                .id(notifier.getId() != null ? notifier.getId().toString() : null)
                .screenId(notifier.getScreen() != null && notifier.getScreen().getId() != null
                        ? notifier.getScreen().getId().toString() : null)
                .notifierType(notifier.getNotifierType() != null ? notifier.getNotifierType().name() : null)
                .email(notifier.getEmail())
                .userId(notifier.getUser() != null ? notifier.getUser().getId().toString() : null)
                .userName(notifier.getUser() != null ? notifier.getUser().getFullName() : null)
                .roleId(notifier.getRole() != null ? notifier.getRole().getId().toString() : null)
                .roleName(notifier.getRole() != null ? notifier.getRole().getName() : null)
                .notifierName(notifier.getNotifierName())
                .displayOrder(notifier.getDisplayOrder())
                .build();
    }

    private void processScreenNotifiers(Screen screen, List<ScreenNotifierDTO> notifierDtos) {
        if (notifierDtos == null) {
            return;
        }

        List<ScreenNotifier> currentNotifiers = screen.getNotifiers();
        if (currentNotifiers == null) {
            currentNotifiers = new ArrayList<>();
            screen.setNotifiers(currentNotifiers);
        }

        // Build map of existing notifiers by ID
        Map<UUID, ScreenNotifier> existingById = new HashMap<>();
        for (ScreenNotifier n : currentNotifiers) {
            if (n.getId() != null) {
                existingById.put(n.getId(), n);
            }
        }

        // Track which existing IDs are still wanted
        Set<UUID> keptIds = new HashSet<>();
        List<ScreenNotifier> toAdd = new ArrayList<>();

        for (ScreenNotifierDTO dto : notifierDtos) {
            UUID notifierId = parseUuid(dto.getId());
            ScreenNotifier notifier;

            if (notifierId != null && existingById.containsKey(notifierId)) {
                notifier = existingById.get(notifierId);
                keptIds.add(notifierId);
            } else {
                notifier = new ScreenNotifier();
                notifier.setScreen(screen);
                toAdd.add(notifier);
            }

            if (dto.getNotifierType() != null) {
                notifier.setNotifierType(ScreenNotifier.NotifierType.valueOf(dto.getNotifierType()));
            }

            notifier.setEmail(dto.getEmail());
            notifier.setNotifierName(dto.getNotifierName());
            notifier.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

            if (dto.getUserId() != null && !dto.getUserId().isBlank()) {
                UUID userId = parseUuid(dto.getUserId());
                if (userId != null) {
                    userRepository.findById(userId).ifPresent(notifier::setUser);
                }
            } else {
                notifier.setUser(null);
            }

            if (dto.getRoleId() != null && !dto.getRoleId().isBlank()) {
                UUID roleId = parseUuid(dto.getRoleId());
                if (roleId != null) {
                    roleRepository.findById(roleId).ifPresent(notifier::setRole);
                }
            } else {
                notifier.setRole(null);
            }
        }

        // Remove unwanted notifiers from collection (orphanRemoval deletes from DB)
        currentNotifiers.removeIf(n -> n.getId() != null && !keptIds.contains(n.getId()));

        // Add new notifiers to collection (cascade persists to DB)
        currentNotifiers.addAll(toAdd);

        screenRepository.save(screen);
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
                .columnSpan(field.getColumnSpan())
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
                .multiple(field.getMultiple())
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
                .tableResizable(field.getTableResizable())
                .tableSearchable(field.getTableSearchable())
                .tableFilterable(field.getTableFilterable())
                .tablePageable(field.getTablePageable())
                .tablePageSize(field.getTablePageSize())
                .accordionAllowMultiple(field.getAccordionAllowMultiple())
                .accordionDefaultOpenIndex(field.getAccordionDefaultOpenIndex())
                .accordionAnimationType(field.getAccordionAnimationType())
                .accordionAnimationDuration(field.getAccordionAnimationDuration())
                .collapsibleTitle(field.getCollapsibleTitle())
                .collapsibleIcon(field.getCollapsibleIcon())
                .collapsibleDefaultExpanded(field.getCollapsibleDefaultExpanded())
                .parentFieldId(field.getParentFieldId() != null ? field.getParentFieldId().toString() : null)
                .apiUrl(field.getApiUrl())
                .apiMethod(field.getApiMethod())
                .apiAuthType(field.getApiAuthType())
                .apiAuthValue(field.getApiAuthValue())
                .apiHeaders(field.getApiHeaders())
                .apiParams(field.getApiParams())
                .apiBody(field.getApiBody())
                .apiResponsePath(field.getApiResponsePath())
                .apiOnResponse(field.getApiOnResponse())
                .apiShowInForm(field.getApiShowInForm())
                .apiTriggerMode(field.getApiTriggerMode())
                .apiDataSourceField(field.getApiDataSourceField())
                .apiDisplayField(field.getApiDisplayField())
                .apiValueField(field.getApiValueField())
                .tableDataSource(field.getTableDataSource())
                .sqlQuery(field.getSqlQuery())
                .sqlTableColumns(field.getSqlTableColumns())
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
                .emailNotification(Boolean.TRUE.equals(approver.getNotifyOnPending()) || Boolean.TRUE.equals(approver.getNotifyOnApproval()) || Boolean.TRUE.equals(approver.getNotifyOnRejection()))
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
                .showApprovalMatrix(workflow.getShowApprovalMatrix())
                .lockApproved(workflow.getLockApproved())
                .lockChildOnParentApproval(workflow.getLockChildOnParentApproval())
                .workflowCategory(workflow.getWorkflowCategory())
                .titleTemplate(workflow.getTitleTemplate())
                .stampId(workflow.getStampId())
                .industryCode(workflow.getIndustryCode())
                .workflowTypeCode(workflow.getWorkflowTypeCode())
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
                                            .columnSpan(field.getColumnSpan())
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
    public WorkflowDTO cloneWorkflow(UUID id) {
        byte[] exported = exportWorkflow(id);
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            WorkflowDTO dto = mapper.readValue(exported, WorkflowDTO.class);

            // Make name unique
            String baseName = dto.getName().replace(" (Imported)", "") + " (Clone)";
            String uniqueName = baseName;
            int counter = 1;
            while (workflowRepository.existsByName(uniqueName)) {
                uniqueName = baseName + " " + counter;
                counter++;
            }
            dto.setName(uniqueName);
            dto.setCode(null);
            dto.setId(null);
            dto.setIsActive(false);
            dto.setIsPublished(false);
            if (dto.getForms() != null) {
                dto.getForms().forEach(form -> {
                    form.setId(null);
                    if (form.getFields() != null) form.getFields().forEach(f -> f.setId(null));
                    if (form.getFieldGroups() != null) form.getFieldGroups().forEach(g -> g.setId(null));
                    if (form.getScreens() != null) form.getScreens().forEach(s -> s.setId(null));
                });
            }
            if (dto.getApprovers() != null) {
                dto.getApprovers().forEach(a -> { a.setId(null); a.setUserId(null); });
            }

            return createWorkflow(dto);
        } catch (IOException e) {
            throw new BusinessException("Failed to clone workflow: " + e.getMessage());
        }
    }

    public byte[] generateWorkflowJsonTemplate() {
        try {
            // Build a comprehensive template with all possible sections
            Map<String, Object> template = new LinkedHashMap<>();
            template.put("_comment", "Sona Workflow JSON Template - Fill in your workflow definition and import");
            template.put("name", "My Workflow");
            template.put("description", "Description of the workflow");
            template.put("icon", "description");
            template.put("displayOrder", 0);
            template.put("requiresApproval", true);
            template.put("commentsMandatory", settingService.getBooleanValue("workflow.comments.mandatory", false));
            template.put("commentsMandatoryOnReject", settingService.getBooleanValue("workflow.comments.mandatory.reject", true));
            template.put("commentsMandatoryOnEscalate", settingService.getBooleanValue("workflow.comments.mandatory.escalate", true));
            template.put("showSummary", settingService.getBooleanValue("workflow.show.summary", true));
            template.put("showApprovalMatrix", settingService.getBooleanValue("workflow.email.show.approval.matrix", true));
            template.put("workflowCategory", "NON_FINANCIAL");

            // Forms
            List<Map<String, Object>> forms = new ArrayList<>();
            Map<String, Object> form = new LinkedHashMap<>();
            form.put("name", "Main Form");
            form.put("displayOrder", 0);

            // Screens
            List<Map<String, Object>> screens = new ArrayList<>();
            Map<String, Object> screen = new LinkedHashMap<>();
            screen.put("title", "Screen 1");
            screen.put("description", "First screen");
            screen.put("displayOrder", 0);
            screen.put("icon", "edit");
            screens.add(screen);
            form.put("screens", screens);

            // Field Groups
            List<Map<String, Object>> fieldGroups = new ArrayList<>();
            Map<String, Object> group = new LinkedHashMap<>();
            group.put("title", "General Information");
            group.put("description", "");
            group.put("displayOrder", 0);
            group.put("columns", 2);
            group.put("isCollapsible", false);
            group.put("isCollapsedByDefault", false);
            fieldGroups.add(group);
            form.put("fieldGroups", fieldGroups);

            // Fields - one example of each type
            List<Map<String, Object>> fields = new ArrayList<>();

            // Text field
            Map<String, Object> textField = new LinkedHashMap<>();
            textField.put("name", "fullName");
            textField.put("label", "Full Name");
            textField.put("fieldType", "TEXT");
            textField.put("placeholder", "Enter full name");
            textField.put("tooltip", "Your legal full name");
            textField.put("defaultValue", "");
            textField.put("isMandatory", true);
            textField.put("isReadonly", false);
            textField.put("isHidden", false);
            textField.put("isUnique", false);
            textField.put("isTitle", true);
            textField.put("isLimited", false);
            textField.put("inSummary", true);
            textField.put("displayOrder", 0);
            textField.put("columnSpan", 1);
            textField.put("minLength", null);
            textField.put("maxLength", null);
            textField.put("validation", "Required() AND MinLength(3)");
            textField.put("validationMessage", "Please enter a valid name");
            textField.put("customValidationRule", "TRIM() AND CAPITALIZE()");
            textField.put("visibilityExpression", "true");
            textField.put("options", List.of());
            fields.add(textField);

            // Email field
            Map<String, Object> emailField = new LinkedHashMap<>();
            emailField.put("name", "email");
            emailField.put("label", "Email Address");
            emailField.put("fieldType", "EMAIL");
            emailField.put("isMandatory", true);
            emailField.put("displayOrder", 1);
            emailField.put("validation", "Required() AND Email()");
            fields.add(emailField);

            // Number field
            Map<String, Object> numberField = new LinkedHashMap<>();
            numberField.put("name", "amount");
            numberField.put("label", "Amount");
            numberField.put("fieldType", "NUMBER");
            numberField.put("displayOrder", 2);
            numberField.put("validation", "Min(0) AND Max(999999)");
            numberField.put("customValidationRule", "ROUND(2)");
            fields.add(numberField);

            // Date field
            Map<String, Object> dateField = new LinkedHashMap<>();
            dateField.put("name", "startDate");
            dateField.put("label", "Start Date");
            dateField.put("fieldType", "DATE");
            dateField.put("displayOrder", 3);
            dateField.put("defaultValue", "TODAY()");
            dateField.put("validation", "Required()");
            fields.add(dateField);

            // Select field
            Map<String, Object> selectField = new LinkedHashMap<>();
            selectField.put("name", "category");
            selectField.put("label", "Category");
            selectField.put("fieldType", "SELECT");
            selectField.put("displayOrder", 4);
            selectField.put("options", List.of(
                Map.of("label", "Option A", "value", "A", "displayOrder", 0),
                Map.of("label", "Option B", "value", "B", "displayOrder", 1),
                Map.of("label", "Option C", "value", "C", "displayOrder", 2)
            ));
            fields.add(selectField);

            // Checkbox field
            Map<String, Object> checkField = new LinkedHashMap<>();
            checkField.put("name", "agree");
            checkField.put("label", "I agree to the terms");
            checkField.put("fieldType", "CHECKBOX");
            checkField.put("displayOrder", 5);
            checkField.put("validation", "IsTrue(\"You must agree to the terms\")");
            fields.add(checkField);

            // Textarea field
            Map<String, Object> textareaField = new LinkedHashMap<>();
            textareaField.put("name", "description");
            textareaField.put("label", "Description");
            textareaField.put("fieldType", "TEXTAREA");
            textareaField.put("displayOrder", 6);
            textareaField.put("validation", "MaxLength(500)");
            fields.add(textareaField);

            // File field
            Map<String, Object> fileField = new LinkedHashMap<>();
            fileField.put("name", "attachment");
            fileField.put("label", "Attachment");
            fileField.put("fieldType", "FILE");
            fileField.put("displayOrder", 7);
            fileField.put("isAttachment", true);
            fileField.put("allowedFileTypes", ".pdf,.doc,.docx,.xlsx");
            fileField.put("maxFileSize", 10);
            fileField.put("maxFiles", 3);
            fields.add(fileField);

            // Comment: all supported field types
            Map<String, Object> typesComment = new LinkedHashMap<>();
            typesComment.put("_fieldTypes", "TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, TIME, " +
                "CHECKBOX, CHECKBOX_GROUP, RADIO, SELECT, MULTISELECT, FILE, EMAIL, PHONE, URL, " +
                "PASSWORD, HIDDEN, LABEL, DIVIDER, COLOR, USER, TOGGLE, YES_NO, IMAGE, ICON, " +
                "RATING, SIGNATURE, RICH_TEXT, SLIDER, BARCODE, LOCATION, TABLE, SQL_OBJECT, " +
                "ACCORDION, COLLAPSIBLE");
            fields.add(typesComment);

            form.put("fields", fields);
            forms.add(form);
            template.put("forms", forms);

            // Approvers
            List<Map<String, Object>> approvers = new ArrayList<>();
            Map<String, Object> approver1 = new LinkedHashMap<>();
            approver1.put("level", 1);
            approver1.put("approverName", "Level 1 Approver");
            approver1.put("approverEmail", "approver1@company.com");
            approver1.put("canEscalate", true);
            approver1.put("notifyOnPending", true);
            approver1.put("notifyOnApproval", true);
            approver1.put("notifyOnRejection", true);
            approver1.put("displayOrder", 1);
            approvers.add(approver1);

            Map<String, Object> approver2 = new LinkedHashMap<>();
            approver2.put("level", 2);
            approver2.put("approverName", "Level 2 Approver");
            approver2.put("approverEmail", "approver2@company.com");
            approver2.put("canEscalate", true);
            approver2.put("displayOrder", 2);
            approvers.add(approver2);
            template.put("approvers", approvers);

            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            return mapper.writeValueAsBytes(template);
        } catch (IOException e) {
            throw new BusinessException("Failed to generate template: " + e.getMessage());
        }
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

    // ========== Child Parameter Methods ==========

    private final WorkflowChildParameterRepository workflowChildParameterRepository;

    /**
     * Get all child parameters for a workflow
     */
    public List<WorkflowChildParameterDTO> getChildParameters(UUID childWorkflowId) {
        List<WorkflowChildParameter> params = workflowChildParameterRepository.findByChildWorkflowId(childWorkflowId);
        return params.stream().map(this::toChildParameterDTO).collect(Collectors.toList());
    }

    /**
     * Save child parameter
     */
    @Transactional
    public WorkflowChildParameterDTO saveChildParameter(WorkflowChildParameterDTO dto) {
        WorkflowChildParameter param = new WorkflowChildParameter();

        if (dto.getId() != null) {
            param = workflowChildParameterRepository.findById(dto.getId())
                    .orElseThrow(() -> new BusinessException("Child parameter not found"));
        }

        if (dto.getChildWorkflowId() != null) {
            Workflow childWorkflow = workflowRepository.findById(dto.getChildWorkflowId())
                    .orElseThrow(() -> new BusinessException("Child workflow not found"));
            param.setChildWorkflow(childWorkflow);
        }

        param.setSourceField(dto.getSourceField());
        param.setTargetField(dto.getTargetField());
        param.setShowInSummary(dto.getShowInSummary() != null ? dto.getShowInSummary() : true);
        param.setShowInEmailSummary(dto.getShowInEmailSummary() != null ? dto.getShowInEmailSummary() : true);
        param.setDefaultValue(dto.getDefaultValue());
        param.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);

        WorkflowChildParameter saved = workflowChildParameterRepository.save(param);
        return toChildParameterDTO(saved);
    }

    /**
     * Delete child parameter
     */
    @Transactional
    public void deleteChildParameter(UUID paramId) {
        workflowChildParameterRepository.deleteById(paramId);
    }

    /**
     * Save multiple child parameters for a workflow
     */
    @Transactional
    public List<WorkflowChildParameterDTO> saveChildParameters(UUID childWorkflowId, List<WorkflowChildParameterDTO> parameters) {
        // Delete existing parameters
        workflowChildParameterRepository.deleteByChildWorkflowId(childWorkflowId);

        // Save new parameters
        List<WorkflowChildParameterDTO> savedParams = new ArrayList<>();
        Workflow childWorkflow = workflowRepository.findById(childWorkflowId)
                .orElseThrow(() -> new BusinessException("Child workflow not found"));

        int order = 0;
        for (WorkflowChildParameterDTO dto : parameters) {
            WorkflowChildParameter param = new WorkflowChildParameter();
            param.setChildWorkflow(childWorkflow);
            param.setSourceField(dto.getSourceField());
            param.setTargetField(dto.getTargetField());
            param.setShowInSummary(dto.getShowInSummary() != null ? dto.getShowInSummary() : true);
            param.setShowInEmailSummary(dto.getShowInEmailSummary() != null ? dto.getShowInEmailSummary() : true);
            param.setDefaultValue(dto.getDefaultValue());
            param.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : order++);

            WorkflowChildParameter saved = workflowChildParameterRepository.save(param);
            savedParams.add(toChildParameterDTO(saved));
        }

        return savedParams;
    }

    private WorkflowChildParameterDTO toChildParameterDTO(WorkflowChildParameter param) {
        return WorkflowChildParameterDTO.builder()
                .id(param.getId())
                .childWorkflowId(param.getChildWorkflow().getId())
                .childWorkflowName(param.getChildWorkflow().getName())
                .childWorkflowCode(param.getChildWorkflow().getCode())
                .sourceField(param.getSourceField())
                .targetField(param.getTargetField())
                .showInSummary(param.getShowInSummary())
                .showInEmailSummary(param.getShowInEmailSummary())
                .defaultValue(param.getDefaultValue())
                .displayOrder(param.getDisplayOrder())
                .build();
    }
}
