========================================
  SONA WORKFLOW SYSTEM
  Version 1.5.0
========================================

INSTALLATION INSTRUCTIONS
-------------------------

1. PREREQUISITES
   - Windows 10 or later
   - PostgreSQL 14+ installed and running

   Note: Java is bundled with this installer. No separate Java installation required.
   Note: The database and user are created automatically on first launch.

2. INSTALLATION (MSI)
   - Double-click Sona Workflow-1.5.0.msi
   - Follow the installation wizard
   - The installer will create:
     * Desktop shortcut
     * Start Menu entry under "Acad"
     * Entry in Programs and Features

3. FIRST LAUNCH
   - The first time you start the application, it will:
     * Create the PostgreSQL database (workflow) and user (sonar)
     * Create all required tables
     * Seed default data (admin user, roles, privileges, settings)
   - You may be prompted for the PostgreSQL 'postgres' superuser password

4. RUNNING THE APPLICATION
   - Double-click the "Sona Workflow" shortcut on your desktop
   - Or use Start Menu > Acad > Sona Workflow
   - Open your browser and go to: http://localhost:9500

5. DEFAULT LOGIN
   - Username: admin
   - Password: P@88345!

6. UNINSTALLATION
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

Problem: Application won't start
Solution: Make sure PostgreSQL is running and port 9500 is not in use

Problem: Can't access http://localhost:9500
Solution: Wait a few seconds for the application to fully start

Problem: Login not working
Solution: Ensure you're using the correct credentials (admin / P@88345!)

Problem: Database setup fails
Solution: Ensure PostgreSQL is running and the 'postgres' superuser
          can connect on localhost. Check pg_hba.conf if needed.

SUPPORT
-------
For issues and feature requests, please contact your system administrator.

========================================
  (c) 2026 Acad - All Rights Reserved
========================================
