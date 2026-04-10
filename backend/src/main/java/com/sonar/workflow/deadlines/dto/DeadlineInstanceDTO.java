package com.sonar.workflow.deadlines.dto;

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
public class DeadlineInstanceDTO {

    private UUID id;
    private UUID deadlineItemId;
    private String deadlineItemName;
    private String deadlineItemCode;
    private String categoryName;
    private String priority;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime completedAt;
    private String completedBy;
    private String notes;
    private long daysRemaining;
}
