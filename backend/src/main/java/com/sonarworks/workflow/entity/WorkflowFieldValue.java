package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_field_values")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowFieldValue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false)
    private WorkflowInstance workflowInstance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private WorkflowField field;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "field_label")
    private String fieldLabel;

    @Column(name = "field_value", columnDefinition = "TEXT")
    private String value;

    @Column(name = "display_value", columnDefinition = "TEXT")
    private String displayValue;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;
}
