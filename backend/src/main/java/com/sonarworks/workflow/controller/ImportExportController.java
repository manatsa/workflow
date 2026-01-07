package com.sonarworks.workflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonarworks.workflow.dto.ApiResponse;
import com.sonarworks.workflow.dto.SettingDTO;
import com.sonarworks.workflow.service.ImportExportService;
import com.sonarworks.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/import-export")
@RequiredArgsConstructor
@Slf4j
public class ImportExportController {

    private final ImportExportService importExportService;
    private final SettingService settingService;
    private final ObjectMapper objectMapper;

    @GetMapping("/template/{entity}")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String entity) {
        try {
            byte[] templateBytes = importExportService.getTemplateBytes(entity);
            String filename = capitalize(entity) + "_Template.xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(templateBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(templateBytes);
        } catch (Exception e) {
            log.error("Failed to generate template for {}", entity, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/import/{entity}")
    public ResponseEntity<ApiResponse<Integer>> importFromExcel(
            @PathVariable String entity,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Please select a file to import"));
            }

            int count = importExportService.importFromStream(entity, file.getInputStream());
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Successfully imported %d %s records", count, entity),
                    count
            ));
        } catch (Exception e) {
            log.error("Failed to import {} from Excel", entity, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to import: " + e.getMessage()));
        }
    }

    @GetMapping("/export/{entity}")
    public ResponseEntity<byte[]> exportToExcel(@PathVariable String entity) {
        try {
            byte[] exportBytes = importExportService.exportEntityToBytes(entity);
            String filename = capitalize(entity) + "_Export.xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(exportBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(exportBytes);
        } catch (Exception e) {
            log.error("Failed to export {}", entity, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/settings/export-json")
    public ResponseEntity<byte[]> exportSettingsJson() {
        try {
            List<SettingDTO> settings = settingService.getAllSettings();
            byte[] jsonBytes = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsBytes(settings);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentDispositionFormData("attachment", "Settings_Export.json");
            headers.setContentLength(jsonBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(jsonBytes);
        } catch (Exception e) {
            log.error("Failed to export settings as JSON", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/settings/import-json")
    public ResponseEntity<ApiResponse<Integer>> importSettingsJson(
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Please select a JSON file to import"));
            }

            List<SettingDTO> settings = objectMapper.readValue(
                    file.getInputStream(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SettingDTO.class)
            );

            int count = 0;
            for (SettingDTO setting : settings) {
                try {
                    settingService.updateSetting(setting.getKey(), setting);
                    count++;
                } catch (Exception e) {
                    log.warn("Failed to import setting {}: {}", setting.getKey(), e.getMessage());
                }
            }

            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Successfully imported %d settings", count),
                    count
            ));
        } catch (Exception e) {
            log.error("Failed to import settings from JSON", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to import: " + e.getMessage()));
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
