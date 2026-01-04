package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.Privilege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrivilegeRepository extends JpaRepository<Privilege, UUID> {

    Optional<Privilege> findByName(String name);

    boolean existsByName(String name);

    List<Privilege> findByCategory(String category);

    List<Privilege> findByIsSystemPrivilegeFalse();
}
