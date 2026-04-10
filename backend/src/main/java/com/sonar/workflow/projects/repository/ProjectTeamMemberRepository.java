package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectTeamMemberRepository extends JpaRepository<ProjectTeamMember, UUID> {

    List<ProjectTeamMember> findByProjectId(UUID projectId);

    List<ProjectTeamMember> findByUserId(UUID userId);

    Optional<ProjectTeamMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    long countByProjectId(UUID projectId);
}
