package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveApprover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveApproverRepository extends JpaRepository<LeaveApprover, UUID> {

    List<LeaveApprover> findByDepartmentIdOrderByLevelAscDisplayOrderAsc(UUID departmentId);

    List<LeaveApprover> findByDepartmentIdAndLevel(UUID departmentId, Integer level);

    Optional<LeaveApprover> findByDepartmentIdAndUserId(UUID departmentId, UUID userId);

    @Query("SELECT COALESCE(MAX(a.level), 0) FROM LeaveApprover a WHERE a.department.id = :departmentId")
    Integer findMaxLevelByDepartmentId(@Param("departmentId") UUID departmentId);

    void deleteByDepartmentId(UUID departmentId);

    List<LeaveApprover> findByUserId(UUID userId);
}
