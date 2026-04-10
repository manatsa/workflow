========================================
  SONAR WORKFLOW SYSTEM
  Version 1.5.0
========================================

INSTALLATION INSTRUCTIONS
-------------------------

WINDOWS:
  1. Prerequisites: Java 21+ (https://adoptium.net/), PostgreSQL 14+
  2. Run Setup.bat (double-click) and follow prompts
  3. Desktop and Start Menu shortcuts will be created
  4. Open browser at http://<your-ip>:9500

LINUX:
  1. Prerequisites: Java 21+, PostgreSQL 14+
  2. chmod +x install.sh && sudo ./install.sh
  3. Manage with: sudo systemctl start|stop|restart|status sonar-workflow
  4. Open browser at http://<your-ip>:9500

DEFAULT LOGIN
  Username: super
  Password: Cryp20@!
  (Change after first login!)

UNINSTALLATION
  Windows: Use "Add or Remove Programs" or run Uninstall.ps1
  Linux:   sudo ./install.sh --uninstall
           or: sudo systemctl stop sonar-workflow && sudo rm -rf /opt/sonar/workflow

KEY FEATURES
------------
* Visual Workflow Builder (30+ field types, drag-and-drop)
* Multi-Step Workflows with summary screens
* Multi-Level Approval Hierarchies (amount-based routing, email approval)
* Project Management (tasks, milestones, risks, budgets, Gantt charts)
* Organization-Based Access Control (Corporate, SBU, Branch, Department)
* Reports & Analytics (workflow + project reports, Excel/CSV/PDF export)
* Submission Import/Export (Excel templates per workflow)
* Dark mode, command console, file attachments

TROUBLESHOOTING
---------------
Problem: "Java is not installed" error
  -> Install Java 21+ from https://adoptium.net/

Problem: Application won't start
  -> Check port 9500 is free: netstat -an | grep 9500
  -> Check PostgreSQL is running and database 'workflow' exists

Problem: Can't access the application
  -> Wait 10-15 seconds for full startup
  -> Check firewall allows port 9500

Linux: Check logs with: journalctl -u sonar-workflow -f

========================================
  (c) 2026 Sonar - All Rights Reserved
========================================
