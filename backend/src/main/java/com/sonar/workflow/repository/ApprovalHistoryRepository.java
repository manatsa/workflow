package com.sonar.workflow.repository;

import com.sonar.workflow.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, UUID> {

    @Query("SELECT h FROM ApprovalHistory h WHERE h.workflowInstance.id = :instanceId ORDER BY h.actionDate DESC")
    List<ApprovalHistory> findByWorkflowInstanceId(@Param("instanceId") UUID instanceId);

    @Query("SELECT h FROM ApprovalHistory h WHERE h.approver.id = :userId ORDER BY h.actionDate DESC")
    List<ApprovalHistory> findByApproverId(@Param("userId") UUID userId);

    @Query("SELECT h FROM ApprovalHistory h WHERE h.action = :action ORDER BY h.actionDate DESC")
    List<ApprovalHistory> findByAction(@Param("action") ApprovalHistory.Action action);
}
