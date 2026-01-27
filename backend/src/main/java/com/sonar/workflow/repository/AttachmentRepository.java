package com.sonar.workflow.repository;

import com.sonar.workflow.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    @Query("SELECT a FROM Attachment a WHERE a.workflowInstance.id = :instanceId")
    List<Attachment> findByWorkflowInstanceId(@Param("instanceId") UUID instanceId);

    @Query("SELECT a FROM Attachment a WHERE a.workflowInstance.workflow.id = :workflowId")
    List<Attachment> findByWorkflowId(@Param("workflowId") UUID workflowId);
}
