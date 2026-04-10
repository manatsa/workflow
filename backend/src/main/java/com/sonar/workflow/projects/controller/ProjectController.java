package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.dto.*;
import com.sonar.workflow.projects.service.ProjectActivityService;
import com.sonar.workflow.projects.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectActivityService activityService;

    // ==================== PROJECT CRUD ====================

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectSummaryDTO>>> getAllProjects() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    @GetMapping("/search")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<Page<ProjectSummaryDTO>>> searchProjects(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(ApiResponse.success(
                projectService.searchProjects(search, PageRequest.of(page, size, sort))));
    }

    @GetMapping("/by-status/{status}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectSummaryDTO>>> getProjectsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectsByStatus(status)));
    }

    @GetMapping("/by-manager/{managerId}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectSummaryDTO>>> getProjectsByManager(@PathVariable UUID managerId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectsByManager(managerId)));
    }

    @GetMapping("/by-sbu/{sbuId}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectSummaryDTO>>> getProjectsBySbu(@PathVariable UUID sbuId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectsBySbu(sbuId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<ProjectDTO>> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<ProjectDTO>> getProjectByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectByCode(code)));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@priv.has('PROJECT_CREATE')")
    public ResponseEntity<ApiResponse<String>> generateCode(@RequestParam(required = false, defaultValue = "") String category) {
        return ResponseEntity.ok(ApiResponse.success(projectService.generateProjectCode(category)));
    }

    @PostMapping
    @PreAuthorize("@priv.has('PROJECT_CREATE')")
    public ResponseEntity<ApiResponse<ProjectDTO>> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project created successfully", projectService.createProject(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateProject(@PathVariable UUID id, @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", projectService.updateProject(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@priv.has('PROJECT_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    // ==================== STATUS & STAGE ====================

    @PostMapping("/{id}/submit")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDTO>> submitForApproval(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Project submitted for approval", projectService.submitForApproval(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@priv.has('PROJECT_APPROVE')")
    public ResponseEntity<ApiResponse<ProjectDTO>> approveProject(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Project approved", projectService.approveProject(id, authentication.getName())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@priv.has('PROJECT_APPROVE')")
    public ResponseEntity<ApiResponse<ProjectDTO>> rejectProject(@PathVariable UUID id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.success("Project rejected", projectService.rejectProject(id, reason)));
    }

    @PostMapping("/{id}/approval")
    @PreAuthorize("@priv.has('PROJECT_APPROVE')")
    public ResponseEntity<ApiResponse<ProjectDTO>> processApproval(@PathVariable UUID id, @RequestBody ProjectApprovalRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Approval processed", projectService.processProjectApproval(id, request)));
    }

    @GetMapping("/{id}/approval-steps")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectApprovalStepDTO>>> getApprovalSteps(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getApprovalSteps(id)));
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDTO>> transitionStage(@PathVariable UUID id, @Valid @RequestBody ProjectStageTransitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Stage transition successful", projectService.transitionStage(id, request)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateStatus(@PathVariable UUID id,
                                                                  @RequestParam String status,
                                                                  @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", projectService.updateStatus(id, status, reason)));
    }

    // ==================== TEAM MEMBERS ====================

    @GetMapping("/{id}/team")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTeamMemberDTO>>> getTeamMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getTeamMembers(id)));
    }

    @PostMapping("/{id}/team")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTeamMemberDTO>> addTeamMember(@PathVariable UUID id, @RequestBody ProjectTeamMemberDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Team member added", projectService.addTeamMember(id, dto)));
    }

    @PutMapping("/{id}/team/{memberId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectTeamMemberDTO>> updateTeamMember(@PathVariable UUID id, @PathVariable UUID memberId, @RequestBody ProjectTeamMemberDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Team member updated", projectService.updateTeamMember(id, memberId, dto)));
    }

    @DeleteMapping("/{id}/team/{memberId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(@PathVariable UUID id, @PathVariable UUID memberId) {
        projectService.removeTeamMember(id, memberId);
        return ResponseEntity.ok(ApiResponse.success("Team member removed", null));
    }

    // ==================== PHASES ====================

    @GetMapping("/{id}/phases")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectPhaseDTO>>> getPhases(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getPhases(id)));
    }

    @PostMapping("/{id}/phases")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectPhaseDTO>> createPhase(@PathVariable UUID id, @RequestBody ProjectPhaseDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Phase created", projectService.createPhase(id, dto)));
    }

    @PutMapping("/{id}/phases/{phaseId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectPhaseDTO>> updatePhase(@PathVariable UUID id, @PathVariable UUID phaseId, @RequestBody ProjectPhaseDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Phase updated", projectService.updatePhase(id, phaseId, dto)));
    }

    @DeleteMapping("/{id}/phases/{phaseId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deletePhase(@PathVariable UUID id, @PathVariable UUID phaseId) {
        projectService.deletePhase(id, phaseId);
        return ResponseEntity.ok(ApiResponse.success("Phase deleted", null));
    }

    // ==================== MILESTONES ====================

    @GetMapping("/{id}/milestones")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectMilestoneDTO>>> getMilestones(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMilestones(id)));
    }

    @PostMapping("/{id}/milestones")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectMilestoneDTO>> createMilestone(@PathVariable UUID id, @RequestBody ProjectMilestoneDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Milestone created", projectService.createMilestone(id, dto)));
    }

    @PutMapping("/{id}/milestones/{milestoneId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectMilestoneDTO>> updateMilestone(@PathVariable UUID id, @PathVariable UUID milestoneId, @RequestBody ProjectMilestoneDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Milestone updated", projectService.updateMilestone(id, milestoneId, dto)));
    }

    @DeleteMapping("/{id}/milestones/{milestoneId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteMilestone(@PathVariable UUID id, @PathVariable UUID milestoneId) {
        projectService.deleteMilestone(id, milestoneId);
        return ResponseEntity.ok(ApiResponse.success("Milestone deleted", null));
    }

    // ==================== RISKS ====================

    @GetMapping("/{id}/risks")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectRiskDTO>>> getRisks(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getRisks(id)));
    }

    @PostMapping("/{id}/risks")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectRiskDTO>> createRisk(@PathVariable UUID id, @RequestBody ProjectRiskDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Risk created", projectService.createRisk(id, dto)));
    }

    @PutMapping("/{id}/risks/{riskId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectRiskDTO>> updateRisk(@PathVariable UUID id, @PathVariable UUID riskId, @RequestBody ProjectRiskDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Risk updated", projectService.updateRisk(id, riskId, dto)));
    }

    @DeleteMapping("/{id}/risks/{riskId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteRisk(@PathVariable UUID id, @PathVariable UUID riskId) {
        projectService.deleteRisk(id, riskId);
        return ResponseEntity.ok(ApiResponse.success("Risk deleted", null));
    }

    // ==================== ISSUES ====================

    @GetMapping("/{id}/issues")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectIssueDTO>>> getIssues(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getIssues(id)));
    }

    @PostMapping("/{id}/issues")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectIssueDTO>> createIssue(@PathVariable UUID id, @RequestBody ProjectIssueDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Issue created", projectService.createIssue(id, dto)));
    }

    @PutMapping("/{id}/issues/{issueId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectIssueDTO>> updateIssue(@PathVariable UUID id, @PathVariable UUID issueId, @RequestBody ProjectIssueDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Issue updated", projectService.updateIssue(id, issueId, dto)));
    }

    @DeleteMapping("/{id}/issues/{issueId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteIssue(@PathVariable UUID id, @PathVariable UUID issueId) {
        projectService.deleteIssue(id, issueId);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted", null));
    }

    // ==================== BUDGET ====================

    @GetMapping("/{id}/budget")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectBudgetLineDTO>>> getBudgetLines(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getBudgetLines(id)));
    }

    @PostMapping("/{id}/budget")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectBudgetLineDTO>> createBudgetLine(@PathVariable UUID id, @RequestBody ProjectBudgetLineDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Budget line created", projectService.createBudgetLine(id, dto)));
    }

    @PutMapping("/{id}/budget/{lineId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectBudgetLineDTO>> updateBudgetLine(@PathVariable UUID id, @PathVariable UUID lineId, @RequestBody ProjectBudgetLineDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Budget line updated", projectService.updateBudgetLine(id, lineId, dto)));
    }

    @DeleteMapping("/{id}/budget/{lineId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteBudgetLine(@PathVariable UUID id, @PathVariable UUID lineId) {
        projectService.deleteBudgetLine(id, lineId);
        return ResponseEntity.ok(ApiResponse.success("Budget line deleted", null));
    }

    @GetMapping("/{id}/budget/{lineId}/adjustments")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectBudgetAdjustmentDTO>>> getBudgetAdjustments(
            @PathVariable UUID id, @PathVariable UUID lineId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getBudgetAdjustments(lineId)));
    }

    @GetMapping("/{id}/budget-adjustments")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectBudgetAdjustmentDTO>>> getProjectBudgetAdjustments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectBudgetAdjustments(id)));
    }

    @PostMapping("/{id}/budget/{lineId}/adjustments")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectBudgetAdjustmentDTO>> addBudgetAdjustment(
            @PathVariable UUID id, @PathVariable UUID lineId, @RequestBody ProjectBudgetAdjustmentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Adjustment added", projectService.addBudgetAdjustment(id, lineId, dto)));
    }

    // ==================== DOCUMENTS ====================

    @GetMapping("/{id}/documents")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectDocumentDTO>>> getDocuments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getDocuments(id)));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDocumentDTO>> addDocument(@PathVariable UUID id, @RequestBody ProjectDocumentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Document added", projectService.addDocument(id, dto)));
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id, @PathVariable UUID documentId) {
        projectService.deleteDocument(id, documentId);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }

    @PostMapping("/{id}/documents/upload")
    @PreAuthorize("@priv.has('PROJECT_EDIT')")
    public ResponseEntity<ApiResponse<ProjectDocumentDTO>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "category", required = false, defaultValue = "GENERAL") String category,
            @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(ApiResponse.success("Document uploaded", projectService.uploadDocument(id, file, name, category, description)));
    }

    @GetMapping("/{id}/documents/{docId}/download")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID id, @PathVariable UUID docId) {
        ProjectDocumentDTO doc = projectService.getDocumentById(docId);
        Resource resource = projectService.downloadDocument(docId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType() != null ? doc.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    // ==================== STATUS HISTORY ====================

    @GetMapping("/{id}/history")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectStatusHistoryDTO>>> getStatusHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getStatusHistory(id)));
    }

    // ==================== ACTIVITIES ====================

    @GetMapping("/{id}/activities")
    @PreAuthorize("@priv.has('PROJECT_VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectActivityDTO>>> getActivities(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(activityService.getProjectActivities(id)));
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ProjectDashboardDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(projectService.getDashboard()));
    }
}
