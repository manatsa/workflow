package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.SettingDTO;
import com.sonarworks.workflow.entity.Setting;
import com.sonarworks.workflow.repository.SettingRepository;
import com.sonarworks.workflow.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingService {

    private final SettingRepository settingRepository;
    private final EncryptionUtil encryptionUtil;

    public String getValue(String key, String defaultValue) {
        return settingRepository.findByKey(key)
                .map(setting -> {
                    if (setting.getIsEncrypted()) {
                        return encryptionUtil.decrypt(setting.getValue());
                    }
                    return setting.getValue();
                })
                .orElse(defaultValue);
    }

    public int getIntValue(String key, int defaultValue) {
        String value = getValue(key, null);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean getBooleanValue(String key, boolean defaultValue) {
        String value = getValue(key, null);
        if (value == null) return defaultValue;
        return Boolean.parseBoolean(value);
    }

    public List<SettingDTO> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<String> getAllTabs() {
        return settingRepository.findAllTabs();
    }

    public List<SettingDTO> getSettingsByTab(String tab) {
        return settingRepository.findByTabOrdered(tab).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Map<String, List<SettingDTO>> getSettingsGroupedByTab() {
        List<Setting> allSettings = settingRepository.findAll();
        return allSettings.stream()
                .map(this::toDTO)
                .collect(Collectors.groupingBy(
                        s -> s.getTab() != null ? s.getTab() : "General",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    @Transactional
    public SettingDTO saveSetting(SettingDTO dto) {
        Setting setting = settingRepository.findByKey(dto.getKey())
                .orElse(new Setting());

        setting.setKey(dto.getKey());
        setting.setLabel(dto.getLabel());
        setting.setDescription(dto.getDescription());
        setting.setType(dto.getType());
        setting.setCategory(dto.getCategory());
        setting.setTab(dto.getTab());
        setting.setDisplayOrder(dto.getDisplayOrder());
        setting.setValidationRegex(dto.getValidationRegex());
        setting.setDefaultValue(dto.getDefaultValue());
        setting.setIsSystem(dto.getIsSystem() != null ? dto.getIsSystem() : false);

        if (dto.getIsEncrypted() != null && dto.getIsEncrypted()) {
            setting.setValue(encryptionUtil.encrypt(dto.getValue()));
            setting.setIsEncrypted(true);
        } else {
            setting.setValue(dto.getValue());
            setting.setIsEncrypted(false);
        }

        Setting saved = settingRepository.save(setting);
        return toDTO(saved);
    }

    @Transactional
    public List<SettingDTO> saveSettings(List<SettingDTO> settings) {
        return settings.stream()
                .map(this::saveSetting)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSetting(UUID id) {
        settingRepository.deleteById(id);
    }

    private SettingDTO toDTO(Setting setting) {
        return SettingDTO.builder()
                .id(setting.getId())
                .key(setting.getKey())
                .value(setting.getIsEncrypted() ? "********" : setting.getValue())
                .label(setting.getLabel())
                .description(setting.getDescription())
                .type(setting.getType())
                .category(setting.getCategory())
                .tab(setting.getTab())
                .isEncrypted(setting.getIsEncrypted())
                .isSystem(setting.getIsSystem())
                .displayOrder(setting.getDisplayOrder())
                .validationRegex(setting.getValidationRegex())
                .defaultValue(setting.getDefaultValue())
                .build();
    }
}
