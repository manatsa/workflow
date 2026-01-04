package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "field_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldOption extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private WorkflowField field;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String value;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column
    private String description;

    @Column
    private String icon;

    @Column
    private String color;
}
