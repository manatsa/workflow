"""
Generate Approval API Functions Manual
"""
import sys
sys.path.insert(0, 'C:/Users/Codebreaker/CODE/Sonarworks/docs')

from doc_generator import *

# Create document
doc = create_document(
    "Approval API Functions",
    "Technical Manual - API Reference"
)

# Table of Contents
sections = [
    "Introduction",
    "Approval Endpoints Overview",
    "List Pending Approvals",
    "Get Approval Details",
    "Approve Workflow",
    "Reject Workflow",
    "Escalate Workflow",
    "Email Approval",
    "Approval History",
    "Error Handling",
    "Code Examples"
]
add_table_of_contents(doc, sections)

# ============================================================================
# 1. INTRODUCTION
# ============================================================================
add_section(doc, "1. Introduction")

add_paragraph(doc, """This manual documents the Approval API functions for the Sonar Workflow System. These APIs enable programmatic management of workflow approval processes including approving, rejecting, and escalating workflow instances.""")

add_paragraph(doc, "API Capabilities:", bold=True)
add_bullet_list(doc, [
    "Retrieve pending approvals",
    "Process approval decisions (approve/reject/escalate)",
    "Add comments to approval actions",
    "Handle email-based approvals",
    "Track approval history"
])

# ============================================================================
# 2. APPROVAL ENDPOINTS OVERVIEW
# ============================================================================
add_section(doc, "2. Approval Endpoints Overview")

add_table(doc,
    ["Method", "Endpoint", "Description"],
    [
        ["GET", "/api/approvals", "List pending approvals"],
        ["GET", "/api/approvals/{id}", "Get approval details"],
        ["POST", "/api/approvals/{id}/approve", "Approve workflow"],
        ["POST", "/api/approvals/{id}/reject", "Reject workflow"],
        ["POST", "/api/approvals/{id}/escalate", "Escalate workflow"],
        ["POST", "/api/email-approval/verify", "Verify email approval token"],
        ["POST", "/api/email-approval/process", "Process email approval action"]
    ],
    [1, 2.5, 3]
)

# ============================================================================
# 3. LIST PENDING APPROVALS
# ============================================================================
add_section(doc, "3. List Pending Approvals")

add_section(doc, "3.1 Endpoint", level=2)
add_code_block(doc, """GET /api/approvals""", "HTTP")

add_section(doc, "3.2 Query Parameters", level=2)
add_table(doc,
    ["Parameter", "Type", "Description"],
    [
        ["page", "integer", "Page number (0-indexed)"],
        ["size", "integer", "Items per page (default: 20)"],
        ["sort", "string", "Sort field and direction"],
        ["workflowCode", "string", "Filter by workflow type"],
        ["sbuId", "string", "Filter by SBU"],
        ["status", "string", "PENDING, ESCALATED"]
    ],
    [1.5, 1, 4]
)

add_section(doc, "3.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "data": {
    "content": [
      {
        "id": "instance-uuid-1",
        "referenceNumber": "WF-2024-00001",
        "workflow": {
          "id": "workflow-uuid",
          "code": "PURCHASE_REQUEST",
          "name": "Purchase Request"
        },
        "initiator": {
          "id": "user-uuid",
          "username": "john.doe",
          "fullName": "John Doe",
          "department": "IT"
        },
        "status": "PENDING",
        "currentLevel": 1,
        "amount": 2500.00,
        "sbu": {
          "id": "sbu-uuid",
          "name": "Finance"
        },
        "submittedAt": "2024-01-15T10:30:00Z",
        "daysInQueue": 2,
        "summary": "Office supplies request for Q1"
      }
    ],
    "totalElements": 15,
    "totalPages": 2,
    "number": 0
  }
}""", "JSON")

# ============================================================================
# 4. GET APPROVAL DETAILS
# ============================================================================
add_section(doc, "4. Get Approval Details")

add_section(doc, "4.1 Endpoint", level=2)
add_code_block(doc, """GET /api/approvals/{instanceId}""", "HTTP")

add_section(doc, "4.2 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "data": {
    "id": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "workflow": {
      "id": "workflow-uuid",
      "code": "PURCHASE_REQUEST",
      "name": "Purchase Request",
      "requireComment": true
    },
    "initiator": {
      "id": "user-uuid",
      "username": "john.doe",
      "fullName": "John Doe",
      "email": "john.doe@company.com",
      "department": "IT"
    },
    "status": "PENDING",
    "currentLevel": 1,
    "amount": 2500.00,
    "sbu": {
      "id": "sbu-uuid",
      "name": "Finance"
    },
    "fieldValues": [
      {
        "field": {
          "id": "field-uuid-1",
          "name": "itemDescription",
          "label": "Item Description",
          "fieldType": "TEXT"
        },
        "value": "Office supplies for Q1 2024",
        "displayValue": "Office supplies for Q1 2024"
      },
      {
        "field": {
          "id": "field-uuid-2",
          "name": "amount",
          "label": "Total Amount",
          "fieldType": "CURRENCY"
        },
        "value": "2500.00",
        "displayValue": "$2,500.00"
      },
      {
        "field": {
          "id": "field-uuid-3",
          "name": "vendor",
          "label": "Vendor",
          "fieldType": "TEXT"
        },
        "value": "Office Depot",
        "displayValue": "Office Depot"
      }
    ],
    "attachments": [
      {
        "id": "attachment-uuid",
        "fileName": "quotation.pdf",
        "contentType": "application/pdf",
        "fileSize": 102400,
        "downloadUrl": "/api/attachments/attachment-uuid/download"
      }
    ],
    "approvalHistory": [
      {
        "id": "history-uuid-1",
        "action": "SUBMITTED",
        "level": 0,
        "actor": {
          "id": "user-uuid",
          "fullName": "John Doe"
        },
        "actionDate": "2024-01-15T10:30:00Z",
        "comments": "Initial submission",
        "source": "SYSTEM"
      }
    ],
    "submittedAt": "2024-01-15T10:30:00Z",
    "canApprove": true,
    "canReject": true,
    "canEscalate": true
  }
}""", "JSON")

# ============================================================================
# 5. APPROVE WORKFLOW
# ============================================================================
add_section(doc, "5. Approve Workflow")

add_section(doc, "5.1 Endpoint", level=2)
add_code_block(doc, """POST /api/approvals/{instanceId}/approve""", "HTTP")

add_section(doc, "5.2 Request Body", level=2)
add_code_block(doc, """{
  "comments": "Reviewed and approved. Budget confirmed."
}""", "JSON")

add_paragraph(doc, "Request Parameters:", bold=True)
add_table(doc,
    ["Parameter", "Type", "Required", "Description"],
    [
        ["comments", "string", "Conditional", "Required if workflow requireComment=true"]
    ],
    [1.5, 1, 1.5, 2.5]
)

add_section(doc, "5.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "message": "Workflow approved successfully",
  "data": {
    "id": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "status": "PENDING",
    "currentLevel": 2,
    "nextApprover": {
      "id": "next-approver-uuid",
      "fullName": "Finance Manager"
    }
  }
}""", "JSON")

add_paragraph(doc, "Final Approval Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "Workflow fully approved",
  "data": {
    "id": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "status": "APPROVED",
    "completedAt": "2024-01-16T15:45:00Z"
  }
}""", "JSON")

# ============================================================================
# 6. REJECT WORKFLOW
# ============================================================================
add_section(doc, "6. Reject Workflow")

add_section(doc, "6.1 Endpoint", level=2)
add_code_block(doc, """POST /api/approvals/{instanceId}/reject""", "HTTP")

add_section(doc, "6.2 Request Body", level=2)
add_code_block(doc, """{
  "comments": "Rejected due to insufficient budget justification. Please resubmit with detailed cost breakdown."
}""", "JSON")

add_paragraph(doc, "Request Parameters:", bold=True)
add_table(doc,
    ["Parameter", "Type", "Required", "Description"],
    [
        ["comments", "string", "Yes", "Reason for rejection (required)"]
    ],
    [1.5, 1, 1, 3]
)

add_section(doc, "6.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "message": "Workflow rejected",
  "data": {
    "id": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "status": "REJECTED",
    "rejectedAt": "2024-01-16T14:30:00Z",
    "rejectedBy": {
      "id": "approver-uuid",
      "fullName": "Manager One"
    }
  }
}""", "JSON")

# ============================================================================
# 7. ESCALATE WORKFLOW
# ============================================================================
add_section(doc, "7. Escalate Workflow")

add_section(doc, "7.1 Endpoint", level=2)
add_code_block(doc, """POST /api/approvals/{instanceId}/escalate""", "HTTP")

add_section(doc, "7.2 Request Body", level=2)
add_code_block(doc, """{
  "comments": "Escalating due to amount exceeding my approval limit.",
  "targetUserId": "target-approver-uuid"
}""", "JSON")

add_paragraph(doc, "Request Parameters:", bold=True)
add_table(doc,
    ["Parameter", "Type", "Required", "Description"],
    [
        ["comments", "string", "Yes", "Reason for escalation"],
        ["targetUserId", "string", "No", "Specific user to escalate to (optional)"]
    ],
    [1.5, 1, 1, 3]
)

add_section(doc, "7.3 Response", level=2)
add_code_block(doc, """{
  "success": true,
  "message": "Workflow escalated successfully",
  "data": {
    "id": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "status": "ESCALATED",
    "currentLevel": 2,
    "escalatedTo": {
      "id": "next-approver-uuid",
      "fullName": "Finance Director"
    }
  }
}""", "JSON")

# ============================================================================
# 8. EMAIL APPROVAL
# ============================================================================
add_section(doc, "8. Email Approval")

add_paragraph(doc, """Email approval allows approvers to process workflows via links in email notifications without logging into the system.""")

add_section(doc, "8.1 Verify Token", level=2)
add_code_block(doc, """POST /api/email-approval/verify""", "HTTP")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "token": "email-approval-token-string"
}""", "JSON")

add_paragraph(doc, "Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "data": {
    "valid": true,
    "instanceId": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "workflowName": "Purchase Request",
    "action": "APPROVE",
    "expiresAt": "2024-01-22T10:30:00Z",
    "instance": {
      "initiator": "John Doe",
      "amount": 2500.00,
      "summary": "Office supplies request"
    }
  }
}""", "JSON")

add_section(doc, "8.2 Process Email Approval", level=2)
add_code_block(doc, """POST /api/email-approval/process""", "HTTP")

add_paragraph(doc, "Request Body:", bold=True)
add_code_block(doc, """{
  "token": "email-approval-token-string",
  "action": "APPROVE",
  "comments": "Approved via email"
}""", "JSON")

add_paragraph(doc, "Response:", bold=True)
add_code_block(doc, """{
  "success": true,
  "message": "Workflow approved successfully via email",
  "data": {
    "instanceId": "instance-uuid",
    "referenceNumber": "WF-2024-00001",
    "status": "APPROVED",
    "actionSource": "EMAIL"
  }
}""", "JSON")

add_section(doc, "8.3 Token Error Responses", level=2)
add_table(doc,
    ["Error", "Description"],
    [
        ["TOKEN_INVALID", "Token is malformed or does not exist"],
        ["TOKEN_EXPIRED", "Token has expired"],
        ["TOKEN_USED", "Token has already been used"],
        ["INSTANCE_ALREADY_PROCESSED", "Workflow is no longer in pending state"]
    ],
    [2.5, 4]
)

# ============================================================================
# 9. APPROVAL HISTORY
# ============================================================================
add_section(doc, "9. Approval History")

add_section(doc, "9.1 Get Instance History", level=2)
add_paragraph(doc, """Approval history is included in the instance detail response. You can also query it separately:""")

add_code_block(doc, """GET /api/workflows/instances/{id}/history""", "HTTP")

add_section(doc, "9.2 History Entry Structure", level=2)
add_code_block(doc, """{
  "id": "history-uuid",
  "action": "APPROVED",
  "level": 1,
  "actor": {
    "id": "user-uuid",
    "username": "manager1",
    "fullName": "Manager One"
  },
  "actionDate": "2024-01-16T14:30:00Z",
  "comments": "Approved. Within budget allocation.",
  "source": "SYSTEM",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}""", "JSON")

add_section(doc, "9.3 Action Types", level=2)
add_table(doc,
    ["Action", "Description"],
    [
        ["SUBMITTED", "Initial submission by initiator"],
        ["APPROVED", "Approved by an approver"],
        ["REJECTED", "Rejected by an approver"],
        ["ESCALATED", "Escalated to higher authority"],
        ["RECALLED", "Recalled by initiator"],
        ["CANCELLED", "Cancelled by initiator or system"],
        ["RETURNED", "Returned to previous level"],
        ["REASSIGNED", "Reassigned to different approver"]
    ],
    [2, 4.5]
)

add_section(doc, "9.4 Action Source Types", level=2)
add_table(doc,
    ["Source", "Description"],
    [
        ["SYSTEM", "Action performed via web interface"],
        ["EMAIL", "Action performed via email approval link"],
        ["API", "Action performed via direct API call"],
        ["SCHEDULER", "Action performed by system scheduler (auto-escalation)"]
    ],
    [1.5, 5]
)

# ============================================================================
# 10. ERROR HANDLING
# ============================================================================
add_section(doc, "10. Error Handling")

add_section(doc, "10.1 Common Errors", level=2)
add_table(doc,
    ["Error Code", "HTTP Status", "Description"],
    [
        ["INSTANCE_NOT_FOUND", "404", "Workflow instance does not exist"],
        ["NOT_ASSIGNED_APPROVER", "403", "User is not the current approver"],
        ["INVALID_STATUS", "400", "Instance is not in approvable state"],
        ["COMMENT_REQUIRED", "422", "Comment is required but not provided"],
        ["ALREADY_PROCESSED", "400", "Instance already processed"],
        ["CANNOT_ESCALATE", "400", "No higher approval level exists"]
    ],
    [2.5, 1, 3]
)

add_section(doc, "10.2 Error Response Format", level=2)
add_code_block(doc, """{
  "success": false,
  "message": "You are not assigned as the approver for this workflow",
  "error": "NOT_ASSIGNED_APPROVER",
  "details": {
    "currentApprover": "manager2",
    "requestingUser": "manager1"
  }
}""", "JSON")

# ============================================================================
# 11. CODE EXAMPLES
# ============================================================================
add_section(doc, "11. Code Examples")

add_section(doc, "11.1 JavaScript Approval Flow", level=2)
add_code_block(doc, """class ApprovalService {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getPendingApprovals() {
    const response = await fetch(`${this.apiUrl}/api/approvals`, {
      headers: this.headers
    });
    return response.json();
  }

  async getApprovalDetail(instanceId) {
    const response = await fetch(`${this.apiUrl}/api/approvals/${instanceId}`, {
      headers: this.headers
    });
    return response.json();
  }

  async approve(instanceId, comments) {
    const response = await fetch(`${this.apiUrl}/api/approvals/${instanceId}/approve`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ comments })
    });
    return response.json();
  }

  async reject(instanceId, comments) {
    const response = await fetch(`${this.apiUrl}/api/approvals/${instanceId}/reject`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ comments })
    });
    return response.json();
  }
}

// Usage
const approvalService = new ApprovalService('https://api.server.com', token);
const pending = await approvalService.getPendingApprovals();
console.log(`${pending.data.totalElements} pending approvals`);

// Approve first one
const result = await approvalService.approve(
  pending.data.content[0].id,
  'Approved - verified and within budget'
);""", "JavaScript")

add_section(doc, "11.2 Python Approval Example", level=2)
add_code_block(doc, """import requests

class ApprovalClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def get_pending(self):
        response = requests.get(
            f"{self.base_url}/api/approvals",
            headers=self.headers
        )
        return response.json()

    def approve(self, instance_id, comments):
        response = requests.post(
            f"{self.base_url}/api/approvals/{instance_id}/approve",
            headers=self.headers,
            json={"comments": comments}
        )
        return response.json()

    def reject(self, instance_id, comments):
        response = requests.post(
            f"{self.base_url}/api/approvals/{instance_id}/reject",
            headers=self.headers,
            json={"comments": comments}
        )
        return response.json()

# Usage
client = ApprovalClient("https://api.server.com", token)
pending = client.get_pending()

for approval in pending["data"]["content"]:
    print(f"{approval['referenceNumber']}: {approval['workflow']['name']}")

# Approve
result = client.approve("instance-uuid", "Approved after review")
print(result)""", "Python")

add_section(doc, "11.3 cURL Examples", level=2)
add_code_block(doc, """# List pending approvals
curl -X GET "https://api.server.com/api/approvals" \\
  -H "Authorization: Bearer $TOKEN"

# Get approval details
curl -X GET "https://api.server.com/api/approvals/instance-uuid" \\
  -H "Authorization: Bearer $TOKEN"

# Approve
curl -X POST "https://api.server.com/api/approvals/instance-uuid/approve" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comments":"Approved after review"}'

# Reject
curl -X POST "https://api.server.com/api/approvals/instance-uuid/reject" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comments":"Rejected - insufficient documentation"}'""", "Bash")

# Save document
save_document(doc, "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals/functions/03_Approval_API_Manual.docx")
print("Approval API Manual created successfully!")
