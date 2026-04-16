package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "workflows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workflow extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "workflow_type_id")
    private WorkflowType workflowType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "industry_id")
    private Category industry;

    @Column(name = "icon")
    private String icon;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "requires_approval")
    private Boolean requiresApproval = true;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "version_number")
    private Integer versionNumber = 1;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<WorkflowForm> forms = new ArrayList<>();

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("level ASC")
    @Builder.Default
    private List<WorkflowApprover> approvers = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_corporates",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "corporate_id")
    )
    @Builder.Default
    private Set<Corporate> corporates = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_sbus",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "sbu_id")
    )
    @Builder.Default
    private Set<SBU> sbus = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_branches",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "branch_id")
    )
    @Builder.Default
    private Set<Branch> branches = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_departments",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    @Builder.Default
    private Set<Department> departments = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_roles",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "workflow_privileges",
            joinColumns = @JoinColumn(name = "workflow_id"),
            inverseJoinColumns = @JoinColumn(name = "privilege_id")
    )
    @Builder.Default
    private Set<Privilege> privileges = new HashSet<>();

    @Column(name = "comments_mandatory")
    private Boolean commentsMandatory = false;

    @Column(name = "comments_mandatory_on_reject")
    private Boolean commentsMandatoryOnReject = true;

    @Column(name = "comments_mandatory_on_escalate")
    private Boolean commentsMandatoryOnEscalate = true;

    @Column(name = "show_summary")
    private Boolean showSummary = false;

    @Column(name = "show_approval_matrix")
    private Boolean showApprovalMatrix = false;

    @Column(name = "lock_approved")
    private Boolean lockApproved = false;

    @Column(name = "lock_child_on_parent_approval")
    private Boolean lockChildOnParentApproval = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_category")
    private WorkflowCategory workflowCategory = WorkflowCategory.NON_FINANCIAL;

    @Column(name = "title_template", columnDefinition = "TEXT")
    private String titleTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stamp_id")
    private Stamp stamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_workflow_id")
    private Workflow parentWorkflow;

    @OneToMany(mappedBy = "parentWorkflow", fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<Workflow> childWorkflows = new ArrayList<>();

    @OneToMany(mappedBy = "childWorkflow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<WorkflowChildParameter> childParameters = new ArrayList<>();

    // Reminder settings
    @Column(name = "reminder_enabled")
    private Boolean reminderEnabled = false;

    @Column(name = "reminder_frequency_hours")
    private Integer reminderFrequencyHours = 24;

    @Column(name = "reminder_max_count")
    private Integer reminderMaxCount = 3;

    @Column(name = "reminder_start_after_hours")
    private Integer reminderStartAfterHours = 24;

    @Column(name = "escalation_enabled")
    private Boolean escalationEnabled = false;

    @Column(name = "escalation_after_hours")
    private Integer escalationAfterHours = 72;

    @Column(name = "escalation_action")
    @Enumerated(EnumType.STRING)
    private EscalationAction escalationAction = EscalationAction.NOTIFY_ADMIN;

    @Column(name = "reminder_include_submitter")
    private Boolean reminderIncludeSubmitter = false;

    @Column(name = "reminder_email_subject")
    private String reminderEmailSubject;

    @Column(name = "reminder_email_body", columnDefinition = "TEXT")
    private String reminderEmailBody;

    public enum WorkflowCategory {
        FINANCIAL, NON_FINANCIAL
    }

    public enum EscalationAction {
        NOTIFY_ADMIN, AUTO_APPROVE, REASSIGN_NEXT_LEVEL
    }
}
