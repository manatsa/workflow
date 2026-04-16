package com.sonar.workflow.service.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Server-side mirror of the frontend transformation evaluator.
 * Applies a chain of AND-separated transforms like "TRIM() AND UPPER()".
 */
@Service
@Slf4j
public class FieldTransformationEngine {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FunctionEvaluator functionEvaluator;

    /** Apply the given transformation expression to a value. Returns the original value on parse errors. */
    public Object apply(String expression, Object value) {
        if (expression == null || expression.isBlank() || value == null) return value;
        Object current = value;
        try {
            List<String> transforms = ExpressionEvaluator.splitOutsideQuotes(expression, "\\s+AND\\s+");
            for (String t : transforms) {
                current = applySingle(t.trim(), current);
            }
        } catch (Exception e) {
            log.warn("Transformation failed for expression {}: {}", expression, e.getMessage());
        }
        return current;
    }

    private Object applySingle(String expression, Object value) {
        String s = value != null ? String.valueOf(value) : "";
        Matcher m;

        if (expression.matches("(?i)^UPPER\\(\\)$")) return s.toUpperCase();
        if (expression.matches("(?i)^LOWER\\(\\)$")) return s.toLowerCase();
        if (expression.matches("(?i)^TRIM\\(\\)$")) return s.trim();
        if (expression.matches("(?i)^(TRIM_LEFT|LTRIM)\\(\\)$")) return s.replaceAll("^\\s+", "");
        if (expression.matches("(?i)^(TRIM_RIGHT|RTRIM)\\(\\)$")) return s.replaceAll("\\s+$", "");
        if (expression.matches("(?i)^CAPITALIZE\\(\\)$")) return capitalizeWords(s);
        if (expression.matches("(?i)^REMOVE_SPACES\\(\\)$")) return s.replaceAll("\\s", "");
        if (expression.matches("(?i)^SLUG\\(\\)$"))
            return s.toLowerCase().trim().replaceAll("[^\\w\\s-]", "").replaceAll("[\\s_]+", "-");

        // ROUND(n)
        m = Pattern.compile("(?i)^ROUND\\(\\s*(\\d+)\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int d = Integer.parseInt(m.group(1));
            try {
                return new BigDecimal(s).setScale(d, RoundingMode.HALF_UP).doubleValue();
            } catch (Exception ignore) { return value; }
        }

        // ROUND_UP(n)
        m = Pattern.compile("(?i)^ROUND_UP\\(\\s*(\\d+)\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int d = Integer.parseInt(m.group(1));
            try {
                return new BigDecimal(s).setScale(d, RoundingMode.CEILING).doubleValue();
            } catch (Exception ignore) { return value; }
        }

        // ROUND_DOWN(n)
        m = Pattern.compile("(?i)^ROUND_DOWN\\(\\s*(\\d+)\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int d = Integer.parseInt(m.group(1));
            try {
                return new BigDecimal(s).setScale(d, RoundingMode.FLOOR).doubleValue();
            } catch (Exception ignore) { return value; }
        }

        // PAD_LEFT(len, "char")
        m = Pattern.compile("(?i)^PAD_LEFT\\(\\s*(\\d+)\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'|(\\S))\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int len = Integer.parseInt(m.group(1));
            String ch = firstNonNull(m.group(2), m.group(3), m.group(4), " ");
            if (ch.isEmpty()) ch = " ";
            StringBuilder sb = new StringBuilder(s);
            while (sb.length() < len) sb.insert(0, ch);
            return sb.length() > len ? sb.substring(sb.length() - len) : sb.toString();
        }

        // PAD_RIGHT(len, "char")
        m = Pattern.compile("(?i)^PAD_RIGHT\\(\\s*(\\d+)\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)'|(\\S))\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int len = Integer.parseInt(m.group(1));
            String ch = firstNonNull(m.group(2), m.group(3), m.group(4), " ");
            if (ch.isEmpty()) ch = " ";
            StringBuilder sb = new StringBuilder(s);
            while (sb.length() < len) sb.append(ch);
            return sb.length() > len ? sb.substring(0, len) : sb.toString();
        }

        // SUBSTRING(start, end)
        m = Pattern.compile("(?i)^SUBSTRING\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$").matcher(expression);
        if (m.matches()) {
            int start = Math.min(Integer.parseInt(m.group(1)), s.length());
            int end = Math.min(Integer.parseInt(m.group(2)), s.length());
            return s.substring(start, Math.max(start, end));
        }

        // REPLACE("search", "replacement")
        m = Pattern.compile("(?i)^REPLACE\\(\\s*(?:\"([^\"]*)\"|'([^']*)')\\s*,\\s*(?:\"([^\"]*)\"|'([^']*)')\\s*\\)$").matcher(expression);
        if (m.matches()) {
            String search = firstNonNull(m.group(1), m.group(2), "");
            String replacement = firstNonNull(m.group(3), m.group(4), "");
            return s.replace(search, replacement);
        }

        // Fallback: try the full function library. Inject the current value as @{value}
        // so users can write things like "UPPER(@{value})" or any function.
        if (functionEvaluator != null && functionEvaluator.isFunctionExpression(expression)) {
            try {
                Map<String, Object> ctxMap = new java.util.HashMap<>();
                ctxMap.put("value", value);
                // The function syntax usually expects arguments: if the expression is "UPPER()" with no args,
                // the FunctionEvaluator call will just return empty. We treat a zero-arg call on a transform
                // as meaning "apply UPPER to current value" — handled by the direct regex branch above.
                // For richer expressions like "CONCAT(@{value}, '-suffix')", users pass @{value} explicitly.
                Object r = functionEvaluator.evaluate(expression, new FunctionEvaluator.Context(ctxMap, null));
                return r != null ? r : value;
            } catch (Exception ignore) {}
        }

        // Unknown — leave value unchanged
        return value;
    }

    private static String capitalizeWords(String s) {
        if (s == null || s.isEmpty()) return s;
        StringBuilder sb = new StringBuilder(s);
        boolean nextUpper = true;
        for (int i = 0; i < sb.length(); i++) {
            char c = sb.charAt(i);
            if (Character.isLetter(c)) {
                sb.setCharAt(i, nextUpper ? Character.toUpperCase(c) : c);
                nextUpper = false;
            } else if (Character.isWhitespace(c)) {
                nextUpper = true;
            }
        }
        return sb.toString();
    }

    private static String firstNonNull(String... options) {
        for (String o : options) if (o != null) return o;
        return null;
    }
}
