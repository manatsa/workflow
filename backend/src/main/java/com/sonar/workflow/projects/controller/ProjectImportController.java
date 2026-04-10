package com.sonar.workflow.projects.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.projects.service.ProjectImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/import")
@RequiredArgsConstructor
public class ProjectImportController {

    private final ProjectImportService importService;

    @GetMapping("/template/projects")
    @PreAuthorize("@priv.hasAny('PROJECT_CREATE','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadProjectTemplate() throws IOException {
        byte[] template = importService.generateProjectTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @GetMapping("/template/tasks")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadTaskTemplate() throws IOException {
        byte[] template = importService.generateTaskTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=task_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/projects")
    @PreAuthorize("@priv.hasAny('PROJECT_CREATE','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importProjects(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importProjects(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "Projects_Import_Results.xlsx");
    }

    @PostMapping("/tasks")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importTasks(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importTasks(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "Tasks_Import_Results.xlsx");
    }

    // Team Members
    @GetMapping("/template/team-members")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadTeamMemberTemplate() throws IOException {
        byte[] template = importService.generateTeamMemberTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=team_members_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/team-members")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importTeamMembers(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importTeamMembers(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "TeamMembers_Import_Results.xlsx");
    }

    // Budget Lines
    @GetMapping("/template/budget-lines")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadBudgetLineTemplate() throws IOException {
        byte[] template = importService.generateBudgetLineTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=budget_lines_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/budget-lines")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importBudgetLines(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importBudgetLines(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "BudgetLines_Import_Results.xlsx");
    }

    // Risks
    @GetMapping("/template/risks")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadRiskTemplate() throws IOException {
        byte[] template = importService.generateRiskTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=risks_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/risks")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importRisks(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importRisks(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "Risks_Import_Results.xlsx");
    }

    // Issues
    @GetMapping("/template/issues")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> downloadIssueTemplate() throws IOException {
        byte[] template = importService.generateIssueTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=issues_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping("/issues")
    @PreAuthorize("@priv.hasAny('PROJECT_EDIT','PROJECT_IMPORT')")
    public ResponseEntity<byte[]> importIssues(@RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> result = importService.importIssues(file);
        byte[] resultExcel = importService.buildResultExcel(file, result);
        return excelResponse(resultExcel, "Issues_Import_Results.xlsx");
    }

    private ResponseEntity<byte[]> excelResponse(byte[] data, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
