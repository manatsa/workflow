"""
Generate Audit Log Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Audit Log Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Audit Logs",
    "Understanding Audit Entries",
    "Searching and Filtering",
    "Audit Actions Reference",
    "Viewing Audit Details",
    "Exporting Audit Data",
    "Compliance and Retention",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Audit Log module provides a comprehensive record of all significant actions performed in the Sonar Workflow System. It serves as an essential tool for security monitoring, compliance, troubleshooting, and accountability.""")

add_paragraph(doc, "What is Audited:", bold=True)
add_bullet_list(doc, [
    "User authentication events (login, logout, failed attempts)",
    "Data changes (create, update, delete operations)",
    "Workflow actions (submissions, approvals, rejections)",
    "Administrative actions (user management, settings changes)",
    "Security events (password changes, account locks)",
    "System operations (imports, exports, backups)"
])

add_note(doc, "Audit logs are read-only and cannot be modified or deleted by users.", "NOTE")

add_image_placeholder(doc, "Audit Log Overview")

# ============================================================================
# 2. ACCESSING AUDIT LOGS
# ============================================================================
add_section(doc, "2. Accessing Audit Logs")

add_step_by_step(doc, [
    "Log in with administrator credentials",
    "Click 'Administration' in the navigation sidebar",
    "Click 'Audit Log' from the sub-menu",
    "The Audit Log list page displays"
])

add_note(doc, "Only users with VIEW_AUDIT_LOG privilege can access audit logs.", "NOTE")

add_image_placeholder(doc, "Navigation to Audit Log")

# ============================================================================
# 3. UNDERSTANDING AUDIT ENTRIES
# ============================================================================
add_section(doc, "3. Understanding Audit Entries")

add_section(doc, "3.1 Audit Entry Components", level=2)

add_table(doc,
    ["Field", "Description", "Example"],
    [
        ["Timestamp", "Date and time of action", "2024-01-15 14:30:25"],
        ["User", "Person who performed action", "john.doe"],
        ["Action", "Type of action performed", "UPDATE, LOGIN, APPROVE"],
        ["Entity Type", "Type of object affected", "User, Workflow, WorkflowInstance"],
        ["Entity ID", "Identifier of affected object", "uuid-123-456"],
        ["Module", "System module involved", "USER_MANAGEMENT, WORKFLOW"],
        ["Summary", "Brief description", "Updated user profile"],
        ["IP Address", "Client IP address", "192.168.1.100"],
        ["User Agent", "Browser/client information", "Chrome 120, Windows"]
    ],
    [1.5, 2.5, 2.5]
)

add_image_placeholder(doc, "Audit Log Entry Example")

add_section(doc, "3.2 Entity Types", level=2)

add_table(doc,
    ["Entity Type", "Description"],
    [
        ["User", "User account operations"],
        ["Role", "Role and privilege changes"],
        ["Workflow", "Workflow template changes"],
        ["WorkflowInstance", "Workflow submission operations"],
        ["Corporate", "Corporate entity changes"],
        ["SBU", "SBU changes"],
        ["Branch", "Branch changes"],
        ["Department", "Department changes"],
        ["Setting", "System setting modifications"],
        ["System", "System-level operations"]
    ],
    [2, 4.5]
)

add_section(doc, "3.3 Change Tracking", level=2)
add_paragraph(doc, """For update actions, the audit log tracks both old and new values:""")

add_example(doc, "Change Tracking Example",
"""Action: UPDATE
Entity: User (john.doe)
Changes:
  - email: old="john@old.com" -> new="john@new.com"
  - phone: old="555-0100" -> new="555-0200"
""")

# ============================================================================
# 4. SEARCHING AND FILTERING
# ============================================================================
add_section(doc, "4. Searching and Filtering")

add_section(doc, "4.1 Available Filters", level=2)

add_table(doc,
    ["Filter", "Type", "Description"],
    [
        ["Date Range", "Date Picker", "Start and end date for entries"],
        ["User", "Text/Select", "Filter by specific user"],
        ["Action", "Multi-Select", "Filter by action types"],
        ["Entity Type", "Multi-Select", "Filter by entity types"],
        ["Module", "Multi-Select", "Filter by system module"],
        ["IP Address", "Text", "Filter by client IP"],
        ["Search", "Text", "Full-text search in summary"]
    ],
    [1.8, 1.5, 3.2]
)

add_section(doc, "4.2 Using Filters", level=2)
add_step_by_step(doc, [
    "Click 'Filters' button to open filter panel",
    "Set your filter criteria",
    "Click 'Apply' to filter results",
    "Results update to show matching entries",
    "Click 'Clear' to reset all filters"
])

add_image_placeholder(doc, "Audit Log Filter Panel")

add_section(doc, "4.3 Quick Filter Examples", level=2)

add_table(doc,
    ["Goal", "Filter Settings"],
    [
        ["All logins today", "Date: Today, Action: LOGIN"],
        ["Failed login attempts", "Action: LOGIN_FAILED"],
        ["User changes by admin", "Entity: User, User: admin"],
        ["Workflow approvals this week", "Date: This Week, Action: APPROVE"],
        ["Activity from specific IP", "IP Address: 192.168.1.100"]
    ],
    [2.5, 4]
)

add_section(doc, "4.4 Sorting", level=2)
add_paragraph(doc, "Click column headers to sort:")
add_bullet_list(doc, [
    "Default sort: Newest first (by timestamp)",
    "Click column header to change sort",
    "Click again to reverse order"
])

# ============================================================================
# 5. AUDIT ACTIONS REFERENCE
# ============================================================================
add_section(doc, "5. Audit Actions Reference")

add_section(doc, "5.1 Authentication Actions", level=2)

add_table(doc,
    ["Action", "Description"],
    [
        ["LOGIN", "Successful user login"],
        ["LOGIN_FAILED", "Failed login attempt"],
        ["LOGOUT", "User logged out"],
        ["PASSWORD_CHANGE", "User changed their password"],
        ["PASSWORD_RESET", "Password reset via admin or email"]
    ],
    [2.5, 4]
)

add_section(doc, "5.2 Data Actions", level=2)

add_table(doc,
    ["Action", "Description"],
    [
        ["CREATE", "New entity created"],
        ["READ", "Entity was viewed (if configured)"],
        ["UPDATE", "Entity was modified"],
        ["DELETE", "Entity was deleted"]
    ],
    [2.5, 4]
)

add_section(doc, "5.3 Workflow Actions", level=2)

add_table(doc,
    ["Action", "Description"],
    [
        ["SUBMIT", "Workflow submitted for approval"],
        ["APPROVE", "Workflow approved"],
        ["REJECT", "Workflow rejected"],
        ["ESCALATE", "Workflow escalated"],
        ["RECALL", "Workflow recalled by initiator"],
        ["CANCEL", "Workflow cancelled"]
    ],
    [2.5, 4]
)

add_section(doc, "5.4 Administrative Actions", level=2)

add_table(doc,
    ["Action", "Description"],
    [
        ["LOCK", "User account locked"],
        ["UNLOCK", "User account unlocked"],
        ["IMPORT", "Data import operation"],
        ["EXPORT", "Data export operation"],
        ["BACKUP", "System backup created"],
        ["RESTORE", "System restore performed"],
        ["SYSTEM_LOCK", "System-wide lock activated"],
        ["SYSTEM_UNLOCK", "System-wide lock deactivated"]
    ],
    [2.5, 4]
)

# ============================================================================
# 6. VIEWING AUDIT DETAILS
# ============================================================================
add_section(doc, "6. Viewing Audit Details")

add_section(doc, "6.1 Opening Entry Details", level=2)
add_step_by_step(doc, [
    "Locate the entry in the audit log list",
    "Click on the row or the 'View' button",
    "The Audit Detail dialog/page opens"
])

add_section(doc, "6.2 Detail View Contents", level=2)

add_table(doc,
    ["Section", "Information"],
    [
        ["Header", "Action type, timestamp, result (success/failure)"],
        ["Actor", "User who performed the action, their roles"],
        ["Target", "Entity type, ID, and name of affected object"],
        ["Changes", "Old vs New values for update actions"],
        ["Context", "IP address, user agent, session ID"],
        ["Related", "Links to related entities if applicable"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Audit Detail View")

add_section(doc, "6.3 Navigating to Related Entities", level=2)
add_paragraph(doc, """From the audit detail view, you can often navigate to:""")
add_bullet_list(doc, [
    "The user who performed the action",
    "The affected entity (if it still exists)",
    "Related workflow instance (for approval actions)"
])

# ============================================================================
# 7. EXPORTING AUDIT DATA
# ============================================================================
add_section(doc, "7. Exporting Audit Data")

add_section(doc, "7.1 Export Options", level=2)

add_table(doc,
    ["Format", "Description", "Best For"],
    [
        ["CSV", "Comma-separated values", "Spreadsheet analysis, data processing"],
        ["Excel", "Microsoft Excel format", "Reporting, sharing with stakeholders"],
        ["PDF", "Portable Document Format", "Formal reports, archival"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "7.2 Exporting Data", level=2)
add_step_by_step(doc, [
    "Apply filters to select the data range",
    "Click the 'Export' button",
    "Select the export format",
    "Choose columns to include (optional)",
    "Click 'Download'",
    "File is downloaded to your computer"
])

add_section(doc, "7.3 Export Best Practices", level=2)
add_bullet_list(doc, [
    "Filter data before export to reduce file size",
    "Include date range in export filename",
    "Secure exported files (they contain sensitive data)",
    "Delete exports after use if not needed for retention"
])

add_note(doc, "Exported audit data should be handled according to your organization's data security policies.", "WARNING")

# ============================================================================
# 8. COMPLIANCE AND RETENTION
# ============================================================================
add_section(doc, "8. Compliance and Retention")

add_section(doc, "8.1 Audit Log Retention", level=2)
add_paragraph(doc, """Audit logs are retained according to system configuration:""")

add_table(doc,
    ["Setting", "Typical Value", "Description"],
    [
        ["Retention Period", "7 years", "How long logs are kept"],
        ["Archive Policy", "After 1 year", "When logs move to archive"],
        ["Deletion Policy", "Never (manual)", "When logs are purged"]
    ],
    [2, 1.5, 3]
)

add_section(doc, "8.2 Compliance Considerations", level=2)
add_paragraph(doc, """The audit log supports compliance with:""")
add_bullet_list(doc, [
    "SOX (Sarbanes-Oxley) - Financial controls",
    "GDPR - Data access tracking",
    "HIPAA - Healthcare data access",
    "ISO 27001 - Information security",
    "Internal audit requirements"
])

add_section(doc, "8.3 Audit Log Integrity", level=2)
add_paragraph(doc, """To ensure integrity:""")
add_bullet_list(doc, [
    "Logs cannot be modified after creation",
    "Logs cannot be deleted by regular users",
    "All log entries have unique identifiers",
    "Timestamps are system-generated and tamper-proof"
])

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Regular Review", level=2)
add_bullet_list(doc, [
    "Review audit logs weekly for unusual activity",
    "Check failed logins for potential attacks",
    "Monitor administrative actions",
    "Investigate unexpected data changes"
])

add_section(doc, "9.2 Security Monitoring", level=2)
add_paragraph(doc, "Key patterns to watch for:", bold=True)

add_table(doc,
    ["Pattern", "Concern", "Action"],
    [
        ["Multiple failed logins", "Brute force attack", "Verify account, check IP"],
        ["Unusual login times", "Compromised account", "Verify with user"],
        ["Mass data export", "Data theft attempt", "Review and verify"],
        ["Admin actions by non-admin", "Privilege escalation", "Investigate immediately"],
        ["Actions from unusual IP", "Account compromise", "Verify, consider lock"]
    ],
    [2, 2, 2.5]
)

add_section(doc, "9.3 Investigation Process", level=2)
add_numbered_list(doc, [
    "Identify the suspicious activity in audit log",
    "Note the timestamp, user, and action",
    "Filter for all related actions by that user/IP",
    "Determine if activity is legitimate",
    "Take appropriate action (lock account, alert security)",
    "Document your investigation"
])

add_section(doc, "9.4 Reporting", level=2)
add_bullet_list(doc, [
    "Create regular audit summary reports",
    "Report security incidents promptly",
    "Archive reports for compliance",
    "Include audit review in security procedures"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/11_Audit_Log_Manual.docx")
print("Audit Log Manual created successfully!")
