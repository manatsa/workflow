package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.PrivilegeDTO;
import com.sonarworks.workflow.entity.Privilege;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.PrivilegeRepository;
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
public class PrivilegeService {

    private final PrivilegeRepository privilegeRepository;

    public List<PrivilegeDTO> getAllPrivileges() {
        return privilegeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PrivilegeDTO> getNonSystemPrivileges() {
        return privilegeRepository.findByIsSystemPrivilegeFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PrivilegeDTO getPrivilegeById(UUID id) {
        Privilege privilege = privilegeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Privilege not found"));
        return toDTO(privilege);
    }

    @Transactional
    public PrivilegeDTO createPrivilege(PrivilegeDTO dto) {
        if (privilegeRepository.existsByName(dto.getName())) {
            throw new BusinessException("Privilege name already exists");
        }

        Privilege privilege = Privilege.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .isSystemPrivilege(dto.getIsSystemPrivilege() != null ? dto.getIsSystemPrivilege() : false)
                .build();

        Privilege saved = privilegeRepository.save(privilege);
        return toDTO(saved);
    }

    @Transactional
    public PrivilegeDTO updatePrivilege(UUID id, PrivilegeDTO dto) {
        Privilege privilege = privilegeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Privilege not found"));

        if (privilege.getIsSystemPrivilege()) {
            throw new BusinessException("System privileges cannot be modified");
        }

        privilege.setDescription(dto.getDescription());
        privilege.setCategory(dto.getCategory());

        Privilege saved = privilegeRepository.save(privilege);
        return toDTO(saved);
    }

    @Transactional
    public void deletePrivilege(UUID id) {
        Privilege privilege = privilegeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Privilege not found"));

        if (privilege.getIsSystemPrivilege()) {
            throw new BusinessException("System privileges cannot be deleted");
        }

        privilegeRepository.delete(privilege);
    }

    private PrivilegeDTO toDTO(Privilege privilege) {
        return PrivilegeDTO.builder()
                .id(privilege.getId())
                .name(privilege.getName())
                .description(privilege.getDescription())
                .category(privilege.getCategory())
                .isSystemPrivilege(privilege.getIsSystemPrivilege())
                .build();
    }
}
