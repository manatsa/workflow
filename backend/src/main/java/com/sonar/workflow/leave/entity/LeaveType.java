package com.sonar.workflow.leave.entity;

import com.sonar.workflow.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leave_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveType extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "color_code")
    @Builder.Default
    private String colorCode = "#1976d2";

    @Column(name = "is_paid")
    @Builder.Default
    private Boolean isPaid = true;

    @Column(name = "default_days_per_year")
    @Builder.Default
    private Integer defaultDaysPerYear = 0;

    @Column(name = "max_consecutive_days")
    private Integer maxConsecutiveDays;

    @Column(name = "requires_attachment")
    @Builder.Default
    private Boolean requiresAttachment = false;

    @Column(name = "attachment_required_after_days")
    private Integer attachmentRequiredAfterDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "applicable_gender")
    @Builder.Default
    private ApplicableGender applicableGender = ApplicableGender.ALL;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    public enum ApplicableGender {
        ALL, MALE, FEMALE
    }
}
