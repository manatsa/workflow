package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectPhaseRepository extends JpaRepository<ProjectPhase, UUID> {

    List<ProjectPhase> findByProjectIdOrderBySortOrder(UUID projectId);
}
