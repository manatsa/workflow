package com.sonar.workflow.projects.service;

import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.service.AuditService;
import com.sonar.workflow.projects.dto.*;
import com.sonar.workflow.projects.entity.*;
import com.sonar.workflow.projects.repository.*;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectTaskService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectPhaseRepository phaseRepository;
    private final ProjectMilestoneRepository milestoneRepository;
    private final ProjectTaskChecklistRepository taskChecklistRepository;
    private final ProjectTaskCommentRepository taskCommentRepository;
    private final ProjectTimeLogRepository timeLogRepository;
    private final UserRepository userRepository;
    private final ProjectActivityService activityService;
    private final AuditService auditService;
    private final ProjectSettingsService settingsService;

    // ==================== TASK CRUD ====================

    @Transactional(readOnly = true)
    public List<ProjectTaskDTO> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDTO> getActiveTasksByProject(UUID projectId) {
        return taskRepository.findByProjectIdAndIsActiveTrue(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectTaskDTO getTaskById(UUID taskId) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));
        return toDTO(task);
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDTO> getTasksByAssignee(UUID assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDTO> getTasksByStatus(UUID projectId, String status) {
        ProjectTask.TaskStatus taskStatus = ProjectTask.TaskStatus.valueOf(status);
        return taskRepository.findByProjectIdAndStatus(projectId, taskStatus).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectTaskDTO> getSubTasks(UUID parentTaskId) {
        return taskRepository.findByParentTaskId(parentTaskId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectTaskDTO createTask(UUID projectId, ProjectTaskDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        ProjectTask task = ProjectTask.builder()
                .project(project)
                .name(dto.getName())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? ProjectTask.TaskStatus.valueOf(dto.getStatus()) : ProjectTask.TaskStatus.TODO)
                .priority(dto.getPriority() != null ? ProjectTask.TaskPriority.valueOf(dto.getPriority()) : ProjectTask.TaskPriority.MEDIUM)
                .startDate(dto.getStartDate())
                .dueDate(dto.getDueDate())
                .estimatedHours(dto.getEstimatedHours() != null ? dto.getEstimatedHours() :
                        new BigDecimal(settingsService.getSettingValue("project.task.default_hours", "8")))
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .isCriticalPath(dto.getIsCriticalPath() != null ? dto.getIsCriticalPath() : false)
                .tags(dto.getTags())
                .build();

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new BusinessException("Assignee not found"));
            task.setAssignee(assignee);
        }
        if (dto.getPhaseId() != null) {
            ProjectPhase phase = phaseRepository.findById(dto.getPhaseId())
                    .orElseThrow(() -> new BusinessException("Phase not found"));
            task.setPhase(phase);
        }
        if (dto.getMilestoneId() != null) {
            ProjectMilestone milestone = milestoneRepository.findById(dto.getMilestoneId())
                    .orElseThrow(() -> new BusinessException("Milestone not found"));
            task.setMilestone(milestone);
        }
        if (dto.getParentTaskId() != null) {
            ProjectTask parent = taskRepository.findById(dto.getParentTaskId())
                    .orElseThrow(() -> new BusinessException("Parent task not found"));
            task.setParentTask(parent);
        }
        if (dto.getDependencyTaskIds() != null) {
            task.setDependencyTaskIds(dto.getDependencyTaskIds());
        }

        ProjectTask saved = taskRepository.save(task);
        updateProjectCompletion(projectId);
        activityService.recordActivity(project, "TASK_CREATED", "Task '" + saved.getName() + "' created", "TASK", saved.getId());
        auditService.log(AuditLog.AuditAction.CREATE, "ProjectTask", saved.getId(), saved.getName(), "Task created", null, toDTO(saved));
        log.info("Task '{}' created in project {}", saved.getName(), project.getCode());
        return toDTO(saved);
    }

    @Transactional
    public ProjectTaskDTO updateTask(UUID projectId, UUID taskId, ProjectTaskDTO dto) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        if (dto.getName() != null) task.setName(dto.getName());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            ProjectTask.TaskStatus newStatus = ProjectTask.TaskStatus.valueOf(dto.getStatus());
            if (newStatus == ProjectTask.TaskStatus.IN_PROGRESS && task.getActualStartDate() == null) {
                task.setActualStartDate(LocalDate.now());
            }
            if (newStatus == ProjectTask.TaskStatus.DONE) {
                task.setActualEndDate(LocalDate.now());
                task.setCompletionPercentage(100);
                activityService.recordActivity(task.getProject(), "TASK_COMPLETED", "Task '" + task.getName() + "' completed", "TASK", task.getId());
            }
            task.setStatus(newStatus);
        }
        if (dto.getPriority() != null) task.setPriority(ProjectTask.TaskPriority.valueOf(dto.getPriority()));
        if (dto.getStartDate() != null) task.setStartDate(dto.getStartDate());
        if (dto.getDueDate() != null) task.setDueDate(dto.getDueDate());
        if (dto.getActualStartDate() != null) task.setActualStartDate(dto.getActualStartDate());
        if (dto.getActualEndDate() != null) task.setActualEndDate(dto.getActualEndDate());
        if (dto.getEstimatedHours() != null) task.setEstimatedHours(dto.getEstimatedHours());
        if (dto.getCompletionPercentage() != null) task.setCompletionPercentage(dto.getCompletionPercentage());
        if (dto.getSortOrder() != null) task.setSortOrder(dto.getSortOrder());
        if (dto.getIsCriticalPath() != null) task.setIsCriticalPath(dto.getIsCriticalPath());
        if (dto.getTags() != null) task.setTags(dto.getTags());

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new BusinessException("Assignee not found"));
            task.setAssignee(assignee);
        }
        if (dto.getPhaseId() != null) {
            ProjectPhase phase = phaseRepository.findById(dto.getPhaseId())
                    .orElseThrow(() -> new BusinessException("Phase not found"));
            task.setPhase(phase);
        }
        if (dto.getMilestoneId() != null) {
            ProjectMilestone milestone = milestoneRepository.findById(dto.getMilestoneId())
                    .orElseThrow(() -> new BusinessException("Milestone not found"));
            task.setMilestone(milestone);
        }
        if (dto.getDependencyTaskIds() != null) {
            task.setDependencyTaskIds(dto.getDependencyTaskIds());
        }

        ProjectTask saved = taskRepository.save(task);
        updateProjectCompletion(projectId);
        auditService.log(AuditLog.AuditAction.UPDATE, "ProjectTask", saved.getId(), saved.getName(), "Task updated", null, toDTO(saved));
        return toDTO(saved);
    }

    @Transactional
    public void deleteTask(UUID projectId, UUID taskId) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));
        auditService.log(AuditLog.AuditAction.DELETE, "ProjectTask", taskId, task.getName(), "Task deleted", null, null);
        task.setIsActive(false);
        taskRepository.save(task);
        updateProjectCompletion(projectId);
    }

    // ==================== TASK CHECKLISTS ====================

    @Transactional(readOnly = true)
    public List<ProjectTaskChecklistDTO> getTaskChecklists(UUID taskId) {
        return taskChecklistRepository.findByTaskIdOrderBySortOrder(taskId).stream()
                .map(this::toTaskChecklistDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectTaskChecklistDTO addTaskChecklistItem(UUID taskId, ProjectTaskChecklistDTO dto) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        ProjectTaskChecklist item = ProjectTaskChecklist.builder()
                .task(task)
                .name(dto.getName())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        ProjectTaskChecklist saved = taskChecklistRepository.save(item);
        return toTaskChecklistDTO(saved);
    }

    @Transactional
    public ProjectTaskChecklistDTO toggleTaskChecklistItem(UUID itemId, UUID completedById) {
        ProjectTaskChecklist item = taskChecklistRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException("Checklist item not found"));

        item.setIsCompleted(!item.getIsCompleted());
        if (item.getIsCompleted()) {
            item.setCompletedAt(LocalDateTime.now());
            if (completedById != null) {
                User user = userRepository.findById(completedById).orElse(null);
                item.setCompletedBy(user);
            }
        } else {
            item.setCompletedAt(null);
            item.setCompletedBy(null);
        }

        ProjectTaskChecklist saved = taskChecklistRepository.save(item);
        return toTaskChecklistDTO(saved);
    }

    @Transactional
    public void deleteTaskChecklistItem(UUID itemId) {
        taskChecklistRepository.deleteById(itemId);
    }

    // ==================== TASK COMMENTS ====================

    @Transactional(readOnly = true)
    public List<ProjectTaskCommentDTO> getTaskComments(UUID taskId) {
        return taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::toCommentDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectTaskCommentDTO addComment(UUID taskId, ProjectTaskCommentDTO dto) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        ProjectTaskComment comment = ProjectTaskComment.builder()
                .task(task)
                .content(dto.getContent())
                .build();

        if (dto.getAuthorId() != null) {
            User author = userRepository.findById(dto.getAuthorId())
                    .orElseThrow(() -> new BusinessException("Author not found"));
            comment.setAuthor(author);
        }
        if (dto.getParentCommentId() != null) {
            ProjectTaskComment parent = taskCommentRepository.findById(dto.getParentCommentId())
                    .orElseThrow(() -> new BusinessException("Parent comment not found"));
            comment.setParentComment(parent);
        }

        ProjectTaskComment saved = taskCommentRepository.save(comment);
        return toCommentDTO(saved);
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        taskCommentRepository.deleteById(commentId);
    }

    // ==================== TIME LOGS ====================

    @Transactional(readOnly = true)
    public List<ProjectTimeLogDTO> getTimeLogs(UUID taskId) {
        return timeLogRepository.findByTaskId(taskId).stream()
                .map(this::toTimeLogDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectTimeLogDTO> getTimeLogsByUser(UUID userId) {
        return timeLogRepository.findByUserId(userId).stream()
                .map(this::toTimeLogDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectTimeLogDTO logTime(UUID taskId, ProjectTimeLogDTO dto) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new BusinessException("User not found"));

        ProjectTimeLog timeLog = ProjectTimeLog.builder()
                .task(task)
                .user(user)
                .logDate(dto.getLogDate() != null ? dto.getLogDate() : LocalDate.now())
                .hours(dto.getHours())
                .description(dto.getDescription())
                .isBillable(dto.getIsBillable() != null ? dto.getIsBillable() : true)
                .build();

        ProjectTimeLog saved = timeLogRepository.save(timeLog);

        // Update task actual hours
        BigDecimal totalHours = timeLogRepository.sumHoursByTaskId(taskId);
        task.setActualHours(totalHours);
        taskRepository.save(task);

        return toTimeLogDTO(saved);
    }

    @Transactional
    public void deleteTimeLog(UUID timeLogId) {
        ProjectTimeLog timeLog = timeLogRepository.findById(timeLogId)
                .orElseThrow(() -> new BusinessException("Time log not found"));
        UUID taskId = timeLog.getTask().getId();
        timeLogRepository.delete(timeLog);

        // Update task actual hours
        BigDecimal totalHours = timeLogRepository.sumHoursByTaskId(taskId);
        ProjectTask task = taskRepository.findById(taskId).orElse(null);
        if (task != null) {
            task.setActualHours(totalHours);
            taskRepository.save(task);
        }
    }

    // ==================== GANTT CHART ====================

    @Transactional(readOnly = true)
    public GanttChartDTO getGanttChart(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("Project not found"));

        List<ProjectTask> tasks = taskRepository.findByProjectIdAndIsActiveTrue(projectId);
        List<ProjectMilestone> milestones = milestoneRepository.findByProjectIdOrderBySortOrder(projectId);

        List<GanttChartDTO.GanttTask> ganttTasks = new ArrayList<>();

        // Add tasks
        for (ProjectTask task : tasks) {
            GanttChartDTO.GanttTask ganttTask = GanttChartDTO.GanttTask.builder()
                    .id(task.getId())
                    .parentId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                    .name(task.getName())
                    .type("task")
                    .status(task.getStatus() != null ? task.getStatus().name() : null)
                    .startDate(task.getStartDate())
                    .endDate(task.getDueDate())
                    .completionPercentage(task.getCompletionPercentage())
                    .dependencies(task.getDependencyTaskIds() != null ? new ArrayList<>(task.getDependencyTaskIds()) : new ArrayList<>())
                    .assigneeName(task.getAssignee() != null ? task.getAssignee().getFullName() : null)
                    .isCriticalPath(task.getIsCriticalPath())
                    .isMilestone(false)
                    .build();
            ganttTasks.add(ganttTask);
        }

        // Add milestones
        for (ProjectMilestone milestone : milestones) {
            GanttChartDTO.GanttTask ganttMilestone = GanttChartDTO.GanttTask.builder()
                    .id(milestone.getId())
                    .name(milestone.getName())
                    .type("milestone")
                    .status(milestone.getStatus() != null ? milestone.getStatus().name() : null)
                    .startDate(milestone.getDueDate())
                    .endDate(milestone.getDueDate())
                    .completionPercentage(milestone.getStatus() == ProjectMilestone.MilestoneStatus.COMPLETED ? 100 : 0)
                    .isCriticalPath(milestone.getIsCritical())
                    .isMilestone(true)
                    .build();
            ganttTasks.add(ganttMilestone);
        }

        return GanttChartDTO.builder()
                .tasks(ganttTasks)
                .projectStartDate(project.getStartDate())
                .projectEndDate(project.getEndDate())
                .build();
    }

    // ==================== DEPENDENCIES ====================

    @Transactional
    public ProjectTaskDTO addDependency(UUID taskId, UUID dependsOnTaskId) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        if (!taskRepository.existsById(dependsOnTaskId)) {
            throw new BusinessException("Dependency task not found");
        }
        if (taskId.equals(dependsOnTaskId)) {
            throw new BusinessException("A task cannot depend on itself");
        }

        if (!task.getDependencyTaskIds().contains(dependsOnTaskId)) {
            task.getDependencyTaskIds().add(dependsOnTaskId);
            task = taskRepository.save(task);
        }
        return toDTO(task);
    }

    @Transactional
    public ProjectTaskDTO removeDependency(UUID taskId, UUID dependsOnTaskId) {
        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("Task not found"));

        task.getDependencyTaskIds().remove(dependsOnTaskId);
        task = taskRepository.save(task);
        return toDTO(task);
    }

    // ==================== HELPERS ====================

    private void updateProjectCompletion(UUID projectId) {
        List<ProjectTask> activeTasks = taskRepository.findByProjectIdAndIsActiveTrue(projectId);
        if (activeTasks.isEmpty()) return;

        int totalCompletion = activeTasks.stream()
                .mapToInt(t -> t.getCompletionPercentage() != null ? t.getCompletionPercentage() : 0)
                .sum();
        int avgCompletion = totalCompletion / activeTasks.size();

        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            project.setCompletionPercentage(avgCompletion);
            projectRepository.save(project);
        }
    }

    private ProjectTaskDTO toDTO(ProjectTask t) {
        List<ProjectTaskChecklistDTO> checklists = taskChecklistRepository.findByTaskIdOrderBySortOrder(t.getId())
                .stream().map(this::toTaskChecklistDTO).collect(Collectors.toList());

        return ProjectTaskDTO.builder()
                .id(t.getId())
                .projectId(t.getProject().getId())
                .phaseId(t.getPhase() != null ? t.getPhase().getId() : null)
                .phaseName(t.getPhase() != null ? t.getPhase().getName() : null)
                .milestoneId(t.getMilestone() != null ? t.getMilestone().getId() : null)
                .milestoneName(t.getMilestone() != null ? t.getMilestone().getName() : null)
                .parentTaskId(t.getParentTask() != null ? t.getParentTask().getId() : null)
                .assigneeId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .assigneeName(t.getAssignee() != null ? t.getAssignee().getFullName() : null)
                .name(t.getName())
                .description(t.getDescription())
                .status(t.getStatus() != null ? t.getStatus().name() : null)
                .priority(t.getPriority() != null ? t.getPriority().name() : null)
                .startDate(t.getStartDate())
                .dueDate(t.getDueDate())
                .actualStartDate(t.getActualStartDate())
                .actualEndDate(t.getActualEndDate())
                .estimatedHours(t.getEstimatedHours())
                .actualHours(t.getActualHours())
                .completionPercentage(t.getCompletionPercentage())
                .sortOrder(t.getSortOrder())
                .isCriticalPath(t.getIsCriticalPath())
                .dependencyTaskIds(t.getDependencyTaskIds() != null ? new ArrayList<>(t.getDependencyTaskIds()) : new ArrayList<>())
                .tags(t.getTags())
                .checklists(checklists)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private ProjectTaskChecklistDTO toTaskChecklistDTO(ProjectTaskChecklist c) {
        return ProjectTaskChecklistDTO.builder()
                .id(c.getId())
                .taskId(c.getTask().getId())
                .name(c.getName())
                .isCompleted(c.getIsCompleted())
                .completedById(c.getCompletedBy() != null ? c.getCompletedBy().getId() : null)
                .completedByName(c.getCompletedBy() != null ? c.getCompletedBy().getFullName() : null)
                .completedAt(c.getCompletedAt())
                .sortOrder(c.getSortOrder())
                .build();
    }

    private ProjectTaskCommentDTO toCommentDTO(ProjectTaskComment c) {
        return ProjectTaskCommentDTO.builder()
                .id(c.getId())
                .taskId(c.getTask().getId())
                .content(c.getContent())
                .authorId(c.getAuthor() != null ? c.getAuthor().getId() : null)
                .authorName(c.getAuthor() != null ? c.getAuthor().getFullName() : null)
                .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ProjectTimeLogDTO toTimeLogDTO(ProjectTimeLog t) {
        return ProjectTimeLogDTO.builder()
                .id(t.getId())
                .taskId(t.getTask().getId())
                .taskName(t.getTask().getName())
                .userId(t.getUser().getId())
                .userName(t.getUser().getFullName())
                .logDate(t.getLogDate())
                .hours(t.getHours())
                .description(t.getDescription())
                .isBillable(t.getIsBillable())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
