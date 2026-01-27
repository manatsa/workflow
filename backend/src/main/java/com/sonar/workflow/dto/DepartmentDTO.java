package com.sonar.workflow.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private UUID corporateId;
    private String corporateName;
    private String contactEmail;
    private String contactPhone;
    private String headOfDepartment;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
