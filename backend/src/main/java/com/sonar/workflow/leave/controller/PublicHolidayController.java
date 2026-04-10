package com.sonar.workflow.leave.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.leave.dto.PublicHolidayDTO;
import com.sonar.workflow.leave.service.PublicHolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave/holidays")
@RequiredArgsConstructor
public class PublicHolidayController {

    private final PublicHolidayService publicHolidayService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PublicHolidayDTO>>> getAll(
            @RequestParam(required = false) Integer year) {
        if (year != null) {
            return ResponseEntity.ok(ApiResponse.success(publicHolidayService.getByYear(year)));
        }
        return ResponseEntity.ok(ApiResponse.success(publicHolidayService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicHolidayDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(publicHolidayService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<PublicHolidayDTO>> create(@RequestBody PublicHolidayDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Public holiday created", publicHolidayService.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<PublicHolidayDTO>> update(@PathVariable UUID id, @RequestBody PublicHolidayDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Public holiday updated", publicHolidayService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        publicHolidayService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Public holiday deleted", null));
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'LEAVE_ADMIN')")
    public ResponseEntity<ApiResponse<List<PublicHolidayDTO>>> bulkImport(@RequestBody List<PublicHolidayDTO> holidays) {
        return ResponseEntity.ok(ApiResponse.success("Holidays imported", publicHolidayService.bulkImport(holidays)));
    }
}
