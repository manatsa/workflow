package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.ProjectSettingsDTO;
import com.sonar.workflow.projects.entity.ProjectSettings;
import com.sonar.workflow.projects.repository.ProjectSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectSettingsService {

    private final ProjectSettingsRepository settingsRepository;

    @Transactional(readOnly = true)
    public List<ProjectSettingsDTO> getAllSettings() {
        return settingsRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectSettingsDTO> getSettingsByGroup(String group) {
        return settingsRepository.findBySettingGroup(group).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectSettingsDTO getSettingByKey(String key) {
        ProjectSettings setting = settingsRepository.findBySettingKey(key)
                .orElseThrow(() -> new BusinessException("Setting not found: " + key));
        return toDTO(setting);
    }

    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return settingsRepository.findBySettingKey(key)
                .map(ProjectSettings::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional
    public ProjectSettingsDTO createOrUpdateSetting(ProjectSettingsDTO dto) {
        ProjectSettings setting = settingsRepository.findBySettingKey(dto.getSettingKey())
                .orElse(ProjectSettings.builder()
                        .settingKey(dto.getSettingKey())
                        .build());

        setting.setSettingValue(dto.getSettingValue());
        if (dto.getDescription() != null) setting.setDescription(dto.getDescription());
        if (dto.getSettingType() != null) setting.setSettingType(dto.getSettingType());
        if (dto.getSettingGroup() != null) setting.setSettingGroup(dto.getSettingGroup());
        if (dto.getOptions() != null) setting.setOptions(dto.getOptions());
        if (dto.getIsSystem() != null) setting.setIsSystem(dto.getIsSystem());

        ProjectSettings saved = settingsRepository.save(setting);
        log.info("Setting '{}' updated to '{}'", saved.getSettingKey(), saved.getSettingValue());
        return toDTO(saved);
    }

    @Transactional
    public void deleteSetting(UUID id) {
        ProjectSettings setting = settingsRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Setting not found"));
        if (setting.getIsSystem()) {
            throw new BusinessException("Cannot delete system setting: " + setting.getSettingKey());
        }
        settingsRepository.delete(setting);
        log.info("Setting '{}' deleted", setting.getSettingKey());
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void initializeDefaultSettings() {
        createDefaultIfNotExists("project.code.prefix", "PRJ", "Default project code prefix", "STRING", "general");
        createDefaultIfNotExists("project.code.auto_generate", "true", "Auto-generate project codes", "BOOLEAN", "general");
        createDefaultIfNotExists("project.default.priority", "MEDIUM", "Default priority for new projects", "SELECT", "defaults", "LOW,MEDIUM,HIGH,CRITICAL");
        createDefaultIfNotExists("project.approval.required", "true", "Require approval for new projects", "BOOLEAN", "approval");
        createDefaultIfNotExists("project.task.default_hours", "8", "Default estimated hours for tasks", "NUMBER", "tasks");
        createDefaultIfNotExists("project.notification.enabled", "true", "Enable project notifications", "BOOLEAN", "notifications");
        createDefaultIfNotExists("project.budget.currency", "GHS", "Default currency for budgets", "STRING", "budget");
        createDefaultIfNotExists("project.gantt.show_weekends", "false", "Show weekends in Gantt chart", "BOOLEAN", "gantt");
        createDefaultIfNotExists("project.approval.default.workflow.id", "", "Default approval workflow for projects", "UUID", "approval");
    }

    private void createDefaultIfNotExists(String key, String value, String description, String type, String group) {
        createDefaultIfNotExists(key, value, description, type, group, null);
    }

    private void createDefaultIfNotExists(String key, String value, String description, String type, String group, String options) {
        if (!settingsRepository.existsBySettingKey(key)) {
            ProjectSettings setting = ProjectSettings.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .description(description)
                    .settingType(type)
                    .settingGroup(group)
                    .category(group != null ? group : "General")
                    .options(options)
                    .isSystem(true)
                    .build();
            settingsRepository.save(setting);
        } else if (options != null) {
            // Update existing setting to SELECT type with options if it was STRING
            settingsRepository.findBySettingKey(key).ifPresent(s -> {
                if ("STRING".equals(s.getSettingType()) || s.getOptions() == null) {
                    s.setSettingType(type);
                    s.setOptions(options);
                    settingsRepository.save(s);
                }
            });
        }
    }

    private ProjectSettingsDTO toDTO(ProjectSettings s) {
        return ProjectSettingsDTO.builder()
                .id(s.getId())
                .settingKey(s.getSettingKey())
                .settingValue(s.getSettingValue())
                .description(s.getDescription())
                .settingType(s.getSettingType())
                .settingGroup(s.getSettingGroup())
                .options(s.getOptions())
                .isSystem(s.getIsSystem())
                .build();
    }
}
