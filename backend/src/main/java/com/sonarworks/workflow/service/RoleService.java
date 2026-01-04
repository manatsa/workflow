package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.RoleDTO;
import com.sonarworks.workflow.entity.AuditLog;
import com.sonarworks.workflow.entity.Privilege;
import com.sonarworks.workflow.entity.Role;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.PrivilegeRepository;
import com.sonarworks.workflow.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {

    private final RoleRepository roleRepository;
    private final PrivilegeRepository privilegeRepository;
    private final AuditService auditService;

    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RoleDTO getRoleById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Role not found"));
        return toDTO(role);
    }

    public RoleDTO getRoleByName(String name) {
        Role role = roleRepository.findByName(name)
                .orElseThrow(() -> new BusinessException("Role not found"));
        return toDTO(role);
    }

    @Transactional
    public RoleDTO createRole(RoleDTO dto) {
        if (roleRepository.existsByName(dto.getName())) {
            throw new BusinessException("Role name already exists");
        }

        Role role = Role.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .isSystemRole(dto.getIsSystemRole() != null ? dto.getIsSystemRole() : false)
                .build();

        if (dto.getPrivilegeIds() != null && !dto.getPrivilegeIds().isEmpty()) {
            Set<Privilege> privileges = new HashSet<>(privilegeRepository.findAllById(dto.getPrivilegeIds()));
            role.setPrivileges(privileges);
        }

        Role saved = roleRepository.save(role);
        auditService.log(AuditLog.AuditAction.CREATE, "Role", saved.getId(),
                saved.getName(), "Role created: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public RoleDTO updateRole(UUID id, RoleDTO dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Role not found"));

        if (role.getIsSystemRole()) {
            throw new BusinessException("System roles cannot be modified");
        }

        RoleDTO oldValues = toDTO(role);

        role.setDescription(dto.getDescription());

        if (dto.getPrivilegeIds() != null) {
            Set<Privilege> privileges = new HashSet<>(privilegeRepository.findAllById(dto.getPrivilegeIds()));
            role.setPrivileges(privileges);
        }

        Role saved = roleRepository.save(role);
        auditService.log(AuditLog.AuditAction.UPDATE, "Role", saved.getId(),
                saved.getName(), "Role updated: " + saved.getName(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Role not found"));

        if (role.getIsSystemRole()) {
            throw new BusinessException("System roles cannot be deleted");
        }

        auditService.log(AuditLog.AuditAction.DELETE, "Role", role.getId(),
                role.getName(), "Role deleted: " + role.getName(), toDTO(role), null);

        roleRepository.delete(role);
    }

    private RoleDTO toDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isSystemRole(role.getIsSystemRole())
                .privilegeIds(role.getPrivileges().stream().map(Privilege::getId).collect(Collectors.toSet()))
                .privileges(role.getPrivileges().stream().map(Privilege::getName).collect(Collectors.toSet()))
                .build();
    }
}
