package com.sonar.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScreenNotifierDTO {

    private String id;  // String to accept temp IDs from frontend
    private String screenId;
    private String notifierType;  // EMAIL, USER, ROLE
    private String email;
    private String userId;
    private String userName;
    private String roleId;
    private String roleName;
    private String notifierName;
    private Integer displayOrder;
}
