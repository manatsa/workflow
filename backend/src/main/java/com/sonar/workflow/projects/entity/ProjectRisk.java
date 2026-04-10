package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "project_risks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRisk extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskProbability probability = RiskProbability.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskImpact impact = RiskImpact.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskStatus status = RiskStatus.IDENTIFIED;

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    @Column(name = "contingency_plan", columnDefinition = "TEXT")
    private String contingencyPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "identified_date")
    private LocalDate identifiedDate;

    @Column(name = "response_date")
    private LocalDate responseDate;

    @Column(name = "risk_category")
    private String riskCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private RiskIssueCategory category;

    public enum RiskProbability {
        VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum RiskImpact {
        VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum RiskStatus {
        IDENTIFIED, ANALYZING, MITIGATING, RESOLVED, ACCEPTED, CLOSED
    }
}
