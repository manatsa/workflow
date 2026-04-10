package com.sonar.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stamps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stamp extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String svgContent;

    @Column
    private String description;

    @Column(name = "stamp_color")
    @Builder.Default
    private String stampColor = "#c62828";

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = false;
}
