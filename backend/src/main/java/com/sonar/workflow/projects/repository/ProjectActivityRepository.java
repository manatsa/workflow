package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, UUID> {

    List<ProjectActivity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    List<ProjectActivity> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    List<ProjectActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
