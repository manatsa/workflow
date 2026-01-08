package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.EmailApprovalToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailApprovalTokenRepository extends JpaRepository<EmailApprovalToken, UUID> {

    Optional<EmailApprovalToken> findByToken(String token);

    @Query("SELECT t FROM EmailApprovalToken t WHERE t.token = :token AND t.isUsed = false AND t.expiresAt > :now")
    Optional<EmailApprovalToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    @Query("SELECT t FROM EmailApprovalToken t WHERE t.workflowInstance.id = :instanceId AND t.isUsed = false")
    List<EmailApprovalToken> findActiveTokensByInstanceId(@Param("instanceId") UUID instanceId);

    @Modifying
    @Query("UPDATE EmailApprovalToken t SET t.isUsed = true, t.usedAt = :usedAt WHERE t.workflowInstance.id = :instanceId AND t.approvalLevel = :level")
    void invalidateTokensForInstanceAndLevel(@Param("instanceId") UUID instanceId, @Param("level") Integer level, @Param("usedAt") LocalDateTime usedAt);

    @Modifying
    @Query("DELETE FROM EmailApprovalToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
}
