package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.FieldGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FieldGroupRepository extends JpaRepository<FieldGroup, UUID> {

    @Query("SELECT g FROM FieldGroup g WHERE g.form.id = :formId ORDER BY g.displayOrder")
    List<FieldGroup> findByFormId(@Param("formId") UUID formId);
}
