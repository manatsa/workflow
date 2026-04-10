package com.sonar.workflow.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicHolidayDTO {
    private UUID id;
    private String name;
    private String date;
    private Integer year;
    private String country;
    private String region;
    private Boolean isRecurring;
    private String description;
    private Boolean isActive;
    private String createdAt;
}
