package com.sonar.workflow.repository;

import com.sonar.workflow.entity.SqlColumn;
import com.sonar.workflow.entity.SqlObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SqlColumnRepository extends JpaRepository<SqlColumn, UUID> {
    List<SqlColumn> findBySqlObjectOrderByDisplayOrderAsc(SqlObject sqlObject);
    void deleteBySqlObject(SqlObject sqlObject);
}
