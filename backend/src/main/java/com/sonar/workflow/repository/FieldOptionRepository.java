package com.sonar.workflow.repository;

import com.sonar.workflow.entity.FieldOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FieldOptionRepository extends JpaRepository<FieldOption, UUID> {

    @Query("SELECT o FROM FieldOption o WHERE o.field.id = :fieldId ORDER BY o.displayOrder")
    List<FieldOption> findByFieldId(@Param("fieldId") UUID fieldId);

    @Modifying
    @Query("DELETE FROM FieldOption o WHERE o.field.id = :fieldId")
    void deleteByFieldId(@Param("fieldId") UUID fieldId);
}
