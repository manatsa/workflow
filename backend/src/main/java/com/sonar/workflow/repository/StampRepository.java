package com.sonar.workflow.repository;

import com.sonar.workflow.entity.Stamp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StampRepository extends JpaRepository<Stamp, UUID> {

    List<Stamp> findByIsActiveTrueOrderByDisplayOrderAsc();

    boolean existsByName(String name);
}
