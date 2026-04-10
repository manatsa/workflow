package com.sonar.workflow.deadlines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineDashboardDTO {

    private long totalActive;
    private long upcomingCount;
    private long dueSoonCount;
    private long overdueCount;
    private long completedThisMonth;

    private List<DeadlineInstanceDTO> upcomingDeadlines;
    private List<DeadlineInstanceDTO> overdueDeadlines;
    private List<DeadlineInstanceDTO> recentlyCompleted;

    // User-specific badge counts
    private long myOverdueCount;
    private long myDueSoonCount;
}
