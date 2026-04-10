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
public class StampDTO {

    private UUID id;
    private String name;
    private String svgContent;
    private String description;
    private String stampColor;
    private Integer displayOrder;
    private Boolean isSystem;
    private Boolean isActive;
}
