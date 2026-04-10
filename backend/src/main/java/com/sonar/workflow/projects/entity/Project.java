package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.SBU;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStage stage = ProjectStage.INITIATION;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProjectPriority priority = ProjectPriority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProjectCategory category;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;

    @Column(name = "estimated_budget", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal estimatedBudget = BigDecimal.ZERO;

    @Column(name = "actual_cost", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "completion_percentage")
    @Builder.Default
    private Integer completionPercentage = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sponsor_id")
    private User sponsor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sbu_id")
    private SBU sbu;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "current_approval_level")
    private Integer currentApprovalLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_approver_id")
    private User currentApprover;

    @Column(name = "submitted_for_approval_at")
    private LocalDateTime submittedForApprovalAt;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String objectives;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(columnDefinition = "TEXT")
    private String deliverables;

    @Column(columnDefinition = "TEXT")
    private String assumptions;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectTask> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectPhase> phases = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectMilestone> milestones = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectTeamMember> teamMembers = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectRisk> risks = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectIssue> issues = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectBudgetLine> budgetLines = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectChecklist> checklists = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectStatusHistory> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("level ASC, displayOrder ASC")
    @Builder.Default
    private List<ProjectApprovalStep> approvalSteps = new ArrayList<>();

    public enum ProjectStatus {
        DRAFT, PENDING_APPROVAL, APPROVED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED
    }

    public enum ProjectStage {
        INITIATION, PLANNING, EXECUTION, MONITORING, CLOSING
    }

    public enum ProjectPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

}
