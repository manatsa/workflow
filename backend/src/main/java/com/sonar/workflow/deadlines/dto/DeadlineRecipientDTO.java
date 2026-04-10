package com.sonar.workflow.deadlines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineRecipientDTO {

    private UUID id;
    private UUID deadlineItemId;
    private UUID userId;
    private String recipientName;
    private String recipientEmail;
    private Boolean notifyOnReminder;
    private Boolean notifyOnOverdue;
    private Boolean notifyOnCompletion;
}
