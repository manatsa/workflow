package com.sonarworks.workflow.config;

import com.sonarworks.workflow.entity.*;
import com.sonarworks.workflow.repository.*;
import com.sonarworks.workflow.repository.WorkflowTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        initializePrivileges();
        initializeRoles();
        initializeUsers();
        initializeSettings();
        initializeSystemState();
        initializeSBUs();
        initializeWorkflowTypes();
        initializeSampleWorkflows();
        log.info("Data initialization completed");
    }

    private void initializePrivileges() {
        createPrivilegeIfNotExists("ADMIN", "Full administrative access", "System", true);
        createPrivilegeIfNotExists("SYSTEM", "System level access for lock/unlock", "System", true);
        createPrivilegeIfNotExists("WORKFLOW_BUILDER", "Create and manage workflows", "Workflow", false);
        createPrivilegeIfNotExists("WORKFLOW_APPROVER", "Approve workflow instances", "Workflow", false);
        createPrivilegeIfNotExists("USER_MANAGEMENT", "Manage users", "Admin", false);
        createPrivilegeIfNotExists("ROLE_MANAGEMENT", "Manage roles", "Admin", false);
        createPrivilegeIfNotExists("SBU_MANAGEMENT", "Manage SBUs", "Admin", false);
        createPrivilegeIfNotExists("SETTINGS_MANAGEMENT", "Manage settings", "Admin", false);
        createPrivilegeIfNotExists("AUDIT_VIEW", "View audit logs", "Admin", false);
        createPrivilegeIfNotExists("REPORT_VIEW", "View reports", "Reporting", false);
        createPrivilegeIfNotExists("IMPORT_EXPORT", "Import and export data", "Data", false);
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

        // Create super user
        if (!userRepository.existsByUsername("super")) {
            User superUser = User.builder()
                    .username("super")
                    .password(passwordEncoder.encode("Th3H3ar20fC0d3!"))
                    .email("super@sonarworks.com")
                    .firstName("Super")
                    .lastName("User")
                    .userType(User.UserType.SYSTEM)
                    .roles(Set.of(adminRole))
                    .isActive(true)
                    .isLocked(false)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(superUser);
            log.info("Created user: super");
        }
    }

    private void initializeSettings() {
        // General Settings
        createSettingIfNotExists("app.name", "Sonarworks Workflow System", "Application Name", "General", "General", Setting.SettingType.STRING);
        createSettingIfNotExists("app.base.url", "http://localhost:4200", "Application Base URL", "General", "General", Setting.SettingType.URL);
        createSettingIfNotExists("app.logo.url", "", "Logo URL", "General", "General", Setting.SettingType.URL);

        // Mail Settings - Server Configuration
        createSettingIfNotExists("mail.host", "smtp.gmail.com", "SMTP Server Host", "Server Configuration", "Mail Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("mail.port", "587", "SMTP Server Port", "Server Configuration", "Mail Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("mail.protocol", "smtp", "Mail Protocol", "Server Configuration", "Mail Settings", Setting.SettingType.SELECT, "smtp,smtps,imap,imaps,pop3,pop3s");
        createSettingIfNotExists("mail.username", "", "SMTP Username", "Server Configuration", "Mail Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("mail.password", "", "SMTP Password", "Server Configuration", "Mail Settings", Setting.SettingType.PASSWORD);
        createSettingIfNotExists("mail.from.address", "noreply@sonarworks.com", "From Email Address", "Sender Information", "Mail Settings", Setting.SettingType.EMAIL);
        createSettingIfNotExists("mail.from.name", "Sonarworks Workflow", "From Name", "Sender Information", "Mail Settings", Setting.SettingType.STRING);
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
        createSettingIfNotExists("password.min.length", "8", "Minimum Password Length", "Password", "User Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.max.length", "128", "Maximum Password Length", "Password", "User Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.require.uppercase", "true", "Require Uppercase Letters", "Password", "User Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.lowercase", "true", "Require Lowercase Letters", "Password", "User Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.numbers", "true", "Require Numbers", "Password", "User Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.require.special", "true", "Require Special Characters", "Password", "User Settings", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("password.special.chars", "!@#$%^&*()_+-=[]{}|;':\",./<>?", "Allowed Special Characters", "Password", "User Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("password.lock.max.attempts", "5", "Max Failed Login Attempts", "Password", "User Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.reset.token.expiry.hours", "24", "Password Reset Token Expiry (hours)", "Password", "User Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("password.change.days", "90", "Force Password Change After (days)", "Password", "User Settings", Setting.SettingType.NUMBER);

        // Theme Settings - Brand Colors
        createSettingIfNotExists("theme.primary.color", "#1976d2", "Primary Color", "Brand Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.secondary.color", "#424242", "Secondary Color", "Brand Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.accent.color", "#ff4081", "Accent Color", "Brand Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.brand.color", "#1976d2", "Brand Color", "Brand Colors", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Sidebar
        createSettingIfNotExists("theme.sidebar.bg", "#263238", "Sidebar Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.text", "#ffffff", "Sidebar Text Color", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.header.bg", "#1e272c", "Sidebar Header Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.sidebar.footer.bg", "#1e272c", "Sidebar Footer Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.user.profile.bg", "#1e272c", "User Profile Area Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.user.profile.text", "#ffffff", "User Profile Text Color", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.menu.active.bg", "#1976d2", "Menu Active Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.menu.hover.bg", "#37474f", "Menu Hover Background", "Sidebar", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Header & Body
        createSettingIfNotExists("theme.header.bg", "#ffffff", "Main Header Background", "Header & Body", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.header.text", "#333333", "Main Header Text Color", "Header & Body", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.body.bg", "#f5f5f5", "Body Background", "Header & Body", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.card.bg", "#ffffff", "Card Background", "Header & Body", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.border.color", "#e0e0e0", "Border Color", "Header & Body", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Status Colors
        createSettingIfNotExists("theme.success.color", "#4caf50", "Success Color", "Status Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.warning.color", "#ff9800", "Warning Color", "Status Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.error.color", "#f44336", "Error Color", "Status Colors", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.info.color", "#2196f3", "Info Color", "Status Colors", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Badges
        createSettingIfNotExists("theme.badge.pending.bg", "#ff9800", "Pending Badge Background", "Badges", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.badge.approved.bg", "#4caf50", "Approved Badge Background", "Badges", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.badge.rejected.bg", "#f44336", "Rejected Badge Background", "Badges", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Tables
        createSettingIfNotExists("theme.table.header.bg", "#f5f5f5", "Table Header Background", "Tables", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.table.stripe.bg", "#fafafa", "Table Stripe Background", "Tables", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Buttons
        createSettingIfNotExists("theme.button.primary.bg", "#1976d2", "Primary Button Background", "Buttons", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.primary.text", "#ffffff", "Primary Button Text", "Buttons", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.secondary.bg", "#757575", "Secondary Button Background", "Buttons", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.button.secondary.text", "#ffffff", "Secondary Button Text", "Buttons", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Links & Inputs
        createSettingIfNotExists("theme.link.color", "#1976d2", "Link Color", "Links & Inputs", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.link.hover.color", "#1565c0", "Link Hover Color", "Links & Inputs", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.bg", "#ffffff", "Input Background", "Links & Inputs", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.border", "#bdbdbd", "Input Border Color", "Links & Inputs", "Theme Settings", Setting.SettingType.COLOR);
        createSettingIfNotExists("theme.input.focus.border", "#1976d2", "Input Focus Border", "Links & Inputs", "Theme Settings", Setting.SettingType.COLOR);

        // Theme Settings - Typography & Mode
        createSettingIfNotExists("theme.font.primary", "Roboto, sans-serif", "Primary Font", "Typography", "Theme Settings", Setting.SettingType.STRING);
        createSettingIfNotExists("theme.font.size.base", "14", "Base Font Size (px)", "Typography", "Theme Settings", Setting.SettingType.NUMBER);
        createSettingIfNotExists("theme.dark.mode", "false", "Dark Mode Enabled", "Typography", "Theme Settings", Setting.SettingType.BOOLEAN);

        // Backup Settings
        createSettingIfNotExists("backup.location", "C:/Sonar Docs/backups/", "Backup Location", "Backup", "General", Setting.SettingType.STRING);
        createSettingIfNotExists("backup.filename", "workflow_backup", "Backup Filename Prefix", "Backup", "General", Setting.SettingType.STRING);

        // Workflow Settings
        createSettingIfNotExists("workflow.require.approvers", "true", "Require At Least One Approver", "Workflow", "Workflows", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory", "false", "Comments Mandatory on Approval", "Workflow", "Workflows", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory.reject", "true", "Comments Mandatory on Rejection", "Workflow", "Workflows", Setting.SettingType.BOOLEAN);
        createSettingIfNotExists("workflow.comments.mandatory.escalate", "true", "Comments Mandatory on Escalation", "Workflow", "Workflows", Setting.SettingType.BOOLEAN);
    }

    private void createSettingIfNotExists(String key, String value, String label, String category, String tab, Setting.SettingType type) {
        createSettingIfNotExists(key, value, label, category, tab, type, null);
    }

    private void createSettingIfNotExists(String key, String value, String label, String category, String tab, Setting.SettingType type, String options) {
        if (!settingRepository.existsByKey(key)) {
            Setting setting = Setting.builder()
                    .key(key)
                    .value(value)
                    .label(label)
                    .category(category)
                    .tab(tab)
                    .type(type)
                    .options(options)
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

    private void initializeSBUs() {
        // Create root SBU (Head Office)
        SBU headOffice = createSBUIfNotExists("HO", "Head Office", "Main headquarters", null, true);

        // Create regional SBUs
        SBU northRegion = createSBUIfNotExists("NORTH", "North Region", "Northern regional office", headOffice, false);
        SBU southRegion = createSBUIfNotExists("SOUTH", "South Region", "Southern regional office", headOffice, false);
        SBU eastRegion = createSBUIfNotExists("EAST", "East Region", "Eastern regional office", headOffice, false);
        SBU westRegion = createSBUIfNotExists("WEST", "West Region", "Western regional office", headOffice, false);

        // Create branch SBUs under regions
        createSBUIfNotExists("NORTH-BR1", "North Branch 1", "First branch in North region", northRegion, false);
        createSBUIfNotExists("NORTH-BR2", "North Branch 2", "Second branch in North region", northRegion, false);
        createSBUIfNotExists("SOUTH-BR1", "South Branch 1", "First branch in South region", southRegion, false);
        createSBUIfNotExists("SOUTH-BR2", "South Branch 2", "Second branch in South region", southRegion, false);
        createSBUIfNotExists("EAST-BR1", "East Branch 1", "First branch in East region", eastRegion, false);
        createSBUIfNotExists("WEST-BR1", "West Branch 1", "First branch in West region", westRegion, false);
    }

    private SBU createSBUIfNotExists(String code, String name, String description, SBU parent, boolean isRoot) {
        if (sbuRepository.existsByCode(code)) {
            return sbuRepository.findByCode(code).orElse(null);
        }

        SBU sbu = SBU.builder()
                .code(code)
                .name(name)
                .description(description)
                .parent(parent)
                .isRoot(isRoot)
                .build();
        sbu.setIsActive(true);
        SBU saved = sbuRepository.save(sbu);
        log.info("Created SBU: {}", name);
        return saved;
    }

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
}
