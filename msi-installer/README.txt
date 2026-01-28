========================================
  SONAR WORKFLOW SYSTEM
  Version 1.1.0
========================================

INSTALLATION INSTRUCTIONS
-------------------------

1. PREREQUISITES
   - Windows 10 or later
   - Java 25 or later (Download from https://adoptium.net/)

2. INSTALLATION (MSI)
   - Double-click SonarworksWorkflow-1.0.0.msi
   - Follow the installation wizard
   - The installer will create:
     * Desktop shortcut
     * Start Menu entry
     * Entry in Programs and Features

3. RUNNING THE APPLICATION
   - Double-click the "Sonar Workflow System" shortcut on your desktop
   - Or use Start Menu > Sonar > Sonar Workflow System
   - Open your browser and go to: http://localhost:8080

4. DEFAULT LOGIN
   - Username: admin
   - Password: admin123
   (Change these after first login!)

5. UNINSTALLATION
   - Use "Add or Remove Programs" in Windows Settings
   - Or run the MSI installer again and select "Remove"

KEY FEATURES
------------

* Visual Workflow Builder
  - Drag-and-drop form design
  - 30+ field types (text, numbers, dates, files, signatures, etc.)
  - Accordion and Collapsible sections for organized forms
  - SQL Object fields for dynamic database-driven dropdowns

* Multi-Step Workflows
  - Create workflows with multiple screens/steps
  - Summary screens for submission review
  - Step-by-step navigation with validation

* Approval Management
  - Multi-level approval hierarchies
  - Amount-based routing
  - Email notifications with approval links
  - SBU-specific approvers

* Access Control
  - Organization-based restrictions (Corporate, SBU, Branch, Department)
  - Role and Privilege-based workflow access
  - Comprehensive audit logging

* Additional Features
  - Dark mode support
  - Command console for power users
  - Reports and dashboards
  - File attachments with configurable limits

TROUBLESHOOTING
---------------

Problem: "Java is not installed" error
Solution: Download and install Java 25+ from https://adoptium.net/

Problem: Application won't start
Solution: Make sure port 8080 is not in use by another application

Problem: Can't access http://localhost:8080
Solution: Wait a few seconds for the application to fully start

Problem: Login not working
Solution: Ensure you're using the correct credentials. Default is admin/admin123

SUPPORT
-------
For issues and feature requests, please contact your system administrator.

========================================
  (c) 2025 Sonar - All Rights Reserved
========================================
