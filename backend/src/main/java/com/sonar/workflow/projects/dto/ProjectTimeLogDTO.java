package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTimeLogDTO {
    private UUID id;
    private UUID taskId;
    private UUID userId;
    private String taskName;
    private String userName;
    private LocalDate logDate;
    private BigDecimal hours;
    private String description;
    private Boolean isBillable;
    private LocalDateTime createdAt;
}
