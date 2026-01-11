package com.sonarworks.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTestResult {
    private boolean success;
    private String message;
    private LocalDateTime testDate;
    private String errorDetails;
    private long durationMs;

    public static EmailTestResult success(String message, long durationMs) {
        EmailTestResult result = new EmailTestResult();
        result.setSuccess(true);
        result.setMessage(message);
        result.setTestDate(LocalDateTime.now());
        result.setDurationMs(durationMs);
        return result;
    }

    public static EmailTestResult failure(String message, String errorDetails) {
        EmailTestResult result = new EmailTestResult();
        result.setSuccess(false);
        result.setMessage(message);
        result.setTestDate(LocalDateTime.now());
        result.setErrorDetails(errorDetails);
        return result;
    }
}
