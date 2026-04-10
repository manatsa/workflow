package com.sonar.workflow.projects.dto;

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
public class ProjectDocumentTemplateDTO {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String category;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
