package com.sonar.workflow.service;

import com.sonar.workflow.dto.WorkflowTypeDTO;
import com.sonar.workflow.entity.WorkflowType;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.WorkflowTypeRepository;
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
public class WorkflowTypeService {

    private final WorkflowTypeRepository workflowTypeRepository;

    public List<WorkflowTypeDTO> getAllWorkflowTypes() {
        return workflowTypeRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<WorkflowTypeDTO> getActiveWorkflowTypes() {
        return workflowTypeRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public WorkflowTypeDTO getWorkflowTypeById(UUID id) {
        WorkflowType type = workflowTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow type not found"));
        return toDTO(type);
    }

    @Transactional
    public WorkflowTypeDTO createWorkflowType(WorkflowTypeDTO dto) {
        if (workflowTypeRepository.existsByName(dto.getName())) {
            throw new BusinessException("Workflow type name already exists");
        }
        if (workflowTypeRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Workflow type code already exists");
        }

        WorkflowType type = WorkflowType.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .description(dto.getDescription())
                .icon(dto.getIcon())
                .color(dto.getColor())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();

        WorkflowType saved = workflowTypeRepository.save(type);
        return toDTO(saved);
    }

    @Transactional
    public WorkflowTypeDTO updateWorkflowType(UUID id, WorkflowTypeDTO dto) {
        WorkflowType type = workflowTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow type not found"));

        type.setName(dto.getName());
        type.setDescription(dto.getDescription());
        type.setIcon(dto.getIcon());
        type.setColor(dto.getColor());
        type.setDisplayOrder(dto.getDisplayOrder());

        WorkflowType saved = workflowTypeRepository.save(type);
        return toDTO(saved);
    }

    @Transactional
    public void deleteWorkflowType(UUID id) {
        WorkflowType type = workflowTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Workflow type not found"));
        workflowTypeRepository.delete(type);
    }

    private WorkflowTypeDTO toDTO(WorkflowType type) {
        return WorkflowTypeDTO.builder()
                .id(type.getId())
                .name(type.getName())
                .code(type.getCode())
                .description(type.getDescription())
                .icon(type.getIcon())
                .color(type.getColor())
                .displayOrder(type.getDisplayOrder())
                .isActive(type.getIsActive())
                .build();
    }
}
