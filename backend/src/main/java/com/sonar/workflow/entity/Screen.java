package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "screens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Screen extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private WorkflowForm form;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column
    private String icon;

    @Column(name = "is_summary_screen")
    private Boolean isSummaryScreen = false;

    @Column(name = "notification_message", length = 1000)
    private String notificationMessage;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "screen_roles",
            joinColumns = @JoinColumn(name = "screen_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "screen_privileges",
            joinColumns = @JoinColumn(name = "screen_id"),
            inverseJoinColumns = @JoinColumn(name = "privilege_id")
    )
    @Builder.Default
    private Set<Privilege> privileges = new HashSet<>();

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<FieldGroup> fieldGroups = new ArrayList<>();

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<WorkflowField> fields = new ArrayList<>();

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ScreenNotifier> notifiers = new ArrayList<>();
}
