package com.sonarworks.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandResponse {

    private boolean success;
    private String message;
    private List<String> output;
    private String command;
    private LocalDateTime executedAt;
    private String executedBy;
}
