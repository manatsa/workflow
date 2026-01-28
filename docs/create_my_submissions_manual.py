"""
Generate My Submissions Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "My Submissions Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing My Submissions",
    "Understanding the Submissions List",
    "Filtering and Searching",
    "Viewing Submission Details",
    "Tracking Approval Progress",
    "Managing Drafts",
    "Recalling Submissions",
    "Cancelling Submissions",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The My Submissions module is your personal dashboard for tracking all workflows you have initiated. It provides a centralized view of your submissions across all workflow types, allowing you to monitor their progress through the approval process.""")

add_paragraph(doc, "What You Can Do:", bold=True)
add_bullet_list(doc, [
    "View all your workflow submissions in one place",
    "Track approval status in real-time",
    "Filter and search your submissions",
    "Continue working on draft submissions",
    "Recall pending submissions for edits",
    "Cancel submissions when no longer needed",
    "View complete approval history"
])

add_image_placeholder(doc, "My Submissions Overview")

# ============================================================================
# 2. ACCESSING MY SUBMISSIONS
# ============================================================================
add_section(doc, "2. Accessing My Submissions")

add_section(doc, "2.1 From Navigation Menu", level=2)
add_step_by_step(doc, [
    "Log in to the Sonar Workflow System",
    "Click 'My Submissions' in the navigation sidebar",
    "The My Submissions list page displays"
])

add_section(doc, "2.2 From Dashboard", level=2)
add_step_by_step(doc, [
    "On the Dashboard, locate 'My Submissions' or 'Drafts' card",
    "Click on the count or 'View All' link",
    "You are directed to My Submissions with relevant filter applied"
])

add_image_placeholder(doc, "Navigation to My Submissions")

# ============================================================================
# 3. UNDERSTANDING THE SUBMISSIONS LIST
# ============================================================================
add_section(doc, "3. Understanding the Submissions List")

add_section(doc, "3.1 List Columns", level=2)

add_table(doc,
    ["Column", "Description"],
    [
        ["Reference No.", "Unique submission identifier (e.g., WF-2024-00123)"],
        ["Workflow", "Name of the workflow type"],
        ["Status", "Current status (Draft, Pending, Approved, Rejected, etc.)"],
        ["Amount", "Total amount for financial workflows"],
        ["Submitted", "Date and time of submission"],
        ["Current Approver", "Person currently reviewing (if pending)"],
        ["SBU", "Strategic Business Unit"],
        ["Actions", "Quick action buttons"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "My Submissions List Table")

add_section(doc, "3.2 Status Indicators", level=2)
add_paragraph(doc, """Each submission displays a color-coded status badge:""")

add_table(doc,
    ["Status", "Color", "Meaning", "Actions Available"],
    [
        ["Draft", "Gray", "Not yet submitted", "Edit, Delete"],
        ["Pending", "Yellow", "Awaiting approval", "View, Recall"],
        ["Approved", "Green", "Fully approved", "View only"],
        ["Rejected", "Red", "Rejected by approver", "View only"],
        ["Escalated", "Purple", "Escalated to higher authority", "View, Recall"],
        ["On Hold", "Blue", "Temporarily paused", "View"],
        ["Cancelled", "Gray", "Cancelled by initiator", "View only"],
        ["Recalled", "Orange", "Recalled for editing", "Edit, Submit"]
    ],
    [1.3, 1, 2.2, 2]
)

add_section(doc, "3.3 Sorting the List", level=2)
add_paragraph(doc, "Click on column headers to sort:")
add_bullet_list(doc, [
    "Single click: Sort ascending",
    "Double click: Sort descending",
    "Default: Sorted by submission date (newest first)"
])

# ============================================================================
# 4. FILTERING AND SEARCHING
# ============================================================================
add_section(doc, "4. Filtering and Searching")

add_section(doc, "4.1 Quick Filters", level=2)
add_paragraph(doc, """Use the filter tabs/buttons at the top to quickly show:""")

add_table(doc,
    ["Filter Tab", "Shows"],
    [
        ["All", "All your submissions"],
        ["Pending", "Submissions awaiting approval"],
        ["Approved", "Approved submissions"],
        ["Rejected", "Rejected submissions"],
        ["Drafts", "Incomplete draft submissions"]
    ],
    [2, 4.5]
)

add_section(doc, "4.2 Advanced Filters", level=2)
add_paragraph(doc, "Click 'Filters' or the filter icon to access advanced options:")

add_table(doc,
    ["Filter", "Description"],
    [
        ["Workflow Type", "Filter by specific workflow"],
        ["Status", "Multiple status selection"],
        ["Date Range", "Submissions within date range"],
        ["Amount Range", "Filter by amount (min/max)"],
        ["SBU", "Filter by business unit"]
    ],
    [2, 4.5]
)

add_step_by_step(doc, [
    "Click 'Filters' button to open filter panel",
    "Select or enter filter criteria",
    "Click 'Apply' to filter the list",
    "Click 'Clear' to remove all filters"
], title="Using Advanced Filters:")

add_section(doc, "4.3 Search", level=2)
add_paragraph(doc, """Use the search box to find submissions by:""")
add_bullet_list(doc, [
    "Reference number",
    "Workflow name",
    "Field values (if searchable fields configured)"
])

add_image_placeholder(doc, "Filter and Search Controls")

# ============================================================================
# 5. VIEWING SUBMISSION DETAILS
# ============================================================================
add_section(doc, "5. Viewing Submission Details")

add_section(doc, "5.1 Opening a Submission", level=2)
add_step_by_step(doc, [
    "Locate the submission in the list",
    "Click on the row or the 'View' action button",
    "The submission detail page opens"
])

add_section(doc, "5.2 Detail Page Sections", level=2)

add_table(doc,
    ["Section", "Contents"],
    [
        ["Header", "Reference number, workflow name, status, action buttons"],
        ["Summary", "Key information: submitted date, amount, SBU, current approver"],
        ["Form Data", "All submitted field values organized by groups"],
        ["Attachments", "Uploaded files with download links"],
        ["Approval History", "Complete timeline of all actions"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Submission Detail Page")

add_section(doc, "5.3 Form Data Display", level=2)
add_paragraph(doc, """The Form Data section shows all information you submitted:""")
add_bullet_list(doc, [
    "Fields are organized by their form groups",
    "Groups can be expanded/collapsed",
    "Both field labels and values are displayed",
    "File attachments are linked for download"
])

# ============================================================================
# 6. TRACKING APPROVAL PROGRESS
# ============================================================================
add_section(doc, "6. Tracking Approval Progress")

add_section(doc, "6.1 Approval Status Overview", level=2)
add_paragraph(doc, """The submission detail shows where your workflow is in the approval process:""")
add_bullet_list(doc, [
    "Current Status: Overall workflow status",
    "Current Approver: Who needs to act next",
    "Approval Level: What level in the hierarchy (Level 1, 2, etc.)"
])

add_section(doc, "6.2 Reading the Approval History", level=2)
add_paragraph(doc, """The Approval History shows a chronological timeline of all actions:""")

add_example(doc, "Approval History Example",
"""[2024-01-15 09:00] SUBMITTED by John Doe
   "Initial submission for Q1 budget"

[2024-01-15 14:30] APPROVED by Jane Smith (Level 1)
   "Verified against budget allocation. Approved."

[2024-01-16 10:15] APPROVED by Mike Johnson (Level 2)
   "Final approval granted."

Status: APPROVED
""")

add_section(doc, "6.3 Understanding Pending State", level=2)
add_paragraph(doc, """When your submission is Pending:""")
add_bullet_list(doc, [
    "It is actively in the approval queue",
    "'Current Approver' shows who needs to act",
    "You'll be notified when status changes",
    "You can recall if you need to make changes"
])

add_image_placeholder(doc, "Approval Progress Indicator")

# ============================================================================
# 7. MANAGING DRAFTS
# ============================================================================
add_section(doc, "7. Managing Drafts")

add_section(doc, "7.1 What Are Drafts?", level=2)
add_paragraph(doc, """Drafts are incomplete submissions that haven't been submitted for approval yet. They:""")
add_bullet_list(doc, [
    "Have no reference number assigned",
    "Are visible only to you",
    "Can be edited unlimited times",
    "Don't enter the approval queue",
    "Persist until you submit or delete them"
])

add_section(doc, "7.2 Finding Your Drafts", level=2)
add_step_by_step(doc, [
    "Go to My Submissions",
    "Click the 'Drafts' filter tab",
    "Or use status filter to select 'Draft'"
])

add_section(doc, "7.3 Editing a Draft", level=2)
add_step_by_step(doc, [
    "Locate the draft in My Submissions",
    "Click on the draft or the 'Edit' action button",
    "The form opens with your saved data",
    "Make your changes",
    "Click 'Save Draft' to save or 'Submit' to finalize"
])

add_section(doc, "7.4 Deleting a Draft", level=2)
add_step_by_step(doc, [
    "Locate the draft in My Submissions",
    "Click the 'Delete' action button (trash icon)",
    "Confirm the deletion",
    "The draft is permanently removed"
])

add_note(doc, "Deleted drafts cannot be recovered. Make sure you want to discard the information.", "WARNING")

add_image_placeholder(doc, "Draft Management Options")

# ============================================================================
# 8. RECALLING SUBMISSIONS
# ============================================================================
add_section(doc, "8. Recalling Submissions")

add_paragraph(doc, """Recalling allows you to pull back a submitted workflow for editing before it's fully approved.""")

add_section(doc, "8.1 When You Can Recall", level=2)

add_table(doc,
    ["Condition", "Can Recall?"],
    [
        ["Status is Pending", "Yes"],
        ["Status is Escalated", "Yes"],
        ["Already approved at some level", "Depends on configuration"],
        ["Fully Approved", "No"],
        ["Rejected", "No"],
        ["Already Recalled", "No (already recalled)"]
    ],
    [3, 3.5]
)

add_section(doc, "8.2 How to Recall", level=2)
add_step_by_step(doc, [
    "Open the submission detail page",
    "Click the 'Recall' button",
    "Enter a recall reason (required)",
    "Click 'Confirm' to execute recall",
    "Status changes to 'Recalled'"
])

add_section(doc, "8.3 After Recall", level=2)
add_paragraph(doc, """Once recalled:""")
add_bullet_list(doc, [
    "Submission is removed from approver queues",
    "Status changes to 'Recalled'",
    "You can edit the submission",
    "Previous approval progress is reset",
    "Resubmission starts the approval process fresh"
])

add_section(doc, "8.4 Editing and Resubmitting", level=2)
add_step_by_step(doc, [
    "View your recalled submission",
    "Click 'Edit' to modify the form",
    "Make necessary corrections",
    "Click 'Submit' to resubmit",
    "Workflow re-enters approval queue at Level 1"
])

add_note(doc, "Any previous approvals are voided when you recall. The workflow must be re-approved from the beginning.", "NOTE")

# ============================================================================
# 9. CANCELLING SUBMISSIONS
# ============================================================================
add_section(doc, "9. Cancelling Submissions")

add_paragraph(doc, """If a workflow is no longer needed, you can cancel it (if the feature is enabled).""")

add_section(doc, "9.1 When You Can Cancel", level=2)
add_bullet_list(doc, [
    "Workflow is in Draft status (use Delete instead)",
    "Workflow is Pending and not yet fully approved",
    "Cancel feature is enabled for the workflow"
])

add_section(doc, "9.2 How to Cancel", level=2)
add_step_by_step(doc, [
    "Open the submission detail page",
    "Click the 'Cancel' button",
    "Enter a cancellation reason (required)",
    "Click 'Confirm' to cancel",
    "Status changes to 'Cancelled'"
])

add_section(doc, "9.3 Cancel vs Recall", level=2)

add_table(doc,
    ["Action", "When to Use", "Can Resume?"],
    [
        ["Recall", "Need to make changes, will resubmit", "Yes - can edit and resubmit"],
        ["Cancel", "No longer need the workflow", "No - workflow ends permanently"]
    ],
    [1.5, 2.5, 2.5]
)

add_note(doc, "Cancelled workflows cannot be recovered or resubmitted. Use this only when you're certain the workflow is no longer needed.", "WARNING")

# ============================================================================
# 10. BEST PRACTICES
# ============================================================================
add_section(doc, "10. Best Practices")

add_section(doc, "10.1 Regular Monitoring", level=2)
add_bullet_list(doc, [
    "Check My Submissions regularly for status updates",
    "Follow up on submissions that have been pending too long",
    "Complete or delete old drafts to keep your list organized"
])

add_section(doc, "10.2 Draft Management", level=2)
add_bullet_list(doc, [
    "Save drafts frequently when working on complex forms",
    "Don't let drafts accumulate - submit or delete them",
    "Use meaningful field values even in drafts for easy identification"
])

add_section(doc, "10.3 Before Submitting", level=2)
add_numbered_list(doc, [
    "Review all entered information for accuracy",
    "Ensure all required fields are completed",
    "Attach all necessary supporting documents",
    "Verify amounts and calculations",
    "Double-check the workflow is the correct one"
])

add_section(doc, "10.4 Communication", level=2)
add_bullet_list(doc, [
    "If urgent, consider contacting the approver directly",
    "Provide clear context in your submission",
    "Respond promptly if approver has questions",
    "Add helpful comments in multi-level workflows"
])

add_section(doc, "10.5 Troubleshooting", level=2)

add_table(doc,
    ["Issue", "Solution"],
    [
        ["Can't find my submission", "Check filters, try 'All' tab, use search"],
        ["Draft missing", "May have been deleted, check trash if available"],
        ["Can't recall", "Check if already approved or recall is disabled"],
        ["Status not updating", "Refresh page, wait for approver action"],
        ["Wrong workflow submitted", "Recall and correct, or cancel and resubmit correct one"]
    ],
    [2.5, 4]
)

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/06_My_Submissions_Manual.docx")
print("My Submissions Manual created successfully!")
