package com.sonar.workflow.repository;

import com.sonar.workflow.entity.SqlObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SqlObjectRepository extends JpaRepository<SqlObject, UUID> {
    List<SqlObject> findByIsActiveTrue();
    Optional<SqlObject> findByTableName(String tableName);
    boolean existsByTableName(String tableName);
}
