"""
Generate User Management Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "User Management Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing User Management",
    "User List Overview",
    "Creating New Users",
    "Editing User Information",
    "User Roles and Permissions",
    "Organization Assignment",
    "Password Management",
    "Locking and Unlocking Users",
    "User Types",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The User Management module enables administrators to manage user accounts, assign roles and permissions, and control access to the Sonarworks Workflow System. Proper user management is essential for system security and effective workflow operations.""")

add_paragraph(doc, "Key Functions:", bold=True)
add_bullet_list(doc, [
    "Create and maintain user accounts",
    "Assign roles and privileges",
    "Map users to organizational units",
    "Manage passwords and security",
    "Lock/unlock user accounts",
    "Track user login activity"
])

add_note(doc, "User Management is only accessible to users with administrative privileges.", "NOTE")

add_image_placeholder(doc, "User Management Overview")

# ============================================================================
# 2. ACCESSING USER MANAGEMENT
# ============================================================================
add_section(doc, "2. Accessing User Management")

add_step_by_step(doc, [
    "Log in with administrator credentials",
    "Click 'Administration' in the navigation sidebar",
    "Click 'Users' from the sub-menu",
    "The User List page displays"
])

add_image_placeholder(doc, "Navigation to User Management")

# ============================================================================
# 3. USER LIST OVERVIEW
# ============================================================================
add_section(doc, "3. User List Overview")

add_section(doc, "3.1 List Columns", level=2)

add_table(doc,
    ["Column", "Description"],
    [
        ["Username", "Unique login identifier"],
        ["Full Name", "User's display name (first and last name)"],
        ["Email", "Email address for notifications"],
        ["User Type", "Category: SYSTEM, STAFF, MANAGER, EXTERNAL"],
        ["Roles", "Assigned roles (comma-separated)"],
        ["Status", "Active/Inactive/Locked indicator"],
        ["Last Login", "Date and time of last successful login"],
        ["Actions", "Edit, Lock/Unlock, Reset Password, Delete"]
    ],
    [1.8, 4.7]
)

add_image_placeholder(doc, "User List Table")

add_section(doc, "3.2 User Status Indicators", level=2)

add_table(doc,
    ["Status", "Indicator", "Meaning"],
    [
        ["Active", "Green badge", "User can log in normally"],
        ["Inactive", "Gray badge", "User account is disabled"],
        ["Locked", "Red badge", "User is locked out (failed logins or manual lock)"]
    ],
    [1.5, 1.5, 3.5]
)

add_section(doc, "3.3 Filtering Users", level=2)
add_paragraph(doc, "Use filters to find specific users:")

add_table(doc,
    ["Filter", "Options"],
    [
        ["Search", "Search by username, name, or email"],
        ["User Type", "SYSTEM, STAFF, MANAGER, EXTERNAL, All"],
        ["Status", "Active, Inactive, Locked, All"],
        ["Role", "Filter by specific role assignment"],
        ["Corporate/SBU", "Filter by organizational unit"]
    ],
    [2, 4.5]
)

# ============================================================================
# 4. CREATING NEW USERS
# ============================================================================
add_section(doc, "4. Creating New Users")

add_section(doc, "4.1 Starting User Creation", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Users",
    "Click the '+ New User' button",
    "The User Form opens in creation mode"
])

add_section(doc, "4.2 User Form Fields", level=2)

add_paragraph(doc, "Basic Information:", bold=True)
add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Username", "Yes", "Unique login ID (no spaces, alphanumeric)"],
        ["Email", "Yes", "Valid email address for notifications"],
        ["First Name", "Yes", "User's first name"],
        ["Last Name", "Yes", "User's last name"],
        ["Phone", "No", "Contact phone number"],
        ["Staff ID", "No", "Employee/staff identification number"],
        ["User Type", "Yes", "Category of user (STAFF, MANAGER, etc.)"],
        ["Password", "Yes (new)", "Initial password (or auto-generate)"],
        ["Must Change Password", "No", "Force password change on first login"]
    ],
    [2, 0.8, 3.7]
)

add_image_placeholder(doc, "User Creation Form - Basic Info")

add_section(doc, "4.3 Role Assignment", level=2)
add_paragraph(doc, """In the Roles section:""")
add_step_by_step(doc, [
    "View available roles in the list",
    "Check the checkbox for each role to assign",
    "Multiple roles can be assigned to one user",
    "Roles determine user permissions and access"
])

add_section(doc, "4.4 Organization Assignment", level=2)
add_paragraph(doc, """Assign user to organizational units:""")
add_bullet_list(doc, [
    "Corporates: Which corporate entities user belongs to",
    "SBUs: Strategic Business Units",
    "Branches: Physical branch locations",
    "Departments: Departmental assignment"
])

add_section(doc, "4.5 Saving the User", level=2)
add_step_by_step(doc, [
    "Fill in all required fields",
    "Assign appropriate roles",
    "Set organization mappings",
    "Click 'Save' button",
    "User is created and can now log in"
])

add_note(doc, "The initial password should be communicated securely to the user. Consider enabling 'Must Change Password' for security.", "TIP")

# ============================================================================
# 5. EDITING USER INFORMATION
# ============================================================================
add_section(doc, "5. Editing User Information")

add_section(doc, "5.1 Opening User for Edit", level=2)
add_step_by_step(doc, [
    "Locate the user in the User List",
    "Click the 'Edit' button (pencil icon)",
    "The User Form opens with existing data"
])

add_section(doc, "5.2 Editable Fields", level=2)
add_paragraph(doc, """Most fields can be edited:""")
add_bullet_list(doc, [
    "Basic information (name, email, phone)",
    "User type",
    "Role assignments",
    "Organization mappings",
    "Active status"
])

add_note(doc, "Username typically cannot be changed after creation. Contact system support if username change is needed.", "NOTE")

add_section(doc, "5.3 Saving Changes", level=2)
add_step_by_step(doc, [
    "Make necessary modifications",
    "Click 'Save' to update the user",
    "Changes take effect immediately",
    "User may need to log out and back in for role changes to apply"
])

# ============================================================================
# 6. USER ROLES AND PERMISSIONS
# ============================================================================
add_section(doc, "6. User Roles and Permissions")

add_section(doc, "6.1 Understanding Roles", level=2)
add_paragraph(doc, """Roles are collections of permissions that define what a user can do in the system. Each role has specific privileges that grant access to features and functions.""")

add_section(doc, "6.2 Common System Roles", level=2)

add_table(doc,
    ["Role", "Description", "Typical Permissions"],
    [
        ["Administrator", "Full system access", "All features, user management, settings"],
        ["Workflow Manager", "Manage workflows", "Create/edit workflows, view all instances"],
        ["Approver", "Process approvals", "View/approve assigned workflows"],
        ["Initiator", "Submit workflows", "Submit workflows, view own submissions"],
        ["Viewer", "Read-only access", "View workflows and reports only"],
        ["Report User", "Access reports", "View and export reports"]
    ],
    [1.8, 2, 2.7]
)

add_section(doc, "6.3 Assigning Multiple Roles", level=2)
add_paragraph(doc, """Users can have multiple roles. Permissions are additive:""")
add_example(doc, "Multiple Role Assignment",
"""User: John Smith
Assigned Roles:
  - Initiator (can submit workflows)
  - Approver (can approve workflows)

Result: John can both submit and approve workflows
(Note: Users typically cannot approve their own submissions)
""")

add_section(doc, "6.4 Role Best Practices", level=2)
add_bullet_list(doc, [
    "Assign minimum necessary roles (principle of least privilege)",
    "Review role assignments periodically",
    "Use role-based rather than individual permissions",
    "Document role purposes and permissions",
    "Create custom roles for specific job functions"
])

# ============================================================================
# 7. ORGANIZATION ASSIGNMENT
# ============================================================================
add_section(doc, "7. Organization Assignment")

add_paragraph(doc, """Organization assignment controls which workflows and data a user can access based on their organizational unit membership.""")

add_section(doc, "7.1 Organization Hierarchy", level=2)

add_table(doc,
    ["Level", "Description", "Example"],
    [
        ["Corporate", "Top-level organization", "Holding Company, Subsidiary A"],
        ["SBU", "Strategic Business Unit", "Finance, Operations, HR"],
        ["Branch", "Physical location", "Head Office, Regional Office"],
        ["Department", "Functional department", "IT, Accounting, Legal"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "7.2 Assigning Organizations", level=2)
add_step_by_step(doc, [
    "In the User Form, locate the Organization section",
    "Select appropriate Corporates from the multi-select",
    "Select applicable SBUs",
    "Select Branches if applicable",
    "Select Departments if applicable"
])

add_section(doc, "7.3 Organization Impact", level=2)
add_paragraph(doc, """Organization assignment affects:""")
add_bullet_list(doc, [
    "Which workflows the user can see and submit",
    "Which approval requests are routed to the user",
    "What data appears in reports",
    "Access to SBU-specific features"
])

add_image_placeholder(doc, "Organization Assignment Section")

# ============================================================================
# 8. PASSWORD MANAGEMENT
# ============================================================================
add_section(doc, "8. Password Management")

add_section(doc, "8.1 Setting Initial Password", level=2)
add_paragraph(doc, """When creating a user, you can:""")
add_bullet_list(doc, [
    "Enter a specific password manually",
    "Generate a random password (if feature available)",
    "Enable 'Must Change Password' to force reset on first login"
])

add_section(doc, "8.2 Admin Password Reset", level=2)
add_step_by_step(doc, [
    "Locate the user in the User List",
    "Click 'Reset Password' action button",
    "Enter a new temporary password",
    "Check 'Must Change Password' (recommended)",
    "Click 'Reset' to confirm",
    "Communicate new password to user securely"
])

add_section(doc, "8.3 Password Security Guidelines", level=2)
add_bullet_list(doc, [
    "Never share passwords via email or chat",
    "Use secure channels to communicate initial passwords",
    "Enforce password complexity requirements",
    "Set password expiry policies",
    "Enable multi-factor authentication if available"
])

add_note(doc, "Users should change their password immediately after receiving it from an administrator.", "WARNING")

# ============================================================================
# 9. LOCKING AND UNLOCKING USERS
# ============================================================================
add_section(doc, "9. Locking and Unlocking Users")

add_section(doc, "9.1 Why Lock a User?", level=2)
add_bullet_list(doc, [
    "Security concern or suspicious activity",
    "Employee termination or leave",
    "Temporary access restriction",
    "Policy violation",
    "Automatic lock after failed login attempts"
])

add_section(doc, "9.2 Manually Locking a User", level=2)
add_step_by_step(doc, [
    "Locate the user in the User List",
    "Click the 'Lock' action button (padlock icon)",
    "Enter a lock reason (required for audit)",
    "Click 'Confirm' to lock the account",
    "User immediately loses access"
])

add_section(doc, "9.3 Unlocking a User", level=2)
add_step_by_step(doc, [
    "Find the locked user (red badge indicator)",
    "Click the 'Unlock' action button",
    "Confirm the unlock action",
    "User can now log in again",
    "Consider resetting password if lock was security-related"
])

add_section(doc, "9.4 Automatic vs Manual Lock", level=2)

add_table(doc,
    ["Lock Type", "Cause", "Resolution"],
    [
        ["Automatic", "Too many failed login attempts", "Wait for timeout or admin unlock"],
        ["Manual", "Administrator action", "Admin must unlock"]
    ],
    [1.5, 2.5, 2.5]
)

# ============================================================================
# 10. USER TYPES
# ============================================================================
add_section(doc, "10. User Types")

add_paragraph(doc, """User Types categorize users by their relationship to the organization and typical access patterns.""")

add_section(doc, "10.1 User Type Definitions", level=2)

add_table(doc,
    ["User Type", "Description", "Typical Use"],
    [
        ["SYSTEM", "System/service accounts", "Automated processes, integrations"],
        ["STAFF", "Regular employees", "Day-to-day workflow users"],
        ["MANAGER", "Management personnel", "Approvers, team leads, supervisors"],
        ["EXTERNAL", "External parties", "Vendors, contractors, partners"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "10.2 Selecting User Type", level=2)
add_paragraph(doc, """Choose the user type based on:""")
add_bullet_list(doc, [
    "User's relationship to the organization",
    "Level of access and trust",
    "Workflow participation role",
    "Reporting and audit requirements"
])

# ============================================================================
# 11. BEST PRACTICES
# ============================================================================
add_section(doc, "11. Best Practices")

add_section(doc, "11.1 User Creation Guidelines", level=2)
add_bullet_list(doc, [
    "Use consistent username format (e.g., firstname.lastname)",
    "Verify email addresses for notification delivery",
    "Assign roles based on job function, not individual",
    "Document the purpose for external user accounts",
    "Enable 'Must Change Password' for new users"
])

add_section(doc, "11.2 Access Control", level=2)
add_bullet_list(doc, [
    "Follow principle of least privilege",
    "Review user access periodically (quarterly recommended)",
    "Remove access promptly when users leave",
    "Audit privileged account usage",
    "Maintain documentation of role assignments"
])

add_section(doc, "11.3 Security Practices", level=2)
add_bullet_list(doc, [
    "Lock accounts immediately upon termination",
    "Review failed login attempts regularly",
    "Investigate locked accounts for security issues",
    "Use strong password policies",
    "Keep user contact information current"
])

add_section(doc, "11.4 Troubleshooting", level=2)

add_table(doc,
    ["Issue", "Cause", "Solution"],
    [
        ["User can't log in", "Wrong password, locked, inactive", "Reset password, unlock, activate"],
        ["User can't see workflow", "Missing role or org assignment", "Assign approriate role/organization"],
        ["User can't approve", "Not assigned as approver", "Assign approver role, configure workflow"],
        ["Duplicate user error", "Username already exists", "Use different username"],
        ["Email not received", "Invalid email or spam filter", "Verify email, check spam folder"]
    ],
    [2, 2, 2.5]
)

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/07_User_Management_Manual.docx")
print("User Management Manual created successfully!")
