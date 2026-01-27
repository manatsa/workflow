package com.sonar.workflow.repository;

import com.sonar.workflow.entity.WorkflowField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowFieldRepository extends JpaRepository<WorkflowField, UUID> {

    @Modifying
    @Query("DELETE FROM WorkflowField f WHERE f.id = :fieldId")
    void deleteFieldById(@Param("fieldId") UUID fieldId);

    @Query("SELECT f FROM WorkflowField f WHERE f.form.id = :formId ORDER BY f.displayOrder")
    List<WorkflowField> findByFormId(@Param("formId") UUID formId);

    @Query("SELECT f FROM WorkflowField f WHERE f.fieldGroup.id = :groupId ORDER BY f.displayOrder")
    List<WorkflowField> findByFieldGroupId(@Param("groupId") UUID groupId);

    @Query("SELECT f FROM WorkflowField f WHERE f.form.workflow.id = :workflowId ORDER BY f.form.displayOrder, f.displayOrder")
    List<WorkflowField> findByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT f FROM WorkflowField f WHERE f.isAttachment = true AND f.form.workflow.id = :workflowId")
    Optional<WorkflowField> findAttachmentFieldByWorkflowId(@Param("workflowId") UUID workflowId);

    @Query("SELECT f FROM WorkflowField f WHERE f.isMandatory = true AND f.form.id = :formId")
    List<WorkflowField> findMandatoryFieldsByFormId(@Param("formId") UUID formId);
}
