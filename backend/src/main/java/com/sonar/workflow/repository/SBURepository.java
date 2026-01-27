package com.sonar.workflow.repository;

import com.sonar.workflow.entity.SBU;
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

    boolean existsByCodeAndIdNot(String code, UUID id);

    @Query("SELECT s FROM SBU s WHERE s.isRoot = true")
    List<SBU> findRootSBUs();

    @Query("SELECT s FROM SBU s WHERE s.parent.id = :parentId")
    List<SBU> findByParentId(UUID parentId);

    List<SBU> findByIsActiveTrue();

    List<SBU> findByIsActiveTrueOrderByNameAsc();

    List<SBU> findByCorporateId(UUID corporateId);

    List<SBU> findByCorporateIdAndIsActiveTrue(UUID corporateId);

    @Query("SELECT s FROM SBU s WHERE s.corporate.id IN :corporateIds AND s.isActive = true ORDER BY s.name ASC")
    List<SBU> findByCorporateIdsAndIsActiveTrue(List<UUID> corporateIds);

    @Query("SELECT s FROM SBU s WHERE s.isActive = true ORDER BY s.name ASC")
    List<SBU> findAllActiveOrderByName();
}
