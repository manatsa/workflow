package com.sonar.workflow.projects.service;

import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.ProjectDTO;
import com.sonar.workflow.projects.entity.*;
import com.sonar.workflow.projects.repository.*;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectImportService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectCategoryRepository projectCategoryRepository;
    private final ProjectTeamMemberRepository teamMemberRepository;
    private final ProjectBudgetLineRepository budgetLineRepository;
    private final ProjectRiskRepository riskRepository;
    private final ProjectIssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    public byte[] generateProjectTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Projects sheet
            Sheet projectSheet = workbook.createSheet("Projects");
            Row header = projectSheet.createRow(0);
            String[] projectHeaders = {"Code*", "Name*", "Description", "Priority", "Category",
                    "Start Date (yyyy-MM-dd)", "End Date (yyyy-MM-dd)", "Estimated Budget",
                    "Manager Username", "Notes", "Objectives"};
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < projectHeaders.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(projectHeaders[i]);
                cell.setCellStyle(headerStyle);
                projectSheet.setColumnWidth(i, 5000);
            }

            // Sample row
            Row sampleRow = projectSheet.createRow(1);
            sampleRow.createCell(0).setCellValue("PRJ-001");
            sampleRow.createCell(1).setCellValue("Sample Project");
            sampleRow.createCell(2).setCellValue("Description here");
            sampleRow.createCell(3).setCellValue("MEDIUM");
            sampleRow.createCell(4).setCellValue("SOFTWARE");
            sampleRow.createCell(5).setCellValue("2026-01-01");
            sampleRow.createCell(6).setCellValue("2026-12-31");
            sampleRow.createCell(7).setCellValue(100000);
            sampleRow.createCell(8).setCellValue("admin");

            // Tasks sheet
            Sheet taskSheet = workbook.createSheet("Tasks");
            Row taskHeader = taskSheet.createRow(0);
            String[] taskHeaders = {"Project Code*", "Task Name*", "Description", "Priority",
                    "Assignee Username", "Start Date (yyyy-MM-dd)", "Due Date (yyyy-MM-dd)",
                    "Estimated Hours"};
            for (int i = 0; i < taskHeaders.length; i++) {
                Cell cell = taskHeader.createCell(i);
                cell.setCellValue(taskHeaders[i]);
                cell.setCellStyle(headerStyle);
                taskSheet.setColumnWidth(i, 5000);
            }

            // Instructions sheet
            Sheet instructionSheet = workbook.createSheet("Instructions");
            instructionSheet.createRow(0).createCell(0).setCellValue("Import Instructions");
            instructionSheet.createRow(2).createCell(0).setCellValue("1. Fill in the Projects sheet first");
            instructionSheet.createRow(3).createCell(0).setCellValue("2. Code and Name are required fields (marked with *)");
            instructionSheet.createRow(4).createCell(0).setCellValue("3. Priority values: LOW, MEDIUM, HIGH, CRITICAL");
            instructionSheet.createRow(5).createCell(0).setCellValue("4. Category values: INTERNAL, EXTERNAL, RESEARCH, INFRASTRUCTURE, SOFTWARE, CONSULTING, MAINTENANCE, OTHER");
            instructionSheet.createRow(6).createCell(0).setCellValue("5. Dates must be in yyyy-MM-dd format");
            instructionSheet.createRow(7).createCell(0).setCellValue("6. Tasks reference projects by Code");
            instructionSheet.setColumnWidth(0, 15000);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateTaskTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Tasks");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);

            String[] headers = {"Project Code*", "Task Name*", "Description", "Priority",
                    "Assignee Username", "Start Date", "Due Date", "Estimated Hours", "Phase", "Tags"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importProjects(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Projects");
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;

                try {
                    String code = getCellStringValue(row.getCell(0));
                    String name = getCellStringValue(row.getCell(1));

                    if (code == null || code.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Code is required");
                        continue;
                    }
                    if (name == null || name.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Name is required");
                        continue;
                    }
                    if (projectRepository.existsByCode(code)) {
                        errors.add("Row " + (i + 1) + ": Project with code '" + code + "' already exists");
                        continue;
                    }

                    Project project = Project.builder()
                            .code(code)
                            .name(name)
                            .description(getCellStringValue(row.getCell(2)))
                            .status(Project.ProjectStatus.DRAFT)
                            .stage(Project.ProjectStage.INITIATION)
                            .build();

                    String priority = getCellStringValue(row.getCell(3));
                    if (priority != null && !priority.isBlank()) {
                        try {
                            project.setPriority(Project.ProjectPriority.valueOf(priority.toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            project.setPriority(Project.ProjectPriority.MEDIUM);
                        }
                    }

                    String category = getCellStringValue(row.getCell(4));
                    if (category != null && !category.isBlank()) {
                        projectCategoryRepository.findByCode(category.toUpperCase())
                                .ifPresent(project::setCategory);
                    }

                    String startDateStr = getCellStringValue(row.getCell(5));
                    if (startDateStr != null && !startDateStr.isBlank()) {
                        project.setStartDate(parseDate(startDateStr, row.getCell(5)));
                    }

                    String endDateStr = getCellStringValue(row.getCell(6));
                    if (endDateStr != null && !endDateStr.isBlank()) {
                        project.setEndDate(parseDate(endDateStr, row.getCell(6)));
                    }

                    Cell budgetCell = row.getCell(7);
                    if (budgetCell != null && budgetCell.getCellType() == CellType.NUMERIC) {
                        project.setEstimatedBudget(BigDecimal.valueOf(budgetCell.getNumericCellValue()));
                    }

                    String managerUsername = getCellStringValue(row.getCell(8));
                    if (managerUsername != null && !managerUsername.isBlank()) {
                        userRepository.findByUsername(managerUsername).ifPresent(project::setManager);
                    }

                    project.setNotes(getCellStringValue(row.getCell(9)));
                    project.setObjectives(getCellStringValue(row.getCell(10)));

                    projectRepository.save(project);
                    successes.add("Row " + (i + 1) + ": Project '" + code + "' imported successfully");

                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", rowCount);
        result.put("successCount", successes.size());
        result.put("errorCount", errors.size());
        result.put("successes", successes);
        result.put("errors", errors);
        return result;
    }

    @Transactional
    public Map<String, Object> importTasks(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Tasks");
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;

                try {
                    String projectCode = getCellStringValue(row.getCell(0));
                    String taskName = getCellStringValue(row.getCell(1));

                    if (projectCode == null || projectCode.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Project Code is required");
                        continue;
                    }
                    if (taskName == null || taskName.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Task Name is required");
                        continue;
                    }

                    Optional<Project> projectOpt = projectRepository.findByCode(projectCode);
                    if (projectOpt.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": Project with code '" + projectCode + "' not found");
                        continue;
                    }

                    ProjectTask task = ProjectTask.builder()
                            .project(projectOpt.get())
                            .name(taskName)
                            .description(getCellStringValue(row.getCell(2)))
                            .status(ProjectTask.TaskStatus.TODO)
                            .build();

                    String priority = getCellStringValue(row.getCell(3));
                    if (priority != null && !priority.isBlank()) {
                        try {
                            task.setPriority(ProjectTask.TaskPriority.valueOf(priority.toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            task.setPriority(ProjectTask.TaskPriority.MEDIUM);
                        }
                    }

                    String assigneeUsername = getCellStringValue(row.getCell(4));
                    if (assigneeUsername != null && !assigneeUsername.isBlank()) {
                        userRepository.findByUsername(assigneeUsername).ifPresent(task::setAssignee);
                    }

                    String startDateStr = getCellStringValue(row.getCell(5));
                    if (startDateStr != null && !startDateStr.isBlank()) {
                        task.setStartDate(parseDate(startDateStr, row.getCell(5)));
                    }

                    String dueDateStr = getCellStringValue(row.getCell(6));
                    if (dueDateStr != null && !dueDateStr.isBlank()) {
                        task.setDueDate(parseDate(dueDateStr, row.getCell(6)));
                    }

                    Cell hoursCell = row.getCell(7);
                    if (hoursCell != null && hoursCell.getCellType() == CellType.NUMERIC) {
                        task.setEstimatedHours(BigDecimal.valueOf(hoursCell.getNumericCellValue()));
                    }

                    task.setTags(getCellStringValue(row.getCell(9)));

                    taskRepository.save(task);
                    successes.add("Row " + (i + 1) + ": Task '" + taskName + "' imported successfully");

                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", rowCount);
        result.put("successCount", successes.size());
        result.put("errorCount", errors.size());
        result.put("successes", successes);
        result.put("errors", errors);
        return result;
    }

    // ==================== Team Members ====================

    public byte[] generateTeamMemberTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Team Members");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Project Code*", "Username*", "Role", "Allocation %", "Join Date (yyyy-MM-dd)", "Responsibilities"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }
            Sheet instrSheet = workbook.createSheet("Instructions");
            instrSheet.createRow(0).createCell(0).setCellValue("Role values: PROJECT_MANAGER, TEAM_LEAD, MEMBER, STAKEHOLDER, CONSULTANT, OBSERVER");
            instrSheet.createRow(1).createCell(0).setCellValue("Allocation: 0-100 (percentage)");
            instrSheet.setColumnWidth(0, 20000);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importTeamMembers(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Team Members");
            if (sheet == null) sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;
                try {
                    String projectCode = getCellStringValue(row.getCell(0));
                    String username = getCellStringValue(row.getCell(1));
                    if (projectCode == null || projectCode.isBlank()) { errors.add("Row " + (i+1) + ": Project Code is required"); continue; }
                    if (username == null || username.isBlank()) { errors.add("Row " + (i+1) + ": Username is required"); continue; }
                    Optional<Project> projectOpt = projectRepository.findByCode(projectCode);
                    if (projectOpt.isEmpty()) { errors.add("Row " + (i+1) + ": Project '" + projectCode + "' not found"); continue; }
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    if (userOpt.isEmpty()) { errors.add("Row " + (i+1) + ": User '" + username + "' not found"); continue; }
                    ProjectTeamMember member = ProjectTeamMember.builder()
                            .project(projectOpt.get())
                            .user(userOpt.get())
                            .joinDate(LocalDate.now())
                            .build();
                    String role = getCellStringValue(row.getCell(2));
                    if (role != null && !role.isBlank()) {
                        try { member.setRole(ProjectTeamMember.TeamRole.valueOf(role.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    Cell allocCell = row.getCell(3);
                    if (allocCell != null && allocCell.getCellType() == CellType.NUMERIC) {
                        member.setAllocationPercentage((int) allocCell.getNumericCellValue());
                    }
                    String joinDate = getCellStringValue(row.getCell(4));
                    if (joinDate != null && !joinDate.isBlank()) { member.setJoinDate(parseDate(joinDate, row.getCell(4))); }
                    member.setResponsibilities(getCellStringValue(row.getCell(5)));
                    teamMemberRepository.save(member);
                    successes.add("Row " + (i+1) + ": Team member '" + username + "' added to '" + projectCode + "'");
                } catch (Exception e) { errors.add("Row " + (i+1) + ": " + e.getMessage()); }
            }
        }
        return buildResult(rowCount, successes, errors);
    }

    // ==================== Budget Lines ====================

    public byte[] generateBudgetLineTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Budget Lines");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Project Code*", "Name*", "Description", "Category", "Estimated Amount", "Actual Amount", "Notes"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }
            Sheet instrSheet = workbook.createSheet("Instructions");
            instrSheet.createRow(0).createCell(0).setCellValue("Category values: LABOR, EQUIPMENT, MATERIALS, SOFTWARE, TRAVEL, TRAINING, CONSULTING, CONTINGENCY, OTHER");
            instrSheet.setColumnWidth(0, 20000);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importBudgetLines(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Budget Lines");
            if (sheet == null) sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;
                try {
                    String projectCode = getCellStringValue(row.getCell(0));
                    String name = getCellStringValue(row.getCell(1));
                    if (projectCode == null || projectCode.isBlank()) { errors.add("Row " + (i+1) + ": Project Code is required"); continue; }
                    if (name == null || name.isBlank()) { errors.add("Row " + (i+1) + ": Name is required"); continue; }
                    Optional<Project> projectOpt = projectRepository.findByCode(projectCode);
                    if (projectOpt.isEmpty()) { errors.add("Row " + (i+1) + ": Project '" + projectCode + "' not found"); continue; }
                    ProjectBudgetLine line = ProjectBudgetLine.builder()
                            .project(projectOpt.get())
                            .name(name)
                            .description(getCellStringValue(row.getCell(2)))
                            .build();
                    String category = getCellStringValue(row.getCell(3));
                    if (category != null && !category.isBlank()) {
                        try { line.setCategory(ProjectBudgetLine.BudgetCategory.valueOf(category.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    Cell estCell = row.getCell(4);
                    if (estCell != null && estCell.getCellType() == CellType.NUMERIC) {
                        line.setEstimatedAmount(BigDecimal.valueOf(estCell.getNumericCellValue()));
                        line.setOriginalEstimate(BigDecimal.valueOf(estCell.getNumericCellValue()));
                    }
                    Cell actCell = row.getCell(5);
                    if (actCell != null && actCell.getCellType() == CellType.NUMERIC) {
                        line.setActualAmount(BigDecimal.valueOf(actCell.getNumericCellValue()));
                    }
                    line.setNotes(getCellStringValue(row.getCell(6)));
                    budgetLineRepository.save(line);
                    successes.add("Row " + (i+1) + ": Budget line '" + name + "' added to '" + projectCode + "'");
                } catch (Exception e) { errors.add("Row " + (i+1) + ": " + e.getMessage()); }
            }
        }
        return buildResult(rowCount, successes, errors);
    }

    // ==================== Risks ====================

    public byte[] generateRiskTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Risks");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Project Code*", "Title*", "Description", "Probability", "Impact", "Status", "Mitigation Plan", "Owner Username"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }
            Sheet instrSheet = workbook.createSheet("Instructions");
            instrSheet.createRow(0).createCell(0).setCellValue("Probability: VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH");
            instrSheet.createRow(1).createCell(0).setCellValue("Impact: VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH");
            instrSheet.createRow(2).createCell(0).setCellValue("Status: IDENTIFIED, ANALYZING, MITIGATING, RESOLVED, ACCEPTED, CLOSED");
            instrSheet.setColumnWidth(0, 20000);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importRisks(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Risks");
            if (sheet == null) sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;
                try {
                    String projectCode = getCellStringValue(row.getCell(0));
                    String title = getCellStringValue(row.getCell(1));
                    if (projectCode == null || projectCode.isBlank()) { errors.add("Row " + (i+1) + ": Project Code is required"); continue; }
                    if (title == null || title.isBlank()) { errors.add("Row " + (i+1) + ": Title is required"); continue; }
                    Optional<Project> projectOpt = projectRepository.findByCode(projectCode);
                    if (projectOpt.isEmpty()) { errors.add("Row " + (i+1) + ": Project '" + projectCode + "' not found"); continue; }
                    ProjectRisk risk = ProjectRisk.builder()
                            .project(projectOpt.get())
                            .title(title)
                            .description(getCellStringValue(row.getCell(2)))
                            .identifiedDate(LocalDate.now())
                            .build();
                    String prob = getCellStringValue(row.getCell(3));
                    if (prob != null && !prob.isBlank()) {
                        try { risk.setProbability(ProjectRisk.RiskProbability.valueOf(prob.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    String impact = getCellStringValue(row.getCell(4));
                    if (impact != null && !impact.isBlank()) {
                        try { risk.setImpact(ProjectRisk.RiskImpact.valueOf(impact.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    String status = getCellStringValue(row.getCell(5));
                    if (status != null && !status.isBlank()) {
                        try { risk.setStatus(ProjectRisk.RiskStatus.valueOf(status.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    risk.setMitigationPlan(getCellStringValue(row.getCell(6)));
                    String ownerUsername = getCellStringValue(row.getCell(7));
                    if (ownerUsername != null && !ownerUsername.isBlank()) {
                        userRepository.findByUsername(ownerUsername).ifPresent(risk::setOwner);
                    }
                    riskRepository.save(risk);
                    successes.add("Row " + (i+1) + ": Risk '" + title + "' added to '" + projectCode + "'");
                } catch (Exception e) { errors.add("Row " + (i+1) + ": " + e.getMessage()); }
            }
        }
        return buildResult(rowCount, successes, errors);
    }

    // ==================== Issues ====================

    public byte[] generateIssueTemplate() throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Issues");
            Row header = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            String[] headers = {"Project Code*", "Title*", "Description", "Priority", "Status", "Category", "Assignee Username", "Due Date (yyyy-MM-dd)"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }
            Sheet instrSheet = workbook.createSheet("Instructions");
            instrSheet.createRow(0).createCell(0).setCellValue("Priority: LOW, MEDIUM, HIGH, CRITICAL");
            instrSheet.createRow(1).createCell(0).setCellValue("Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REOPENED");
            instrSheet.createRow(2).createCell(0).setCellValue("Category: BUG, CHANGE_REQUEST, RESOURCE, SCOPE, SCHEDULE, BUDGET, QUALITY, OTHER");
            instrSheet.setColumnWidth(0, 20000);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public Map<String, Object> importIssues(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<String> successes = new ArrayList<>();
        int rowCount = 0;
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("Issues");
            if (sheet == null) sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                rowCount++;
                try {
                    String projectCode = getCellStringValue(row.getCell(0));
                    String title = getCellStringValue(row.getCell(1));
                    if (projectCode == null || projectCode.isBlank()) { errors.add("Row " + (i+1) + ": Project Code is required"); continue; }
                    if (title == null || title.isBlank()) { errors.add("Row " + (i+1) + ": Title is required"); continue; }
                    Optional<Project> projectOpt = projectRepository.findByCode(projectCode);
                    if (projectOpt.isEmpty()) { errors.add("Row " + (i+1) + ": Project '" + projectCode + "' not found"); continue; }
                    ProjectIssue issue = ProjectIssue.builder()
                            .project(projectOpt.get())
                            .title(title)
                            .description(getCellStringValue(row.getCell(2)))
                            .reportedDate(LocalDate.now())
                            .build();
                    String priority = getCellStringValue(row.getCell(3));
                    if (priority != null && !priority.isBlank()) {
                        try { issue.setPriority(ProjectIssue.IssuePriority.valueOf(priority.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    String status = getCellStringValue(row.getCell(4));
                    if (status != null && !status.isBlank()) {
                        try { issue.setStatus(ProjectIssue.IssueStatus.valueOf(status.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    String category = getCellStringValue(row.getCell(5));
                    if (category != null && !category.isBlank()) {
                        try { issue.setCategory(ProjectIssue.IssueCategory.valueOf(category.toUpperCase())); } catch (IllegalArgumentException ignored) {}
                    }
                    String assigneeUsername = getCellStringValue(row.getCell(6));
                    if (assigneeUsername != null && !assigneeUsername.isBlank()) {
                        userRepository.findByUsername(assigneeUsername).ifPresent(issue::setAssignee);
                    }
                    String dueDate = getCellStringValue(row.getCell(7));
                    if (dueDate != null && !dueDate.isBlank()) { issue.setDueDate(parseDate(dueDate, row.getCell(7))); }
                    issueRepository.save(issue);
                    successes.add("Row " + (i+1) + ": Issue '" + title + "' added to '" + projectCode + "'");
                } catch (Exception e) { errors.add("Row " + (i+1) + ": " + e.getMessage()); }
            }
        }
        return buildResult(rowCount, successes, errors);
    }

    private Map<String, Object> buildResult(int rowCount, List<String> successes, List<String> errors) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRows", rowCount);
        result.put("successCount", successes.size());
        result.put("errorCount", errors.size());
        result.put("successes", successes);
        result.put("errors", errors);
        return result;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    /**
     * Build a result Excel from the source file and import results.
     * Copies all original rows and adds Status + Details columns.
     */
    public byte[] buildResultExcel(MultipartFile sourceFile, Map<String, Object> results) throws IOException {
        List<String> successes = (List<String>) results.getOrDefault("successes", new ArrayList<>());
        List<String> errors = (List<String>) results.getOrDefault("errors", new ArrayList<>());

        // Build a map of row number -> status/message
        Map<Integer, String[]> rowResults = new LinkedHashMap<>();
        for (String s : successes) {
            var m = java.util.regex.Pattern.compile("Row (\\d+): (.+)").matcher(s);
            if (m.find()) rowResults.put(Integer.parseInt(m.group(1)), new String[]{"SUCCESS", m.group(2)});
        }
        for (String e : errors) {
            var m = java.util.regex.Pattern.compile("Row (\\d+): (.+)").matcher(e);
            if (m.find()) rowResults.put(Integer.parseInt(m.group(1)), new String[]{"FAILED", m.group(2)});
        }

        try (Workbook source = WorkbookFactory.create(sourceFile.getInputStream());
             XSSFWorkbook result = new XSSFWorkbook()) {

            Sheet srcSheet = source.getSheetAt(0);
            Sheet resSheet = result.createSheet("Import Results");

            CellStyle hdrStyle = result.createCellStyle();
            Font hf = result.createFont(); hf.setBold(true); hdrStyle.setFont(hf);
            CellStyle okStyle = result.createCellStyle();
            Font sf = result.createFont(); sf.setColor(IndexedColors.GREEN.getIndex()); sf.setBold(true); okStyle.setFont(sf);
            CellStyle errStyle = result.createCellStyle();
            Font ef = result.createFont(); ef.setColor(IndexedColors.RED.getIndex()); ef.setBold(true); errStyle.setFont(ef);

            // Copy header + add Status/Details
            Row srcH = srcSheet.getRow(0);
            Row resH = resSheet.createRow(0);
            int cols = srcH != null ? Math.max(srcH.getLastCellNum(), 0) : 0;
            for (int i = 0; i < cols; i++) {
                Cell c = resH.createCell(i); c.setCellStyle(hdrStyle);
                Cell sc = srcH.getCell(i);
                if (sc != null) c.setCellValue(getCellStringValue(sc));
            }
            Cell sh = resH.createCell(cols); sh.setCellValue("Import Status"); sh.setCellStyle(hdrStyle);
            Cell dh = resH.createCell(cols + 1); dh.setCellValue("Details"); dh.setCellStyle(hdrStyle);

            // Copy data rows + results
            int resIdx = 0;
            for (int i = 1; i <= srcSheet.getLastRowNum(); i++) {
                Row srcRow = srcSheet.getRow(i);
                if (srcRow == null) continue;
                resIdx++;
                Row resRow = resSheet.createRow(resIdx);
                for (int j = 0; j < cols; j++) {
                    Cell sc = srcRow.getCell(j);
                    Cell rc = resRow.createCell(j);
                    if (sc != null) rc.setCellValue(getCellStringValue(sc));
                }
                String[] status = rowResults.get(i + 1); // results use 1-based row display (i+1)
                if (status != null) {
                    Cell sc = resRow.createCell(cols);
                    sc.setCellValue(status[0]);
                    sc.setCellStyle("SUCCESS".equals(status[0]) ? okStyle : errStyle);
                    resRow.createCell(cols + 1).setCellValue(status[1]);
                } else {
                    resRow.createCell(cols).setCellValue("SKIPPED");
                    resRow.createCell(cols + 1).setCellValue("No result recorded");
                }
            }

            for (int i = 0; i <= cols + 1; i++) resSheet.setColumnWidth(i, 5000);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            result.write(out);
            return out.toByteArray();
        }
    }

    private LocalDate parseDate(String dateStr, Cell cell) {
        if (cell != null && cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toLocalDate();
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }
}
