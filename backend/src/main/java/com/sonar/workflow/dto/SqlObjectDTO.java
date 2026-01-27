package com.sonar.workflow.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlObjectDTO {
    private UUID id;
    private String tableName;
    private String displayName;
    private String description;
    private String valueColumn;
    private String labelColumn;
    private List<SqlColumnDTO> columns;
    private Boolean isActive;
    private Boolean isSystem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
