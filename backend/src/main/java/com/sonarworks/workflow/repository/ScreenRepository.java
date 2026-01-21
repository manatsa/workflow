package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.Screen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScreenRepository extends JpaRepository<Screen, UUID> {

    @Query("SELECT s FROM Screen s WHERE s.form.id = :formId ORDER BY s.displayOrder")
    List<Screen> findByFormId(@Param("formId") UUID formId);
}
