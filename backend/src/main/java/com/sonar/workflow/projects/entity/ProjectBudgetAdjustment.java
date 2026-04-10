package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_budget_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectBudgetAdjustment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_line_id", nullable = false)
    private ProjectBudgetLine budgetLine;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false)
    private AdjustmentType adjustmentType;

    @Column(name = "previous_estimated", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal previousEstimated = BigDecimal.ZERO;

    @Column(name = "new_estimated", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal newEstimated = BigDecimal.ZERO;

    @Column(name = "previous_actual", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal previousActual = BigDecimal.ZERO;

    @Column(name = "new_actual", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal newActual = BigDecimal.ZERO;

    @Column(name = "adjustment_amount", precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal adjustmentAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String notes;

    @Column(name = "adjusted_by")
    private String adjustedBy;

    @Column(name = "adjusted_at")
    private LocalDateTime adjustedAt;

    public enum AdjustmentType {
        INITIAL, INCREASE, DECREASE, REALLOCATION, CORRECTION
    }
}
