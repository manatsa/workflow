package com.sonar.workflow.projects.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectDocumentStorageService {

    private final EncryptionUtil encryptionUtil;

    @Value("${app.storage.attachments-path}")
    private String attachmentsPath;

    public record StorageResult(String storedFilename, String filePath, boolean isEncrypted, String encryptionIv) {}

    public StorageResult storeFile(MultipartFile file, String projectCode) {
        if (file.isEmpty()) {
            throw new BusinessException("File is empty");
        }

        try {
            String dateFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            Path directory = Paths.get(attachmentsPath, "projects", projectCode, dateFolder);
            Files.createDirectories(directory);

            String storedFilename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = directory.resolve(storedFilename);

            try (InputStream is = file.getInputStream();
                 OutputStream os = Files.newOutputStream(filePath)) {
                EncryptionUtil.EncryptionResult result = encryptionUtil.encryptFile(is, os);
                if (!result.success()) {
                    throw new BusinessException("Failed to encrypt file");
                }

                return new StorageResult(storedFilename, filePath.toString(), true, result.iv());
            }
        } catch (IOException e) {
            log.error("Failed to store project document", e);
            throw new BusinessException("Failed to store file: " + e.getMessage());
        }
    }

    public Resource loadFile(String filePath, boolean isEncrypted) {
        try {
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                throw new BusinessException("File not found on disk");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            if (isEncrypted) {
                if (!encryptionUtil.decryptFile(path, baos)) {
                    throw new BusinessException("Failed to decrypt file");
                }
            } else {
                Files.copy(path, baos);
            }

            return new ByteArrayResource(baos.toByteArray());
        } catch (IOException e) {
            log.error("Failed to load project document", e);
            throw new BusinessException("Failed to load file: " + e.getMessage());
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Failed to delete file from disk: {}", e.getMessage());
        }
    }
}
