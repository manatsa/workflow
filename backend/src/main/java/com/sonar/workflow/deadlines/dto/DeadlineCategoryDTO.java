package com.sonar.workflow.deadlines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadlineCategoryDTO {

    private UUID id;
    private String code;
    private String name;
    private String description;
    private Boolean isActive;
}
