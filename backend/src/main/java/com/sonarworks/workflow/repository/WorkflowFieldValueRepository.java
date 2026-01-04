package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.WorkflowFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowFieldValueRepository extends JpaRepository<WorkflowFieldValue, UUID> {

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.workflowInstance.id = :instanceId")
    List<WorkflowFieldValue> findByWorkflowInstanceId(@Param("instanceId") UUID instanceId);

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.workflowInstance.id = :instanceId AND v.field.id = :fieldId")
    Optional<WorkflowFieldValue> findByInstanceIdAndFieldId(
            @Param("instanceId") UUID instanceId,
            @Param("fieldId") UUID fieldId);

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.workflowInstance.id = :instanceId AND v.fieldName = :fieldName")
    Optional<WorkflowFieldValue> findByInstanceIdAndFieldName(
            @Param("instanceId") UUID instanceId,
            @Param("fieldName") String fieldName);
}
