package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sql_objects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlObject extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String tableName;

    @Column(nullable = false)
    private String displayName;

    @Column
    private String description;

    @Column(name = "value_column")
    private String valueColumn;

    @Column(name = "label_column")
    private String labelColumn;

    @OneToMany(mappedBy = "sqlObject", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<SqlColumn> columns = new ArrayList<>();

    @Column(name = "is_system")
    private Boolean isSystem = false;
}
