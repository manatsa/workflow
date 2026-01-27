package com.sonar.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResultDTO {
    private List<Map<String, Object>> columns;
    private List<Map<String, Object>> data;
    private Map<String, Object> summary;
    private String generatedAt;
}
