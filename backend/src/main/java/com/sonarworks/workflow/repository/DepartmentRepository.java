package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Optional<Department> findByCode(String code);

    @Query("SELECT d FROM Department d WHERE d.isActive = true ORDER BY d.name")
    List<Department> findAllActive();

    @Query("SELECT d FROM Department d WHERE d.corporate.id = :corporateId AND d.isActive = true ORDER BY d.name")
    List<Department> findByCorporateId(@Param("corporateId") UUID corporateId);

    @Query("SELECT d FROM Department d WHERE d.corporate.id IN :corporateIds AND d.isActive = true ORDER BY d.name")
    List<Department> findByCorporateIds(@Param("corporateIds") List<UUID> corporateIds);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);
}
