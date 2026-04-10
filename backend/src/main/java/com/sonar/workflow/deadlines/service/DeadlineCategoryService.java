package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.dto.DeadlineCategoryDTO;
import com.sonar.workflow.deadlines.entity.DeadlineCategory;
import com.sonar.workflow.deadlines.repository.DeadlineCategoryRepository;
import com.sonar.workflow.exception.BusinessException;
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
public class DeadlineCategoryService {

    private final DeadlineCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<DeadlineCategoryDTO> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeadlineCategoryDTO> getActive() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeadlineCategoryDTO getById(UUID id) {
        DeadlineCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline category not found"));
        return toDTO(category);
    }

    @Transactional
    public DeadlineCategoryDTO create(DeadlineCategoryDTO dto) {
        if (categoryRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("A category with code '" + dto.getCode() + "' already exists");
        }
        DeadlineCategory category = DeadlineCategory.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        category = categoryRepository.save(category);
        log.info("Created deadline category: {} ({})", category.getName(), category.getCode());
        return toDTO(category);
    }

    @Transactional
    public DeadlineCategoryDTO update(UUID id, DeadlineCategoryDTO dto) {
        DeadlineCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline category not found"));

        if (categoryRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("A category with code '" + dto.getCode() + "' already exists");
        }

        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            category.setIsActive(dto.getIsActive());
        }
        category = categoryRepository.save(category);
        log.info("Updated deadline category: {} ({})", category.getName(), category.getCode());
        return toDTO(category);
    }

    @Transactional
    public void toggleStatus(UUID id) {
        DeadlineCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline category not found"));
        category.setIsActive(!Boolean.TRUE.equals(category.getIsActive()));
        categoryRepository.save(category);
    }

    @Transactional
    public void delete(UUID id) {
        DeadlineCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deadline category not found"));
        categoryRepository.delete(category);
        log.info("Deleted deadline category: {} ({})", category.getName(), category.getCode());
    }

    private DeadlineCategoryDTO toDTO(DeadlineCategory category) {
        return DeadlineCategoryDTO.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .build();
    }
}
