package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectApprovalRequest {
    private String action; // APPROVED or REJECTED
    private String comments;
}
