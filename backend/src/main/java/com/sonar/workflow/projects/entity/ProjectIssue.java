package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "project_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectIssue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IssuePriority priority = IssuePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @Enumerated(EnumType.STRING)
    private IssueCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ri_category_id")
    private RiskIssueCategory riCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id")
    private User reportedBy;

    @Column(name = "reported_date")
    private LocalDate reportedDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "impact_description", columnDefinition = "TEXT")
    private String impactDescription;

    public enum IssuePriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum IssueStatus {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
    }

    public enum IssueCategory {
        BUG, CHANGE_REQUEST, RESOURCE, SCOPE, SCHEDULE, BUDGET, QUALITY, OTHER
    }
}
