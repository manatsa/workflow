package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectStatusHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private Project.ProjectStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    private Project.ProjectStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_stage")
    private Project.ProjectStage fromStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_stage")
    private Project.ProjectStage toStage;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changed_by")
    private String changedBy;
}
