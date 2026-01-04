package com.sonarworks.workflow.repository;

import com.sonarworks.workflow.entity.SystemState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemStateRepository extends JpaRepository<SystemState, UUID> {

    @Query("SELECT s FROM SystemState s ORDER BY s.createdAt DESC LIMIT 1")
    Optional<SystemState> findCurrentState();
}
