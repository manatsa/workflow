package com.sonar.workflow.projects.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectReportDTO {
    private String reportType;
    private String reportTitle;
    private LocalDateTime generatedAt;
    private String generatedBy;
    private Map<String, Object> parameters;
    private Object data;
    private List<Map<String, Object>> tableData;
    private Map<String, Object> summary;
}
