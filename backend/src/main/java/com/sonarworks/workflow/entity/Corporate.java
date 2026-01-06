package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "corporates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Corporate extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column(columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "corporate_type")
    private CorporateType corporateType;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column
    private String website;

    @OneToMany(mappedBy = "corporate", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<SBU> sbus = new HashSet<>();
}
