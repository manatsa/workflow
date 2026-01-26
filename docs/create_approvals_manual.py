"""
Generate Approvals Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Approvals Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Approvals",
    "Understanding the Approvals Queue",
    "Viewing Approval Details",
    "Approving a Workflow",
    "Rejecting a Workflow",
    "Escalating a Workflow",
    "Putting on Hold",
    "Adding Comments",
    "Email Approvals",
    "Auto-Escalation and Amount Limits",
    "Multi-Level Approvals",
    "Approval History",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Approvals Module is where designated approvers review and process workflow submissions. As an approver, you play a critical role in the business process by evaluating requests and making approval decisions.""")

add_paragraph(doc, "Key Functions:", bold=True)
add_bullet_list(doc, [
    "View workflows pending your approval",
    "Review submission details and attachments",
    "Approve valid requests",
    "Reject requests with reasons",
    "Escalate complex cases to higher authority",
    "Put submissions on hold when needed",
    "Add comments and feedback",
    "Approve directly from email notifications"
])

add_note(doc, "This module is only visible to users with approver roles or privileges.", "NOTE")

add_image_placeholder(doc, "Approvals Module Overview")

# ============================================================================
# 2. ACCESSING APPROVALS
# ============================================================================
add_section(doc, "2. Accessing Approvals")

add_section(doc, "2.1 From the Dashboard", level=2)
add_step_by_step(doc, [
    "Log in to the system",
    "On the Dashboard, locate the 'Pending Approvals' card",
    "Click on the card or the count number",
    "You are taken directly to your approval queue"
])

add_section(doc, "2.2 From Navigation Menu", level=2)
add_step_by_step(doc, [
    "Click 'Approvals' in the navigation sidebar",
    "The Approvals list page displays your pending items",
    "Use filters to narrow down the list if needed"
])

add_image_placeholder(doc, "Navigation to Approvals")

add_section(doc, "2.3 Notification Access", level=2)
add_paragraph(doc, """When a workflow requires your approval, you may receive:""")
add_bullet_list(doc, [
    "Email notification with workflow details and summary",
    "System notification (bell icon in header)",
    "Direct email approval links with Approve/Reject buttons",
    "Submission title in email subject for easy identification"
])

# ============================================================================
# 3. UNDERSTANDING THE APPROVALS QUEUE
# ============================================================================
add_section(doc, "3. Understanding the Approvals Queue")

add_section(doc, "3.1 Queue Overview", level=2)
add_paragraph(doc, """The Approvals Queue lists all workflows waiting for your review. Items are displayed in a table with key information at a glance.""")

add_section(doc, "3.2 Queue Columns", level=2)

add_table(doc,
    ["Column", "Description"],
    [
        ["Reference No.", "Unique identifier for the submission"],
        ["Title", "Submission title (from designated title field)"],
        ["Workflow", "Name of the workflow type"],
        ["Category", "Financial or Non-Financial"],
        ["Initiator", "Person who submitted the workflow"],
        ["SBU", "Strategic Business Unit of the submission"],
        ["Amount", "Monetary amount (for financial workflows)"],
        ["Submitted Date", "When the workflow was submitted"],
        ["Status", "Current status (Pending, Escalated, On Hold)"],
        ["Actions", "Quick action buttons"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Approvals Queue Table")

add_section(doc, "3.3 Filtering the Queue", level=2)
add_paragraph(doc, "Use filters to find specific items:", bold=True)

add_table(doc,
    ["Filter", "Options"],
    [
        ["Workflow Type", "Filter by specific workflow name"],
        ["Category", "Financial, Non-Financial"],
        ["SBU", "Filter by business unit"],
        ["Date Range", "Filter by submission date"],
        ["Amount Range", "Filter by amount (financial workflows)"],
        ["Status", "Pending, Escalated, On Hold"]
    ],
    [2, 4.5]
)

add_section(doc, "3.4 Sorting", level=2)
add_paragraph(doc, """Click on column headers to sort:""")
add_bullet_list(doc, [
    "Click once for ascending order",
    "Click again for descending order",
    "Default sort is by submission date (oldest first)"
])

add_note(doc, "Processing older items first ensures timely approvals and avoids automatic escalations.", "TIP")

# ============================================================================
# 4. VIEWING APPROVAL DETAILS
# ============================================================================
add_section(doc, "4. Viewing Approval Details")

add_section(doc, "4.1 Opening a Submission", level=2)
add_step_by_step(doc, [
    "In the Approvals queue, click on a row",
    "Or click the 'View' button in the Actions column",
    "The Approval Detail page opens"
])

add_section(doc, "4.2 Detail Page Sections", level=2)

add_table(doc,
    ["Section", "Contents"],
    [
        ["Header", "Reference number, workflow name, title, status badge"],
        ["Summary", "Key information: initiator, date, amount, SBU, category"],
        ["Form Data", "All submitted field values organized by groups/screens"],
        ["Attachments", "Uploaded files (downloadable)"],
        ["Approval History", "Timeline of all approval actions"],
        ["Action Panel", "Approve, Reject, Escalate, Hold buttons"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Approval Detail Page Layout")

add_section(doc, "4.3 Multi-Step Form Data", level=2)
add_paragraph(doc, """For workflows with multiple screens (wizard-style forms):""")
add_bullet_list(doc, [
    "Data is organized by screen/step",
    "Each screen's fields are grouped together",
    "Screen titles help navigate complex submissions",
    "All screens are visible in the detail view"
])

add_section(doc, "4.4 Reviewing Attachments", level=2)
add_step_by_step(doc, [
    "Scroll to the Attachments section",
    "Click on a filename to preview (if supported)",
    "Click the download icon to save locally",
    "Review all attachments before making a decision"
])

add_note(doc, "Always review attachments for supporting documentation. Missing or invalid documents may warrant rejection.", "TIP")

# ============================================================================
# 5. APPROVING A WORKFLOW
# ============================================================================
add_section(doc, "5. Approving a Workflow")

add_paragraph(doc, """Approving a workflow indicates that you have reviewed the submission and authorize it to proceed.""")

add_section(doc, "5.1 Approval Process", level=2)
add_step_by_step(doc, [
    "Open the workflow detail page",
    "Review all submitted information thoroughly",
    "Review attachments and supporting documents",
    "Verify amounts are within your approval authority",
    "Click the 'Approve' button",
    "Add comments (optional or required based on configuration)",
    "Click 'Confirm' to complete the approval",
    "Success message confirms the approval"
])

add_image_placeholder(doc, "Approve Button and Dialog")

add_section(doc, "5.2 Approval Authority Check", level=2)
add_paragraph(doc, """For financial workflows, the system checks your approval authority:""")

add_table(doc,
    ["Scenario", "Result"],
    [
        ["Amount within your limit", "Approval proceeds normally"],
        ["Amount exceeds your limit", "Warning displayed; may auto-escalate"],
        ["Unlimited approval authority", "Can approve any amount"],
        ["No amount field (non-financial)", "No authority check needed"]
    ],
    [2.5, 4]
)

add_section(doc, "5.3 What Happens After Approval", level=2)

add_table(doc,
    ["Scenario", "Result"],
    [
        ["More approval levels required", "Workflow moves to next approver"],
        ["Final approval level", "Workflow status changes to 'Approved'"],
        ["Amount exceeds next approver's limit", "Workflow escalates to higher authority"],
        ["Initiator notification", "Email sent to initiator about approval"]
    ],
    [2.5, 4]
)

# ============================================================================
# 6. REJECTING A WORKFLOW
# ============================================================================
add_section(doc, "6. Rejecting a Workflow")

add_paragraph(doc, """Rejection indicates that the workflow does not meet requirements or cannot be approved. Always provide clear reasons for rejection.""")

add_section(doc, "6.1 Rejection Process", level=2)
add_step_by_step(doc, [
    "Open the workflow detail page",
    "Review the submission and identify issues",
    "Click the 'Reject' button",
    "Enter a rejection reason (usually required)",
    "Be specific about what needs to be corrected",
    "Click 'Confirm' to complete the rejection",
    "Workflow status changes to 'Rejected'"
])

add_image_placeholder(doc, "Reject Button and Comment Dialog")

add_section(doc, "6.2 Writing Effective Rejection Reasons", level=2)
add_paragraph(doc, "Good rejection comments should:", bold=True)
add_bullet_list(doc, [
    "Clearly state why the workflow is being rejected",
    "Identify specific fields or information that are problematic",
    "Explain what changes or corrections are needed",
    "Be professional and constructive"
])

add_example(doc, "Good vs Bad Rejection Comments",
"""BAD: "Rejected - incomplete"

GOOD: "Rejected due to missing supporting documentation.
Please attach the vendor quotation and purchase
justification memo before resubmitting."
""")

add_section(doc, "6.3 What Happens After Rejection", level=2)
add_bullet_list(doc, [
    "Workflow status changes to 'Rejected'",
    "Initiator is notified via email with rejection reason",
    "Rejection reason is visible to initiator",
    "Initiator may submit a new corrected workflow"
])

add_note(doc, "Rejection is final for that submission. The initiator must submit a new workflow with corrections.", "NOTE")

# ============================================================================
# 7. ESCALATING A WORKFLOW
# ============================================================================
add_section(doc, "7. Escalating a Workflow")

add_paragraph(doc, """Escalation moves a workflow to a higher authority when you cannot make a decision or when special authorization is needed.""")

add_section(doc, "7.1 When to Escalate", level=2)
add_bullet_list(doc, [
    "Request exceeds your approval authority",
    "You need guidance from a supervisor",
    "Special circumstances require higher review",
    "Policy exception is needed",
    "You have a conflict of interest"
])

add_section(doc, "7.2 Manual Escalation Process", level=2)
add_step_by_step(doc, [
    "Open the workflow detail page",
    "Review the submission",
    "Click the 'Escalate' button",
    "Select the escalation target (if options provided)",
    "Enter escalation reason (required)",
    "Click 'Confirm' to complete escalation",
    "Workflow is reassigned to higher authority"
])

add_section(doc, "7.3 Escalation vs Rejection", level=2)

add_table(doc,
    ["Action", "When to Use", "Result"],
    [
        ["Reject", "Workflow has errors or cannot be approved", "Workflow ends, initiator notified"],
        ["Escalate", "You cannot/should not decide, need higher authority", "Workflow moves to next level"]
    ],
    [1.5, 2.5, 2.5]
)

# ============================================================================
# 8. PUTTING ON HOLD
# ============================================================================
add_section(doc, "8. Putting on Hold")

add_paragraph(doc, """The Hold action temporarily pauses a workflow when you need more time or additional information before making a decision.""")

add_section(doc, "8.1 When to Use Hold", level=2)
add_bullet_list(doc, [
    "Waiting for additional documentation",
    "Need clarification from the initiator",
    "Pending external verification",
    "Requires coordination with other parties",
    "Time-sensitive matters that cannot be decided immediately"
])

add_section(doc, "8.2 Hold Process", level=2)
add_step_by_step(doc, [
    "Open the workflow detail page",
    "Click the 'Hold' button",
    "Enter a reason for holding (required)",
    "Click 'Confirm' to place on hold",
    "Workflow status changes to 'On Hold'"
])

add_section(doc, "8.3 Resuming from Hold", level=2)
add_paragraph(doc, """When ready to process a held workflow:""")
add_step_by_step(doc, [
    "Open the held workflow",
    "Review any updates or additional information",
    "Click 'Approve', 'Reject', or 'Escalate' as appropriate",
    "The workflow resumes normal processing"
])

add_note(doc, "Workflows on hold do not auto-escalate. Monitor held items to avoid excessive delays.", "TIP")

# ============================================================================
# 9. ADDING COMMENTS
# ============================================================================
add_section(doc, "9. Adding Comments")

add_paragraph(doc, """Comments provide context and feedback on approval decisions. They become part of the permanent audit trail.""")

add_section(doc, "9.1 When Comments Are Required", level=2)
add_table(doc,
    ["Scenario", "Comment Required?"],
    [
        ["Approval (workflow configured to require)", "Yes"],
        ["Approval (workflow allows optional)", "Optional but recommended"],
        ["Rejection", "Usually required"],
        ["Escalation", "Always required"],
        ["Hold", "Always required"]
    ],
    [3, 3.5]
)

add_section(doc, "9.2 Writing Useful Comments", level=2)
add_bullet_list(doc, [
    "Be concise but informative",
    "Reference specific fields or documents",
    "State your reasoning for the decision",
    "Use professional language",
    "Avoid abbreviations that others may not understand"
])

add_example(doc, "Effective Approval Comment",
""""Approved. Verified quotation is competitive and within
budget allocation. Delivery timeline acceptable for
project schedule."
""")

# ============================================================================
# 10. EMAIL APPROVALS
# ============================================================================
add_section(doc, "10. Email Approvals")

add_paragraph(doc, """The system sends email notifications with direct approval links, allowing you to approve, reject, or escalate without logging into the system.""")

add_section(doc, "10.1 Email Notification Contents", level=2)
add_bullet_list(doc, [
    "Subject includes submission title for easy identification",
    "Workflow reference number and name",
    "Initiator information",
    "Submission summary (key field values)",
    "Amount (for financial workflows)",
    "SBU and department information",
    "Direct action buttons: Approve, Reject, Escalate"
])

add_image_placeholder(doc, "Email Approval Notification Example")

add_section(doc, "10.2 Using Email Approval Links", level=2)
add_step_by_step(doc, [
    "Open the email notification",
    "Review the submission summary in the email",
    "Click 'Approve', 'Reject', or 'Escalate' button",
    "A browser page opens showing the Email Approval page",
    "Review the submission details if needed",
    "Add comments (required for reject/escalate, optional for approve)",
    "Click 'Confirm' to complete the action",
    "Success message confirms the action was recorded"
])

add_section(doc, "10.3 Email Approval Page", level=2)
add_paragraph(doc, """When you click an email link, you see:""")
add_bullet_list(doc, [
    "Workflow and submission information",
    "Action you selected (Approve/Reject/Escalate)",
    "Comment field for your feedback",
    "Confirm button to execute the action",
    "Cancel button to abort"
])

add_section(doc, "10.4 Email Approval Authentication", level=2)
add_paragraph(doc, """Depending on system configuration:""")

add_table(doc,
    ["Mode", "Description"],
    [
        ["No Authentication", "Action executed directly from email link"],
        ["Inline Login", "Login dialog appears if not authenticated"],
        ["Full Authentication", "Must log in to system first"]
    ],
    [2, 4.5]
)

add_section(doc, "10.5 Email Approval Security", level=2)
add_bullet_list(doc, [
    "Links are unique and time-limited (configurable expiry)",
    "Links can only be used once",
    "Action is logged with 'EMAIL' source indicator",
    "Token includes approver and workflow validation",
    "IP address and timestamp are recorded"
])

add_note(doc, "If the email link has expired, log into the system directly to process the approval.", "TIP")

add_note(doc, "Do not forward approval emails - links are specific to your account and will not work for others.", "WARNING")

# ============================================================================
# 11. AUTO-ESCALATION AND AMOUNT LIMITS
# ============================================================================
add_section(doc, "11. Auto-Escalation and Amount Limits")

add_paragraph(doc, """For financial workflows, the system can automatically escalate submissions based on amount limits and approver authority.""")

add_section(doc, "11.1 Amount Limits", level=2)
add_paragraph(doc, """Each approver can have an amount limit defining their maximum approval authority:""")

add_table(doc,
    ["Limit Type", "Description"],
    [
        ["Fixed Amount", "Can approve up to specified amount (e.g., $10,000)"],
        ["Unlimited", "Can approve any amount"],
        ["No Limit Set", "Treated as unlimited or based on workflow config"]
    ],
    [2, 4.5]
)

add_section(doc, "11.2 Auto-Escalation Behavior", level=2)
add_paragraph(doc, """When 'Skip Unauthorized Approvers' is enabled for a workflow:""")

add_numbered_list(doc, [
    "System checks if current approver has sufficient authority",
    "If amount exceeds approver's limit, automatically escalates",
    "Escalation continues until finding approver with sufficient authority",
    "If no authorized approver found, workflow goes to final approver"
])

add_example(doc, "Auto-Escalation Example",
"""Workflow: Purchase Request for $25,000

Level 1 Approver: John (Limit: $5,000)
  -> Auto-escalated (amount exceeds limit)

Level 2 Approver: Jane (Limit: $20,000)
  -> Auto-escalated (amount exceeds limit)

Level 3 Approver: Mike (Limit: Unlimited)
  -> Workflow assigned here for approval

Result: John and Jane are skipped automatically.
""")

add_section(doc, "11.3 Financial vs Non-Financial Workflows", level=2)

add_table(doc,
    ["Category", "Amount Limits Apply?", "Auto-Escalation?"],
    [
        ["FINANCIAL", "Yes", "Based on configuration"],
        ["NON_FINANCIAL", "No", "No (no amount field)"]
    ],
    [2.5, 2, 2]
)

add_section(doc, "11.4 Identifying Limited Fields", level=2)
add_paragraph(doc, """In financial workflows, certain fields are marked as 'Limited' (amount fields). These fields:""")
add_bullet_list(doc, [
    "Are used to determine approval authority",
    "Trigger auto-escalation when exceeding limits",
    "Show the submission amount in approval queue",
    "Are highlighted in workflow configuration"
])

# ============================================================================
# 12. MULTI-LEVEL APPROVALS
# ============================================================================
add_section(doc, "12. Multi-Level Approvals")

add_section(doc, "12.1 Understanding Approval Levels", level=2)
add_paragraph(doc, """Workflows can have multiple approval levels, each with one or more approvers:""")

add_table(doc,
    ["Level", "Typical Role", "Description"],
    [
        ["Level 1", "Immediate Supervisor", "First review and validation"],
        ["Level 2", "Department Manager", "Departmental authorization"],
        ["Level 3", "Finance/Director", "Higher authority approval"],
        ["Level 4+", "Executive/Board", "Final approval for large requests"]
    ],
    [1.5, 2, 3]
)

add_section(doc, "12.2 Approval Flow", level=2)
add_paragraph(doc, """The approval process moves through levels sequentially:""")

add_numbered_list(doc, [
    "Submission enters at Level 1",
    "Level 1 approver reviews and approves",
    "If more levels exist, moves to Level 2",
    "Process continues until final level approves",
    "Workflow marked as fully Approved"
])

add_section(doc, "12.3 Multiple Approvers at Same Level", level=2)
add_paragraph(doc, """Some levels may have multiple approvers. Depending on configuration:""")

add_table(doc,
    ["Mode", "Requirement"],
    [
        ["Any One", "Any single approver can approve"],
        ["All Required", "All approvers must approve"],
        ["Sequential", "Approvers act in specified order"]
    ],
    [2, 4.5]
)

add_example(doc, "Multi-Level Approval Example",
"""Workflow: Purchase Request for $5,000

Level 1: Department Manager (You)
- You review and approve
- Workflow moves to Level 2

Level 2: Finance Manager
- Reviews and approves
- Workflow fully approved

Final Status: APPROVED
Initiator notified of approval
""")

# ============================================================================
# 13. APPROVAL HISTORY
# ============================================================================
add_section(doc, "13. Approval History")

add_paragraph(doc, """Every workflow maintains a complete history of all approval actions, providing transparency and audit trail.""")

add_section(doc, "13.1 Viewing Approval History", level=2)
add_step_by_step(doc, [
    "Open the workflow detail page",
    "Scroll to the 'Approval History' section",
    "View the chronological list of all actions"
])

add_section(doc, "13.2 History Information", level=2)

add_table(doc,
    ["Field", "Description"],
    [
        ["Date/Time", "When the action occurred"],
        ["Action", "SUBMITTED, APPROVED, REJECTED, ESCALATED, ON_HOLD, etc."],
        ["Actor", "Who performed the action"],
        ["Level", "Approval level (1, 2, 3, etc.)"],
        ["Comments", "Any comments provided"],
        ["Source", "SYSTEM (web) or EMAIL (email link)"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Approval History Timeline")

add_section(doc, "13.3 Action Types in History", level=2)

add_table(doc,
    ["Action", "Description"],
    [
        ["SUBMITTED", "Workflow was submitted by initiator"],
        ["APPROVED", "Approved by an approver"],
        ["REJECTED", "Rejected by an approver"],
        ["ESCALATED", "Escalated to higher authority (manual or auto)"],
        ["ON_HOLD", "Placed on hold by approver"],
        ["RECALLED", "Recalled by initiator"],
        ["CANCELLED", "Cancelled by initiator or system"],
        ["REASSIGNED", "Reassigned to different approver"],
        ["RETURNED", "Returned to previous level"]
    ],
    [2, 4.5]
)

# ============================================================================
# 14. BEST PRACTICES
# ============================================================================
add_section(doc, "14. Best Practices")

add_section(doc, "14.1 Timely Processing", level=2)
add_bullet_list(doc, [
    "Check your approval queue daily",
    "Process items in order of urgency and age",
    "Don't let items sit too long (may escalate automatically)",
    "Enable email notifications to stay informed",
    "Use email approval links for quick actions"
])

add_section(doc, "14.2 Thorough Review", level=2)
add_bullet_list(doc, [
    "Read all form fields carefully",
    "Review all attachments before deciding",
    "Verify amounts and calculations",
    "Check for policy compliance",
    "Ensure proper authorization chain",
    "For financial workflows, verify amount is within your authority"
])

add_section(doc, "14.3 Clear Communication", level=2)
add_bullet_list(doc, [
    "Always add meaningful comments",
    "Be specific about rejection reasons",
    "Provide guidance for resubmission",
    "Document any special considerations"
])

add_section(doc, "14.4 Security Awareness", level=2)
add_bullet_list(doc, [
    "Log out when leaving your workstation",
    "Don't share or forward email approval links",
    "Report suspicious workflows to administrators",
    "Verify initiator identity for unusual requests"
])

add_section(doc, "14.5 Troubleshooting", level=2)

add_table(doc,
    ["Issue", "Solution"],
    [
        ["Can't see expected approval", "Check filters, verify you're assigned as approver"],
        ["Approve button disabled", "Check if already approved, escalated, or on hold"],
        ["Email link expired", "Log in to system and approve directly"],
        ["Amount exceeds my limit", "Escalate to higher authority or contact admin"],
        ["Comment box too short", "Use clear, concise language; contact admin if limit too restrictive"],
        ["Workflow auto-escalated", "Normal for amounts exceeding your limit"]
    ],
    [2.5, 4]
)

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/05_Approvals_Module_Manual.docx")
print("Approvals Module Manual created successfully!")
