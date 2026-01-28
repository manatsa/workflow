"""
Generate Dashboard Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Dashboard Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Dashboard Overview",
    "Dashboard Components",
    "Quick Stats Panel",
    "Recent Activity",
    "Quick Actions",
    "Navigation Elements",
    "Personalization",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Dashboard is the central hub of the Sonar Workflow System. After logging in, users are immediately directed to the Dashboard, which provides a comprehensive overview of their workflow activities, pending tasks, and quick access to frequently used features.""")

add_paragraph(doc, "Purpose of the Dashboard:", bold=True)
add_bullet_list(doc, [
    "Provide at-a-glance view of important information",
    "Display pending approvals and tasks requiring attention",
    "Show recent workflow submissions and their status",
    "Enable quick access to commonly used workflows",
    "Present key metrics and statistics"
])

add_image_placeholder(doc, "Dashboard Main View")

# ============================================================================
# 2. DASHBOARD OVERVIEW
# ============================================================================
add_section(doc, "2. Dashboard Overview")

add_section(doc, "2.1 Dashboard Layout", level=2)
add_paragraph(doc, """The Dashboard is organized into distinct sections, each providing specific information and functionality:""")

add_table(doc,
    ["Section", "Location", "Purpose"],
    [
        ["Header Bar", "Top", "User profile, notifications, theme toggle, logout"],
        ["Navigation Sidebar", "Left", "Access to all system modules"],
        ["Quick Stats", "Top Center", "Key metrics at a glance"],
        ["Pending Approvals", "Center", "Workflows awaiting your approval"],
        ["Recent Submissions", "Center", "Your recent workflow submissions"],
        ["Quick Actions", "Right/Bottom", "Shortcuts to common tasks"]
    ],
    [2, 1.5, 3]
)

add_image_placeholder(doc, "Dashboard Layout Diagram")

add_section(doc, "2.2 Role-Based Content", level=2)
add_paragraph(doc, """The Dashboard content adapts based on your user role:""")

add_table(doc,
    ["User Role", "Dashboard Features"],
    [
        ["Administrator", "All metrics, system statistics, user activity summary"],
        ["Approver", "Pending approvals count, approval queue, escalated items"],
        ["Initiator", "My submissions, draft workflows, available workflows"],
        ["Manager", "Team metrics, departmental statistics, reports access"]
    ],
    [2, 4.5]
)

# ============================================================================
# 3. DASHBOARD COMPONENTS
# ============================================================================
add_section(doc, "3. Dashboard Components")

add_section(doc, "3.1 Header Bar", level=2)
add_paragraph(doc, "The Header Bar is always visible at the top of the screen and contains:")

add_table(doc,
    ["Component", "Icon/Location", "Function"],
    [
        ["Logo", "Left", "Click to return to Dashboard from any page"],
        ["Search", "Center", "Quick search across workflows and instances"],
        ["Notifications", "Right", "Bell icon shows pending notifications count"],
        ["Theme Toggle", "Right", "Switch between light and dark mode"],
        ["User Profile", "Right", "Access profile, change password, logout"]
    ],
    [2, 1.5, 3]
)

add_image_placeholder(doc, "Header Bar Components")

add_section(doc, "3.2 Navigation Sidebar", level=2)
add_paragraph(doc, """The Navigation Sidebar provides access to all system modules. It can be collapsed to maximize screen space.""")

add_paragraph(doc, "Main Navigation Items:", bold=True)
add_bullet_list(doc, [
    "Dashboard - Return to main dashboard",
    "Workflows - Browse and submit workflows",
    "My Submissions - View your submitted workflows",
    "Approvals - View pending approvals (Approvers only)",
    "Administration - User, role, organization management (Admins)",
    "Reports - Access system reports",
    "Settings - System configuration (Admins)"
])

add_section(doc, "3.3 Sidebar Operations", level=2)
add_table(doc,
    ["Action", "How To", "Result"],
    [
        ["Expand Sidebar", "Click hamburger menu icon", "Full sidebar with labels"],
        ["Collapse Sidebar", "Click hamburger menu icon again", "Icons only (more space)"],
        ["Navigate", "Click any menu item", "Opens the selected module"],
        ["Sub-menu", "Click arrow on menu item", "Expands sub-navigation items"]
    ],
    [2, 2.5, 2]
)

# ============================================================================
# 4. QUICK STATS PANEL
# ============================================================================
add_section(doc, "4. Quick Stats Panel")

add_paragraph(doc, """The Quick Stats Panel displays key metrics in card format, providing immediate insight into your workflow status.""")

add_section(doc, "4.1 Available Statistics", level=2)

add_table(doc,
    ["Stat Card", "Shows", "Visibility"],
    [
        ["Pending Approvals", "Number of workflows awaiting your approval", "Approvers, Managers"],
        ["My Submissions", "Total workflows you have submitted", "All users"],
        ["Drafts", "Incomplete workflow submissions saved as draft", "All users"],
        ["Approved Today", "Workflows approved in the last 24 hours", "Approvers, Managers"],
        ["Rejected Today", "Workflows rejected in the last 24 hours", "Approvers, Managers"],
        ["Escalated", "Workflows that have been escalated", "Managers, Admins"],
        ["Active Workflows", "Total active workflow templates", "Admins"]
    ],
    [2, 2.5, 2]
)

add_image_placeholder(doc, "Quick Stats Cards")

add_section(doc, "4.2 Stat Card Interactions", level=2)
add_paragraph(doc, "Each stat card is interactive:")
add_bullet_list(doc, [
    "Click on a card to navigate to the detailed view",
    "Hover to see a tooltip with additional information",
    "Cards update in real-time as workflow status changes",
    "Color indicators show status (green=good, yellow=attention, red=urgent)"
])

add_example(doc, "Clicking Pending Approvals Card",
"""User clicks the "Pending Approvals: 5" card
System navigates to Approvals list
List is pre-filtered to show only pending items
User can immediately start processing approvals""")

# ============================================================================
# 5. RECENT ACTIVITY
# ============================================================================
add_section(doc, "5. Recent Activity")

add_section(doc, "5.1 Recent Submissions", level=2)
add_paragraph(doc, """Displays your most recent workflow submissions with current status:""")

add_table(doc,
    ["Column", "Description"],
    [
        ["Reference No.", "Unique identifier for the submission"],
        ["Workflow", "Name of the workflow"],
        ["Status", "Current status (Pending, Approved, Rejected, etc.)"],
        ["Submitted", "Date and time of submission"],
        ["Current Approver", "Person currently reviewing (if pending)"]
    ],
    [2, 4.5]
)

add_section(doc, "5.2 Status Indicators", level=2)

add_table(doc,
    ["Status", "Color", "Meaning"],
    [
        ["Draft", "Gray", "Not yet submitted, saved for later"],
        ["Pending", "Yellow/Orange", "Awaiting approval"],
        ["Approved", "Green", "Fully approved"],
        ["Rejected", "Red", "Rejected by an approver"],
        ["Escalated", "Purple", "Escalated to higher authority"],
        ["Cancelled", "Gray", "Cancelled by initiator"],
        ["On Hold", "Blue", "Temporarily paused"],
        ["Recalled", "Orange", "Recalled by initiator for changes"]
    ],
    [1.5, 1.5, 3.5]
)

add_image_placeholder(doc, "Recent Submissions Panel")

add_section(doc, "5.3 Viewing Submission Details", level=2)
add_step_by_step(doc, [
    "Locate the submission in the Recent Submissions panel",
    "Click on the row or the 'View' action button",
    "The Submission Detail page opens showing full information",
    "Review the submission data, approval history, and attachments"
])

# ============================================================================
# 6. QUICK ACTIONS
# ============================================================================
add_section(doc, "6. Quick Actions")

add_paragraph(doc, """Quick Actions provide shortcuts to frequently used features, reducing the number of clicks needed to perform common tasks.""")

add_section(doc, "6.1 Available Quick Actions", level=2)

add_table(doc,
    ["Action", "Description", "Where It Goes"],
    [
        ["New Workflow", "Start a new workflow submission", "Workflow selection page"],
        ["View Approvals", "See pending approval items", "Approvals list"],
        ["My Submissions", "Track your submissions", "My Submissions page"],
        ["View Reports", "Access reporting module", "Reports list"],
        ["Manage Users", "User administration (Admin)", "User management"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "6.2 Using Quick Actions", level=2)
add_step_by_step(doc, [
    "Locate the Quick Actions section on the Dashboard",
    "Click the desired action button",
    "You are immediately taken to that feature",
    "Complete your task in the new screen"
])

add_image_placeholder(doc, "Quick Actions Buttons")

# ============================================================================
# 7. NAVIGATION ELEMENTS
# ============================================================================
add_section(doc, "7. Navigation Elements")

add_section(doc, "7.1 Breadcrumb Navigation", level=2)
add_paragraph(doc, """Breadcrumbs appear at the top of each page showing your current location in the system hierarchy:""")

add_example(doc, "Breadcrumb Path",
"""Dashboard > Workflows > Purchase Request > View Instance
Each segment is clickable to navigate back to that level""")

add_section(doc, "7.2 Back Navigation", level=2)
add_bullet_list(doc, [
    "Use browser back button to return to previous page",
    "Click breadcrumb links to jump to specific levels",
    "Dashboard logo always returns to main Dashboard",
    "Cancel buttons on forms return to previous list view"
])

add_section(doc, "7.3 Keyboard Shortcuts", level=2)

add_table(doc,
    ["Shortcut", "Action"],
    [
        ["Alt + D", "Go to Dashboard"],
        ["Alt + W", "Go to Workflows"],
        ["Alt + A", "Go to Approvals"],
        ["Alt + S", "Focus Search box"],
        ["Escape", "Close dialogs/modals"]
    ],
    [2, 4.5]
)

# ============================================================================
# 8. PERSONALIZATION
# ============================================================================
add_section(doc, "8. Personalization")

add_section(doc, "8.1 Theme Selection", level=2)
add_paragraph(doc, "The system supports light and dark themes for user comfort:")
add_step_by_step(doc, [
    "Click the theme toggle icon in the Header Bar (sun/moon icon)",
    "The interface immediately switches to the alternate theme",
    "Your preference is saved and persists across sessions"
])

add_table(doc,
    ["Theme", "Best For", "Description"],
    [
        ["Light Mode", "Well-lit environments", "White background, dark text"],
        ["Dark Mode", "Low-light environments", "Dark background, light text"]
    ],
    [1.5, 2, 3]
)

add_section(doc, "8.2 Dashboard Layout Preferences", level=2)
add_paragraph(doc, "Some dashboard elements can be customized:")
add_bullet_list(doc, [
    "Sidebar can be collapsed for more workspace",
    "Stat cards may be reordered (if enabled by admin)",
    "Table views remember sort and filter preferences",
    "Recent items count can be configured in Settings"
])

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Daily Workflow", level=2)
add_paragraph(doc, "Recommended daily routine for effective workflow management:", bold=True)

add_numbered_list(doc, [
    "Check the Dashboard immediately after logging in",
    "Review the Pending Approvals count and process urgent items",
    "Check My Submissions for any status updates",
    "Review any notifications for important alerts",
    "Use Quick Actions to efficiently navigate to needed features"
])

add_section(doc, "9.2 Tips for Efficiency", level=2)
add_bullet_list(doc, [
    "Keep the sidebar collapsed when working on detailed forms",
    "Use keyboard shortcuts for faster navigation",
    "Set up browser bookmarks for frequently accessed pages",
    "Check notifications regularly for time-sensitive approvals",
    "Use the search feature to quickly find specific workflows"
])

add_section(doc, "9.3 Understanding Notifications", level=2)

add_table(doc,
    ["Notification Type", "Indicates", "Action Required"],
    [
        ["New Approval", "Workflow assigned for your approval", "Review and approve/reject"],
        ["Submission Update", "Status change on your submission", "Check new status"],
        ["Escalation", "Workflow escalated to you", "Immediate attention needed"],
        ["Reminder", "Pending item overdue", "Process the pending item"],
        ["System", "System maintenance or updates", "Note the information"]
    ],
    [2, 2.5, 2]
)

add_note(doc, "Regular dashboard checks ensure you don't miss important approvals or updates to your submissions.", "TIP")

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/02_Dashboard_Module_Manual.docx")
print("Dashboard Module Manual created successfully!")
