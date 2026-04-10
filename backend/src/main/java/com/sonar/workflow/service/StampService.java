package com.sonar.workflow.service;

import com.sonar.workflow.dto.StampDTO;
import com.sonar.workflow.entity.Stamp;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.StampRepository;
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
public class StampService {

    private final StampRepository stampRepository;

    @Transactional(readOnly = true)
    public List<StampDTO> getAll() {
        return stampRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StampDTO> getActive() {
        return stampRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StampDTO getById(UUID id) {
        return stampRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new BusinessException("Stamp not found"));
    }

    @Transactional
    public StampDTO create(StampDTO dto) {
        Stamp stamp = Stamp.builder()
                .name(dto.getName())
                .svgContent(dto.getSvgContent())
                .description(dto.getDescription())
                .stampColor(dto.getStampColor() != null ? dto.getStampColor() : "#c62828")
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .isSystem(false)
                .build();
        return toDTO(stampRepository.save(stamp));
    }

    @Transactional
    public StampDTO update(UUID id, StampDTO dto) {
        Stamp stamp = stampRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Stamp not found"));
        stamp.setName(dto.getName());
        if (dto.getSvgContent() != null) stamp.setSvgContent(dto.getSvgContent());
        stamp.setDescription(dto.getDescription());
        if (dto.getStampColor() != null) stamp.setStampColor(dto.getStampColor());
        if (dto.getDisplayOrder() != null) stamp.setDisplayOrder(dto.getDisplayOrder());
        if (dto.getIsActive() != null) stamp.setIsActive(dto.getIsActive());
        return toDTO(stampRepository.save(stamp));
    }

    @Transactional
    public void toggleStatus(UUID id) {
        Stamp stamp = stampRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Stamp not found"));
        stamp.setIsActive(!Boolean.TRUE.equals(stamp.getIsActive()));
        stampRepository.save(stamp);
    }

    @Transactional
    public void delete(UUID id) {
        Stamp stamp = stampRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Stamp not found"));
        if (Boolean.TRUE.equals(stamp.getIsSystem())) {
            throw new BusinessException("System approval seals cannot be deleted");
        }
        stampRepository.delete(stamp);
    }

    private StampDTO toDTO(Stamp s) {
        return StampDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .svgContent(s.getSvgContent())
                .description(s.getDescription())
                .stampColor(s.getStampColor())
                .displayOrder(s.getDisplayOrder())
                .isSystem(s.getIsSystem())
                .isActive(s.getIsActive())
                .build();
    }
}
