"""
Generate API Authentication Functions Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Authentication API Functions",
    "Technical Manual - API Reference"
)

# Table of Contents
sections = [
    "Introduction",
    "Authentication Overview",
    "API Endpoints",
    "Login Function",
    "Logout Function",
    "Token Refresh",
    "Password Functions",
    "Error Handling",
    "Security Best Practices",
    "Code Examples"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """This manual documents the Authentication API functions for the Sonar Workflow System. These APIs enable client applications to authenticate users, manage sessions, and handle password operations.""")

add_paragraph(doc, "API Characteristics:", bold=True)
add_bullet_list(doc, [
    "RESTful architecture",
    "JSON request/response format",
    "JWT (JSON Web Token) authentication",
    "HTTPS required for all endpoints"
])

add_section(doc, "1.1 Base URL", level=2)
add_code_block(doc, """https://your-server.com/api""", "URL")

add_section(doc, "1.2 Content Type", level=2)
add_code_block(doc, """Content-Type: application/json
Accept: application/json""", "HTTP Headers")

# ============================================================================
# 2. AUTHENTICATION OVERVIEW
# ============================================================================
add_section(doc, "2. Authentication Overview")

add_section(doc, "2.1 Authentication Flow", level=2)
add_numbered_list(doc, [
    "Client sends credentials to /api/auth/login",
    "Server validates credentials and returns JWT token",
    "Client stores token securely",
    "Client includes token in Authorization header for subsequent requests",
    "Token is refreshed before expiration or upon 401 response",
    "Client calls /api/auth/logout to invalidate token"
])

add_section(doc, "2.2 JWT Token Structure", level=2)
add_paragraph(doc, """The JWT token consists of three parts: Header, Payload, and Signature.""")

add_code_block(doc, """{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "username": "john.doe",
    "roles": ["STAFF", "INITIATOR"],
    "iat": 1705320000,
    "exp": 1705348800
  }
}""", "JSON")

add_section(doc, "2.3 Using the Token", level=2)
add_code_block(doc, """Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...""", "HTTP Header")

# ============================================================================
# 3. API ENDPOINTS
# ============================================================================
add_section(doc, "3. API Endpoints Summary")

add_table(doc,
    ["Method", "Endpoint", "Description", "Auth Required"],
    [
        ["POST", "/api/auth/login", "Authenticate user", "No"],
        ["POST", "/api/auth/logout", "Invalidate session", "Yes"],
        ["POST", "/api/auth/refresh", "Refresh JWT token", "Yes"],
        ["POST", "/api/password/change", "Change password", "Yes"],
        ["POST", "/api/password/reset-request", "Request password reset", "No"],
        ["POST", "/api/password/reset-confirm", "Confirm password reset", "No"]
    ],
    [1, 2.5, 2, 1]
)

# ============================================================================
# 4. LOGIN FUNCTION
# ============================================================================
add_section(doc, "4. Login Function")

add_section(doc, "4.1 Endpoint", level=2)
add_code_block(doc, """POST /api/auth/login""", "HTTP")

add_section(doc, "4.2 Request", level=2)

add_paragraph(doc, "Request Headers:", bold=True)
add_code_block(doc, """Content-Type: application/json""", "HTTP Headers")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "username": "john.doe",
  "password": "SecureP@ssw0rd"
}""", "JSON")

add_paragraph(doc, "Request Parameters:", bold=True)
add_table(doc,
    ["Parameter", "Type", "Required", "Description"],
    [
        ["username", "string", "Yes", "User's login username"],
        ["password", "string", "Yes", "User's password"]
    ],
    [1.5, 1, 1, 3]
)

add_section(doc, "4.3 Response", level=2)

add_paragraph(doc, "Success Response (200 OK):", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["STAFF", "INITIATOR"],
      "mustChangePassword": false
    }
  }
}""", "JSON")

add_paragraph(doc, "Error Response (401 Unauthorized):", bold=True)
add_code_block(doc, """{
  "success": false,
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}""", "JSON")

add_section(doc, "4.4 Error Codes", level=2)
add_table(doc,
    ["Error Code", "HTTP Status", "Description"],
    [
        ["INVALID_CREDENTIALS", "401", "Wrong username or password"],
        ["ACCOUNT_LOCKED", "403", "Account is locked"],
        ["ACCOUNT_DISABLED", "403", "Account is disabled"],
        ["PASSWORD_EXPIRED", "403", "Password has expired"],
        ["MUST_CHANGE_PASSWORD", "403", "Password change required"]
    ],
    [2.5, 1, 3]
)

# ============================================================================
# 5. LOGOUT FUNCTION
# ============================================================================
add_section(doc, "5. Logout Function")

add_section(doc, "5.1 Endpoint", level=2)
add_code_block(doc, """POST /api/auth/logout""", "HTTP")

add_section(doc, "5.2 Request", level=2)
add_code_block(doc, """Authorization: Bearer <token>
Content-Type: application/json""", "HTTP Headers")

add_paragraph(doc, "Request Body: Empty or not required", bold=True)

add_section(doc, "5.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "message": "Logout successful"
}""", "JSON")

add_section(doc, "5.4 Behavior", level=2)
add_bullet_list(doc, [
    "Token is invalidated on server",
    "Session is terminated",
    "Subsequent requests with same token will fail",
    "Audit log entry created"
])

# ============================================================================
# 6. TOKEN REFRESH
# ============================================================================
add_section(doc, "6. Token Refresh Function")

add_section(doc, "6.1 Endpoint", level=2)
add_code_block(doc, """POST /api/auth/refresh""", "HTTP")

add_section(doc, "6.2 Request", level=2)
add_code_block(doc, """Authorization: Bearer <current-token>
Content-Type: application/json""", "HTTP Headers")

add_section(doc, "6.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new token)",
    "tokenType": "Bearer",
    "expiresIn": 28800
  }
}""", "JSON")

add_section(doc, "6.4 Usage Notes", level=2)
add_bullet_list(doc, [
    "Call before token expires to maintain session",
    "Old token is invalidated upon refresh",
    "Use the new token for subsequent requests",
    "Refresh within token validity window"
])

# ============================================================================
# 7. PASSWORD FUNCTIONS
# ============================================================================
add_section(doc, "7. Password Functions")

add_section(doc, "7.1 Change Password", level=2)

add_paragraph(doc, "Endpoint:", bold=True)
add_code_block(doc, """POST /api/password/change""", "HTTP")

add_paragraph(doc, "Request Headers:", bold=True)
add_code_block(doc, """Authorization: Bearer <token>
Content-Type: application/json""", "HTTP Headers")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "currentPassword": "OldP@ssw0rd",
  "newPassword": "NewSecureP@ss!",
  "confirmPassword": "NewSecureP@ss!"
}""", "JSON")

add_paragraph(doc, "Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "Password changed successfully"
}""", "JSON")

add_section(doc, "7.2 Request Password Reset", level=2)

add_paragraph(doc, "Endpoint:", bold=True)
add_code_block(doc, """POST /api/password/reset-request""", "HTTP")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "email": "john.doe@company.com"
}""", "JSON")

add_paragraph(doc, "Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "If the email exists, a reset link has been sent"
}""", "JSON")

add_note(doc, "Response is always success to prevent email enumeration attacks.", "NOTE")

add_section(doc, "7.3 Confirm Password Reset", level=2)

add_paragraph(doc, "Endpoint:", bold=True)
add_code_block(doc, """POST /api/password/reset-confirm""", "HTTP")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ss!",
  "confirmPassword": "NewSecureP@ss!"
}""", "JSON")

add_paragraph(doc, "Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "Password has been reset successfully"
}""", "JSON")

# ============================================================================
# 8. ERROR HANDLING
# ============================================================================
add_section(doc, "8. Error Handling")

add_section(doc, "8.1 Error Response Format", level=2)
add_code_block(doc, """{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  },
  "timestamp": "2024-01-15T14:30:00Z"
}""", "JSON")

add_section(doc, "8.2 Common HTTP Status Codes", level=2)
add_table(doc,
    ["Status", "Meaning", "Action"],
    [
        ["200", "Success", "Process response data"],
        ["400", "Bad Request", "Check request format/parameters"],
        ["401", "Unauthorized", "Login or refresh token"],
        ["403", "Forbidden", "Insufficient permissions"],
        ["404", "Not Found", "Resource doesn't exist"],
        ["422", "Validation Error", "Check field validation errors"],
        ["500", "Server Error", "Retry or contact support"]
    ],
    [1, 1.5, 3]
)

add_section(doc, "8.3 Handling Token Expiration", level=2)
add_code_block(doc, """// Pseudo-code for handling 401 responses
async function apiCall(endpoint, options) {
  const response = await fetch(endpoint, options);

  if (response.status === 401) {
    // Try to refresh the token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the original request with new token
      return await fetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      redirectToLogin();
    }
  }
  return response;
}""", "JavaScript")

# ============================================================================
# 9. SECURITY BEST PRACTICES
# ============================================================================
add_section(doc, "9. Security Best Practices")

add_section(doc, "9.1 Token Storage", level=2)
add_bullet_list(doc, [
    "Store tokens in secure, HTTP-only cookies when possible",
    "If using localStorage, be aware of XSS risks",
    "Never store tokens in URL parameters",
    "Clear tokens on logout"
])

add_section(doc, "9.2 HTTPS Requirements", level=2)
add_bullet_list(doc, [
    "All API calls must use HTTPS",
    "Reject HTTP connections",
    "Validate SSL certificates",
    "Use TLS 1.2 or higher"
])

add_section(doc, "9.3 Token Handling", level=2)
add_bullet_list(doc, [
    "Refresh tokens before expiration",
    "Handle token expiration gracefully",
    "Don't log tokens in plain text",
    "Invalidate tokens on password change"
])

add_section(doc, "9.4 Rate Limiting", level=2)
add_paragraph(doc, """The API implements rate limiting to prevent abuse:""")
add_table(doc,
    ["Endpoint", "Limit", "Window"],
    [
        ["/api/auth/login", "5 attempts", "15 minutes"],
        ["/api/password/reset-request", "3 attempts", "1 hour"],
        ["/api/password/change", "5 attempts", "1 hour"]
    ],
    [2.5, 1.5, 1.5]
)

# ============================================================================
# 10. CODE EXAMPLES
# ============================================================================
add_section(doc, "10. Code Examples")

add_section(doc, "10.1 JavaScript/TypeScript Example", level=2)
add_code_block(doc, """// Authentication Service
class AuthService {
  private baseUrl = 'https://api.yourserver.com/api';
  private token: string | null = null;

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('token', this.token);
    }
    return data;
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    this.token = null;
    localStorage.removeItem('token');
  }

  getAuthHeader(): object {
    return { 'Authorization': `Bearer ${this.token}` };
  }
}""", "TypeScript")

add_section(doc, "10.2 Python Example", level=2)
add_code_block(doc, """import requests

class AuthClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"username": username, "password": password}
        )
        data = response.json()
        if data.get("success"):
            self.token = data["data"]["token"]
        return data

    def logout(self):
        response = requests.post(
            f"{self.base_url}/api/auth/logout",
            headers=self.get_auth_header()
        )
        self.token = None
        return response.json()

    def get_auth_header(self):
        return {"Authorization": f"Bearer {self.token}"}

# Usage
client = AuthClient("https://api.yourserver.com")
result = client.login("john.doe", "password123")
print(result)""", "Python")

add_section(doc, "10.3 cURL Examples", level=2)
add_code_block(doc, """# Login
curl -X POST https://api.yourserver.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"john.doe","password":"password123"}'

# Use token for authenticated request
curl -X GET https://api.yourserver.com/api/workflows \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Logout
curl -X POST https://api.yourserver.com/api/auth/logout \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
""", "Bash")

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/functions/01_API_Authentication_Manual.docx")
print("API Authentication Manual created successfully!")
