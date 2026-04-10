package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.projects.dto.ProjectDocumentTemplateDTO;
import com.sonar.workflow.projects.entity.ProjectDocumentTemplate;
import com.sonar.workflow.projects.repository.ProjectDocumentTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectDocumentTemplateService {

    private final ProjectDocumentTemplateRepository templateRepository;
    private final ProjectDocumentStorageService storageService;

    @Transactional(readOnly = true)
    public List<ProjectDocumentTemplateDTO> getAllTemplates() {
        return templateRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDocumentTemplateDTO> getTemplatesByCategory(String category) {
        return templateRepository.findByCategoryAndIsActiveTrue(category).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDocumentTemplateDTO uploadTemplate(MultipartFile file, String code, String name, String description, String category) {
        ProjectDocumentStorageService.StorageResult result = storageService.storeFile(file, "templates");

        ProjectDocumentTemplate template = ProjectDocumentTemplate.builder()
                .code(code != null && !code.isBlank() ? code : null)
                .name(name != null && !name.isBlank() ? name : file.getOriginalFilename())
                .description(description)
                .category(category)
                .fileName(file.getOriginalFilename())
                .filePath(result.filePath())
                .storedFilename(result.storedFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .isEncrypted(result.isEncrypted())
                .encryptionIv(result.encryptionIv())
                .build();

        ProjectDocumentTemplate saved = templateRepository.save(template);
        log.info("Document template '{}' uploaded", saved.getName());
        return toDTO(saved);
    }

    public Resource downloadTemplate(UUID id) {
        ProjectDocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Template not found"));

        if (template.getFilePath() == null) {
            throw new BusinessException("No file associated with this template");
        }

        return storageService.loadFile(template.getFilePath(), template.getIsEncrypted() != null && template.getIsEncrypted());
    }

    @Transactional(readOnly = true)
    public ProjectDocumentTemplateDTO getTemplateById(UUID id) {
        ProjectDocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Template not found"));
        return toDTO(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        ProjectDocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Template not found"));

        if (template.getFilePath() != null) {
            storageService.deleteFile(template.getFilePath());
        }

        template.setIsActive(false);
        templateRepository.save(template);
        log.info("Document template '{}' deleted", template.getName());
    }

    private ProjectDocumentTemplateDTO toDTO(ProjectDocumentTemplate t) {
        return ProjectDocumentTemplateDTO.builder()
                .id(t.getId())
                .code(t.getCode())
                .name(t.getName())
                .description(t.getDescription())
                .category(t.getCategory())
                .fileName(t.getFileName())
                .contentType(t.getContentType())
                .fileSize(t.getFileSize())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
