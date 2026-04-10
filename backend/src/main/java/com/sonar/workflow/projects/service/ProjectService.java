package com.sonar.workflow.projects.service;

import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.SBU;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.entity.WorkflowApprover;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.service.AccessScopeService;
import com.sonar.workflow.service.AuditService;
import com.sonar.workflow.projects.dto.*;
import com.sonar.workflow.projects.entity.*;
import com.sonar.workflow.projects.entity.Project.*;
import com.sonar.workflow.projects.entity.ProjectApprovalStep.StepStatus;
import com.sonar.workflow.projects.entity.ProjectApprovalStep.StepAction;
import com.sonar.workflow.projects.repository.*;
import com.sonar.workflow.repository.SBURepository;
import com.sonar.workflow.repository.UserRepository;
import com.sonar.workflow.repository.WorkflowApproverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.core.io.Resource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectPhaseRepository phaseRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final ProjectTeamMemberRepository teamMemberRepository;
    private final ProjectRiskRepository riskRepository;
    private final ProjectIssueRepository issueRepository;
    private final ProjectDocumentRepository documentRepository;
    private final ProjectBudgetLineRepository budgetLineRepository;
    private final ProjectBudgetAdjustmentRepository budgetAdjustmentRepository;
    private final ProjectChecklistRepository checklistRepository;
    private final ProjectStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final SBURepository sbuRepository;
    private final ProjectCategoryRepository projectCategoryRepository;
    private final ProjectActivityService activityService;
    private final ProjectDocumentStorageService documentStorageService;
    private final ProjectApprovalStepRepository approvalStepRepository;
    private final WorkflowApproverRepository workflowApproverRepository;
    private final ProjectSettingsService settingsService;
    private final RiskIssueCategoryRepository riskIssueCategoryRepository;
    private final AuditService auditService;
    private final AccessScopeService accessScopeService;

    // ==================== PROJECT CODE GENERATION ====================

    @Transactional(readOnly = true)
    public String generateProjectCode(String categoryCode) {
        String prefix = settingsService.getSettingValue("project.code.prefix", "PRJ");
        String catPart = "GEN";
        if (categoryCode != null && !categoryCode.isBlank()) {
            catPart = categoryCode.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
            if (catPart.length() > 3) catPart = catPart.substring(0, 3);
            if (catPart.isEmpty()) catPart = "GEN";
        }

        LocalDate now = LocalDate.now();
        String year = String.valueOf(now.getYear());
        String month = String.format("%02d", now.getMonthValue());

        String baseCode = prefix + "/" + catPart + "/" + year + "/" + month;
        long count = projectRepository.countByCodeStartingWith(baseCode);
        String serial = String.format("%03d", count + 1);

        return baseCode + "/" + serial;
    }

    // ==================== PROJECT CRUD ====================

    @Transactional(readOnly = true)
    public List<ProjectSummaryDTO> getAllProjects() {
        return projectRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .filter(this::canAccessProject)
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProjectSummaryDTO> searchProjects(String search, Pageable pageable) {
        User user = accessScopeService.getCurrentUser();
        if (user != null && !accessScopeService.isUnrestricted(user)) {
            // Filter in-memory for scoped users
            List<ProjectSummaryDTO> filtered = projectRepository.searchProjects(search, pageable)
                    .getContent().stream()
                    .filter(this::canAccessProject)
                    .map(this::toSummaryDTO)
                    .collect(Collectors.toList());
            return new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        }
        return projectRepository.searchProjects(search, pageable).map(this::toSummaryDTO);
    }

    @Transactional(readOnly = true)
    public List<ProjectSummaryDTO> getProjectsByStatus(String status) {
        ProjectStatus projectStatus = ProjectStatus.valueOf(status);
        return projectRepository.findByStatus(projectStatus).stream()
                .filter(this::canAccessProject)
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectSummaryDTO> getProjectsByManager(UUID managerId) {
        return projectRepository.findByManagerId(managerId).stream()
                .filter(this::canAccessProject)
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectSummaryDTO> getProjectsBySbu(UUID sbuId) {
        return projectRepository.findBySbuId(sbuId).stream()
                .filter(this::canAccessProject)
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check if the current user can access a project based on their scope.
     * Projects with no SBU are accessible to all. Projects with an SBU are
     * accessible if the user's SBUs include it, or if the user is a team member/manager.
     */
    private boolean canAccessProject(Project project) {
        User user = accessScopeService.getCurrentUser();
        if (user == null) return true;
        if (accessScopeService.isUnrestricted(user)) return true;

        // User is the manager
        if (project.getManager() != null && project.getManager().getId().equals(user.getId())) {
            return true;
        }

        // Check project SBU against user SBUs
        if (project.getSbu() != null && user.getSbus() != null && !user.getSbus().isEmpty()) {
            return user.getSbus().stream().anyMatch(us -> us.getId().equals(project.getSbu().getId()));
        }

        // Project has no SBU restriction - check if user is a team member
        if (project.getSbu() == null) {
            return true;
        }

        return false;
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        return toDTO(project);
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectByCode(String code) {
        Project project = projectRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("Project not found with code: " + code));
        return toDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(CreateProjectRequest request) {
        // Auto-generate code if empty and auto_generate is enabled
        String code = request.getCode();
        if (code == null || code.isBlank()) {
            boolean autoGenerate = "true".equalsIgnoreCase(settingsService.getSettingValue("project.code.auto_generate", "true"));
            if (autoGenerate) {
                code = generateProjectCode(request.getCategory());
            } else {
                throw new BusinessException("Project code is required");
            }
        }

        if (projectRepository.existsByCode(code)) {
            throw new BusinessException("Project with code '" + code + "' already exists");
        }

        Project project = Project.builder()
                .code(code)
                .name(request.getName())
                .description(request.getDescription())
                .status(ProjectStatus.DRAFT)
                .stage(ProjectStage.INITIATION)
                .priority(request.getPriority() != null ? ProjectPriority.valueOf(request.getPriority()) :
                        ProjectPriority.valueOf(settingsService.getSettingValue("project.default.priority", "MEDIUM")))
                .category(request.getCategory() != null && !request.getCategory().isBlank()
                        ? projectCategoryRepository.findByCode(request.getCategory()).orElse(null) : null)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .estimatedBudget(request.getEstimatedBudget() != null ? request.getEstimatedBudget() : BigDecimal.ZERO)
                .notes(request.getNotes())
                .objectives(request.getObjectives())
                .scope(request.getScope())
                .deliverables(request.getDeliverables())
                .assumptions(request.getAssumptions())
                .constraints(request.getConstraints())
                .build();

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new BusinessException("Manager not found"));
            project.setManager(manager);
        }
        if (request.getSponsorId() != null) {
            User sponsor = userRepository.findById(request.getSponsorId())
                    .orElseThrow(() -> new BusinessException("Sponsor not found"));
            project.setSponsor(sponsor);
        }
        if (request.getSbuId() != null) {
            SBU sbu = sbuRepository.findById(request.getSbuId())
                    .orElseThrow(() -> new BusinessException("SBU not found"));
            project.setSbu(sbu);
        }

        Project saved = projectRepository.save(project);
        recordStatusChange(saved, null, ProjectStatus.DRAFT, null, ProjectStage.INITIATION, "Project created");
        activityService.recordActivity(saved, "PROJECT_CREATED", "Project '" + saved.getName() + "' created", "PROJECT", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "Project", saved.getId(), saved.getName(), "Project created: " + saved.getCode(), null, toDTO(saved));
        log.info("Project created: {} ({})", saved.getName(), saved.getCode());
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO updateProject(UUID id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getPriority() != null) project.setPriority(ProjectPriority.valueOf(request.getPriority()));
        if (request.getCategory() != null) {
            ProjectCategory cat = projectCategoryRepository.findByCode(request.getCategory()).orElse(null);
            project.setCategory(cat);
        }
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());
        if (request.getActualStartDate() != null) project.setActualStartDate(request.getActualStartDate());
        if (request.getActualEndDate() != null) project.setActualEndDate(request.getActualEndDate());
        if (request.getEstimatedBudget() != null) project.setEstimatedBudget(request.getEstimatedBudget());
        if (request.getCompletionPercentage() != null) project.setCompletionPercentage(request.getCompletionPercentage());
        if (request.getNotes() != null) project.setNotes(request.getNotes());
        if (request.getObjectives() != null) project.setObjectives(request.getObjectives());
        if (request.getScope() != null) project.setScope(request.getScope());
        if (request.getDeliverables() != null) project.setDeliverables(request.getDeliverables());
        if (request.getAssumptions() != null) project.setAssumptions(request.getAssumptions());
        if (request.getConstraints() != null) project.setConstraints(request.getConstraints());

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new BusinessException("Manager not found"));
            project.setManager(manager);
        }
        if (request.getSponsorId() != null) {
            User sponsor = userRepository.findById(request.getSponsorId())
                    .orElseThrow(() -> new BusinessException("Sponsor not found"));
            project.setSponsor(sponsor);
        }
        if (request.getSbuId() != null) {
            SBU sbu = sbuRepository.findById(request.getSbuId())
                    .orElseThrow(() -> new BusinessException("SBU not found"));
            project.setSbu(sbu);
        }

        Project saved = projectRepository.save(project);
        activityService.recordActivity(saved, "PROJECT_UPDATED", "Project '" + saved.getName() + "' updated", "PROJECT", saved.getId());
        auditService.log(AuditLog.AuditAction.UPDATE, "Project", saved.getId(), saved.getName(), "Project updated: " + saved.getCode(), null, toDTO(saved));
        log.info("Project updated: {} ({})", saved.getName(), saved.getCode());
        return toDTO(saved);
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        project.setIsActive(false);
        projectRepository.save(project);
        auditService.log(AuditLog.AuditAction.DELETE, "Project", project.getId(), project.getName(), "Project deleted: " + project.getCode(), null, null);
        log.info("Project soft-deleted: {} ({})", project.getName(), project.getCode());
    }

    // ==================== STAGE & STATUS TRANSITIONS ====================

    @Transactional
    public ProjectDTO transitionStage(UUID id, ProjectStageTransitionRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectStage oldStage = project.getStage();
        ProjectStage newStage = ProjectStage.valueOf(request.getTargetStage());

        project.setStage(newStage);

        if (newStage == ProjectStage.EXECUTION && project.getActualStartDate() == null) {
            project.setActualStartDate(LocalDate.now());
        }
        if (newStage == ProjectStage.CLOSING) {
            project.setActualEndDate(LocalDate.now());
        }

        recordStatusChange(project, project.getStatus(), project.getStatus(), oldStage, newStage, request.getReason());
        Project saved = projectRepository.save(project);
        activityService.recordActivity(saved, "STAGE_TRANSITION", "Stage transitioned from " + oldStage + " to " + newStage, "PROJECT", saved.getId());
        log.info("Project {} stage transitioned from {} to {}", saved.getCode(), oldStage, newStage);
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO updateStatus(UUID id, String newStatus, String reason) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectStatus oldStatus = project.getStatus();
        ProjectStatus status = ProjectStatus.valueOf(newStatus);
        project.setStatus(status);

        if (status == ProjectStatus.ACTIVE && project.getActualStartDate() == null) {
            project.setActualStartDate(LocalDate.now());
        }
        if (status == ProjectStatus.COMPLETED) {
            project.setActualEndDate(LocalDate.now());
            project.setCompletionPercentage(100);
        }

        recordStatusChange(project, oldStatus, status, project.getStage(), project.getStage(), reason);
        Project saved = projectRepository.save(project);
        activityService.recordActivity(saved, "STATUS_CHANGE", "Status changed from " + oldStatus + " to " + status, "PROJECT", saved.getId());
        log.info("Project {} status changed from {} to {}", saved.getCode(), oldStatus, status);
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO submitForApproval(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        if (project.getStatus() != ProjectStatus.DRAFT) {
            throw new BusinessException("Only DRAFT projects can be submitted for approval");
        }

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // Check if a default approval workflow is configured
        String workflowIdStr = settingsService.getSettingValue("project.approval.default.workflow.id", "");
        if (workflowIdStr != null && !workflowIdStr.isBlank()) {
            try {
                UUID workflowId = UUID.fromString(workflowIdStr);
                List<WorkflowApprover> approvers = workflowApproverRepository.findByWorkflowId(workflowId);
                if (!approvers.isEmpty()) {
                    // Clear existing approval steps
                    project.getApprovalSteps().clear();
                    projectRepository.saveAndFlush(project);

                    // Snapshot approvers into project approval steps
                    int firstLevel = approvers.get(0).getLevel();
                    User firstApprover = null;

                    for (WorkflowApprover wa : approvers) {
                        ProjectApprovalStep step = ProjectApprovalStep.builder()
                                .project(project)
                                .approverUser(wa.getUser())
                                .approverName(wa.getApproverName() != null ? wa.getApproverName() :
                                        (wa.getUser() != null ? wa.getUser().getFullName() : "Unknown"))
                                .approverEmail(wa.getApproverEmail() != null ? wa.getApproverEmail() :
                                        (wa.getUser() != null ? wa.getUser().getEmail() : null))
                                .level(wa.getLevel())
                                .displayOrder(wa.getDisplayOrder() != null ? wa.getDisplayOrder() : 0)
                                .approvalLimit(wa.getApprovalLimit())
                                .isUnlimited(wa.getIsUnlimited() != null ? wa.getIsUnlimited() : true)
                                .status(wa.getLevel() == firstLevel ? StepStatus.CURRENT : StepStatus.PENDING)
                                .build();
                        project.getApprovalSteps().add(step);

                        if (wa.getLevel() == firstLevel && firstApprover == null && wa.getUser() != null) {
                            firstApprover = wa.getUser();
                        }
                    }

                    project.setCurrentApprovalLevel(firstLevel);
                    project.setCurrentApprover(firstApprover);
                    project.setSubmittedForApprovalAt(LocalDateTime.now());
                    project.setSubmittedBy(currentUsername);
                    log.info("Project {} approval steps created from workflow {}", project.getCode(), workflowId);
                }
            } catch (IllegalArgumentException e) {
                log.warn("Invalid workflow ID in settings: {}", workflowIdStr);
            }
        }

        return updateStatus(id, "PENDING_APPROVAL", "Submitted for approval");
    }

    @Transactional
    public ProjectDTO processProjectApproval(UUID id, ProjectApprovalRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));

        if (project.getStatus() != ProjectStatus.PENDING_APPROVAL) {
            throw new BusinessException("Project is not pending approval");
        }

        // If no approval steps exist, fall back to simple approve/reject
        if (project.getApprovalSteps() == null || project.getApprovalSteps().isEmpty()) {
            String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
            if ("APPROVED".equalsIgnoreCase(request.getAction())) {
                project.setApprovedBy(currentUser);
                project.setApprovedAt(LocalDateTime.now());
                projectRepository.save(project);
                return updateStatus(id, "APPROVED", "Project approved by " + currentUser);
            } else {
                return updateStatus(id, "DRAFT", "Rejected: " + (request.getComments() != null ? request.getComments() : ""));
            }
        }

        // Find the current step
        ProjectApprovalStep currentStep = approvalStepRepository
                .findByProjectIdAndStatus(id, StepStatus.CURRENT)
                .orElseThrow(() -> new BusinessException("No current approval step found"));

        // Validate current user is the assigned approver or admin
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isAssignedApprover = currentStep.getApproverUser() != null &&
                currentStep.getApproverUser().getUsername().equals(currentUsername);

        if (!isAssignedApprover && !isAdmin) {
            throw new BusinessException("You are not authorized to approve this step");
        }

        if ("APPROVED".equalsIgnoreCase(request.getAction())) {
            // Mark current step as approved
            currentStep.setStatus(StepStatus.APPROVED);
            currentStep.setAction(StepAction.APPROVED);
            currentStep.setComments(request.getComments());
            currentStep.setActionDate(LocalDateTime.now());
            approvalStepRepository.save(currentStep);

            // Check if there are other CURRENT steps at the same level (parallel approvers)
            List<ProjectApprovalStep> sameLevelPending = approvalStepRepository
                    .findByProjectIdAndLevelAndStatus(id, currentStep.getLevel(), StepStatus.CURRENT);

            if (!sameLevelPending.isEmpty()) {
                // Still waiting for other approvers at this level
                log.info("Project {} level {} still has {} pending approvers", project.getCode(), currentStep.getLevel(), sameLevelPending.size());
                return toDTO(project);
            }

            // All approvers at this level done - check next level
            Integer maxLevel = approvalStepRepository.findMaxLevelByProjectId(id);
            if (maxLevel != null && currentStep.getLevel() < maxLevel) {
                // Move to next level
                int nextLevel = currentStep.getLevel() + 1;
                // Find next level that actually has steps
                List<ProjectApprovalStep> allSteps = approvalStepRepository.findByProjectIdOrderByLevelAscDisplayOrderAsc(id);
                Integer actualNextLevel = null;
                for (ProjectApprovalStep s : allSteps) {
                    if (s.getLevel() > currentStep.getLevel() && s.getStatus() == StepStatus.PENDING) {
                        actualNextLevel = s.getLevel();
                        break;
                    }
                }

                if (actualNextLevel != null) {
                    User nextApprover = null;
                    for (ProjectApprovalStep s : allSteps) {
                        if (s.getLevel().equals(actualNextLevel) && s.getStatus() == StepStatus.PENDING) {
                            s.setStatus(StepStatus.CURRENT);
                            approvalStepRepository.save(s);
                            if (nextApprover == null && s.getApproverUser() != null) {
                                nextApprover = s.getApproverUser();
                            }
                        }
                    }
                    project.setCurrentApprovalLevel(actualNextLevel);
                    project.setCurrentApprover(nextApprover);
                    projectRepository.save(project);
                    activityService.recordActivity(project, "APPROVAL_LEVEL_ADVANCED",
                            "Approval advanced to level " + actualNextLevel, "PROJECT", project.getId());
                    log.info("Project {} advanced to approval level {}", project.getCode(), actualNextLevel);
                    return toDTO(project);
                }
            }

            // No more levels - project is fully approved
            project.setApprovedBy(currentUsername);
            project.setApprovedAt(LocalDateTime.now());
            project.setCurrentApprover(null);
            project.setCurrentApprovalLevel(null);
            projectRepository.save(project);
            activityService.recordActivity(project, "PROJECT_APPROVED", "Project fully approved", "PROJECT", project.getId());
            return updateStatus(id, "APPROVED", "Project approved (all levels)");

        } else if ("REJECTED".equalsIgnoreCase(request.getAction())) {
            // Mark current step as rejected
            currentStep.setStatus(StepStatus.REJECTED);
            currentStep.setAction(StepAction.REJECTED);
            currentStep.setComments(request.getComments());
            currentStep.setActionDate(LocalDateTime.now());
            approvalStepRepository.save(currentStep);

            // Mark remaining PENDING/CURRENT steps as SKIPPED
            List<ProjectApprovalStep> allSteps = approvalStepRepository.findByProjectIdOrderByLevelAscDisplayOrderAsc(id);
            for (ProjectApprovalStep s : allSteps) {
                if (s.getStatus() == StepStatus.PENDING || s.getStatus() == StepStatus.CURRENT) {
                    s.setStatus(StepStatus.SKIPPED);
                    approvalStepRepository.save(s);
                }
            }

            project.setCurrentApprover(null);
            project.setCurrentApprovalLevel(null);
            projectRepository.save(project);
            activityService.recordActivity(project, "PROJECT_REJECTED",
                    "Project rejected by " + currentUsername + (request.getComments() != null ? ": " + request.getComments() : ""),
                    "PROJECT", project.getId());
            return updateStatus(id, "DRAFT", "Rejected by " + currentUsername + (request.getComments() != null ? ": " + request.getComments() : ""));

        } else {
            throw new BusinessException("Invalid action. Use APPROVED or REJECTED");
        }
    }

    @Transactional
    public ProjectDTO approveProject(UUID id, String approvedBy) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        if (project.getStatus() != ProjectStatus.PENDING_APPROVAL) {
            throw new BusinessException("Only PENDING_APPROVAL projects can be approved");
        }

        // If approval steps exist, use processProjectApproval instead
        if (project.getApprovalSteps() != null && !project.getApprovalSteps().isEmpty()) {
            ProjectApprovalRequest req = new ProjectApprovalRequest("APPROVED", "Approved via quick action");
            return processProjectApproval(id, req);
        }

        project.setApprovedBy(approvedBy);
        project.setApprovedAt(LocalDateTime.now());
        projectRepository.save(project);
        return updateStatus(id, "APPROVED", "Project approved by " + approvedBy);
    }

    @Transactional
    public ProjectDTO rejectProject(UUID id, String reason) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project not found"));
        if (project.getStatus() != ProjectStatus.PENDING_APPROVAL) {
            throw new BusinessException("Only PENDING_APPROVAL projects can be rejected");
        }

        // If approval steps exist, use processProjectApproval instead
        if (project.getApprovalSteps() != null && !project.getApprovalSteps().isEmpty()) {
            ProjectApprovalRequest req = new ProjectApprovalRequest("REJECTED", reason);
            return processProjectApproval(id, req);
        }

        return updateStatus(id, "DRAFT", "Rejected: " + reason);
    }

    @Transactional(readOnly = true)
    public List<ProjectApprovalStepDTO> getApprovalSteps(UUID projectId) {
        return approvalStepRepository.findByProjectIdOrderByLevelAscDisplayOrderAsc(projectId).stream()
                .map(this::toApprovalStepDTO)
                .collect(Collectors.toList());
    }

    // ==================== TEAM MEMBERS ====================

    @Transactional(readOnly = true)
    public List<ProjectTeamMemberDTO> getTeamMembers(UUID projectId) {
        return teamMemberRepository.findByProjectId(projectId).stream()
                .map(this::toTeamMemberDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectTeamMemberDTO addTeamMember(UUID projectId, ProjectTeamMemberDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        if (teamMemberRepository.existsByProjectIdAndUserId(projectId, dto.getUserId())) {
            throw new BusinessException("User is already a team member");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new BusinessException("User not found"));

        ProjectTeamMember member = ProjectTeamMember.builder()
                .project(project)
                .user(user)
                .role(dto.getRole() != null ? ProjectTeamMember.TeamRole.valueOf(dto.getRole()) : ProjectTeamMember.TeamRole.MEMBER)
                .joinDate(dto.getJoinDate() != null ? dto.getJoinDate() : LocalDate.now())
                .allocationPercentage(dto.getAllocationPercentage() != null ? dto.getAllocationPercentage() : 100)
                .responsibilities(dto.getResponsibilities())
                .build();

        ProjectTeamMember saved = teamMemberRepository.save(member);
        activityService.recordActivity(project, "TEAM_MEMBER_ADDED", "Team member '" + user.getFullName() + "' added", "TEAM_MEMBER", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "ProjectTeamMember", saved.getId(), user.getFullName(), "Team member added to project " + project.getCode(), null, toTeamMemberDTO(saved));
        log.info("Team member {} added to project {}", user.getFullName(), project.getCode());
        return toTeamMemberDTO(saved);
    }

    @Transactional
    public ProjectTeamMemberDTO updateTeamMember(UUID projectId, UUID memberId, ProjectTeamMemberDTO dto) {
        ProjectTeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("Team member not found"));

        if (dto.getRole() != null) member.setRole(ProjectTeamMember.TeamRole.valueOf(dto.getRole()));
        if (dto.getAllocationPercentage() != null) member.setAllocationPercentage(dto.getAllocationPercentage());
        if (dto.getResponsibilities() != null) member.setResponsibilities(dto.getResponsibilities());
        if (dto.getLeaveDate() != null) member.setLeaveDate(dto.getLeaveDate());

        ProjectTeamMember saved = teamMemberRepository.save(member);
        return toTeamMemberDTO(saved);
    }

    @Transactional
    public void removeTeamMember(UUID projectId, UUID memberId) {
        ProjectTeamMember member = teamMemberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("Team member not found"));
        auditService.log(AuditLog.AuditAction.DELETE, "ProjectTeamMember", member.getId(), member.getUser().getFullName(), "Team member removed from project", null, null);
        teamMemberRepository.delete(member);
        log.info("Team member removed from project {}", projectId);
    }

    // ==================== PHASES ====================

    @Transactional(readOnly = true)
    public List<ProjectPhaseDTO> getPhases(UUID projectId) {
        return phaseRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toPhaseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectPhaseDTO createPhase(UUID projectId, ProjectPhaseDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectPhase phase = ProjectPhase.builder()
                .project(project)
                .name(dto.getName())
                .description(dto.getDescription())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        ProjectPhase saved = phaseRepository.save(phase);
        return toPhaseDTO(saved);
    }

    @Transactional
    public ProjectPhaseDTO updatePhase(UUID projectId, UUID phaseId, ProjectPhaseDTO dto) {
        ProjectPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new BusinessException("Phase not found"));

        if (dto.getName() != null) phase.setName(dto.getName());
        if (dto.getDescription() != null) phase.setDescription(dto.getDescription());
        if (dto.getStartDate() != null) phase.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) phase.setEndDate(dto.getEndDate());
        if (dto.getStatus() != null) phase.setStatus(ProjectPhase.PhaseStatus.valueOf(dto.getStatus()));
        if (dto.getSortOrder() != null) phase.setSortOrder(dto.getSortOrder());
        if (dto.getCompletionPercentage() != null) phase.setCompletionPercentage(dto.getCompletionPercentage());

        ProjectPhase saved = phaseRepository.save(phase);
        return toPhaseDTO(saved);
    }

    @Transactional
    public void deletePhase(UUID projectId, UUID phaseId) {
        ProjectPhase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new BusinessException("Phase not found"));
        phaseRepository.delete(phase);
    }

    // ==================== MILESTONES ====================

    @Transactional(readOnly = true)
    public List<ProjectMilestoneDTO> getMilestones(UUID projectId) {
        return milestoneRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toMilestoneDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMilestoneDTO createMilestone(UUID projectId, ProjectMilestoneDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectMilestone milestone = ProjectMilestone.builder()
                .project(project)
                .name(dto.getName())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .isCritical(dto.getIsCritical() != null ? dto.getIsCritical() : false)
                .build();

        if (dto.getOwnerId() != null) {
            User owner = userRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new BusinessException("Owner not found"));
            milestone.setOwner(owner);
        }

        ProjectMilestone saved = milestoneRepository.save(milestone);
        activityService.recordActivity(project, "MILESTONE_CREATED", "Milestone '" + saved.getName() + "' created", "MILESTONE", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "ProjectMilestone", saved.getId(), saved.getName(), "Milestone created", null, toMilestoneDTO(saved));
        return toMilestoneDTO(saved);
    }

    @Transactional
    public ProjectMilestoneDTO updateMilestone(UUID projectId, UUID milestoneId, ProjectMilestoneDTO dto) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BusinessException("Milestone not found"));

        if (dto.getName() != null) milestone.setName(dto.getName());
        if (dto.getDescription() != null) milestone.setDescription(dto.getDescription());
        if (dto.getDueDate() != null) milestone.setDueDate(dto.getDueDate());
        if (dto.getStatus() != null) milestone.setStatus(ProjectMilestone.MilestoneStatus.valueOf(dto.getStatus()));
        if (dto.getSortOrder() != null) milestone.setSortOrder(dto.getSortOrder());
        if (dto.getIsCritical() != null) milestone.setIsCritical(dto.getIsCritical());
        if (dto.getOwnerId() != null) {
            User owner = userRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new BusinessException("Owner not found"));
            milestone.setOwner(owner);
        }
        if (dto.getCompletedDate() != null) {
            milestone.setCompletedDate(dto.getCompletedDate());
            if (milestone.getStatus() != ProjectMilestone.MilestoneStatus.COMPLETED) {
                milestone.setStatus(ProjectMilestone.MilestoneStatus.COMPLETED);
            }
        }

        ProjectMilestone saved = milestoneRepository.save(milestone);
        auditService.log(AuditLog.AuditAction.UPDATE, "ProjectMilestone", saved.getId(), saved.getName(), "Milestone updated", null, toMilestoneDTO(saved));
        return toMilestoneDTO(saved);
    }

    @Transactional
    public void deleteMilestone(UUID projectId, UUID milestoneId) {
        ProjectMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new BusinessException("Milestone not found"));
        auditService.log(AuditLog.AuditAction.DELETE, "ProjectMilestone", milestoneId, milestone.getName(), "Milestone deleted", null, null);
        milestoneRepository.delete(milestone);
    }

    // ==================== RISKS ====================

    @Transactional(readOnly = true)
    public List<ProjectRiskDTO> getRisks(UUID projectId) {
        return riskRepository.findByProjectId(projectId).stream()
                .map(this::toRiskDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectRiskDTO createRisk(UUID projectId, ProjectRiskDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectRisk risk = ProjectRisk.builder()
                .project(project)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .probability(dto.getProbability() != null ? ProjectRisk.RiskProbability.valueOf(dto.getProbability()) : ProjectRisk.RiskProbability.MEDIUM)
                .impact(dto.getImpact() != null ? ProjectRisk.RiskImpact.valueOf(dto.getImpact()) : ProjectRisk.RiskImpact.MEDIUM)
                .mitigationPlan(dto.getMitigationPlan())
                .contingencyPlan(dto.getContingencyPlan())
                .identifiedDate(dto.getIdentifiedDate() != null ? dto.getIdentifiedDate() : LocalDate.now())
                .riskCategory(dto.getRiskCategory())
                .build();

        if (dto.getOwnerId() != null) {
            User owner = userRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new BusinessException("Risk owner not found"));
            risk.setOwner(owner);
        }
        if (dto.getCategoryId() != null) {
            risk.setCategory(riskIssueCategoryRepository.findById(dto.getCategoryId()).orElse(null));
        }

        ProjectRisk saved = riskRepository.save(risk);
        activityService.recordActivity(project, "RISK_CREATED", "Risk '" + saved.getTitle() + "' identified", "RISK", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "ProjectRisk", saved.getId(), saved.getTitle(), "Risk created", null, toRiskDTO(saved));
        return toRiskDTO(saved);
    }

    @Transactional
    public ProjectRiskDTO updateRisk(UUID projectId, UUID riskId, ProjectRiskDTO dto) {
        ProjectRisk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new BusinessException("Risk not found"));

        if (dto.getTitle() != null) risk.setTitle(dto.getTitle());
        if (dto.getDescription() != null) risk.setDescription(dto.getDescription());
        if (dto.getProbability() != null) risk.setProbability(ProjectRisk.RiskProbability.valueOf(dto.getProbability()));
        if (dto.getImpact() != null) risk.setImpact(ProjectRisk.RiskImpact.valueOf(dto.getImpact()));
        if (dto.getStatus() != null) risk.setStatus(ProjectRisk.RiskStatus.valueOf(dto.getStatus()));
        if (dto.getMitigationPlan() != null) risk.setMitigationPlan(dto.getMitigationPlan());
        if (dto.getContingencyPlan() != null) risk.setContingencyPlan(dto.getContingencyPlan());
        if (dto.getResponseDate() != null) risk.setResponseDate(dto.getResponseDate());
        if (dto.getRiskCategory() != null) risk.setRiskCategory(dto.getRiskCategory());
        if (dto.getOwnerId() != null) {
            User owner = userRepository.findById(dto.getOwnerId())
                    .orElseThrow(() -> new BusinessException("Risk owner not found"));
            risk.setOwner(owner);
        }
        if (dto.getCategoryId() != null) {
            risk.setCategory(riskIssueCategoryRepository.findById(dto.getCategoryId()).orElse(null));
        }

        ProjectRisk saved = riskRepository.save(risk);
        auditService.log(AuditLog.AuditAction.UPDATE, "ProjectRisk", saved.getId(), saved.getTitle(), "Risk updated", null, toRiskDTO(saved));
        return toRiskDTO(saved);
    }

    @Transactional
    public void deleteRisk(UUID projectId, UUID riskId) {
        auditService.log(AuditLog.AuditAction.DELETE, "ProjectRisk", riskId, null, "Risk deleted", null, null);
        riskRepository.deleteById(riskId);
    }

    // ==================== ISSUES ====================

    @Transactional(readOnly = true)
    public List<ProjectIssueDTO> getIssues(UUID projectId) {
        return issueRepository.findByProjectId(projectId).stream()
                .map(this::toIssueDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectIssueDTO createIssue(UUID projectId, ProjectIssueDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectIssue issue = ProjectIssue.builder()
                .project(project)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .priority(dto.getPriority() != null ? ProjectIssue.IssuePriority.valueOf(dto.getPriority()) : ProjectIssue.IssuePriority.MEDIUM)
                .reportedDate(dto.getReportedDate() != null ? dto.getReportedDate() : LocalDate.now())
                .dueDate(dto.getDueDate())
                .impactDescription(dto.getImpactDescription())
                .build();

        // Handle category - prefer categoryId (RiskIssueCategory), fall back to enum string
        if (dto.getCategoryId() != null) {
            issue.setRiCategory(riskIssueCategoryRepository.findById(dto.getCategoryId()).orElse(null));
        } else if (dto.getCategory() != null && !dto.getCategory().isEmpty()) {
            try {
                issue.setCategory(ProjectIssue.IssueCategory.valueOf(dto.getCategory()));
            } catch (IllegalArgumentException ignored) {
                // Not a valid enum value; skip
            }
        }

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new BusinessException("Assignee not found"));
            issue.setAssignee(assignee);
        }
        if (dto.getReportedById() != null) {
            User reporter = userRepository.findById(dto.getReportedById())
                    .orElseThrow(() -> new BusinessException("Reporter not found"));
            issue.setReportedBy(reporter);
        }

        ProjectIssue saved = issueRepository.save(issue);
        activityService.recordActivity(project, "ISSUE_CREATED", "Issue '" + saved.getTitle() + "' reported", "ISSUE", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "ProjectIssue", saved.getId(), saved.getTitle(), "Issue created", null, toIssueDTO(saved));
        return toIssueDTO(saved);
    }

    @Transactional
    public ProjectIssueDTO updateIssue(UUID projectId, UUID issueId, ProjectIssueDTO dto) {
        ProjectIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new BusinessException("Issue not found"));

        if (dto.getTitle() != null) issue.setTitle(dto.getTitle());
        if (dto.getDescription() != null) issue.setDescription(dto.getDescription());
        if (dto.getPriority() != null) issue.setPriority(ProjectIssue.IssuePriority.valueOf(dto.getPriority()));
        if (dto.getStatus() != null) issue.setStatus(ProjectIssue.IssueStatus.valueOf(dto.getStatus()));
        if (dto.getCategoryId() != null) {
            issue.setRiCategory(riskIssueCategoryRepository.findById(dto.getCategoryId()).orElse(null));
        } else if (dto.getCategory() != null) {
            try {
                issue.setCategory(ProjectIssue.IssueCategory.valueOf(dto.getCategory()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (dto.getDueDate() != null) issue.setDueDate(dto.getDueDate());
        if (dto.getResolution() != null) issue.setResolution(dto.getResolution());
        if (dto.getImpactDescription() != null) issue.setImpactDescription(dto.getImpactDescription());
        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new BusinessException("Assignee not found"));
            issue.setAssignee(assignee);
        }
        if (dto.getStatus() != null && dto.getStatus().equals("RESOLVED") && issue.getResolvedDate() == null) {
            issue.setResolvedDate(LocalDate.now());
        }

        ProjectIssue saved = issueRepository.save(issue);
        auditService.log(AuditLog.AuditAction.UPDATE, "ProjectIssue", saved.getId(), saved.getTitle(), "Issue updated", null, toIssueDTO(saved));
        return toIssueDTO(saved);
    }

    @Transactional
    public void deleteIssue(UUID projectId, UUID issueId) {
        auditService.log(AuditLog.AuditAction.DELETE, "ProjectIssue", issueId, null, "Issue deleted", null, null);
        issueRepository.deleteById(issueId);
    }

    // ==================== BUDGET ====================

    @Transactional(readOnly = true)
    public List<ProjectBudgetLineDTO> getBudgetLines(UUID projectId) {
        return budgetLineRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toBudgetLineDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectBudgetLineDTO createBudgetLine(UUID projectId, ProjectBudgetLineDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        BigDecimal estimated = dto.getEstimatedAmount() != null ? dto.getEstimatedAmount() : BigDecimal.ZERO;
        BigDecimal actual = dto.getActualAmount() != null ? dto.getActualAmount() : BigDecimal.ZERO;
        BigDecimal committed = dto.getCommittedAmount() != null ? dto.getCommittedAmount() : BigDecimal.ZERO;
        BigDecimal forecast = dto.getForecastAmount() != null ? dto.getForecastAmount() : estimated;

        ProjectBudgetLine line = ProjectBudgetLine.builder()
                .project(project)
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory() != null ? ProjectBudgetLine.BudgetCategory.valueOf(dto.getCategory()) : ProjectBudgetLine.BudgetCategory.OTHER)
                .estimatedAmount(estimated)
                .actualAmount(actual)
                .committedAmount(committed)
                .originalEstimate(estimated)
                .approvedAmount(estimated)
                .forecastAmount(forecast)
                .notes(dto.getNotes())
                .budgetDate(dto.getBudgetDate())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        ProjectBudgetLine saved = budgetLineRepository.save(line);

        // Create INITIAL adjustment record
        String currentUser = getCurrentUsername();
        ProjectBudgetAdjustment initialAdj = ProjectBudgetAdjustment.builder()
                .budgetLine(saved)
                .adjustmentType(ProjectBudgetAdjustment.AdjustmentType.INITIAL)
                .previousEstimated(BigDecimal.ZERO)
                .newEstimated(estimated)
                .previousActual(BigDecimal.ZERO)
                .newActual(actual)
                .adjustmentAmount(estimated)
                .notes("Initial budget line creation")
                .adjustedBy(currentUser)
                .adjustedAt(LocalDateTime.now())
                .build();
        budgetAdjustmentRepository.save(initialAdj);

        updateProjectBudgetTotals(projectId);
        activityService.recordActivity(project, "BUDGET_LINE_CREATED", "Budget line '" + saved.getName() + "' added", "BUDGET_LINE", saved.getId());
        return toBudgetLineDTO(saved);
    }

    @Transactional
    public ProjectBudgetLineDTO updateBudgetLine(UUID projectId, UUID lineId, ProjectBudgetLineDTO dto) {
        ProjectBudgetLine line = budgetLineRepository.findById(lineId)
                .orElseThrow(() -> new BusinessException("Budget line not found"));

        // Snapshot old values before changes
        BigDecimal oldEstimated = line.getEstimatedAmount();
        BigDecimal oldActual = line.getActualAmount();

        if (dto.getName() != null) line.setName(dto.getName());
        if (dto.getDescription() != null) line.setDescription(dto.getDescription());
        if (dto.getCategory() != null) line.setCategory(ProjectBudgetLine.BudgetCategory.valueOf(dto.getCategory()));
        if (dto.getEstimatedAmount() != null) line.setEstimatedAmount(dto.getEstimatedAmount());
        if (dto.getActualAmount() != null) line.setActualAmount(dto.getActualAmount());
        if (dto.getCommittedAmount() != null) line.setCommittedAmount(dto.getCommittedAmount());
        if (dto.getApprovedAmount() != null) line.setApprovedAmount(dto.getApprovedAmount());
        if (dto.getForecastAmount() != null) line.setForecastAmount(dto.getForecastAmount());
        if (dto.getNotes() != null) line.setNotes(dto.getNotes());
        if (dto.getBudgetDate() != null) line.setBudgetDate(dto.getBudgetDate());
        if (dto.getSortOrder() != null) line.setSortOrder(dto.getSortOrder());

        // Determine if amounts changed and create adjustment record
        BigDecimal newEstimated = line.getEstimatedAmount();
        BigDecimal newActual = line.getActualAmount();
        boolean estimatedChanged = newEstimated.compareTo(oldEstimated) != 0;
        boolean actualChanged = newActual.compareTo(oldActual) != 0;

        if (estimatedChanged || actualChanged) {
            BigDecimal delta = newEstimated.subtract(oldEstimated);
            ProjectBudgetAdjustment.AdjustmentType type;
            if (delta.compareTo(BigDecimal.ZERO) > 0) {
                type = ProjectBudgetAdjustment.AdjustmentType.INCREASE;
            } else if (delta.compareTo(BigDecimal.ZERO) < 0) {
                type = ProjectBudgetAdjustment.AdjustmentType.DECREASE;
            } else {
                type = ProjectBudgetAdjustment.AdjustmentType.CORRECTION;
            }

            String adjustmentNotes = dto.getAdjustmentNotes() != null && !dto.getAdjustmentNotes().isBlank()
                    ? dto.getAdjustmentNotes() : "Budget line updated";

            String currentUser = getCurrentUsername();
            ProjectBudgetAdjustment adj = ProjectBudgetAdjustment.builder()
                    .budgetLine(line)
                    .adjustmentType(type)
                    .previousEstimated(oldEstimated)
                    .newEstimated(newEstimated)
                    .previousActual(oldActual)
                    .newActual(newActual)
                    .adjustmentAmount(delta)
                    .notes(adjustmentNotes)
                    .adjustedBy(currentUser)
                    .adjustedAt(LocalDateTime.now())
                    .build();
            budgetAdjustmentRepository.save(adj);
        }

        ProjectBudgetLine saved = budgetLineRepository.save(line);
        updateProjectBudgetTotals(projectId);
        return toBudgetLineDTO(saved);
    }

    @Transactional
    public void deleteBudgetLine(UUID projectId, UUID lineId) {
        budgetLineRepository.deleteById(lineId);
        updateProjectBudgetTotals(projectId);
    }

    @Transactional(readOnly = true)
    public List<ProjectBudgetAdjustmentDTO> getBudgetAdjustments(UUID budgetLineId) {
        return budgetAdjustmentRepository.findByBudgetLineIdOrderByAdjustedAtDesc(budgetLineId).stream()
                .map(this::toAdjustmentDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectBudgetAdjustmentDTO> getProjectBudgetAdjustments(UUID projectId) {
        return budgetAdjustmentRepository.findByBudgetLineProjectIdOrderByAdjustedAtDesc(projectId).stream()
                .map(this::toAdjustmentDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectBudgetAdjustmentDTO addBudgetAdjustment(UUID projectId, UUID lineId, ProjectBudgetAdjustmentDTO dto) {
        ProjectBudgetLine line = budgetLineRepository.findById(lineId)
                .orElseThrow(() -> new BusinessException("Budget line not found"));

        String currentUser = getCurrentUsername();
        ProjectBudgetAdjustment adj = ProjectBudgetAdjustment.builder()
                .budgetLine(line)
                .adjustmentType(dto.getAdjustmentType() != null
                        ? ProjectBudgetAdjustment.AdjustmentType.valueOf(dto.getAdjustmentType())
                        : ProjectBudgetAdjustment.AdjustmentType.CORRECTION)
                .previousEstimated(dto.getPreviousEstimated() != null ? dto.getPreviousEstimated() : line.getEstimatedAmount())
                .newEstimated(dto.getNewEstimated() != null ? dto.getNewEstimated() : line.getEstimatedAmount())
                .previousActual(dto.getPreviousActual() != null ? dto.getPreviousActual() : line.getActualAmount())
                .newActual(dto.getNewActual() != null ? dto.getNewActual() : line.getActualAmount())
                .adjustmentAmount(dto.getAdjustmentAmount() != null ? dto.getAdjustmentAmount() : BigDecimal.ZERO)
                .notes(dto.getNotes() != null ? dto.getNotes() : "Manual adjustment")
                .adjustedBy(currentUser)
                .adjustedAt(LocalDateTime.now())
                .build();

        // Apply the adjustment to the budget line if new values provided
        if (dto.getNewEstimated() != null) line.setEstimatedAmount(dto.getNewEstimated());
        if (dto.getNewActual() != null) line.setActualAmount(dto.getNewActual());
        budgetLineRepository.save(line);

        ProjectBudgetAdjustment saved = budgetAdjustmentRepository.save(adj);
        updateProjectBudgetTotals(projectId);
        return toAdjustmentDTO(saved);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    // ==================== DOCUMENTS ====================

    @Transactional(readOnly = true)
    public List<ProjectDocumentDTO> getDocuments(UUID projectId) {
        return documentRepository.findByProjectId(projectId).stream()
                .map(this::toDocumentDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDocumentDTO addDocument(UUID projectId, ProjectDocumentDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectDocument doc = ProjectDocument.builder()
                .project(project)
                .name(dto.getName())
                .fileName(dto.getFileName())
                .filePath(dto.getFilePath())
                .fileSize(dto.getFileSize())
                .contentType(dto.getContentType())
                .category(dto.getCategory() != null ? ProjectDocument.DocumentCategory.valueOf(dto.getCategory()) : ProjectDocument.DocumentCategory.GENERAL)
                .description(dto.getDescription())
                .build();

        if (dto.getUploadedById() != null) {
            User uploader = userRepository.findById(dto.getUploadedById())
                    .orElseThrow(() -> new BusinessException("User not found"));
            doc.setUploadedBy(uploader);
        }

        ProjectDocument saved = documentRepository.save(doc);
        activityService.recordActivity(project, "DOCUMENT_ADDED", "Document '" + saved.getName() + "' added", "DOCUMENT", saved.getId());
        return toDocumentDTO(saved);
    }

    @Transactional
    public void deleteDocument(UUID projectId, UUID documentId) {
        ProjectDocument doc = documentRepository.findById(documentId).orElse(null);
        if (doc != null && doc.getFilePath() != null) {
            documentStorageService.deleteFile(doc.getFilePath());
        }
        documentRepository.deleteById(documentId);
    }

    @Transactional
    public ProjectDocumentDTO uploadDocument(UUID projectId, org.springframework.web.multipart.MultipartFile file, String name, String category, String description) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectDocumentStorageService.StorageResult storageResult = documentStorageService.storeFile(file, project.getCode());

        User uploader = null;
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            uploader = userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            log.debug("Could not resolve uploader: {}", e.getMessage());
        }

        ProjectDocument doc = ProjectDocument.builder()
                .project(project)
                .name(name != null && !name.isBlank() ? name : file.getOriginalFilename())
                .fileName(file.getOriginalFilename())
                .filePath(storageResult.filePath())
                .storedFilename(storageResult.storedFilename())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .category(category != null ? ProjectDocument.DocumentCategory.valueOf(category) : ProjectDocument.DocumentCategory.GENERAL)
                .description(description)
                .isEncrypted(storageResult.isEncrypted())
                .encryptionIv(storageResult.encryptionIv())
                .uploadedBy(uploader)
                .build();

        ProjectDocument saved = documentRepository.save(doc);
        activityService.recordActivity(project, "DOCUMENT_ADDED", "Document '" + saved.getName() + "' uploaded", "DOCUMENT", saved.getId());
        return toDocumentDTO(saved);
    }

    @Transactional(readOnly = true)
    public ProjectDocumentDTO getDocumentById(UUID documentId) {
        ProjectDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException("Document not found"));
        return toDocumentDTO(doc);
    }

    public Resource downloadDocument(UUID documentId) {
        ProjectDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException("Document not found"));

        if (doc.getFilePath() == null) {
            throw new BusinessException("No file associated with this document");
        }

        return documentStorageService.loadFile(doc.getFilePath(), doc.getIsEncrypted() != null && doc.getIsEncrypted());
    }

    // ==================== STATUS HISTORY ====================

    @Transactional(readOnly = true)
    public List<ProjectStatusHistoryDTO> getStatusHistory(UUID projectId) {
        return statusHistoryRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toStatusHistoryDTO)
                .collect(Collectors.toList());
    }

    // ==================== DASHBOARD ====================

    @Transactional(readOnly = true)
    public ProjectDashboardDTO getDashboard() {
        long totalProjects = projectRepository.countByIsActiveTrue();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long overdueProjects = projectRepository.findOverdueProjects().size();

        Map<String, Long> projectsByStatus = new HashMap<>();
        for (ProjectStatus status : ProjectStatus.values()) {
            projectsByStatus.put(status.name(), projectRepository.countByStatus(status));
        }

        Map<String, Long> projectsByPriority = new HashMap<>();
        Map<String, Long> projectsByStage = new HashMap<>();

        List<Project> allActive = projectRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        for (Project p : allActive) {
            projectsByPriority.merge(p.getPriority().name(), 1L, Long::sum);
            projectsByStage.merge(p.getStage().name(), 1L, Long::sum);
        }

        BigDecimal totalBudget = allActive.stream()
                .map(Project::getEstimatedBudget)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalActualCost = allActive.stream()
                .map(Project::getActualCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double averageCompletion = allActive.stream()
                .mapToInt(p -> p.getCompletionPercentage() != null ? p.getCompletionPercentage() : 0)
                .average()
                .orElse(0.0);

        List<ProjectSummaryDTO> recentProjects = allActive.stream()
                .limit(10)
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());

        return ProjectDashboardDTO.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .overdueProjects(overdueProjects)
                .totalBudget(totalBudget)
                .totalActualCost(totalActualCost)
                .averageCompletion(averageCompletion)
                .projectsByStatus(projectsByStatus)
                .projectsByPriority(projectsByPriority)
                .projectsByStage(projectsByStage)
                .recentProjects(recentProjects)
                .recentActivities(activityService.getRecentActivities(20))
                .build();
    }

    // ==================== HELPER METHODS ====================

    private void recordStatusChange(Project project, ProjectStatus fromStatus, ProjectStatus toStatus,
                                     ProjectStage fromStage, ProjectStage toStage, String reason) {
        ProjectStatusHistory history = ProjectStatusHistory.builder()
                .project(project)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .fromStage(fromStage)
                .toStage(toStage)
                .reason(reason)
                .build();
        statusHistoryRepository.save(history);
    }

    private void updateProjectBudgetTotals(UUID projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            BigDecimal totalEstimated = budgetLineRepository.sumEstimatedByProjectId(projectId);
            BigDecimal totalActual = budgetLineRepository.sumActualByProjectId(projectId);
            project.setEstimatedBudget(totalEstimated);
            project.setActualCost(totalActual);
            projectRepository.save(project);
        }
    }

    private ProjectDTO toDTO(Project p) {
        long taskCount = taskRepository.countByProjectIdAndIsActiveTrue(p.getId());
        long completedTaskCount = taskRepository.countByProjectIdAndStatus(p.getId(), ProjectTask.TaskStatus.DONE);
        long teamMemberCount = teamMemberRepository.countByProjectId(p.getId());

        // Compute isCurrentUserApprover
        Boolean isCurrentUserApprover = false;
        try {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            if (p.getCurrentApprover() != null && p.getCurrentApprover().getUsername().equals(currentUsername)) {
                isCurrentUserApprover = true;
            }
            // Also check if user is any CURRENT step approver
            if (!isCurrentUserApprover && p.getApprovalSteps() != null) {
                isCurrentUserApprover = p.getApprovalSteps().stream()
                        .filter(s -> s.getStatus() == StepStatus.CURRENT)
                        .anyMatch(s -> s.getApproverUser() != null && s.getApproverUser().getUsername().equals(currentUsername));
            }
        } catch (Exception e) {
            // No security context available
        }

        List<ProjectApprovalStepDTO> approvalStepDTOs = null;
        if (p.getApprovalSteps() != null && !p.getApprovalSteps().isEmpty()) {
            approvalStepDTOs = p.getApprovalSteps().stream()
                    .map(this::toApprovalStepDTO)
                    .collect(Collectors.toList());
        }

        return ProjectDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .stage(p.getStage() != null ? p.getStage().name() : null)
                .priority(p.getPriority() != null ? p.getPriority().name() : null)
                .category(p.getCategory() != null ? p.getCategory().getName() : null)
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryCode(p.getCategory() != null ? p.getCategory().getCode() : null)
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .actualStartDate(p.getActualStartDate())
                .actualEndDate(p.getActualEndDate())
                .estimatedBudget(p.getEstimatedBudget())
                .actualCost(p.getActualCost())
                .completionPercentage(p.getCompletionPercentage())
                .managerId(p.getManager() != null ? p.getManager().getId() : null)
                .managerName(p.getManager() != null ? p.getManager().getFullName() : null)
                .sponsorId(p.getSponsor() != null ? p.getSponsor().getId() : null)
                .sponsorName(p.getSponsor() != null ? p.getSponsor().getFullName() : null)
                .sbuId(p.getSbu() != null ? p.getSbu().getId() : null)
                .sbuName(p.getSbu() != null ? p.getSbu().getName() : null)
                .approvedBy(p.getApprovedBy())
                .approvedAt(p.getApprovedAt())
                .currentApprovalLevel(p.getCurrentApprovalLevel())
                .currentApproverId(p.getCurrentApprover() != null ? p.getCurrentApprover().getId() : null)
                .currentApproverName(p.getCurrentApprover() != null ? p.getCurrentApprover().getFullName() : null)
                .submittedForApprovalAt(p.getSubmittedForApprovalAt())
                .submittedBy(p.getSubmittedBy())
                .isCurrentUserApprover(isCurrentUserApprover)
                .approvalSteps(approvalStepDTOs)
                .notes(p.getNotes())
                .objectives(p.getObjectives())
                .scope(p.getScope())
                .deliverables(p.getDeliverables())
                .assumptions(p.getAssumptions())
                .constraints(p.getConstraints())
                .taskCount((int) taskCount)
                .completedTaskCount((int) completedTaskCount)
                .teamMemberCount((int) teamMemberCount)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .createdBy(p.getCreatedBy())
                .isActive(p.getIsActive())
                .build();
    }

    private ProjectSummaryDTO toSummaryDTO(Project p) {
        long taskCount = taskRepository.countByProjectIdAndIsActiveTrue(p.getId());
        long completedTaskCount = taskRepository.countByProjectIdAndStatus(p.getId(), ProjectTask.TaskStatus.DONE);

        return ProjectSummaryDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .stage(p.getStage() != null ? p.getStage().name() : null)
                .priority(p.getPriority() != null ? p.getPriority().name() : null)
                .managerName(p.getManager() != null ? p.getManager().getFullName() : null)
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .completionPercentage(p.getCompletionPercentage())
                .taskCount((int) taskCount)
                .completedTaskCount((int) completedTaskCount)
                .estimatedBudget(p.getEstimatedBudget())
                .actualCost(p.getActualCost())
                .build();
    }

    private ProjectTeamMemberDTO toTeamMemberDTO(ProjectTeamMember m) {
        return ProjectTeamMemberDTO.builder()
                .id(m.getId())
                .projectId(m.getProject().getId())
                .userId(m.getUser().getId())
                .userName(m.getUser().getFullName())
                .userEmail(m.getUser().getEmail())
                .role(m.getRole() != null ? m.getRole().name() : null)
                .joinDate(m.getJoinDate())
                .leaveDate(m.getLeaveDate())
                .allocationPercentage(m.getAllocationPercentage())
                .responsibilities(m.getResponsibilities())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private ProjectPhaseDTO toPhaseDTO(ProjectPhase p) {
        int taskCount = taskRepository.findByProjectIdAndPhaseId(p.getProject().getId(), p.getId()).size();
        return ProjectPhaseDTO.builder()
                .id(p.getId())
                .projectId(p.getProject().getId())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .sortOrder(p.getSortOrder())
                .completionPercentage(p.getCompletionPercentage())
                .taskCount(taskCount)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private ProjectMilestoneDTO toMilestoneDTO(ProjectMilestone m) {
        return ProjectMilestoneDTO.builder()
                .id(m.getId())
                .projectId(m.getProject().getId())
                .name(m.getName())
                .description(m.getDescription())
                .status(m.getStatus() != null ? m.getStatus().name() : null)
                .dueDate(m.getDueDate())
                .completedDate(m.getCompletedDate())
                .ownerId(m.getOwner() != null ? m.getOwner().getId() : null)
                .ownerName(m.getOwner() != null ? m.getOwner().getFullName() : null)
                .sortOrder(m.getSortOrder())
                .isCritical(m.getIsCritical())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private ProjectRiskDTO toRiskDTO(ProjectRisk r) {
        return ProjectRiskDTO.builder()
                .id(r.getId())
                .projectId(r.getProject().getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .probability(r.getProbability() != null ? r.getProbability().name() : null)
                .impact(r.getImpact() != null ? r.getImpact().name() : null)
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .mitigationPlan(r.getMitigationPlan())
                .contingencyPlan(r.getContingencyPlan())
                .ownerId(r.getOwner() != null ? r.getOwner().getId() : null)
                .ownerName(r.getOwner() != null ? r.getOwner().getFullName() : null)
                .identifiedDate(r.getIdentifiedDate())
                .responseDate(r.getResponseDate())
                .riskCategory(r.getRiskCategory())
                .categoryId(r.getCategory() != null ? r.getCategory().getId() : null)
                .categoryName(r.getCategory() != null ? r.getCategory().getName() : r.getRiskCategory())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private ProjectIssueDTO toIssueDTO(ProjectIssue i) {
        return ProjectIssueDTO.builder()
                .id(i.getId())
                .projectId(i.getProject().getId())
                .title(i.getTitle())
                .description(i.getDescription())
                .priority(i.getPriority() != null ? i.getPriority().name() : null)
                .status(i.getStatus() != null ? i.getStatus().name() : null)
                .category(i.getRiCategory() != null ? i.getRiCategory().getName() :
                        (i.getCategory() != null ? i.getCategory().name() : null))
                .categoryId(i.getRiCategory() != null ? i.getRiCategory().getId() : null)
                .categoryName(i.getRiCategory() != null ? i.getRiCategory().getName() :
                        (i.getCategory() != null ? i.getCategory().name() : null))
                .assigneeId(i.getAssignee() != null ? i.getAssignee().getId() : null)
                .assigneeName(i.getAssignee() != null ? i.getAssignee().getFullName() : null)
                .reportedById(i.getReportedBy() != null ? i.getReportedBy().getId() : null)
                .reportedByName(i.getReportedBy() != null ? i.getReportedBy().getFullName() : null)
                .reportedDate(i.getReportedDate())
                .dueDate(i.getDueDate())
                .resolvedDate(i.getResolvedDate())
                .resolution(i.getResolution())
                .impactDescription(i.getImpactDescription())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private ProjectBudgetLineDTO toBudgetLineDTO(ProjectBudgetLine b) {
        BigDecimal variance = b.getEstimatedAmount().subtract(b.getActualAmount());
        BigDecimal variancePercentage = BigDecimal.ZERO;
        if (b.getEstimatedAmount().compareTo(BigDecimal.ZERO) != 0) {
            variancePercentage = variance.multiply(new BigDecimal("100"))
                    .divide(b.getEstimatedAmount(), 2, RoundingMode.HALF_UP);
        }

        long adjCount = budgetAdjustmentRepository.countByBudgetLineId(b.getId());

        List<ProjectBudgetAdjustmentDTO> adjustmentDTOs = null;
        if (b.getAdjustments() != null && !b.getAdjustments().isEmpty()) {
            adjustmentDTOs = b.getAdjustments().stream()
                    .map(this::toAdjustmentDTO)
                    .collect(Collectors.toList());
        }

        return ProjectBudgetLineDTO.builder()
                .id(b.getId())
                .projectId(b.getProject().getId())
                .name(b.getName())
                .description(b.getDescription())
                .category(b.getCategory() != null ? b.getCategory().name() : null)
                .estimatedAmount(b.getEstimatedAmount())
                .actualAmount(b.getActualAmount())
                .committedAmount(b.getCommittedAmount())
                .variance(variance)
                .originalEstimate(b.getOriginalEstimate())
                .approvedAmount(b.getApprovedAmount())
                .forecastAmount(b.getForecastAmount())
                .notes(b.getNotes())
                .variancePercentage(variancePercentage)
                .adjustmentCount((int) adjCount)
                .adjustments(adjustmentDTOs)
                .budgetDate(b.getBudgetDate())
                .sortOrder(b.getSortOrder())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private ProjectBudgetAdjustmentDTO toAdjustmentDTO(ProjectBudgetAdjustment a) {
        return ProjectBudgetAdjustmentDTO.builder()
                .id(a.getId())
                .budgetLineId(a.getBudgetLine().getId())
                .adjustmentType(a.getAdjustmentType() != null ? a.getAdjustmentType().name() : null)
                .previousEstimated(a.getPreviousEstimated())
                .newEstimated(a.getNewEstimated())
                .previousActual(a.getPreviousActual())
                .newActual(a.getNewActual())
                .adjustmentAmount(a.getAdjustmentAmount())
                .notes(a.getNotes())
                .adjustedBy(a.getAdjustedBy())
                .adjustedAt(a.getAdjustedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private ProjectDocumentDTO toDocumentDTO(ProjectDocument d) {
        return ProjectDocumentDTO.builder()
                .id(d.getId())
                .projectId(d.getProject().getId())
                .name(d.getName())
                .fileName(d.getFileName())
                .filePath(d.getFilePath())
                .fileSize(d.getFileSize())
                .contentType(d.getContentType())
                .category(d.getCategory() != null ? d.getCategory().name() : null)
                .description(d.getDescription())
                .uploadedById(d.getUploadedBy() != null ? d.getUploadedBy().getId() : null)
                .uploadedByName(d.getUploadedBy() != null ? d.getUploadedBy().getFullName() : null)
                .documentVersion(d.getDocumentVersion())
                .createdAt(d.getCreatedAt())
                .build();
    }

    private ProjectStatusHistoryDTO toStatusHistoryDTO(ProjectStatusHistory h) {
        return ProjectStatusHistoryDTO.builder()
                .id(h.getId())
                .projectId(h.getProject().getId())
                .fromStatus(h.getFromStatus() != null ? h.getFromStatus().name() : null)
                .toStatus(h.getToStatus() != null ? h.getToStatus().name() : null)
                .fromStage(h.getFromStage() != null ? h.getFromStage().name() : null)
                .toStage(h.getToStage() != null ? h.getToStage().name() : null)
                .reason(h.getReason())
                .changedBy(h.getChangedBy())
                .createdAt(h.getCreatedAt())
                .build();
    }

    private ProjectApprovalStepDTO toApprovalStepDTO(ProjectApprovalStep s) {
        return ProjectApprovalStepDTO.builder()
                .id(s.getId())
                .projectId(s.getProject().getId())
                .approverUserId(s.getApproverUser() != null ? s.getApproverUser().getId() : null)
                .approverName(s.getApproverName())
                .approverEmail(s.getApproverEmail())
                .level(s.getLevel())
                .displayOrder(s.getDisplayOrder())
                .approvalLimit(s.getApprovalLimit())
                .isUnlimited(s.getIsUnlimited())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .action(s.getAction() != null ? s.getAction().name() : null)
                .comments(s.getComments())
                .actionDate(s.getActionDate())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
