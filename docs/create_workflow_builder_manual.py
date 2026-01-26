"""
Generate Workflow Builder Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Workflow Builder Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Workflow Builder",
    "Creating a New Workflow",
    "Workflow Basic Information",
    "Form Builder",
    "Field Types Reference",
    "SQL Object Fields",
    "Validation Functions",
    "Field Groups",
    "Multi-Step Screens",
    "Approver Configuration",
    "Access Restrictions",
    "Publishing Workflows",
    "Editing Existing Workflows",
    "Workflow Preview",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Workflow Builder is a powerful visual tool for creating and managing workflow templates. It allows administrators to design custom forms with various field types, configure multi-level approval chains, and set access restrictions - all without programming knowledge.""")

add_paragraph(doc, "Key Capabilities:", bold=True)
add_bullet_list(doc, [
    "Visual drag-and-drop form design",
    "30+ field types including text, numbers, dates, files, ratings, signatures, and more",
    "SQL Object fields for dynamic dropdown data from database tables",
    "Field grouping with collapsible sections",
    "Multi-form and multi-screen workflow support",
    "Validation functions for conditional field behavior",
    "Configurable approval hierarchies with amount-based routing",
    "Organization-based access restrictions",
    "Workflow versioning and publishing control",
    "Dark mode support for comfortable viewing"
])

add_note(doc, "Only users with Admin privileges can access the Workflow Builder.", "NOTE")

add_image_placeholder(doc, "Workflow Builder Interface Overview")

# ============================================================================
# 2. ACCESSING WORKFLOW BUILDER
# ============================================================================
add_section(doc, "2. Accessing Workflow Builder")

add_section(doc, "2.1 From Dashboard", level=2)
add_step_by_step(doc, [
    "Log in to the system with admin credentials",
    "From the Dashboard, click 'Workflows' in the navigation sidebar",
    "Click the '+ New Workflow' button",
    "The Workflow Builder opens in creation mode"
])

add_section(doc, "2.2 From Workflow List", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Workflows",
    "Click 'New Workflow' to create a new workflow",
    "Or click the 'Edit' button on an existing workflow to modify it"
])

add_image_placeholder(doc, "Workflow List with New Workflow Button")

# ============================================================================
# 3. CREATING A NEW WORKFLOW
# ============================================================================
add_section(doc, "3. Creating a New Workflow")

add_paragraph(doc, """Creating a workflow involves several steps: defining basic information, designing the form, configuring approvers, and setting access restrictions.""")

add_section(doc, "3.1 Workflow Creation Steps Overview", level=2)

add_table(doc,
    ["Step", "Section", "Purpose"],
    [
        ["1", "Basic Information", "Name, code, description, category"],
        ["2", "Form Builder", "Design forms, add fields and groups"],
        ["3", "Approvers", "Configure approval hierarchy"],
        ["4", "Access Restrictions", "Limit who can use the workflow"],
        ["5", "Preview & Save", "Test and save the workflow"]
    ],
    [0.5, 2, 4]
)

add_image_placeholder(doc, "Workflow Builder Tabs/Steps")

# ============================================================================
# 4. WORKFLOW BASIC INFORMATION
# ============================================================================
add_section(doc, "4. Workflow Basic Information")

add_section(doc, "4.1 Basic Information Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description", "Example"],
    [
        ["Workflow Name", "Yes", "Display name for the workflow", "Purchase Request"],
        ["Workflow Code", "Auto", "Unique identifier (auto-generated from name)", "PURCHASE_REQUEST"],
        ["Description", "No", "Detailed explanation of the workflow purpose", "Submit requests for office supplies..."],
        ["Category", "Yes", "Classification (Financial/Non-Financial)", "Financial"],
        ["Icon", "No", "Visual icon for the workflow", "shopping_cart"],
        ["Require Comment", "No", "Force comments on approval/rejection", "Yes/No"]
    ],
    [1.8, 0.8, 2.5, 1.5]
)

add_section(doc, "4.2 Workflow Categories", level=2)

add_table(doc,
    ["Category", "Description", "Typical Use"],
    [
        ["Financial", "Workflows involving monetary transactions", "Purchase orders, expense claims, budget requests"],
        ["Non-Financial", "Workflows not involving money", "Leave requests, document approvals, change requests"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "4.3 Entering Basic Information", level=2)
add_step_by_step(doc, [
    "Enter a descriptive Workflow Name",
    "The Workflow Code is auto-generated (can be modified)",
    "Select the appropriate Category",
    "Add a Description explaining the workflow's purpose",
    "Optionally select an icon from the icon picker",
    "Enable 'Require Comment' if approvers must provide reasons",
    "Click 'Next' or switch to the Form Builder tab"
])

add_image_placeholder(doc, "Basic Information Form")

# ============================================================================
# 5. FORM BUILDER
# ============================================================================
add_section(doc, "5. Form Builder")

add_paragraph(doc, """The Form Builder is where you design the data entry form that users will complete when submitting the workflow. You can add fields, organize them into groups, and configure validation rules.""")

add_section(doc, "5.1 Form Builder Interface", level=2)

add_table(doc,
    ["Area", "Location", "Function"],
    [
        ["Field Palette", "Left sidebar", "Drag fields from here to the form"],
        ["Form Canvas", "Center", "Drop fields here to build your form"],
        ["Field Properties", "Right panel", "Configure selected field settings"],
        ["Form Tabs", "Top of canvas", "Switch between multiple forms (if any)"]
    ],
    [2, 1.5, 3]
)

add_image_placeholder(doc, "Form Builder Interface Layout")

add_section(doc, "5.2 Adding Fields to Form", level=2)
add_step_by_step(doc, [
    "Locate the desired field type in the Field Palette",
    "Drag the field onto the Form Canvas",
    "Drop it at the desired position",
    "The Field Properties panel opens automatically",
    "Configure the field settings (name, label, validation)",
    "Click 'Save Field' or click elsewhere to save"
])

add_section(doc, "5.3 Arranging Fields", level=2)
add_bullet_list(doc, [
    "Drag fields vertically to reorder them",
    "Use the up/down arrows on field cards to move them",
    "Set column span (1-4) to control field width",
    "Group related fields using Field Groups"
])

add_section(doc, "5.4 Removing Fields", level=2)
add_step_by_step(doc, [
    "Hover over the field you want to remove",
    "Click the delete (trash) icon",
    "Confirm the deletion in the dialog",
    "The field is removed from the form"
])

add_note(doc, "Removing a field from a published workflow may affect existing submissions. Consider unpublishing first.", "WARNING")

# ============================================================================
# 6. FIELD TYPES REFERENCE
# ============================================================================
add_section(doc, "6. Field Types Reference")

add_paragraph(doc, """The Workflow Builder provides a comprehensive set of field types to capture different kinds of data.""")

add_section(doc, "6.1 Text Input Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["Text", "Single-line text input", "Names, titles, short answers"],
        ["Textarea", "Multi-line text input", "Descriptions, comments, long text"],
        ["Email", "Email address with validation", "Contact email addresses"],
        ["Phone", "Phone number field", "Contact phone numbers"],
        ["URL", "Web address with validation", "Website links"],
        ["Password", "Masked text input", "Sensitive information"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "6.2 Numeric Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["Number", "Numeric input (integers/decimals)", "Quantities, counts"],
        ["Currency", "Money amount with currency symbol", "Prices, costs, amounts"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "6.3 Date/Time Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["Date", "Date picker (calendar)", "Due dates, birth dates"],
        ["DateTime", "Date and time picker", "Meeting times, deadlines"],
        ["Time", "Time-only picker", "Appointment times, schedules"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "6.4 Selection Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["Select", "Dropdown single selection", "Categories, types, status"],
        ["Multi-Select", "Dropdown multiple selection", "Tags, skills, features"],
        ["Radio", "Radio button single selection", "Priority levels, options"],
        ["Checkbox", "Checkbox for boolean/multiple", "Agreement, feature toggles"],
        ["Checkbox Group", "Multiple checkboxes as a group", "Select multiple items"],
        ["Toggle", "On/Off switch control", "Enable/disable features"],
        ["Yes/No", "Yes/No button selection", "Simple binary questions"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "6.5 Special Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["File", "File upload attachment", "Documents, receipts"],
        ["Image", "Image upload with preview", "Photos, screenshots"],
        ["User", "User picker from system users", "Assign to, requested by"],
        ["SQL Object", "Dynamic options from database", "Product lists, categories"],
        ["Label", "Display-only text label", "Instructions, headings"],
        ["Divider", "Visual horizontal separator", "Section breaks"],
        ["Hidden", "Hidden field (not visible)", "System values, tracking data"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "6.6 Advanced Input Fields", level=2)

add_table(doc,
    ["Field Type", "Description", "Use Case"],
    [
        ["Rating", "Star rating (1-5 or configurable)", "Satisfaction ratings, scores"],
        ["Slider", "Numeric slider with min/max", "Quantity, percentage selection"],
        ["Color Picker", "Color selection control", "Theme colors, preferences"],
        ["Signature", "Digital signature capture", "Approval signatures, consent"],
        ["Rich Text", "WYSIWYG formatted text editor", "Detailed descriptions, notes"],
        ["Icon", "Icon picker from Material Icons", "Visual indicators"],
        ["Barcode/QR", "Barcode or QR code scanner", "Product tracking, asset IDs"],
        ["Location", "Location/map picker", "Addresses, GPS coordinates"],
        ["Table/Grid", "Data table input", "Line items, tabular data"]
    ],
    [1.5, 2.5, 2.5]
)

add_note(doc, "Some advanced field types (Barcode, Location, Signature) may require additional device capabilities.", "NOTE")

add_section(doc, "6.7 Common Field Properties", level=2)

add_table(doc,
    ["Property", "Applies To", "Description"],
    [
        ["Field Name", "All", "Internal identifier (unique, no spaces)"],
        ["Label", "All", "Display label shown to users"],
        ["Required", "All", "Make field mandatory"],
        ["Placeholder", "Text fields", "Hint text shown when empty"],
        ["Default Value", "All", "Pre-filled value"],
        ["Help Text", "All", "Additional guidance for users"],
        ["Readonly", "All", "Display only, not editable"],
        ["Hidden", "All", "Field exists but not visible"],
        ["Column Span", "All", "Width (1-4 columns)"],
        ["Min/Max Length", "Text fields", "Character limits"],
        ["Min/Max Value", "Numeric fields", "Value range limits"],
        ["Pattern", "Text fields", "Regex validation pattern"],
        ["Options", "Select fields", "Available choices"]
    ],
    [1.8, 1.5, 3.2]
)

add_image_placeholder(doc, "Field Properties Panel")

# ============================================================================
# 7. SQL OBJECT FIELDS
# ============================================================================
add_section(doc, "7. SQL Object Fields")

add_paragraph(doc, """SQL Object fields allow you to create dynamic dropdowns that pull options from database tables defined in the SQL Objects management section. This is useful for data that changes frequently or is managed externally.""")

add_section(doc, "7.1 What are SQL Objects?", level=2)
add_paragraph(doc, """SQL Objects are database table definitions that can be used as data sources for dropdown fields. They are managed in the Workflow Admin > SQL Objects section.""")

add_section(doc, "7.2 Creating an SQL Object Field", level=2)
add_step_by_step(doc, [
    "Drag 'SQL Object' field type onto the form canvas",
    "Configure the field name and label",
    "In the 'SQL Object' dropdown, select the data source",
    "Choose the 'View Type' (Dropdown, Multi-Select, Radio, or Checkbox Group)",
    "Set other properties as needed (required, readonly, etc.)",
    "Save the field"
])

add_section(doc, "7.3 SQL Object Field Properties", level=2)

add_table(doc,
    ["Property", "Description"],
    [
        ["SQL Object", "The data source table to pull options from"],
        ["View Type", "How to display options: Dropdown, Multi-Select, Radio, or Checkbox Group"],
        ["Display Field", "Which column to show as the option label (auto-detected)"],
        ["Value Field", "Which column to store as the selected value (auto-detected)"]
    ],
    [2, 4.5]
)

add_note(doc, "SQL Objects must be created in Workflow Admin > SQL Objects before they can be used in fields.", "NOTE")

add_image_placeholder(doc, "SQL Object Field Configuration")

# ============================================================================
# 8. VALIDATION FUNCTIONS
# ============================================================================
add_section(doc, "8. Validation Functions")

add_paragraph(doc, """Validation Functions provide powerful conditional logic for field behavior. They allow you to control when fields are valid, visible, required, or readonly based on other field values or conditions.""")

add_section(doc, "8.1 Available Validation Functions", level=2)

add_table(doc,
    ["Function", "Description", "Example"],
    [
        ["ValidWhen(condition, message?)", "Field is valid when condition is true", "ValidWhen(@{amount} > 0, 'Amount must be positive')"],
        ["InvalidWhen(condition, message?)", "Field is invalid when condition is true", "InvalidWhen(@{status} == 'CLOSED', 'Cannot modify closed items')"],
        ["CheckValid(condition, message?)", "Validate field value against condition", "CheckValid(LENGTH(@{code}) == 6, 'Code must be 6 characters')"],
        ["VisibleWhen(condition)", "Show field only when condition is true", "VisibleWhen(@{showDetails} == true)"],
        ["MandatoryWhen(condition, message?)", "Field is required when condition is true", "MandatoryWhen(@{type} == 'EXTERNAL', 'Required for external')"],
        ["ReadOnlyWhen(condition)", "Field is readonly when condition is true", "ReadOnlyWhen(@{status} != 'DRAFT')"],
        ["HiddenWhen(condition)", "Hide field when condition is true", "HiddenWhen(@{userType} == 'GUEST')"],
        ["RegexWhen(condition, pattern, message?)", "Validate with regex when condition is true", "RegexWhen(@{country} == 'US', '^\\\\d{5}$', 'Invalid ZIP')"]
    ],
    [2.5, 2, 2]
)

add_section(doc, "8.2 Using Field References", level=2)
add_paragraph(doc, """In validation expressions, use @{fieldName} syntax to reference other field values:""")

add_example(doc, "Field Reference Examples",
'''@{amount} - References the value of field named "amount"
@{status} - References the value of field named "status"
@{department} - References the value of field named "department"

Expressions:
@{amount} > 1000 - True when amount exceeds 1000
@{status} == 'APPROVED' - True when status equals APPROVED
@{category} != '' - True when category is not empty''')

add_section(doc, "8.3 Adding Validation to a Field", level=2)
add_step_by_step(doc, [
    "Select a field in the form builder",
    "Expand the 'Validation & Transformation' section",
    "Enter validation expression in the 'Validation Expression' field",
    "Optionally add a custom error message",
    "Save the field"
])

add_note(doc, "Validation functions are evaluated in real-time as users fill out the form.", "NOTE")

add_image_placeholder(doc, "Validation Expression Configuration")

# ============================================================================
# 9. FIELD GROUPS
# ============================================================================
add_section(doc, "9. Field Groups")

add_paragraph(doc, """Field Groups allow you to organize related fields into collapsible sections, improving form usability and visual organization.""")

add_section(doc, "9.1 Creating a Field Group", level=2)
add_step_by_step(doc, [
    "Click 'Add Field Group' button in the Form Builder",
    "Enter a Group Name (e.g., 'Personal Information')",
    "Optionally add a Group Description",
    "Set the number of columns (1-4)",
    "Enable 'Collapsible' if users can expand/collapse",
    "Set 'Expanded by Default' preference",
    "Click 'Create Group'"
])

add_section(doc, "9.2 Adding Fields to a Group", level=2)
add_bullet_list(doc, [
    "Drag fields directly into the group container",
    "Or select the group when creating a new field",
    "Fields within a group are visually contained together",
    "Reorder fields within the group by dragging"
])

add_section(doc, "9.3 Field Group Properties", level=2)

add_table(doc,
    ["Property", "Description"],
    [
        ["Group Name", "Title displayed above the group"],
        ["Description", "Explanatory text below the title"],
        ["Columns", "Number of columns for field layout (1-4)"],
        ["Collapsible", "Allow users to expand/collapse the group"],
        ["Expanded", "Whether group is expanded by default"],
        ["CSS Class", "Custom styling class (advanced)"]
    ],
    [2, 4.5]
)

add_image_placeholder(doc, "Field Group with Multiple Fields")

add_example(doc, "Field Group Usage",
"""Group Name: "Requester Information"
Fields:
  - Full Name (Text, Column 1-2)
  - Email (Email, Column 3-4)
  - Department (Select, Column 1-2)
  - Phone (Phone, Column 3-4)
Collapsible: Yes
Expanded by Default: Yes""")

# ============================================================================
# 10. MULTI-STEP SCREENS
# ============================================================================
add_section(doc, "10. Multi-Step Screens")

add_paragraph(doc, """For complex workflows with many fields, you can organize the form into multiple screens (steps). Users navigate through each screen sequentially.""")

add_section(doc, "10.1 Creating Multiple Screens", level=2)
add_step_by_step(doc, [
    "In the Form Builder, click 'Add Screen' button",
    "Enter a Screen Title (e.g., 'Step 1: Basic Information')",
    "The new screen tab appears at the top",
    "Click on a screen tab to switch to it",
    "Add fields to each screen as needed"
])

add_section(doc, "10.2 Screen Properties", level=2)

add_table(doc,
    ["Property", "Description"],
    [
        ["Screen Title", "Name displayed in the step indicator"],
        ["Screen Order", "Sequence in which screens appear"],
        ["Description", "Instructions for the screen (optional)"]
    ],
    [2, 4.5]
)

add_section(doc, "10.3 User Experience", level=2)
add_paragraph(doc, "When users fill out a multi-screen workflow:")
add_bullet_list(doc, [
    "A step indicator shows current position (Step 1 of 3)",
    "Navigation buttons: Previous, Next, Submit (on last screen)",
    "Validation occurs before moving to next screen",
    "Users can navigate back to previous screens",
    "Data is preserved when navigating between screens"
])

add_image_placeholder(doc, "Multi-Step Form with Step Indicator")

# ============================================================================
# 11. APPROVER CONFIGURATION
# ============================================================================
add_section(doc, "11. Approver Configuration")

add_paragraph(doc, """The Approvers section defines who needs to approve workflow submissions and in what order. The system supports multi-level approval hierarchies with amount-based routing.""")

add_section(doc, "11.1 Approval Hierarchy Concept", level=2)
add_paragraph(doc, """Approvals proceed through levels sequentially:""")
add_bullet_list(doc, [
    "Level 1 approvers see the submission first",
    "After Level 1 approval, it moves to Level 2",
    "Process continues until all required levels approve",
    "Rejection at any level stops the workflow"
])

add_section(doc, "11.2 Adding an Approver", level=2)
add_step_by_step(doc, [
    "Navigate to the 'Approvers' tab in Workflow Builder",
    "Click 'Add Approver' button",
    "Select the Approver Level (1, 2, 3, etc.)",
    "Choose the Approver (user or role)",
    "Set the Amount Limit (optional, for financial workflows)",
    "Configure notification preferences",
    "Click 'Save Approver'"
])

add_section(doc, "11.3 Approver Properties", level=2)

add_table(doc,
    ["Property", "Description"],
    [
        ["Level", "Approval order (1=first, 2=second, etc.)"],
        ["Approver", "User or role who can approve at this level"],
        ["Amount Limit", "Maximum amount this approver can approve"],
        ["SBU", "Specific SBU this approver handles (optional)"],
        ["Send Email Notification", "Email approver when workflow arrives"],
        ["Send Email Approval Link", "Include approve/reject links in email"],
        ["Escalation Days", "Days before escalating to next level"]
    ],
    [2.5, 4]
)

add_section(doc, "11.4 Amount-Based Routing", level=2)
add_paragraph(doc, """For financial workflows, you can route approvals based on the amount:""")

add_example(doc, "Amount-Based Approval Setup",
"""Level 1: Department Manager - Up to $1,000
Level 2: Finance Manager - Up to $5,000
Level 3: Finance Director - Up to $25,000
Level 4: CFO - Up to $100,000
Level 5: CEO - Unlimited

If amount is $3,000:
- Level 1 approves (under their limit)
- Goes to Level 2 (amount exceeds Level 1 limit)
- Level 2 approves (within their limit)
- Workflow is fully approved""")

add_image_placeholder(doc, "Approver Configuration Panel")

add_section(doc, "11.5 SBU-Specific Approvers", level=2)
add_paragraph(doc, """Different SBUs can have different approvers at each level:""")
add_bullet_list(doc, [
    "Leave 'SBU' empty for default approver (all SBUs)",
    "Assign specific user for specific SBU",
    "SBU-specific approver takes precedence over default"
])

# ============================================================================
# 12. ACCESS RESTRICTIONS
# ============================================================================
add_section(doc, "12. Access Restrictions")

add_paragraph(doc, """Access Restrictions control who can see and submit the workflow. You can restrict access by organizational unit.""")

add_section(doc, "12.1 Restriction Types", level=2)

add_table(doc,
    ["Restriction By", "Description", "Example"],
    [
        ["Corporate", "Limit to specific corporates", "Only Holding Company users"],
        ["SBU", "Limit to specific SBUs", "Only Finance SBU users"],
        ["Branch", "Limit to specific branches", "Only Head Office branch"],
        ["Department", "Limit to specific departments", "Only IT Department"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "12.2 Setting Access Restrictions", level=2)
add_step_by_step(doc, [
    "Navigate to the 'Access' tab in Workflow Builder",
    "Check 'Restrict by Corporate' if needed, then select corporates",
    "Check 'Restrict by SBU' if needed, then select SBUs",
    "Check 'Restrict by Branch' if needed, then select branches",
    "Check 'Restrict by Department' if needed, then select departments",
    "Users must belong to at least one selected unit to access"
])

add_note(doc, "If no restrictions are set, the workflow is available to all users.", "NOTE")

add_image_placeholder(doc, "Access Restrictions Configuration")

# ============================================================================
# 13. PUBLISHING WORKFLOWS
# ============================================================================
add_section(doc, "13. Publishing Workflows")

add_section(doc, "13.1 Workflow States", level=2)

add_table(doc,
    ["State", "Description", "User Access"],
    [
        ["Draft", "Not yet published", "Visible only to admins"],
        ["Published", "Live and active", "Available to permitted users"],
        ["Unpublished", "Temporarily disabled", "Not accessible to users"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "13.2 Publishing a Workflow", level=2)
add_step_by_step(doc, [
    "Complete all workflow configuration",
    "Click 'Save' to save the workflow as draft",
    "Review all settings using the Preview function",
    "Click 'Publish' button",
    "Confirm the publish action",
    "Workflow is now live and available to users"
])

add_section(doc, "13.3 Unpublishing a Workflow", level=2)
add_paragraph(doc, "To temporarily disable a workflow:")
add_step_by_step(doc, [
    "Navigate to the workflow in the list",
    "Click the 'Unpublish' button",
    "Confirm the action",
    "Workflow becomes inaccessible to users",
    "Existing submissions continue to process"
])

add_note(doc, "Unpublishing does not delete the workflow or affect existing submissions.", "NOTE")

# ============================================================================
# 14. EDITING EXISTING WORKFLOWS
# ============================================================================
add_section(doc, "14. Editing Existing Workflows")

add_section(doc, "14.1 Opening a Workflow for Editing", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Workflows",
    "Find the workflow in the list",
    "Click the 'Edit' button (pencil icon)",
    "The Workflow Builder opens with the workflow loaded"
])

add_section(doc, "14.2 Editing Considerations", level=2)
add_paragraph(doc, "When editing published workflows, consider:", bold=True)
add_bullet_list(doc, [
    "Changes apply to new submissions only",
    "Existing submissions retain original field structure",
    "Adding required fields may affect user experience",
    "Removing fields doesn't delete data from existing submissions"
])

add_note(doc, "For major changes, consider creating a new workflow version instead of editing.", "TIP")

add_section(doc, "14.3 Workflow Versioning", level=2)
add_paragraph(doc, """The system tracks workflow versions automatically. When you edit and save a published workflow, the version number increments.""")

# ============================================================================
# 15. WORKFLOW PREVIEW
# ============================================================================
add_section(doc, "15. Workflow Preview")

add_paragraph(doc, """Before publishing, use the Preview function to see how the workflow will appear to users.""")

add_section(doc, "15.1 Using Preview", level=2)
add_step_by_step(doc, [
    "Click the 'Preview' button in the Workflow Builder",
    "A dialog opens showing the form as users will see it",
    "Test field interactions and validation",
    "Navigate through screens (if multi-step)",
    "Close the preview to return to editing"
])

add_section(doc, "15.2 What to Check in Preview", level=2)
add_bullet_list(doc, [
    "All fields are visible and properly labeled",
    "Field groups display correctly",
    "Required fields are marked with asterisk",
    "Dropdown options are correct and complete",
    "Field layout and column spans look good",
    "Multi-screen navigation works",
    "Validation messages appear correctly"
])

add_image_placeholder(doc, "Workflow Preview Dialog")

# ============================================================================
# 16. BEST PRACTICES
# ============================================================================
add_section(doc, "16. Best Practices")

add_section(doc, "16.1 Form Design Best Practices", level=2)
add_bullet_list(doc, [
    "Keep forms as simple as possible - only ask for necessary information",
    "Group related fields together using Field Groups",
    "Use clear, descriptive labels (not internal codes)",
    "Provide help text for complex fields",
    "Use appropriate field types (e.g., Email for emails, not Text)",
    "Set sensible default values where applicable",
    "Mark truly required fields, not everything"
])

add_section(doc, "16.2 Approval Chain Best Practices", level=2)
add_bullet_list(doc, [
    "Keep approval chains short (2-3 levels when possible)",
    "Use amount-based routing to reduce unnecessary approvals",
    "Set realistic escalation timeframes",
    "Enable email notifications for timely approvals",
    "Consider SBU-specific approvers for large organizations"
])

add_section(doc, "16.3 Naming Conventions", level=2)
add_table(doc,
    ["Element", "Recommended Format", "Example"],
    [
        ["Workflow Name", "Title Case, descriptive", "Purchase Request Form"],
        ["Workflow Code", "UPPER_SNAKE_CASE", "PURCHASE_REQUEST"],
        ["Field Names", "camelCase", "requestorName"],
        ["Field Labels", "Title Case", "Requestor Name"],
        ["Group Names", "Title Case", "Payment Details"]
    ],
    [2, 2, 2.5]
)

add_section(doc, "16.4 Testing Recommendations", level=2)
add_numbered_list(doc, [
    "Preview the workflow thoroughly before publishing",
    "Test with a small group of users first",
    "Verify email notifications are received",
    "Test the full approval chain with test submissions",
    "Check access restrictions work as expected"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/03_Workflow_Builder_Manual.docx")
print("Workflow Builder Manual created successfully!")
