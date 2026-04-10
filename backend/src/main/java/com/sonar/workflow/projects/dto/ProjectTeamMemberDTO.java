package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTeamMemberDTO {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private String role;
    private String userName;
    private String userEmail;
    private LocalDate joinDate;
    private LocalDate leaveDate;
    private Integer allocationPercentage;
    private String responsibilities;
    private LocalDateTime createdAt;
}
