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
public class ProjectTaskCommentDTO {
    private UUID id;
    private UUID taskId;
    private UUID authorId;
    private UUID parentCommentId;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
}
