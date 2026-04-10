package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, UUID> {

    List<LeavePolicy> findByLeaveTypeId(UUID leaveTypeId);

    Optional<LeavePolicy> findByLeaveTypeIdAndIsDefaultTrue(UUID leaveTypeId);

    List<LeavePolicy> findByIsActiveTrueOrderByLeaveType_NameAsc();
}
