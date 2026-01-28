"""
Generate Authentication Module User Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Authentication Module",
    "User Manual - Console Interface"
)

# Table of Contents
sections = [
    "Introduction",
    "System Access Requirements",
    "Login Process",
    "Forgot Password",
    "Reset Password",
    "Change Password",
    "Session Management",
    "Security Features",
    "Troubleshooting"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """The Authentication Module is the gateway to the Sonar Workflow System. It provides secure access control to ensure only authorized users can access the system and its features. This module handles user login, password management, and session security.""")

add_paragraph(doc, "Key Features:", bold=True)
add_bullet_list(doc, [
    "Secure username and password authentication",
    "JWT (JSON Web Token) based session management",
    "Self-service password reset via email",
    "Password change functionality",
    "Account lockout protection",
    "Session timeout for security"
])

add_image_placeholder(doc, "Login Page Overview")

# ============================================================================
# 2. SYSTEM ACCESS REQUIREMENTS
# ============================================================================
add_section(doc, "2. System Access Requirements")

add_section(doc, "2.1 Browser Requirements", level=2)
add_paragraph(doc, "The Sonar Workflow System is a web-based application accessible through modern web browsers:")

add_table(doc,
    ["Browser", "Minimum Version", "Recommended"],
    [
        ["Google Chrome", "90+", "Latest"],
        ["Mozilla Firefox", "88+", "Latest"],
        ["Microsoft Edge", "90+", "Latest"],
        ["Safari", "14+", "Latest"]
    ],
    [2, 1.5, 1.5]
)

add_section(doc, "2.2 User Account Requirements", level=2)
add_paragraph(doc, "To access the system, you need:")
add_bullet_list(doc, [
    "A valid username assigned by the system administrator",
    "An active password (not expired)",
    "An active account (not locked or disabled)",
    "Appropriate role and privileges assigned"
])

add_note(doc, "Contact your system administrator if you don't have login credentials or your account is locked.", "NOTE")

# ============================================================================
# 3. LOGIN PROCESS
# ============================================================================
add_section(doc, "3. Login Process")

add_section(doc, "3.1 Accessing the Login Page", level=2)
add_paragraph(doc, "Open your web browser and navigate to the Sonar Workflow System URL provided by your organization. The login page will be displayed automatically.")

add_image_placeholder(doc, "Login Page with Username and Password Fields")

add_section(doc, "3.2 Login Fields", level=2)

add_table(doc,
    ["Field", "Description", "Required"],
    [
        ["Username", "Your unique system identifier (case-sensitive)", "Yes"],
        ["Password", "Your secret authentication key", "Yes"],
        ["Remember Me", "Keep session active for extended period", "No"]
    ],
    [1.5, 3.5, 1]
)

add_section(doc, "3.3 Step-by-Step Login Instructions", level=2)

add_step_by_step(doc, [
    "Open your web browser and navigate to the system URL",
    "Enter your username in the 'Username' field",
    "Enter your password in the 'Password' field",
    "Optionally, check 'Remember Me' to stay logged in longer",
    "Click the 'Login' button or press Enter",
    "Wait for authentication - you will be redirected to the Dashboard upon success"
])

add_image_placeholder(doc, "Successful Login - Dashboard Redirect")

add_section(doc, "3.4 Login Errors", level=2)

add_table(doc,
    ["Error Message", "Cause", "Solution"],
    [
        ["Invalid credentials", "Wrong username or password", "Verify your credentials and try again"],
        ["Account locked", "Too many failed login attempts", "Contact system administrator"],
        ["Account disabled", "Account deactivated by admin", "Contact system administrator"],
        ["Password expired", "Password validity period exceeded", "Use 'Forgot Password' to reset"],
        ["Session expired", "Previous session timed out", "Log in again"]
    ],
    [2, 2, 2]
)

add_example(doc, "Successful Login Flow",
"""1. User enters: admin / password123
2. System validates credentials
3. JWT token is generated
4. User is redirected to Dashboard
5. Navigation menu shows based on user roles""")

# ============================================================================
# 4. FORGOT PASSWORD
# ============================================================================
add_section(doc, "4. Forgot Password")

add_paragraph(doc, """If you forget your password, you can request a password reset link via email. This is a self-service feature that allows you to regain access without administrator intervention.""")

add_section(doc, "4.1 Accessing Forgot Password", level=2)
add_step_by_step(doc, [
    "On the Login page, click the 'Forgot Password?' link",
    "The Forgot Password form will be displayed",
    "Enter your registered email address",
    "Click 'Send Reset Link'"
])

add_image_placeholder(doc, "Forgot Password Form")

add_section(doc, "4.2 Forgot Password Fields", level=2)

add_table(doc,
    ["Field", "Description", "Validation"],
    [
        ["Email Address", "Your registered email in the system", "Must be a valid email format and registered in system"]
    ],
    [2, 2.5, 2]
)

add_section(doc, "4.3 What Happens Next", level=2)
add_numbered_list(doc, [
    "System verifies the email exists in the database",
    "A unique password reset token is generated (valid for 24 hours)",
    "An email is sent with a secure reset link",
    "You receive the email with instructions"
])

add_note(doc, "If you don't receive the email within 5 minutes, check your spam folder or verify your email address is correct.", "TIP")

add_note(doc, "The reset link expires after 24 hours for security reasons. Request a new link if needed.", "WARNING")

# ============================================================================
# 5. RESET PASSWORD
# ============================================================================
add_section(doc, "5. Reset Password")

add_paragraph(doc, """After clicking the reset link in your email, you will be directed to the password reset page where you can set a new password.""")

add_section(doc, "5.1 Reset Password Form", level=2)

add_table(doc,
    ["Field", "Description", "Requirements"],
    [
        ["New Password", "Your new password", "Minimum 8 characters, must include uppercase, lowercase, number"],
        ["Confirm Password", "Re-enter new password", "Must exactly match New Password"]
    ],
    [2, 2.5, 2]
)

add_image_placeholder(doc, "Reset Password Form")

add_section(doc, "5.2 Password Requirements", level=2)
add_paragraph(doc, "Your new password must meet the following security requirements:")
add_bullet_list(doc, [
    "Minimum 8 characters in length",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one number (0-9)",
    "Optionally include special characters (!@#$%^&*)",
    "Cannot be the same as your last 3 passwords"
])

add_section(doc, "5.3 Reset Process", level=2)
add_step_by_step(doc, [
    "Click the reset link in your email",
    "Enter your new password in the 'New Password' field",
    "Re-enter the password in the 'Confirm Password' field",
    "Click 'Reset Password'",
    "Upon success, you'll see a confirmation message",
    "Click 'Go to Login' to log in with your new password"
])

# ============================================================================
# 6. CHANGE PASSWORD
# ============================================================================
add_section(doc, "6. Change Password")

add_paragraph(doc, """Once logged in, you can change your password at any time through your profile settings. Regular password changes are recommended for security.""")

add_section(doc, "6.1 Accessing Change Password", level=2)
add_step_by_step(doc, [
    "Log in to the system",
    "Click on your profile icon/name in the top-right corner",
    "Select 'Change Password' from the dropdown menu",
    "The Change Password dialog will appear"
])

add_image_placeholder(doc, "Change Password Dialog")

add_section(doc, "6.2 Change Password Fields", level=2)

add_table(doc,
    ["Field", "Description", "Required"],
    [
        ["Current Password", "Your existing/current password", "Yes"],
        ["New Password", "The new password you want to set", "Yes"],
        ["Confirm New Password", "Re-enter the new password", "Yes"]
    ],
    [2, 3, 1]
)

add_section(doc, "6.3 Step-by-Step Instructions", level=2)
add_step_by_step(doc, [
    "Enter your current password to verify your identity",
    "Enter your new password (following password requirements)",
    "Confirm the new password by entering it again",
    "Click 'Change Password'",
    "A success message confirms the password change",
    "Your session remains active - no need to log in again"
])

add_note(doc, "If you're forced to change your password on first login, you cannot skip this step.", "NOTE")

# ============================================================================
# 7. SESSION MANAGEMENT
# ============================================================================
add_section(doc, "7. Session Management")

add_section(doc, "7.1 Session Overview", level=2)
add_paragraph(doc, """The system uses JWT (JSON Web Token) based authentication to manage your session. This provides secure, stateless authentication across all system features.""")

add_section(doc, "7.2 Session Duration", level=2)
add_table(doc,
    ["Session Type", "Duration", "Description"],
    [
        ["Standard Session", "8 hours", "Default session length after login"],
        ["Remember Me Session", "7 days", "Extended session when 'Remember Me' is checked"],
        ["Idle Timeout", "30 minutes", "Session expires after 30 minutes of inactivity"]
    ],
    [2, 1.5, 3]
)

add_section(doc, "7.3 Session Indicators", level=2)
add_paragraph(doc, "The system provides visual indicators of your session status:")
add_bullet_list(doc, [
    "User icon in the top-right shows your username",
    "Session warning appears 5 minutes before expiry",
    "Automatic redirect to login page when session expires"
])

add_section(doc, "7.4 Logging Out", level=2)
add_paragraph(doc, "Always log out properly when you're done using the system:")
add_step_by_step(doc, [
    "Click your profile icon/name in the top-right corner",
    "Select 'Logout' from the dropdown menu",
    "You will be redirected to the login page",
    "Your session token is invalidated for security"
])

add_note(doc, "Always log out when using shared or public computers to protect your account.", "WARNING")

# ============================================================================
# 8. SECURITY FEATURES
# ============================================================================
add_section(doc, "8. Security Features")

add_section(doc, "8.1 Account Lockout Protection", level=2)
add_paragraph(doc, """To protect against brute-force attacks, accounts are temporarily locked after multiple failed login attempts.""")

add_table(doc,
    ["Security Feature", "Setting", "Description"],
    [
        ["Failed Login Threshold", "5 attempts", "Account locks after 5 failed attempts"],
        ["Lockout Duration", "30 minutes", "Account automatically unlocks after 30 minutes"],
        ["IP Tracking", "Enabled", "Failed attempts are logged with IP address"]
    ],
    [2.5, 1.5, 2.5]
)

add_section(doc, "8.2 Password Security", level=2)
add_bullet_list(doc, [
    "Passwords are encrypted using industry-standard hashing (bcrypt)",
    "Passwords are never stored in plain text",
    "Password history prevents reuse of recent passwords",
    "Reset tokens are single-use and time-limited"
])

add_section(doc, "8.3 Audit Logging", level=2)
add_paragraph(doc, "All authentication events are logged for security auditing:")
add_bullet_list(doc, [
    "Successful and failed login attempts",
    "Password changes and resets",
    "Session creation and termination",
    "IP address and browser information"
])

# ============================================================================
# 9. TROUBLESHOOTING
# ============================================================================
add_section(doc, "9. Troubleshooting")

add_section(doc, "9.1 Common Issues and Solutions", level=2)

add_table(doc,
    ["Issue", "Possible Cause", "Solution"],
    [
        ["Can't access login page", "Network/URL issue", "Verify URL, check internet connection"],
        ["'Invalid credentials' error", "Wrong username/password", "Verify credentials, check caps lock"],
        ["Account locked", "Too many failed attempts", "Wait 30 minutes or contact admin"],
        ["Not receiving reset email", "Wrong email or spam filter", "Check spam folder, verify email address"],
        ["Reset link doesn't work", "Link expired or used", "Request a new reset link"],
        ["Session keeps expiring", "Idle timeout", "Stay active or check 'Remember Me'"],
        ["Can't change password", "Current password wrong", "Verify current password is correct"]
    ],
    [2, 2, 2.5]
)

add_section(doc, "9.2 Getting Help", level=2)
add_paragraph(doc, "If you continue to experience issues:")
add_numbered_list(doc, [
    "Note the exact error message displayed",
    "Record the time the issue occurred",
    "Take a screenshot if possible",
    "Contact your system administrator with these details"
])

add_section(doc, "9.3 Contact Information", level=2)
add_paragraph(doc, "For authentication issues, contact:")
add_bullet_list(doc, [
    "System Administrator: [Your Admin Email]",
    "IT Help Desk: [Your Help Desk Number]",
    "Support Portal: [Your Support URL]"
])

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/console/01_Authentication_Module_Manual.docx")
print("Authentication Module Manual created successfully!")
