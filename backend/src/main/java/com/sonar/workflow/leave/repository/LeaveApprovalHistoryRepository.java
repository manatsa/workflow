package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeaveApprovalHistoryRepository extends JpaRepository<LeaveApprovalHistory, UUID> {

    List<LeaveApprovalHistory> findByLeaveRequestIdOrderByActionDateAsc(UUID leaveRequestId);
}
