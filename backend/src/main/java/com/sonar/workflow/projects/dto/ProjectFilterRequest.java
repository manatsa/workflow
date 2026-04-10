package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectFilterRequest {
    private String search;
    private String status;
    private String stage;
    private String priority;
    private String category;
    private UUID managerId;
    private UUID sbuId;
    private LocalDate startDateFrom;
    private LocalDate startDateTo;
    private LocalDate endDateFrom;
    private LocalDate endDateTo;
    private Boolean isActive;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
}
