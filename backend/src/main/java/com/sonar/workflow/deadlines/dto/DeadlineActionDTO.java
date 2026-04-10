package com.sonar.workflow.deadlines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineActionDTO {

    private UUID id;
    private UUID deadlineItemId;
    private String title;
    private String description;
    private UUID assigneeId;
    private String assigneeName;
    private String assigneeEmail;
    private String status;
    private LocalDateTime completedAt;
    private String completedBy;
    private Integer displayOrder;
    private Integer dueOffsetDays;
}
