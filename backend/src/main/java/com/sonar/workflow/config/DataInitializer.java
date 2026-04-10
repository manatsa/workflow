package com.sonar.workflow.config;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.leave.entity.LeaveType;
import com.sonar.workflow.leave.entity.LeavePolicy;
import com.sonar.workflow.leave.repository.LeaveTypeRepository;
import com.sonar.workflow.leave.repository.LeavePolicyRepository;
import com.sonar.workflow.projects.entity.ProjectCategory;
import com.sonar.workflow.projects.entity.RiskIssueCategory;
import com.sonar.workflow.projects.repository.ProjectCategoryRepository;
import com.sonar.workflow.projects.repository.RiskIssueCategoryRepository;
import com.sonar.workflow.projects.service.ProjectSettingsService;
import com.sonar.workflow.repository.*;
import com.sonar.workflow.repository.WorkflowTypeRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PrivilegeRepository privilegeRepository;
    private final SettingRepository settingRepository;
    private final SystemStateRepository systemStateRepository;
    private final WorkflowTypeRepository workflowTypeRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowFormRepository workflowFormRepository;
    private final SBURepository sbuRepository;
    private final ProjectCategoryRepository projectCategoryRepository;
    private final RiskIssueCategoryRepository riskIssueCategoryRepository;
    private final ProjectSettingsService projectSettingsService;
    private final StampRepository stampRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        updateApprovalHistoryConstraint();
        updateEmailApprovalTokenConstraint();
        initializePrivileges();
        initializeRoles();
        initializeUsers();
        initializeSettings();
        initializeSystemState();
        // SBUs are no longer seeded - users create them via import or manually
        initializeWorkflowTypes();
        // Workflows start empty - users create them via the UI, import, or template
        // SQL Objects start empty - users create them via the UI
        initializeProjectCategories();
        initializeRiskIssueCategories();
        migrateProjectCategoryData();
        initializeProjectSettings();
        initializeStamps();
        initializeLeaveTypes();
        log.info("Data initialization completed");
    }

    /**
     * Updates the approval_history action check constraint to include RECALLED action.
     * This is needed because the constraint was created before RECALLED was added to the enum.
     */
    private void updateApprovalHistoryConstraint() {
        try {
            // Drop the old constraint and create a new one with RECALLED
            entityManager.createNativeQuery(
                "ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_action_check"
            ).executeUpdate();

            entityManager.createNativeQuery(
                "ALTER TABLE approval_history ADD CONSTRAINT approval_history_action_check " +
                "CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED', 'RETURNED', 'REASSIGNED', 'RECALLED'))"
            ).executeUpdate();

            log.info("Updated approval_history action constraint to include RECALLED");
        } catch (Exception e) {
            // Constraint might not exist or already be updated, which is fine
            log.debug("Could not update approval_history constraint: {}", e.getMessage());
        }
    }

    /**
     * Updates the email_approval_tokens action_type check constraint to include ESCALATE and REVIEW actions.
     * This is needed because the constraint was created before these actions were added to the enum.
     */
    private void updateEmailApprovalTokenConstraint() {
        try {
            // Drop the old constraint and create a new one with ESCALATE and REVIEW
            entityManager.createNativeQuery(
                "ALTER TABLE email_approval_tokens DROP CONSTRAINT IF EXISTS email_approval_tokens_action_type_check"
            ).executeUpdate();

            entityManager.createNativeQuery(
                "ALTER TABLE email_approval_tokens ADD CONSTRAINT email_approval_tokens_action_type_check " +
                "CHECK (action_type IN ('APPROVE', 'REJECT', 'VIEW', 'ESCALATE', 'REVIEW'))"
            ).executeUpdate();

            log.info("Updated email_approval_tokens action_type constraint to include ESCALATE and REVIEW");
        } catch (Exception e) {
            // Constraint might not exist or already be updated, which is fine
            log.debug("Could not update email_approval_tokens constraint: {}", e.getMessage());
        }
    }

    private void initializePrivileges() {
        // System privileges
        createPrivilegeIfNotExists("ADMIN", "Full administrative access", "System", true);
        createPrivilegeIfNotExists("SYSTEM", "System level access for lock/unlock", "System", true);

        // Workflow privileges
        createPrivilegeIfNotExists("WORKFLOW_BUILDER", "Create and manage workflows", "Workflow", false);
        createPrivilegeIfNotExists("WORKFLOW_APPROVER", "Approve workflow instances", "Workflow", false);

        // Admin privileges
        createPrivilegeIfNotExists("USER_MANAGEMENT", "Manage users", "Admin", false);
        createPrivilegeIfNotExists("ROLE_MANAGEMENT", "Manage roles", "Admin", false);
        createPrivilegeIfNotExists("SBU_MANAGEMENT", "Manage SBUs", "Admin", false);
        createPrivilegeIfNotExists("SETTINGS_MANAGEMENT", "Manage settings", "Admin", false);
        createPrivilegeIfNotExists("AUDIT_VIEW", "View audit logs", "Admin", false);
        createPrivilegeIfNotExists("REPORT_VIEW", "View reports", "Reporting", false);
        createPrivilegeIfNotExists("IMPORT_EXPORT", "Import and export data", "Data", false);

        // Project Management privileges
        createPrivilegeIfNotExists("PROJECT_VIEW", "View projects, tasks, milestones, risks, issues, and checklists", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_CREATE", "Create new projects and import project data", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_EDIT", "Edit projects, manage tasks, milestones, risks, issues, checklists, and team members", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_DELETE", "Delete projects", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_APPROVE", "Approve, reject, and manage project approval workflows", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_REPORT", "Generate and view project reports (status, budget, tasks, risks, time, milestones, portfolio)", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_SETTINGS", "Manage project settings and configuration", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_IMPORT", "Import projects from external sources (MS Project, templates)", "Project Management", false);
        createPrivilegeIfNotExists("PROJECT_EXPORT", "Export project data and documents", "Project Management", false);

        // Leave Management privileges
        createPrivilegeIfNotExists("LEAVE_VIEW", "View own leave balances and requests", "Leave Management", false);
        createPrivilegeIfNotExists("LEAVE_REQUEST", "Submit leave requests", "Leave Management", false);
        createPrivilegeIfNotExists("LEAVE_APPROVE", "Approve or reject leave requests", "Leave Management", false);
        createPrivilegeIfNotExists("LEAVE_ADMIN", "Manage leave types, policies, balances, and holidays", "Leave Management", false);
        createPrivilegeIfNotExists("LEAVE_REPORT", "View leave reports and analytics", "Leave Management", false);
    }

    private void createPrivilegeIfNotExists(String name, String description, String category, boolean isSystem) {
        if (!privilegeRepository.existsByName(name)) {
            Privilege privilege = Privilege.builder()
                    .name(name)
                    .description(description)
                    .category(category)
                    .isSystemPrivilege(isSystem)
                    .build();
            privilegeRepository.save(privilege);
            log.info("Created privilege: {}", name);
        }
    }

    private void initializeRoles() {
        // Create ROLE_ADMIN with ADMIN privilege
        if (!roleRepository.existsByName("ROLE_ADMIN")) {
            Privilege adminPrivilege = privilegeRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN privilege not found"));
            Privilege systemPrivilege = privilegeRepository.findByName("SYSTEM")
                    .orElseThrow(() -> new RuntimeException("SYSTEM privilege not found"));

            Role adminRole = Role.builder()
                    .name("ROLE_ADMIN")
                    .description("Administrator role with full access")
                    .isSystemRole(true)
                    .privileges(Set.of(adminPrivilege, systemPrivilege))
                    .build();
            roleRepository.save(adminRole);
            log.info("Created role: ROLE_ADMIN");
        }

        // Create ROLE_USER
        if (!roleRepository.existsByName("ROLE_USER")) {
            Role userRole = Role.builder()
                    .name("ROLE_USER")
                    .description("Standard user role")
                    .isSystemRole(true)
                    .build();
            roleRepository.save(userRole);
            log.info("Created role: ROLE_USER");
        }

        // Create ROLE_WORKFLOW_BUILDER
        if (!roleRepository.existsByName("ROLE_WORKFLOW_BUILDER")) {
            Privilege wfBuilderPrivilege = privilegeRepository.findByName("WORKFLOW_BUILDER")
                    .orElseThrow(() -> new RuntimeException("WORKFLOW_BUILDER privilege not found"));

            Role builderRole = Role.builder()
                    .name("ROLE_WORKFLOW_BUILDER")
                    .description("Workflow builder role")
                    .isSystemRole(true)
                    .privileges(Set.of(wfBuilderPrivilege))
                    .build();
            roleRepository.save(builderRole);
            log.info("Created role: ROLE_WORKFLOW_BUILDER");
        }

        // Create ROLE_PROJECT_MANAGER - full project management access
        if (!roleRepository.existsByName("ROLE_PROJECT_MANAGER")) {
            Privilege projView = privilegeRepository.findByName("PROJECT_VIEW").orElse(null);
            Privilege projCreate = privilegeRepository.findByName("PROJECT_CREATE").orElse(null);
            Privilege projEdit = privilegeRepository.findByName("PROJECT_EDIT").orElse(null);
            Privilege projDelete = privilegeRepository.findByName("PROJECT_DELETE").orElse(null);
            Privilege projApprove = privilegeRepository.findByName("PROJECT_APPROVE").orElse(null);
            Privilege projReport = privilegeRepository.findByName("PROJECT_REPORT").orElse(null);
            Privilege projSettings = privilegeRepository.findByName("PROJECT_SETTINGS").orElse(null);
            Privilege projImport = privilegeRepository.findByName("PROJECT_IMPORT").orElse(null);
            Privilege projExport = privilegeRepository.findByName("PROJECT_EXPORT").orElse(null);

            if (projView != null) {
                Role pmRole = Role.builder()
                        .name("ROLE_PROJECT_MANAGER")
                        .description("Project Manager with full project management access including creation, editing, approval, reporting, and settings")
                        .isSystemRole(false)
                        .privileges(Set.of(projView, projCreate, projEdit, projDelete, projApprove, projReport, projSettings, projImport, projExport))
                        .build();
                roleRepository.save(pmRole);
                log.info("Created role: ROLE_PROJECT_MANAGER");
            }
        }

        // Create ROLE_PROJECT_LEAD - can manage project content but not delete or approve
        if (!roleRepository.existsByName("ROLE_PROJECT_LEAD")) {
            Privilege projView = privilegeRepository.findByName("PROJECT_VIEW").orElse(null);
            Privilege projCreate = privilegeRepository.findByName("PROJECT_CREATE").orElse(null);
            Privilege projEdit = privilegeRepository.findByName("PROJECT_EDIT").orElse(null);
            Privilege projReport = privilegeRepository.findByName("PROJECT_REPORT").orElse(null);
            Privilege projExport = privilegeRepository.findByName("PROJECT_EXPORT").orElse(null);

            if (projView != null) {
                Role leadRole = Role.builder()
                        .name("ROLE_PROJECT_LEAD")
                        .description("Project Lead who can create, edit, and report on projects but cannot delete or approve")
                        .isSystemRole(false)
                        .privileges(Set.of(projView, projCreate, projEdit, projReport, projExport))
                        .build();
                roleRepository.save(leadRole);
                log.info("Created role: ROLE_PROJECT_LEAD");
            }
        }

        // Create ROLE_PROJECT_MEMBER - can view and edit assigned tasks/items but not create projects
        if (!roleRepository.existsByName("ROLE_PROJECT_MEMBER")) {
            Privilege projView = privilegeRepository.findByName("PROJECT_VIEW").orElse(null);
            Privilege projEdit = privilegeRepository.findByName("PROJECT_EDIT").orElse(null);
            Privilege projReport = privilegeRepository.findByName("PROJECT_REPORT").orElse(null);

            if (projView != null) {
                Role memberRole = Role.builder()
                        .name("ROLE_PROJECT_MEMBER")
                        .description("Project Team Member who can view projects and edit tasks, risks, issues, and checklists")
                        .isSystemRole(false)
                        .privileges(Set.of(projView, projEdit, projReport))
                        .build();
                roleRepository.save(memberRole);
                log.info("Created role: ROLE_PROJECT_MEMBER");
            }
        }

        // Create ROLE_PROJECT_VIEWER - read-only access to projects and reports
        if (!roleRepository.existsByName("ROLE_PROJECT_VIEWER")) {
            Privilege projView = privilegeRepository.findByName("PROJECT_VIEW").orElse(null);
            Privilege projReport = privilegeRepository.findByName("PROJECT_REPORT").orElse(null);

            if (projView != null) {
                Role viewerRole = Role.builder()
                        .name("ROLE_PROJECT_VIEWER")
                        .description("Project Viewer with read-only access to view projects and reports")
                        .isSystemRole(false)
                        .privileges(Set.of(projView, projReport))
                        .build();
                roleRepository.save(viewerRole);
                log.info("Created role: ROLE_PROJECT_VIEWER");
            }
        }

        // Create ROLE_PROJECT_APPROVER - can view and approve projects
        if (!roleRepository.existsByName("ROLE_PROJECT_APPROVER")) {
            Privilege projView = privilegeRepository.findByName("PROJECT_VIEW").orElse(null);
            Privilege projApprove = privilegeRepository.findByName("PROJECT_APPROVE").orElse(null);
            Privilege projReport = privilegeRepository.findByName("PROJECT_REPORT").orElse(null);

            if (projView != null) {
                Role approverRole = Role.builder()
                        .name("ROLE_PROJECT_APPROVER")
                        .description("Project Approver who can view projects and approve or reject project submissions")
                        .isSystemRole(false)
                        .privileges(Set.of(projView, projApprove, projReport))
                        .build();
                roleRepository.save(approverRole);
                log.info("Created role: ROLE_PROJECT_APPROVER");
            }
        }
    }

    private void initializeUsers() {
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));

        // Create admin user
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("P@88345!"))
                    .email("admin@sonarworks.com")
                    .firstName("System")
                    .lastName("Administrator")
                    .userType(User.UserType.SYSTEM)
                    .roles(Set.of(adminRole))
                    .isActive(true)
                    .isLocked(false)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(admin);
            log.info("Created user: admin");
        }

        // Super user is now managed entirely in code — do not create or modify it in the database
    }

    private void initializeSettings() {
        // Migrate existing workflow settings tab from "Workflows" to "Workflow"
        migrateWorkflowSettingsTab();
        // Migrate tab names to shorter versions
        migrateTabNames();

        // Migrate app.base.url to default value if not set correctly
        migrateAppBaseUrl();

        // General Settings
        createSettingIfNotExists("app.name", "Sona Workflow", "Application Name", "General", "General", Setting.SettingType.STRING);
        createSettingIfNotExists("app.base.url", getDefaultBaseUrl(), "Application Base URL", "General", "General", Setting.SettingType.URL);
        createSettingIfNotExists("app.logo.url", "", "Logo URL", "General", "General", Setting.SettingType.URL);

        // CORS Settings
        createSettingIfNotExists("cors.allowed.origins", "", "Additional CORS Allowed Origins (comma-separated, e.g. https://example.com, http://myapp.local:8080)", "CORS", "General", Setting.SettingType.STRING);
        createSettingIfNotExists("cors.allow.all", "false", "Allow All Origins (not recommended for production)", "CORS", "General", Setting.SettingType.BOOLEAN);

        // Mail Settings - Server Configuration
        createSettingIfNotExists("mail.host", "smtp.gmail.com", "SMTP Server Host", "Server Configuration", "Mail Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("mail.port", "587", "SMTP Server Port", "Server Configuration", "Mail Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("mail.protocol", "smtp", "Mail Protocol", "Server Configuration", "Mail Settings", Setting.SettingType.SELECT, "smtp,smtps,imap,imaps,pop3,pop3s");
        createSettingIfNotExists("mail.username", "", "SMTP Username", "Server Configuration", "Mail Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("mail.password", "", "SMTP Password", "Server Configuration", "Mail Settings", Setting.SettingType.PASSWORD);
        createSettingIfNotExists("mail.from.address", "noreply@sonarworks.com", "From Email Address", "Sender Information", "Mail Settings", Setting.SettingType.EMAIL);
        createSettingIfNotExists("mail.from.name", "Sona Workflow", "From Name", "Sender Information", "Mail Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("mail.reply.to", "", "Reply-To Address", "Sender Information", "Mail Settings", Setting.SettingType.EMAIL);

        // Mail Settings - Security
        createSettingIfNotExists("mail.smtp.auth", "true", "SMTP Authentication Required", "Security", "Mail Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("mail.smtp.starttls.enable", "true", "Enable STARTTLS", "Security", "Mail Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("mail.smtp.ssl.enable", "false", "Enable SSL", "Security", "Mail Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("mail.smtp.ssl.trust", "", "SSL Trust (hostname or *)", "Security", "Mail Settings", Setting.SettingType.STRING);

        // Mail Settings - Timeouts & Limits
        createSettingIfNotExists("mail.smtp.connectiontimeout", "5000", "Connection Timeout (ms)", "Timeouts", "Mail Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("mail.smtp.timeout", "5000", "Read Timeout (ms)", "Timeouts", "Mail Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("mail.smtp.writetimeout", "5000", "Write Timeout (ms)", "Timeouts", "Mail Settings", Setting.SettingType.NUMBER);

        // Mail Settings - Features
        createSettingIfNotExists("mail.enabled", "true", "Email Notifications Enabled", "Features", "Mail Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("mail.debug", "false", "Debug Mode (logs mail details)", "Features", "Mail Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("mail.test.recipient", "", "Test Email Recipient", "Features", "Mail Settings", Setting.SettingType.EMAIL);

        // User Settings - Password Policies
        createSettingIfNotExists("password.min.length", "8", "Minimum Password Length", "Password", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.max.length", "128", "Maximum Password Length", "Password", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.require.uppercase", "true", "Require Uppercase Letters", "Password", "Users", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.lowercase", "true", "Require Lowercase Letters", "Password", "Users", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.numbers", "true", "Require Numbers", "Password", "Users", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.special", "true", "Require Special Characters", "Password", "Users", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.special.chars", "!@#$%^&*()_+-=[]{}|;':\",./<>?", "Allowed Special Characters", "Password", "Users", Setting.SettingType.STRING);
        createSettingIfNotExists("password.lock.max.attempts", "5", "Max Failed Login Attempts", "Password", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.reset.token.expiry.hours", "24", "Password Reset Token Expiry (hours)", "Password", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.change.days", "90", "Force Password Change After (days)", "Password", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.reuse.policy.enabled", "true", "Enable Password Reuse Prevention", "Password Reuse Policy", "Users", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.reuse.history.count", "5", "Number of Previous Passwords to Remember", "Password Reuse Policy", "Users", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.reuse.days", "180", "Prevent Reuse Within (days)", "Password Reuse Policy", "Users", Setting.SettingType.NUMBER);

        // Theme Settings - Brand Colors
        createSettingIfNotExists("theme.primary.color", "#1976d2", "Primary Color", "Brand Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.secondary.color", "#424242", "Secondary Color", "Brand Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.accent.color", "#ff4081", "Accent Color", "Brand Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.brand.color", "#1976d2", "Brand Color", "Brand Colors", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Sidebar
        createSettingIfNotExists("theme.sidebar.bg", "#263238", "Sidebar Background", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.text", "#ffffff", "Sidebar Text Color", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.header.bg", "#1e272c", "Sidebar Header Background", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.footer.bg", "#1e272c", "Sidebar Footer Background", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.user.profile.bg", "#1e272c", "User Profile Area Background", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.user.profile.text", "#ffffff", "User Profile Text Color", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.menu.active.bg", "#1976d2", "Menu Active Background", "Sidebar", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.menu.hover.bg", "#37474f", "Menu Hover Background", "Sidebar", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Header & Body
        createSettingIfNotExists("theme.header.bg", "#ffffff", "Main Header Background", "Header & Body", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.header.text", "#333333", "Main Header Text Color", "Header & Body", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.body.bg", "#f5f5f5", "Body Background", "Header & Body", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.card.bg", "#ffffff", "Card Background", "Header & Body", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.border.color", "#e0e0e0", "Border Color", "Header & Body", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Status Colors
        createSettingIfNotExists("theme.success.color", "#4caf50", "Success Color", "Status Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.warning.color", "#ff9800", "Warning Color", "Status Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.error.color", "#f44336", "Error Color", "Status Colors", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.info.color", "#2196f3", "Info Color", "Status Colors", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Badges
        createSettingIfNotExists("theme.badge.pending.bg", "#ff9800", "Pending Badge Background", "Badges", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.badge.approved.bg", "#4caf50", "Approved Badge Background", "Badges", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.badge.rejected.bg", "#f44336", "Rejected Badge Background", "Badges", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Tables
        createSettingIfNotExists("theme.table.header.bg", "#f5f5f5", "Table Header Background", "Tables", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.table.stripe.bg", "#fafafa", "Table Stripe Background", "Tables", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Buttons
        createSettingIfNotExists("theme.button.primary.bg", "#1976d2", "Primary Button Background", "Buttons", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.primary.text", "#ffffff", "Primary Button Text", "Buttons", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.secondary.bg", "#757575", "Secondary Button Background", "Buttons", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.secondary.text", "#ffffff", "Secondary Button Text", "Buttons", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Links & Inputs
        createSettingIfNotExists("theme.link.color", "#1976d2", "Link Color", "Links & Inputs", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.link.hover.color", "#1565c0", "Link Hover Color", "Links & Inputs", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.bg", "#ffffff", "Input Background", "Links & Inputs", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.border", "#bdbdbd", "Input Border Color", "Links & Inputs", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.focus.border", "#1976d2", "Input Focus Border", "Links & Inputs", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Typography & Mode
        createSettingIfNotExists("theme.font.primary", "Roboto, sans-serif", "Primary Font", "Typography", "Theme", Setting.SettingType.STRING);
        createSettingIfNotExists("theme.font.size.base", "14", "Base Font Size (px)", "Typography", "Theme", Setting.SettingType.NUMBER);
        createSettingIfNotExists("theme.dark.mode", "false", "Dark Mode Enabled", "Typography", "Theme", Setting.SettingType.BOOLEAN);

        // Theme Settings - Form Fields
        createSettingIfNotExists("theme.form.field.header.bg", "#1976d2", "Form Field Header Background", "Form Fields", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.form.field.header.color", "#ffffff", "Form Field Header Color", "Form Fields", "Theme", Setting.SettingType.COLOR);

        // Theme Settings - Function Categories
        createSettingIfNotExists("theme.function.category.bg", "#f5f5f5", "Functions Category Collapsible Background", "Function Categories", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.function.category.color", "#1e90ff", "Functions Category Collapsible Color", "Function Categories", "Theme", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.function.font.size", "11", "Functions Font Size", "Function Categories", "Theme", Setting.SettingType.NUMBER);

        // Backup Settings
        createSettingIfNotExists("backup.location", "C:/Sonar Docs/backups/", "Backup Location", "Backup", "General", Setting.SettingType.STRING);
        createSettingIfNotExists("backup.filename", "workflow_backup", "Backup Filename Prefix", "Backup", "General", Setting.SettingType.STRING);

        // Module Toggles (on General tab so they are easy to find)
        createSettingIfNotExists("module.workflow.enabled", "true", "Workflow Module", "Modules", "General", Setting.SettingType.BOOLEAN, null, -100);
        createSettingIfNotExists("module.projects.enabled", "false", "Projects Module", "Modules", "General", Setting.SettingType.BOOLEAN, null, -100);
        createSettingIfNotExists("module.deadlines.enabled", "false", "Critical Deadlines Module", "Modules", "General", Setting.SettingType.BOOLEAN, null, -100);
        createSettingIfNotExists("module.leave.enabled", "false", "Leave Management Module", "Modules", "General", Setting.SettingType.BOOLEAN, null, -100);
        // Migrate module toggles to General tab if they were previously on individual tabs
        migrateModuleTogglesToGeneralTab();

        // Workflow Settings
        createSettingIfNotExists("workflow.require.approvers", "true", "Require At Least One Approver", "Workflow", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory", "false", "Comments Mandatory on Approval", "Workflow", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory.reject", "true", "Comments Mandatory on Rejection", "Workflow", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory.escalate", "true", "Comments Mandatory on Escalation", "Workflow", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.show.summary", "true", "Show Summary", "Workflow", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.skip.unauthorized.approvers", "false", "Skip Unauthorized Approvers", "Financial Workflows", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.default.seal.id", "", "Default Approval Seal", "Approval Seals", "Workflow", Setting.SettingType.SELECT);
        createSettingIfNotExists("workflow.allow.email.approvals", "true", "Allow Approvals From Email", "Email Approvals", "Workflow", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.email.token.expiry.hours", "48", "Email Approval Token Expiry Hours", "Email Approvals", "Workflow", Setting.SettingType.NUMBER);
        createSettingIfNotExists("workflow.email.show.approval.matrix", "true", "Show Approval Matrix in Emails", "Email Approvals", "Workflow", Setting.SettingType.BOOLEAN);

        // Reporting Settings
        createSettingIfNotExists("reporting.font.size", "14", "Reporting Font Size (px)", "Display", "Reporting", Setting.SettingType.NUMBER);
        createSettingIfNotExists("reporting.roles", "", "Report Roles (comma-separated role names)", "Access Control", "Reporting", Setting.SettingType.STRING);

        // Critical Deadlines Settings
        createSettingIfNotExists("deadline.scheduler.enabled", "true", "Enable Automatic Deadline Checking", "Scheduling", "Deadlines", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("deadline.scheduler.cron", "0 0 7 * * *", "Scheduler Cron Expression (default: daily at 7 AM)", "Scheduling", "Deadlines", Setting.SettingType.STRING);
        createSettingIfNotExists("deadline.scheduler.hour", "7", "Scheduler Run Hour (0-23)", "Scheduling", "Deadlines", Setting.SettingType.NUMBER);
        createSettingIfNotExists("deadline.scheduler.minute", "0", "Scheduler Run Minute (0-59)", "Scheduling", "Deadlines", Setting.SettingType.NUMBER);
        createSettingIfNotExists("deadline.due.soon.threshold.days", "7", "Due Soon Threshold (days before due date)", "Status Thresholds", "Deadlines", Setting.SettingType.NUMBER);
        createSettingIfNotExists("deadline.look.ahead.days", "60", "Reminder Look-Ahead Period (days)", "Reminders", "Deadlines", Setting.SettingType.NUMBER);
        createSettingIfNotExists("deadline.default.reminder.days", "30,7,1", "Default Reminder Days Before Due Date (comma-separated)", "Reminders", "Deadlines", Setting.SettingType.STRING);
        createSettingIfNotExists("deadline.overdue.repeat.notification", "false", "Send Repeated Overdue Notifications Daily", "Overdue", "Deadlines", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("deadline.overdue.escalation.days", "7", "Escalate Overdue After (days)", "Overdue", "Deadlines", Setting.SettingType.NUMBER);
        createSettingIfNotExists("deadline.email.notifications.enabled", "true", "Enable Email Notifications for Deadlines", "Notifications", "Deadlines", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("deadline.screen.notifications.enabled", "true", "Enable Screen Notifications for Deadlines", "Notifications", "Deadlines", Setting.SettingType.BOOLEAN);

        // Leave Management Settings
        createSettingIfNotExists("leave.year.start.month", "1", "Leave Year Start Month (1=Jan, 4=Apr)", "General", "Leave", Setting.SettingType.SELECT, "1,2,3,4,5,6,7,8,9,10,11,12");
        createSettingIfNotExists("leave.weekend.days", "SATURDAY,SUNDAY", "Weekend Days", "General", "Leave", Setting.SettingType.STRING);
        createSettingIfNotExists("leave.half.day.enabled", "true", "Allow Half-Day Leave", "General", "Leave", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("leave.min.days.advance", "1", "Minimum Days Advance for Request", "Requests", "Leave", Setting.SettingType.NUMBER);
        createSettingIfNotExists("leave.overlap.allowed", "false", "Allow Overlapping Leave Requests", "Requests", "Leave", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("leave.max.carry.over.days", "5", "Default Max Carry-Over Days", "Carry-Over", "Leave", Setting.SettingType.NUMBER);
        createSettingIfNotExists("leave.carry.over.expiry.months", "3", "Carry-Over Expiry (Months into New Year)", "Carry-Over", "Leave", Setting.SettingType.NUMBER);
        createSettingIfNotExists("leave.encashment.enabled", "false", "Allow Leave Encashment", "Encashment", "Leave", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("leave.notifications.enabled", "true", "Enable Leave Email Notifications", "Notifications", "Leave", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("leave.approval.chain", "MANAGER", "Approval Chain", "Approvals", "Leave", Setting.SettingType.SELECT, "MANAGER,DEPARTMENT_HEAD,HR,CUSTOM");
        createSettingIfNotExists("leave.auto.approve.cancel", "false", "Auto-Approve Cancellations", "Approvals", "Leave", Setting.SettingType.BOOLEAN);
    }

    private void migrateWorkflowSettingsTab() {
        // Update any settings with old tab name "Workflows" to new tab name "Workflow"
        settingRepository.findAll().stream()
                .filter(s -> "Workflows".equals(s.getTab()))
                .forEach(s -> {
                    s.setTab("Workflow");
                    settingRepository.save(s);
                    log.info("Migrated setting {} tab from 'Workflows' to 'Workflow Settings'", s.getKey());
                });
    }

    private void migrateAppBaseUrl() {
        String defaultUrl = getDefaultBaseUrl();
        settingRepository.findByKey("app.base.url").ifPresent(setting -> {
            String current = setting.getValue();
            if (current == null || current.isEmpty() || !current.startsWith("http")
                    || current.contains("localhost") || current.contains("127.0.0.1")) {
                setting.setValue(defaultUrl);
                settingRepository.save(setting);
                log.info("Updated app.base.url to {}", defaultUrl);
            }
        });
    }

    private String getDefaultBaseUrl() {
        String ip = getLocalIpAddress();
        return "http://" + ip + ":9500";
    }

    private String getLocalIpAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof java.net.Inet4Address && !addr.isLoopbackAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not detect local IP address: {}", e.getMessage());
        }
        return "localhost";
    }

    private void migrateTabNames() {
        settingRepository.findAll().forEach(s -> {
            String oldTab = s.getTab();
            String newTab = null;
            if ("Workflow Settings".equals(oldTab)) {
                newTab = "Workflow";
            } else if ("User Settings".equals(oldTab)) {
                newTab = "Users";
            } else if ("Theme Settings".equals(oldTab)) {
                newTab = "Theme";
            } else if ("Project Settings".equals(oldTab)) {
                newTab = "Projects";
            }
            if (newTab != null) {
                s.setTab(newTab);
                settingRepository.save(s);
                log.info("Migrated setting {} tab from '{}' to '{}'", s.getKey(), oldTab, newTab);
            }
        });
    }

    private void migrateModuleTogglesToGeneralTab() {
        settingRepository.findAll().stream()
                .filter(s -> s.getKey() != null && s.getKey().startsWith("module.") && s.getKey().endsWith(".enabled"))
                .filter(s -> !"General".equals(s.getTab()))
                .forEach(s -> {
                    String oldTab = s.getTab();
                    s.setTab("General");
                    s.setCategory("Modules");
                    s.setDisplayOrder(-100);
                    // Give them better labels
                    if ("module.workflow.enabled".equals(s.getKey())) {
                        s.setLabel("Workflow Module");
                    } else if ("module.projects.enabled".equals(s.getKey())) {
                        s.setLabel("Projects Module");
                    } else if ("module.deadlines.enabled".equals(s.getKey())) {
                        s.setLabel("Critical Deadlines Module");
                    }
                    settingRepository.save(s);
                    log.info("Migrated module toggle {} from tab '{}' to 'General'", s.getKey(), oldTab);
                });
    }

    private void createSettingIfNotExists(String key, String value, String label, String category, String tab, Setting.SettingType type) {
        createSettingIfNotExists(key, value, label, category, tab, type, null);
    }

    private void createSettingIfNotExists(String key, String value, String label, String category, String tab, Setting.SettingType type, String options) {
        createSettingIfNotExists(key, value, label, category, tab, type, options, null);
    }

    private void createSettingIfNotExists(String key, String value, String label, String category, String tab, Setting.SettingType type, String options, Integer displayOrder) {
        if (!settingRepository.existsByKey(key)) {
            Setting setting = Setting.builder()
                    .key(key)
                    .value(value)
                    .label(label)
                    .category(category)
                    .tab(tab)
                    .type(type)
                    .options(options)
                    .displayOrder(displayOrder != null ? displayOrder : 0)
                    .isSystem(true)
                    .build();
            settingRepository.save(setting);
        }
    }

    private void initializeSystemState() {
        if (systemStateRepository.findCurrentState().isEmpty()) {
            SystemState state = SystemState.builder()
                    .isLocked(false)
                    .maintenanceMode(false)
                    .build();
            systemStateRepository.save(state);
            log.info("Initialized system state");
        }
    }

    // SBU initialization removed - users create SBUs via import or manually

    private void initializeWorkflowTypes() {
        createWorkflowTypeIfNotExists("APPROVAL", "Approval", "General approval workflows", "approval", "#4CAF50", 1);
        createWorkflowTypeIfNotExists("REQUISITION", "Requisition", "Purchase and supply requisitions", "shopping_cart", "#2196F3", 2);
        createWorkflowTypeIfNotExists("LEAVE", "Leave Request", "Employee leave and time-off requests", "event_busy", "#FF9800", 3);
        createWorkflowTypeIfNotExists("EXPENSE", "Expense Claim", "Expense reimbursement workflows", "receipt", "#9C27B0", 4);
        createWorkflowTypeIfNotExists("TRAVEL", "Travel Request", "Business travel approval workflows", "flight", "#00BCD4", 5);
        createWorkflowTypeIfNotExists("HR", "HR Process", "Human resources related workflows", "people", "#E91E63", 6);
        createWorkflowTypeIfNotExists("FINANCE", "Finance", "Financial approval workflows", "account_balance", "#607D8B", 7);
        createWorkflowTypeIfNotExists("IT", "IT Request", "IT support and service requests", "computer", "#795548", 8);
        createWorkflowTypeIfNotExists("CUSTOM", "Custom", "Custom workflow type", "settings", "#9E9E9E", 99);
    }

    private void createWorkflowTypeIfNotExists(String code, String name, String description, String icon, String color, int displayOrder) {
        if (!workflowTypeRepository.existsByCode(code)) {
            WorkflowType type = WorkflowType.builder()
                    .code(code)
                    .name(name)
                    .description(description)
                    .icon(icon)
                    .color(color)
                    .displayOrder(displayOrder)
                    .build();
            type.setIsActive(true);
            workflowTypeRepository.save(type);
            log.info("Created workflow type: {}", name);
        }
    }

    private void initializeSampleWorkflows() {
        // Create Leave Request workflow
        createWorkflowIfNotExists(
            "Leave Request",
            "LEAVE_REQUEST",
            "Submit leave requests for approval",
            "LEAVE",
            "event_busy",
            1
        );

        // Create Expense Claim workflow
        createWorkflowIfNotExists(
            "Expense Claim",
            "EXPENSE_CLAIM",
            "Submit expense claims for reimbursement",
            "EXPENSE",
            "receipt",
            2
        );

        // Create Purchase Requisition workflow
        createWorkflowIfNotExists(
            "Purchase Requisition",
            "PURCHASE_REQ",
            "Request approval for purchases",
            "REQUISITION",
            "shopping_cart",
            3
        );

        // Create Travel Request workflow
        createWorkflowIfNotExists(
            "Travel Request",
            "TRAVEL_REQUEST",
            "Submit travel requests for approval",
            "TRAVEL",
            "flight",
            4
        );
    }

    private void createWorkflowIfNotExists(String name, String code, String description, String typeCode, String icon, int displayOrder) {
        if (!workflowRepository.existsByCode(code)) {
            WorkflowType type = workflowTypeRepository.findByCode(typeCode).orElse(null);

            Workflow workflow = Workflow.builder()
                    .name(name)
                    .code(code)
                    .description(description)
                    .workflowType(type)
                    .icon(icon)
                    .displayOrder(displayOrder)
                    .requiresApproval(true)
                    .isPublished(true)
                    .versionNumber(1)
                    .commentsMandatory(false)
                    .commentsMandatoryOnReject(true)
                    .commentsMandatoryOnEscalate(true)
                    .build();
            workflow.setIsActive(true);

            Workflow savedWorkflow = workflowRepository.save(workflow);

            // Create default main form
            WorkflowForm mainForm = WorkflowForm.builder()
                    .workflow(savedWorkflow)
                    .name("Main Form")
                    .displayOrder(0)
                    .isMainForm(true)
                    .build();
            workflowFormRepository.save(mainForm);

            log.info("Created sample workflow: {}", name);
        }
    }


    private void initializeProjectCategories() {
        String[][] categories = {
            {"INTERNAL", "Internal", "Internal company projects"},
            {"EXTERNAL", "External", "External client projects"},
            {"RESEARCH", "Research", "Research and development projects"},
            {"INFRASTRUCTURE", "Infrastructure", "Infrastructure projects"},
            {"SOFTWARE", "Software", "Software development projects"},
            {"CONSULTING", "Consulting", "Consulting engagements"},
            {"MAINTENANCE", "Maintenance", "Maintenance and support projects"},
            {"OTHER", "Other", "Other project types"}
        };

        for (String[] cat : categories) {
            if (!projectCategoryRepository.existsByCode(cat[0])) {
                ProjectCategory category = ProjectCategory.builder()
                        .code(cat[0])
                        .name(cat[1])
                        .description(cat[2])
                        .build();
                category.setIsActive(true);
                projectCategoryRepository.save(category);
                log.info("Created project category: {}", cat[1]);
            }
        }
    }

    private void initializeRiskIssueCategories() {
        // {code, name, description, type}
        String[][] categories = {
            {"TECHNICAL", "Technical", "Technical risks and issues", "BOTH"},
            {"SCHEDULE", "Schedule", "Schedule and timeline risks/issues", "BOTH"},
            {"RESOURCE", "Resource", "Resource availability and capacity", "BOTH"},
            {"BUDGET", "Budget", "Budget and financial risks/issues", "BOTH"},
            {"SCOPE", "Scope", "Scope creep and requirements changes", "BOTH"},
            {"QUALITY", "Quality", "Quality and standards risks/issues", "BOTH"},
            {"EXTERNAL", "External", "External dependencies and third-party risks", "RISK"},
            {"COMPLIANCE", "Compliance", "Regulatory and compliance risks", "RISK"},
            {"SECURITY", "Security", "Security and data protection risks", "RISK"},
            {"BUG", "Bug", "Software defects and bugs", "ISSUE"},
            {"CHANGE_REQUEST", "Change Request", "Requested changes to scope or requirements", "ISSUE"},
            {"ENVIRONMENT", "Environment", "Infrastructure and environment issues", "ISSUE"},
            {"INTEGRATION", "Integration", "Integration and compatibility issues", "ISSUE"},
            {"OTHER", "Other", "Other uncategorized risks/issues", "BOTH"}
        };

        for (String[] cat : categories) {
            if (!riskIssueCategoryRepository.existsByCode(cat[0])) {
                RiskIssueCategory category = RiskIssueCategory.builder()
                        .code(cat[0])
                        .name(cat[1])
                        .description(cat[2])
                        .type(RiskIssueCategory.CategoryType.valueOf(cat[3]))
                        .isActive(true)
                        .build();
                riskIssueCategoryRepository.save(category);
                log.info("Created risk/issue category: {}", cat[1]);
            }
        }
    }

    private void initializeProjectSettings() {
        try {
            projectSettingsService.initializeDefaultSettings();
            log.info("Project settings initialized");
        } catch (Exception e) {
            log.debug("Project settings initialization skipped: {}", e.getMessage());
        }
    }

    private void migrateProjectCategoryData() {
        try {
            // Check if old varchar category column exists on the projects table
            var result = entityManager.createNativeQuery(
                "SELECT column_name FROM information_schema.columns " +
                "WHERE table_name = 'projects' AND column_name = 'category' AND data_type IN ('character varying', 'varchar', 'text')"
            ).getResultList();

            if (!result.isEmpty()) {
                // Migrate existing category varchar values to the new category_id FK
                // First ensure category_id column exists (JPA should have created it)
                var categoryIdCheck = entityManager.createNativeQuery(
                    "SELECT column_name FROM information_schema.columns " +
                    "WHERE table_name = 'projects' AND column_name = 'category_id'"
                ).getResultList();

                if (!categoryIdCheck.isEmpty()) {
                    // Update projects that have a varchar category but no category_id
                    entityManager.createNativeQuery(
                        "UPDATE projects p SET category_id = pc.id " +
                        "FROM project_categories pc " +
                        "WHERE p.category_id IS NULL AND p.category IS NOT NULL AND UPPER(p.category) = pc.code"
                    ).executeUpdate();

                    // Drop the old varchar category column
                    entityManager.createNativeQuery(
                        "ALTER TABLE projects DROP COLUMN IF EXISTS category"
                    ).executeUpdate();

                    log.info("Migrated project category data from varchar to FK");
                }
            }
        } catch (Exception e) {
            log.debug("Project category migration skipped: {}", e.getMessage());
        }
    }

    /**
     * Creates 12 approval seal stamps. Each is a circular seal with arced text at top/bottom
     * and a clear center area where the approver's signature gets embedded on final approval.
     */
    private void initializeStamps() {
        if (stampRepository.count() > 0) return;
        log.info("Initializing system approval seals...");

        // Helper: generates a circular approval seal SVG with arced top/bottom text and clear center for signature
        // Parameters: topText, bottomText
        // Center area (y=80 to y=140) is intentionally empty for signature overlay
        java.util.function.BiFunction<String, String, String> seal = (topText, bottomText) ->
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>" +
            "<circle cx='120' cy='120' r='115' fill='none' stroke='currentColor' stroke-width='4'/>" +
            "<circle cx='120' cy='120' r='108' fill='none' stroke='currentColor' stroke-width='6'/>" +
            "<circle cx='120' cy='120' r='101' fill='none' stroke='currentColor' stroke-width='1.5'/>" +
            "<circle cx='120' cy='120' r='68' fill='none' stroke='currentColor' stroke-width='0.8' stroke-dasharray='3,2'/>" +
            "<text x='32' y='125' font-size='12' fill='currentColor'>&#x2605;</text>" +
            "<text x='200' y='125' font-size='12' fill='currentColor'>&#x2605;</text>" +
            "<defs><path id='arcT' d='M 38,120 A 82,82 0 0,1 202,120'/><path id='arcB' d='M 202,120 A 82,82 0 0,1 38,120'/></defs>" +
            "<text fill='currentColor' font-family='serif' font-size='14' font-weight='bold' letter-spacing='3'>" +
            "<textPath href='#arcT' startOffset='50%' text-anchor='middle'>" + topText + "</textPath></text>" +
            "<text fill='currentColor' font-family='serif' font-size='11' letter-spacing='2'>" +
            "<textPath href='#arcB' startOffset='50%' text-anchor='middle'>" + bottomText + "</textPath></text>" +
            "</svg>";

        String[][] seals = {
            {"APPROVED",           "Classic green approval seal",         "#1b5e20", seal.apply("APPROVED",           "AUTHORIZED \\u0026 SIGNED")},
            {"BOARD APPROVED",     "Board of directors approval seal",    "#0d47a1", seal.apply("BOARD APPROVED",     "BOARD OF DIRECTORS")},
            {"CERTIFIED",          "Certification seal — blue",           "#1565c0", seal.apply("CERTIFIED",          "CERTIFIED TRUE COPY")},
            {"ENDORSED",           "Official endorsement seal",           "#1565c0", seal.apply("ENDORSED",           "OFFICIALLY ENDORSED")},
            {"AUTHORIZED",         "Authorization seal — navy",           "#1a237e", seal.apply("AUTHORIZED",         "DULY AUTHORIZED")},
            {"VERIFIED",           "Verification seal — teal",            "#00695c", seal.apply("VERIFIED",           "VERIFIED \\u0026 CONFIRMED")},
            {"NOTARIZED",          "Notary public seal — purple",         "#4a148c", seal.apply("NOTARIZED",          "NOTARY PUBLIC")},
            {"APPROVED FOR PAYMENT", "Payment approval seal — green",     "#2e7d32", seal.apply("APPROVED FOR PAYMENT", "FINANCE DEPARTMENT")},
            {"FINAL APPROVAL",     "Final approval seal — dark blue",     "#0d47a1", seal.apply("FINAL APPROVAL",     "NO FURTHER ACTION")},
            {"COMPLIANCE APPROVED", "Compliance approval seal — green",   "#1b5e20", seal.apply("COMPLIANCE APPROVED", "MEETS REQUIREMENTS")},
            {"QUALITY APPROVED",   "Quality assurance seal — teal",       "#00695c", seal.apply("QUALITY APPROVED",   "QA DEPARTMENT")},
            {"EXECUTIVE APPROVAL", "Executive approval seal — dark",      "#263238", seal.apply("EXECUTIVE APPROVAL", "SENIOR MANAGEMENT")}
        };

        for (int i = 0; i < seals.length; i++) {
            Stamp s = Stamp.builder()
                    .name(seals[i][0])
                    .description(seals[i][1])
                    .stampColor(seals[i][2])
                    .svgContent(seals[i][3])
                    .displayOrder(i + 1)
                    .isSystem(true)
                    .build();
            stampRepository.save(s);
        }
        log.info("Initialized {} approval seals", seals.length);

        // Remove any old non-seal stamps from previous versions
        cleanupOldStamps();
    }

    private void cleanupOldStamps() {
        java.util.Set<String> approvalSealNames = java.util.Set.of(
            "APPROVED", "BOARD APPROVED", "CERTIFIED", "ENDORSED", "AUTHORIZED", "VERIFIED",
            "NOTARIZED", "APPROVED FOR PAYMENT", "FINAL APPROVAL", "COMPLIANCE APPROVED",
            "QUALITY APPROVED", "EXECUTIVE APPROVAL"
        );
        List<Stamp> allStamps = stampRepository.findAll();
        List<Stamp> toRemove = allStamps.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsSystem()) && !approvalSealNames.contains(s.getName()))
                .toList();
        if (!toRemove.isEmpty()) {
            stampRepository.deleteAll(toRemove);
            log.info("Removed {} old non-seal stamps", toRemove.size());
        }
    }

    private void initializeLeaveTypes() {
        if (leaveTypeRepository.count() > 0) return;
        log.info("Initializing default leave types...");

        Object[][] types = {
            {"Annual Leave",        "ANNUAL",        "#4caf50", true,  21, LeaveType.ApplicableGender.ALL,    false, null,  1},
            {"Sick Leave",          "SICK",          "#f44336", true,  10, LeaveType.ApplicableGender.ALL,    true,  2,     2},
            {"Maternity Leave",     "MATERNITY",     "#e91e63", true,  90, LeaveType.ApplicableGender.FEMALE, false, null,  3},
            {"Paternity Leave",     "PATERNITY",     "#2196f3", true,  10, LeaveType.ApplicableGender.MALE,   false, null,  4},
            {"Compassionate Leave", "COMPASSIONATE", "#9c27b0", true,   5, LeaveType.ApplicableGender.ALL,    false, null,  5},
            {"Study Leave",         "STUDY",         "#ff9800", true,   5, LeaveType.ApplicableGender.ALL,    false, null,  6},
            {"Unpaid Leave",        "UNPAID",        "#757575", false, 30, LeaveType.ApplicableGender.ALL,    false, null,  7}
        };

        for (Object[] t : types) {
            LeaveType leaveType = LeaveType.builder()
                    .name((String) t[0])
                    .code((String) t[1])
                    .colorCode((String) t[2])
                    .isPaid((Boolean) t[3])
                    .defaultDaysPerYear((Integer) t[4])
                    .applicableGender((LeaveType.ApplicableGender) t[5])
                    .requiresAttachment((Boolean) t[6])
                    .attachmentRequiredAfterDays((Integer) t[7])
                    .displayOrder((Integer) t[8])
                    .build();
            leaveType.setIsActive(true);
            leaveType = leaveTypeRepository.save(leaveType);

            // Create a default policy for each type
            LeavePolicy policy = LeavePolicy.builder()
                    .leaveType(leaveType)
                    .name("Default " + t[0] + " Policy")
                    .daysAllowed((Integer) t[4])
                    .maxCarryOverDays(leaveType.getCode().equals("ANNUAL") ? 5 : 0)
                    .accrualMethod(LeavePolicy.AccrualMethod.ANNUAL_UPFRONT)
                    .proRataForNewJoiners(true)
                    .allowHalfDay(true)
                    .isDefault(true)
                    .build();
            policy.setIsActive(true);
            leavePolicyRepository.save(policy);
        }

        log.info("Initialized {} default leave types with policies", types.length);
    }
}
