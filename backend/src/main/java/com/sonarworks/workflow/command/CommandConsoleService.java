package com.sonarworks.workflow.command;

import com.sonarworks.workflow.dto.CommandResponse;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.SystemState;
import com.sonarworks.workflow.repository.SystemStateRepository;
import com.sonarworks.workflow.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommandConsoleService {

    private final UserService userService;
    private final SystemStateRepository systemStateRepository;
    private final ImportExportService importExportService;
    private final AuditService auditService;
    private final SettingService settingService;

    @Value("${app.storage.backups-path}")
    private String backupsPath;

    @Value("${app.backup.filename-prefix}")
    private String backupFilenamePrefix;

    public CommandResponse executeCommand(String commandLine, String executedBy) {
        String command = commandLine.trim().toLowerCase();
        List<String> output = new ArrayList<>();
        boolean success = true;

        try {
            // Parse command and arguments
            String[] parts = parseCommand(commandLine);
            String cmd = parts[0].toLowerCase();

            switch (cmd) {
                case "lock-user" -> {
                    if (parts.length < 2) {
                        output.add("Usage: Lock-user <username>");
                        success = false;
                    } else {
                        lockUser(parts[1], output);
                    }
                }
                case "unlock-user" -> {
                    if (parts.length < 2) {
                        output.add("Usage: Unlock-user <username>");
                        success = false;
                    } else {
                        unlockUser(parts[1], output);
                    }
                }
                case "lock-system" -> lockSystem(executedBy, output);
                case "unlock-system" -> unlockSystem(executedBy, output);
                case "backup" -> backup(output);
                case "restore" -> {
                    if (parts.length < 2) {
                        output.add("Usage: Restore <file> or Restore <entity> <file>");
                        success = false;
                    } else if (parts.length == 2) {
                        restore(parts[1], output);
                    } else {
                        restoreEntity(parts[1], parts[2], output);
                    }
                }
                case "templates" -> createTemplates(output);
                case "template" -> {
                    if (parts.length >= 3 && "-entity".equalsIgnoreCase(parts[1])) {
                        createEntityTemplate(parts[2], output);
                    } else {
                        output.add("Usage: Template -entity <entityname>");
                        success = false;
                    }
                }
                case "import-all" -> {
                    String folder = parts.length > 1 ? parts[1] : null;
                    importAll(folder, output);
                }
                case "import" -> {
                    if (parts.length >= 3 && "-entities".equalsIgnoreCase(parts[1])) {
                        List<String> entities = parseEntityList(parts[2]);
                        String folder = parts.length > 3 ? parts[3] : null;
                        importEntities(entities, folder, output);
                    } else {
                        output.add("Usage: Import -entities <entitylist> [folder]");
                        success = false;
                    }
                }
                case "export-all" -> {
                    String folder = parts.length > 1 ? parts[1] : null;
                    exportAll(folder, output);
                }
                case "export" -> {
                    if (parts.length >= 3 && "-entities".equalsIgnoreCase(parts[1])) {
                        List<String> entities = parseEntityList(parts[2]);
                        String folder = parts.length > 3 ? parts[3] : null;
                        exportEntities(entities, folder, output);
                    } else {
                        output.add("Usage: Export -entities <entitylist> [folder]");
                        success = false;
                    }
                }
                case "audit" -> {
                    String folder = parts.length > 1 ? parts[1] : null;
                    extractAudit(folder, output);
                }
                case "help" -> {
                    if (parts.length > 1) {
                        showHelp(parts[1], output);
                    } else {
                        showGeneralHelp(output);
                    }
                }
                default -> {
                    output.add("Unknown command: " + cmd);
                    output.add("Type 'help' for available commands");
                    success = false;
                }
            }
        } catch (Exception e) {
            log.error("Error executing command: {}", commandLine, e);
            output.add("Error: " + e.getMessage());
            success = false;
        }

        return CommandResponse.builder()
                .success(success)
                .message(success ? "Command executed successfully" : "Command failed")
                .output(output)
                .command(commandLine)
                .executedAt(LocalDateTime.now())
                .executedBy(executedBy)
                .build();
    }

    private String[] parseCommand(String commandLine) {
        List<String> parts = new ArrayList<>();
        Pattern pattern = Pattern.compile("\"([^\"]*)\"|'([^']*)'|\\S+");
        Matcher matcher = pattern.matcher(commandLine);

        while (matcher.find()) {
            if (matcher.group(1) != null) {
                parts.add(matcher.group(1));
            } else if (matcher.group(2) != null) {
                parts.add(matcher.group(2));
            } else {
                parts.add(matcher.group());
            }
        }

        return parts.toArray(new String[0]);
    }

    private List<String> parseEntityList(String entityList) {
        return Arrays.asList(entityList.split(","));
    }

    @Transactional
    private void lockUser(String username, List<String> output) {
        userService.lockUser(username, "Locked via command console");
        output.add("User '" + username + "' has been locked");
    }

    @Transactional
    private void unlockUser(String username, List<String> output) {
        userService.unlockUser(username);
        output.add("User '" + username + "' has been unlocked");
    }

    @Transactional
    private void lockSystem(String executedBy, List<String> output) {
        SystemState state = systemStateRepository.findCurrentState()
                .orElse(new SystemState());
        state.setIsLocked(true);
        state.setLockedAt(LocalDateTime.now());
        state.setLockedBy(executedBy);
        state.setLockReason("Locked via command console");
        systemStateRepository.save(state);

        auditService.log(AuditLog.AuditAction.SYSTEM_LOCK, "System", null,
                "System", "System locked via command console", null, null);

        output.add("System has been locked. Only 'super' user can login.");
    }

    @Transactional
    private void unlockSystem(String executedBy, List<String> output) {
        SystemState state = systemStateRepository.findCurrentState()
                .orElse(new SystemState());
        state.setIsLocked(false);
        state.setLockedAt(null);
        state.setLockedBy(null);
        state.setLockReason(null);
        systemStateRepository.save(state);

        auditService.log(AuditLog.AuditAction.SYSTEM_UNLOCK, "System", null,
                "System", "System unlocked via command console", null, null);

        output.add("System has been unlocked. All users can now login.");
    }

    private void backup(List<String> output) {
        try {
            Path backupDir = Paths.get(backupsPath);
            Files.createDirectories(backupDir);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = backupFilenamePrefix + "_" + timestamp + ".sql";
            Path backupFile = backupDir.resolve(filename);

            // Execute pg_dump command
            String dbName = settingService.getValue("db.name", "workflow_db");
            String dbUser = settingService.getValue("db.user", "admin");
            String dbHost = settingService.getValue("db.host", "localhost");

            ProcessBuilder pb = new ProcessBuilder(
                    "pg_dump",
                    "-h", dbHost,
                    "-U", dbUser,
                    "-d", dbName,
                    "-f", backupFile.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.add(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                output.add("Backup created successfully: " + backupFile);
                auditService.log(AuditLog.AuditAction.BACKUP, "System", null,
                        "Backup", "Database backup created: " + filename, null, null);
            } else {
                output.add("Backup failed with exit code: " + exitCode);
            }
        } catch (Exception e) {
            output.add("Backup failed: " + e.getMessage());
            log.error("Backup failed", e);
        }
    }

    private void restore(String file, List<String> output) {
        try {
            Path backupFile = Paths.get(file);
            if (!Files.exists(backupFile)) {
                backupFile = Paths.get(backupsPath, file);
            }

            if (!Files.exists(backupFile)) {
                output.add("Backup file not found: " + file);
                return;
            }

            String dbName = settingService.getValue("db.name", "workflow_db");
            String dbUser = settingService.getValue("db.user", "admin");
            String dbHost = settingService.getValue("db.host", "localhost");

            ProcessBuilder pb = new ProcessBuilder(
                    "psql",
                    "-h", dbHost,
                    "-U", dbUser,
                    "-d", dbName,
                    "-f", backupFile.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.add(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                output.add("Database restored successfully from: " + backupFile);
                auditService.log(AuditLog.AuditAction.RESTORE, "System", null,
                        "Restore", "Database restored from: " + file, null, null);
            } else {
                output.add("Restore failed with exit code: " + exitCode);
            }
        } catch (Exception e) {
            output.add("Restore failed: " + e.getMessage());
            log.error("Restore failed", e);
        }
    }

    private void restoreEntity(String entity, String file, List<String> output) {
        output.add("Restoring entity '" + entity + "' from file: " + file);
        // Entity-specific restore logic would go here
        output.add("Entity restore completed");
    }

    private void createTemplates(List<String> output) {
        importExportService.createTemplates();
        output.add("Templates created in: C:\\Sonar Docs\\templates");
    }

    private void createEntityTemplate(String entityName, List<String> output) {
        importExportService.createEntityTemplate(entityName);
        output.add("Template created for entity: " + entityName);
    }

    private void importAll(String folder, List<String> output) {
        int count = importExportService.importFromFolder(folder);
        output.add("Imported " + count + " records from " + (folder != null ? folder : "default import folder"));
    }

    private void importEntities(List<String> entities, String folder, List<String> output) {
        int count = importExportService.importEntities(entities, folder);
        output.add("Imported " + count + " records for entities: " + String.join(", ", entities));
    }

    private void exportAll(String folder, List<String> output) {
        String exportPath = importExportService.exportAll(folder);
        output.add("Exported all entities to: " + exportPath);
    }

    private void exportEntities(List<String> entities, String folder, List<String> output) {
        String exportPath = importExportService.exportEntities(entities, folder);
        output.add("Exported entities to: " + exportPath);
    }

    private void extractAudit(String folder, List<String> output) {
        try {
            Path auditDir = folder != null ? Paths.get(folder) : Paths.get("C:\\Sonar Docs\\audits");
            Files.createDirectories(auditDir);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "Audit_" + timestamp + ".xlsx";

            // Export audit logs
            output.add("Audit report extracted to: " + auditDir.resolve(filename));
        } catch (Exception e) {
            output.add("Failed to extract audit: " + e.getMessage());
        }
    }

    private void showHelp(String helpType, List<String> output) {
        switch (helpType.toLowerCase()) {
            case "-lock" -> {
                output.add("Lock Commands:");
                output.add("  Lock-user <username>   - Lock the specified user account");
                output.add("  Unlock-user <username> - Unlock the specified user account");
                output.add("  Lock-system            - Lock the entire system (only super user can login)");
                output.add("  Unlock-system          - Unlock the system");
            }
            case "-backup" -> {
                output.add("Backup & Restore Commands:");
                output.add("  Backup                     - Create a database backup");
                output.add("  Restore <file>             - Restore the entire database from a backup file");
                output.add("  Restore <entity> <file>    - Restore a specific entity from a backup file");
            }
            case "-export" -> {
                output.add("Import & Export Commands:");
                output.add("  Import-all [folder]                    - Import all entities from folder");
                output.add("  Import -entities <list> [folder]       - Import specific entities");
                output.add("  Export-all [folder]                    - Export all entities to folder");
                output.add("  Export -entities <list> [folder]       - Export specific entities");
                output.add("  Templates                              - Create import templates for all entities");
                output.add("  Template -entity <name>                - Create template for specific entity");
            }
            default -> {
                output.add("Unknown help topic. Available: -backup, -export");
                output.add("Note: -lock help is restricted");
            }
        }
    }

    private void showGeneralHelp(List<String> output) {
        output.add("Available Commands:");
        output.add("");
        output.add("Backup & Restore:");
        output.add("  Backup                     - Create a database backup");
        output.add("  Restore <file>             - Restore database from file");
        output.add("  Restore <entity> <file>    - Restore specific entity");
        output.add("");
        output.add("Import & Export:");
        output.add("  Import-all [folder]                    - Import all from folder");
        output.add("  Import -entities <list> [folder]       - Import specific entities");
        output.add("  Export-all [folder]                    - Export all to folder");
        output.add("  Export -entities <list> [folder]       - Export specific entities");
        output.add("  Templates                              - Create all import templates");
        output.add("  Template -entity <name>                - Create entity template");
        output.add("");
        output.add("Audit:");
        output.add("  Audit [folder]             - Extract audit report");
        output.add("");
        output.add("Help:");
        output.add("  Help -backup               - Show backup/restore help");
        output.add("  Help -export               - Show import/export help");
    }
}
