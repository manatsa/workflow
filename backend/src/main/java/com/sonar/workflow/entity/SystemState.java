package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemState extends BaseEntity {

    @Column(name = "is_locked")
    private Boolean isLocked = false;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "locked_by")
    private String lockedBy;

    @Column(name = "lock_reason")
    private String lockReason;

    @Column(name = "maintenance_mode")
    private Boolean maintenanceMode = false;

    @Column(name = "maintenance_message", columnDefinition = "TEXT")
    private String maintenanceMessage;
}
