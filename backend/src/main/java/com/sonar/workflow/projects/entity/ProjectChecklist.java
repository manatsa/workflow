package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_checklists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectChecklist extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ChecklistType type = ChecklistType.CUSTOM;

    @Column(name = "is_template")
    @Builder.Default
    private Boolean isTemplate = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "checklist", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectChecklistItem> items = new ArrayList<>();

    public enum ChecklistType {
        INITIATION, PLANNING, EXECUTION, CLOSING, QUALITY, CUSTOM
    }
}
