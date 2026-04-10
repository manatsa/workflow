package com.sonar.workflow.repository;

import com.sonar.workflow.entity.UserSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSignatureRepository extends JpaRepository<UserSignature, UUID> {

    List<UserSignature> findByUserIdOrderByCapturedAtDesc(UUID userId);

    Optional<UserSignature> findByUserIdAndIsCurrentTrue(UUID userId);

    @Modifying
    @Query("UPDATE UserSignature s SET s.isCurrent = false WHERE s.user.id = :userId")
    void clearCurrentForUser(@Param("userId") UUID userId);
}
