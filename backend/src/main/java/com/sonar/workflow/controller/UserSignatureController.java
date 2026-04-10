package com.sonar.workflow.controller;

import com.sonar.workflow.dto.ApiResponse;
import com.sonar.workflow.dto.UserSignatureDTO;
import com.sonar.workflow.service.UserSignatureService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
public class UserSignatureController {

    private final UserSignatureService signatureService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<UserSignatureDTO>>> getMySignatures() {
        return ResponseEntity.ok(ApiResponse.success(signatureService.getSignaturesForCurrentUser()));
    }

    @GetMapping("/me/current")
    public ResponseEntity<ApiResponse<UserSignatureDTO>> getMyCurrentSignature() {
        // Use getSignaturesForCurrentUser to get userId, then get current
        List<UserSignatureDTO> sigs = signatureService.getSignaturesForCurrentUser();
        if (!sigs.isEmpty()) {
            UserSignatureDTO current = sigs.stream().filter(s -> Boolean.TRUE.equals(s.getIsCurrent())).findFirst().orElse(null);
            return ResponseEntity.ok(ApiResponse.success(current));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<UserSignatureDTO>> addSignature(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String signatureData = body.get("signatureData");
        if (signatureData == null || signatureData.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Signature data is required"));
        }
        String ipAddress = request.getRemoteAddr();
        return ResponseEntity.ok(ApiResponse.success("Signature saved successfully",
                signatureService.addSignature(signatureData, ipAddress)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserSignatureDTO>>> getUserSignatures(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(signatureService.getSignaturesForUser(userId)));
    }

    @GetMapping("/user/{userId}/current")
    public ResponseEntity<ApiResponse<UserSignatureDTO>> getUserCurrentSignature(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(signatureService.getCurrentSignature(userId)));
    }
}
