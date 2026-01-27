package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowType extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column
    private String description;

    @Column
    private String icon;

    @Column
    private String color;

    @Column(name = "display_order")
    private Integer displayOrder = 0;
}
