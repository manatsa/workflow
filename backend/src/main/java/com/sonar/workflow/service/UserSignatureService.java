package com.sonar.workflow.service;

import com.sonar.workflow.dto.UserSignatureDTO;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.entity.UserSignature;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.repository.UserRepository;
import com.sonar.workflow.repository.UserSignatureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSignatureService {

    private final UserSignatureRepository signatureRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserSignatureDTO> getSignaturesForCurrentUser() {
        UUID userId = getCurrentUserId();
        return signatureRepository.findByUserIdOrderByCapturedAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSignatureDTO> getSignaturesForUser(UUID userId) {
        return signatureRepository.findByUserIdOrderByCapturedAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserSignatureDTO getCurrentSignature(UUID userId) {
        return signatureRepository.findByUserIdAndIsCurrentTrue(userId)
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional
    public UserSignatureDTO addSignature(String signatureData, String ipAddress) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        // Mark all existing signatures as not current
        signatureRepository.clearCurrentForUser(userId);

        UserSignature signature = UserSignature.builder()
                .user(user)
                .signatureData(signatureData)
                .isCurrent(true)
                .capturedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build();

        signature = signatureRepository.save(signature);
        log.info("New signature captured for user {}", user.getUsername());
        return toDTO(signature);
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new BusinessException("Not authenticated");
        }
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new BusinessException("User not found"));
        return user.getId();
    }

    private UserSignatureDTO toDTO(UserSignature sig) {
        return UserSignatureDTO.builder()
                .id(sig.getId())
                .userId(sig.getUser().getId())
                .signatureData(sig.getSignatureData())
                .isCurrent(sig.getIsCurrent())
                .capturedAt(sig.getCapturedAt())
                .ipAddress(sig.getIpAddress())
                .build();
    }
}
