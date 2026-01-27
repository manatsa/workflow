package com.sonar.workflow.service;

import com.sonar.workflow.dto.DepartmentDTO;
import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.Corporate;
import com.sonar.workflow.entity.Department;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.CorporateRepository;
import com.sonar.workflow.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CorporateRepository corporateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getActiveDepartments() {
        return departmentRepository.findAllActive().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getDepartmentsByCorporateId(UUID corporateId) {
        return departmentRepository.findByCorporateId(corporateId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getDepartmentsByCorporateIds(List<UUID> corporateIds) {
        if (corporateIds == null || corporateIds.isEmpty()) {
            return getActiveDepartments();
        }
        return departmentRepository.findByCorporateIds(corporateIds).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Department not found"));
        return toDTO(department);
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentByCode(String code) {
        Department department = departmentRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("Department not found"));
        return toDTO(department);
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        if (departmentRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Department code already exists");
        }

        Department department = new Department();
        mapDtoToEntity(dto, department);

        Department saved = departmentRepository.save(department);

        auditService.log(AuditLog.AuditAction.CREATE, "Department", saved.getId(),
                saved.getName(), "Created department: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public DepartmentDTO updateDepartment(UUID id, DepartmentDTO dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Department not found"));

        if (departmentRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("Department code already exists");
        }

        DepartmentDTO oldDto = toDTO(department);
        mapDtoToEntity(dto, department);

        Department saved = departmentRepository.save(department);

        auditService.log(AuditLog.AuditAction.UPDATE, "Department", saved.getId(),
                saved.getName(), "Updated department: " + saved.getName(), oldDto, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Department not found"));

        department.setIsActive(false);
        departmentRepository.save(department);

        auditService.log(AuditLog.AuditAction.DELETE, "Department", department.getId(),
                department.getName(), "Deactivated department: " + department.getName(), null, null);
    }

    @Transactional
    public void hardDeleteDepartment(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Department not found"));

        departmentRepository.delete(department);

        auditService.log(AuditLog.AuditAction.DELETE, "Department", id,
                department.getName(), "Deleted department: " + department.getName(), null, null);
    }

    private void mapDtoToEntity(DepartmentDTO dto, Department department) {
        department.setCode(dto.getCode());
        department.setName(dto.getName());
        department.setDescription(dto.getDescription());
        department.setContactEmail(dto.getContactEmail());
        department.setContactPhone(dto.getContactPhone());
        department.setHeadOfDepartment(dto.getHeadOfDepartment());

        if (dto.getIsActive() != null) {
            department.setIsActive(dto.getIsActive());
        }

        if (dto.getCorporateId() != null) {
            Corporate corporate = corporateRepository.findById(dto.getCorporateId())
                    .orElseThrow(() -> new BusinessException("Corporate not found"));
            department.setCorporate(corporate);
        } else {
            department.setCorporate(null);
        }
    }

    private DepartmentDTO toDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .code(department.getCode())
                .name(department.getName())
                .description(department.getDescription())
                .corporateId(department.getCorporate() != null ? department.getCorporate().getId() : null)
                .corporateName(department.getCorporate() != null ? department.getCorporate().getName() : null)
                .contactEmail(department.getContactEmail())
                .contactPhone(department.getContactPhone())
                .headOfDepartment(department.getHeadOfDepartment())
                .isActive(department.getIsActive())
                .createdAt(department.getCreatedAt())
                .createdBy(department.getCreatedBy())
                .updatedAt(department.getUpdatedAt())
                .updatedBy(department.getUpdatedBy())
                .build();
    }
}
