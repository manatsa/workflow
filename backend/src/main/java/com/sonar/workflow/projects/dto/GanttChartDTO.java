package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GanttChartDTO {
    private List<GanttTask> tasks;
    private LocalDate projectStartDate;
    private LocalDate projectEndDate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GanttTask {
        private UUID id;
        private UUID parentId;
        private String name;
        private String type;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer completionPercentage;
        private List<UUID> dependencies;
        private String assigneeName;
        private Boolean isCriticalPath;
        private Boolean isMilestone;
    }
}
