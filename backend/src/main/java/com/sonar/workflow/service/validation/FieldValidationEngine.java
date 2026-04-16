package com.sonar.workflow.service.validation;

import com.sonar.workflow.entity.WorkflowField;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Server-side mirror of the frontend field validation evaluator.
 * Parses validation expressions like "Required() AND MinLength(5)" and evaluates them
 * against a field value, returning null on success or an error message on failure.
 */
@Service
@Slf4j
public class FieldValidationEngine {

    private final ExpressionEvaluator expressionEvaluator = new ExpressionEvaluator();

    @org.springframework.beans.factory.annotation.Autowired
    private FunctionEvaluator functionEvaluator;

    @jakarta.annotation.PostConstruct
    private void init() { expressionEvaluator.setFunctionEvaluator(functionEvaluator); }

    /**
     * Validate a single field against its validation expression.
     * Returns the first error encountered, or null if valid.
     *
     * @param field               field metadata (for label & custom message)
     * @param value               the current value being validated
     * @param allFieldValues      values of all fields (for cross-field refs like @{otherField})
     */
    public String validate(WorkflowField field, Object value, Map<String, Object> allFieldValues) {
        String expression = field.getValidation();
        if (expression == null || expression.isBlank()) return null;

        try {
            List<String> parts = ExpressionEvaluator.splitOutsideQuotes(expression, "\\s+AND\\s+");
            for (String part : parts) {
                String error = evaluateSingle(part.trim(), field, value, allFieldValues);
                if (error != null) {
                    // Custom message on the field overrides auto-generated errors
                    String customMsg = field.getValidationMessage();
                    if (customMsg != null && !customMsg.isBlank()) return customMsg.trim();
                    return error;
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("Validation expression failed to parse for field {}: {}", field.getName(), expression, e);
            return null; // Fail open on parse errors, same as frontend
        }
    }

    private String evaluateSingle(String expression, WorkflowField field, Object value, Map<String, Object> fv) {
        String label = field.getLabel() != null ? field.getLabel() : field.getName();
        String str = value != null ? String.valueOf(value) : "";

        Matcher m;

        // Required()
        m = match("^Required\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (isBlank(value)) return custom != null ? custom : label + " is required";
            return null;
        }

        // NotEmpty()
        m = match("^NotEmpty\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (str.trim().isEmpty()) return custom != null ? custom : label + " must not be empty";
            return null;
        }

        // MinLength(n)
        m = match("^MinLength\\(\\s*(\\d+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            int n = Integer.parseInt(m.group(1));
            String custom = first(m, 2, 3);
            if (!str.isEmpty() && str.length() < n)
                return custom != null ? custom : label + " must be at least " + n + " characters";
            return null;
        }

        // MaxLength(n)
        m = match("^MaxLength\\(\\s*(\\d+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            int n = Integer.parseInt(m.group(1));
            String custom = first(m, 2, 3);
            if (!str.isEmpty() && str.length() > n)
                return custom != null ? custom : label + " must be at most " + n + " characters";
            return null;
        }

        // LengthRange(min, max)
        m = match("^LengthRange\\(\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            int min = Integer.parseInt(m.group(1));
            int max = Integer.parseInt(m.group(2));
            String custom = first(m, 3, 4);
            if (!str.isEmpty() && (str.length() < min || str.length() > max))
                return custom != null ? custom : label + " must be between " + min + " and " + max + " characters";
            return null;
        }

        // Min(n)
        m = match("^Min\\(\\s*(-?[\\d.]+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            double n = Double.parseDouble(m.group(1));
            String custom = first(m, 2, 3);
            Double num = toDouble(value);
            if (num != null && num < n) return custom != null ? custom : label + " must be at least " + stripTrailingZero(n);
            return null;
        }

        // Max(n)
        m = match("^Max\\(\\s*(-?[\\d.]+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            double n = Double.parseDouble(m.group(1));
            String custom = first(m, 2, 3);
            Double num = toDouble(value);
            if (num != null && num > n) return custom != null ? custom : label + " must be at most " + stripTrailingZero(n);
            return null;
        }

        // Range(min, max)
        m = match("^Range\\(\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            double min = Double.parseDouble(m.group(1));
            double max = Double.parseDouble(m.group(2));
            String custom = first(m, 3, 4);
            Double num = toDouble(value);
            if (num != null && (num < min || num > max))
                return custom != null ? custom : label + " must be between " + stripTrailingZero(min) + " and " + stripTrailingZero(max);
            return null;
        }

        // Pattern(/regex/flags)
        m = match("^Pattern\\(\\s*/(.+)/([gimsuy]*)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String regex = m.group(1);
            String flags = m.group(2) != null ? m.group(2) : "";
            String custom = first(m, 3, 4);
            int javaFlags = 0;
            if (flags.contains("i")) javaFlags |= Pattern.CASE_INSENSITIVE;
            if (flags.contains("s")) javaFlags |= Pattern.DOTALL;
            if (flags.contains("m")) javaFlags |= Pattern.MULTILINE;
            try {
                Pattern p = Pattern.compile(regex, javaFlags);
                if (!str.isEmpty() && !p.matcher(str).find())
                    return custom != null ? custom : label + " format is invalid";
            } catch (Exception ignore) {
                // invalid regex — skip
            }
            return null;
        }

        // Email / IS_EMAIL / IsEmail
        m = match("^(?:Email|IS_EMAIL|IsEmail)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty() && !str.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                return custom != null ? custom : label + " must be a valid email address";
            return null;
        }

        // Phone / IS_PHONE / IsPhone
        m = match("^(?:Phone|IS_PHONE|IsPhone)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            String cleaned = str.replaceAll("\\s", "");
            if (!str.isEmpty() && !cleaned.matches("^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$"))
                return custom != null ? custom : label + " must be a valid phone number";
            return null;
        }

        // URL / IS_URL / IsUrl
        m = match("^(?:URL|IS_URL|IsUrl)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty()) {
                try { new java.net.URL(str); }
                catch (Exception e) { return custom != null ? custom : label + " must be a valid URL"; }
            }
            return null;
        }

        // Digits()
        m = match("^Digits\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty() && !str.matches("^\\d+$"))
                return custom != null ? custom : label + " must contain only digits";
            return null;
        }

        // Alpha()
        m = match("^Alpha\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty() && !str.matches("^[a-zA-Z]+$"))
                return custom != null ? custom : label + " must contain only letters";
            return null;
        }

        // AlphaNumeric()
        m = match("^AlphaNumeric\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty() && !str.matches("^[a-zA-Z0-9]+$"))
                return custom != null ? custom : label + " must contain only letters and numbers";
            return null;
        }

        // CreditCard() - Luhn
        m = match("^CreditCard\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            String cleaned = str.replaceAll("[\\s-]", "");
            if (!str.isEmpty() && !isValidLuhn(cleaned))
                return custom != null ? custom : label + " must be a valid credit card number";
            return null;
        }

        // Date / IS_DATE / IsDate
        m = match("^(?:Date|IS_DATE|IsDate)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty() && parseDate(str) == null)
                return custom != null ? custom : label + " must be a valid date";
            return null;
        }

        // DateBefore(date)
        m = match("^(?:DateBefore|DATE_BEFORE)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String target = first(m, 1, 2);
            String custom = first(m, 3, 4);
            LocalDate v = parseDate(str);
            LocalDate t = "today".equalsIgnoreCase(target) ? LocalDate.now() : parseDate(target);
            if (v != null && t != null && !v.isBefore(t))
                return custom != null ? custom : label + " must be before " + target;
            return null;
        }

        // DateAfter(date)
        m = match("^(?:DateAfter|DATE_AFTER)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String target = first(m, 1, 2);
            String custom = first(m, 3, 4);
            LocalDate v = parseDate(str);
            LocalDate t = "today".equalsIgnoreCase(target) ? LocalDate.now() : parseDate(target);
            if (v != null && t != null && !v.isAfter(t))
                return custom != null ? custom : label + " must be after " + target;
            return null;
        }

        // FutureDate / IS_FUTURE
        m = match("^(?:FutureDate|IS_FUTURE|IsFuture)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            LocalDate v = parseDate(str);
            if (v != null && !v.isAfter(LocalDate.now()))
                return custom != null ? custom : label + " must be a future date";
            return null;
        }

        // PastDate / IS_PAST
        m = match("^(?:PastDate|IS_PAST|IsPast)\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            LocalDate v = parseDate(str);
            if (v != null && !v.isBefore(LocalDate.now()))
                return custom != null ? custom : label + " must be a past date";
            return null;
        }

        // Positive()
        m = match("^Positive\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            Double num = toDouble(value);
            if (num != null && num <= 0) return custom != null ? custom : label + " must be a positive number";
            return null;
        }

        // Negative()
        m = match("^Negative\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            Double num = toDouble(value);
            if (num != null && num >= 0) return custom != null ? custom : label + " must be a negative number";
            return null;
        }

        // Integer()
        m = match("^Integer\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!str.isEmpty()) {
                try {
                    double d = Double.parseDouble(str);
                    if (d != Math.floor(d) || Double.isInfinite(d))
                        return custom != null ? custom : label + " must be a whole number";
                } catch (NumberFormatException nfe) {
                    return custom != null ? custom : label + " must be a whole number";
                }
            }
            return null;
        }

        // Decimal(places)
        m = match("^Decimal\\(\\s*(\\d+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            int places = Integer.parseInt(m.group(1));
            String custom = first(m, 2, 3);
            if (!str.isEmpty()) {
                try {
                    new BigDecimal(str);
                    int idx = str.indexOf('.');
                    int actualPlaces = idx < 0 ? 0 : str.length() - idx - 1;
                    if (actualPlaces > places)
                        return custom != null ? custom : label + " must have at most " + places + " decimal places";
                } catch (NumberFormatException nfe) {
                    return custom != null ? custom : label + " must be a valid number";
                }
            }
            return null;
        }

        // Equals(value)
        m = match("^Equals\\(\\s*(?:\"([^\"]*)\"|'([^']*)'|(-?[\\d.]+))(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String expected = first(m, 1, 2, 3);
            String custom = first(m, 4, 5);
            if (!str.isEmpty() && !str.equals(expected))
                return custom != null ? custom : label + " must equal \"" + expected + "\"";
            return null;
        }

        // Contains(text)
        m = match("^Contains\\(\\s*(?:\"([^\"]*)\"|'([^']*)')(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String search = firstOrEmpty(m, 1, 2);
            String custom = first(m, 3, 4);
            if (!str.isEmpty() && !str.contains(search))
                return custom != null ? custom : label + " must contain \"" + search + "\"";
            return null;
        }

        // StartsWith(text)
        m = match("^StartsWith\\(\\s*(?:\"([^\"]*)\"|'([^']*)')(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String prefix = firstOrEmpty(m, 1, 2);
            String custom = first(m, 3, 4);
            if (!str.isEmpty() && !str.startsWith(prefix))
                return custom != null ? custom : label + " must start with \"" + prefix + "\"";
            return null;
        }

        // EndsWith(text)
        m = match("^EndsWith\\(\\s*(?:\"([^\"]*)\"|'([^']*)')(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String suffix = firstOrEmpty(m, 1, 2);
            String custom = first(m, 3, 4);
            if (!str.isEmpty() && !str.endsWith(suffix))
                return custom != null ? custom : label + " must end with \"" + suffix + "\"";
            return null;
        }

        // MatchField(fieldName)
        m = match("^MatchField\\(\\s*(?:\"([^\"]*)\"|'([^']*)'|([a-zA-Z_]\\w*))(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String other = first(m, 1, 2, 3);
            String custom = first(m, 4, 5);
            if (!isBlank(value) && fv != null) {
                Object otherVal = fv.get(other);
                if (!String.valueOf(value).equals(String.valueOf(otherVal != null ? otherVal : "")))
                    return custom != null ? custom : label + " must match " + other;
            }
            return null;
        }

        // IsTrue()
        m = match("^IsTrue\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if (!("true".equals(str) || Boolean.TRUE.equals(value)))
                return custom != null ? custom : label + " must be checked";
            return null;
        }

        // IsFalse()
        m = match("^IsFalse\\(\\s*(?:\"([^\"]*)\"|'([^']*)')?\\s*\\)$", expression);
        if (m != null) {
            String custom = first(m, 1, 2);
            if ("true".equals(str) || Boolean.TRUE.equals(value))
                return custom != null ? custom : label + " must not be checked";
            return null;
        }

        // MinItems(n) / MaxItems(n) / MinRows(n) / MaxRows(n)
        m = match("^(MinItems|MaxItems|MinRows|MaxRows)\\(\\s*(\\d+)(?:\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'))?\\s*\\)$", expression);
        if (m != null) {
            String fn = m.group(1);
            int n = Integer.parseInt(m.group(2));
            String custom = first(m, 3, 4);
            int size = (value instanceof List) ? ((List<?>) value).size() : 0;
            boolean isMin = fn.startsWith("Min");
            if (isMin && size < n)
                return custom != null ? custom : label + " must have at least " + n + (fn.endsWith("Rows") ? " rows" : " items");
            if (!isMin && size > n)
                return custom != null ? custom : label + " must have at most " + n + (fn.endsWith("Rows") ? " rows" : " items");
            return null;
        }

        // ValidWhen(expr) / ValidWhen(expr, "message")
        if (expression.matches("^(?i)ValidWhen\\s*\\(.*\\)$")) {
            if (isBlank(value)) return null;
            ExpressionEvaluator.WhenArgs args = ExpressionEvaluator.parseWhenFunction(expression, "ValidWhen");
            if (args.expr != null) {
                boolean ok = expressionEvaluator.evaluateBoolean(args.expr, fv);
                if (!ok) return args.message != null ? args.message : label + " validation failed";
            }
            return null;
        }

        // InvalidWhen(expr) / InvalidWhen(expr, "message")
        if (expression.matches("^(?i)InvalidWhen\\s*\\(.*\\)$")) {
            if (isBlank(value)) return null;
            ExpressionEvaluator.WhenArgs args = ExpressionEvaluator.parseWhenFunction(expression, "InvalidWhen");
            if (args.expr != null) {
                boolean bad = expressionEvaluator.evaluateBoolean(args.expr, fv);
                if (bad) return args.message != null ? args.message : label + " validation failed";
            }
            return null;
        }

        // Unique() — handled elsewhere (DB check in WorkflowInstanceService)
        if (expression.matches("^(?i)Unique\\s*\\(.*\\)$")) return null;

        // Unknown function — pass
        return null;
    }

    // ---- helpers ----
    private static Matcher match(String regex, String input) {
        Matcher m = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(input);
        return m.matches() ? m : null;
    }

    private static String first(Matcher m, int... groups) {
        for (int g : groups) {
            try {
                String v = m.group(g);
                if (v != null) return v;
            } catch (Exception ignore) {}
        }
        return null;
    }

    private static String firstOrEmpty(Matcher m, int... groups) {
        String v = first(m, groups);
        return v != null ? v : "";
    }

    private static boolean isBlank(Object v) {
        if (v == null) return true;
        if (v instanceof String) return ((String) v).trim().isEmpty();
        if (v instanceof List) return ((List<?>) v).isEmpty();
        return false;
    }

    private static Double toDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.parseDouble(String.valueOf(v).trim()); }
        catch (NumberFormatException e) { return null; }
    }

    private static String stripTrailingZero(double d) {
        if (d == Math.floor(d) && !Double.isInfinite(d)) return String.valueOf((long) d);
        return String.valueOf(d);
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        // Try ISO yyyy-MM-dd
        try { return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE); } catch (Exception ignore) {}
        // Try full ISO datetime then drop time
        try {
            return java.time.LocalDateTime.parse(s).toLocalDate();
        } catch (Exception ignore) {}
        // Try with Z / offset
        try {
            return java.time.OffsetDateTime.parse(s).toLocalDate();
        } catch (Exception ignore) {}
        return null;
    }

    private static boolean isValidLuhn(String digits) {
        if (!digits.matches("^\\d{13,19}$")) return false;
        int sum = 0;
        boolean even = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int d = digits.charAt(i) - '0';
            if (even) { d *= 2; if (d > 9) d -= 9; }
            sum += d;
            even = !even;
        }
        return sum % 10 == 0;
    }
}
