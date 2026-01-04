package com.sonarworks.workflow.service;

import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportExportService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PrivilegeRepository privilegeRepository;
    private final SBURepository sbuRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final SettingRepository settingRepository;
    private final AuditService auditService;

    @Value("${app.storage.templates-path}")
    private String templatesPath;

    @Value("${app.storage.imports-path}")
    private String importsPath;

    @Value("${app.storage.exports-path}")
    private String exportsPath;

    public void createTemplates() {
        try {
            Path templatesDir = Paths.get(templatesPath);
            Files.createDirectories(templatesDir);

            createUserTemplate(templatesDir);
            createRoleTemplate(templatesDir);
            createSBUTemplate(templatesDir);
            createSettingTemplate(templatesDir);

            // Create workflow-specific templates
            List<Workflow> workflows = workflowRepository.findAll();
            for (Workflow workflow : workflows) {
                createWorkflowTemplate(templatesDir, workflow);
            }

            log.info("Templates created successfully in {}", templatesPath);
        } catch (IOException e) {
            log.error("Failed to create templates", e);
            throw new RuntimeException("Failed to create templates: " + e.getMessage());
        }
    }

    public void createEntityTemplate(String entityName) {
        try {
            Path templatesDir = Paths.get(templatesPath);
            Files.createDirectories(templatesDir);

            switch (entityName.toLowerCase()) {
                case "user", "users" -> createUserTemplate(templatesDir);
                case "role", "roles" -> createRoleTemplate(templatesDir);
                case "sbu", "sbus" -> createSBUTemplate(templatesDir);
                case "setting", "settings" -> createSettingTemplate(templatesDir);
                default -> {
                    workflowRepository.findByCode(entityName).ifPresent(workflow ->
                            createWorkflowTemplate(templatesDir, workflow));
                }
            }
        } catch (IOException e) {
            log.error("Failed to create template for {}", entityName, e);
            throw new RuntimeException("Failed to create template: " + e.getMessage());
        }
    }

    private void createUserTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Users");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Username", "Email", "First Name", "Last Name", "Phone", "User Type", "Roles", "SBUs"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Users_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createRoleTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Roles");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Name", "Description", "Privileges"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Roles_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createSBUTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SBUs");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Parent Code", "Address", "Contact Email", "Contact Phone"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("SBUs_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createSettingTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Settings");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Key", "Value", "Label", "Description", "Type", "Category", "Tab"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Settings_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createWorkflowTemplate(Path directory, Workflow workflow) {
        try {
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet(workflow.getName());

            Row headerRow = sheet.createRow(0);
            List<WorkflowField> fields = workflow.getForms().stream()
                    .flatMap(form -> form.getFields().stream())
                    .sorted(Comparator.comparing(WorkflowField::getDisplayOrder))
                    .toList();

            for (int i = 0; i < fields.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(fields.get(i).getLabel());
            }

            String filename = workflow.getCode() + "_Template.xlsx";
            try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
                workbook.write(os);
            }
            workbook.close();
        } catch (IOException e) {
            log.error("Failed to create workflow template for {}", workflow.getName(), e);
        }
    }

    @Transactional
    public int importFromFolder(String folder) {
        Path importPath = folder != null ? Paths.get(folder) : Paths.get(importsPath);
        int totalImported = 0;

        try {
            if (!Files.exists(importPath)) {
                log.warn("Import folder does not exist: {}", importPath);
                return 0;
            }

            for (File file : Objects.requireNonNull(importPath.toFile().listFiles((dir, name) -> name.endsWith(".xlsx")))) {
                totalImported += importFile(file);
            }
        } catch (Exception e) {
            log.error("Failed to import from folder", e);
        }

        return totalImported;
    }

    @Transactional
    public int importEntities(List<String> entities, String folder) {
        Path importPath = folder != null ? Paths.get(folder) : Paths.get(importsPath);
        int totalImported = 0;

        for (String entity : entities) {
            String filename = entity + ".xlsx";
            Path filePath = importPath.resolve(filename);
            if (Files.exists(filePath)) {
                totalImported += importFile(filePath.toFile());
            }
        }

        return totalImported;
    }

    private int importFile(File file) {
        String filename = file.getName().toLowerCase();
        try {
            if (filename.contains("user")) {
                return importUsers(file);
            } else if (filename.contains("role")) {
                return importRoles(file);
            } else if (filename.contains("sbu")) {
                return importSBUs(file);
            } else if (filename.contains("setting")) {
                return importSettings(file);
            }
        } catch (Exception e) {
            log.error("Failed to import file: {}", file.getName(), e);
        }
        return 0;
    }

    private int importUsers(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                // Import logic here
                count++;
            }
        }
        return count;
    }

    private int importRoles(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                // Import logic here
                count++;
            }
        }
        return count;
    }

    private int importSBUs(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                // Import logic here
                count++;
            }
        }
        return count;
    }

    private int importSettings(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                // Import logic here
                count++;
            }
        }
        return count;
    }

    public String exportAll(String folder) {
        Path exportPath = folder != null ? Paths.get(folder) : Paths.get(exportsPath);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        try {
            Files.createDirectories(exportPath);

            exportUsers(exportPath, timestamp);
            exportRoles(exportPath, timestamp);
            exportSBUs(exportPath, timestamp);
            exportSettings(exportPath, timestamp);

            // Export workflows
            List<Workflow> workflows = workflowRepository.findAll();
            for (Workflow workflow : workflows) {
                exportWorkflowData(exportPath, workflow, timestamp);
            }

            auditService.log(AuditLog.AuditAction.EXPORT, "System", null,
                    "All", "Exported all entities to " + exportPath, null, null);

            return exportPath.toString();
        } catch (IOException e) {
            log.error("Failed to export all", e);
            throw new RuntimeException("Failed to export: " + e.getMessage());
        }
    }

    public String exportEntities(List<String> entities, String folder) {
        Path exportPath = folder != null ? Paths.get(folder) : Paths.get(exportsPath);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        try {
            Files.createDirectories(exportPath);

            for (String entity : entities) {
                switch (entity.toLowerCase()) {
                    case "user", "users" -> exportUsers(exportPath, timestamp);
                    case "role", "roles" -> exportRoles(exportPath, timestamp);
                    case "sbu", "sbus" -> exportSBUs(exportPath, timestamp);
                    case "setting", "settings" -> exportSettings(exportPath, timestamp);
                }
            }

            return exportPath.toString();
        } catch (IOException e) {
            log.error("Failed to export entities", e);
            throw new RuntimeException("Failed to export: " + e.getMessage());
        }
    }

    private void exportUsers(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Users");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Username", "Email", "First Name", "Last Name", "Phone", "User Type", "Active", "Locked"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<User> users = userRepository.findAll();
        int rowNum = 1;
        for (User user : users) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(user.getUsername());
            row.createCell(1).setCellValue(user.getEmail());
            row.createCell(2).setCellValue(user.getFirstName());
            row.createCell(3).setCellValue(user.getLastName());
            row.createCell(4).setCellValue(user.getPhoneNumber());
            row.createCell(5).setCellValue(user.getUserType().name());
            row.createCell(6).setCellValue(user.getIsActive());
            row.createCell(7).setCellValue(user.getIsLocked());
        }

        String filename = "Users_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportRoles(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Roles");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Name", "Description", "System Role", "Privileges"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Role> roles = roleRepository.findAll();
        int rowNum = 1;
        for (Role role : roles) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(role.getName());
            row.createCell(1).setCellValue(role.getDescription());
            row.createCell(2).setCellValue(role.getIsSystemRole());
            row.createCell(3).setCellValue(String.join(",",
                    role.getPrivileges().stream().map(Privilege::getName).toList()));
        }

        String filename = "Roles_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportSBUs(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SBUs");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Parent Code", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<SBU> sbus = sbuRepository.findAll();
        int rowNum = 1;
        for (SBU sbu : sbus) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(sbu.getCode());
            row.createCell(1).setCellValue(sbu.getName());
            row.createCell(2).setCellValue(sbu.getDescription());
            row.createCell(3).setCellValue(sbu.getParent() != null ? sbu.getParent().getCode() : "");
            row.createCell(4).setCellValue(sbu.getIsActive());
        }

        String filename = "SBUs_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportSettings(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Settings");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Key", "Value", "Label", "Description", "Type", "Category", "Tab"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Setting> settings = settingRepository.findAll();
        int rowNum = 1;
        for (Setting setting : settings) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(setting.getKey());
            row.createCell(1).setCellValue(setting.getIsEncrypted() ? "********" : setting.getValue());
            row.createCell(2).setCellValue(setting.getLabel());
            row.createCell(3).setCellValue(setting.getDescription());
            row.createCell(4).setCellValue(setting.getType() != null ? setting.getType().name() : "");
            row.createCell(5).setCellValue(setting.getCategory());
            row.createCell(6).setCellValue(setting.getTab());
        }

        String filename = "Settings_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportWorkflowData(Path directory, Workflow workflow, String timestamp) throws IOException {
        // Export workflow instances
        List<WorkflowInstance> instances = workflowInstanceRepository.findByWorkflowId(
                workflow.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();

        if (instances.isEmpty()) return;

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet(workflow.getName());

        // Create headers from workflow fields
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Reference Number");
        headerRow.createCell(1).setCellValue("Status");
        headerRow.createCell(2).setCellValue("Initiator");
        headerRow.createCell(3).setCellValue("Submitted At");

        int colNum = 4;
        List<WorkflowField> fields = workflow.getForms().stream()
                .flatMap(form -> form.getFields().stream())
                .sorted(Comparator.comparing(WorkflowField::getDisplayOrder))
                .toList();

        for (WorkflowField field : fields) {
            headerRow.createCell(colNum++).setCellValue(field.getLabel());
        }

        // Export data
        int rowNum = 1;
        for (WorkflowInstance instance : instances) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(instance.getReferenceNumber());
            row.createCell(1).setCellValue(instance.getStatus().name());
            row.createCell(2).setCellValue(instance.getInitiator().getFullName());
            row.createCell(3).setCellValue(instance.getSubmittedAt() != null ?
                    instance.getSubmittedAt().toString() : "");

            Map<String, String> fieldValues = instance.getFieldValues().stream()
                    .collect(java.util.stream.Collectors.toMap(
                            WorkflowFieldValue::getFieldName,
                            v -> v.getValue() != null ? v.getValue() : ""
                    ));

            colNum = 4;
            for (WorkflowField field : fields) {
                row.createCell(colNum++).setCellValue(fieldValues.getOrDefault(field.getName(), ""));
            }
        }

        String filename = workflow.getCode() + "_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }
}
