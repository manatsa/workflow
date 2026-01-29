package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "screen_notifiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenNotifier extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;

    @Enumerated(EnumType.STRING)
    @Column(name = "notifier_type", nullable = false)
    private NotifierType notifierType;

    @Column(name = "email")
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "notifier_name")
    private String notifierName;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public enum NotifierType {
        EMAIL, USER, ROLE
    }
}
