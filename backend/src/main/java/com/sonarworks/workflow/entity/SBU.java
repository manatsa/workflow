package com.sonarworks.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sbus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SBU extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corporate_id")
    private Corporate corporate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private SBU parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<SBU> children = new HashSet<>();

    @OneToMany(mappedBy = "sbu", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Branch> branches = new HashSet<>();

    @Column(name = "is_root")
    private Boolean isRoot = false;

    @Column
    private String address;

    @Column
    private String contactEmail;

    @Column
    private String contactPhone;
}
