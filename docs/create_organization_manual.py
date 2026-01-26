"""
Generate Organization Structure Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Organization Structure Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Organization Hierarchy Overview",
    "Managing Corporates",
    "Managing Categories",
    "Managing SBUs",
    "Managing Branches",
    "Managing Departments",
    "Organization Relationships",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Organization Structure module allows administrators to define and manage the organizational hierarchy within the Sonarworks Workflow System. This structure controls user access, workflow routing, and reporting capabilities.""")

add_paragraph(doc, "Key Functions:", bold=True)
add_bullet_list(doc, [
    "Define corporate entities and subsidiaries",
    "Categorize organizations",
    "Create Strategic Business Units (SBUs)",
    "Manage branch locations",
    "Set up departmental structures"
])

add_note(doc, "Organization structure must be set up before creating workflows with access restrictions.", "NOTE")

add_image_placeholder(doc, "Organization Structure Overview")

# ============================================================================
# 2. ORGANIZATION HIERARCHY OVERVIEW
# ============================================================================
add_section(doc, "2. Organization Hierarchy Overview")

add_section(doc, "2.1 Hierarchy Levels", level=2)

add_table(doc,
    ["Level", "Description", "Contains"],
    [
        ["Corporate", "Top-level legal entities", "SBUs"],
        ["Category", "Corporate classification", "N/A (label only)"],
        ["SBU", "Strategic Business Units", "Branches, Child SBUs"],
        ["Branch", "Physical locations/offices", "Departments"],
        ["Department", "Functional departments", "Users (via assignment)"]
    ],
    [1.5, 2.5, 2.5]
)

add_section(doc, "2.2 Visual Hierarchy", level=2)

add_example(doc, "Organization Structure Example",
"""Corporate: ABC Holdings Ltd
  |
  +-- SBU: Finance Division
  |     |
  |     +-- Branch: Head Office
  |     |     +-- Department: Accounts
  |     |     +-- Department: Treasury
  |     |
  |     +-- Branch: Regional Office
  |           +-- Department: Local Accounts
  |
  +-- SBU: Operations Division
        |
        +-- Branch: Manufacturing Plant
              +-- Department: Production
              +-- Department: Quality
""")

add_section(doc, "2.3 Impact on System Features", level=2)

add_table(doc,
    ["Feature", "How Organization Affects It"],
    [
        ["User Access", "Users see workflows based on their org units"],
        ["Workflow Routing", "Approvers assigned by SBU/Branch"],
        ["Reporting", "Reports can be filtered by organization"],
        ["Data Segregation", "Data is partitioned by organization"]
    ],
    [2, 4.5]
)

# ============================================================================
# 3. MANAGING CORPORATES
# ============================================================================
add_section(doc, "3. Managing Corporates")

add_section(doc, "3.1 Accessing Corporate Management", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Organization",
    "Click 'Corporates' in the sub-menu",
    "The Corporate List displays all entities"
])

add_section(doc, "3.2 Creating a Corporate", level=2)
add_step_by_step(doc, [
    "Click '+ New Corporate' button",
    "Enter the corporate details",
    "Select a category",
    "Click 'Save'"
])

add_section(doc, "3.3 Corporate Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Code", "Yes", "Unique short code (e.g., ABC)"],
        ["Name", "Yes", "Full legal name"],
        ["Category", "Yes", "Classification category"],
        ["Type", "No", "Type of entity (Holding, Subsidiary, etc.)"],
        ["Address", "No", "Physical address"],
        ["Email", "No", "Contact email"],
        ["Phone", "No", "Contact phone"],
        ["Website", "No", "Corporate website URL"],
        ["Active", "Yes", "Whether corporate is active"]
    ],
    [1.5, 0.8, 4.2]
)

add_image_placeholder(doc, "Corporate Form")

add_section(doc, "3.4 Corporate Types", level=2)

add_table(doc,
    ["Type", "Description"],
    [
        ["Holding", "Parent holding company"],
        ["Subsidiary", "Fully owned subsidiary"],
        ["Associate", "Partially owned associate company"],
        ["Joint Venture", "Joint venture entity"],
        ["Other", "Other corporate types"]
    ],
    [2, 4.5]
)

# ============================================================================
# 4. MANAGING CATEGORIES
# ============================================================================
add_section(doc, "4. Managing Categories")

add_section(doc, "4.1 What Are Categories?", level=2)
add_paragraph(doc, """Categories are used to classify corporates for grouping and reporting purposes. They provide a way to organize multiple corporates by industry, function, or other criteria.""")

add_section(doc, "4.2 Accessing Category Management", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Organization",
    "Click 'Categories' in the sub-menu",
    "The Category List displays"
])

add_section(doc, "4.3 Creating a Category", level=2)
add_step_by_step(doc, [
    "Click '+ New Category' button",
    "Enter the Category Name",
    "Enter an optional Description",
    "Click 'Save'"
])

add_section(doc, "4.4 Category Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Name", "Yes", "Category name (e.g., 'Financial Services')"],
        ["Description", "No", "Explanation of the category"],
        ["Active", "Yes", "Whether category is available for use"]
    ],
    [2, 1, 3.5]
)

add_example(doc, "Category Examples",
"""Categories:
  - Financial Services (Banks, insurance, investments)
  - Manufacturing (Production companies)
  - Retail (Consumer sales)
  - Technology (IT and software companies)
  - Healthcare (Medical services)
""")

# ============================================================================
# 5. MANAGING SBUS
# ============================================================================
add_section(doc, "5. Managing SBUs (Strategic Business Units)")

add_section(doc, "5.1 What is an SBU?", level=2)
add_paragraph(doc, """An SBU (Strategic Business Unit) represents a major division or business line within a corporate entity. SBUs can have their own sub-SBUs, creating a hierarchical structure.""")

add_section(doc, "5.2 Accessing SBU Management", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Organization",
    "Click 'SBUs' in the sub-menu",
    "The SBU List displays"
])

add_section(doc, "5.3 Creating an SBU", level=2)
add_step_by_step(doc, [
    "Click '+ New SBU' button",
    "Select the parent Corporate",
    "Optionally select a Parent SBU (for sub-SBU)",
    "Enter SBU details",
    "Click 'Save'"
])

add_section(doc, "5.4 SBU Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Code", "Yes", "Unique short code (e.g., FIN-01)"],
        ["Name", "Yes", "Full SBU name"],
        ["Corporate", "Yes", "Parent corporate entity"],
        ["Parent SBU", "No", "Parent SBU for hierarchical nesting"],
        ["Email", "No", "SBU contact email"],
        ["Phone", "No", "SBU contact phone"],
        ["Address", "No", "SBU address if different from corporate"],
        ["Active", "Yes", "Whether SBU is active"]
    ],
    [1.5, 0.8, 4.2]
)

add_image_placeholder(doc, "SBU Form")

add_section(doc, "5.5 SBU Hierarchy", level=2)
add_paragraph(doc, """SBUs can be nested for complex organizational structures:""")

add_example(doc, "SBU Hierarchy Example",
"""Corporate: ABC Holdings

SBU Level 1:
  +-- Finance Division (FIN)
  +-- Operations Division (OPS)

SBU Level 2 (under Finance):
  +-- Retail Banking (FIN-RET)
  +-- Corporate Banking (FIN-CORP)
  +-- Investment Banking (FIN-INV)
""")

# ============================================================================
# 6. MANAGING BRANCHES
# ============================================================================
add_section(doc, "6. Managing Branches")

add_section(doc, "6.1 What is a Branch?", level=2)
add_paragraph(doc, """Branches represent physical locations or offices within an SBU. They are useful for geographically distributed organizations.""")

add_section(doc, "6.2 Accessing Branch Management", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Organization",
    "Click 'Branches' in the sub-menu",
    "The Branch List displays"
])

add_section(doc, "6.3 Creating a Branch", level=2)
add_step_by_step(doc, [
    "Click '+ New Branch' button",
    "Select the parent SBU",
    "Enter branch details",
    "Click 'Save'"
])

add_section(doc, "6.4 Branch Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Code", "Yes", "Unique branch code (e.g., HQ-001)"],
        ["Name", "Yes", "Branch name (e.g., 'Head Office')"],
        ["SBU", "Yes", "Parent SBU"],
        ["Address", "No", "Physical address"],
        ["City", "No", "City location"],
        ["Phone", "No", "Branch phone number"],
        ["Email", "No", "Branch email"],
        ["Active", "Yes", "Whether branch is active"]
    ],
    [1.5, 0.8, 4.2]
)

add_image_placeholder(doc, "Branch Form")

add_example(doc, "Branch Examples",
"""SBU: Retail Banking

Branches:
  +-- Head Office (HQ-001) - City Center
  +-- Downtown Branch (DT-001) - Downtown
  +-- Airport Branch (AP-001) - Airport Area
  +-- Mall Branch (ML-001) - Shopping Center
""")

# ============================================================================
# 7. MANAGING DEPARTMENTS
# ============================================================================
add_section(doc, "7. Managing Departments")

add_section(doc, "7.1 What is a Department?", level=2)
add_paragraph(doc, """Departments represent functional divisions within a branch. They are the lowest level of the organizational hierarchy and are often where users are directly assigned.""")

add_section(doc, "7.2 Accessing Department Management", level=2)
add_step_by_step(doc, [
    "Navigate to Administration > Organization",
    "Click 'Departments' in the sub-menu",
    "The Department List displays"
])

add_section(doc, "7.3 Creating a Department", level=2)
add_step_by_step(doc, [
    "Click '+ New Department' button",
    "Select the parent Branch",
    "Enter department details",
    "Click 'Save'"
])

add_section(doc, "7.4 Department Fields", level=2)

add_table(doc,
    ["Field", "Required", "Description"],
    [
        ["Code", "Yes", "Unique department code (e.g., IT-001)"],
        ["Name", "Yes", "Department name (e.g., 'Information Technology')"],
        ["Branch", "Yes", "Parent branch"],
        ["Email", "No", "Department email"],
        ["Phone", "No", "Department phone"],
        ["Active", "Yes", "Whether department is active"]
    ],
    [1.5, 0.8, 4.2]
)

add_example(doc, "Department Examples",
"""Branch: Head Office

Departments:
  +-- Information Technology (IT-001)
  +-- Human Resources (HR-001)
  +-- Finance & Accounting (FA-001)
  +-- Legal & Compliance (LC-001)
  +-- Marketing (MK-001)
""")

# ============================================================================
# 8. ORGANIZATION RELATIONSHIPS
# ============================================================================
add_section(doc, "8. Organization Relationships")

add_section(doc, "8.1 Parent-Child Relationships", level=2)

add_table(doc,
    ["Parent", "Child", "Relationship"],
    [
        ["Corporate", "SBU", "One-to-Many (Corporate has many SBUs)"],
        ["SBU", "SBU", "One-to-Many (SBU can have sub-SBUs)"],
        ["SBU", "Branch", "One-to-Many (SBU has many Branches)"],
        ["Branch", "Department", "One-to-Many (Branch has many Departments)"]
    ],
    [1.8, 1.8, 3]
)

add_section(doc, "8.2 Cascading Effects", level=2)
add_paragraph(doc, """Changes to parent entities may affect children:""")
add_bullet_list(doc, [
    "Deactivating a Corporate affects all its SBUs, Branches, Departments",
    "Deleting an SBU requires handling of child Branches first",
    "Moving a Branch to different SBU updates the hierarchy"
])

add_note(doc, "Be careful when deactivating or deleting organization entities. Consider the impact on users and workflows.", "WARNING")

add_section(doc, "8.3 User Assignment", level=2)
add_paragraph(doc, """Users can be assigned to multiple organization units:""")
add_bullet_list(doc, [
    "Users can belong to multiple Corporates",
    "Users can be in multiple SBUs",
    "Users can work at multiple Branches",
    "Users typically belong to one primary Department"
])

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Planning Organization Structure", level=2)
add_numbered_list(doc, [
    "Map your actual organizational hierarchy first",
    "Start from the top (Corporates) and work down",
    "Use consistent naming conventions",
    "Plan for future growth and changes",
    "Keep the structure as simple as needed"
])

add_section(doc, "9.2 Naming Conventions", level=2)

add_table(doc,
    ["Entity", "Code Format", "Name Format"],
    [
        ["Corporate", "ABC, XYZ", "ABC Holdings Ltd"],
        ["Category", "N/A", "Financial Services"],
        ["SBU", "FIN-01", "Finance Division"],
        ["Branch", "HQ-001", "Head Office"],
        ["Department", "IT-001", "Information Technology"]
    ],
    [1.5, 1.8, 3.2]
)

add_section(doc, "9.3 Maintenance Recommendations", level=2)
add_bullet_list(doc, [
    "Review organization structure annually",
    "Update promptly when reorganizations occur",
    "Deactivate rather than delete unused entities",
    "Document the purpose of each entity",
    "Keep codes unique and meaningful"
])

add_section(doc, "9.4 Common Pitfalls", level=2)
add_bullet_list(doc, [
    "Creating too deep a hierarchy (3-4 levels is usually enough)",
    "Using abbreviations that aren't clear",
    "Not updating structure after company changes",
    "Deleting entities with active users assigned",
    "Creating duplicate entities for temporary needs"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/09_Organization_Structure_Manual.docx")
print("Organization Structure Manual created successfully!")
