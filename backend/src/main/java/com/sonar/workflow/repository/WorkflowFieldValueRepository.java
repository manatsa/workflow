package com.sonar.workflow.repository;

import com.sonar.workflow.entity.WorkflowFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.field.id = :fieldId AND v.value = :value AND v.workflowInstance.id <> :excludeInstanceId")
    List<WorkflowFieldValue> findByFieldIdAndValueExcludingInstance(
            @Param("fieldId") UUID fieldId,
            @Param("value") String value,
            @Param("excludeInstanceId") UUID excludeInstanceId);

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.field.id = :fieldId AND v.value = :value")
    List<WorkflowFieldValue> findByFieldIdAndValue(
            @Param("fieldId") UUID fieldId,
            @Param("value") String value);

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.workflowInstance.workflow.code = :workflowCode AND v.fieldName = :fieldName AND v.value = :value")
    List<WorkflowFieldValue> findByWorkflowInstance_Workflow_CodeAndFieldNameAndValue(
            @Param("workflowCode") String workflowCode,
            @Param("fieldName") String fieldName,
            @Param("value") String value);

    @Query("SELECT v FROM WorkflowFieldValue v WHERE v.field.id = :fieldId")
    List<WorkflowFieldValue> findByFieldId(@Param("fieldId") UUID fieldId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM WorkflowFieldValue v WHERE v.field.id = :fieldId")
    void deleteByFieldId(@Param("fieldId") UUID fieldId);
}
