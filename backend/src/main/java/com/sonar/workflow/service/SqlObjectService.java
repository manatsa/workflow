package com.sonar.workflow.service;

import com.sonar.workflow.dto.SqlColumnDTO;
import com.sonar.workflow.dto.SqlObjectDTO;
import com.sonar.workflow.entity.SqlColumn;
import com.sonar.workflow.entity.SqlObject;
import com.sonar.workflow.repository.SqlColumnRepository;
import com.sonar.workflow.repository.SqlObjectRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SqlObjectService {

    private final SqlObjectRepository sqlObjectRepository;
    private final SqlColumnRepository sqlColumnRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final String TABLE_PREFIX = "sql_data_";

    public List<SqlObjectDTO> getAllSqlObjects() {
        return sqlObjectRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<SqlObjectDTO> getActiveSqlObjects() {
        return sqlObjectRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SqlObjectDTO getSqlObjectById(UUID id) {
        SqlObject sqlObject = sqlObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));
        return toDTO(sqlObject);
    }

    @Transactional
    public SqlObjectDTO createSqlObject(SqlObjectDTO dto) {
        // Sanitize table name
        String sanitizedTableName = sanitizeTableName(dto.getTableName());

        if (sqlObjectRepository.existsByTableName(sanitizedTableName)) {
            throw new RuntimeException("Table name already exists");
        }

        SqlObject sqlObject = SqlObject.builder()
                .tableName(sanitizedTableName)
                .displayName(dto.getDisplayName())
                .description(dto.getDescription())
                .valueColumn(dto.getValueColumn())
                .labelColumn(dto.getLabelColumn())
                .isSystem(false)
                .build();
        sqlObject.setIsActive(true);

        sqlObject = sqlObjectRepository.save(sqlObject);

        // Create columns
        if (dto.getColumns() != null && !dto.getColumns().isEmpty()) {
            for (int i = 0; i < dto.getColumns().size(); i++) {
                SqlColumnDTO colDto = dto.getColumns().get(i);
                SqlColumn column = SqlColumn.builder()
                        .sqlObject(sqlObject)
                        .columnName(sanitizeColumnName(colDto.getColumnName()))
                        .displayName(colDto.getDisplayName())
                        .dataType(SqlColumn.ColumnDataType.valueOf(colDto.getDataType()))
                        .columnLength(colDto.getColumnLength() != null ? colDto.getColumnLength() : 255)
                        .isNullable(colDto.getIsNullable() != null ? colDto.getIsNullable() : true)
                        .isPrimaryKey(colDto.getIsPrimaryKey() != null ? colDto.getIsPrimaryKey() : false)
                        .defaultValue(colDto.getDefaultValue())
                        .displayOrder(i)
                        .build();
                sqlObject.getColumns().add(column);
            }
        }

        sqlObject = sqlObjectRepository.save(sqlObject);

        // Create the actual database table
        createDynamicTable(sqlObject);

        return toDTO(sqlObject);
    }

    @Transactional
    public SqlObjectDTO updateSqlObject(UUID id, SqlObjectDTO dto) {
        SqlObject sqlObject = sqlObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        // Don't allow changing table name or columns if system table
        if (Boolean.TRUE.equals(sqlObject.getIsSystem())) {
            throw new RuntimeException("Cannot modify system tables");
        }

        sqlObject.setDisplayName(dto.getDisplayName());
        sqlObject.setDescription(dto.getDescription());
        sqlObject.setValueColumn(dto.getValueColumn());
        sqlObject.setLabelColumn(dto.getLabelColumn());

        return toDTO(sqlObjectRepository.save(sqlObject));
    }

    @Transactional
    public void activateSqlObject(UUID id) {
        SqlObject sqlObject = sqlObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));
        sqlObject.setIsActive(true);
        sqlObjectRepository.save(sqlObject);
    }

    @Transactional
    public void deactivateSqlObject(UUID id) {
        SqlObject sqlObject = sqlObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));
        sqlObject.setIsActive(false);
        sqlObjectRepository.save(sqlObject);
    }

    @Transactional
    public void deleteSqlObject(UUID id) {
        SqlObject sqlObject = sqlObjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        if (Boolean.TRUE.equals(sqlObject.getIsSystem())) {
            throw new RuntimeException("Cannot delete system tables");
        }

        // Drop the dynamic table
        dropDynamicTable(sqlObject.getTableName());

        sqlObjectRepository.delete(sqlObject);
    }

    // Data Management Methods

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getTableData(UUID sqlObjectId) {
        SqlObject sqlObject = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        String sql = "SELECT * FROM " + tableName + " ORDER BY id";

        try {
            List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();
            List<String> columnNames = sqlObject.getColumns().stream()
                    .map(SqlColumn::getColumnName)
                    .collect(Collectors.toList());
            columnNames.add(0, "id"); // Add ID column

            List<Map<String, Object>> data = new ArrayList<>();
            for (Object[] row : results) {
                Map<String, Object> rowMap = new LinkedHashMap<>();
                for (int i = 0; i < Math.min(row.length, columnNames.size()); i++) {
                    rowMap.put(columnNames.get(i), row[i]);
                }
                data.add(rowMap);
            }
            return data;
        } catch (Exception e) {
            log.error("Error fetching table data: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public Map<String, Object> addTableRow(UUID sqlObjectId, Map<String, Object> rowData) {
        SqlObject sqlObject = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        List<String> columnNames = new ArrayList<>();
        List<Object> values = new ArrayList<>();

        for (SqlColumn column : sqlObject.getColumns()) {
            if (rowData.containsKey(column.getColumnName())) {
                columnNames.add(column.getColumnName());
                values.add(rowData.get(column.getColumnName()));
            }
        }

        if (columnNames.isEmpty()) {
            throw new RuntimeException("No valid columns provided");
        }

        String columns = String.join(", ", columnNames);
        String placeholders = columnNames.stream().map(c -> "?").collect(Collectors.joining(", "));
        String sql = "INSERT INTO " + tableName + " (" + columns + ") VALUES (" + placeholders + ")";

        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < values.size(); i++) {
            query.setParameter(i + 1, values.get(i));
        }
        query.executeUpdate();

        return rowData;
    }

    @Transactional
    public Map<String, Object> updateTableRow(UUID sqlObjectId, Long rowId, Map<String, Object> rowData) {
        SqlObject sqlObject = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        List<String> setClauses = new ArrayList<>();
        List<Object> values = new ArrayList<>();

        for (SqlColumn column : sqlObject.getColumns()) {
            if (rowData.containsKey(column.getColumnName())) {
                setClauses.add(column.getColumnName() + " = ?");
                values.add(rowData.get(column.getColumnName()));
            }
        }

        if (setClauses.isEmpty()) {
            throw new RuntimeException("No valid columns provided");
        }

        String sql = "UPDATE " + tableName + " SET " + String.join(", ", setClauses) + " WHERE id = ?";
        values.add(rowId);

        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < values.size(); i++) {
            query.setParameter(i + 1, values.get(i));
        }
        query.executeUpdate();

        return rowData;
    }

    @Transactional
    public void deleteTableRow(UUID sqlObjectId, Long rowId) {
        SqlObject sqlObject = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        String sql = "DELETE FROM " + tableName + " WHERE id = ?";

        entityManager.createNativeQuery(sql)
                .setParameter(1, rowId)
                .executeUpdate();
    }

    // Get options for dropdown fields
    @SuppressWarnings("unchecked")
    public List<Map<String, String>> getOptionsFromSqlObject(UUID sqlObjectId) {
        SqlObject sqlObject = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        String valueColumn = sqlObject.getValueColumn();
        String labelColumn = sqlObject.getLabelColumn();

        // Check for null or empty columns - if not configured, try to use first two columns from schema
        if (valueColumn == null || valueColumn.trim().isEmpty() ||
            labelColumn == null || labelColumn.trim().isEmpty()) {

            // Try to get columns from the SQL Object definition
            List<SqlColumn> columns = sqlObject.getColumns();
            if (columns != null && columns.size() >= 2) {
                // Use first column as value, second as label
                valueColumn = columns.get(0).getColumnName();
                labelColumn = columns.get(1).getColumnName();
                log.warn("Value/Label columns not configured for SQL Object '{}', using defaults: value={}, label={}",
                         sqlObject.getDisplayName(), valueColumn, labelColumn);
            } else if (columns != null && columns.size() == 1) {
                // Use same column for both
                valueColumn = columns.get(0).getColumnName();
                labelColumn = columns.get(0).getColumnName();
                log.warn("Only one column available for SQL Object '{}', using it for both value and label",
                         sqlObject.getDisplayName());
            } else {
                log.error("SQL Object '{}' has no columns configured and no value/label columns set",
                          sqlObject.getDisplayName());
                return new ArrayList<>();
            }
        }

        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        String sql = "SELECT " + valueColumn + ", " + labelColumn +
                     " FROM " + tableName + " ORDER BY " + labelColumn;

        try {
            List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();
            List<Map<String, String>> options = new ArrayList<>();
            for (Object[] row : results) {
                Map<String, String> option = new HashMap<>();
                option.put("value", row[0] != null ? row[0].toString() : "");
                option.put("label", row[1] != null ? row[1].toString() : "");
                options.add(option);
            }
            return options;
        } catch (Exception e) {
            log.error("Error fetching options from SQL Object '{}': {}", sqlObject.getDisplayName(), e.getMessage());
            return new ArrayList<>();
        }
    }

    // Dynamic Table Management

    @Transactional
    public void createDynamicTable(SqlObject sqlObject) {
        String tableName = TABLE_PREFIX + sqlObject.getTableName();
        StringBuilder sql = new StringBuilder("CREATE TABLE IF NOT EXISTS " + tableName + " (");
        sql.append("id BIGSERIAL PRIMARY KEY");

        for (SqlColumn column : sqlObject.getColumns()) {
            sql.append(", ");
            sql.append(column.getColumnName()).append(" ");
            sql.append(getPostgresType(column.getDataType(), column.getColumnLength()));
            if (Boolean.FALSE.equals(column.getIsNullable())) {
                sql.append(" NOT NULL");
            }
            if (column.getDefaultValue() != null && !column.getDefaultValue().isEmpty()) {
                sql.append(" DEFAULT '").append(column.getDefaultValue()).append("'");
            }
        }

        sql.append(")");

        try {
            entityManager.createNativeQuery(sql.toString()).executeUpdate();
            log.info("Created dynamic table: " + tableName);
        } catch (Exception e) {
            log.error("Error creating dynamic table: " + e.getMessage());
            throw new RuntimeException("Failed to create table: " + e.getMessage());
        }
    }

    @Transactional
    public void dropDynamicTable(String tableName) {
        String fullTableName = TABLE_PREFIX + tableName;
        String sql = "DROP TABLE IF EXISTS " + fullTableName;

        try {
            entityManager.createNativeQuery(sql).executeUpdate();
            log.info("Dropped dynamic table: " + fullTableName);
        } catch (Exception e) {
            log.error("Error dropping dynamic table: " + e.getMessage());
        }
    }

    private String getPostgresType(SqlColumn.ColumnDataType dataType, Integer length) {
        return switch (dataType) {
            case VARCHAR -> "VARCHAR(" + (length != null ? length : 255) + ")";
            case TEXT -> "TEXT";
            case INTEGER -> "INTEGER";
            case BIGINT -> "BIGINT";
            case DECIMAL -> "DECIMAL(19,4)";
            case BOOLEAN -> "BOOLEAN";
            case DATE -> "DATE";
            case TIMESTAMP -> "TIMESTAMP";
        };
    }

    private String sanitizeTableName(String name) {
        if (name == null) return null;
        return name.toLowerCase()
                .replaceAll("[^a-z0-9_]", "_")
                .replaceAll("^[0-9]", "_$0")
                .replaceAll("__+", "_");
    }

    private String sanitizeColumnName(String name) {
        if (name == null) return null;
        return name.toLowerCase()
                .replaceAll("[^a-z0-9_]", "_")
                .replaceAll("^[0-9]", "_$0")
                .replaceAll("__+", "_");
    }

    private SqlObjectDTO toDTO(SqlObject entity) {
        return SqlObjectDTO.builder()
                .id(entity.getId())
                .tableName(entity.getTableName())
                .displayName(entity.getDisplayName())
                .description(entity.getDescription())
                .valueColumn(entity.getValueColumn())
                .labelColumn(entity.getLabelColumn())
                .isActive(entity.getIsActive())
                .isSystem(entity.getIsSystem())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .columns(entity.getColumns().stream()
                        .map(this::toColumnDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    private SqlColumnDTO toColumnDTO(SqlColumn column) {
        return SqlColumnDTO.builder()
                .id(column.getId())
                .columnName(column.getColumnName())
                .displayName(column.getDisplayName())
                .dataType(column.getDataType().name())
                .columnLength(column.getColumnLength())
                .isNullable(column.getIsNullable())
                .isPrimaryKey(column.getIsPrimaryKey())
                .defaultValue(column.getDefaultValue())
                .displayOrder(column.getDisplayOrder())
                .build();
    }
}
