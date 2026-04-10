package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {

    List<LeaveType> findByIsActiveTrueOrderByDisplayOrderAsc();

    Optional<LeaveType> findByCode(String code);

    boolean existsByCode(String code);
}
