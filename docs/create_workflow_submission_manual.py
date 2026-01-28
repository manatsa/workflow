"""
Generate Workflow Submission Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Workflow Submission Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Workflows",
    "Starting a New Submission",
    "Filling Out the Form",
    "Working with Different Field Types",
    "File Attachments",
    "Multi-Step Forms and Summary",
    "Saving as Draft",
    "Submitting for Approval",
    "Editing Submissions",
    "Recalling Submissions",
    "Common Issues and Solutions"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Workflow Submission module enables users to initiate business processes by filling out and submitting workflow forms. Submissions are routed through predefined approval chains for review and action.""")

add_paragraph(doc, "What You Can Do:", bold=True)
add_bullet_list(doc, [
    "Browse available workflows",
    "Fill out and submit workflow forms",
    "Attach supporting documents",
    "Save incomplete submissions as drafts",
    "Edit draft submissions",
    "Recall submitted workflows for changes"
])

add_image_placeholder(doc, "Workflow Submission Overview")

# ============================================================================
# 2. ACCESSING WORKFLOWS
# ============================================================================
add_section(doc, "2. Accessing Workflows")

add_section(doc, "2.1 From the Dashboard", level=2)
add_step_by_step(doc, [
    "Log in to the Sonar Workflow System",
    "From the Dashboard, locate the 'Available Workflows' section",
    "Click on any workflow card to start a new submission",
    "Or click 'View All' to see the complete list"
])

add_section(doc, "2.2 From the Workflows Menu", level=2)
add_step_by_step(doc, [
    "Click 'Workflows' in the navigation sidebar",
    "The Workflows list page displays all available workflows",
    "Use the search box to find specific workflows",
    "Filter by category if needed (Financial/Non-Financial)",
    "Click on a workflow to start a new submission"
])

add_image_placeholder(doc, "Workflows List Page")

add_section(doc, "2.3 Workflow Visibility", level=2)
add_paragraph(doc, """You only see workflows that:""")
add_bullet_list(doc, [
    "Are published (active)",
    "You have permission to access based on your organization",
    "Match your role or department restrictions"
])

add_note(doc, "If you don't see an expected workflow, contact your administrator to verify access permissions.", "NOTE")

# ============================================================================
# 3. STARTING A NEW SUBMISSION
# ============================================================================
add_section(doc, "3. Starting a New Submission")

add_section(doc, "3.1 Initiating a Workflow", level=2)
add_step_by_step(doc, [
    "Navigate to the Workflows list",
    "Click on the workflow you want to submit",
    "The workflow form opens in a new page",
    "Review the workflow description and instructions",
    "Begin filling out the required fields"
])

add_section(doc, "3.2 Understanding the Form Layout", level=2)

add_table(doc,
    ["Section", "Description"],
    [
        ["Header", "Shows workflow name and reference number (assigned on submit)"],
        ["Instructions", "Important notes or guidance from administrators"],
        ["Form Fields", "Input fields to fill out organized in groups"],
        ["Attachments", "Section to upload supporting documents"],
        ["Action Buttons", "Save Draft, Submit, Cancel buttons"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "New Submission Form Layout")

# ============================================================================
# 4. FILLING OUT THE FORM
# ============================================================================
add_section(doc, "4. Filling Out the Form")

add_section(doc, "4.1 Required vs Optional Fields", level=2)
add_paragraph(doc, """Fields marked with a red asterisk (*) are required and must be completed before submission.""")

add_table(doc,
    ["Indicator", "Meaning"],
    [
        ["Red asterisk (*)", "Required field - must be filled"],
        ["No asterisk", "Optional field - can be left empty"],
        ["Grayed out", "Read-only field - cannot be edited"],
        ["Red border", "Field has validation error"]
    ],
    [2, 4.5]
)

add_section(doc, "4.2 Form Validation", level=2)
add_paragraph(doc, """The system validates your input as you type:""")
add_bullet_list(doc, [
    "Required fields must have a value",
    "Email fields must be valid email format",
    "Number fields must be within allowed range",
    "Date fields must be valid dates",
    "Text fields must meet length requirements"
])

add_paragraph(doc, "Validation Error Display:", bold=True)
add_bullet_list(doc, [
    "Invalid fields show a red border",
    "Error message appears below the field",
    "Fields with errors must be corrected before submission",
    "All errors are summarized at the top when you try to submit"
])

add_image_placeholder(doc, "Form Validation Error Example")

add_section(doc, "4.3 Field Help Text", level=2)
add_paragraph(doc, """Many fields include help text that appears below the field label. This provides guidance on what information to enter.""")

add_example(doc, "Help Text Example",
"""Field: Purchase Amount
Help Text: "Enter the total amount in your local currency. Include taxes if applicable."

Field: Justification
Help Text: "Explain why this purchase is needed. Minimum 50 characters."
""")

# ============================================================================
# 5. WORKING WITH DIFFERENT FIELD TYPES
# ============================================================================
add_section(doc, "5. Working with Different Field Types")

add_section(doc, "5.1 Text Fields", level=2)
add_table(doc,
    ["Field Type", "How to Use"],
    [
        ["Single-line Text", "Type directly into the field"],
        ["Multi-line Text", "Type or paste text, use Enter for new lines"],
        ["Email", "Enter valid email format (user@domain.com)"],
        ["Phone", "Enter phone number (format may be validated)"],
        ["URL", "Enter full URL including https://"]
    ],
    [2, 4.5]
)

add_section(doc, "5.2 Number and Currency Fields", level=2)
add_paragraph(doc, "For numeric fields:")
add_bullet_list(doc, [
    "Enter numbers only (no letters)",
    "Decimals are allowed where configured",
    "Currency fields may show a currency symbol",
    "Negative numbers may or may not be allowed",
    "Min/max limits are enforced"
])

add_example(doc, "Currency Field Input",
"""Field: Total Amount
Input: 1500.00
Display: $1,500.00

The system formats the number as currency
""")

add_section(doc, "5.3 Date and DateTime Fields", level=2)
add_step_by_step(doc, [
    "Click on the date field to open the date picker",
    "Navigate to the desired month using arrows",
    "Click on the day to select it",
    "For DateTime fields, also select the time",
    "The selected date appears in the field"
], title="Using the Date Picker:")

add_image_placeholder(doc, "Date Picker Calendar")

add_section(doc, "5.4 Dropdown and Selection Fields", level=2)

add_table(doc,
    ["Field Type", "How to Use"],
    [
        ["Dropdown (Select)", "Click field, choose one option from list"],
        ["Multi-Select", "Click field, check multiple options, click outside to close"],
        ["Radio Buttons", "Click one option (only one can be selected)"],
        ["Checkboxes", "Check/uncheck multiple options as needed"]
    ],
    [2, 4.5]
)

add_paragraph(doc, "Using Dropdown Fields:", bold=True)
add_step_by_step(doc, [
    "Click on the dropdown field",
    "A list of options appears",
    "Type to filter/search options (if search enabled)",
    "Click on your selection",
    "The dropdown closes and shows your selection"
])

add_section(doc, "5.5 User Selection Fields", level=2)
add_paragraph(doc, """Some fields require you to select a user from the system:""")
add_step_by_step(doc, [
    "Click on the user field",
    "A searchable user list appears",
    "Type to search by name or username",
    "Click on the user to select",
    "The selected user's name appears in the field"
])

add_section(doc, "5.6 Accordion and Collapsible Sections", level=2)
add_paragraph(doc, """Some forms organize fields into expandable/collapsible sections to make long forms easier to navigate. These sections help group related information together.""")

add_paragraph(doc, "Accordion Sections:", bold=True)
add_bullet_list(doc, [
    "An Accordion contains multiple collapsible sections",
    "Click on a section header to expand it",
    "Only one section within an Accordion can be expanded at a time",
    "Expanding a new section automatically closes the previously open one"
])

add_paragraph(doc, "Standalone Collapsible Sections:", bold=True)
add_bullet_list(doc, [
    "A standalone Collapsible can be expanded independently",
    "Multiple standalone Collapsibles can be open simultaneously",
    "Click the section header to expand or collapse"
])

add_step_by_step(doc, [
    "Locate the collapsible section header (shows arrow indicator)",
    "Click on the header to expand the section",
    "Fill out the fields within the expanded section",
    "Click the header again to collapse (optional)",
    "Move to the next section or proceed with form submission"
], title="Working with Collapsible Sections:")

add_image_placeholder(doc, "Accordion with Expanded Section")

# ============================================================================
# 6. FILE ATTACHMENTS
# ============================================================================
add_section(doc, "6. File Attachments")

add_section(doc, "6.1 Attaching Files", level=2)
add_step_by_step(doc, [
    "Locate the attachment field or section",
    "Click 'Choose File' or drag and drop files",
    "Select file(s) from your computer",
    "Wait for upload to complete",
    "Attached file appears in the list"
])

add_section(doc, "6.2 Attachment Restrictions", level=2)
add_paragraph(doc, """Attachments may have restrictions configured by administrators:""")

add_table(doc,
    ["Restriction", "Typical Values"],
    [
        ["Allowed File Types", "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG"],
        ["Maximum File Size", "5MB, 10MB, 25MB per file"],
        ["Maximum Number of Files", "1, 5, 10 files"]
    ],
    [2.5, 4]
)

add_section(doc, "6.3 Managing Attachments", level=2)
add_bullet_list(doc, [
    "View: Click on filename to preview/download",
    "Remove: Click the delete (X) icon to remove",
    "Replace: Remove existing and upload new file"
])

add_note(doc, "Ensure you attach all required supporting documents before submission. Missing documents may cause rejection.", "TIP")

add_image_placeholder(doc, "File Attachment Section")

# ============================================================================
# 7. MULTI-STEP FORMS
# ============================================================================
add_section(doc, "7. Multi-Step Forms")

add_paragraph(doc, """Some workflows have multiple screens (steps) to organize complex forms. You must complete each screen before proceeding to the next.""")

add_section(doc, "7.1 Navigating Multi-Step Forms", level=2)

add_table(doc,
    ["Action", "How To", "Notes"],
    [
        ["Go to Next Step", "Click 'Next' button", "Current screen must be valid"],
        ["Go to Previous Step", "Click 'Previous' button", "Data is preserved"],
        ["Jump to Step", "Click step indicator (if enabled)", "Only completed steps"],
        ["Submit", "Click 'Submit' on final step", "All steps must be valid"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "7.2 Step Indicator", level=2)
add_paragraph(doc, """The step indicator at the top shows:""")
add_bullet_list(doc, [
    "Current step highlighted",
    "Completed steps marked with checkmark",
    "Remaining steps shown",
    "Total number of steps (e.g., Step 2 of 4)"
])

add_image_placeholder(doc, "Multi-Step Form with Step Indicator")

add_section(doc, "7.3 Summary Screens", level=2)
add_paragraph(doc, """Some workflows include a Summary screen as the final step. This screen displays all the information you've entered across all previous steps in read-only format, allowing you to review before final submission.""")

add_paragraph(doc, "On a Summary Screen:", bold=True)
add_bullet_list(doc, [
    "All fields are displayed in read-only mode",
    "Data is organized by the screens/sections it was entered in",
    "You can navigate back to previous steps to make corrections",
    "Click 'Submit' only when satisfied with all information"
])

add_image_placeholder(doc, "Summary Screen Review")

add_section(doc, "7.4 Validation Between Steps", level=2)
add_paragraph(doc, """When clicking 'Next':""")
add_numbered_list(doc, [
    "System validates all fields on current step",
    "If valid, you proceed to next step",
    "If errors exist, you stay on current step",
    "Error messages highlight which fields need attention"
])

# ============================================================================
# 8. SAVING AS DRAFT
# ============================================================================
add_section(doc, "8. Saving as Draft")

add_paragraph(doc, """If you cannot complete a submission in one session, save it as a draft to continue later.""")

add_section(doc, "8.1 How to Save Draft", level=2)
add_step_by_step(doc, [
    "Fill out as much of the form as you can",
    "Click the 'Save Draft' button",
    "A confirmation message appears",
    "The draft is saved and you can navigate away safely"
])

add_section(doc, "8.2 Finding Your Drafts", level=2)
add_step_by_step(doc, [
    "Navigate to 'My Submissions' in the sidebar",
    "Filter by Status: 'Draft'",
    "Or look in the Dashboard 'Drafts' section",
    "Click on a draft to continue editing"
])

add_section(doc, "8.3 Draft Behavior", level=2)
add_bullet_list(doc, [
    "Drafts are not sent for approval",
    "Drafts have no reference number yet",
    "You can edit drafts unlimited times",
    "Drafts are visible only to you (the creator)",
    "Drafts do not expire automatically"
])

add_note(doc, "Remember to submit your drafts when complete. Approvers cannot see or act on drafts.", "WARNING")

# ============================================================================
# 9. SUBMITTING FOR APPROVAL
# ============================================================================
add_section(doc, "9. Submitting for Approval")

add_section(doc, "9.1 Pre-Submission Checklist", level=2)
add_paragraph(doc, "Before submitting, verify:", bold=True)
add_bullet_list(doc, [
    "All required fields are completed",
    "Information entered is accurate",
    "All necessary attachments are uploaded",
    "You've reviewed the form for errors"
])

add_section(doc, "9.2 Submission Process", level=2)
add_step_by_step(doc, [
    "Review all entered information",
    "Click the 'Submit' button",
    "A confirmation dialog appears",
    "Click 'Confirm' to submit",
    "Success message shows with reference number",
    "Workflow is now pending approval"
])

add_section(doc, "9.3 What Happens After Submission", level=2)

add_table(doc,
    ["Event", "Description"],
    [
        ["Reference Number Assigned", "Unique tracking number (e.g., WF-2024-00123)"],
        ["Status Changes to Pending", "Workflow enters approval queue"],
        ["First Approver Notified", "Email sent to Level 1 approver"],
        ["Visible in My Submissions", "You can track status in My Submissions"],
        ["Audit Log Created", "Submission recorded for audit trail"]
    ],
    [2.5, 4]
)

add_image_placeholder(doc, "Submission Success Message")

add_section(doc, "9.4 Tracking Your Submission", level=2)
add_paragraph(doc, """After submitting:""")
add_step_by_step(doc, [
    "Go to 'My Submissions' in the sidebar",
    "Find your submission in the list",
    "Click to view details and current status",
    "Check 'Approval History' to see progress"
])

# ============================================================================
# 10. EDITING SUBMISSIONS
# ============================================================================
add_section(doc, "10. Editing Submissions")

add_section(doc, "10.1 When Can You Edit?", level=2)

add_table(doc,
    ["Status", "Can Edit?", "Notes"],
    [
        ["Draft", "Yes", "Full editing allowed"],
        ["Pending", "No", "Must recall first"],
        ["Approved", "No", "Submit new workflow"],
        ["Rejected", "No", "Submit new workflow"],
        ["Recalled", "Yes", "After recall, can edit and resubmit"]
    ],
    [1.5, 1, 4]
)

add_section(doc, "10.2 Editing a Draft", level=2)
add_step_by_step(doc, [
    "Navigate to My Submissions",
    "Filter by Status: Draft",
    "Click on the draft submission",
    "Make your changes",
    "Save Draft again or Submit when ready"
])

# ============================================================================
# 11. RECALLING SUBMISSIONS
# ============================================================================
add_section(doc, "11. Recalling Submissions")

add_paragraph(doc, """If you need to make changes to a submitted workflow, you can recall it (if enabled and not yet fully approved).""")

add_section(doc, "11.1 Recall Conditions", level=2)
add_paragraph(doc, "You can recall a submission when:", bold=True)
add_bullet_list(doc, [
    "Status is Pending (not yet fully approved)",
    "Recall is enabled for the workflow",
    "You are the original initiator"
])

add_section(doc, "11.2 How to Recall", level=2)
add_step_by_step(doc, [
    "Navigate to My Submissions",
    "Find the pending submission",
    "Click to open the details",
    "Click the 'Recall' button",
    "Enter a reason for recalling",
    "Confirm the recall action",
    "Status changes to 'Recalled'"
])

add_section(doc, "11.3 After Recall", level=2)
add_bullet_list(doc, [
    "Submission is removed from approver queues",
    "You can now edit the submission",
    "Make necessary changes",
    "Resubmit when ready",
    "Approval process starts over from Level 1"
])

add_note(doc, "Use recall sparingly. Frequent recalls may indicate need for better preparation before initial submission.", "TIP")

add_image_placeholder(doc, "Recall Button on Submission Detail")

# ============================================================================
# 12. COMMON ISSUES AND SOLUTIONS
# ============================================================================
add_section(doc, "12. Common Issues and Solutions")

add_table(doc,
    ["Issue", "Cause", "Solution"],
    [
        ["Can't find workflow", "Access restricted or unpublished", "Contact administrator"],
        ["Submit button disabled", "Required fields empty or invalid", "Complete all required fields"],
        ["File upload fails", "File too large or wrong type", "Check file restrictions"],
        ["Validation error", "Input doesn't match requirements", "Read error message, correct input"],
        ["Draft not saving", "Network issue or session timeout", "Check connection, log in again"],
        ["Can't recall", "Already approved or recall disabled", "Contact approver or admin"],
        ["Date picker not working", "Browser compatibility", "Use supported browser"]
    ],
    [2, 2, 2.5]
)

add_section(doc, "12.1 Getting Help", level=2)
add_paragraph(doc, "If you encounter persistent issues:")
add_numbered_list(doc, [
    "Note the workflow name and reference number (if any)",
    "Take a screenshot of any error messages",
    "Contact your system administrator with details",
    "Provide steps to reproduce the issue"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/04_Workflow_Submission_Manual.docx")
print("Workflow Submission Manual created successfully!")
