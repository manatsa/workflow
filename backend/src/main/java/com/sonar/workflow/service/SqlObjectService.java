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

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
                String columnName = sanitizeColumnName(colDto.getColumnName());
                // Use display name from DTO, or default to column name if not set
                String displayName = colDto.getDisplayName() != null && !colDto.getDisplayName().isEmpty()
                        ? colDto.getDisplayName() : columnName;
                SqlColumn column = SqlColumn.builder()
                        .sqlObject(sqlObject)
                        .columnName(columnName)
                        .displayName(displayName)
                        .dataType(SqlColumn.ColumnDataType.valueOf(colDto.getDataType()))
                        .columnLength(colDto.getColumnLength() != null ? colDto.getColumnLength() : 255)
                        .isNullable(colDto.getIsNullable() != null ? colDto.getIsNullable() : true)
                        .isPrimaryKey(colDto.getIsPrimaryKey() != null ? colDto.getIsPrimaryKey() : false)
                        .defaultValue(colDto.getDefaultValue())
                        .displayOrder(i)
                        .booleanControl(parseBooleanControl(colDto.getBooleanControl()))
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

        // Handle column changes (add new, update existing, drop removed)
        if (dto.getColumns() != null) {
            Set<String> existingColNames = sqlObject.getColumns().stream()
                    .map(SqlColumn::getColumnName)
                    .collect(java.util.stream.Collectors.toSet());

            Set<String> dtoColNames = dto.getColumns().stream()
                    .map(SqlColumnDTO::getColumnName)
                    .filter(n -> n != null && !n.isBlank())
                    .collect(java.util.stream.Collectors.toSet());

            String tableName = TABLE_PREFIX + sqlObject.getTableName();

            // Drop columns that were removed
            Set<String> removedCols = new HashSet<>(existingColNames);
            removedCols.removeAll(dtoColNames);
            for (String removedCol : removedCols) {
                try {
                    entityManager.createNativeQuery(
                            "ALTER TABLE " + tableName + " DROP COLUMN IF EXISTS " + removedCol
                    ).executeUpdate();
                    log.info("Dropped column {} from table {}", removedCol, tableName);
                } catch (Exception e) {
                    log.error("Failed to drop column {}: {}", removedCol, e.getMessage());
                    throw new RuntimeException("Failed to drop column " + removedCol + ": " + e.getMessage());
                }
            }
            // Remove from entity
            sqlObject.getColumns().removeIf(c -> removedCols.contains(c.getColumnName()));

            // Update existing and add new columns
            for (SqlColumnDTO colDto : dto.getColumns()) {
                if (colDto.getColumnName() == null || colDto.getColumnName().isBlank()) continue;

                if (existingColNames.contains(colDto.getColumnName())) {
                    // Update display name/order/booleanControl of existing column
                    sqlObject.getColumns().stream()
                            .filter(c -> c.getColumnName().equals(colDto.getColumnName()))
                            .findFirst()
                            .ifPresent(c -> {
                                c.setDisplayName(colDto.getDisplayName());
                                c.setDisplayOrder(colDto.getDisplayOrder());
                                c.setBooleanControl(parseBooleanControl(colDto.getBooleanControl()));
                            });
                } else {
                    // Add new column to the database table
                    SqlColumn.ColumnDataType dataType = SqlColumn.ColumnDataType.valueOf(
                            colDto.getDataType() != null ? colDto.getDataType() : "VARCHAR");
                    String pgType = getPostgresType(dataType, colDto.getColumnLength());
                    String alterSql = "ALTER TABLE " + tableName + " ADD COLUMN " +
                            colDto.getColumnName() + " " + pgType;
                    if (Boolean.FALSE.equals(colDto.getIsNullable())) {
                        alterSql += " DEFAULT ''";
                    }
                    try {
                        entityManager.createNativeQuery(alterSql).executeUpdate();
                        log.info("Added column {} to table {}", colDto.getColumnName(), tableName);
                    } catch (Exception e) {
                        log.error("Failed to add column {}: {}", colDto.getColumnName(), e.getMessage());
                        throw new RuntimeException("Failed to add column " + colDto.getColumnName() + ": " + e.getMessage());
                    }

                    SqlColumn newCol = new SqlColumn();
                    newCol.setSqlObject(sqlObject);
                    newCol.setColumnName(colDto.getColumnName());
                    newCol.setDisplayName(colDto.getDisplayName());
                    newCol.setDataType(dataType);
                    newCol.setColumnLength(colDto.getColumnLength());
                    newCol.setIsNullable(colDto.getIsNullable() != null ? colDto.getIsNullable() : true);
                    newCol.setIsPrimaryKey(false);
                    newCol.setDisplayOrder(colDto.getDisplayOrder());
                    newCol.setBooleanControl(parseBooleanControl(colDto.getBooleanControl()));
                    sqlObject.getColumns().add(newCol);
                }
            }
        }

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

    /**
     * Execute a read-only SQL query for SQL_TABLE fields and return columns + data.
     * Only SELECT queries are allowed. If column definitions are provided (JSON array of {key, label}),
     * those are used; otherwise column names from the result set metadata are used.
     */
    @SuppressWarnings("unchecked")
    @Transactional
    public Map<String, Object> executeSqlTableQuery(String query, String columnsJson) {
        if (query == null || query.trim().isEmpty()) {
            throw new RuntimeException("SQL query is required");
        }

        // Security: only allow SELECT statements
        String trimmed = query.trim().toLowerCase();
        if (!trimmed.startsWith("select")) {
            throw new RuntimeException("Only SELECT queries are allowed");
        }
        if (trimmed.contains("insert ") || trimmed.contains("update ") || trimmed.contains("delete ") ||
            trimmed.contains("drop ") || trimmed.contains("alter ") || trimmed.contains("create ") ||
            trimmed.contains("truncate ")) {
            throw new RuntimeException("Only SELECT queries are allowed");
        }

        try {
            // Execute using native query to get raw results + metadata
            var nativeQuery = entityManager.createNativeQuery(query);
            List<Object[]> rawResults = nativeQuery.getResultList();

            // Parse user-defined columns if provided
            List<Map<String, String>> definedColumns = null;
            if (columnsJson != null && !columnsJson.trim().isEmpty() && !columnsJson.equals("null")) {
                try {
                    var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    definedColumns = mapper.readValue(columnsJson,
                            mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                } catch (Exception e) {
                    log.warn("Failed to parse sqlTableColumns JSON: {}", e.getMessage());
                }
            }

            // If no results, return empty with defined columns or empty
            if (rawResults.isEmpty()) {
                List<Map<String, Object>> cols = new ArrayList<>();
                if (definedColumns != null) {
                    for (Map<String, String> dc : definedColumns) {
                        cols.add(Map.of("field", dc.getOrDefault("key", ""), "header", dc.getOrDefault("label", dc.getOrDefault("key", "")), "type", "string"));
                    }
                }
                return Map.of("columns", cols, "data", List.of(), "totalRecords", 0);
            }

            // Determine actual column names from the first row or a metadata approach
            // Use a direct JDBC approach for column names
            List<String> dbColumnNames = getColumnNamesFromQuery(query);

            // Build column definitions
            List<Map<String, Object>> columns = new ArrayList<>();
            if (definedColumns != null && !definedColumns.isEmpty()) {
                // User-defined columns: map key to db column, label for display
                for (Map<String, String> dc : definedColumns) {
                    String key = dc.getOrDefault("key", "");
                    String label = dc.getOrDefault("label", key);
                    columns.add(Map.of("field", key, "header", label, "type", "string"));
                }
            } else {
                // Auto-detect: use db column names
                for (String col : dbColumnNames) {
                    columns.add(Map.of("field", col, "header", col, "type", "string"));
                }
            }

            // Build data rows
            List<Map<String, Object>> data = new ArrayList<>();
            for (Object resultRow : rawResults) {
                Map<String, Object> rowMap = new LinkedHashMap<>();
                if (resultRow instanceof Object[] row) {
                    for (int i = 0; i < Math.min(row.length, dbColumnNames.size()); i++) {
                        rowMap.put(dbColumnNames.get(i), row[i]);
                    }
                } else {
                    // Single column result
                    if (!dbColumnNames.isEmpty()) {
                        rowMap.put(dbColumnNames.get(0), resultRow);
                    }
                }
                data.add(rowMap);
            }

            return Map.of("columns", columns, "data", data, "totalRecords", data.size());
        } catch (Exception e) {
            log.error("Error executing SQL table query: {}", e.getMessage());
            throw new RuntimeException("Query execution failed: " + e.getMessage());
        }
    }

    private List<String> getColumnNamesFromQuery(String query) {
        List<String> names = new ArrayList<>();
        try {
            // Use Hibernate's doWork to get a JDBC connection safely
            org.hibernate.Session session = entityManager.unwrap(org.hibernate.Session.class);
            session.doWork(connection -> {
                try (var stmt = connection.prepareStatement(query);
                     var rs = stmt.executeQuery()) {
                    var meta = rs.getMetaData();
                    for (int i = 1; i <= meta.getColumnCount(); i++) {
                        names.add(meta.getColumnLabel(i));
                    }
                }
            });
        } catch (Exception e) {
            log.warn("Could not extract column metadata: {}", e.getMessage());
        }
        return names;
    }

    /**
     * Execute a SQL function query from the library functions (SQL_LOOKUP, SQL_QUERY, SQL_COUNT, SQL_SUM, etc.)
     * Only operates on sql_data_ prefixed tables for security.
     */
    @SuppressWarnings("unchecked")
    @Transactional
    public Object executeFunctionQuery(Map<String, Object> body) {
        String function = (String) body.getOrDefault("function", "");
        String table = (String) body.getOrDefault("table", "");
        String column = (String) body.getOrDefault("column", "");
        String whereColumn = (String) body.getOrDefault("whereColumn", "");
        String whereValue = (String) body.getOrDefault("whereValue", "");
        String orderBy = (String) body.getOrDefault("orderBy", "");
        String orderDir = (String) body.getOrDefault("orderDir", "ASC");
        Integer limit = body.get("limit") != null ? Integer.parseInt(body.get("limit").toString()) : null;

        if (table == null || table.trim().isEmpty()) {
            throw new RuntimeException("Table name is required");
        }

        // Resolve table: look up by display name or table name from sql_objects
        String resolvedTable = resolveTableName(table.trim());

        // Security: only allow sql_data_ prefixed tables
        if (!resolvedTable.startsWith(TABLE_PREFIX)) {
            resolvedTable = TABLE_PREFIX + resolvedTable;
        }

        // Validate identifiers to prevent SQL injection
        validateIdentifier(resolvedTable);
        if (column != null && !column.isEmpty()) validateIdentifier(column);
        if (whereColumn != null && !whereColumn.isEmpty()) validateIdentifier(whereColumn);
        if (orderBy != null && !orderBy.isEmpty()) validateIdentifier(orderBy);

        String upperFunc = function.toUpperCase();

        try {
            switch (upperFunc) {
                case "SQL_LOOKUP": {
                    // Returns a single value: SELECT column FROM table WHERE whereColumn = whereValue LIMIT 1
                    String sql = "SELECT " + column + " FROM " + resolvedTable +
                            " WHERE " + whereColumn + " = ? LIMIT 1";
                    var query = entityManager.createNativeQuery(sql);
                    query.setParameter(1, whereValue);
                    List<?> results = query.getResultList();
                    return results.isEmpty() ? null : results.get(0);
                }
                case "SQL_QUERY": {
                    // Returns list of rows: SELECT * or column FROM table [WHERE ...] [ORDER BY ...] [LIMIT ...]
                    StringBuilder sql = new StringBuilder("SELECT ");
                    sql.append(column != null && !column.isEmpty() ? column : "*");
                    sql.append(" FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    if (orderBy != null && !orderBy.isEmpty()) {
                        sql.append(" ORDER BY ").append(orderBy);
                        sql.append("DESC".equalsIgnoreCase(orderDir) ? " DESC" : " ASC");
                    }
                    if (limit != null && limit > 0) {
                        sql.append(" LIMIT ").append(limit);
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    List<?> results = query.getResultList();
                    // Get column names for mapping
                    List<String> colNames = getColumnNamesFromQuery(sql.toString().replace("?", "'" + whereValue.replace("'", "''") + "'"));
                    List<Map<String, Object>> data = new ArrayList<>();
                    for (Object row : results) {
                        Map<String, Object> rowMap = new LinkedHashMap<>();
                        if (row instanceof Object[] arr) {
                            for (int i = 0; i < Math.min(arr.length, colNames.size()); i++) {
                                rowMap.put(colNames.get(i), arr[i]);
                            }
                        } else {
                            rowMap.put(colNames.isEmpty() ? "value" : colNames.get(0), row);
                        }
                        data.add(rowMap);
                    }
                    return data;
                }
                case "SQL_COUNT": {
                    StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                case "SQL_SUM": {
                    if (column == null || column.isEmpty()) throw new RuntimeException("Column is required for SQL_SUM");
                    StringBuilder sql = new StringBuilder("SELECT COALESCE(SUM(").append(column).append("), 0) FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                case "SQL_AVG": {
                    if (column == null || column.isEmpty()) throw new RuntimeException("Column is required for SQL_AVG");
                    StringBuilder sql = new StringBuilder("SELECT COALESCE(AVG(").append(column).append("), 0) FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                case "SQL_MIN": {
                    if (column == null || column.isEmpty()) throw new RuntimeException("Column is required for SQL_MIN");
                    StringBuilder sql = new StringBuilder("SELECT MIN(").append(column).append(") FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                case "SQL_MAX": {
                    if (column == null || column.isEmpty()) throw new RuntimeException("Column is required for SQL_MAX");
                    StringBuilder sql = new StringBuilder("SELECT MAX(").append(column).append(") FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                case "SQL_DISTINCT": {
                    if (column == null || column.isEmpty()) throw new RuntimeException("Column is required for SQL_DISTINCT");
                    StringBuilder sql = new StringBuilder("SELECT DISTINCT ").append(column).append(" FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    sql.append(" ORDER BY ").append(column).append(" ASC");
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getResultList();
                }
                case "SQL_EXISTS": {
                    StringBuilder sql = new StringBuilder("SELECT EXISTS(SELECT 1 FROM ").append(resolvedTable);
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        sql.append(" WHERE ").append(whereColumn).append(" = ?");
                    }
                    sql.append(")");
                    var query = entityManager.createNativeQuery(sql.toString());
                    if (whereColumn != null && !whereColumn.isEmpty() && whereValue != null) {
                        query.setParameter(1, whereValue);
                    }
                    return query.getSingleResult();
                }
                default:
                    throw new RuntimeException("Unknown SQL function: " + function);
            }
        } catch (Exception e) {
            log.error("Error executing SQL function {}: {}", function, e.getMessage());
            throw new RuntimeException("SQL function error: " + e.getMessage());
        }
    }

    private String resolveTableName(String nameOrDisplayName) {
        // Try to find by display name first
        Optional<SqlObject> byDisplay = sqlObjectRepository.findAll().stream()
                .filter(o -> o.getDisplayName().equalsIgnoreCase(nameOrDisplayName))
                .findFirst();
        if (byDisplay.isPresent()) {
            return TABLE_PREFIX + byDisplay.get().getTableName();
        }
        // Try by table name
        Optional<SqlObject> byTable = sqlObjectRepository.findAll().stream()
                .filter(o -> o.getTableName().equalsIgnoreCase(nameOrDisplayName))
                .findFirst();
        if (byTable.isPresent()) {
            return TABLE_PREFIX + byTable.get().getTableName();
        }
        // Return as-is (with prefix)
        return nameOrDisplayName;
    }

    private void validateIdentifier(String identifier) {
        if (identifier == null) return;
        // Allow only alphanumeric, underscores, dots (for qualified names), and commas/spaces (for multi-column)
        if (!identifier.matches("^[a-zA-Z0-9_., *]+$")) {
            throw new RuntimeException("Invalid identifier: " + identifier);
        }
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
    private SqlColumn.BooleanControl parseBooleanControl(String value) {
        if (value == null || value.isBlank()) return SqlColumn.BooleanControl.TOGGLE;
        try {
            return SqlColumn.BooleanControl.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SqlColumn.BooleanControl.TOGGLE;
        }
    }

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
                .booleanControl(column.getBooleanControl() != null ? column.getBooleanControl().name() : "TOGGLE")
                .build();
    }

    // ==================== TEMPLATE / EXPORT / IMPORT ====================

    public byte[] generateTemplate(UUID sqlObjectId) throws IOException {
        SqlObject obj = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(obj.getDisplayName());
            Row header = sheet.createRow(0);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            List<SqlColumn> columns = obj.getColumns().stream()
                    .sorted(Comparator.comparingInt(c -> c.getDisplayOrder() != null ? c.getDisplayOrder() : 0))
                    .collect(Collectors.toList());

            for (int i = 0; i < columns.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns.get(i).getDisplayName() + " (" + columns.get(i).getColumnName() + ")");
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportData(UUID sqlObjectId) throws IOException {
        SqlObject obj = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        List<Map<String, Object>> data = getTableData(sqlObjectId);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(obj.getDisplayName());
            Row header = sheet.createRow(0);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            List<SqlColumn> columns = obj.getColumns().stream()
                    .sorted(Comparator.comparingInt(c -> c.getDisplayOrder() != null ? c.getDisplayOrder() : 0))
                    .collect(Collectors.toList());

            for (int i = 0; i < columns.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns.get(i).getDisplayName());
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowNum = 1;
            for (Map<String, Object> rowData : data) {
                Row row = sheet.createRow(rowNum++);
                for (int i = 0; i < columns.size(); i++) {
                    Object value = rowData.get(columns.get(i).getColumnName());
                    Cell cell = row.createCell(i);
                    if (value != null) {
                        if (value instanceof Number) {
                            cell.setCellValue(((Number) value).doubleValue());
                        } else if (value instanceof Boolean) {
                            cell.setCellValue((Boolean) value);
                        } else {
                            cell.setCellValue(value.toString());
                        }
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public byte[] importData(UUID sqlObjectId, MultipartFile file) throws IOException {
        SqlObject obj = sqlObjectRepository.findById(sqlObjectId)
                .orElseThrow(() -> new RuntimeException("SQL Object not found"));

        List<SqlColumn> columns = obj.getColumns().stream()
                .sorted(Comparator.comparingInt(c -> c.getDisplayOrder() != null ? c.getDisplayOrder() : 0))
                .collect(Collectors.toList());

        // Read the source file for building result
        try (Workbook sourceWorkbook = WorkbookFactory.create(file.getInputStream());
             XSSFWorkbook resultWorkbook = new XSSFWorkbook()) {

            Sheet sourceSheet = sourceWorkbook.getSheetAt(0);
            Sheet resultSheet = resultWorkbook.createSheet(obj.getDisplayName() + " Import Results");

            // Styles
            CellStyle headerStyle = resultWorkbook.createCellStyle();
            Font hf = resultWorkbook.createFont(); hf.setBold(true); headerStyle.setFont(hf);

            CellStyle successStyle = resultWorkbook.createCellStyle();
            Font sf = resultWorkbook.createFont(); sf.setColor(IndexedColors.GREEN.getIndex()); sf.setBold(true); successStyle.setFont(sf);

            CellStyle errorStyle = resultWorkbook.createCellStyle();
            Font ef = resultWorkbook.createFont(); ef.setColor(IndexedColors.RED.getIndex()); ef.setBold(true); errorStyle.setFont(ef);

            // Copy header row + add Status/Details columns
            Row sourceHeader = sourceSheet.getRow(0);
            Row resultHeader = resultSheet.createRow(0);
            int lastCol = sourceHeader != null ? sourceHeader.getLastCellNum() : columns.size();
            if (lastCol < 0) lastCol = columns.size();

            for (int i = 0; i < lastCol; i++) {
                Cell sc = sourceHeader != null ? sourceHeader.getCell(i) : null;
                Cell rc = resultHeader.createCell(i);
                rc.setCellStyle(headerStyle);
                rc.setCellValue(sc != null ? getCellStringValue(sc) : (i < columns.size() ? columns.get(i).getDisplayName() : ""));
            }
            Cell statusH = resultHeader.createCell(lastCol);
            statusH.setCellValue("Import Status"); statusH.setCellStyle(headerStyle);
            Cell detailsH = resultHeader.createCell(lastCol + 1);
            detailsH.setCellValue("Details"); detailsH.setCellStyle(headerStyle);

            // Process each row
            int resultRowIdx = 0;
            for (int i = 1; i <= sourceSheet.getLastRowNum(); i++) {
                Row sourceRow = sourceSheet.getRow(i);
                if (sourceRow == null) continue;
                resultRowIdx++;
                Row resultRow = resultSheet.createRow(resultRowIdx);

                // Copy original data
                for (int j = 0; j < lastCol; j++) {
                    Cell sc = sourceRow.getCell(j);
                    Cell rc = resultRow.createCell(j);
                    if (sc != null) rc.setCellValue(getCellStringValue(sc));
                }

                // Try to import
                try {
                    Map<String, Object> rowData = new LinkedHashMap<>();
                    for (int j = 0; j < columns.size(); j++) {
                        Cell cell = sourceRow.getCell(j);
                        SqlColumn col = columns.get(j);
                        Object value = getCellValue(cell, col);
                        if (value != null) {
                            rowData.put(col.getColumnName(), value);
                        }
                    }

                    if (!rowData.isEmpty()) {
                        addTableRow(sqlObjectId, rowData);
                        Cell statusCell = resultRow.createCell(lastCol);
                        statusCell.setCellValue("SUCCESS"); statusCell.setCellStyle(successStyle);
                        resultRow.createCell(lastCol + 1).setCellValue("Row imported successfully");
                    } else {
                        Cell statusCell = resultRow.createCell(lastCol);
                        statusCell.setCellValue("SKIPPED"); statusCell.setCellStyle(errorStyle);
                        resultRow.createCell(lastCol + 1).setCellValue("Empty row");
                    }
                } catch (Exception e) {
                    Cell statusCell = resultRow.createCell(lastCol);
                    statusCell.setCellValue("FAILED"); statusCell.setCellStyle(errorStyle);
                    resultRow.createCell(lastCol + 1).setCellValue(e.getMessage());
                }
            }

            // Auto-size columns
            for (int i = 0; i <= lastCol + 1; i++) {
                resultSheet.setColumnWidth(i, 5000);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            resultWorkbook.write(out);
            return out.toByteArray();
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private Object getCellValue(Cell cell, SqlColumn column) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim().isEmpty() ? null : cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (column.getDataType() == SqlColumn.ColumnDataType.INTEGER ||
                    column.getDataType() == SqlColumn.ColumnDataType.BIGINT) {
                    yield (long) cell.getNumericCellValue();
                } else if (column.getDataType() == SqlColumn.ColumnDataType.DATE) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                } else if (column.getDataType() == SqlColumn.ColumnDataType.TIMESTAMP) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                yield cell.getNumericCellValue();
            }
            case BOOLEAN -> cell.getBooleanCellValue();
            default -> null;
        };
    }
}
