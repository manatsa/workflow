"""
Generate Settings & Configuration Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Settings & Configuration Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Settings",
    "System Settings",
    "Email Configuration",
    "Workflow Settings",
    "Security Settings",
    "Notification Settings",
    "UI Customization",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Settings & Configuration module allows administrators to customize system behavior, configure email services, set security policies, and manage various application preferences.""")

add_paragraph(doc, "Configurable Areas:", bold=True)
add_bullet_list(doc, [
    "System-wide settings",
    "Email server configuration",
    "Workflow behavior settings",
    "Security and authentication settings",
    "Notification preferences",
    "User interface customization"
])

add_note(doc, "Settings changes may affect all users. Review changes carefully before saving.", "WARNING")

add_image_placeholder(doc, "Settings Module Overview")

# ============================================================================
# 2. ACCESSING SETTINGS
# ============================================================================
add_section(doc, "2. Accessing Settings")

add_step_by_step(doc, [
    "Log in with administrator credentials",
    "Click 'Administration' in the navigation sidebar",
    "Click 'Settings' from the sub-menu",
    "The Settings page displays with tabs or sections"
])

add_image_placeholder(doc, "Navigation to Settings")

# ============================================================================
# 3. SYSTEM SETTINGS
# ============================================================================
add_section(doc, "3. System Settings")

add_section(doc, "3.1 General Settings", level=2)

add_table(doc,
    ["Setting", "Type", "Description"],
    [
        ["System Name", "String", "Display name of the application"],
        ["System Logo", "File", "Logo displayed in header"],
        ["Time Zone", "Select", "Default system time zone"],
        ["Date Format", "Select", "Format for displaying dates"],
        ["Language", "Select", "Default system language"],
        ["Currency", "Select", "Default currency for financial fields"]
    ],
    [2, 1, 3.5]
)

add_section(doc, "3.2 Changing System Settings", level=2)
add_step_by_step(doc, [
    "Navigate to the Settings page",
    "Locate the setting you want to change",
    "Enter the new value",
    "Click 'Save' or 'Apply' button",
    "Settings take effect immediately (some may require refresh)"
])

add_image_placeholder(doc, "System Settings Panel")

add_section(doc, "3.3 Session Settings", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Session Timeout", "30 minutes", "Idle time before automatic logout"],
        ["Remember Me Duration", "7 days", "Extended session when 'Remember Me' checked"],
        ["Concurrent Sessions", "Allowed", "Whether user can have multiple active sessions"]
    ],
    [2, 1.5, 3]
)

# ============================================================================
# 4. EMAIL CONFIGURATION
# ============================================================================
add_section(doc, "4. Email Configuration")

add_paragraph(doc, """Email configuration is essential for system notifications, approval alerts, and password reset functionality.""")

add_section(doc, "4.1 SMTP Settings", level=2)

add_table(doc,
    ["Setting", "Required", "Description", "Example"],
    [
        ["SMTP Host", "Yes", "Mail server hostname", "smtp.company.com"],
        ["SMTP Port", "Yes", "Mail server port", "587"],
        ["Protocol", "Yes", "Mail protocol", "SMTP, SMTPS"],
        ["Username", "Yes", "Authentication username", "workflow@company.com"],
        ["Password", "Yes", "Authentication password", "********"],
        ["From Address", "Yes", "Sender email address", "noreply@company.com"],
        ["From Name", "Yes", "Sender display name", "Workflow System"],
        ["Enable TLS", "No", "Use TLS encryption", "Yes/No"],
        ["Enable SSL", "No", "Use SSL encryption", "Yes/No"]
    ],
    [1.5, 0.8, 2.2, 2]
)

add_image_placeholder(doc, "Email Configuration Form")

add_section(doc, "4.2 Configuring Email", level=2)
add_step_by_step(doc, [
    "Navigate to Settings > Email Configuration",
    "Enter SMTP server details",
    "Enter authentication credentials",
    "Set the From address and name",
    "Enable encryption (TLS/SSL) as required",
    "Click 'Save' to store configuration",
    "Click 'Test Email' to verify settings"
])

add_section(doc, "4.3 Testing Email Configuration", level=2)
add_step_by_step(doc, [
    "After saving email settings, click 'Test Email' button",
    "Enter a test recipient email address",
    "Click 'Send Test'",
    "Check the recipient inbox for the test email",
    "Verify the email arrived and looks correct"
])

add_note(doc, "If test email fails, check SMTP settings, firewall rules, and authentication credentials.", "TIP")

add_section(doc, "4.4 Common Email Providers", level=2)

add_table(doc,
    ["Provider", "SMTP Host", "Port", "Security"],
    [
        ["Microsoft 365", "smtp.office365.com", "587", "TLS"],
        ["Gmail", "smtp.gmail.com", "587", "TLS"],
        ["Amazon SES", "email-smtp.region.amazonaws.com", "587", "TLS"],
        ["Custom Server", "mail.yourcompany.com", "25/587/465", "Varies"]
    ],
    [2, 2.5, 0.8, 1.2]
)

# ============================================================================
# 5. WORKFLOW SETTINGS
# ============================================================================
add_section(doc, "5. Workflow Settings")

add_section(doc, "5.1 Default Workflow Behaviors", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Require Approvers", "Yes", "Workflows must have at least one approver"],
        ["Allow Draft Save", "Yes", "Users can save incomplete submissions"],
        ["Allow Recall", "Yes", "Initiators can recall pending workflows"],
        ["Allow Cancel", "Yes", "Initiators can cancel their workflows"],
        ["Require Approval Comment", "No", "Force comments when approving"],
        ["Require Rejection Comment", "Yes", "Force comments when rejecting"],
        ["Auto-Generate Reference", "Yes", "System generates reference numbers"]
    ],
    [2.5, 1, 3]
)

add_section(doc, "5.2 Reference Number Format", level=2)
add_paragraph(doc, """Configure how workflow reference numbers are generated:""")

add_table(doc,
    ["Component", "Token", "Example"],
    [
        ["Prefix", "WF", "WF-"],
        ["Year", "{YYYY}", "2024"],
        ["Month", "{MM}", "01"],
        ["Sequential", "{SEQ}", "00001"],
        ["Workflow Code", "{CODE}", "PR"]
    ],
    [2, 1.5, 2]
)

add_example(doc, "Reference Number Format",
"""Format: WF-{YYYY}-{SEQ}
Result: WF-2024-00001, WF-2024-00002, ...

Format: {CODE}/{YYYY}/{MM}/{SEQ}
Result: PR/2024/01/00001, PR/2024/01/00002, ...
""")

add_section(doc, "5.3 Escalation Settings", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Default Escalation Days", "3 days", "Time before auto-escalation"],
        ["Send Escalation Email", "Yes", "Notify when workflow escalates"],
        ["Send Reminder Email", "Yes", "Send reminders before escalation"]
    ],
    [2.5, 1.5, 2.5]
)

# ============================================================================
# 6. SECURITY SETTINGS
# ============================================================================
add_section(doc, "6. Security Settings")

add_section(doc, "6.1 Password Policy", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Minimum Length", "8 characters", "Minimum password length"],
        ["Require Uppercase", "Yes", "Must include uppercase letter"],
        ["Require Lowercase", "Yes", "Must include lowercase letter"],
        ["Require Number", "Yes", "Must include digit"],
        ["Require Special Char", "No", "Must include special character"],
        ["Password Expiry", "90 days", "Days before password must change"],
        ["Password History", "3", "Number of previous passwords prevented"]
    ],
    [2, 1.5, 3]
)

add_section(doc, "6.2 Account Lockout Policy", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Max Failed Attempts", "5", "Failed logins before lockout"],
        ["Lockout Duration", "30 minutes", "Auto-unlock after this time"],
        ["Reset Counter After", "30 minutes", "Clear failed count after success"]
    ],
    [2.5, 1.5, 2.5]
)

add_section(doc, "6.3 Session Security", level=2)

add_table(doc,
    ["Setting", "Default", "Description"],
    [
        ["Token Expiry", "8 hours", "JWT token validity period"],
        ["Secure Cookies", "Yes", "Use secure flag for cookies"],
        ["SameSite Policy", "Strict", "Cookie same-site policy"]
    ],
    [2.5, 1.5, 2.5]
)

# ============================================================================
# 7. NOTIFICATION SETTINGS
# ============================================================================
add_section(doc, "7. Notification Settings")

add_section(doc, "7.1 Email Notification Types", level=2)

add_table(doc,
    ["Notification", "Default", "Recipients"],
    [
        ["Workflow Submitted", "Yes", "First level approver"],
        ["Workflow Approved", "Yes", "Initiator, next approver"],
        ["Workflow Rejected", "Yes", "Initiator"],
        ["Workflow Escalated", "Yes", "Escalation target, initiator"],
        ["Workflow Recalled", "Yes", "Previous approver"],
        ["Password Reset", "Yes", "User requesting reset"],
        ["Account Locked", "Yes", "User, admin"]
    ],
    [2.5, 1, 3]
)

add_section(doc, "7.2 Enabling/Disabling Notifications", level=2)
add_step_by_step(doc, [
    "Navigate to Settings > Notifications",
    "Find the notification type",
    "Toggle the switch to enable/disable",
    "Click 'Save' to apply changes"
])

add_section(doc, "7.3 Email Approval Links", level=2)
add_paragraph(doc, """Configure whether approval emails include direct action links:""")

add_table(doc,
    ["Setting", "Description"],
    [
        ["Include Approve Link", "Email contains direct approve button/link"],
        ["Include Reject Link", "Email contains direct reject button/link"],
        ["Link Expiry", "How long email links remain valid (default 7 days)"]
    ],
    [2, 4.5]
)

# ============================================================================
# 8. UI CUSTOMIZATION
# ============================================================================
add_section(doc, "8. UI Customization")

add_section(doc, "8.1 Branding Settings", level=2)

add_table(doc,
    ["Setting", "Description"],
    [
        ["Application Name", "Name shown in browser tab and header"],
        ["Logo", "Application logo (recommended: 200x50px)"],
        ["Favicon", "Browser tab icon (16x16 or 32x32 ICO/PNG)"],
        ["Primary Color", "Main theme color"],
        ["Secondary Color", "Accent color for highlights"]
    ],
    [2, 4.5]
)

add_section(doc, "8.2 Theme Settings", level=2)

add_paragraph(doc, """The Theme Settings tab provides comprehensive control over the application's visual appearance. Changes apply immediately after saving.""")

add_table(doc,
    ["Setting", "Type", "Description"],
    [
        ["Dark Theme", "Toggle", "Enable dark mode with dark backgrounds and light text"],
        ["Primary Color", "Color", "Main brand color used throughout the application"],
        ["Secondary Color", "Color", "Accent color for highlights and secondary elements"],
        ["Sidebar Background", "Color", "Background color of the navigation sidebar"],
        ["Sidebar Text", "Color", "Text color in the navigation sidebar"],
        ["Header Background", "Color", "Background color of the top header bar"],
        ["Header Text", "Color", "Text color in the header"],
        ["Body Background", "Color", "Main content area background color"],
        ["Card Background", "Color", "Background color for cards and panels"],
        ["Button Primary", "Color", "Primary action button color"],
        ["Success/Warning/Error", "Colors", "Status indicator colors"]
    ],
    [2, 1, 3.5]
)

add_section(doc, "8.2.1 Dark Mode", level=3)
add_paragraph(doc, """Dark Mode provides a darker color scheme that reduces eye strain in low-light environments and can save battery on OLED displays.""")

add_step_by_step(doc, [
    "Navigate to Settings > Theme Settings tab",
    "Toggle 'Dark Theme' to ON",
    "Click 'Save Changes'",
    "The interface immediately switches to dark mode",
    "All components including forms, dialogs, and menus respect dark mode"
])

add_note(doc, "Dark mode settings are stored per-user in local storage for faster loading on return visits.", "NOTE")

add_section(doc, "8.3 Dashboard Customization", level=2)
add_bullet_list(doc, [
    "Configure which widgets appear on the dashboard",
    "Set default number of items in lists",
    "Configure quick action buttons",
    "Set default landing page after login"
])

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Before Changing Settings", level=2)
add_numbered_list(doc, [
    "Document current settings before changes",
    "Test changes in non-production environment first",
    "Notify users of significant changes",
    "Schedule changes during low-usage periods",
    "Have a rollback plan ready"
])

add_section(doc, "9.2 Email Configuration Tips", level=2)
add_bullet_list(doc, [
    "Always test email after configuration changes",
    "Use dedicated email account for system notifications",
    "Monitor email delivery rates",
    "Set up SPF/DKIM records for deliverability",
    "Consider email rate limits"
])

add_section(doc, "9.3 Security Recommendations", level=2)
add_bullet_list(doc, [
    "Use strong password policies",
    "Enable account lockout protection",
    "Review security settings quarterly",
    "Monitor failed login attempts",
    "Keep session timeouts reasonable"
])

add_section(doc, "9.4 Troubleshooting Settings Issues", level=2)

add_table(doc,
    ["Issue", "Solution"],
    [
        ["Settings not saving", "Check permissions, refresh page, clear cache"],
        ["Email not sending", "Verify SMTP settings, test connection, check credentials"],
        ["Users locked out unexpectedly", "Review lockout policy, check for brute force attacks"],
        ["Theme not applying", "Clear browser cache, check user preference override"]
    ],
    [2.5, 4]
)

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/10_Settings_Configuration_Manual.docx")
print("Settings & Configuration Manual created successfully!")
