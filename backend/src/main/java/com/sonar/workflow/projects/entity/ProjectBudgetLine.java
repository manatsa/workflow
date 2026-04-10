package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_budget_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectBudgetLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BudgetCategory category = BudgetCategory.OTHER;

    @Column(name = "estimated_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal estimatedAmount = BigDecimal.ZERO;

    @Column(name = "actual_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "committed_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal committedAmount = BigDecimal.ZERO;

    @Column(name = "original_estimate", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal originalEstimate = BigDecimal.ZERO;

    @Column(name = "approved_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal approvedAmount = BigDecimal.ZERO;

    @Column(name = "forecast_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal forecastAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "budget_date")
    private LocalDate budgetDate;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "budgetLine", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("adjustedAt DESC")
    @Builder.Default
    private List<ProjectBudgetAdjustment> adjustments = new ArrayList<>();

    public enum BudgetCategory {
        LABOR, EQUIPMENT, MATERIALS, SOFTWARE, TRAVEL, TRAINING, CONSULTING, CONTINGENCY, OTHER
    }
}
