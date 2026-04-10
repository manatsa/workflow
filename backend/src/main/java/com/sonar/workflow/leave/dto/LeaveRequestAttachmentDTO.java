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
public class LeaveRequestAttachmentDTO {
    private UUID id;
    private UUID leaveRequestId;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String createdAt;
}
