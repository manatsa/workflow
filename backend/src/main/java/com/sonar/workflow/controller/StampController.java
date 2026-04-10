package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.StampDTO;
import com.sonar.workflow.service.StampService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stamps")
@RequiredArgsConstructor
public class StampController {

    private final StampService stampService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StampDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(stampService.getAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<StampDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(stampService.getActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StampDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(stampService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StampDTO>> create(@RequestBody StampDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Stamp created", stampService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StampDTO>> update(@PathVariable UUID id, @RequestBody StampDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Stamp updated", stampService.update(id, dto)));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable UUID id) {
        stampService.toggleStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Status toggled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        stampService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Stamp deleted", null));
    }
}
