package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.SBU;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SBURepository extends JpaRepository<SBU, UUID> {

    Optional<SBU> findByCode(String code);

    Optional<SBU> findByName(String name);

    boolean existsByCode(String code);

    @Query("SELECT s FROM SBU s WHERE s.isRoot = true")
    List<SBU> findRootSBUs();

    @Query("SELECT s FROM SBU s WHERE s.parent.id = :parentId")
    List<SBU> findByParentId(UUID parentId);

    List<SBU> findByIsActiveTrue();
}
