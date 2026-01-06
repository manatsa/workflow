package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.BranchDTO;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.Branch;
import com.sonarworks.workflow.entity.SBU;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.BranchRepository;
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
public class BranchService {

    private final BranchRepository branchRepository;
    private final SBURepository sbuRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<BranchDTO> getAllBranches() {
        return branchRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDTO> getActiveBranches() {
        return branchRepository.findAllActiveOrderByName().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDTO> getBranchesBySbuId(UUID sbuId) {
        return branchRepository.findBySbuIdAndIsActiveTrue(sbuId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDTO> getBranchesBySbuIds(List<UUID> sbuIds) {
        return branchRepository.findBySbuIdsAndIsActiveTrue(sbuIds).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDTO> getBranchesByCorporateId(UUID corporateId) {
        return branchRepository.findByCorporateIdAndIsActiveTrue(corporateId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchDTO getBranchById(UUID id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Branch not found"));
        return toDTO(branch);
    }

    @Transactional
    public BranchDTO createBranch(BranchDTO dto) {
        if (branchRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Branch code already exists");
        }

        SBU sbu = sbuRepository.findById(dto.getSbuId())
                .orElseThrow(() -> new BusinessException("SBU not found"));

        Branch branch = Branch.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .address(dto.getAddress())
                .sbu(sbu)
                .contactEmail(dto.getContactEmail())
                .contactPhone(dto.getContactPhone())
                .build();

        Branch saved = branchRepository.save(branch);
        auditService.log(AuditLog.AuditAction.CREATE, "Branch", saved.getId(),
                saved.getName(), "Branch created: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public BranchDTO updateBranch(UUID id, BranchDTO dto) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Branch not found"));

        if (branchRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("Branch code already exists");
        }

        BranchDTO oldValues = toDTO(branch);

        branch.setCode(dto.getCode());
        branch.setName(dto.getName());
        branch.setDescription(dto.getDescription());
        branch.setAddress(dto.getAddress());
        branch.setContactEmail(dto.getContactEmail());
        branch.setContactPhone(dto.getContactPhone());

        if (dto.getSbuId() != null && !dto.getSbuId().equals(branch.getSbu().getId())) {
            SBU sbu = sbuRepository.findById(dto.getSbuId())
                    .orElseThrow(() -> new BusinessException("SBU not found"));
            branch.setSbu(sbu);
        }

        Branch saved = branchRepository.save(branch);
        auditService.log(AuditLog.AuditAction.UPDATE, "Branch", saved.getId(),
                saved.getName(), "Branch updated: " + saved.getName(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void activateBranch(UUID id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Branch not found"));
        branch.setIsActive(true);
        branchRepository.save(branch);

        auditService.log(AuditLog.AuditAction.UPDATE, "Branch", branch.getId(),
                branch.getName(), "Branch activated: " + branch.getName(), null, null);
    }

    @Transactional
    public void deactivateBranch(UUID id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Branch not found"));
        branch.setIsActive(false);
        branchRepository.save(branch);

        auditService.log(AuditLog.AuditAction.UPDATE, "Branch", branch.getId(),
                branch.getName(), "Branch deactivated: " + branch.getName(), null, null);
    }

    @Transactional
    public void deleteBranch(UUID id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Branch not found"));

        auditService.log(AuditLog.AuditAction.DELETE, "Branch", branch.getId(),
                branch.getName(), "Branch deleted: " + branch.getName(), toDTO(branch), null);

        branchRepository.delete(branch);
    }

    private BranchDTO toDTO(Branch branch) {
        return BranchDTO.builder()
                .id(branch.getId())
                .code(branch.getCode())
                .name(branch.getName())
                .description(branch.getDescription())
                .address(branch.getAddress())
                .sbuId(branch.getSbu().getId())
                .sbuName(branch.getSbu().getName())
                .sbuCode(branch.getSbu().getCode())
                .corporateId(branch.getSbu().getCorporate() != null ? branch.getSbu().getCorporate().getId() : null)
                .corporateName(branch.getSbu().getCorporate() != null ? branch.getSbu().getCorporate().getName() : null)
                .contactEmail(branch.getContactEmail())
                .contactPhone(branch.getContactPhone())
                .isActive(branch.getIsActive())
                .build();
    }
}
