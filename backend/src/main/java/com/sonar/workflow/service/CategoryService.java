package com.sonar.workflow.service;

import com.sonar.workflow.dto.CategoryDTO;
import com.sonar.workflow.entity.AuditLog;
import com.sonar.workflow.entity.Category;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.CategoryRepository;
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
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));
        return toDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        if (categoryRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Category code already exists");
        }

        Category category = Category.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        Category saved = categoryRepository.save(category);
        auditService.log(AuditLog.AuditAction.CREATE, "Category", saved.getId(),
                saved.getName(), "Category created: " + saved.getName(), null, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public CategoryDTO updateCategory(UUID id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));

        if (categoryRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("Category code already exists");
        }

        CategoryDTO oldValues = toDTO(category);

        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        Category saved = categoryRepository.save(category);
        auditService.log(AuditLog.AuditAction.UPDATE, "Category", saved.getId(),
                saved.getName(), "Category updated: " + saved.getName(), oldValues, toDTO(saved));

        return toDTO(saved);
    }

    @Transactional
    public void activateCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));
        category.setIsActive(true);
        categoryRepository.save(category);

        auditService.log(AuditLog.AuditAction.UPDATE, "Category", category.getId(),
                category.getName(), "Category activated: " + category.getName(), null, null);
    }

    @Transactional
    public void deactivateCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));
        category.setIsActive(false);
        categoryRepository.save(category);

        auditService.log(AuditLog.AuditAction.UPDATE, "Category", category.getId(),
                category.getName(), "Category deactivated: " + category.getName(), null, null);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Category not found"));

        auditService.log(AuditLog.AuditAction.DELETE, "Category", category.getId(),
                category.getName(), "Category deleted: " + category.getName(), toDTO(category), null);

        categoryRepository.delete(category);
    }

    private CategoryDTO toDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .build();
    }
}
