package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectTimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTimeLogRepository extends JpaRepository<ProjectTimeLog, UUID> {

    List<ProjectTimeLog> findByTaskId(UUID taskId);

    List<ProjectTimeLog> findByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM ProjectTimeLog t WHERE t.task.id = :taskId")
    BigDecimal sumHoursByTaskId(@Param("taskId") UUID taskId);

    @Query("SELECT COALESCE(SUM(t.hours), 0) FROM ProjectTimeLog t WHERE t.task.project.id = :projectId")
    BigDecimal sumHoursByProjectId(@Param("projectId") UUID projectId);
}
