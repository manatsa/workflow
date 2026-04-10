package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.LeaveRequestAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeaveRequestAttachmentRepository extends JpaRepository<LeaveRequestAttachment, UUID> {

    List<LeaveRequestAttachment> findByLeaveRequestId(UUID leaveRequestId);
}
