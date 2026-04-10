package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDependencyDTO {
    private UUID taskId;
    private UUID dependsOnTaskId;
    private String taskName;
    private String dependsOnTaskName;
    @Builder.Default
    private String dependencyType = "FINISH_TO_START";
}
