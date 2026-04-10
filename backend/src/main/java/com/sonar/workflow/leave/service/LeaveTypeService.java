package com.sonar.workflow.leave.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveTypeDTO;
import com.sonar.workflow.leave.entity.LeaveType;
import com.sonar.workflow.leave.repository.LeaveTypeRepository;
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
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    @Transactional(readOnly = true)
    public List<LeaveTypeDTO> getAllActive() {
        return leaveTypeRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeDTO> getAll() {
        return leaveTypeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeaveTypeDTO getById(UUID id) {
        return toDTO(leaveTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave type not found")));
    }

    @Transactional
    public LeaveTypeDTO create(LeaveTypeDTO dto) {
        if (leaveTypeRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("A leave type with code '" + dto.getCode() + "' already exists");
        }

        LeaveType entity = new LeaveType();
        mapDtoToEntity(dto, entity);
        entity = leaveTypeRepository.save(entity);
        log.info("Created leave type: {}", entity.getCode());
        return toDTO(entity);
    }

    @Transactional
    public LeaveTypeDTO update(UUID id, LeaveTypeDTO dto) {
        LeaveType entity = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave type not found"));

        // Check code uniqueness if changed
        if (!entity.getCode().equals(dto.getCode()) && leaveTypeRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("A leave type with code '" + dto.getCode() + "' already exists");
        }

        mapDtoToEntity(dto, entity);
        entity = leaveTypeRepository.save(entity);
        log.info("Updated leave type: {}", entity.getCode());
        return toDTO(entity);
    }

    @Transactional
    public void delete(UUID id) {
        LeaveType entity = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave type not found"));
        entity.setIsActive(false);
        leaveTypeRepository.save(entity);
        log.info("Soft-deleted leave type: {}", entity.getCode());
    }

    private void mapDtoToEntity(LeaveTypeDTO dto, LeaveType entity) {
        entity.setName(dto.getName());
        entity.setCode(dto.getCode());
        entity.setDescription(dto.getDescription());
        entity.setColorCode(dto.getColorCode() != null ? dto.getColorCode() : "#1976d2");
        entity.setIsPaid(dto.getIsPaid() != null ? dto.getIsPaid() : true);
        entity.setDefaultDaysPerYear(dto.getDefaultDaysPerYear() != null ? dto.getDefaultDaysPerYear() : 0);
        entity.setMaxConsecutiveDays(dto.getMaxConsecutiveDays());
        entity.setRequiresAttachment(dto.getRequiresAttachment() != null ? dto.getRequiresAttachment() : false);
        entity.setAttachmentRequiredAfterDays(dto.getAttachmentRequiredAfterDays());
        entity.setApplicableGender(dto.getApplicableGender() != null ?
                LeaveType.ApplicableGender.valueOf(dto.getApplicableGender()) : LeaveType.ApplicableGender.ALL);
        entity.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
    }

    public LeaveTypeDTO toDTO(LeaveType entity) {
        return LeaveTypeDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .description(entity.getDescription())
                .colorCode(entity.getColorCode())
                .isPaid(entity.getIsPaid())
                .defaultDaysPerYear(entity.getDefaultDaysPerYear())
                .maxConsecutiveDays(entity.getMaxConsecutiveDays())
                .requiresAttachment(entity.getRequiresAttachment())
                .attachmentRequiredAfterDays(entity.getAttachmentRequiredAfterDays())
                .applicableGender(entity.getApplicableGender() != null ? entity.getApplicableGender().name() : "ALL")
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
    }
}
