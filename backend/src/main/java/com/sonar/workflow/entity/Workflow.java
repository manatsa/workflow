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

    @Column(name = "comments_mandatory")
    private Boolean commentsMandatory = false;

    @Column(name = "comments_mandatory_on_reject")
    private Boolean commentsMandatoryOnReject = true;

    @Column(name = "comments_mandatory_on_escalate")
    private Boolean commentsMandatoryOnEscalate = true;

    @Column(name = "show_summary")
    private Boolean showSummary = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_category")
    private WorkflowCategory workflowCategory = WorkflowCategory.NON_FINANCIAL;

    public enum WorkflowCategory {
        FINANCIAL, NON_FINANCIAL
    }
}
