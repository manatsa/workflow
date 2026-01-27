package com.sonar.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailConfigurationStatus {
    private boolean enabled;
    private boolean configured;
    private boolean tested;
    private boolean lastTestSuccess;
    private LocalDateTime lastTestDate;
    private String lastTestError;
    private String smtpHost;
    private Integer smtpPort;
    private String senderEmail;
    private String emailProtocol;
}
