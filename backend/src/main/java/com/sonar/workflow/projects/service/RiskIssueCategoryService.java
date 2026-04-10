package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.RiskIssueCategoryDTO;
import com.sonar.workflow.projects.entity.RiskIssueCategory;
import com.sonar.workflow.projects.repository.RiskIssueCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RiskIssueCategoryService {

    private final RiskIssueCategoryRepository repository;

    @Transactional(readOnly = true)
    public List<RiskIssueCategoryDTO> getAll() {
        return repository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RiskIssueCategoryDTO> getByType(String type) {
        if ("RISK".equals(type)) {
            return repository.findByTypeInAndIsActiveTrueOrderByNameAsc(
                    Arrays.asList(RiskIssueCategory.CategoryType.RISK, RiskIssueCategory.CategoryType.BOTH)
            ).stream().map(this::toDTO).collect(Collectors.toList());
        } else if ("ISSUE".equals(type)) {
            return repository.findByTypeInAndIsActiveTrueOrderByNameAsc(
                    Arrays.asList(RiskIssueCategory.CategoryType.ISSUE, RiskIssueCategory.CategoryType.BOTH)
            ).stream().map(this::toDTO).collect(Collectors.toList());
        }
        return getAll();
    }

    @Transactional(readOnly = true)
    public RiskIssueCategoryDTO getById(UUID id) {
        return toDTO(repository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found")));
    }

    @Transactional
    public RiskIssueCategoryDTO create(RiskIssueCategoryDTO dto) {
        if (repository.existsByCode(dto.getCode())) {
            throw new BusinessException("Category with code '" + dto.getCode() + "' already exists");
        }
        RiskIssueCategory category = RiskIssueCategory.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .description(dto.getDescription())
                .type(dto.getType() != null ? RiskIssueCategory.CategoryType.valueOf(dto.getType()) : RiskIssueCategory.CategoryType.BOTH)
                .isActive(true)
                .build();
        return toDTO(repository.save(category));
    }

    @Transactional
    public RiskIssueCategoryDTO update(UUID id, RiskIssueCategoryDTO dto) {
        RiskIssueCategory category = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));
        if (dto.getName() != null) category.setName(dto.getName());
        if (dto.getDescription() != null) category.setDescription(dto.getDescription());
        if (dto.getType() != null) category.setType(RiskIssueCategory.CategoryType.valueOf(dto.getType()));
        if (dto.getIsActive() != null) category.setIsActive(dto.getIsActive());
        return toDTO(repository.save(category));
    }

    @Transactional
    public void delete(UUID id) {
        RiskIssueCategory category = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));
        category.setIsActive(false);
        repository.save(category);
    }

    private RiskIssueCategoryDTO toDTO(RiskIssueCategory c) {
        return RiskIssueCategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .code(c.getCode())
                .description(c.getDescription())
                .type(c.getType() != null ? c.getType().name() : null)
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
