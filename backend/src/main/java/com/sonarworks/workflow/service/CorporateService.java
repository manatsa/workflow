package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.CorporateDTO;
import com.sonarworks.workflow.dto.SBUDTO;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.Category;
import com.sonarworks.workflow.entity.Corporate;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.CategoryRepository;
import com.sonarworks.workflow.repository.CorporateRepository;
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
public class CorporateService {

    private final CorporateRepository corporateRepository;
    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<CorporateDTO> getAllCorporates() {
        return corporateRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CorporateDTO> getActiveCorporates() {
        return corporateRepository.findAllActiveOrderByName().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CorporateDTO getCorporateById(UUID id) {
        Corporate corporate = corporateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Corporate not found"));
        return toDTOWithSBUs(corporate);
    }

    @Transactional
    public CorporateDTO createCorporate(CorporateDTO dto) {
        if (corporateRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Corporate code already exists");
        }

        Corporate corporate = Corporate.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .address(dto.getAddress())
                .corporateType(dto.getCorporateType())
                .contactEmail(dto.getContactEmail())
                .contactPhone(dto.getContactPhone())
                .website(dto.getWebsite())
                .build();

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new BusinessException("Category not found"));
            corporate.setCategory(category);
        }

        Corporate saved = corporateRepository.save(corporate);
        auditService.log(AuditLog.AuditAction.CREATE, "Corporate", saved.getId(),
                saved.getName(), "Corporate created: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public CorporateDTO updateCorporate(UUID id, CorporateDTO dto) {
        Corporate corporate = corporateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Corporate not found"));

        if (corporateRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("Corporate code already exists");
        }

        CorporateDTO oldValues = toDTO(corporate);

        corporate.setCode(dto.getCode());
        corporate.setName(dto.getName());
        corporate.setDescription(dto.getDescription());
        corporate.setAddress(dto.getAddress());
        corporate.setCorporateType(dto.getCorporateType());
        corporate.setContactEmail(dto.getContactEmail());
        corporate.setContactPhone(dto.getContactPhone());
        corporate.setWebsite(dto.getWebsite());

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new BusinessException("Category not found"));
            corporate.setCategory(category);
        } else {
            corporate.setCategory(null);
        }

        Corporate saved = corporateRepository.save(corporate);
        auditService.log(AuditLog.AuditAction.UPDATE, "Corporate", saved.getId(),
                saved.getName(), "Corporate updated: " + saved.getName(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void activateCorporate(UUID id) {
        Corporate corporate = corporateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Corporate not found"));
        corporate.setIsActive(true);
        corporateRepository.save(corporate);

        auditService.log(AuditLog.AuditAction.UPDATE, "Corporate", corporate.getId(),
                corporate.getName(), "Corporate activated: " + corporate.getName(), null, null);
    }

    @Transactional
    public void deactivateCorporate(UUID id) {
        Corporate corporate = corporateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Corporate not found"));
        corporate.setIsActive(false);
        corporateRepository.save(corporate);

        auditService.log(AuditLog.AuditAction.UPDATE, "Corporate", corporate.getId(),
                corporate.getName(), "Corporate deactivated: " + corporate.getName(), null, null);
    }

    @Transactional
    public void deleteCorporate(UUID id) {
        Corporate corporate = corporateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Corporate not found"));

        if (!corporate.getSbus().isEmpty()) {
            throw new BusinessException("Cannot delete Corporate with associated SBUs");
        }

        auditService.log(AuditLog.AuditAction.DELETE, "Corporate", corporate.getId(),
                corporate.getName(), "Corporate deleted: " + corporate.getName(), toDTO(corporate), null);

        corporateRepository.delete(corporate);
    }

    private CorporateDTO toDTO(Corporate corporate) {
        return CorporateDTO.builder()
                .id(corporate.getId())
                .code(corporate.getCode())
                .name(corporate.getName())
                .description(corporate.getDescription())
                .address(corporate.getAddress())
                .categoryId(corporate.getCategory() != null ? corporate.getCategory().getId() : null)
                .categoryName(corporate.getCategory() != null ? corporate.getCategory().getName() : null)
                .corporateType(corporate.getCorporateType())
                .corporateTypeDisplayName(corporate.getCorporateType() != null ? corporate.getCorporateType().getDisplayName() : null)
                .contactEmail(corporate.getContactEmail())
                .contactPhone(corporate.getContactPhone())
                .website(corporate.getWebsite())
                .isActive(corporate.getIsActive())
                .build();
    }

    private CorporateDTO toDTOWithSBUs(Corporate corporate) {
        CorporateDTO dto = toDTO(corporate);
        dto.setSbus(corporate.getSbus().stream()
                .map(sbu -> SBUDTO.builder()
                        .id(sbu.getId())
                        .code(sbu.getCode())
                        .name(sbu.getName())
                        .isActive(sbu.getIsActive())
                        .build())
                .collect(Collectors.toList()));
        return dto;
    }
}
