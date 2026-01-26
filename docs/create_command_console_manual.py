"""
Generate Command Console Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Command Console Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Command Console",
    "Command Console Interface",
    "Available Commands",
    "Command Syntax",
    "System Commands",
    "Data Commands",
    "Utility Commands",
    "Best Practices",
    "Security Considerations"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Command Console is an advanced administrative tool that provides direct command-line access to system functions. It allows super administrators to execute system commands, perform maintenance tasks, and troubleshoot issues efficiently.""")

add_paragraph(doc, "Key Capabilities:", bold=True)
add_bullet_list(doc, [
    "Execute system maintenance commands",
    "Query system data directly",
    "Perform bulk operations",
    "Clear caches and reset states",
    "Debug and troubleshoot issues"
])

add_note(doc, "The Command Console is a powerful tool intended for super administrators only. Improper use can affect system stability.", "WARNING")

add_image_placeholder(doc, "Command Console Interface")

# ============================================================================
# 2. ACCESSING COMMAND CONSOLE
# ============================================================================
add_section(doc, "2. Accessing Command Console")

add_section(doc, "2.1 Prerequisites", level=2)
add_bullet_list(doc, [
    "Super Administrator role assignment",
    "Command Console privilege enabled",
    "Valid session with elevated permissions"
])

add_section(doc, "2.2 Opening the Console", level=2)
add_step_by_step(doc, [
    "Log in as Super Administrator",
    "Click your profile icon in the top-right",
    "Select 'Command Console' from dropdown",
    "Or use keyboard shortcut: Ctrl + Shift + C",
    "The Command Console opens as a dialog/panel"
])

add_note(doc, "The Command Console option only appears for users with super administrator privileges.", "NOTE")

add_image_placeholder(doc, "Accessing Command Console")

# ============================================================================
# 3. COMMAND CONSOLE INTERFACE
# ============================================================================
add_section(doc, "3. Command Console Interface")

add_section(doc, "3.1 Interface Components", level=2)

add_table(doc,
    ["Component", "Description"],
    [
        ["Command Input", "Text field where you type commands"],
        ["Output Panel", "Display area showing command results"],
        ["History", "List of previously executed commands"],
        ["Status Bar", "Shows execution status and time"],
        ["Clear Button", "Clears the output panel"],
        ["Close Button", "Closes the console"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Command Console Components")

add_section(doc, "3.2 Entering Commands", level=2)
add_step_by_step(doc, [
    "Click in the command input field",
    "Type your command",
    "Press Enter to execute",
    "Results appear in the output panel"
])

add_section(doc, "3.3 Command History", level=2)
add_bullet_list(doc, [
    "Press Up Arrow to recall previous command",
    "Press Down Arrow to move forward in history",
    "Click on a command in history panel to reuse",
    "History is cleared when console closes"
])

# ============================================================================
# 4. AVAILABLE COMMANDS
# ============================================================================
add_section(doc, "4. Available Commands")

add_section(doc, "4.1 Command Categories", level=2)

add_table(doc,
    ["Category", "Description", "Examples"],
    [
        ["System", "System-level operations", "status, cache, health"],
        ["Data", "Data queries and operations", "count, find, update"],
        ["User", "User management commands", "lock, unlock, reset"],
        ["Workflow", "Workflow operations", "reprocess, cancel"],
        ["Utility", "Helper commands", "help, clear, echo"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "4.2 Getting Help", level=2)
add_paragraph(doc, "Use the help command to see available commands:")

add_code_block(doc, """help                    # List all commands
help <command>          # Get help for specific command
help system             # List commands in category""", "Console")

# ============================================================================
# 5. COMMAND SYNTAX
# ============================================================================
add_section(doc, "5. Command Syntax")

add_section(doc, "5.1 Basic Syntax", level=2)

add_code_block(doc, """command [subcommand] [--option value] [arguments]

Examples:
  status                          # Simple command
  cache clear                     # Command with subcommand
  user lock john.doe              # Command with argument
  count workflows --status PENDING  # Command with option""", "Syntax")

add_section(doc, "5.2 Options and Arguments", level=2)

add_table(doc,
    ["Element", "Format", "Example"],
    [
        ["Command", "lowercase word", "status"],
        ["Subcommand", "follows command", "cache clear"],
        ["Argument", "value after command", "user lock john.doe"],
        ["Option", "--name value", "--status PENDING"],
        ["Flag", "--flag (no value)", "--force"]
    ],
    [1.5, 2, 3]
)

add_section(doc, "5.3 String Values", level=2)
add_paragraph(doc, "Use quotes for values with spaces:")

add_code_block(doc, """update user john.doe --name "John Doe"
find workflows --description "Purchase Request"
""", "Console")

# ============================================================================
# 6. SYSTEM COMMANDS
# ============================================================================
add_section(doc, "6. System Commands")

add_section(doc, "6.1 Status Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["status", "Show overall system status"],
        ["status db", "Show database connection status"],
        ["status email", "Show email service status"],
        ["status cache", "Show cache statistics"],
        ["health", "Run system health check"]
    ],
    [2.5, 4]
)

add_example(doc, "Status Command Output",
""">> status
System Status: HEALTHY
Uptime: 5 days, 3 hours
Database: Connected
Email: Configured
Cache: Active (1,245 entries)
Active Sessions: 23
""")

add_section(doc, "6.2 Cache Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["cache status", "Show cache statistics"],
        ["cache clear", "Clear all cache entries"],
        ["cache clear users", "Clear user-related cache"],
        ["cache clear workflows", "Clear workflow-related cache"]
    ],
    [2.5, 4]
)

add_note(doc, "Clearing cache may temporarily impact performance as cache rebuilds.", "NOTE")

add_section(doc, "6.3 Maintenance Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["maintenance on", "Enable maintenance mode"],
        ["maintenance off", "Disable maintenance mode"],
        ["cleanup logs", "Archive old log entries"],
        ["cleanup sessions", "Clear expired sessions"]
    ],
    [2.5, 4]
)

# ============================================================================
# 7. DATA COMMANDS
# ============================================================================
add_section(doc, "7. Data Commands")

add_section(doc, "7.1 Query Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["count users", "Count total users"],
        ["count workflows --status PENDING", "Count workflows by status"],
        ["find user john.doe", "Find specific user"],
        ["find workflow --code PR", "Find workflow by code"]
    ],
    [3, 3.5]
)

add_section(doc, "7.2 User Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["user info <username>", "Show user details"],
        ["user lock <username>", "Lock user account"],
        ["user unlock <username>", "Unlock user account"],
        ["user reset <username>", "Reset user password"],
        ["user sessions <username>", "Show user's active sessions"]
    ],
    [3, 3.5]
)

add_example(doc, "User Info Command",
""">> user info john.doe
Username: john.doe
Name: John Doe
Email: john.doe@company.com
Roles: Staff, Initiator
Status: Active
Last Login: 2024-01-15 09:30:00
Failed Logins: 0
""")

add_section(doc, "7.3 Workflow Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["workflow info <code>", "Show workflow details"],
        ["workflow instances <code>", "List workflow instances"],
        ["workflow stats <code>", "Show workflow statistics"],
        ["instance info <ref>", "Show instance details"],
        ["instance reprocess <ref>", "Reprocess stuck instance"],
        ["instance cancel <ref> --reason <text>", "Force cancel instance"]
    ],
    [3.5, 3]
)

# ============================================================================
# 8. UTILITY COMMANDS
# ============================================================================
add_section(doc, "8. Utility Commands")

add_section(doc, "8.1 General Utilities", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["help", "Show available commands"],
        ["help <command>", "Show help for command"],
        ["clear", "Clear output panel"],
        ["echo <text>", "Echo text to output"],
        ["date", "Show current server date/time"],
        ["version", "Show system version"]
    ],
    [2.5, 4]
)

add_section(doc, "8.2 Debug Commands", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["log level <level>", "Set logging level (DEBUG, INFO, WARN, ERROR)"],
        ["log tail", "Show recent log entries"],
        ["config show", "Show system configuration"],
        ["config get <key>", "Get specific config value"]
    ],
    [3, 3.5]
)

add_section(doc, "8.3 Batch Operations", level=2)

add_table(doc,
    ["Command", "Description"],
    [
        ["batch unlock --failed-logins 5", "Unlock all accounts with 5+ failed logins"],
        ["batch reset-password --type EXTERNAL", "Reset passwords for external users"],
        ["batch cancel --status DRAFT --older-than 30d", "Cancel old drafts"]
    ],
    [4, 2.5]
)

add_note(doc, "Batch commands affect multiple records. Always confirm before executing.", "WARNING")

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Before Executing Commands", level=2)
add_numbered_list(doc, [
    "Understand what the command does",
    "Use help command to verify syntax",
    "Test with query commands before modifications",
    "Consider impact on active users",
    "Have a rollback plan for data changes"
])

add_section(doc, "9.2 Safe Usage Guidelines", level=2)
add_bullet_list(doc, [
    "Start with read-only commands (status, count, info)",
    "Use --dry-run flag when available to preview changes",
    "Document commands executed for audit purposes",
    "Avoid running heavy commands during peak hours",
    "Close console when not in use"
])

add_section(doc, "9.3 Command Execution Tips", level=2)
add_bullet_list(doc, [
    "Use Tab completion for command names (if supported)",
    "Copy complex commands to text file before executing",
    "Review output carefully before proceeding",
    "Use clear command to organize long sessions"
])

# ============================================================================
# 10. SECURITY CONSIDERATIONS
# ============================================================================
add_section(doc, "10. Security Considerations")

add_section(doc, "10.1 Access Control", level=2)
add_bullet_list(doc, [
    "Console access is restricted to super administrators",
    "All commands are logged to audit trail",
    "Session timeout applies to console sessions",
    "Commands cannot escalate beyond user's privileges"
])

add_section(doc, "10.2 Audit Logging", level=2)
add_paragraph(doc, """All command console activities are logged:""")

add_table(doc,
    ["Logged Item", "Description"],
    [
        ["User", "Who executed the command"],
        ["Command", "Full command string"],
        ["Timestamp", "When executed"],
        ["Result", "Success/Failure and output"],
        ["IP Address", "Client IP address"]
    ],
    [2, 4.5]
)

add_section(doc, "10.3 Dangerous Commands", level=2)
add_paragraph(doc, """Some commands require additional confirmation:""")
add_bullet_list(doc, [
    "Commands that modify data require --confirm flag",
    "Batch operations require explicit confirmation",
    "Maintenance mode commands affect all users",
    "Reset commands are irreversible"
])

add_example(doc, "Confirmation Prompt",
""">> batch cancel --status DRAFT --older-than 30d
WARNING: This will cancel 47 draft workflows
Type 'yes' to confirm: yes
47 workflows cancelled successfully
""")

add_section(doc, "10.4 Incident Response", level=2)
add_paragraph(doc, "If you execute a command incorrectly:", bold=True)
add_numbered_list(doc, [
    "Note the exact command executed",
    "Document the output/error",
    "Assess the impact immediately",
    "Contact system support if data affected",
    "Do not attempt additional commands to 'fix' it"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/13_Command_Console_Manual.docx")
print("Command Console Manual created successfully!")
