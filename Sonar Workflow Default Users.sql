-- ============================================================================
-- Sonar Workflow - Default Users, Roles & Privileges Setup Script
-- ============================================================================
-- Database: PostgreSQL (workflow database, user: sonar)
-- Run this script against a fresh or existing Sonar Workflow database to
-- create the default privileges, roles, and system users (admin & super).
--
-- Passwords:
--   admin : P@88345!
--   super : Th3H3ar20fC0d3!
--
-- NOTE: BCrypt hashes below were generated with strength 10 (Spring default).
--       If you change passwords, regenerate the BCrypt hash accordingly.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PRIVILEGES
-- ============================================================================

INSERT INTO privileges (id, name, description, category, is_system_privilege, is_active, created_at, version)
VALUES
    -- System privileges
    (gen_random_uuid(), 'ADMIN',              'Full administrative access',                              'System',             true, true, NOW(), 0),
    (gen_random_uuid(), 'SYSTEM',             'System level access for lock/unlock',                     'System',             true, true, NOW(), 0),

    -- Workflow privileges
    (gen_random_uuid(), 'WORKFLOW_BUILDER',   'Create and manage workflows',                             'Workflow',           true, true, NOW(), 0),
    (gen_random_uuid(), 'WORKFLOW_APPROVER',  'Approve workflow instances',                              'Workflow',           true, true, NOW(), 0),

    -- Admin privileges
    (gen_random_uuid(), 'USER_MANAGEMENT',    'Manage users',                                            'Admin',              true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_MANAGEMENT',    'Manage roles',                                            'Admin',              true, true, NOW(), 0),
    (gen_random_uuid(), 'SBU_MANAGEMENT',     'Manage SBUs',                                             'Admin',              true, true, NOW(), 0),
    (gen_random_uuid(), 'SETTINGS_MANAGEMENT','Manage system settings',                                  'Admin',              true, true, NOW(), 0),
    (gen_random_uuid(), 'AUDIT_VIEW',         'View audit logs',                                         'Admin',              true, true, NOW(), 0),

    -- Reporting privileges
    (gen_random_uuid(), 'REPORT_VIEW',        'View reports',                                            'Reporting',          true, true, NOW(), 0),

    -- Data privileges
    (gen_random_uuid(), 'IMPORT_EXPORT',      'Import and export data',                                  'Data',               true, true, NOW(), 0),

    -- Project Management privileges
    (gen_random_uuid(), 'PROJECT_VIEW',       'View projects, tasks, milestones, risks, issues',         'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_CREATE',     'Create new projects and import project data',             'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_EDIT',       'Edit projects, manage tasks, milestones, team members',   'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_DELETE',     'Delete projects',                                         'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_APPROVE',    'Approve, reject, and manage project approval workflows',  'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_REPORT',     'Generate and view project reports',                       'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_SETTINGS',   'Manage project settings and configuration',               'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_IMPORT',     'Import projects from external sources',                   'Project Management', true, true, NOW(), 0),
    (gen_random_uuid(), 'PROJECT_EXPORT',     'Export project data and documents',                       'Project Management', true, true, NOW(), 0)
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 2. ROLES
-- ============================================================================

INSERT INTO roles (id, name, description, is_system_role, is_active, created_at, version)
VALUES
    (gen_random_uuid(), 'ROLE_ADMIN',             'Full administrative access',       true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_USER',              'Standard user role',               true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_WORKFLOW_BUILDER',  'Can create and manage workflows',  true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_PROJECT_MANAGER',   'Full project management access',   true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_PROJECT_LEAD',      'Can create, edit, and report',     true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_PROJECT_MEMBER',    'Can view and edit assigned items',  true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_PROJECT_VIEWER',    'Read-only project access',         true, true, NOW(), 0),
    (gen_random_uuid(), 'ROLE_PROJECT_APPROVER',  'Can approve/reject submissions',   true, true, NOW(), 0)
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 3. ROLE-PRIVILEGE ASSIGNMENTS
-- ============================================================================

-- ROLE_ADMIN -> ADMIN, SYSTEM
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
WHERE r.name = 'ROLE_ADMIN' AND p.name IN ('ADMIN', 'SYSTEM')
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_WORKFLOW_BUILDER -> WORKFLOW_BUILDER
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
WHERE r.name = 'ROLE_WORKFLOW_BUILDER' AND p.name = 'WORKFLOW_BUILDER'
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_MANAGER -> all project privileges
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
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
FROM roles r, privileges p
WHERE r.name = 'ROLE_PROJECT_LEAD'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_CREATE', 'PROJECT_EDIT', 'PROJECT_REPORT', 'PROJECT_EXPORT')
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_MEMBER -> view, edit, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
WHERE r.name = 'ROLE_PROJECT_MEMBER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_EDIT', 'PROJECT_REPORT')
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_VIEWER -> view, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
WHERE r.name = 'ROLE_PROJECT_VIEWER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_REPORT')
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );

-- ROLE_PROJECT_APPROVER -> view, approve, report
INSERT INTO role_privileges (role_id, privilege_id)
SELECT r.id, p.id
FROM roles r, privileges p
WHERE r.name = 'ROLE_PROJECT_APPROVER'
  AND p.name IN ('PROJECT_VIEW', 'PROJECT_APPROVE', 'PROJECT_REPORT')
  AND NOT EXISTS (
    SELECT 1 FROM role_privileges rp WHERE rp.role_id = r.id AND rp.privilege_id = p.id
  );


-- ============================================================================
-- 4. DEFAULT USERS (admin & super)
-- ============================================================================
-- Passwords are BCrypt-encoded (strength 10, Spring Boot default).
--   admin password: P@88345!
--   super password: Th3H3ar20fC0d3!

-- Create admin user
INSERT INTO users (
    id, username, password, email, first_name, last_name,
    user_type, is_active, is_locked, must_change_password,
    failed_login_attempts, created_at, version
)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin@sonarworks.com',
    'System',
    'Administrator',
    'SYSTEM',
    true,
    false,
    true,
    0,
    NOW(),
    0
)
ON CONFLICT (username) DO NOTHING;

-- Create super user
INSERT INTO users (
    id, username, password, email, first_name, last_name,
    user_type, is_active, is_locked, must_change_password,
    failed_login_attempts, created_at, version
)
VALUES (
    gen_random_uuid(),
    'super',
    '$2a$10$HfzIhGCCaxqducKhbrI7UehYzLhLRags0OKDiGeqtw1qE5a.JlGwK',
    'super@sonarworks.com',
    'Super',
    'User',
    'SYSTEM',
    true,
    false,
    true,
    0,
    NOW(),
    0
)
ON CONFLICT (username) DO NOTHING;


-- ============================================================================
-- 5. ASSIGN ROLE_ADMIN TO BOTH USERS
-- ============================================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'super' AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );


COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (optional - run to confirm setup)
-- ============================================================================
-- SELECT u.username, u.email, u.user_type, r.name AS role
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- JOIN roles r ON ur.role_id = r.id
-- WHERE u.username IN ('admin', 'super');
--
-- SELECT r.name AS role, p.name AS privilege, p.category
-- FROM roles r
-- JOIN role_privileges rp ON r.id = rp.role_id
-- JOIN privileges p ON rp.privilege_id = p.id
-- ORDER BY r.name, p.category, p.name;
