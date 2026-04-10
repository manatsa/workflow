package com.sonar.workflow.leave.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "leave_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeavePolicy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    private String name;

    @Column(name = "days_allowed", nullable = false)
    private Integer daysAllowed;

    @Column(name = "max_carry_over_days")
    @Builder.Default
    private Integer maxCarryOverDays = 0;

    @Column(name = "carry_over_expiry_months")
    @Builder.Default
    private Integer carryOverExpiryMonths = 3;

    @Enumerated(EnumType.STRING)
    @Column(name = "accrual_method", nullable = false)
    @Builder.Default
    private AccrualMethod accrualMethod = AccrualMethod.ANNUAL_UPFRONT;

    @Column(name = "pro_rata_for_new_joiners")
    @Builder.Default
    private Boolean proRataForNewJoiners = true;

    @Column(name = "probation_months")
    @Builder.Default
    private Integer probationMonths = 0;

    @Column(name = "probation_days_allowed")
    private BigDecimal probationDaysAllowed;

    @Column(name = "allow_negative_balance")
    @Builder.Default
    private Boolean allowNegativeBalance = false;

    @Column(name = "max_negative_days")
    @Builder.Default
    private Integer maxNegativeDays = 0;

    @Column(name = "allow_half_day")
    @Builder.Default
    private Boolean allowHalfDay = true;

    @Column(name = "encashment_allowed")
    @Builder.Default
    private Boolean encashmentAllowed = false;

    @Column(name = "max_encashment_days")
    private BigDecimal maxEncashmentDays;

    @Column(name = "min_service_months_for_encashment")
    private Integer minServiceMonthsForEncashment;

    @Column(name = "min_days_before_request")
    @Builder.Default
    private Integer minDaysBeforeRequest = 1;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    public enum AccrualMethod {
        ANNUAL_UPFRONT, MONTHLY, QUARTERLY
    }
}
