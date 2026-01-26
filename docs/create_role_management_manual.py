"""
Generate Role Management Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Role Management Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Understanding Roles and Privileges",
    "Accessing Role Management",
    "Viewing Roles",
    "Creating New Roles",
    "Editing Roles",
    "Privilege Reference",
    "System Roles",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Role Management module allows administrators to define and manage roles, which are collections of privileges (permissions) that control what users can do in the Sonarworks Workflow System. Effective role management is crucial for system security and proper access control.""")

add_paragraph(doc, "Key Functions:", bold=True)
add_bullet_list(doc, [
    "Create custom roles for different job functions",
    "Define privilege sets for each role",
    "Manage system and custom roles",
    "Control access to features and data"
])

add_note(doc, "Only administrators can access Role Management.", "NOTE")

add_image_placeholder(doc, "Role Management Overview")

# ============================================================================
# 2. UNDERSTANDING ROLES AND PRIVILEGES
# ============================================================================
add_section(doc, "2. Understanding Roles and Privileges")

add_section(doc, "2.1 What is a Role?", level=2)
add_paragraph(doc, """A Role is a named collection of privileges that can be assigned to users. Roles represent job functions or access levels within the organization.""")

add_example(doc, "Role Concept",
"""Role: "Finance Approver"
Description: Approves financial workflow requests

Contains Privileges:
  - View Workflows
  - View Approvals
  - Approve/Reject Workflows
  - View Reports (Financial)
""")

add_section(doc, "2.2 What is a Privilege?", level=2)
add_paragraph(doc, """A Privilege is a specific permission that allows a particular action in the system. Privileges are atomic units of access control.""")

add_table(doc,
    ["Privilege Category", "Example Privileges"],
    [
        ["Workflow", "Create Workflow, Edit Workflow, Delete Workflow, Publish Workflow"],
        ["Approval", "View Approvals, Approve, Reject, Escalate"],
        ["User Management", "Create User, Edit User, Delete User, Reset Password"],
        ["Administration", "Manage Settings, View Audit Log, Manage Roles"],
        ["Reports", "View Reports, Export Reports, Create Reports"]
    ],
    [2, 4.5]
)

add_section(doc, "2.3 How Roles Work", level=2)
add_numbered_list(doc, [
    "Administrator creates roles with specific privileges",
    "Roles are assigned to users",
    "Users inherit all privileges from their assigned roles",
    "Multiple roles can be assigned to one user",
    "Privileges are additive (combined) across all roles"
])

add_image_placeholder(doc, "Role and Privilege Relationship Diagram")

# ============================================================================
# 3. ACCESSING ROLE MANAGEMENT
# ============================================================================
add_section(doc, "3. Accessing Role Management")

add_step_by_step(doc, [
    "Log in with administrator credentials",
    "Click 'Administration' in the navigation sidebar",
    "Click 'Roles' from the sub-menu",
    "The Role List page displays all available roles"
])

add_image_placeholder(doc, "Navigation to Role Management")

# ============================================================================
# 4. VIEWING ROLES
# ============================================================================
add_section(doc, "4. Viewing Roles")

add_section(doc, "4.1 Role List", level=2)

add_table(doc,
    ["Column", "Description"],
    [
        ["Role Name", "Display name of the role"],
        ["Description", "Brief explanation of the role's purpose"],
        ["System Role", "Indicator if this is a built-in system role"],
        ["Users", "Count of users assigned to this role"],
        ["Privileges", "Number of privileges assigned"],
        ["Actions", "Edit, Delete (custom roles only)"]
    ],
    [2, 4.5]
)

add_section(doc, "4.2 Viewing Role Details", level=2)
add_step_by_step(doc, [
    "Click on a role name in the list",
    "Or click the 'View' action button",
    "The Role Detail panel shows all assigned privileges"
])

# ============================================================================
# 5. CREATING NEW ROLES
# ============================================================================
add_section(doc, "5. Creating New Roles")

add_section(doc, "5.1 When to Create a New Role", level=2)
add_bullet_list(doc, [
    "New job function needs specific access",
    "Existing roles are too broad or too restrictive",
    "Department-specific access is required",
    "Temporary project-based access is needed"
])

add_section(doc, "5.2 Creating a Role", level=2)
add_step_by_step(doc, [
    "Click the '+ New Role' button",
    "Enter a Role Name (unique, descriptive)",
    "Enter a Description explaining the role's purpose",
    "Select privileges from the available list",
    "Click 'Save' to create the role"
])

add_section(doc, "5.3 Role Form Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Role Name", "Yes", "Unique identifier (e.g., 'Finance Reviewer')"],
        ["Description", "No", "Explanation of role purpose and usage"],
        ["Privileges", "Yes", "List of permissions to include in this role"]
    ],
    [2, 1, 3.5]
)

add_image_placeholder(doc, "Create Role Form")

add_section(doc, "5.4 Selecting Privileges", level=2)
add_paragraph(doc, """In the privilege selection area:""")
add_bullet_list(doc, [
    "Privileges are organized by category/module",
    "Check individual privileges to include them",
    "Use 'Select All' within a category for quick selection",
    "Search for specific privileges by name"
])

add_example(doc, "Creating a Custom Role",
"""Role Name: "Department Head"
Description: "Review and approve department workflows"

Selected Privileges:
  [x] View Workflows
  [x] View Approvals
  [x] Approve Workflow
  [x] Reject Workflow
  [x] View Department Reports
  [ ] Create Workflow (not needed)
  [ ] Manage Users (not needed)
""")

# ============================================================================
# 6. EDITING ROLES
# ============================================================================
add_section(doc, "6. Editing Roles")

add_section(doc, "6.1 Editing Custom Roles", level=2)
add_step_by_step(doc, [
    "Locate the role in the Role List",
    "Click the 'Edit' action button (pencil icon)",
    "Modify the role name, description, or privileges",
    "Click 'Save' to apply changes"
])

add_section(doc, "6.2 Impact of Role Changes", level=2)
add_paragraph(doc, """When you modify a role:""")
add_bullet_list(doc, [
    "All users with that role are affected",
    "Changes take effect immediately",
    "Users may need to log out and back in",
    "Audit log records the change"
])

add_note(doc, "Be careful when removing privileges from widely-used roles. Consider the impact on all affected users.", "WARNING")

add_section(doc, "6.3 Deleting Roles", level=2)
add_step_by_step(doc, [
    "Locate the custom role in the list",
    "Click the 'Delete' action button (trash icon)",
    "Confirm the deletion"
])

add_note(doc, "You cannot delete a role that has users assigned. Remove users from the role first.", "NOTE")

add_note(doc, "System roles cannot be deleted.", "NOTE")

# ============================================================================
# 7. PRIVILEGE REFERENCE
# ============================================================================
add_section(doc, "7. Privilege Reference")

add_section(doc, "7.1 Workflow Privileges", level=2)

add_table(doc,
    ["Privilege", "Description"],
    [
        ["VIEW_WORKFLOWS", "View workflow list and details"],
        ["CREATE_WORKFLOW", "Create new workflow definitions"],
        ["EDIT_WORKFLOW", "Modify existing workflows"],
        ["DELETE_WORKFLOW", "Remove workflow definitions"],
        ["PUBLISH_WORKFLOW", "Publish/unpublish workflows"],
        ["SUBMIT_WORKFLOW", "Submit workflow instances"]
    ],
    [2.5, 4]
)

add_section(doc, "7.2 Approval Privileges", level=2)

add_table(doc,
    ["Privilege", "Description"],
    [
        ["VIEW_APPROVALS", "See pending approval queue"],
        ["APPROVE_WORKFLOW", "Approve workflow instances"],
        ["REJECT_WORKFLOW", "Reject workflow instances"],
        ["ESCALATE_WORKFLOW", "Escalate to higher authority"],
        ["REASSIGN_WORKFLOW", "Reassign to different approver"]
    ],
    [2.5, 4]
)

add_section(doc, "7.3 User Management Privileges", level=2)

add_table(doc,
    ["Privilege", "Description"],
    [
        ["VIEW_USERS", "View user list and details"],
        ["CREATE_USER", "Create new user accounts"],
        ["EDIT_USER", "Modify user information"],
        ["DELETE_USER", "Remove user accounts"],
        ["LOCK_USER", "Lock/unlock user accounts"],
        ["RESET_PASSWORD", "Reset user passwords"]
    ],
    [2.5, 4]
)

add_section(doc, "7.4 Administration Privileges", level=2)

add_table(doc,
    ["Privilege", "Description"],
    [
        ["MANAGE_ROLES", "Create and edit roles"],
        ["MANAGE_SETTINGS", "Modify system settings"],
        ["VIEW_AUDIT_LOG", "Access audit trail"],
        ["MANAGE_ORGANIZATION", "Manage corporates, SBUs, branches"]
    ],
    [2.5, 4]
)

add_section(doc, "7.5 Report Privileges", level=2)

add_table(doc,
    ["Privilege", "Description"],
    [
        ["VIEW_REPORTS", "Access reports module"],
        ["EXPORT_REPORTS", "Export report data"],
        ["CREATE_REPORTS", "Create custom reports"]
    ],
    [2.5, 4]
)

# ============================================================================
# 8. SYSTEM ROLES
# ============================================================================
add_section(doc, "8. System Roles")

add_paragraph(doc, """System roles are pre-defined roles that come with the system. They provide baseline access levels and cannot be deleted.""")

add_section(doc, "8.1 Default System Roles", level=2)

add_table(doc,
    ["Role", "Purpose", "Key Privileges"],
    [
        ["Super Administrator", "Full system access", "All privileges"],
        ["Administrator", "System administration", "User, role, settings management"],
        ["Workflow Administrator", "Manage workflows", "Create, edit, publish workflows"],
        ["Approver", "Process approvals", "View and process approvals"],
        ["Initiator", "Submit workflows", "Submit and track workflows"],
        ["Viewer", "Read-only access", "View workflows and reports"]
    ],
    [2, 2, 2.5]
)

add_section(doc, "8.2 Modifying System Roles", level=2)
add_paragraph(doc, """System roles may be:""")
add_bullet_list(doc, [
    "Viewed - See the privileges assigned",
    "Limited editing - Some systems allow adding privileges",
    "Cannot be deleted - They are protected"
])

add_note(doc, "It's recommended to create custom roles rather than modifying system roles for specific needs.", "TIP")

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Role Design Principles", level=2)
add_bullet_list(doc, [
    "Create roles based on job functions, not individuals",
    "Follow principle of least privilege",
    "Use descriptive names that indicate purpose",
    "Document each role's intended use",
    "Keep roles focused - avoid too many privileges in one role"
])

add_section(doc, "9.2 Role Naming Convention", level=2)
add_paragraph(doc, "Suggested naming patterns:", bold=True)

add_table(doc,
    ["Pattern", "Example", "Use For"],
    [
        ["[Department] [Function]", "Finance Approver", "Department-specific access"],
        ["[Level] [Area]", "Senior Workflow Manager", "Hierarchical access"],
        ["[Project] [Role]", "Project X Viewer", "Temporary project access"]
    ],
    [2.5, 2, 2]
)

add_section(doc, "9.3 Maintenance Recommendations", level=2)
add_numbered_list(doc, [
    "Review roles quarterly for relevance",
    "Audit role assignments when employees change positions",
    "Remove unused custom roles",
    "Document changes to role privileges",
    "Test role changes before wide deployment"
])

add_section(doc, "9.4 Common Mistakes to Avoid", level=2)
add_bullet_list(doc, [
    "Creating too many similar roles (consolidate instead)",
    "Assigning admin privileges unnecessarily",
    "Forgetting to remove privileges when scope changes",
    "Using roles for temporary access (use time-limited assignments)",
    "Not documenting custom role purposes"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/08_Role_Management_Manual.docx")
print("Role Management Manual created successfully!")
