package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectDocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDocumentTemplateRepository extends JpaRepository<ProjectDocumentTemplate, UUID> {

    List<ProjectDocumentTemplate> findByIsActiveTrueOrderByCreatedAtDesc();

    List<ProjectDocumentTemplate> findByCategoryAndIsActiveTrue(String category);
}
