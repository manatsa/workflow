package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.SBUDTO;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.Corporate;
import com.sonarworks.workflow.entity.SBU;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.CorporateRepository;
import com.sonarworks.workflow.repository.SBURepository;
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
public class SBUService {

    private final SBURepository sbuRepository;
    private final CorporateRepository corporateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<SBUDTO> getAllSBUs() {
        return sbuRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SBUDTO> getActiveSBUs() {
        return sbuRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SBUDTO> getRootSBUs() {
        return sbuRepository.findRootSBUs().stream()
                .map(this::toDTOWithChildren)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SBUDTO> getSBUsByCorporateId(UUID corporateId) {
        return sbuRepository.findByCorporateIdAndIsActiveTrue(corporateId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SBUDTO> getSBUsByCorporateIds(List<UUID> corporateIds) {
        return sbuRepository.findByCorporateIdsAndIsActiveTrue(corporateIds).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SBUDTO getSBUById(UUID id) {
        SBU sbu = sbuRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SBU not found"));
        return toDTOWithChildren(sbu);
    }

    @Transactional
    public SBUDTO createSBU(SBUDTO dto) {
        if (sbuRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("SBU code already exists");
        }

        SBU sbu = SBU.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .isRoot(dto.getParentId() == null)
                .address(dto.getAddress())
                .contactEmail(dto.getContactEmail())
                .contactPhone(dto.getContactPhone())
                .build();

        if (dto.getCorporateId() != null) {
            Corporate corporate = corporateRepository.findById(dto.getCorporateId())
                    .orElseThrow(() -> new BusinessException("Corporate not found"));
            sbu.setCorporate(corporate);
        }

        if (dto.getParentId() != null) {
            SBU parent = sbuRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new BusinessException("Parent SBU not found"));
            sbu.setParent(parent);
        }

        SBU saved = sbuRepository.save(sbu);
        auditService.log(AuditLog.AuditAction.CREATE, "SBU", saved.getId(),
                saved.getName(), "SBU created: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public SBUDTO updateSBU(UUID id, SBUDTO dto) {
        SBU sbu = sbuRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SBU not found"));

        SBUDTO oldValues = toDTO(sbu);

        sbu.setName(dto.getName());
        sbu.setDescription(dto.getDescription());
        sbu.setAddress(dto.getAddress());
        sbu.setContactEmail(dto.getContactEmail());
        sbu.setContactPhone(dto.getContactPhone());

        if (dto.getCorporateId() != null) {
            Corporate corporate = corporateRepository.findById(dto.getCorporateId())
                    .orElseThrow(() -> new BusinessException("Corporate not found"));
            sbu.setCorporate(corporate);
        } else {
            sbu.setCorporate(null);
        }

        if (dto.getParentId() != null && !dto.getParentId().equals(sbu.getParent() != null ? sbu.getParent().getId() : null)) {
            SBU parent = sbuRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new BusinessException("Parent SBU not found"));
            sbu.setParent(parent);
            sbu.setIsRoot(false);
        } else if (dto.getParentId() == null) {
            sbu.setParent(null);
            sbu.setIsRoot(true);
        }

        SBU saved = sbuRepository.save(sbu);
        auditService.log(AuditLog.AuditAction.UPDATE, "SBU", saved.getId(),
                saved.getName(), "SBU updated: " + saved.getName(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void activateSBU(UUID id) {
        SBU sbu = sbuRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SBU not found"));
        sbu.setIsActive(true);
        sbuRepository.save(sbu);

        auditService.log(AuditLog.AuditAction.UPDATE, "SBU", sbu.getId(),
                sbu.getName(), "SBU activated: " + sbu.getName(), null, null);
    }

    @Transactional
    public void deactivateSBU(UUID id) {
        SBU sbu = sbuRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SBU not found"));
        sbu.setIsActive(false);
        sbuRepository.save(sbu);

        auditService.log(AuditLog.AuditAction.UPDATE, "SBU", sbu.getId(),
                sbu.getName(), "SBU deactivated: " + sbu.getName(), null, null);
    }

    @Transactional
    public void deleteSBU(UUID id) {
        SBU sbu = sbuRepository.findById(id)
                .orElseThrow(() -> new BusinessException("SBU not found"));

        if (!sbu.getChildren().isEmpty()) {
            throw new BusinessException("Cannot delete SBU with child SBUs");
        }

        auditService.log(AuditLog.AuditAction.DELETE, "SBU", sbu.getId(),
                sbu.getName(), "SBU deleted: " + sbu.getName(), toDTO(sbu), null);

        sbuRepository.delete(sbu);
    }

    private SBUDTO toDTO(SBU sbu) {
        return SBUDTO.builder()
                .id(sbu.getId())
                .code(sbu.getCode())
                .name(sbu.getName())
                .description(sbu.getDescription())
                .corporateId(sbu.getCorporate() != null ? sbu.getCorporate().getId() : null)
                .corporateName(sbu.getCorporate() != null ? sbu.getCorporate().getName() : null)
                .corporateCode(sbu.getCorporate() != null ? sbu.getCorporate().getCode() : null)
                .parentId(sbu.getParent() != null ? sbu.getParent().getId() : null)
                .parentName(sbu.getParent() != null ? sbu.getParent().getName() : null)
                .isRoot(sbu.getIsRoot())
                .isActive(sbu.getIsActive())
                .address(sbu.getAddress())
                .contactEmail(sbu.getContactEmail())
                .contactPhone(sbu.getContactPhone())
                .build();
    }

    private SBUDTO toDTOWithChildren(SBU sbu) {
        SBUDTO dto = toDTO(sbu);
        dto.setChildren(sbu.getChildren().stream()
                .map(this::toDTOWithChildren)
                .collect(Collectors.toList()));
        return dto;
    }
}
