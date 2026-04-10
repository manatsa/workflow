package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.*;
import com.sonar.workflow.projects.service.ProjectTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class ProjectTaskController {

    private final ProjectTaskService taskService;

    // ==================== TASKS ====================

    @GetMapping
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskDTO>>> getTasks(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getActiveTasksByProject(projectId)));
    }

    @GetMapping("/all")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskDTO>>> getAllTasks(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByProject(projectId)));
    }

    @GetMapping("/{taskId}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<ProjectTaskDTO>> getTask(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(taskId)));
    }

    @GetMapping("/by-status/{status}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskDTO>>> getTasksByStatus(@PathVariable UUID projectId, @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByStatus(projectId, status)));
    }

    @GetMapping("/by-assignee/{assigneeId}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskDTO>>> getTasksByAssignee(@PathVariable UUID projectId, @PathVariable UUID assigneeId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByAssignee(assigneeId)));
    }

    @GetMapping("/{taskId}/subtasks")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskDTO>>> getSubTasks(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getSubTasks(taskId)));
    }

    @PostMapping
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskDTO>> createTask(@PathVariable UUID projectId, @RequestBody ProjectTaskDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Task created", taskService.createTask(projectId, dto)));
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskDTO>> updateTask(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody ProjectTaskDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Task updated", taskService.updateTask(projectId, taskId, dto)));
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        taskService.deleteTask(projectId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    // ==================== DEPENDENCIES ====================

    @PostMapping("/{taskId}/dependencies/{dependsOnId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskDTO>> addDependency(@PathVariable UUID projectId, @PathVariable UUID taskId, @PathVariable UUID dependsOnId) {
        return ResponseEntity.ok(ApiResponse.success("Dependency added", taskService.addDependency(taskId, dependsOnId)));
    }

    @DeleteMapping("/{taskId}/dependencies/{dependsOnId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskDTO>> removeDependency(@PathVariable UUID projectId, @PathVariable UUID taskId, @PathVariable UUID dependsOnId) {
        return ResponseEntity.ok(ApiResponse.success("Dependency removed", taskService.removeDependency(taskId, dependsOnId)));
    }

    // ==================== TASK CHECKLISTS ====================

    @GetMapping("/{taskId}/checklists")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskChecklistDTO>>> getTaskChecklists(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskChecklists(taskId)));
    }

    @PostMapping("/{taskId}/checklists")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskChecklistDTO>> addChecklistItem(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody ProjectTaskChecklistDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Checklist item added", taskService.addTaskChecklistItem(taskId, dto)));
    }

    @PutMapping("/{taskId}/checklists/{itemId}/toggle")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskChecklistDTO>> toggleChecklistItem(@PathVariable UUID projectId, @PathVariable UUID taskId,
                                                                                      @PathVariable UUID itemId, @RequestParam(required = false) UUID completedById) {
        return ResponseEntity.ok(ApiResponse.success("Checklist item toggled", taskService.toggleTaskChecklistItem(itemId, completedById)));
    }

    @DeleteMapping("/{taskId}/checklists/{itemId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteChecklistItem(@PathVariable UUID projectId, @PathVariable UUID taskId, @PathVariable UUID itemId) {
        taskService.deleteTaskChecklistItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Checklist item deleted", null));
    }

    // ==================== COMMENTS ====================

    @GetMapping("/{taskId}/comments")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskCommentDTO>>> getComments(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskComments(taskId)));
    }

    @PostMapping("/{taskId}/comments")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskCommentDTO>> addComment(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody ProjectTaskCommentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Comment added", taskService.addComment(taskId, dto)));
    }

    @DeleteMapping("/{taskId}/comments/{commentId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID projectId, @PathVariable UUID taskId, @PathVariable UUID commentId) {
        taskService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    // ==================== TIME LOGS ====================

    @GetMapping("/{taskId}/time-logs")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTimeLogDTO>>> getTimeLogs(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTimeLogs(taskId)));
    }

    @PostMapping("/{taskId}/time-logs")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTimeLogDTO>> logTime(@PathVariable UUID projectId, @PathVariable UUID taskId, @RequestBody ProjectTimeLogDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Time logged", taskService.logTime(taskId, dto)));
    }

    @DeleteMapping("/{taskId}/time-logs/{timeLogId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteTimeLog(@PathVariable UUID projectId, @PathVariable UUID taskId, @PathVariable UUID timeLogId) {
        taskService.deleteTimeLog(timeLogId);
        return ResponseEntity.ok(ApiResponse.success("Time log deleted", null));
    }

    // ==================== GANTT ====================

    @GetMapping("/gantt")
    public ResponseEntity<ApiResponse<GanttChartDTO>> getGanttChart(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getGanttChart(projectId)));
    }
}
