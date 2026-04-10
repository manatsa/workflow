package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveTypeDTO {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private String colorCode;
    private Boolean isPaid;
    private Integer defaultDaysPerYear;
    private Integer maxConsecutiveDays;
    private Boolean requiresAttachment;
    private Integer attachmentRequiredAfterDays;
    private String applicableGender;
    private Integer displayOrder;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}
