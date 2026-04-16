package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.SqlObjectDTO;
import com.sonar.workflow.service.SqlObjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sql-objects")
@RequiredArgsConstructor
public class SqlObjectController {

    private final SqlObjectService sqlObjectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SqlObjectDTO>>> getAllSqlObjects() {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.getAllSqlObjects()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SqlObjectDTO>>> getActiveSqlObjects() {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.getActiveSqlObjects()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SqlObjectDTO>> getSqlObjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.getSqlObjectById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SqlObjectDTO>> createSqlObject(@Valid @RequestBody SqlObjectDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("SQL Object created", sqlObjectService.createSqlObject(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SqlObjectDTO>> updateSqlObject(
            @PathVariable UUID id, @Valid @RequestBody SqlObjectDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("SQL Object updated", sqlObjectService.updateSqlObject(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateSqlObject(@PathVariable UUID id) {
        sqlObjectService.activateSqlObject(id);
        return ResponseEntity.ok(ApiResponse.success("SQL Object activated", null));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateSqlObject(@PathVariable UUID id) {
        sqlObjectService.deactivateSqlObject(id);
        return ResponseEntity.ok(ApiResponse.success("SQL Object deactivated", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSqlObject(@PathVariable UUID id) {
        sqlObjectService.deleteSqlObject(id);
        return ResponseEntity.ok(ApiResponse.success("SQL Object deleted", null));
    }

    // Data Management Endpoints

    @GetMapping("/{id}/data")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTableData(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.getTableData(id)));
    }

    @PostMapping("/{id}/data")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addTableRow(
            @PathVariable UUID id, @RequestBody Map<String, Object> rowData) {
        return ResponseEntity.ok(ApiResponse.success("Row added", sqlObjectService.addTableRow(id, rowData)));
    }

    @PutMapping("/{id}/data/{rowId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTableRow(
            @PathVariable UUID id, @PathVariable Long rowId, @RequestBody Map<String, Object> rowData) {
        return ResponseEntity.ok(ApiResponse.success("Row updated", sqlObjectService.updateTableRow(id, rowId, rowData)));
    }

    @DeleteMapping("/{id}/data/{rowId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTableRow(@PathVariable UUID id, @PathVariable Long rowId) {
        sqlObjectService.deleteTableRow(id, rowId);
        return ResponseEntity.ok(ApiResponse.success("Row deleted", null));
    }

    // SQL Table query execution endpoint
    @PostMapping("/execute-query")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executeSqlTableQuery(@RequestBody Map<String, String> body) {
        try {
            String query = body.get("query");
            String columnsJson = body.get("columns");
            return ResponseEntity.ok(ApiResponse.success(sqlObjectService.executeSqlTableQuery(query, columnsJson)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error(e.getMessage() != null ? e.getMessage() : "Query execution failed"));
        }
    }

    // SQL Function query endpoint - used by library SQL functions (SQL_LOOKUP, SQL_QUERY, SQL_COUNT, SQL_SUM, etc.)
    @PostMapping("/function-query")
    public ResponseEntity<ApiResponse<Object>> executeFunctionQuery(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.executeFunctionQuery(body)));
    }

    // Options Endpoint for dropdown fields
    @GetMapping("/{id}/options")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getOptions(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sqlObjectService.getOptionsFromSqlObject(id)));
    }

    // Template / Import / Export
    @GetMapping("/{id}/template")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable UUID id) throws Exception {
        byte[] template = sqlObjectService.generateTemplate(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportData(@PathVariable UUID id) throws Exception {
        byte[] data = sqlObjectService.exportData(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/{id}/import")
    public ResponseEntity<byte[]> importData(
            @PathVariable UUID id, @RequestParam("file") MultipartFile file) throws Exception {
        byte[] resultExcel = sqlObjectService.importData(id, file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=import_results.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resultExcel);
    }
}
