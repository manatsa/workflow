package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_task_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private ProjectTask task;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private ProjectTaskComment parentComment;
}
