package com.sonar.workflow.projects.repository;

import com.sonar.workflow.projects.entity.ProjectSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectSettingsRepository extends JpaRepository<ProjectSettings, UUID> {

    Optional<ProjectSettings> findBySettingKey(String settingKey);

    List<ProjectSettings> findBySettingGroup(String settingGroup);

    boolean existsBySettingKey(String settingKey);
}
