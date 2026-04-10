package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.util.UUID;

@Entity
@Table(name = "workflow_child_parameters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FilterDef(name = "activeFilter", parameters = @ParamDef(name = "isActive", type = Boolean.class))
@Filter(name = "activeFilter", condition = "is_active = :isActive")
public class WorkflowChildParameter extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_workflow_id", nullable = false)
    @Filter(name = "activeFilter", condition = "is_active = :isActive")
    private Workflow childWorkflow;

    @Column(name = "source_field", nullable = false, length = 100)
    private String sourceField;

    @Column(name = "target_field", nullable = false, length = 100)
    private String targetField;

    @Column(name = "show_in_summary")
    @Builder.Default
    private Boolean showInSummary = true;

    @Column(name = "show_in_email_summary")
    @Builder.Default
    private Boolean showInEmailSummary = true;

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
}
