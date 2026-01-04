package com.sonarworks.workflow.util;

import com.sonarworks.workflow.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class PasswordValidator {

    private final SettingService settingService;

    public ValidationResult validate(String password) {
        List<String> errors = new ArrayList<>();

        int minLength = settingService.getIntValue("password.min.length", 8);
        int maxLength = settingService.getIntValue("password.max.length", 128);
        boolean requireUppercase = settingService.getBooleanValue("password.require.uppercase", true);
        boolean requireLowercase = settingService.getBooleanValue("password.require.lowercase", true);
        boolean requireNumbers = settingService.getBooleanValue("password.require.numbers", true);
        boolean requireSpecialChars = settingService.getBooleanValue("password.require.special", true);
        String specialCharsPattern = settingService.getValue("password.special.chars", "!@#$%^&*()_+-=[]{}|;':\",./<>?");

        if (password == null || password.isEmpty()) {
            errors.add("Password is required");
            return new ValidationResult(false, errors);
        }

        if (password.length() < minLength) {
            errors.add("Password must be at least " + minLength + " characters long");
        }

        if (password.length() > maxLength) {
            errors.add("Password must not exceed " + maxLength + " characters");
        }

        if (requireUppercase && !Pattern.compile("[A-Z]").matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }

        if (requireLowercase && !Pattern.compile("[a-z]").matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }

        if (requireNumbers && !Pattern.compile("[0-9]").matcher(password).find()) {
            errors.add("Password must contain at least one number");
        }

        if (requireSpecialChars) {
            String escapedChars = Pattern.quote(specialCharsPattern);
            if (!Pattern.compile("[" + escapedChars + "]").matcher(password).find()) {
                errors.add("Password must contain at least one special character: " + specialCharsPattern);
            }
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    public record ValidationResult(boolean valid, List<String> errors) {}
}
