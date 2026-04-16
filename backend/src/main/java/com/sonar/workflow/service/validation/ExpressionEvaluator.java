package com.sonar.workflow.service.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Evaluates boolean conditions used in ValidWhen/InvalidWhen and visibility expressions.
 * Supports:
 *   - @{fieldName} placeholders (resolved from the fieldValues map)
 *   - Comparison operators: ==, ===, !=, !==, >, <, >=, <=, =
 *   - Logical operators: AND, OR, &&, ||
 *   - Parenthesized groups are NOT supported (mirrors frontend simplicity)
 */
public class ExpressionEvaluator {

    private static final Pattern FIELD_REF = Pattern.compile("@\\{([^}]+)\\}");
    private static final Pattern FUNC_CALL = Pattern.compile("^\\s*([A-Z_][A-Z0-9_]*)\\s*\\(.*\\)\\s*$", Pattern.CASE_INSENSITIVE);

    private FunctionEvaluator functionEvaluator;

    public void setFunctionEvaluator(FunctionEvaluator fe) { this.functionEvaluator = fe; }

    /** Evaluate an expression to a boolean. Empty/invalid → false. */
    public boolean evaluateBoolean(String expr, Map<String, Object> fieldValues) {
        if (expr == null || expr.isBlank()) return false;

        // Resolve @{fieldName} → quoted/number/bool literals
        String resolved = resolveFieldRefs(expr, fieldValues);

        // Normalize JS-style operators
        resolved = resolved.replace("||", " OR ").replace("&&", " AND ");

        // OR has lowest precedence
        if (Pattern.compile("\\s+OR\\s+", Pattern.CASE_INSENSITIVE).matcher(resolved).find()) {
            for (String part : splitOutsideQuotes(resolved, "\\s+OR\\s+")) {
                if (evaluateBoolean(part.trim(), fieldValues)) return true;
            }
            return false;
        }
        // AND
        if (Pattern.compile("\\s+AND\\s+", Pattern.CASE_INSENSITIVE).matcher(resolved).find()) {
            for (String part : splitOutsideQuotes(resolved, "\\s+AND\\s+")) {
                if (!evaluateBoolean(part.trim(), fieldValues)) return false;
            }
            return true;
        }

        // Comparison (longest operators first)
        Matcher cmp = Pattern.compile("^(.+?)\\s*(===|!==|==|!=|>=|<=|>|<|=)\\s*(.+)$").matcher(resolved);
        if (cmp.matches()) {
            Object l = resolveLiteral(cmp.group(1).trim());
            Object r = resolveLiteral(cmp.group(3).trim());
            switch (cmp.group(2)) {
                case "===": return looseEquals(l, r) && typesMatch(l, r);
                case "!==": return !(looseEquals(l, r) && typesMatch(l, r));
                case "==":
                case "=":  return looseEquals(l, r);
                case "!=": return !looseEquals(l, r);
                case ">":  return toNum(l) > toNum(r);
                case "<":  return toNum(l) < toNum(r);
                case ">=": return toNum(l) >= toNum(r);
                case "<=": return toNum(l) <= toNum(r);
            }
        }

        // No operator: try evaluating as a function call if possible
        String trimmed = resolved.trim();
        if (functionEvaluator != null && FUNC_CALL.matcher(trimmed).matches()) {
            try {
                Object fnResult = functionEvaluator.evaluate(expr, new FunctionEvaluator.Context(fieldValues, null));
                return isTruthy(fnResult);
            } catch (Exception ignore) {}
        }

        // Otherwise, truthy check on the resolved value
        Object v = resolveLiteral(trimmed);
        return isTruthy(v);
    }

    private String resolveFieldRefs(String expr, Map<String, Object> fv) {
        Matcher m = FIELD_REF.matcher(expr);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1).trim();
            Object val = fv != null ? fv.get(key) : null;
            String replacement;
            if (val == null || "".equals(val)) replacement = "''";
            else if (val instanceof Number) replacement = val.toString();
            else if (val instanceof Boolean) replacement = val.toString();
            else replacement = "'" + String.valueOf(val).replace("'", "\\'") + "'";
            m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static Object resolveLiteral(String expr) {
        if (expr == null) return null;
        String t = expr.trim();
        if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
            return t.substring(1, t.length() - 1).replace("\\'", "'");
        }
        if (t.equalsIgnoreCase("true")) return Boolean.TRUE;
        if (t.equalsIgnoreCase("false")) return Boolean.FALSE;
        if (t.equalsIgnoreCase("null") || t.isEmpty()) return null;
        try { return Double.parseDouble(t); } catch (NumberFormatException ignore) {}
        return t;
    }

    private static boolean looseEquals(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) {
            // Treat empty string as equivalent to null (matches JS ==)
            return (a == null && "".equals(String.valueOf(b))) || (b == null && "".equals(String.valueOf(a)));
        }
        if (a instanceof Number && b instanceof Number)
            return ((Number) a).doubleValue() == ((Number) b).doubleValue();
        if (a instanceof Number || b instanceof Number) {
            try {
                return Double.parseDouble(String.valueOf(a)) == Double.parseDouble(String.valueOf(b));
            } catch (NumberFormatException ignore) {}
        }
        return String.valueOf(a).equals(String.valueOf(b));
    }

    private static boolean typesMatch(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof Number && b instanceof Number) return true;
        return a.getClass() == b.getClass();
    }

    private static double toNum(Object o) {
        if (o == null) return Double.NaN;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(String.valueOf(o)); }
        catch (NumberFormatException e) { return Double.NaN; }
    }

    private static boolean isTruthy(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean) return (Boolean) v;
        if (v instanceof Number) return ((Number) v).doubleValue() != 0.0;
        String s = String.valueOf(v);
        return !s.isEmpty() && !s.equalsIgnoreCase("false") && !"0".equals(s);
    }

    /** Split a string by a regex separator, but only outside quoted segments. */
    public static List<String> splitOutsideQuotes(String str, String separatorRegex) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean single = false, doubleQ = false;
        Pattern sep = Pattern.compile(separatorRegex, Pattern.CASE_INSENSITIVE);
        int i = 0;
        while (i < str.length()) {
            char c = str.charAt(i);
            if (c == '\'' && !doubleQ) { single = !single; cur.append(c); i++; continue; }
            if (c == '"' && !single) { doubleQ = !doubleQ; cur.append(c); i++; continue; }
            if (!single && !doubleQ) {
                Matcher m = sep.matcher(str.substring(i));
                if (m.lookingAt()) {
                    out.add(cur.toString());
                    cur.setLength(0);
                    i += m.end();
                    continue;
                }
            }
            cur.append(c);
            i++;
        }
        if (cur.length() > 0) out.add(cur.toString());
        if (out.isEmpty()) out.add(str);
        return out;
    }

    public static class WhenArgs {
        public String expr;
        public String message;
        public WhenArgs(String expr, String message) { this.expr = expr; this.message = message; }
    }

    /** Parse "ValidWhen(expr, "msg")" or "InvalidWhen(expr)" and extract expr + optional message. */
    public static WhenArgs parseWhenFunction(String expression, String funcName) {
        Pattern open = Pattern.compile("^" + funcName + "\\s*\\(", Pattern.CASE_INSENSITIVE);
        String inner = open.matcher(expression).replaceFirst("");
        if (inner.endsWith(")")) inner = inner.substring(0, inner.length() - 1);
        inner = inner.trim();
        if (inner.isEmpty()) return new WhenArgs(null, null);

        Matcher dbl = Pattern.compile(",\\s*\"([^\"]*)\"\\s*$").matcher(inner);
        if (dbl.find()) {
            String msg = dbl.group(1);
            String expr = inner.substring(0, dbl.start()).trim();
            return new WhenArgs(expr, msg);
        }
        Matcher sgl = Pattern.compile(",\\s*'([^']*)'\\s*$").matcher(inner);
        if (sgl.find()) {
            String candidate = inner.substring(0, sgl.start()).trim();
            if (Pattern.compile("[=!<>]|OR|AND|\\|\\||&&", Pattern.CASE_INSENSITIVE).matcher(candidate).find()) {
                return new WhenArgs(candidate, sgl.group(1));
            }
        }
        return new WhenArgs(inner, null);
    }
}
