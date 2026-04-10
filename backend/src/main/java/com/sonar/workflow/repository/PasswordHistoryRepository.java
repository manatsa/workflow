package com.sonar.workflow.repository;

import com.sonar.workflow.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {

    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.user.id = :userId ORDER BY ph.changedAt DESC")
    List<PasswordHistory> findByUserIdOrderByChangedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.user.id = :userId AND ph.changedAt >= :since ORDER BY ph.changedAt DESC")
    List<PasswordHistory> findByUserIdAndChangedAtAfter(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.user.id = :userId ORDER BY ph.changedAt DESC LIMIT :limit")
    List<PasswordHistory> findRecentByUserId(@Param("userId") UUID userId, @Param("limit") int limit);

    @Modifying
    @Query("DELETE FROM PasswordHistory ph WHERE ph.user.id = :userId AND ph.changedAt < :before")
    void deleteOldEntries(@Param("userId") UUID userId, @Param("before") LocalDateTime before);
}
