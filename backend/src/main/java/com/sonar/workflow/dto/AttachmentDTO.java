package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("originalFileName")
    public String getOriginalFileName() {
        return originalFilename;
    }
    private String contentType;
    private Long fileSize;
    private String fieldName;
    private String description;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
