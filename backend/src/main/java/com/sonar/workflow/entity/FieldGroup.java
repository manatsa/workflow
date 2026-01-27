package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "field_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldGroup extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private WorkflowForm form;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "screen_id")
    private Screen screen;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "columns")
    private Integer columns = 2;

    @Column(name = "is_collapsible")
    private Boolean isCollapsible = false;

    @Column(name = "is_collapsed_by_default")
    private Boolean isCollapsedByDefault = false;

    @Column(name = "css_class")
    private String cssClass;

    @OneToMany(mappedBy = "fieldGroup", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<WorkflowField> fields = new ArrayList<>();
}
