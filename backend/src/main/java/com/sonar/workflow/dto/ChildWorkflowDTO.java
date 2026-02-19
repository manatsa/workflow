package com.sonar.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChildWorkflowDTO {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private String icon;
    private Boolean isPublished;
    private Boolean isActive;
    private Integer displayOrder;
    private Integer screenCount;
}
