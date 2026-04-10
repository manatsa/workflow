package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_signatures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSignature extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "signature_data", columnDefinition = "TEXT", nullable = false)
    private String signatureData;

    @Column(name = "is_current")
    @Builder.Default
    private Boolean isCurrent = true;

    @Column(name = "captured_at", nullable = false)
    @Builder.Default
    private LocalDateTime capturedAt = LocalDateTime.now();

    @Column(name = "ip_address")
    private String ipAddress;
}
