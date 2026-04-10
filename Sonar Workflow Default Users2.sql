-- ============================================================================
-- Sonar Workflow - Default Privileges, Roles & Users Setup Script
-- ============================================================================
-- Target: PostgreSQL (database: workflow, user: sonar)
-- Safe to run on existing databases - all inserts are idempotent.
--
-- Default Users:
--   admin / P@88345!       (System Administrator)
--   super / Crypt20@!        (Super User - special privileges)
--
-- Both users will be prompted to change password on first login.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRIVILEGES
-- ============================================================================

INSERT INTO privileges (id, created_at, created_by, is_active, version, name, description, category, is_system_privilege)
VALUES
    -- System
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ADMIN',               'Full administrative access',                                'System',             true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'SYSTEM',              'System level access for lock/unlock',                       'System',             true),
    -- Workflow
    (gen_random_uuid(), NOW(), 'system', true, 0, 'WORKFLOW_BUILDER',    'Create and manage workflows',                               'Workflow',           true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'WORKFLOW_APPROVER',   'Approve workflow instances',                                 'Workflow',           true),
    -- Admin
    (gen_random_uuid(), NOW(), 'system', true, 0, 'USER_MANAGEMENT',     'Manage users',                                              'Admin',              true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_MANAGEMENT',     'Manage roles',                                              'Admin',              true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'SBU_MANAGEMENT',      'Manage SBUs',                                               'Admin',              true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'SETTINGS_MANAGEMENT', 'Manage system settings',                                    'Admin',              true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'AUDIT_VIEW',          'View audit logs',                                           'Admin',              true),
    -- Reporting
    (gen_random_uuid(), NOW(), 'system', true, 0, 'REPORT_VIEW',         'View reports',                                              'Reporting',          true),
    -- Data
    (gen_random_uuid(), NOW(), 'system', true, 0, 'IMPORT_EXPORT',       'Import and export data',                                    'Data',               true),
    -- Project Management
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_VIEW',        'View projects, tasks, milestones, risks, issues',            'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_CREATE',      'Create new projects and import project data',                'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_EDIT',        'Edit projects, manage tasks, milestones, team members',      'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_DELETE',      'Delete projects',                                           'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_APPROVE',     'Approve, reject, and manage project approval workflows',     'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_REPORT',      'Generate and view project reports',                          'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_SETTINGS',    'Manage project settings and configuration',                  'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_IMPORT',      'Import projects from external sources',                      'Project Management', true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'PROJECT_EXPORT',      'Export project data and documents',                          'Project Management', true)
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 2. ROLES
-- ============================================================================

INSERT INTO roles (id, created_at, created_by, is_active, version, name, description, is_system_role)
VALUES
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_ADMIN',             'Full administrative access',              true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_USER',              'Standard user role',                      true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_WORKFLOW_BUILDER',  'Can create and manage workflows',         true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_PROJECT_MANAGER',   'Full project management access',          true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_PROJECT_LEAD',      'Can create, edit, and report on projects',true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_PROJECT_MEMBER',    'Can view and edit assigned items',        true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_PROJECT_VIEWER',    'Read-only project access',                true),
    (gen_random_uuid(), NOW(), 'system', true, 0, 'ROLE_PROJECT_APPROVER',  'Can approve/reject project submissions',  true)
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 3. ROLE-PRIVILEGE ASSIGNMENTS
-- ============================================================================

-- ROLE_ADMIN -> ADMIN, SYSTEM
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_ADMIN'
  AND p.name IN ('ADMIN', 'SYSTEM')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_WORKFLOW_BUILDER -> WORKFLOW_BUILDER
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_WORKFLOW_BUILDER'
  AND p.name = 'WORKFLOW_BUILDER'
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_MANAGER -> all project privileges
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_PROJECT_MANAGER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_DELETE',
                  'PROJECT_APPROVE', 'PROJECT_REPORT', 'PROJECT_SETTINGS',
                  'PROJECT_IMPORT', 'PROJECT_EXPORT')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_LEAD -> view, create, edit, report, export
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_PROJECT_LEAD'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_REPORT', 'PROJECT_EXPORT')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_MEMBER -> view, edit, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_PROJECT_MEMBER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_EDIT', 'PROJECT_REPORT')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_VIEWER -> view, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_PROJECT_VIEWER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_REPORT')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_APPROVER -> view, approve, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN privileges p
WHERE r.name = 'ROLE_PROJECT_APPROVER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_APPROVE', 'PROJECT_REPORT')
  AND NOT EXISTS (
      SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );


-- ============================================================================
-- 4. DEFAULT USERS
-- ============================================================================
-- Passwords are BCrypt-encoded (strength 10, Spring Boot default).
--   admin : P@88345!
--   super : Crypt20@!

-- admin user
INSERT INTO users (
    id, created_at, created_by, is_active, version,
    username, password, email, first_name, last_name,
    user_type, is_locked, must_change_password, failed_login_attempts
)
VALUES (
    gen_random_uuid(), NOW(), 'system', true, 0,
    'admin',
    '$2b$10$qgHzvka2XYeGqiYFe4Q9GesAV0XRRem3oyP.GJfVA0m/I2StA5aOK',
    'admin@sonarworks.com',
    'System',
    'Administrator',
    'SYSTEM', false, true, 0
)
ON CONFLICT (username) DO NOTHING;

-- super user
INSERT INTO users (
    id, created_at, created_by, is_active, version,
    username, password, email, first_name, last_name,
    user_type, is_locked, must_change_password, failed_login_attempts
)
VALUES (
    gen_random_uuid(), NOW(), 'system', true, 0,
    'super',
    '$2b$10$zcJGMKuREC3OPY2SxowbguhvuuEuBBXFRJvrDN1ZMrQBoJAsFdfX6',
    'super@sonarworks.com',
    'Super',
    'User',
    'SYSTEM', false, true, 0
)
ON CONFLICT (username) DO NOTHING;


-- ============================================================================
-- 5. ASSIGN ROLE_ADMIN TO BOTH USERS
-- ============================================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'super' AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );


COMMIT;


-- ============================================================================
-- VERIFICATION (uncomment and run to confirm)
-- ============================================================================
-- SELECT u.username, u.email, u.user_type, u.is_active, u.must_change_password,
--        string_agg(r.name, ', ') AS roles
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- JOIN roles r ON ur.role_id = r.id
-- WHERE u.username IN ('admin', 'super')
-- GROUP BY u.username, u.email, u.user_type, u.is_active, u.must_change_password;
--
-- SELECT r.name AS role, string_agg(p.name, ', ' ORDER BY p.name) AS privileges
-- FROM roles r
-- JOIN role_privileges rp ON r.id = rp.role_id
-- JOIN privileges p ON rp.privilege_id = p.id
-- GROUP BY r.name
-- ORDER BY r.name;
