package com.sonar.workflow.service;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.repository.*;
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
    private final CategoryRepository categoryRepository;
    private final CorporateRepository corporateRepository;
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
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
                case "category", "categories" -> createCategoryTemplate(templatesDir);
                case "corporate", "corporates" -> createCorporateTemplate(templatesDir);
                case "branch", "branches" -> createBranchTemplate(templatesDir);
                case "department", "departments" -> createDepartmentTemplate(templatesDir);
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

    private void createCategoryTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Categories");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Active"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Categories_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createCorporateTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Corporates");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Category Code", "Type", "Contact Email", "Contact Phone", "Website", "Address", "Active"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Corporates_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createBranchTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Branches");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Branches_Template.xlsx"))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void createDepartmentTemplate(Path directory) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Departments");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Corporate Code", "Head of Department", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        try (OutputStream os = Files.newOutputStream(directory.resolve("Departments_Template.xlsx"))) {
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
            } else if (filename.contains("categor")) {
                return importCategories(file);
            } else if (filename.contains("corporate")) {
                return importCorporates(file);
            } else if (filename.contains("branch")) {
                return importBranches(file);
            } else if (filename.contains("department")) {
                return importDepartments(file);
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

    private int importCategories(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String code = getCellValue(row, 0);
                if (code == null || code.isBlank()) continue;

                Category category = categoryRepository.findByCode(code)
                        .orElse(new Category());
                category.setCode(code);
                category.setName(getCellValue(row, 1));
                category.setDescription(getCellValue(row, 2));
                category.setIsActive(getBooleanCellValue(row, 3, true));
                categoryRepository.save(category);
                count++;
            }
        }
        return count;
    }

    private int importCorporates(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String code = getCellValue(row, 0);
                if (code == null || code.isBlank()) continue;

                Corporate corporate = corporateRepository.findByCode(code)
                        .orElse(new Corporate());
                corporate.setCode(code);
                corporate.setName(getCellValue(row, 1));
                corporate.setDescription(getCellValue(row, 2));
                String categoryCode = getCellValue(row, 3);
                if (categoryCode != null && !categoryCode.isBlank()) {
                    categoryRepository.findByCode(categoryCode).ifPresent(corporate::setCategory);
                }
                String typeStr = getCellValue(row, 4);
                if (typeStr != null && !typeStr.isBlank()) {
                    try {
                        corporate.setCorporateType(CorporateType.valueOf(typeStr.toUpperCase()));
                    } catch (Exception ignored) {}
                }
                corporate.setContactEmail(getCellValue(row, 5));
                corporate.setContactPhone(getCellValue(row, 6));
                corporate.setWebsite(getCellValue(row, 7));
                corporate.setAddress(getCellValue(row, 8));
                corporate.setIsActive(getBooleanCellValue(row, 9, true));
                corporateRepository.save(corporate);
                count++;
            }
        }
        return count;
    }

    private int importBranches(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String code = getCellValue(row, 0);
                if (code == null || code.isBlank()) continue;

                Branch branch = branchRepository.findByCode(code)
                        .orElse(new Branch());
                branch.setCode(code);
                branch.setName(getCellValue(row, 1));
                branch.setDescription(getCellValue(row, 2));
                String sbuCode = getCellValue(row, 3);
                if (sbuCode != null && !sbuCode.isBlank()) {
                    sbuRepository.findByCode(sbuCode).ifPresent(branch::setSbu);
                }
                branch.setAddress(getCellValue(row, 4));
                branch.setContactEmail(getCellValue(row, 5));
                branch.setContactPhone(getCellValue(row, 6));
                branch.setIsActive(getBooleanCellValue(row, 7, true));
                branchRepository.save(branch);
                count++;
            }
        }
        return count;
    }

    private int importDepartments(File file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                String code = getCellValue(row, 0);
                if (code == null || code.isBlank()) continue;

                Department dept = departmentRepository.findByCode(code)
                        .orElse(new Department());
                dept.setCode(code);
                dept.setName(getCellValue(row, 1));
                dept.setDescription(getCellValue(row, 2));
                String corporateCode = getCellValue(row, 3);
                if (corporateCode != null && !corporateCode.isBlank()) {
                    corporateRepository.findByCode(corporateCode).ifPresent(dept::setCorporate);
                }
                dept.setHeadOfDepartment(getCellValue(row, 4));
                dept.setContactEmail(getCellValue(row, 5));
                dept.setContactPhone(getCellValue(row, 6));
                dept.setIsActive(getBooleanCellValue(row, 7, true));
                departmentRepository.save(dept);
                count++;
            }
        }
        return count;
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private boolean getBooleanCellValue(Row row, int cellIndex, boolean defaultValue) {
        String value = getCellValue(row, cellIndex);
        if (value == null || value.isBlank()) return defaultValue;
        return "true".equalsIgnoreCase(value) || "yes".equalsIgnoreCase(value) || "1".equals(value);
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
                    case "category", "categories" -> exportCategories(exportPath, timestamp);
                    case "corporate", "corporates" -> exportCorporates(exportPath, timestamp);
                    case "branch", "branches" -> exportBranches(exportPath, timestamp);
                    case "department", "departments" -> exportDepartments(exportPath, timestamp);
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

    private void exportCategories(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Categories");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Category> categories = categoryRepository.findAll();
        int rowNum = 1;
        for (Category cat : categories) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(cat.getCode());
            row.createCell(1).setCellValue(cat.getName());
            row.createCell(2).setCellValue(cat.getDescription() != null ? cat.getDescription() : "");
            row.createCell(3).setCellValue(cat.getIsActive());
        }

        String filename = "Categories_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportCorporates(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Corporates");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Category Code", "Type", "Contact Email", "Contact Phone", "Website", "Address", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Corporate> corporates = corporateRepository.findAll();
        int rowNum = 1;
        for (Corporate corp : corporates) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(corp.getCode());
            row.createCell(1).setCellValue(corp.getName());
            row.createCell(2).setCellValue(corp.getDescription() != null ? corp.getDescription() : "");
            row.createCell(3).setCellValue(corp.getCategory() != null ? corp.getCategory().getCode() : "");
            row.createCell(4).setCellValue(corp.getCorporateType() != null ? corp.getCorporateType().name() : "");
            row.createCell(5).setCellValue(corp.getContactEmail() != null ? corp.getContactEmail() : "");
            row.createCell(6).setCellValue(corp.getContactPhone() != null ? corp.getContactPhone() : "");
            row.createCell(7).setCellValue(corp.getWebsite() != null ? corp.getWebsite() : "");
            row.createCell(8).setCellValue(corp.getAddress() != null ? corp.getAddress() : "");
            row.createCell(9).setCellValue(corp.getIsActive());
        }

        String filename = "Corporates_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportBranches(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Branches");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Branch> branches = branchRepository.findAll();
        int rowNum = 1;
        for (Branch branch : branches) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(branch.getCode());
            row.createCell(1).setCellValue(branch.getName());
            row.createCell(2).setCellValue(branch.getDescription() != null ? branch.getDescription() : "");
            row.createCell(3).setCellValue(branch.getSbu() != null ? branch.getSbu().getCode() : "");
            row.createCell(4).setCellValue(branch.getAddress() != null ? branch.getAddress() : "");
            row.createCell(5).setCellValue(branch.getContactEmail() != null ? branch.getContactEmail() : "");
            row.createCell(6).setCellValue(branch.getContactPhone() != null ? branch.getContactPhone() : "");
            row.createCell(7).setCellValue(branch.getIsActive());
        }

        String filename = "Branches_" + timestamp + ".xlsx";
        try (OutputStream os = Files.newOutputStream(directory.resolve(filename))) {
            workbook.write(os);
        }
        workbook.close();
    }

    private void exportDepartments(Path directory, String timestamp) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Departments");

        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Corporate Code", "Head of Department", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<Department> departments = departmentRepository.findAll();
        int rowNum = 1;
        for (Department dept : departments) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(dept.getCode());
            row.createCell(1).setCellValue(dept.getName());
            row.createCell(2).setCellValue(dept.getDescription() != null ? dept.getDescription() : "");
            row.createCell(3).setCellValue(dept.getCorporate() != null ? dept.getCorporate().getCode() : "");
            row.createCell(4).setCellValue(dept.getHeadOfDepartment() != null ? dept.getHeadOfDepartment() : "");
            row.createCell(5).setCellValue(dept.getContactEmail() != null ? dept.getContactEmail() : "");
            row.createCell(6).setCellValue(dept.getContactPhone() != null ? dept.getContactPhone() : "");
            row.createCell(7).setCellValue(dept.getIsActive());
        }

        String filename = "Departments_" + timestamp + ".xlsx";
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

    // Public methods for direct download (returning byte arrays)
    public byte[] getTemplateBytes(String entityName) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet(entityName);
            Row headerRow = sheet.createRow(0);

            String[] headers = getHeadersForEntity(entityName);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            workbook.write(baos);
            workbook.close();
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate template for {}", entityName, e);
            throw new RuntimeException("Failed to generate template: " + e.getMessage());
        }
    }

    private String[] getHeadersForEntity(String entityName) {
        return switch (entityName.toLowerCase()) {
            case "user", "users" -> new String[]{"Username", "Email", "First Name", "Last Name", "Phone", "User Type", "Roles", "SBUs"};
            case "role", "roles" -> new String[]{"Name", "Description", "Privileges"};
            case "sbu", "sbus" -> new String[]{"Code", "Name", "Description", "Corporate Code", "Parent SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
            case "category", "categories" -> new String[]{"Code", "Name", "Description", "Active"};
            case "corporate", "corporates" -> new String[]{"Code", "Name", "Description", "Category Code", "Type", "Contact Email", "Contact Phone", "Website", "Address", "Active"};
            case "branch", "branches" -> new String[]{"Code", "Name", "Description", "SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
            case "department", "departments" -> new String[]{"Code", "Name", "Description", "Corporate Code", "Head of Department", "Contact Email", "Contact Phone", "Active"};
            case "setting", "settings" -> new String[]{"Key", "Value", "Label", "Description", "Type", "Category", "Tab"};
            default -> new String[]{};
        };
    }

    @Transactional(readOnly = true)
    public byte[] exportEntityToBytes(String entityName) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Workbook workbook = new XSSFWorkbook();

            switch (entityName.toLowerCase()) {
                case "user", "users" -> exportUsersToWorkbook(workbook);
                case "role", "roles" -> exportRolesToWorkbook(workbook);
                case "sbu", "sbus" -> exportSBUsToWorkbook(workbook);
                case "category", "categories" -> exportCategoriesToWorkbook(workbook);
                case "corporate", "corporates" -> exportCorporatesToWorkbook(workbook);
                case "branch", "branches" -> exportBranchesToWorkbook(workbook);
                case "department", "departments" -> exportDepartmentsToWorkbook(workbook);
                case "setting", "settings" -> exportSettingsToWorkbook(workbook);
            }

            workbook.write(baos);
            workbook.close();
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("Failed to export {}", entityName, e);
            throw new RuntimeException("Failed to export: " + e.getMessage());
        }
    }

    private void exportUsersToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Users");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Username", "Email", "First Name", "Last Name", "Phone", "User Type", "Active", "Locked", "Roles", "SBUs"};
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
            row.createCell(4).setCellValue(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
            row.createCell(5).setCellValue(user.getUserType().name());
            row.createCell(6).setCellValue(user.getIsActive());
            row.createCell(7).setCellValue(user.getIsLocked());
            row.createCell(8).setCellValue(String.join(",", user.getRoles().stream().map(Role::getName).toList()));
            row.createCell(9).setCellValue(String.join(",", user.getSbus().stream().map(SBU::getCode).toList()));
        }
    }

    private void exportRolesToWorkbook(Workbook workbook) {
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
            row.createCell(1).setCellValue(role.getDescription() != null ? role.getDescription() : "");
            row.createCell(2).setCellValue(role.getIsSystemRole());
            row.createCell(3).setCellValue(String.join(",", role.getPrivileges().stream().map(Privilege::getName).toList()));
        }
    }

    private void exportSBUsToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("SBUs");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Corporate Code", "Parent SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<SBU> sbus = sbuRepository.findAll();
        int rowNum = 1;
        for (SBU sbu : sbus) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(sbu.getCode());
            row.createCell(1).setCellValue(sbu.getName());
            row.createCell(2).setCellValue(sbu.getDescription() != null ? sbu.getDescription() : "");
            row.createCell(3).setCellValue(sbu.getCorporate() != null ? sbu.getCorporate().getCode() : "");
            row.createCell(4).setCellValue(sbu.getParent() != null ? sbu.getParent().getCode() : "");
            row.createCell(5).setCellValue(sbu.getAddress() != null ? sbu.getAddress() : "");
            row.createCell(6).setCellValue(sbu.getContactEmail() != null ? sbu.getContactEmail() : "");
            row.createCell(7).setCellValue(sbu.getContactPhone() != null ? sbu.getContactPhone() : "");
            row.createCell(8).setCellValue(sbu.getIsActive());
        }
    }

    private void exportCategoriesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Categories");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<Category> categories = categoryRepository.findAll();
        int rowNum = 1;
        for (Category cat : categories) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(cat.getCode());
            row.createCell(1).setCellValue(cat.getName());
            row.createCell(2).setCellValue(cat.getDescription() != null ? cat.getDescription() : "");
            row.createCell(3).setCellValue(cat.getIsActive());
        }
    }

    private void exportCorporatesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Corporates");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Category Code", "Type", "Contact Email", "Contact Phone", "Website", "Address", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<Corporate> corporates = corporateRepository.findAll();
        int rowNum = 1;
        for (Corporate corp : corporates) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(corp.getCode());
            row.createCell(1).setCellValue(corp.getName());
            row.createCell(2).setCellValue(corp.getDescription() != null ? corp.getDescription() : "");
            row.createCell(3).setCellValue(corp.getCategory() != null ? corp.getCategory().getCode() : "");
            row.createCell(4).setCellValue(corp.getCorporateType() != null ? corp.getCorporateType().name() : "");
            row.createCell(5).setCellValue(corp.getContactEmail() != null ? corp.getContactEmail() : "");
            row.createCell(6).setCellValue(corp.getContactPhone() != null ? corp.getContactPhone() : "");
            row.createCell(7).setCellValue(corp.getWebsite() != null ? corp.getWebsite() : "");
            row.createCell(8).setCellValue(corp.getAddress() != null ? corp.getAddress() : "");
            row.createCell(9).setCellValue(corp.getIsActive());
        }
    }

    private void exportBranchesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Branches");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "SBU Code", "Address", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<Branch> branches = branchRepository.findAll();
        int rowNum = 1;
        for (Branch branch : branches) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(branch.getCode());
            row.createCell(1).setCellValue(branch.getName());
            row.createCell(2).setCellValue(branch.getDescription() != null ? branch.getDescription() : "");
            row.createCell(3).setCellValue(branch.getSbu() != null ? branch.getSbu().getCode() : "");
            row.createCell(4).setCellValue(branch.getAddress() != null ? branch.getAddress() : "");
            row.createCell(5).setCellValue(branch.getContactEmail() != null ? branch.getContactEmail() : "");
            row.createCell(6).setCellValue(branch.getContactPhone() != null ? branch.getContactPhone() : "");
            row.createCell(7).setCellValue(branch.getIsActive());
        }
    }

    private void exportDepartmentsToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Departments");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Code", "Name", "Description", "Corporate Code", "Head of Department", "Contact Email", "Contact Phone", "Active"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<Department> departments = departmentRepository.findAll();
        int rowNum = 1;
        for (Department dept : departments) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(dept.getCode());
            row.createCell(1).setCellValue(dept.getName());
            row.createCell(2).setCellValue(dept.getDescription() != null ? dept.getDescription() : "");
            row.createCell(3).setCellValue(dept.getCorporate() != null ? dept.getCorporate().getCode() : "");
            row.createCell(4).setCellValue(dept.getHeadOfDepartment() != null ? dept.getHeadOfDepartment() : "");
            row.createCell(5).setCellValue(dept.getContactEmail() != null ? dept.getContactEmail() : "");
            row.createCell(6).setCellValue(dept.getContactPhone() != null ? dept.getContactPhone() : "");
            row.createCell(7).setCellValue(dept.getIsActive());
        }
    }

    private void exportSettingsToWorkbook(Workbook workbook) {
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
            row.createCell(3).setCellValue(setting.getDescription() != null ? setting.getDescription() : "");
            row.createCell(4).setCellValue(setting.getType() != null ? setting.getType().name() : "");
            row.createCell(5).setCellValue(setting.getCategory() != null ? setting.getCategory() : "");
            row.createCell(6).setCellValue(setting.getTab());
        }
    }

    @Transactional
    public int importFromStream(String entityName, InputStream inputStream) {
        try {
            // Create temp file
            Path tempFile = Files.createTempFile(entityName + "_import_", ".xlsx");
            Files.copy(inputStream, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            int count = importFile(tempFile.toFile());
            Files.deleteIfExists(tempFile);
            return count;
        } catch (IOException e) {
            log.error("Failed to import {}", entityName, e);
            throw new RuntimeException("Failed to import: " + e.getMessage());
        }
    }
}
