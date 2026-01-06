package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.Corporate;
import com.sonarworks.workflow.entity.CorporateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CorporateRepository extends JpaRepository<Corporate, UUID> {

    Optional<Corporate> findByCode(String code);

    Optional<Corporate> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    List<Corporate> findByIsActiveTrue();

    List<Corporate> findByIsActiveTrueOrderByNameAsc();

    List<Corporate> findByCategoryId(UUID categoryId);

    List<Corporate> findByCorporateType(CorporateType corporateType);

    @Query("SELECT c FROM Corporate c WHERE c.isActive = true ORDER BY c.name ASC")
    List<Corporate> findAllActiveOrderByName();
}
