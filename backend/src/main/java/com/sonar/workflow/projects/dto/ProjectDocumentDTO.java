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
public class ProjectDocumentDTO {
    private UUID id;
    private UUID projectId;
    private UUID uploadedById;
    private String name;
    private String fileName;
    private String filePath;
    private String contentType;
    private String category;
    private String description;
    private String uploadedByName;
    private Long fileSize;
    private Integer documentVersion;
    private LocalDateTime createdAt;
}
