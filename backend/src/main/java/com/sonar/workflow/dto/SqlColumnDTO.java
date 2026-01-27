package com.sonar.workflow.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlColumnDTO {
    private UUID id;
    private String columnName;
    private String displayName;
    private String dataType;
    private Integer columnLength;
    private Boolean isNullable;
    private Boolean isPrimaryKey;
    private String defaultValue;
    private Integer displayOrder;
}
