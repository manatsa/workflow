package com.sonar.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultDTO {

    private int successCount;
    private int errorCount;

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    @Builder.Default
    private Map<Integer, String> rowStatuses = new LinkedHashMap<>();

    public void addError(int rowNumber, String message) {
        errors.add("Row " + rowNumber + ": " + message);
        errorCount++;
        rowStatuses.put(rowNumber, "FAILED: " + message);
    }

    public void addSuccess(int rowNumber) {
        successCount++;
        rowStatuses.put(rowNumber, "SUCCESS");
    }

    public void incrementSuccess() {
        successCount++;
    }

    public boolean hasErrors() {
        return errorCount > 0;
    }

    public String getSummary() {
        if (errorCount == 0) {
            return String.format("Successfully imported %d records", successCount);
        }
        return String.format("Imported %d records with %d errors", successCount, errorCount);
    }
}
