package com.sonar.workflow.config;

import com.sonar.workflow.entity.Privilege;
import com.sonar.workflow.entity.Role;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.repository.PrivilegeRepository;
import com.sonar.workflow.repository.RoleRepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("prod")
@Order(1)
public class ProductionDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PrivilegeRepository privilegeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Running production data initialization...");
        initializePrivileges();
        initializeRoles();
        initializeUsers();
        log.info("Production data initialization completed");
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
}
