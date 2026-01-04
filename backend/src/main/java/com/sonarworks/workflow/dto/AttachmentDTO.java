package com.sonarworks.workflow.dto;

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
public class AttachmentDTO {

    private UUID id;
    private UUID workflowInstanceId;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String description;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
