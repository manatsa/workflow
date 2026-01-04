package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "privileges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Privilege extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String description;

    @Column
    private String category;

    @Column(name = "is_system_privilege")
    private Boolean isSystemPrivilege = false;
}
