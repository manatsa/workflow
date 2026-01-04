package com.sonarworks.workflow.service;

import com.sonarworks.workflow.dto.AttachmentDTO;
import com.sonarworks.workflow.entity.Attachment;
import com.sonarworks.workflow.entity.WorkflowInstance;
import com.sonarworks.workflow.exception.BusinessException;
import com.sonarworks.workflow.repository.AttachmentRepository;
import com.sonarworks.workflow.repository.WorkflowInstanceRepository;
import com.sonarworks.workflow.security.CustomUserDetails;
import com.sonarworks.workflow.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final EncryptionUtil encryptionUtil;

    @Value("${app.storage.attachments-path}")
    private String attachmentsPath;

    public List<AttachmentDTO> getAttachments(UUID instanceId) {
        return attachmentRepository.findByWorkflowInstanceId(instanceId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttachmentDTO uploadAttachment(UUID instanceId, MultipartFile file, String description) {
        WorkflowInstance instance = workflowInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new BusinessException("Workflow instance not found"));

        if (file.isEmpty()) {
            throw new BusinessException("File is empty");
        }

        try {
            String workflowName = instance.getWorkflow().getName().replaceAll("[^a-zA-Z0-9]", "_");
            String dateFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            Path directory = Paths.get(attachmentsPath, workflowName, dateFolder);
            Files.createDirectories(directory);

            String storedFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = directory.resolve(storedFilename);

            // Encrypt and save file
            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(filePath)) {
                EncryptionUtil.EncryptionResult result = encryptionUtil.encryptFile(is, os);
                if (!result.success()) {
                    throw new BusinessException("Failed to encrypt file");
                }

                CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                        .getAuthentication().getPrincipal();

                Attachment attachment = Attachment.builder()
                        .workflowInstance(instance)
                        .originalFilename(file.getOriginalFilename())
                        .storedFilename(storedFilename)
                        .filePath(filePath.toString())
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .isEncrypted(true)
                        .encryptionIv(result.iv())
                        .description(description)
                        .uploadedBy(userDetails.getUsername())
                        .build();

                Attachment saved = attachmentRepository.save(attachment);
                return toDTO(saved);
            }
        } catch (IOException e) {
            log.error("Failed to upload attachment", e);
            throw new BusinessException("Failed to upload attachment: " + e.getMessage());
        }
    }

    public Resource downloadAttachment(UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException("Attachment not found"));

        try {
            Path filePath = Paths.get(attachment.getFilePath());
            if (!Files.exists(filePath)) {
                throw new BusinessException("File not found");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            if (attachment.getIsEncrypted()) {
                if (!encryptionUtil.decryptFile(filePath, baos)) {
                    throw new BusinessException("Failed to decrypt file");
                }
            } else {
                Files.copy(filePath, baos);
            }

            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            log.error("Failed to download attachment", e);
            throw new BusinessException("Failed to download attachment: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteAttachment(UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException("Attachment not found"));

        try {
            Path filePath = Paths.get(attachment.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file from disk: {}", e.getMessage());
        }

        attachmentRepository.delete(attachment);
    }

    private AttachmentDTO toDTO(Attachment attachment) {
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .workflowInstanceId(attachment.getWorkflowInstance().getId())
                .originalFilename(attachment.getOriginalFilename())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .description(attachment.getDescription())
                .uploadedBy(attachment.getUploadedBy())
                .uploadedAt(attachment.getCreatedAt())
                .build();
    }
}
