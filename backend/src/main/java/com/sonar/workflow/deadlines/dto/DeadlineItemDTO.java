package com.sonar.workflow.deadlines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineItemDTO {

    private UUID id;
    private String name;
    private String code;
    private String description;
    private UUID categoryId;
    private String categoryName;
    private String priority;
    private String status;
    private String recurrenceType;
    private String reminderDaysBefore;

    private UUID ownerId;
    private String ownerName;
    private UUID sbuId;
    private String sbuName;

    private LocalDate nextDueDate;
    private String nextInstanceStatus;

    private List<DeadlineActionDTO> actions;
    private List<DeadlineRecipientDTO> recipients;
    private List<DeadlineInstanceDTO> instances;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private Boolean isActive;
}
