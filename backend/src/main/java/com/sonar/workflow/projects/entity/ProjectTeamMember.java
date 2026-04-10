package com.sonar.workflow.projects.entity;

import com.sonar.workflow.entity.BaseEntity;
import com.sonar.workflow.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "project_team_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTeamMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TeamRole role = TeamRole.MEMBER;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "allocation_percentage")
    @Builder.Default
    private Integer allocationPercentage = 100;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    public enum TeamRole {
        PROJECT_MANAGER, TEAM_LEAD, MEMBER, STAKEHOLDER, CONSULTANT, OBSERVER
    }
}
