package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.ProjectCategoryDTO;
import com.sonar.workflow.projects.entity.ProjectCategory;
import com.sonar.workflow.projects.repository.ProjectCategoryRepository;
import com.sonar.workflow.projects.repository.ProjectRepository;
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
public class ProjectCategoryService {

    private final ProjectCategoryRepository projectCategoryRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<ProjectCategoryDTO> getAllCategories() {
        return projectCategoryRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectCategoryDTO> getActiveCategories() {
        return projectCategoryRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectCategoryDTO getCategoryById(UUID id) {
        ProjectCategory category = projectCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project category not found"));
        return toDTO(category);
    }

    @Transactional
    public ProjectCategoryDTO createCategory(ProjectCategoryDTO dto) {
        if (projectCategoryRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Project category code already exists");
        }

        ProjectCategory category = ProjectCategory.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        ProjectCategory saved = projectCategoryRepository.save(category);
        log.info("Project category created: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public ProjectCategoryDTO updateCategory(UUID id, ProjectCategoryDTO dto) {
        ProjectCategory category = projectCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project category not found"));

        if (projectCategoryRepository.existsByCodeAndIdNot(dto.getCode(), id)) {
            throw new BusinessException("Project category code already exists");
        }

        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        ProjectCategory saved = projectCategoryRepository.save(category);
        log.info("Project category updated: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public void activateCategory(UUID id) {
        ProjectCategory category = projectCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project category not found"));
        category.setIsActive(true);
        projectCategoryRepository.save(category);
        log.info("Project category activated: {}", category.getName());
    }

    @Transactional
    public void deactivateCategory(UUID id) {
        ProjectCategory category = projectCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project category not found"));
        category.setIsActive(false);
        projectCategoryRepository.save(category);
        log.info("Project category deactivated: {}", category.getName());
    }

    @Transactional
    public void deleteCategory(UUID id) {
        ProjectCategory category = projectCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Project category not found"));

        if (projectRepository.existsByCategoryId(id)) {
            throw new BusinessException("Cannot delete category: it is assigned to one or more projects");
        }

        projectCategoryRepository.delete(category);
        log.info("Project category deleted: {}", category.getName());
    }

    private ProjectCategoryDTO toDTO(ProjectCategory category) {
        return ProjectCategoryDTO.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .build();
    }
}
