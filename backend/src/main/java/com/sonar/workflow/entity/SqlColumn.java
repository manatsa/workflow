package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sql_columns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlColumn extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sql_object_id", nullable = false)
    private SqlObject sqlObject;

    @Column(name = "column_name", nullable = false)
    private String columnName;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false)
    private ColumnDataType dataType = ColumnDataType.VARCHAR;

    @Column(name = "column_length")
    private Integer columnLength = 255;

    @Column(name = "is_nullable")
    private Boolean isNullable = true;

    @Column(name = "is_primary_key")
    private Boolean isPrimaryKey = false;

    @Column(name = "default_value")
    private String defaultValue;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public enum ColumnDataType {
        VARCHAR,
        TEXT,
        INTEGER,
        BIGINT,
        DECIMAL,
        BOOLEAN,
        DATE,
        TIMESTAMP
    }
}
