package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {

    Optional<Branch> findByCode(String code);

    Optional<Branch> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<Branch> findByIsActiveTrue();

    List<Branch> findByIsActiveTrueOrderByNameAsc();

    List<Branch> findBySbuId(UUID sbuId);

    List<Branch> findBySbuIdAndIsActiveTrue(UUID sbuId);

    @Query("SELECT b FROM Branch b WHERE b.sbu.id IN :sbuIds AND b.isActive = true ORDER BY b.name ASC")
    List<Branch> findBySbuIdsAndIsActiveTrue(List<UUID> sbuIds);

    @Query("SELECT b FROM Branch b WHERE b.sbu.corporate.id = :corporateId AND b.isActive = true ORDER BY b.name ASC")
    List<Branch> findByCorporateIdAndIsActiveTrue(UUID corporateId);

    @Query("SELECT b FROM Branch b WHERE b.isActive = true ORDER BY b.name ASC")
    List<Branch> findAllActiveOrderByName();
}
