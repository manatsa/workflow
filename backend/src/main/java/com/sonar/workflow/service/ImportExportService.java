package com.sonar.workflow.service;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.repository.*;
import com.sonar.workflow.deadlines.entity.*;
import com.sonar.workflow.deadlines.repository.*;
import com.sonar.workflow.leave.entity.*;
import com.sonar.workflow.leave.repository.*;
import com.sonar.workflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sonar.workflow.dto.ImportResultDTO;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    private final WorkflowFieldRepository workflowFieldRepository;
    private final WorkflowFieldValueRepository workflowFieldValueRepository;
    private final SettingRepository settingRepository;
    private final CategoryRepository categoryRepository;
    private final CorporateRepository corporateRepository;
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final DeadlineItemRepository deadlineItemRepository;
    private final DeadlineCategoryRepository deadlineCategoryRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final PublicHolidayRepository publicHolidayRepository;
    private final LeaveRequestRepository leaveRequestRepository;

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
        String[] headers = getHeadersForEntity("users");
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
        String[] headers = getHeadersForEntity("roles");
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
        String[] headers = getHeadersForEntity("sbus");
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
        String[] headers = getHeadersForEntity("settings");
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
        String[] headers = getHeadersForEntity("categories");
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
        String[] headers = getHeadersForEntity("corporates");
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
        String[] headers = getHeadersForEntity("branches");
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
        String[] headers = getHeadersForEntity("departments");
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
                ImportResultDTO result = importFile(file);
                totalImported += result.getSuccessCount();
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
                ImportResultDTO result = importFile(filePath.toFile());
                totalImported += result.getSuccessCount();
            }
        }

        return totalImported;
    }

    private ImportResultDTO importFile(File file) {
        String filename = file.getName().toLowerCase();
        try {
            if (filename.contains("user")) {
                return importUsers(file);
            } else if (filename.contains("privilege")) {
                return importPrivileges(file);
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
            } else if (filename.contains("deadline")) {
                return importDeadlines(file);
            } else if (filename.contains("leavetype") || filename.contains("leave_type") || filename.contains("leave-type")) {
                return importLeaveTypes(file);
            } else if (filename.contains("leavebalance") || filename.contains("leave_balance") || filename.contains("leave-balance")) {
                return importLeaveBalances(file);
            } else if (filename.contains("leaverequest") || filename.contains("leave_request") || filename.contains("leave-request")) {
                return importLeaveRequests(file);
            } else if (filename.contains("holiday")) {
                return importHolidays(file);
            }
        } catch (Exception e) {
            log.error("Failed to import file: {}", file.getName(), e);
            ImportResultDTO result = new ImportResultDTO();
            result.getErrors().add("File error: " + e.getMessage());
            result.setErrorCount(1);
            return result;
        }
        ImportResultDTO result = new ImportResultDTO();
        result.getErrors().add("Unsupported entity type for file: " + file.getName());
        result.setErrorCount(1);
        return result;
    }

    private ImportResultDTO importUsers(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1; // 1-based for display (Excel row number)
                try {
                    String username = getCellValue(row, 0);
                    if (username == null || username.isBlank()) {
                        result.addError(rowNum, "Username is required");
                        continue;
                    }

                    String email = getCellValue(row, 1);
                    if (email == null || email.isBlank()) {
                        result.addError(rowNum, "Email is required for user '" + username + "'");
                        continue;
                    }

                    String password = getCellValue(row, 2);

                    // Check for duplicate username (only for new users)
                    Optional<User> existingUser = userRepository.findByUsername(username);
                    User user;
                    if (existingUser.isPresent()) {
                        user = existingUser.get();
                        // If password provided on existing user, update it
                        if (password != null && !password.isBlank()) {
                            user.setPassword(passwordEncoder.encode(password));
                            user.setMustChangePassword(true);
                        }
                    } else {
                        // Check email uniqueness for new users
                        if (userRepository.existsByEmail(email)) {
                            result.addError(rowNum, "Email '" + email + "' is already in use by another user");
                            continue;
                        }
                        user = new User();
                        user.setUsername(username);
                        String tempPassword = (password != null && !password.isBlank()) ? password : "TempPassword123!";
                        user.setPassword(passwordEncoder.encode(tempPassword));
                        user.setMustChangePassword(true);
                    }

                    boolean isExisting = existingUser.isPresent();
                    String firstName = getCellValue(row, 3);
                    String lastName = getCellValue(row, 4);
                    log.info("Row {}: username={}, email={}, firstName='{}', lastName='{}', existing={}, cellCount={}",
                            rowNum, username, email, firstName, lastName, isExisting, row.getLastCellNum());

                    if (isExisting) {
                        // Only update fields that are currently empty on the existing user
                        setIfEmpty(user.getEmail(), email, user::setEmail);
                        setIfEmpty(user.getFirstName(), firstName, user::setFirstName);
                        setIfEmpty(user.getLastName(), lastName, user::setLastName);
                        setIfEmpty(user.getPhoneNumber(), getCellValue(row, 5), user::setPhoneNumber);
                        setIfEmpty(user.getStaffId(), getCellValue(row, 6), user::setStaffId);
                        setIfEmpty(user.getDepartment(), getCellValue(row, 7), user::setDepartment);
                    } else {
                        user.setEmail(email);
                        user.setFirstName(firstName);
                        user.setLastName(lastName);
                        user.setPhoneNumber(getCellValue(row, 5));
                        user.setStaffId(getCellValue(row, 6));
                        user.setDepartment(getCellValue(row, 7));
                    }

                    String userTypeStr = getCellValue(row, 8);
                    if (userTypeStr != null && !userTypeStr.isBlank()) {
                        if (!isExisting || user.getUserType() == null) {
                            try {
                                user.setUserType(User.UserType.valueOf(userTypeStr.toUpperCase()));
                            } catch (IllegalArgumentException e) {
                                result.addError(rowNum, "Invalid user type '" + userTypeStr + "' for user '" + username + "'. Valid types: SYSTEM, STAFF, MANAGER, EXTERNAL");
                                continue;
                            }
                        }
                    } else if (!isExisting) {
                        user.setUserType(User.UserType.STAFF);
                    }

                    // Parse roles (comma-separated role names)
                    String rolesStr = getCellValue(row, 9);
                    if (rolesStr != null && !rolesStr.isBlank()) {
                        if (!isExisting || user.getRoles() == null || user.getRoles().isEmpty()) {
                            Set<Role> roles = new HashSet<>();
                            List<String> invalidRoles = new ArrayList<>();
                            for (String roleName : rolesStr.split(",")) {
                                String trimmed = roleName.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<Role> role = roleRepository.findByName(trimmed);
                                    if (role.isPresent()) {
                                        roles.add(role.get());
                                    } else {
                                        invalidRoles.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidRoles.isEmpty()) {
                                result.addError(rowNum, "Role(s) not found for user '" + username + "': " + String.join(", ", invalidRoles));
                                continue;
                            }
                            user.setRoles(roles);
                        }
                    }

                    // Parse Corporates (comma-separated corporate codes)
                    String corporatesStr = getCellValue(row, 10);
                    if (corporatesStr != null && !corporatesStr.isBlank()) {
                        if (!isExisting || user.getCorporates() == null || user.getCorporates().isEmpty()) {
                            Set<Corporate> corporates = new HashSet<>();
                            List<String> invalidCorporates = new ArrayList<>();
                            for (String corpCode : corporatesStr.split(",")) {
                                String trimmed = corpCode.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<Corporate> corp = corporateRepository.findByCode(trimmed);
                                    if (corp.isPresent()) {
                                        corporates.add(corp.get());
                                    } else {
                                        invalidCorporates.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidCorporates.isEmpty()) {
                                result.addError(rowNum, "Corporate(s) not found for user '" + username + "': " + String.join(", ", invalidCorporates));
                                continue;
                            }
                            user.setCorporates(corporates);
                        }
                    }

                    // Parse SBUs (comma-separated SBU codes)
                    String sbusStr = getCellValue(row, 11);
                    if (sbusStr != null && !sbusStr.isBlank()) {
                        if (!isExisting || user.getSbus() == null || user.getSbus().isEmpty()) {
                            Set<SBU> sbus = new HashSet<>();
                            List<String> invalidSbus = new ArrayList<>();
                            for (String sbuCode : sbusStr.split(",")) {
                                String trimmed = sbuCode.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<SBU> sbu = sbuRepository.findByCode(trimmed);
                                    if (sbu.isPresent()) {
                                        sbus.add(sbu.get());
                                    } else {
                                        invalidSbus.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidSbus.isEmpty()) {
                                result.addError(rowNum, "SBU(s) not found for user '" + username + "': " + String.join(", ", invalidSbus));
                                continue;
                            }
                            user.setSbus(sbus);
                        }
                    }

                    // Parse Branches (comma-separated branch codes)
                    String branchesStr = getCellValue(row, 12);
                    if (branchesStr != null && !branchesStr.isBlank()) {
                        if (!isExisting || user.getBranches() == null || user.getBranches().isEmpty()) {
                            Set<Branch> branches = new HashSet<>();
                            List<String> invalidBranches = new ArrayList<>();
                            for (String branchCode : branchesStr.split(",")) {
                                String trimmed = branchCode.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<Branch> branch = branchRepository.findByCode(trimmed);
                                    if (branch.isPresent()) {
                                        branches.add(branch.get());
                                    } else {
                                        invalidBranches.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidBranches.isEmpty()) {
                                result.addError(rowNum, "Branch(es) not found for user '" + username + "': " + String.join(", ", invalidBranches));
                                continue;
                            }
                            user.setBranches(branches);
                        }
                    }

                    // Parse Departments (comma-separated department codes)
                    String departmentsStr = getCellValue(row, 13);
                    if (departmentsStr != null && !departmentsStr.isBlank()) {
                        if (!isExisting || user.getDepartments() == null || user.getDepartments().isEmpty()) {
                            Set<Department> departments = new HashSet<>();
                            List<String> invalidDepartments = new ArrayList<>();
                            for (String deptCode : departmentsStr.split(",")) {
                                String trimmed = deptCode.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<Department> dept = departmentRepository.findByCode(trimmed);
                                    if (dept.isPresent()) {
                                        departments.add(dept.get());
                                    } else {
                                        invalidDepartments.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidDepartments.isEmpty()) {
                                result.addError(rowNum, "Department(s) not found for user '" + username + "': " + String.join(", ", invalidDepartments));
                                continue;
                            }
                            user.setDepartments(departments);
                        }
                    }

                    userRepository.save(user);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importRoles(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String name = getCellValue(row, 0);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Role name is required");
                        continue;
                    }

                    Optional<Role> existingRole = roleRepository.findByName(name);
                    Role role = existingRole.orElse(new Role());
                    boolean isExistingRole = existingRole.isPresent();
                    role.setName(name);

                    if (isExistingRole) {
                        setIfEmpty(role.getDescription(), getCellValue(row, 1), role::setDescription);
                    } else {
                        role.setDescription(getCellValue(row, 1));
                    }

                    // Parse privileges (comma-separated)
                    String privilegesStr = getCellValue(row, 2);
                    if (privilegesStr != null && !privilegesStr.isBlank()) {
                        if (!isExistingRole || role.getPrivileges() == null || role.getPrivileges().isEmpty()) {
                            Set<Privilege> privileges = new HashSet<>();
                            List<String> invalidPrivileges = new ArrayList<>();
                            for (String privName : privilegesStr.split(",")) {
                                String trimmed = privName.trim();
                                if (!trimmed.isEmpty()) {
                                    Optional<Privilege> priv = privilegeRepository.findByName(trimmed);
                                    if (priv.isPresent()) {
                                        privileges.add(priv.get());
                                    } else {
                                        invalidPrivileges.add(trimmed);
                                    }
                                }
                            }
                            if (!invalidPrivileges.isEmpty()) {
                                result.addError(rowNum, "Privilege(s) not found for role '" + name + "': " + String.join(", ", invalidPrivileges));
                                continue;
                            }
                            role.setPrivileges(privileges);
                        }
                    }

                    roleRepository.save(role);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importPrivileges(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String name = getCellValue(row, 0);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Privilege name is required");
                        continue;
                    }

                    Optional<Privilege> existingPriv = privilegeRepository.findByName(name);
                    Privilege privilege = existingPriv.orElse(new Privilege());
                    boolean isExisting = existingPriv.isPresent();
                    privilege.setName(name);

                    if (isExisting) {
                        setIfEmpty(privilege.getDescription(), getCellValue(row, 1), privilege::setDescription);
                        setIfEmpty(privilege.getCategory(), getCellValue(row, 2), privilege::setCategory);
                    } else {
                        privilege.setDescription(getCellValue(row, 1));
                        privilege.setCategory(getCellValue(row, 2));
                        privilege.setIsSystemPrivilege(getBooleanCellValue(row, 3, false));
                    }

                    privilegeRepository.save(privilege);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importSBUs(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String code = getCellValue(row, 0);
                    if (code == null || code.isBlank()) continue;

                    String name = getCellValue(row, 1);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "SBU name is required for code '" + code + "'");
                        continue;
                    }

                    Optional<SBU> existingSbu = sbuRepository.findByCode(code);
                    SBU sbu = existingSbu.orElse(new SBU());
                    boolean isExistingSbu = existingSbu.isPresent();
                    sbu.setCode(code);

                    if (isExistingSbu) {
                        setIfEmpty(sbu.getName(), name, sbu::setName);
                        setIfEmpty(sbu.getDescription(), getCellValue(row, 2), sbu::setDescription);
                    } else {
                        sbu.setName(name);
                        sbu.setDescription(getCellValue(row, 2));
                    }

                    String corporateCode = getCellValue(row, 3);
                    if (corporateCode != null && !corporateCode.isBlank()) {
                        if (!isExistingSbu || sbu.getCorporate() == null) {
                            Optional<Corporate> corp = corporateRepository.findByCode(corporateCode);
                            if (corp.isEmpty()) {
                                result.addError(rowNum, "Corporate not found with code '" + corporateCode + "' for SBU '" + code + "'");
                                continue;
                            }
                            sbu.setCorporate(corp.get());
                        }
                    }

                    String parentCode = getCellValue(row, 4);
                    if (parentCode != null && !parentCode.isBlank()) {
                        if (!isExistingSbu || sbu.getParent() == null) {
                            Optional<SBU> parent = sbuRepository.findByCode(parentCode);
                            if (parent.isEmpty()) {
                                result.addError(rowNum, "Parent SBU not found with code '" + parentCode + "' for SBU '" + code + "'");
                                continue;
                            }
                            sbu.setParent(parent.get());
                        }
                    }

                    if (isExistingSbu) {
                        setIfEmpty(sbu.getAddress(), getCellValue(row, 5), sbu::setAddress);
                        setIfEmpty(sbu.getContactEmail(), getCellValue(row, 6), sbu::setContactEmail);
                        setIfEmpty(sbu.getContactPhone(), getCellValue(row, 7), sbu::setContactPhone);
                    } else {
                        sbu.setAddress(getCellValue(row, 5));
                        sbu.setContactEmail(getCellValue(row, 6));
                        sbu.setContactPhone(getCellValue(row, 7));
                        sbu.setIsActive(getBooleanCellValue(row, 8, true));
                    }

                    sbuRepository.save(sbu);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importSettings(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String key = getCellValue(row, 0);
                    if (key == null || key.isBlank()) continue;

                    Optional<Setting> existing = settingRepository.findByKey(key);
                    if (existing.isEmpty()) {
                        result.addError(rowNum, "Setting with key '" + key + "' does not exist");
                        continue;
                    }

                    Setting setting = existing.get();
                    String value = getCellValue(row, 1);
                    if (value != null && !value.equals("********")) {
                        setting.setValue(value);
                    }

                    settingRepository.save(setting);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importCategories(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String code = getCellValue(row, 0);
                    if (code == null || code.isBlank()) continue;

                    String name = getCellValue(row, 1);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Name is required for category code '" + code + "'");
                        continue;
                    }

                    Optional<Category> existingCat = categoryRepository.findByCode(code);
                    Category category = existingCat.orElse(new Category());
                    boolean isExistingCat = existingCat.isPresent();
                    category.setCode(code);

                    if (isExistingCat) {
                        setIfEmpty(category.getName(), name, category::setName);
                        setIfEmpty(category.getDescription(), getCellValue(row, 2), category::setDescription);
                    } else {
                        category.setName(name);
                        category.setDescription(getCellValue(row, 2));
                        category.setIsActive(getBooleanCellValue(row, 3, true));
                    }
                    categoryRepository.save(category);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importCorporates(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String code = getCellValue(row, 0);
                    if (code == null || code.isBlank()) continue;

                    String name = getCellValue(row, 1);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Name is required for corporate code '" + code + "'");
                        continue;
                    }

                    Optional<Corporate> existingCorp = corporateRepository.findByCode(code);
                    Corporate corporate = existingCorp.orElse(new Corporate());
                    boolean isExistingCorp = existingCorp.isPresent();
                    corporate.setCode(code);

                    if (isExistingCorp) {
                        setIfEmpty(corporate.getName(), name, corporate::setName);
                        setIfEmpty(corporate.getDescription(), getCellValue(row, 2), corporate::setDescription);
                    } else {
                        corporate.setName(name);
                        corporate.setDescription(getCellValue(row, 2));
                    }

                    String categoryCode = getCellValue(row, 3);
                    if (categoryCode != null && !categoryCode.isBlank()) {
                        if (!isExistingCorp || corporate.getCategory() == null) {
                            Optional<Category> cat = categoryRepository.findByCode(categoryCode);
                            if (cat.isEmpty()) {
                                result.addError(rowNum, "Category not found with code '" + categoryCode + "' for corporate '" + code + "'");
                                continue;
                            }
                            corporate.setCategory(cat.get());
                        }
                    }
                    String typeStr = getCellValue(row, 4);
                    if (typeStr != null && !typeStr.isBlank()) {
                        if (!isExistingCorp || corporate.getCorporateType() == null) {
                            try {
                                corporate.setCorporateType(CorporateType.valueOf(typeStr.toUpperCase()));
                            } catch (IllegalArgumentException e) {
                                result.addError(rowNum, "Invalid corporate type '" + typeStr + "' for corporate '" + code + "'");
                                continue;
                            }
                        }
                    }

                    if (isExistingCorp) {
                        setIfEmpty(corporate.getContactEmail(), getCellValue(row, 5), corporate::setContactEmail);
                        setIfEmpty(corporate.getContactPhone(), getCellValue(row, 6), corporate::setContactPhone);
                        setIfEmpty(corporate.getWebsite(), getCellValue(row, 7), corporate::setWebsite);
                        setIfEmpty(corporate.getAddress(), getCellValue(row, 8), corporate::setAddress);
                    } else {
                        corporate.setContactEmail(getCellValue(row, 5));
                        corporate.setContactPhone(getCellValue(row, 6));
                        corporate.setWebsite(getCellValue(row, 7));
                        corporate.setAddress(getCellValue(row, 8));
                        corporate.setIsActive(getBooleanCellValue(row, 9, true));
                    }
                    corporateRepository.save(corporate);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importBranches(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String code = getCellValue(row, 0);
                    if (code == null || code.isBlank()) continue;

                    String name = getCellValue(row, 1);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Name is required for branch code '" + code + "'");
                        continue;
                    }

                    Optional<Branch> existingBranch = branchRepository.findByCode(code);
                    Branch branch = existingBranch.orElse(new Branch());
                    boolean isExistingBranch = existingBranch.isPresent();
                    branch.setCode(code);

                    if (isExistingBranch) {
                        setIfEmpty(branch.getName(), name, branch::setName);
                        setIfEmpty(branch.getDescription(), getCellValue(row, 2), branch::setDescription);
                    } else {
                        branch.setName(name);
                        branch.setDescription(getCellValue(row, 2));
                    }

                    String sbuCode = getCellValue(row, 3);
                    if (sbuCode != null && !sbuCode.isBlank()) {
                        if (!isExistingBranch || branch.getSbu() == null) {
                            Optional<SBU> sbu = sbuRepository.findByCode(sbuCode);
                            if (sbu.isEmpty()) {
                                result.addError(rowNum, "SBU not found with code '" + sbuCode + "' for branch '" + code + "'");
                                continue;
                            }
                            branch.setSbu(sbu.get());
                        }
                    } else if (!isExistingBranch) {
                        result.addError(rowNum, "SBU Code is required for new branch '" + code + "'");
                        continue;
                    }

                    if (isExistingBranch) {
                        setIfEmpty(branch.getAddress(), getCellValue(row, 4), branch::setAddress);
                        setIfEmpty(branch.getContactEmail(), getCellValue(row, 5), branch::setContactEmail);
                        setIfEmpty(branch.getContactPhone(), getCellValue(row, 6), branch::setContactPhone);
                    } else {
                        branch.setAddress(getCellValue(row, 4));
                        branch.setContactEmail(getCellValue(row, 5));
                        branch.setContactPhone(getCellValue(row, 6));
                        branch.setIsActive(getBooleanCellValue(row, 7, true));
                    }
                    branchRepository.save(branch);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private ImportResultDTO importDepartments(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            if (!rowIterator.hasNext()) {
                result.getErrors().add("File is empty or has no header row");
                result.setErrorCount(1);
                return result;
            }
            rowIterator.next(); // Skip header

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String code = getCellValue(row, 0);
                    if (code == null || code.isBlank()) continue;

                    String name = getCellValue(row, 1);
                    if (name == null || name.isBlank()) {
                        result.addError(rowNum, "Name is required for department code '" + code + "'");
                        continue;
                    }

                    Optional<Department> existingDept = departmentRepository.findByCode(code);
                    Department dept = existingDept.orElse(new Department());
                    boolean isExistingDept = existingDept.isPresent();
                    dept.setCode(code);

                    if (isExistingDept) {
                        setIfEmpty(dept.getName(), name, dept::setName);
                        setIfEmpty(dept.getDescription(), getCellValue(row, 2), dept::setDescription);
                    } else {
                        dept.setName(name);
                        dept.setDescription(getCellValue(row, 2));
                    }

                    String corporateCode = getCellValue(row, 3);
                    if (corporateCode != null && !corporateCode.isBlank()) {
                        if (!isExistingDept || dept.getCorporate() == null) {
                            Optional<Corporate> corp = corporateRepository.findByCode(corporateCode);
                            if (corp.isEmpty()) {
                                result.addError(rowNum, "Corporate not found with code '" + corporateCode + "' for department '" + code + "'");
                                continue;
                            }
                            dept.setCorporate(corp.get());
                        }
                    }

                    if (isExistingDept) {
                        setIfEmpty(dept.getHeadOfDepartment(), getCellValue(row, 4), dept::setHeadOfDepartment);
                        setIfEmpty(dept.getContactEmail(), getCellValue(row, 5), dept::setContactEmail);
                        setIfEmpty(dept.getContactPhone(), getCellValue(row, 6), dept::setContactPhone);
                    } else {
                        dept.setHeadOfDepartment(getCellValue(row, 4));
                        dept.setContactEmail(getCellValue(row, 5));
                        dept.setContactPhone(getCellValue(row, 6));
                        dept.setIsActive(getBooleanCellValue(row, 7, true));
                    }
                    departmentRepository.save(dept);
                    result.addSuccess(rowNum);
                } catch (Exception e) {
                    result.addError(rowNum, e.getMessage());
                }
            }
        }
        return result;
    }

    private boolean isEmpty(String value) {
        return value == null || value.isBlank();
    }

    private void setIfEmpty(String existingValue, String newValue, java.util.function.Consumer<String> setter) {
        if (isEmpty(existingValue) && !isEmpty(newValue)) {
            setter.accept(newValue);
        }
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
        String[] headers = {"Username", "Email", "Password", "First Name", "Last Name", "Phone", "Staff ID", "Department", "User Type", "Roles", "Corporates", "SBUs", "Branches", "Departments"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        List<User> users = userRepository.findAllExcludingSuper();
        int rowNum = 1;
        for (User user : users) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(user.getUsername());
            row.createCell(1).setCellValue(user.getEmail());
            row.createCell(2).setCellValue(""); // Never export passwords
            row.createCell(3).setCellValue(user.getFirstName() != null ? user.getFirstName() : "");
            row.createCell(4).setCellValue(user.getLastName() != null ? user.getLastName() : "");
            row.createCell(5).setCellValue(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
            row.createCell(6).setCellValue(user.getStaffId() != null ? user.getStaffId() : "");
            row.createCell(7).setCellValue(user.getDepartment() != null ? user.getDepartment() : "");
            row.createCell(8).setCellValue(user.getUserType().name());
            row.createCell(9).setCellValue(String.join(",", user.getRoles().stream().map(Role::getName).toList()));
            row.createCell(10).setCellValue(String.join(",", user.getCorporates().stream().map(Corporate::getCode).toList()));
            row.createCell(11).setCellValue(String.join(",", user.getSbus().stream().map(SBU::getCode).toList()));
            row.createCell(12).setCellValue(String.join(",", user.getBranches().stream().map(Branch::getCode).toList()));
            row.createCell(13).setCellValue(String.join(",", user.getDepartments().stream().map(Department::getCode).toList()));
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
            case "user", "users" -> new String[]{
                "Username", "Email", "Password (temporary)", "First Name", "Last Name", "Phone", "Staff ID", "Department",
                "User Type (SYSTEM/STAFF/MANAGER/EXTERNAL)", "Roles (comma-separated names)",
                "Corporates (comma-separated codes)", "SBUs (comma-separated codes)",
                "Branches (comma-separated codes)", "Departments (comma-separated codes)"
            };
            case "role", "roles" -> new String[]{
                "Name", "Description", "Privileges (comma-separated names)"
            };
            case "privilege", "privileges" -> new String[]{
                "Name", "Description", "Category", "System Privilege (true/false)"
            };
            case "sbu", "sbus" -> new String[]{
                "Code", "Name", "Description", "Corporate Code (reference)", "Parent SBU Code (reference)",
                "Address", "Contact Email", "Contact Phone", "Active (true/false)"
            };
            case "category", "categories" -> new String[]{
                "Code", "Name", "Description", "Active (true/false)"
            };
            case "corporate", "corporates" -> new String[]{
                "Code", "Name", "Description", "Category Code (reference)",
                "Type (PRIVATE_LIMITED/SOLE_TRADER/PUBLIC/PARTNERSHIP/NGO/GOVERNMENT)",
                "Contact Email", "Contact Phone", "Website", "Address", "Active (true/false)"
            };
            case "branch", "branches" -> new String[]{
                "Code", "Name", "Description", "SBU Code (reference)",
                "Address", "Contact Email", "Contact Phone", "Active (true/false)"
            };
            case "department", "departments" -> new String[]{
                "Code", "Name", "Description", "Corporate Code (reference)",
                "Head of Department", "Contact Email", "Contact Phone", "Active (true/false)"
            };
            case "setting", "settings" -> new String[]{
                "Key", "Value", "Label", "Description",
                "Type (STRING/NUMBER/BOOLEAN/COLOR/EMAIL/URL/PASSWORD/JSON/LIST/SELECT)",
                "Category", "Tab"
            };
            case "deadline", "deadlines" -> new String[]{
                "Name", "Code", "Description", "Category (name)",
                "Priority (LOW/MEDIUM/HIGH/CRITICAL)", "Status (ACTIVE/PAUSED/COMPLETED/ARCHIVED)",
                "Recurrence (ONE_TIME/MONTHLY/QUARTERLY/SEMI_ANNUAL/ANNUAL)",
                "Reminder Days Before (comma-separated)", "Owner (username)", "SBU (code)"
            };
            case "leavetype", "leavetypes", "leave-types" -> new String[]{
                "Name", "Code", "Description", "Color Code (#hex)",
                "Is Paid (true/false)", "Default Days Per Year", "Max Consecutive Days",
                "Requires Attachment (true/false)", "Attachment Required After Days",
                "Applicable Gender (ALL/MALE/FEMALE)", "Display Order"
            };
            case "leavebalance", "leavebalances", "leave-balances" -> new String[]{
                "Employee (username)", "Leave Type (code)", "Year",
                "Entitled", "Carried Over", "Adjustment"
            };
            case "leaverequest", "leaverequests", "leave-requests" -> new String[]{
                "Employee (username)", "Leave Type (code)", "Start Date (yyyy-MM-dd)", "End Date (yyyy-MM-dd)",
                "Reason", "Status (DRAFT/PENDING/APPROVED/REJECTED/CANCELLED)",
                "Start Half Day (true/false)", "End Half Day (true/false)"
            };
            case "holiday", "holidays", "public-holidays" -> new String[]{
                "Name", "Date (yyyy-MM-dd)", "Country", "Region",
                "Is Recurring (true/false)", "Description"
            };
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
                case "privilege", "privileges" -> exportPrivilegesToWorkbook(workbook);
                case "sbu", "sbus" -> exportSBUsToWorkbook(workbook);
                case "category", "categories" -> exportCategoriesToWorkbook(workbook);
                case "corporate", "corporates" -> exportCorporatesToWorkbook(workbook);
                case "branch", "branches" -> exportBranchesToWorkbook(workbook);
                case "department", "departments" -> exportDepartmentsToWorkbook(workbook);
                case "setting", "settings" -> exportSettingsToWorkbook(workbook);
                case "deadline", "deadlines" -> exportDeadlinesToWorkbook(workbook);
                case "leavetype", "leavetypes", "leave-types" -> exportLeaveTypesToWorkbook(workbook);
                case "leavebalance", "leavebalances", "leave-balances" -> exportLeaveBalancesToWorkbook(workbook);
                case "leaverequest", "leaverequests", "leave-requests" -> exportLeaveRequestsToWorkbook(workbook);
                case "holiday", "holidays", "public-holidays" -> exportHolidaysToWorkbook(workbook);
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
        String[] headers = {"Username", "Email", "Password", "First Name", "Last Name", "Phone", "Staff ID", "Department", "User Type", "Roles", "Corporates", "SBUs", "Branches", "Departments"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<User> users = userRepository.findAllExcludingSuper();
        int rowNum = 1;
        for (User user : users) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(user.getUsername());
            row.createCell(1).setCellValue(user.getEmail());
            row.createCell(2).setCellValue(""); // Never export passwords
            row.createCell(3).setCellValue(user.getFirstName() != null ? user.getFirstName() : "");
            row.createCell(4).setCellValue(user.getLastName() != null ? user.getLastName() : "");
            row.createCell(5).setCellValue(user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
            row.createCell(6).setCellValue(user.getStaffId() != null ? user.getStaffId() : "");
            row.createCell(7).setCellValue(user.getDepartment() != null ? user.getDepartment() : "");
            row.createCell(8).setCellValue(user.getUserType().name());
            row.createCell(9).setCellValue(String.join(",", user.getRoles().stream().map(Role::getName).toList()));
            row.createCell(10).setCellValue(String.join(",", user.getCorporates().stream().map(Corporate::getCode).toList()));
            row.createCell(11).setCellValue(String.join(",", user.getSbus().stream().map(SBU::getCode).toList()));
            row.createCell(12).setCellValue(String.join(",", user.getBranches().stream().map(Branch::getCode).toList()));
            row.createCell(13).setCellValue(String.join(",", user.getDepartments().stream().map(Department::getCode).toList()));
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

    private void exportPrivilegesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Privileges");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Name", "Description", "Category", "System Privilege"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }
        List<Privilege> privileges = privilegeRepository.findAll();
        int rowNum = 1;
        for (Privilege priv : privileges) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(priv.getName());
            row.createCell(1).setCellValue(priv.getDescription() != null ? priv.getDescription() : "");
            row.createCell(2).setCellValue(priv.getCategory() != null ? priv.getCategory() : "");
            row.createCell(3).setCellValue(priv.getIsSystemPrivilege() != null && priv.getIsSystemPrivilege());
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
    public ImportResultDTO importFromStream(String entityName, InputStream inputStream) {
        try {
            Path tempFile = Files.createTempFile(entityName + "_import_", ".xlsx");
            Files.copy(inputStream, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            ImportResultDTO result = importFile(tempFile.toFile());
            Files.deleteIfExists(tempFile);
            return result;
        } catch (IOException e) {
            log.error("Failed to import {}", entityName, e);
            throw new RuntimeException("Failed to import: " + e.getMessage());
        }
    }

    /**
     * Import from stream and return the result as an Excel file (byte array).
     * The result Excel contains all original rows plus Status and Details columns.
     */
    @Transactional
    public byte[] importFromStreamAsExcel(String entityName, InputStream inputStream) {
        try {
            Path tempFile = Files.createTempFile(entityName + "_import_", ".xlsx");
            Files.copy(inputStream, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            ImportResultDTO result = importFile(tempFile.toFile());
            byte[] resultExcel = buildResultExcel(tempFile.toFile(), result);

            Files.deleteIfExists(tempFile);
            return resultExcel;
        } catch (IOException e) {
            log.error("Failed to import {}", entityName, e);
            throw new RuntimeException("Failed to import: " + e.getMessage());
        }
    }

    private byte[] buildResultExcel(File originalFile, ImportResultDTO result) throws IOException {
        try (Workbook sourceWorkbook = new XSSFWorkbook(new FileInputStream(originalFile));
             Workbook resultWorkbook = new XSSFWorkbook()) {

            Sheet sourceSheet = sourceWorkbook.getSheetAt(0);
            log.info("Building result Excel: sourceSheet has {} rows (lastRowNum={}), rowStatuses has {} entries: {}",
                    sourceSheet.getPhysicalNumberOfRows(), sourceSheet.getLastRowNum(),
                    result.getRowStatuses().size(), result.getRowStatuses());
            String sheetName = sourceSheet.getSheetName();
            Sheet resultSheet = resultWorkbook.createSheet(sheetName != null ? sheetName : "Results");

            // Create cell styles
            CellStyle headerStyle = resultWorkbook.createCellStyle();
            Font headerFont = resultWorkbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            CellStyle successStyle = resultWorkbook.createCellStyle();
            Font successFont = resultWorkbook.createFont();
            successFont.setColor(IndexedColors.GREEN.getIndex());
            successFont.setBold(true);
            successStyle.setFont(successFont);

            CellStyle errorStyle = resultWorkbook.createCellStyle();
            Font errorFont = resultWorkbook.createFont();
            errorFont.setColor(IndexedColors.RED.getIndex());
            errorFont.setBold(true);
            errorStyle.setFont(errorFont);

            // Copy header row and add Status + Details columns
            Row sourceHeaderRow = sourceSheet.getRow(0);
            Row resultHeaderRow = resultSheet.createRow(0);
            int lastColIndex = 0;

            if (sourceHeaderRow != null) {
                lastColIndex = sourceHeaderRow.getLastCellNum();
                for (int i = 0; i < lastColIndex; i++) {
                    Cell sourceCell = sourceHeaderRow.getCell(i);
                    Cell resultCell = resultHeaderRow.createCell(i);
                    resultCell.setCellStyle(headerStyle);
                    if (sourceCell != null) {
                        resultCell.setCellValue(getCellValueAsString(sourceCell));
                    }
                }
            }

            // Add Status and Details header columns
            Cell statusHeaderCell = resultHeaderRow.createCell(lastColIndex);
            statusHeaderCell.setCellValue("Import Status");
            statusHeaderCell.setCellStyle(headerStyle);

            Cell detailsHeaderCell = resultHeaderRow.createCell(lastColIndex + 1);
            detailsHeaderCell.setCellValue("Details");
            detailsHeaderCell.setCellStyle(headerStyle);

            // Copy ALL data rows and add status — never skip any row
            int resultRowIdx = 0;
            for (int rowIdx = 1; rowIdx <= sourceSheet.getLastRowNum(); rowIdx++) {
                Row sourceRow = sourceSheet.getRow(rowIdx);
                if (sourceRow == null) continue;

                resultRowIdx++;
                Row resultRow = resultSheet.createRow(resultRowIdx);

                // Copy original cell data
                for (int i = 0; i < lastColIndex; i++) {
                    Cell sourceCell = sourceRow.getCell(i);
                    Cell resultCell = resultRow.createCell(i);
                    if (sourceCell != null) {
                        resultCell.setCellValue(getCellValueAsString(sourceCell));
                    }
                }

                // Add status from result — use rowIdx+1 because import methods use 1-based row numbers
                // where row 1 is the header, so data rows start at row 2
                int excelRowNum = rowIdx + 1;
                String status = result.getRowStatuses().getOrDefault(excelRowNum, "SKIPPED");

                Cell statusCell = resultRow.createCell(lastColIndex);
                Cell detailsCell = resultRow.createCell(lastColIndex + 1);

                if (status.equals("SUCCESS")) {
                    statusCell.setCellValue("SUCCESS");
                    statusCell.setCellStyle(successStyle);
                    detailsCell.setCellValue("Imported successfully");
                } else if (status.startsWith("FAILED:")) {
                    statusCell.setCellValue("FAILED");
                    statusCell.setCellStyle(errorStyle);
                    detailsCell.setCellValue(status.substring(8).trim());
                } else {
                    statusCell.setCellValue("SKIPPED");
                    detailsCell.setCellValue("Row was skipped (empty key field)");
                }
            }

            // Auto-size columns
            for (int i = 0; i <= lastColIndex + 1; i++) {
                resultSheet.autoSizeColumn(i);
            }

            // Add summary row
            int summaryRowIdx = resultRowIdx + 2;
            Row summaryRow = resultSheet.createRow(summaryRowIdx);
            Cell summaryCell = summaryRow.createCell(0);
            summaryCell.setCellValue("Summary: " + result.getSummary());
            summaryCell.setCellStyle(headerStyle);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            resultWorkbook.write(baos);
            return baos.toByteArray();
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCachedFormulaResultType() == CellType.STRING
                    ? cell.getStringCellValue()
                    : String.valueOf(cell.getNumericCellValue());
            default -> "";
        };
    }

    // ==================== Workflow Submission Import/Export ====================

    /**
     * Generate an Excel template for importing submissions into a specific workflow.
     * Columns are based on the workflow's field definitions.
     */
    public byte[] getWorkflowSubmissionTemplate(String workflowCode) {
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + workflowCode));

        List<WorkflowField> fields = workflowFieldRepository.findByWorkflowId(workflow.getId())
                .stream()
                .filter(f -> isImportableFieldType(f.getFieldType()))
                .filter(f -> !Boolean.TRUE.equals(f.getIsHidden())) // exclude hidden fields
                .sorted(Comparator.comparingInt(f -> f.getDisplayOrder() != null ? f.getDisplayOrder() : 0))
                .collect(Collectors.toList());

        log.info("Generating template for workflow {} with {} importable fields", workflowCode, fields.size());

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(workflow.getName());

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Mandatory header style
            CellStyle mandatoryStyle = workbook.createCellStyle();
            Font mandatoryFont = workbook.createFont();
            mandatoryFont.setBold(true);
            mandatoryFont.setColor(IndexedColors.RED.getIndex());
            mandatoryStyle.setFont(mandatoryFont);
            mandatoryStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            mandatoryStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            Row hintRow = sheet.createRow(1);

            CellStyle hintStyle = workbook.createCellStyle();
            Font hintFont = workbook.createFont();
            hintFont.setItalic(true);
            hintFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            hintStyle.setFont(hintFont);

            // Standard columns first
            int col = 0;

            // Title column (every submission has a title)
            Cell titleHeader = headerRow.createCell(col);
            titleHeader.setCellValue("Title");
            titleHeader.setCellStyle(headerStyle);
            Cell titleHint = hintRow.createCell(col);
            titleHint.setCellValue("(Submission title - optional)");
            titleHint.setCellStyle(hintStyle);
            col++;

            // Amount column for financial workflows
            boolean isFinancial = workflow.getWorkflowCategory() == Workflow.WorkflowCategory.FINANCIAL;
            if (isFinancial) {
                Cell amountHeader = headerRow.createCell(col);
                amountHeader.setCellValue("Amount *");
                amountHeader.setCellStyle(mandatoryStyle);
                Cell amountHint = hintRow.createCell(col);
                amountHint.setCellValue("(Numeric amount for financial approval)");
                amountHint.setCellStyle(hintStyle);
                col++;
            }

            // Workflow field columns
            for (int i = 0; i < fields.size(); i++) {
                WorkflowField field = fields.get(i);
                String label = field.getLabel() != null ? field.getLabel() : field.getName();
                if (Boolean.TRUE.equals(field.getIsMandatory())) {
                    label += " *";
                }

                Cell headerCell = headerRow.createCell(col + i);
                headerCell.setCellValue(label);
                headerCell.setCellStyle(Boolean.TRUE.equals(field.getIsMandatory()) ? mandatoryStyle : headerStyle);

                // Add hint row with field type and constraints
                Cell hintCell = hintRow.createCell(col + i);
                hintCell.setCellValue(getFieldHint(field));
                hintCell.setCellStyle(hintStyle);
            }

            // Auto-size all columns
            for (int i = 0; i < col + fields.size(); i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 4000) {
                    sheet.setColumnWidth(i, 4000);
                }
            }

            // If no fields at all, add a note
            if (fields.isEmpty() && col <= 1) {
                Row noteRow = sheet.createRow(2);
                Cell noteCell = noteRow.createCell(0);
                noteCell.setCellValue("Note: This workflow has no importable data fields. Add fields in the Workflow Builder first.");
                CellStyle noteStyle = workbook.createCellStyle();
                Font noteFont = workbook.createFont();
                noteFont.setItalic(true);
                noteFont.setColor(IndexedColors.ORANGE.getIndex());
                noteStyle.setFont(noteFont);
                noteCell.setCellStyle(noteStyle);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate template: " + e.getMessage());
        }
    }

    /**
     * Import submissions from an Excel file for a specific workflow.
     * Returns a result Excel with status per row.
     */
    @Transactional
    public byte[] importWorkflowSubmissions(String workflowCode, InputStream inputStream, String importStatus) {
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + workflowCode));

        List<WorkflowField> fields = workflowFieldRepository.findByWorkflowId(workflow.getId())
                .stream()
                .filter(f -> isImportableFieldType(f.getFieldType()))
                .sorted(Comparator.comparingInt(WorkflowField::getDisplayOrder))
                .collect(Collectors.toList());

        // Get current user as initiator
        User initiator = getCurrentUserForImport();

        ImportResultDTO result = new ImportResultDTO();
        Path tempFile = null;

        try {
            tempFile = Files.createTempFile("submission_import_", ".xlsx");
            Files.copy(inputStream, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            try (Workbook workbook = new XSSFWorkbook(new FileInputStream(tempFile.toFile()))) {
                Sheet sheet = workbook.getSheetAt(0);
                Iterator<Row> rowIterator = sheet.iterator();

                if (!rowIterator.hasNext()) {
                    result.getErrors().add("File is empty");
                    result.setErrorCount(1);
                    return buildResultExcel(tempFile.toFile(), result);
                }

                // Skip header row
                rowIterator.next();

                // Skip hint row (row index 1) if it exists and looks like hints
                if (rowIterator.hasNext()) {
                    Row possibleHintRow = rowIterator.next();
                    String firstCellVal = getCellValue(possibleHintRow, 0);
                    if (firstCellVal != null && !firstCellVal.isBlank() &&
                        !firstCellVal.startsWith("(") && !firstCellVal.startsWith("Type:")) {
                        // Not a hint row - process it as data
                        processSubmissionRow(possibleHintRow, fields, workflow, initiator, result, importStatus);
                    }
                }

                while (rowIterator.hasNext()) {
                    Row row = rowIterator.next();
                    processSubmissionRow(row, fields, workflow, initiator, result, importStatus);
                }
            }

            byte[] resultExcel = buildResultExcel(tempFile.toFile(), result);
            Files.deleteIfExists(tempFile);

            log.info("Workflow submission import completed for '{}': {}", workflowCode, result.getSummary());
            return resultExcel;

        } catch (IOException e) {
            log.error("Failed to import submissions for workflow {}", workflowCode, e);
            throw new RuntimeException("Failed to import: " + e.getMessage());
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
        }
    }

    private void processSubmissionRow(Row row, List<WorkflowField> fields, Workflow workflow,
                                       User initiator, ImportResultDTO result, String importStatus) {
        int rowNum = row.getRowNum() + 1;
        boolean isFinancial = workflow.getWorkflowCategory() == Workflow.WorkflowCategory.FINANCIAL;
        int colOffset = 1 + (isFinancial ? 1 : 0); // Title + optional Amount columns

        // Check if the row is entirely empty
        boolean hasData = false;
        for (int i = 0; i < colOffset + fields.size(); i++) {
            String val = getCellValue(row, i);
            if (val != null && !val.isBlank()) {
                hasData = true;
                break;
            }
        }
        if (!hasData) return;

        // Read standard columns
        String importTitle = getCellValue(row, 0);
        String importAmount = isFinancial ? getCellValue(row, 1) : null;

        try {
            // Validate mandatory fields
            for (int i = 0; i < fields.size(); i++) {
                WorkflowField field = fields.get(i);
                if (Boolean.TRUE.equals(field.getIsMandatory())) {
                    String val = getCellValue(row, colOffset + i);
                    if (val == null || val.isBlank()) {
                        result.addError(rowNum, "Required field '" + field.getLabel() + "' is empty");
                        return;
                    }
                }
            }

            // Build field values map
            Map<String, Object> fieldValues = new LinkedHashMap<>();
            for (int i = 0; i < fields.size(); i++) {
                WorkflowField field = fields.get(i);
                String val = getCellValue(row, colOffset + i);
                if (val != null && !val.isBlank()) {
                    // Validate field value based on type
                    String validationError = validateFieldValue(field, val);
                    if (validationError != null) {
                        result.addError(rowNum, validationError);
                        return;
                    }
                    fieldValues.put(field.getName(), val);
                }
            }

            // Generate reference number
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String random = String.format("%04d", new Random().nextInt(10000));
            String referenceNumber = workflow.getCode() + "-" + timestamp + "-" + random;

            // Determine status
            WorkflowInstance.Status status = "APPROVED".equalsIgnoreCase(importStatus)
                    ? WorkflowInstance.Status.APPROVED
                    : WorkflowInstance.Status.DRAFT;

            // Create instance
            WorkflowInstance instance = WorkflowInstance.builder()
                    .workflow(workflow)
                    .referenceNumber(referenceNumber)
                    .status(status)
                    .initiator(initiator)
                    .currentLevel(0)
                    .build();

            // Set title from import
            if (importTitle != null && !importTitle.isBlank()) {
                instance.setTitle(importTitle);
            }

            // Set amount for financial workflows
            if (isFinancial && importAmount != null && !importAmount.isBlank()) {
                try { instance.setAmount(new BigDecimal(importAmount)); } catch (NumberFormatException ignored) {}
            }

            if (status == WorkflowInstance.Status.APPROVED) {
                instance.setSubmittedAt(LocalDateTime.now());
                instance.setCompletedAt(LocalDateTime.now());
            }

            WorkflowInstance savedInstance = workflowInstanceRepository.save(instance);

            // Save field values
            Map<String, WorkflowField> fieldMap = fields.stream()
                    .collect(Collectors.toMap(WorkflowField::getName, f -> f, (a, b) -> a));

            for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
                WorkflowField field = fieldMap.get(entry.getKey());
                if (field != null) {
                    WorkflowFieldValue fv = new WorkflowFieldValue();
                    fv.setWorkflowInstance(savedInstance);
                    fv.setField(field);
                    fv.setFieldName(field.getName());
                    fv.setFieldLabel(field.getLabel());
                    fv.setValue(entry.getValue().toString());
                    fv.setDisplayValue(entry.getValue().toString());
                    workflowFieldValueRepository.save(fv);

                    // Handle amount field
                    if ("amount".equalsIgnoreCase(field.getName())) {
                        try {
                            savedInstance.setAmount(new BigDecimal(entry.getValue().toString()));
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            // Generate title from isTitle fields
            generateImportTitle(savedInstance, fieldValues, fields);
            workflowInstanceRepository.save(savedInstance);

            result.addSuccess(rowNum);

        } catch (Exception e) {
            result.addError(rowNum, e.getMessage());
        }
    }

    private void generateImportTitle(WorkflowInstance instance, Map<String, Object> fieldValues, List<WorkflowField> fields) {
        List<WorkflowField> titleFields = fields.stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsTitle()))
                .sorted(Comparator.comparingInt(WorkflowField::getDisplayOrder))
                .collect(Collectors.toList());

        if (titleFields.isEmpty()) return;

        List<String> titleParts = new ArrayList<>();
        for (WorkflowField field : titleFields) {
            Object value = fieldValues.get(field.getName());
            if (value != null && !value.toString().isEmpty()) {
                titleParts.add(value.toString());
            }
        }

        if (!titleParts.isEmpty()) {
            instance.setTitle(String.join(" - ", titleParts));
        }
    }

    private boolean isImportableFieldType(WorkflowField.FieldType type) {
        return type != null && switch (type) {
            case TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, CHECKBOX, RADIO, SELECT,
                 MULTISELECT, EMAIL, PHONE, URL, TOGGLE, YES_NO, RATING, TIME, SLIDER,
                 RICH_TEXT, COLOR, HIDDEN, USER, SQL_OBJECT, CHECKBOX_GROUP -> true;
            default -> false; // FILE, LABEL, DIVIDER, IMAGE, ICON, SIGNATURE, BARCODE, LOCATION, TABLE, ACCORDION, COLLAPSIBLE, PASSWORD
        };
    }

    private String getFieldHint(WorkflowField field) {
        StringBuilder hint = new StringBuilder("(");
        hint.append("Type: ").append(field.getFieldType().name());

        if (field.getFieldType() == WorkflowField.FieldType.SELECT ||
            field.getFieldType() == WorkflowField.FieldType.RADIO ||
            field.getFieldType() == WorkflowField.FieldType.MULTISELECT) {
            if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                String options = field.getOptions().stream()
                        .map(o -> o.getValue() != null ? o.getValue() : o.getLabel())
                        .collect(Collectors.joining(", "));
                hint.append(" | Options: ").append(options);
            }
        }

        if (field.getFieldType() == WorkflowField.FieldType.CHECKBOX ||
            field.getFieldType() == WorkflowField.FieldType.TOGGLE ||
            field.getFieldType() == WorkflowField.FieldType.YES_NO) {
            hint.append(" | Values: true/false");
        }

        if (field.getFieldType() == WorkflowField.FieldType.DATE) {
            hint.append(" | Format: YYYY-MM-DD");
        }

        if (field.getFieldType() == WorkflowField.FieldType.MULTISELECT ||
            field.getFieldType() == WorkflowField.FieldType.CHECKBOX_GROUP) {
            hint.append(" | Comma-separated");
        }

        hint.append(")");
        return hint.toString();
    }

    private String validateFieldValue(WorkflowField field, String value) {
        if (value == null || value.isBlank()) return null;

        switch (field.getFieldType()) {
            case NUMBER, CURRENCY, SLIDER, RATING:
                try {
                    new BigDecimal(value);
                } catch (NumberFormatException e) {
                    return "Field '" + field.getLabel() + "' must be a number, got: " + value;
                }
                break;
            case EMAIL:
                if (!value.contains("@")) {
                    return "Field '" + field.getLabel() + "' must be a valid email, got: " + value;
                }
                break;
            default:
                break;
        }
        return null;
    }

    /**
     * Export all active submissions for a workflow to Excel.
     */
    public byte[] exportWorkflowSubmissions(String workflowCode) {
        Workflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new RuntimeException("Workflow not found: " + workflowCode));

        List<WorkflowField> fields = workflowFieldRepository.findByWorkflowId(workflow.getId())
                .stream()
                .filter(f -> isImportableFieldType(f.getFieldType()))
                .sorted(Comparator.comparingInt(WorkflowField::getDisplayOrder))
                .collect(Collectors.toList());

        List<WorkflowInstance> instances = workflowInstanceRepository
                .findByWorkflowId(workflow.getId(), org.springframework.data.domain.Pageable.unpaged())
                .getContent();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(workflow.getName());

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row: Reference, Status, then field labels
            Row headerRow = sheet.createRow(0);
            int col = 0;
            Cell refHeader = headerRow.createCell(col++);
            refHeader.setCellValue("Reference Number");
            refHeader.setCellStyle(headerStyle);

            Cell statusHeader = headerRow.createCell(col++);
            statusHeader.setCellValue("Status");
            statusHeader.setCellStyle(headerStyle);

            Cell submittedHeader = headerRow.createCell(col++);
            submittedHeader.setCellValue("Submitted By");
            submittedHeader.setCellStyle(headerStyle);

            Cell dateHeader = headerRow.createCell(col++);
            dateHeader.setCellValue("Created At");
            dateHeader.setCellStyle(headerStyle);

            for (WorkflowField field : fields) {
                Cell c = headerRow.createCell(col++);
                c.setCellValue(field.getLabel() != null ? field.getLabel() : field.getName());
                c.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 1;
            for (WorkflowInstance instance : instances) {
                Row dataRow = sheet.createRow(rowIdx++);
                col = 0;
                dataRow.createCell(col++).setCellValue(instance.getReferenceNumber());
                dataRow.createCell(col++).setCellValue(instance.getStatus().name());
                dataRow.createCell(col++).setCellValue(
                        instance.getInitiator() != null ? instance.getInitiator().getFullName() : "");
                dataRow.createCell(col++).setCellValue(
                        instance.getCreatedAt() != null ? instance.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");

                // Build value map for this instance
                Map<String, String> valueMap = instance.getFieldValues().stream()
                        .collect(Collectors.toMap(
                                WorkflowFieldValue::getFieldName,
                                v -> v.getValue() != null ? v.getValue() : "",
                                (a, b) -> a
                        ));

                for (WorkflowField field : fields) {
                    String val = valueMap.getOrDefault(field.getName(), "");
                    dataRow.createCell(col++).setCellValue(val);
                }
            }

            // Auto-size
            for (int i = 0; i < col; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export submissions: " + e.getMessage());
        }
    }

    private User getCurrentUserForImport() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof CustomUserDetails cud) {
                return userRepository.findById(cud.getId())
                        .orElseThrow(() -> new RuntimeException("Current user not found"));
            }
        } catch (Exception e) {
            log.warn("Could not get current user for import: {}", e.getMessage());
        }
        // Fallback to admin user
        return userRepository.findByUsername("admin")
                .orElseThrow(() -> new RuntimeException("No user available for import"));
    }

    // ==================== DEADLINE EXPORT/IMPORT ====================

    private void exportDeadlinesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Deadlines");
        Row headerRow = sheet.createRow(0);
        String[] headers = getHeadersForEntity("deadline");
        for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

        List<DeadlineItem> items = deadlineItemRepository.findAll();
        int rowNum = 1;
        for (DeadlineItem item : items) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(item.getName() != null ? item.getName() : "");
            row.createCell(1).setCellValue(item.getCode() != null ? item.getCode() : "");
            row.createCell(2).setCellValue(item.getDescription() != null ? item.getDescription() : "");
            row.createCell(3).setCellValue(item.getCategory() != null ? item.getCategory().getName() : "");
            row.createCell(4).setCellValue(item.getPriority() != null ? item.getPriority().name() : "MEDIUM");
            row.createCell(5).setCellValue(item.getStatus() != null ? item.getStatus().name() : "ACTIVE");
            row.createCell(6).setCellValue(item.getRecurrenceType() != null ? item.getRecurrenceType().name() : "ONE_TIME");
            row.createCell(7).setCellValue(item.getReminderDaysBefore() != null ? item.getReminderDaysBefore() : "30,7,1");
            row.createCell(8).setCellValue(item.getOwner() != null ? item.getOwner().getUsername() : "");
            row.createCell(9).setCellValue(item.getSbu() != null ? item.getSbu().getCode() : "");
        }
    }

    @Transactional
    private ImportResultDTO importDeadlines(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) { result.getErrors().add("Empty file"); result.setErrorCount(1); return result; }
            rows.next(); // skip header

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String name = getCellValue(row, 0);
                    if (name == null || name.isBlank()) continue;

                    String code = getCellValue(row, 1);
                    if (code == null || code.isBlank()) code = name.toLowerCase().replaceAll("[^a-z0-9]", "_");

                    DeadlineItem item = deadlineItemRepository.findByCode(code).orElse(new DeadlineItem());
                    item.setName(name);
                    item.setCode(code);
                    item.setDescription(getCellValue(row, 2));

                    String catName = getCellValue(row, 3);
                    if (catName != null && !catName.isBlank()) {
                        deadlineCategoryRepository.findByName(catName).ifPresent(item::setCategory);
                    }

                    String priority = getCellValue(row, 4);
                    if (priority != null && !priority.isBlank()) {
                        try { item.setPriority(DeadlineItem.DeadlinePriority.valueOf(priority.toUpperCase())); } catch (Exception ignored) {}
                    }

                    String status = getCellValue(row, 5);
                    if (status != null && !status.isBlank()) {
                        try { item.setStatus(DeadlineItem.DeadlineItemStatus.valueOf(status.toUpperCase())); } catch (Exception ignored) {}
                    }

                    String recurrence = getCellValue(row, 6);
                    if (recurrence != null && !recurrence.isBlank()) {
                        try { item.setRecurrenceType(DeadlineItem.RecurrenceType.valueOf(recurrence.toUpperCase())); } catch (Exception ignored) {}
                    }

                    String reminderDays = getCellValue(row, 7);
                    if (reminderDays != null && !reminderDays.isBlank()) item.setReminderDaysBefore(reminderDays);

                    String ownerUsername = getCellValue(row, 8);
                    if (ownerUsername != null && !ownerUsername.isBlank()) {
                        userRepository.findByUsername(ownerUsername).ifPresent(item::setOwner);
                    }

                    String sbuCode = getCellValue(row, 9);
                    if (sbuCode != null && !sbuCode.isBlank()) {
                        sbuRepository.findByCode(sbuCode).ifPresent(item::setSbu);
                    }

                    if (item.getIsActive() == null) item.setIsActive(true);
                    deadlineItemRepository.save(item);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.getRowStatuses().put(rowNum, "SUCCESS");
                } catch (Exception e) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                    result.getRowStatuses().put(rowNum, "FAILED");
                }
            }
        }
        return result;
    }

    // ==================== LEAVE TYPE EXPORT/IMPORT ====================

    private void exportLeaveTypesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Leave Types");
        Row headerRow = sheet.createRow(0);
        String[] headers = getHeadersForEntity("leavetype");
        for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

        List<LeaveType> types = leaveTypeRepository.findAll();
        int rowNum = 1;
        for (LeaveType lt : types) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(lt.getName() != null ? lt.getName() : "");
            row.createCell(1).setCellValue(lt.getCode() != null ? lt.getCode() : "");
            row.createCell(2).setCellValue(lt.getDescription() != null ? lt.getDescription() : "");
            row.createCell(3).setCellValue(lt.getColorCode() != null ? lt.getColorCode() : "#1976d2");
            row.createCell(4).setCellValue(Boolean.TRUE.equals(lt.getIsPaid()) ? "true" : "false");
            row.createCell(5).setCellValue(lt.getDefaultDaysPerYear() != null ? lt.getDefaultDaysPerYear() : 0);
            row.createCell(6).setCellValue(lt.getMaxConsecutiveDays() != null ? lt.getMaxConsecutiveDays() : 0);
            row.createCell(7).setCellValue(Boolean.TRUE.equals(lt.getRequiresAttachment()) ? "true" : "false");
            row.createCell(8).setCellValue(lt.getAttachmentRequiredAfterDays() != null ? lt.getAttachmentRequiredAfterDays() : 0);
            row.createCell(9).setCellValue(lt.getApplicableGender() != null ? lt.getApplicableGender().name() : "ALL");
            row.createCell(10).setCellValue(lt.getDisplayOrder() != null ? lt.getDisplayOrder() : 0);
        }
    }

    @Transactional
    private ImportResultDTO importLeaveTypes(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) { result.getErrors().add("Empty file"); result.setErrorCount(1); return result; }
            rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String name = getCellValue(row, 0);
                    if (name == null || name.isBlank()) continue;

                    String code = getCellValue(row, 1);
                    if (code == null || code.isBlank()) code = name.toUpperCase().replaceAll("[^A-Z0-9]", "_");

                    LeaveType lt = leaveTypeRepository.findByCode(code).orElse(new LeaveType());
                    lt.setName(name);
                    lt.setCode(code);
                    lt.setDescription(getCellValue(row, 2));

                    String color = getCellValue(row, 3);
                    if (color != null && !color.isBlank()) lt.setColorCode(color);

                    String isPaid = getCellValue(row, 4);
                    lt.setIsPaid(!"false".equalsIgnoreCase(isPaid));

                    String defaultDays = getCellValue(row, 5);
                    if (defaultDays != null && !defaultDays.isBlank()) {
                        try { lt.setDefaultDaysPerYear((int) Double.parseDouble(defaultDays)); } catch (Exception ignored) {}
                    }

                    String maxConsec = getCellValue(row, 6);
                    if (maxConsec != null && !maxConsec.isBlank()) {
                        try { lt.setMaxConsecutiveDays((int) Double.parseDouble(maxConsec)); } catch (Exception ignored) {}
                    }

                    String reqAttach = getCellValue(row, 7);
                    lt.setRequiresAttachment("true".equalsIgnoreCase(reqAttach));

                    String attachDays = getCellValue(row, 8);
                    if (attachDays != null && !attachDays.isBlank()) {
                        try { lt.setAttachmentRequiredAfterDays((int) Double.parseDouble(attachDays)); } catch (Exception ignored) {}
                    }

                    String gender = getCellValue(row, 9);
                    if (gender != null && !gender.isBlank()) {
                        try { lt.setApplicableGender(LeaveType.ApplicableGender.valueOf(gender.toUpperCase())); } catch (Exception ignored) {}
                    }

                    String order = getCellValue(row, 10);
                    if (order != null && !order.isBlank()) {
                        try { lt.setDisplayOrder((int) Double.parseDouble(order)); } catch (Exception ignored) {}
                    }

                    if (lt.getIsActive() == null) lt.setIsActive(true);
                    leaveTypeRepository.save(lt);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.getRowStatuses().put(rowNum, "SUCCESS");
                } catch (Exception e) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                    result.getRowStatuses().put(rowNum, "FAILED");
                }
            }
        }
        return result;
    }

    // ==================== LEAVE BALANCE EXPORT/IMPORT ====================

    private void exportLeaveBalancesToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Leave Balances");
        Row headerRow = sheet.createRow(0);
        String[] headers = getHeadersForEntity("leavebalance");
        for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

        List<LeaveBalance> balances = leaveBalanceRepository.findAll();
        int rowNum = 1;
        for (LeaveBalance lb : balances) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(lb.getEmployee() != null ? lb.getEmployee().getUsername() : "");
            row.createCell(1).setCellValue(lb.getLeaveType() != null ? lb.getLeaveType().getCode() : "");
            row.createCell(2).setCellValue(lb.getYear());
            row.createCell(3).setCellValue(lb.getEntitled() != null ? lb.getEntitled().doubleValue() : 0);
            row.createCell(4).setCellValue(lb.getCarriedOver() != null ? lb.getCarriedOver().doubleValue() : 0);
            row.createCell(5).setCellValue(lb.getAdjustment() != null ? lb.getAdjustment().doubleValue() : 0);
        }
    }

    @Transactional
    private ImportResultDTO importLeaveBalances(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) { result.getErrors().add("Empty file"); result.setErrorCount(1); return result; }
            rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String username = getCellValue(row, 0);
                    String leaveTypeCode = getCellValue(row, 1);
                    String yearStr = getCellValue(row, 2);

                    if (username == null || username.isBlank() || leaveTypeCode == null || leaveTypeCode.isBlank()) continue;

                    User employee = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("User not found: " + username));
                    LeaveType leaveType = leaveTypeRepository.findByCode(leaveTypeCode)
                            .orElseThrow(() -> new RuntimeException("Leave type not found: " + leaveTypeCode));
                    int year = yearStr != null ? (int) Double.parseDouble(yearStr) : java.time.LocalDate.now().getYear();

                    LeaveBalance lb = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                            employee.getId(), leaveType.getId(), year).orElse(new LeaveBalance());
                    lb.setEmployee(employee);
                    lb.setLeaveType(leaveType);
                    lb.setYear(year);

                    String entitled = getCellValue(row, 3);
                    if (entitled != null && !entitled.isBlank()) lb.setEntitled(new BigDecimal(entitled));

                    String carried = getCellValue(row, 4);
                    if (carried != null && !carried.isBlank()) lb.setCarriedOver(new BigDecimal(carried));

                    String adjustment = getCellValue(row, 5);
                    if (adjustment != null && !adjustment.isBlank()) lb.setAdjustment(new BigDecimal(adjustment));

                    lb.recalculateAvailable();
                    leaveBalanceRepository.save(lb);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.getRowStatuses().put(rowNum, "SUCCESS");
                } catch (Exception e) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                    result.getRowStatuses().put(rowNum, "FAILED");
                }
            }
        }
        return result;
    }

    // ==================== LEAVE REQUEST EXPORT/IMPORT ====================

    private void exportLeaveRequestsToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Leave Requests");
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Employee", "Leave Type", "Reference", "Start Date", "End Date",
                "Total Days", "Reason", "Status", "Start Half Day", "End Half Day", "Submitted At"};
        for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

        List<LeaveRequest> requests = leaveRequestRepository.findAll();
        int rowNum = 1;
        for (LeaveRequest lr : requests) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(lr.getEmployee() != null ? lr.getEmployee().getUsername() : "");
            row.createCell(1).setCellValue(lr.getLeaveType() != null ? lr.getLeaveType().getCode() : "");
            row.createCell(2).setCellValue(lr.getReferenceNumber() != null ? lr.getReferenceNumber() : "");
            row.createCell(3).setCellValue(lr.getStartDate() != null ? lr.getStartDate().toString() : "");
            row.createCell(4).setCellValue(lr.getEndDate() != null ? lr.getEndDate().toString() : "");
            row.createCell(5).setCellValue(lr.getTotalDays() != null ? lr.getTotalDays().doubleValue() : 0);
            row.createCell(6).setCellValue(lr.getReason() != null ? lr.getReason() : "");
            row.createCell(7).setCellValue(lr.getStatus() != null ? lr.getStatus().name() : "DRAFT");
            row.createCell(8).setCellValue(Boolean.TRUE.equals(lr.getStartDateHalfDay()) ? "true" : "false");
            row.createCell(9).setCellValue(Boolean.TRUE.equals(lr.getEndDateHalfDay()) ? "true" : "false");
            row.createCell(10).setCellValue(lr.getSubmittedAt() != null ? lr.getSubmittedAt().toString() : "");
        }
    }

    @Transactional
    private ImportResultDTO importLeaveRequests(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) { result.getErrors().add("Empty file"); result.setErrorCount(1); return result; }
            rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String username = getCellValue(row, 0);
                    String leaveTypeCode = getCellValue(row, 1);
                    String startDateStr = getCellValue(row, 2);
                    String endDateStr = getCellValue(row, 3);

                    if (username == null || username.isBlank() || leaveTypeCode == null || leaveTypeCode.isBlank()
                        || startDateStr == null || startDateStr.isBlank() || endDateStr == null || endDateStr.isBlank()) continue;

                    User employee = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("User not found: " + username));
                    LeaveType leaveType = leaveTypeRepository.findByCode(leaveTypeCode)
                            .orElseThrow(() -> new RuntimeException("Leave type not found: " + leaveTypeCode));

                    java.time.LocalDate startDate = java.time.LocalDate.parse(startDateStr);
                    java.time.LocalDate endDate = java.time.LocalDate.parse(endDateStr);

                    // Calculate total days
                    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;

                    // Generate reference number
                    String prefix = "LV-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM"));
                    int maxRef = 0;
                    try { maxRef = leaveRequestRepository.findMaxReferenceNumberForPrefix(prefix + "%"); } catch (Exception ignored) {}
                    String refNumber = prefix + String.format("%04d", maxRef + 1);

                    LeaveRequest lr = LeaveRequest.builder()
                            .employee(employee)
                            .leaveType(leaveType)
                            .referenceNumber(refNumber)
                            .startDate(startDate)
                            .endDate(endDate)
                            .totalDays(new BigDecimal(daysBetween))
                            .status(LeaveRequest.LeaveRequestStatus.DRAFT)
                            .build();

                    String reason = getCellValue(row, 4);
                    if (reason != null && !reason.isBlank()) lr.setReason(reason);

                    String status = getCellValue(row, 5);
                    if (status != null && !status.isBlank()) {
                        try { lr.setStatus(LeaveRequest.LeaveRequestStatus.valueOf(status.toUpperCase())); } catch (Exception ignored) {}
                    }

                    String startHalf = getCellValue(row, 6);
                    lr.setStartDateHalfDay("true".equalsIgnoreCase(startHalf));
                    if (lr.getStartDateHalfDay()) daysBetween--;

                    String endHalf = getCellValue(row, 7);
                    lr.setEndDateHalfDay("true".equalsIgnoreCase(endHalf));

                    // Recalculate total days accounting for half days
                    BigDecimal total = new BigDecimal(java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1);
                    if (Boolean.TRUE.equals(lr.getStartDateHalfDay())) total = total.subtract(new BigDecimal("0.5"));
                    if (Boolean.TRUE.equals(lr.getEndDateHalfDay())) total = total.subtract(new BigDecimal("0.5"));
                    lr.setTotalDays(total);

                    lr.setIsActive(true);
                    leaveRequestRepository.save(lr);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.getRowStatuses().put(rowNum, "SUCCESS");
                } catch (Exception e) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                    result.getRowStatuses().put(rowNum, "FAILED");
                }
            }
        }
        return result;
    }

    // ==================== PUBLIC HOLIDAY EXPORT/IMPORT ====================

    private void exportHolidaysToWorkbook(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Public Holidays");
        Row headerRow = sheet.createRow(0);
        String[] headers = getHeadersForEntity("holiday");
        for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

        List<PublicHoliday> holidays = publicHolidayRepository.findAll();
        int rowNum = 1;
        for (PublicHoliday h : holidays) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(h.getName() != null ? h.getName() : "");
            row.createCell(1).setCellValue(h.getDate() != null ? h.getDate().toString() : "");
            row.createCell(2).setCellValue(h.getCountry() != null ? h.getCountry() : "");
            row.createCell(3).setCellValue(h.getRegion() != null ? h.getRegion() : "");
            row.createCell(4).setCellValue(Boolean.TRUE.equals(h.getIsRecurring()) ? "true" : "false");
            row.createCell(5).setCellValue(h.getDescription() != null ? h.getDescription() : "");
        }
    }

    @Transactional
    private ImportResultDTO importHolidays(File file) throws IOException {
        ImportResultDTO result = new ImportResultDTO();
        try (Workbook workbook = new XSSFWorkbook(new FileInputStream(file))) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) { result.getErrors().add("Empty file"); result.setErrorCount(1); return result; }
            rows.next();

            while (rows.hasNext()) {
                Row row = rows.next();
                int rowNum = row.getRowNum() + 1;
                try {
                    String name = getCellValue(row, 0);
                    String dateStr = getCellValue(row, 1);
                    if (name == null || name.isBlank() || dateStr == null || dateStr.isBlank()) continue;

                    java.time.LocalDate date = java.time.LocalDate.parse(dateStr);

                    PublicHoliday h = new PublicHoliday();
                    h.setName(name);
                    h.setDate(date);
                    h.setYear(date.getYear());

                    String country = getCellValue(row, 2);
                    if (country != null && !country.isBlank()) h.setCountry(country);

                    String region = getCellValue(row, 3);
                    if (region != null && !region.isBlank()) h.setRegion(region);

                    String recurring = getCellValue(row, 4);
                    h.setIsRecurring("true".equalsIgnoreCase(recurring));

                    String desc = getCellValue(row, 5);
                    if (desc != null && !desc.isBlank()) h.setDescription(desc);

                    if (h.getIsActive() == null) h.setIsActive(true);
                    publicHolidayRepository.save(h);
                    result.setSuccessCount(result.getSuccessCount() + 1);
                    result.getRowStatuses().put(rowNum, "SUCCESS");
                } catch (Exception e) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Row " + rowNum + ": " + e.getMessage());
                    result.getRowStatuses().put(rowNum, "FAILED");
                }
            }
        }
        return result;
    }
}
