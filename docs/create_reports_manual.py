"""
Generate Reports Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Reports Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "Accessing Reports",
    "Available Report Types",
    "Running Reports",
    "Report Parameters",
    "Viewing Report Results",
    "Exporting Reports",
    "Scheduled Reports",
    "Best Practices"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Reports Module provides comprehensive reporting capabilities for the Sonarworks Workflow System. It enables users to generate insights on workflow performance, approval trends, user activity, and organizational metrics.""")

add_paragraph(doc, "Key Capabilities:", bold=True)
add_bullet_list(doc, [
    "Pre-built standard reports",
    "Flexible date range filtering",
    "Multiple export formats",
    "Organizational filtering",
    "Drill-down capabilities",
    "Visual charts and graphs"
])

add_image_placeholder(doc, "Reports Module Overview")

# ============================================================================
# 2. ACCESSING REPORTS
# ============================================================================
add_section(doc, "2. Accessing Reports")

add_step_by_step(doc, [
    "Log in to the system",
    "Click 'Reports' in the navigation sidebar",
    "The Reports list page displays available reports",
    "Reports are organized by category"
])

add_note(doc, "Report visibility depends on your assigned roles and permissions.", "NOTE")

add_image_placeholder(doc, "Navigation to Reports")

# ============================================================================
# 3. AVAILABLE REPORT TYPES
# ============================================================================
add_section(doc, "3. Available Report Types")

add_section(doc, "3.1 Workflow Reports", level=2)

add_table(doc,
    ["Report", "Description", "Key Metrics"],
    [
        ["Workflow Summary", "Overview of all workflows", "Total, by status, by type"],
        ["Pending Approvals", "Workflows awaiting approval", "Count, age, by approver"],
        ["Approval Turnaround", "Time to process approvals", "Average, min, max time"],
        ["Workflow Volume", "Submission trends over time", "Daily, weekly, monthly counts"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "3.2 User Reports", level=2)

add_table(doc,
    ["Report", "Description", "Key Metrics"],
    [
        ["User Activity", "User login and action summary", "Logins, actions, last active"],
        ["Approver Performance", "Approval speed by user", "Approved, rejected, avg time"],
        ["Initiator Report", "Submissions by initiator", "Count, approval rate"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "3.3 Organization Reports", level=2)

add_table(doc,
    ["Report", "Description", "Key Metrics"],
    [
        ["SBU Workflow Report", "Workflows by SBU", "Volume, status distribution"],
        ["Department Summary", "Activity by department", "Users, workflows, approvals"],
        ["Branch Performance", "Metrics by branch", "Volume, processing time"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "3.4 Financial Reports", level=2)

add_table(doc,
    ["Report", "Description", "Key Metrics"],
    [
        ["Amount Summary", "Financial workflow totals", "Total approved, by category"],
        ["Budget Utilization", "Spending against limits", "Spent, remaining, %"],
        ["Approval Limits Report", "Usage of approval limits", "By approver, by level"]
    ],
    [2, 2.5, 2]
)

# ============================================================================
# 4. RUNNING REPORTS
# ============================================================================
add_section(doc, "4. Running Reports")

add_section(doc, "4.1 Basic Report Execution", level=2)
add_step_by_step(doc, [
    "Navigate to Reports module",
    "Find and click on the desired report",
    "Set report parameters (date range, filters)",
    "Click 'Generate Report' or 'Run'",
    "Wait for report to process",
    "View results on screen"
])

add_image_placeholder(doc, "Report Parameter Screen")

add_section(doc, "4.2 Report Generation Process", level=2)

add_table(doc,
    ["Stage", "Description", "Time"],
    [
        ["Parameter Entry", "User sets filters and options", "User-dependent"],
        ["Data Query", "System retrieves data", "Depends on data volume"],
        ["Processing", "Calculations and aggregations", "Depends on complexity"],
        ["Rendering", "Results displayed/formatted", "Usually quick"]
    ],
    [2, 2.5, 2]
)

add_note(doc, "Large date ranges or complex reports may take longer to generate. Consider narrowing filters for faster results.", "TIP")

# ============================================================================
# 5. REPORT PARAMETERS
# ============================================================================
add_section(doc, "5. Report Parameters")

add_section(doc, "5.1 Common Parameters", level=2)

add_table(doc,
    ["Parameter", "Type", "Description"],
    [
        ["Date From", "Date", "Start date of reporting period"],
        ["Date To", "Date", "End date of reporting period"],
        ["Workflow Type", "Multi-select", "Filter by specific workflows"],
        ["Status", "Multi-select", "Filter by workflow status"],
        ["SBU", "Multi-select", "Filter by business unit"],
        ["Branch", "Multi-select", "Filter by branch"],
        ["User", "Multi-select", "Filter by specific user"]
    ],
    [1.8, 1.5, 3.2]
)

add_section(doc, "5.2 Date Range Options", level=2)

add_table(doc,
    ["Quick Select", "Date Range"],
    [
        ["Today", "Current day"],
        ["Yesterday", "Previous day"],
        ["This Week", "Monday to current day"],
        ["Last Week", "Previous Monday to Sunday"],
        ["This Month", "1st to current day"],
        ["Last Month", "Previous month 1st to last"],
        ["This Quarter", "Current quarter"],
        ["This Year", "January 1st to current day"],
        ["Custom", "User-specified dates"]
    ],
    [2, 4.5]
)

add_section(doc, "5.3 Using Filters Effectively", level=2)
add_bullet_list(doc, [
    "Start with broader date ranges, narrow if needed",
    "Use organizational filters to focus on your area",
    "Combine multiple filters for specific analysis",
    "Save common filter combinations as presets (if available)"
])

# ============================================================================
# 6. VIEWING REPORT RESULTS
# ============================================================================
add_section(doc, "6. Viewing Report Results")

add_section(doc, "6.1 Result Display Types", level=2)

add_table(doc,
    ["Display", "Description", "Best For"],
    [
        ["Table", "Rows and columns of data", "Detailed data, exports"],
        ["Chart", "Visual graphs and charts", "Trends, comparisons"],
        ["Summary", "Key metrics cards", "Quick overview"],
        ["Combined", "Mix of above", "Comprehensive reports"]
    ],
    [1.5, 2.5, 2.5]
)

add_image_placeholder(doc, "Report Results View")

add_section(doc, "6.2 Chart Types", level=2)

add_table(doc,
    ["Chart Type", "Use For"],
    [
        ["Bar Chart", "Comparing categories, rankings"],
        ["Line Chart", "Trends over time"],
        ["Pie Chart", "Distribution, proportions"],
        ["Area Chart", "Cumulative trends"],
        ["Stacked Bar", "Composition comparisons"]
    ],
    [2, 4.5]
)

add_section(doc, "6.3 Interacting with Results", level=2)
add_bullet_list(doc, [
    "Click on table headers to sort",
    "Click on chart elements to see details",
    "Hover for tooltips with exact values",
    "Use pagination for large result sets",
    "Drill down by clicking linked values"
])

add_section(doc, "6.4 Drill-Down Functionality", level=2)
add_paragraph(doc, """Many reports support drill-down to see underlying details:""")

add_example(doc, "Drill-Down Example",
"""Report: Workflow Summary
View: 45 Pending workflows

Click "45 Pending" ->
Opens detailed list of all 45 pending workflows
With reference numbers, dates, current approvers

Click any workflow ->
Opens the specific workflow instance detail
""")

# ============================================================================
# 7. EXPORTING REPORTS
# ============================================================================
add_section(doc, "7. Exporting Reports")

add_section(doc, "7.1 Export Formats", level=2)

add_table(doc,
    ["Format", "Description", "File Type"],
    [
        ["Excel", "Microsoft Excel format", ".xlsx"],
        ["CSV", "Comma-separated values", ".csv"],
        ["PDF", "Portable Document Format", ".pdf"]
    ],
    [1.5, 2.5, 1.5]
)

add_section(doc, "7.2 How to Export", level=2)
add_step_by_step(doc, [
    "Generate the report with desired parameters",
    "Review results to ensure correctness",
    "Click the 'Export' button",
    "Select the desired format",
    "File downloads to your computer"
])

add_section(doc, "7.3 Export Options", level=2)

add_table(doc,
    ["Option", "Description"],
    [
        ["Include Charts", "Export visual charts (PDF/Excel)"],
        ["Include Summary", "Export summary section"],
        ["Include Details", "Export detailed data rows"],
        ["Page Orientation", "Portrait or landscape (PDF)"]
    ],
    [2, 4.5]
)

add_section(doc, "7.4 Email Report", level=2)
add_paragraph(doc, """Some reports can be emailed directly:""")
add_step_by_step(doc, [
    "Generate the report",
    "Click 'Email' button",
    "Enter recipient email addresses",
    "Select format and include message",
    "Click 'Send'"
])

# ============================================================================
# 8. SCHEDULED REPORTS
# ============================================================================
add_section(doc, "8. Scheduled Reports")

add_paragraph(doc, """Scheduled reports automatically run and deliver at specified intervals.""")

add_section(doc, "8.1 Scheduling Options", level=2)

add_table(doc,
    ["Frequency", "Description"],
    [
        ["Daily", "Runs every day at specified time"],
        ["Weekly", "Runs on specified day of week"],
        ["Monthly", "Runs on specified day of month"],
        ["Quarterly", "Runs at quarter end"],
        ["Custom", "Custom cron expression"]
    ],
    [2, 4.5]
)

add_section(doc, "8.2 Creating a Schedule", level=2)
add_step_by_step(doc, [
    "Open the report you want to schedule",
    "Click 'Schedule' button",
    "Set the frequency and time",
    "Configure parameters (date range becomes relative)",
    "Set delivery method (email, save to system)",
    "Enter recipients if emailing",
    "Click 'Save Schedule'"
])

add_section(doc, "8.3 Managing Schedules", level=2)
add_bullet_list(doc, [
    "View scheduled reports in Reports > Scheduled",
    "Edit schedule parameters and recipients",
    "Pause or resume schedules",
    "Delete schedules no longer needed",
    "View schedule run history"
])

add_note(doc, "Scheduled reports use relative date ranges (e.g., 'Last Week') that adjust automatically.", "NOTE")

# ============================================================================
# 9. BEST PRACTICES
# ============================================================================
add_section(doc, "9. Best Practices")

add_section(doc, "9.1 Report Selection", level=2)
add_bullet_list(doc, [
    "Use the right report for your question",
    "Start with summary reports, drill into details",
    "Combine multiple reports for complete picture",
    "Create schedules for regularly needed reports"
])

add_section(doc, "9.2 Performance Tips", level=2)
add_bullet_list(doc, [
    "Use specific date ranges (avoid 'All Time')",
    "Apply organizational filters when possible",
    "Run large reports during off-peak hours",
    "Schedule complex reports instead of running ad-hoc"
])

add_section(doc, "9.3 Data Interpretation", level=2)
add_bullet_list(doc, [
    "Consider the context of the data",
    "Compare similar time periods fairly",
    "Account for organizational changes",
    "Verify unexpected results before acting"
])

add_section(doc, "9.4 Sharing Reports", level=2)
add_bullet_list(doc, [
    "Export to appropriate format for audience",
    "Include context/explanation with exports",
    "Remove sensitive data before external sharing",
    "Use PDF for formal presentations"
])

add_section(doc, "9.5 Troubleshooting", level=2)

add_table(doc,
    ["Issue", "Solution"],
    [
        ["Report takes too long", "Narrow date range, add filters"],
        ["No data in report", "Check filters, verify data exists"],
        ["Export fails", "Try smaller data set, different format"],
        ["Schedule not running", "Check schedule is active, verify recipients"]
    ],
    [2.5, 4]
)

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/12_Reports_Module_Manual.docx")
print("Reports Module Manual created successfully!")
