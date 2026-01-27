package com.sonar.workflow.service;

import com.sonar.workflow.dto.SettingDTO;
import com.sonar.workflow.entity.Setting;
import com.sonar.workflow.repository.SettingRepository;
import com.sonar.workflow.util.EncryptionUtil;
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
                    if (Boolean.TRUE.equals(setting.getIsEncrypted())) {
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

        // Define the desired tab order
        List<String> tabOrder = List.of(
            "General",
            "Theme Settings",
            "User Settings",
            "Workflow Settings",
            "Mail Settings"
        );

        // Group settings by tab
        Map<String, List<SettingDTO>> grouped = allSettings.stream()
                .map(this::toDTO)
                .collect(Collectors.groupingBy(
                        s -> s.getTab() != null ? s.getTab() : "General",
                        Collectors.toList()
                ));

        // Create ordered map based on tabOrder
        LinkedHashMap<String, List<SettingDTO>> orderedMap = new LinkedHashMap<>();

        // First add tabs in the defined order
        for (String tab : tabOrder) {
            if (grouped.containsKey(tab)) {
                orderedMap.put(tab, grouped.get(tab));
            }
        }

        // Then add any remaining tabs not in the defined order
        for (String tab : grouped.keySet()) {
            if (!orderedMap.containsKey(tab)) {
                orderedMap.put(tab, grouped.get(tab));
            }
        }

        return orderedMap;
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
    public SettingDTO updateSetting(String key, SettingDTO dto) {
        Setting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> new RuntimeException("Setting not found: " + key));

        // Only update value if not encrypted
        if (!Boolean.TRUE.equals(setting.getIsEncrypted()) && dto.getValue() != null && !dto.getValue().equals("********")) {
            setting.setValue(dto.getValue());
        }

        if (dto.getLabel() != null) setting.setLabel(dto.getLabel());
        if (dto.getDescription() != null) setting.setDescription(dto.getDescription());
        if (dto.getCategory() != null) setting.setCategory(dto.getCategory());

        Setting saved = settingRepository.save(setting);
        return toDTO(saved);
    }

    @Transactional
    public void deleteSetting(UUID id) {
        settingRepository.deleteById(id);
    }

    private SettingDTO toDTO(Setting setting) {
        boolean isEncrypted = Boolean.TRUE.equals(setting.getIsEncrypted());
        return SettingDTO.builder()
                .id(setting.getId())
                .key(setting.getKey())
                .value(isEncrypted ? "********" : setting.getValue())
                .label(setting.getLabel())
                .description(setting.getDescription())
                .type(setting.getType())
                .category(setting.getCategory())
                .tab(setting.getTab())
                .isEncrypted(isEncrypted)
                .isSystem(Boolean.TRUE.equals(setting.getIsSystem()))
                .displayOrder(setting.getDisplayOrder())
                .validationRegex(setting.getValidationRegex())
                .defaultValue(setting.getDefaultValue())
                .options(setting.getOptions())
                .build();
    }
}
