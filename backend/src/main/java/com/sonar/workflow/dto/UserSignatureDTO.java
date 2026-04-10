package com.sonar.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSignatureDTO {

    private UUID id;
    private UUID userId;
    private String signatureData;
    private Boolean isCurrent;
    private LocalDateTime capturedAt;
    private String ipAddress;
}
