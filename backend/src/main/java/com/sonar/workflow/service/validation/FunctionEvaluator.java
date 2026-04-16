package com.sonar.workflow.service.validation;

import com.sonar.workflow.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Server-side function evaluator mirroring the frontend's evaluateFunction().
 * Handles string, number, date, conditional, logical, user-context, and utility functions.
 *
 * Usage:
 *   FunctionEvaluator.Context ctx = new FunctionEvaluator.Context(fieldValues, currentUser);
 *   Object result = functionEvaluator.evaluate("CONCAT('Hello, ', @{name})", ctx);
 */
@Service
@Slf4j
public class FunctionEvaluator {

    private static final Pattern FUNC_CALL = Pattern.compile("^\\s*([A-Z_][A-Z0-9_]*)\\s*\\((.*)\\)\\s*$", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern FIELD_REF = Pattern.compile("@\\{([^}]+)\\}");

    /** Evaluation context carried through nested calls. */
    public static class Context {
        public final Map<String, Object> fieldValues;
        public final User currentUser;
        public Context(Map<String, Object> fieldValues, User currentUser) {
            this.fieldValues = fieldValues != null ? fieldValues : Collections.emptyMap();
            this.currentUser = currentUser;
        }
    }

    /** Evaluate an expression that may contain @{field} references and/or function calls. */
    public Object evaluate(String expression, Context ctx) {
        if (expression == null) return null;
        String expr = expression.trim();
        if (expr.isEmpty()) return "";

        // Literal: quoted string
        if ((expr.startsWith("\"") && expr.endsWith("\"") && expr.length() >= 2) ||
            (expr.startsWith("'") && expr.endsWith("'") && expr.length() >= 2)) {
            return expr.substring(1, expr.length() - 1);
        }

        // Literal: number
        if (expr.matches("^-?\\d+(\\.\\d+)?$")) {
            try {
                if (expr.contains(".")) return Double.parseDouble(expr);
                return Long.parseLong(expr);
            } catch (NumberFormatException ignore) {}
        }

        // Literal: boolean/null
        if (expr.equalsIgnoreCase("true")) return Boolean.TRUE;
        if (expr.equalsIgnoreCase("false")) return Boolean.FALSE;
        if (expr.equalsIgnoreCase("null")) return null;

        // Field reference
        Matcher fieldM = FIELD_REF.matcher(expr);
        if (fieldM.matches()) {
            return ctx.fieldValues.get(fieldM.group(1).trim());
        }

        // Resolve field refs inside the expression text (but not in function args — handled by parseArgs)
        // Actually, we only resolve refs when we can't match a function; leave function args to parseArgs.

        // Function call
        Matcher m = FUNC_CALL.matcher(expr);
        if (m.matches()) {
            String name = m.group(1).toUpperCase();
            String argsStr = m.group(2);
            List<Object> args = parseArgs(argsStr, ctx);
            try {
                return invoke(name, args, argsStr, ctx);
            } catch (Exception e) {
                log.warn("Function {} failed: {}", name, e.getMessage());
                return "";
            }
        }

        // Bare field name? Try as literal.
        return expr;
    }

    /** Returns true if the expression looks like a function call or has @{refs}. */
    public boolean isFunctionExpression(String s) {
        if (s == null) return false;
        if (FUNC_CALL.matcher(s.trim()).matches()) return true;
        return false;
    }

    // ---------- Argument parsing ----------
    private List<Object> parseArgs(String argsStr, Context ctx) {
        List<String> raw = parseArgsRaw(argsStr);
        List<Object> out = new ArrayList<>(raw.size());
        for (String r : raw) out.add(evaluate(r, ctx));
        return out;
    }

    private List<String> parseArgsRaw(String argsStr) {
        List<String> out = new ArrayList<>();
        if (argsStr == null || argsStr.isEmpty()) return out;
        int depth = 0;
        boolean inSingle = false, inDouble = false;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < argsStr.length(); i++) {
            char c = argsStr.charAt(i);
            if (c == '\\' && i + 1 < argsStr.length()) {
                cur.append(c).append(argsStr.charAt(++i));
                continue;
            }
            if (c == '\'' && !inDouble) { inSingle = !inSingle; cur.append(c); continue; }
            if (c == '"' && !inSingle) { inDouble = !inDouble; cur.append(c); continue; }
            if (!inSingle && !inDouble) {
                if (c == '(') depth++;
                else if (c == ')') depth--;
                else if (c == ',' && depth == 0) {
                    out.add(cur.toString().trim());
                    cur.setLength(0);
                    continue;
                }
            }
            cur.append(c);
        }
        if (cur.length() > 0) out.add(cur.toString().trim());
        return out;
    }

    // ---------- Main dispatch ----------
    private Object invoke(String name, List<Object> args, String rawArgsStr, Context ctx) {
        switch (name) {
            // ===== STRING =====
            case "UPPER": return str(arg(args, 0)).toUpperCase();
            case "LOWER": return str(arg(args, 0)).toLowerCase();
            case "TRIM": return str(arg(args, 0)).trim();
            case "LTRIM": case "TRIM_LEFT": return str(arg(args, 0)).replaceAll("^\\s+", "");
            case "RTRIM": case "TRIM_RIGHT": return str(arg(args, 0)).replaceAll("\\s+$", "");
            case "CONCAT": {
                StringBuilder sb = new StringBuilder();
                for (Object a : args) sb.append(str(a));
                return sb.toString();
            }
            case "CONCAT_WS": {
                if (args.isEmpty()) return "";
                String sep = str(args.get(0));
                StringJoiner sj = new StringJoiner(sep);
                for (int i = 1; i < args.size(); i++) {
                    String v = str(args.get(i));
                    if (!v.isEmpty()) sj.add(v);
                }
                return sj.toString();
            }
            case "LEFT": {
                String s = str(arg(args, 0)); int n = toInt(arg(args, 1));
                return s.substring(0, Math.min(Math.max(n, 0), s.length()));
            }
            case "RIGHT": {
                String s = str(arg(args, 0)); int n = toInt(arg(args, 1));
                return s.substring(Math.max(0, s.length() - n));
            }
            case "SUBSTRING": {
                String s = str(arg(args, 0));
                int start = toInt(arg(args, 1));
                int len = args.size() > 2 ? toInt(arg(args, 2)) : Math.max(0, s.length() - start);
                start = Math.max(0, Math.min(start, s.length()));
                int end = Math.max(start, Math.min(start + len, s.length()));
                return s.substring(start, end);
            }
            case "LENGTH": return str(arg(args, 0)).length();
            case "REPLACE": case "REPLACE_ALL":
                return str(arg(args, 0)).replace(str(arg(args, 1)), str(arg(args, 2)));
            case "REPLACE_FIRST":
                return str(arg(args, 0)).replaceFirst(Pattern.quote(str(arg(args, 1))), Matcher.quoteReplacement(str(arg(args, 2))));
            case "CONTAINS": return str(arg(args, 0)).contains(str(arg(args, 1)));
            case "CONTAINS_IGNORE_CASE":
                return str(arg(args, 0)).toLowerCase().contains(str(arg(args, 1)).toLowerCase());
            case "STARTS_WITH": return str(arg(args, 0)).startsWith(str(arg(args, 1)));
            case "ENDS_WITH": return str(arg(args, 0)).endsWith(str(arg(args, 1)));
            case "CAPITALIZE": {
                String s = str(arg(args, 0));
                return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
            }
            case "TITLE_CASE": return titleCase(str(arg(args, 0)));
            case "SENTENCE_CASE": return sentenceCase(str(arg(args, 0)));
            case "REVERSE": return new StringBuilder(str(arg(args, 0))).reverse().toString();
            case "REPEAT": return str(arg(args, 0)).repeat(Math.max(0, toInt(arg(args, 1))));
            case "PAD_LEFT": {
                String s = str(arg(args, 0)); int n = toInt(arg(args, 1));
                String c = args.size() > 2 ? str(arg(args, 2)) : " "; if (c.isEmpty()) c = " ";
                StringBuilder sb = new StringBuilder(s);
                while (sb.length() < n) sb.insert(0, c);
                return sb.length() > n ? sb.substring(sb.length() - n) : sb.toString();
            }
            case "PAD_RIGHT": {
                String s = str(arg(args, 0)); int n = toInt(arg(args, 1));
                String c = args.size() > 2 ? str(arg(args, 2)) : " "; if (c.isEmpty()) c = " ";
                StringBuilder sb = new StringBuilder(s);
                while (sb.length() < n) sb.append(c);
                return sb.length() > n ? sb.substring(0, n) : sb.toString();
            }
            case "WORD_COUNT": {
                String s = str(arg(args, 0)).trim();
                return s.isEmpty() ? 0 : s.split("\\s+").length;
            }
            case "CHAR_AT": {
                String s = str(arg(args, 0)); int i = toInt(arg(args, 1));
                return i >= 0 && i < s.length() ? String.valueOf(s.charAt(i)) : "";
            }
            case "INDEX_OF": return str(arg(args, 0)).indexOf(str(arg(args, 1)));
            case "LAST_INDEX_OF": return str(arg(args, 0)).lastIndexOf(str(arg(args, 1)));
            case "SPLIT": {
                String[] parts = str(arg(args, 0)).split(Pattern.quote(str(arg(args, 1))));
                return Arrays.asList(parts);
            }
            case "JOIN": {
                Object a = arg(args, 0); String sep = str(arg(args, 1));
                if (a instanceof List) return String.join(sep, ((List<?>) a).stream().map(Object::toString).toArray(String[]::new));
                return str(a);
            }
            case "INITIALS": {
                StringBuilder out = new StringBuilder();
                for (String w : str(arg(args, 0)).split("\\s+"))
                    if (!w.isEmpty()) out.append(Character.toUpperCase(w.charAt(0)));
                return out.toString();
            }
            case "SLUG":
                return str(arg(args, 0)).toLowerCase().trim().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
            case "CLEAN": return str(arg(args, 0)).replaceAll("[^\\x20-\\x7E]", "");
            case "REMOVE_SPACES": return str(arg(args, 0)).replaceAll("\\s", "");
            case "COLLAPSE_SPACES": return str(arg(args, 0)).replaceAll("\\s+", " ");
            case "EXTRACT_NUMBERS": return str(arg(args, 0)).replaceAll("[^0-9]", "");
            case "EXTRACT_LETTERS": return str(arg(args, 0)).replaceAll("[^a-zA-Z]", "");
            case "EXTRACT_ALPHANUMERIC": return str(arg(args, 0)).replaceAll("[^a-zA-Z0-9]", "");
            case "MASK": {
                String s = str(arg(args, 0)); int start = toInt(arg(args, 1));
                int end = toInt(arg(args, 2));
                String ch = args.size() > 3 ? str(arg(args, 3)) : "*"; if (ch.isEmpty()) ch = "*";
                int actualEnd = end < 0 ? s.length() + end : end;
                actualEnd = Math.max(start, Math.min(actualEnd, s.length()));
                StringBuilder sb = new StringBuilder(s.substring(0, Math.min(start, s.length())));
                for (int i = 0; i < actualEnd - start; i++) sb.append(ch);
                if (actualEnd < s.length()) sb.append(s.substring(actualEnd));
                return sb.toString();
            }
            case "MASK_EMAIL": {
                String email = str(arg(args, 0));
                int at = email.indexOf('@');
                if (at < 0) return email;
                return email.charAt(0) + "***@" + email.substring(at + 1);
            }
            case "MASK_PHONE": {
                String p = str(arg(args, 0)).replaceAll("\\D", "");
                return p.length() > 4 ? "*".repeat(p.length() - 4) + p.substring(p.length() - 4) : p;
            }
            case "ENCODE_HTML": {
                return str(arg(args, 0))
                    .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    .replace("\"", "&quot;").replace("'", "&#39;");
            }
            case "DECODE_HTML": {
                return str(arg(args, 0))
                    .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&quot;", "\"").replace("&#39;", "'");
            }
            case "WRAP": return str(arg(args, 1)) + str(arg(args, 0)) + str(arg(args, 2));
            case "TRUNCATE": {
                String s = str(arg(args, 0)); int n = toInt(arg(args, 1));
                String suffix = args.size() > 2 ? str(arg(args, 2)) : "...";
                return s.length() > n ? s.substring(0, Math.max(0, n - suffix.length())) + suffix : s;
            }
            case "REGEX_MATCH": {
                try { return Pattern.compile(str(arg(args, 1))).matcher(str(arg(args, 0))).find(); }
                catch (Exception e) { return false; }
            }
            case "REGEX_EXTRACT": {
                try {
                    Matcher mm = Pattern.compile(str(arg(args, 1))).matcher(str(arg(args, 0)));
                    return mm.find() ? mm.group() : "";
                } catch (Exception e) { return ""; }
            }
            case "REGEX_REPLACE": {
                try {
                    return Pattern.compile(str(arg(args, 1))).matcher(str(arg(args, 0)))
                        .replaceAll(Matcher.quoteReplacement(str(arg(args, 2))));
                } catch (Exception e) { return arg(args, 0); }
            }

            // ===== NUMBER =====
            case "SUM": {
                double sum = 0;
                for (Object a : args) sum += toNum(a);
                return sum;
            }
            case "SUBTRACT": return toNum(arg(args, 0)) - toNum(arg(args, 1));
            case "MULTIPLY": return toNum(arg(args, 0)) * toNum(arg(args, 1));
            case "DIVIDE": {
                double b = toNum(arg(args, 1));
                return b == 0 ? 0.0 : toNum(arg(args, 0)) / b;
            }
            case "ROUND": {
                int d = args.size() > 1 ? toInt(arg(args, 1)) : 0;
                return new BigDecimal(toNum(arg(args, 0))).setScale(d, RoundingMode.HALF_UP).doubleValue();
            }
            case "ROUND_UP": {
                int d = args.size() > 1 ? toInt(arg(args, 1)) : 0;
                return new BigDecimal(toNum(arg(args, 0))).setScale(d, RoundingMode.CEILING).doubleValue();
            }
            case "ROUND_DOWN": {
                int d = args.size() > 1 ? toInt(arg(args, 1)) : 0;
                return new BigDecimal(toNum(arg(args, 0))).setScale(d, RoundingMode.FLOOR).doubleValue();
            }
            case "FLOOR": return Math.floor(toNum(arg(args, 0)));
            case "CEIL": case "CEILING": return Math.ceil(toNum(arg(args, 0)));
            case "TRUNC": return (double) (long) toNum(arg(args, 0));
            case "ABS": return Math.abs(toNum(arg(args, 0)));
            case "SIGN": return (double) Long.signum((long) toNum(arg(args, 0)));
            case "NEGATE": return -toNum(arg(args, 0));
            case "MIN": {
                double min = Double.POSITIVE_INFINITY;
                for (Object a : args) min = Math.min(min, toNum(a));
                return min;
            }
            case "MAX": {
                double max = Double.NEGATIVE_INFINITY;
                for (Object a : args) max = Math.max(max, toNum(a));
                return max;
            }
            case "AVERAGE": case "AVG": case "MEAN": {
                if (args.isEmpty()) return 0.0;
                double s = 0; for (Object a : args) s += toNum(a);
                return s / args.size();
            }
            case "MEDIAN": {
                List<Double> list = new ArrayList<>();
                for (Object a : args) list.add(toNum(a));
                Collections.sort(list);
                if (list.isEmpty()) return 0.0;
                int mid = list.size() / 2;
                return list.size() % 2 == 1 ? list.get(mid) : (list.get(mid - 1) + list.get(mid)) / 2.0;
            }
            case "COUNT": {
                int c = 0;
                for (Object a : args) if (a != null && !str(a).isEmpty()) c++;
                return c;
            }
            case "PRODUCT": {
                double p = 1; for (Object a : args) p *= toNum(a); return p;
            }
            case "PERCENTAGE": {
                double b = toNum(arg(args, 1));
                return b == 0 ? 0.0 : toNum(arg(args, 0)) / b * 100.0;
            }
            case "PERCENT_OF": return toNum(arg(args, 0)) * toNum(arg(args, 1)) / 100.0;
            case "PERCENT_CHANGE": {
                double a = toNum(arg(args, 0));
                return a == 0 ? 0.0 : (toNum(arg(args, 1)) - a) / a * 100.0;
            }
            case "MOD": return toNum(arg(args, 0)) % toNum(arg(args, 1));
            case "POWER": case "POW": return Math.pow(toNum(arg(args, 0)), toNum(arg(args, 1)));
            case "SQRT": return Math.sqrt(toNum(arg(args, 0)));
            case "CBRT": return Math.cbrt(toNum(arg(args, 0)));
            case "LOG": return Math.log(toNum(arg(args, 0)));
            case "LOG10": return Math.log10(toNum(arg(args, 0)));
            case "LOG2": return Math.log(toNum(arg(args, 0))) / Math.log(2);
            case "EXP": return Math.exp(toNum(arg(args, 0)));
            case "FACTORIAL": {
                long n = toInt(arg(args, 0)); long r = 1;
                for (int i = 2; i <= n; i++) r *= i;
                return r;
            }
            case "GCD": {
                long a = Math.abs(toInt(arg(args, 0))), b = Math.abs(toInt(arg(args, 1)));
                while (b != 0) { long t = b; b = a % b; a = t; }
                return a;
            }
            case "LCM": {
                long a = Math.abs(toInt(arg(args, 0))), b = Math.abs(toInt(arg(args, 1)));
                long g = a, t = b;
                while (t != 0) { long tt = t; t = g % t; g = tt; }
                return g == 0 ? 0 : a * b / g;
            }
            case "RANDOM": return Math.random();
            case "RANDOM_INT": {
                int min = toInt(arg(args, 0)), max = toInt(arg(args, 1));
                return min + (long) (Math.random() * (max - min + 1));
            }
            case "CLAMP": {
                double v = toNum(arg(args, 0)), lo = toNum(arg(args, 1)), hi = toNum(arg(args, 2));
                return Math.min(Math.max(v, lo), hi);
            }
            case "SIN": return Math.sin(toNum(arg(args, 0)));
            case "COS": return Math.cos(toNum(arg(args, 0)));
            case "TAN": return Math.tan(toNum(arg(args, 0)));
            case "DEGREES": return toNum(arg(args, 0)) * 180.0 / Math.PI;
            case "RADIANS": return toNum(arg(args, 0)) * Math.PI / 180.0;
            case "PI": return Math.PI;
            case "E": return Math.E;
            case "HEX": return Long.toHexString(toInt(arg(args, 0))).toUpperCase();
            case "BIN": return Long.toBinaryString(toInt(arg(args, 0)));
            case "OCT": return Long.toOctalString(toInt(arg(args, 0)));
            case "PARSE_INT": {
                int radix = args.size() > 1 ? Math.max(2, Math.min(36, toInt(arg(args, 1)))) : 10;
                try { return Long.parseLong(str(arg(args, 0)), radix); } catch (Exception e) { return 0L; }
            }
            case "FORMAT_NUMBER": {
                double n = toNum(arg(args, 0)); int d = toInt(arg(args, 1));
                return String.format("%,." + d + "f", n);
            }
            case "FORMAT_PERCENTAGE": case "FORMAT_PERCENT":
                return String.format("%." + toInt(arg(args, 1)) + "f%%", toNum(arg(args, 0)));
            case "FORMAT_BYTES": {
                double b = toNum(arg(args, 0));
                if (b == 0) return "0 Bytes";
                String[] units = {"Bytes", "KB", "MB", "GB", "TB"};
                int i = (int) Math.floor(Math.log(b) / Math.log(1024));
                i = Math.min(i, units.length - 1);
                return String.format("%.2f %s", b / Math.pow(1024, i), units[i]);
            }
            case "FORMAT_ORDINAL": {
                int n = toInt(arg(args, 0));
                String[] s = {"th", "st", "nd", "rd"};
                int v = n % 100;
                return n + s[(v - 20) % 10 >= 0 && (v - 20) % 10 < 4 ? (v - 20) % 10
                               : (v >= 0 && v < 4 ? v : 0)];
            }

            // ===== DATE =====
            case "TODAY": return LocalDate.now().toString();
            case "NOW": return LocalDateTime.now().withNano(0).toString();
            case "TIMESTAMP": return System.currentTimeMillis();
            case "CURRENT_DATE": return LocalDate.now().toString();
            case "CURRENT_TIME": return LocalDateTime.now().toLocalTime().withNano(0).toString();
            case "CURRENT_DATETIME": return LocalDateTime.now().withNano(0).toString();
            case "CURRENT_YEAR": return LocalDate.now().getYear();
            case "CURRENT_MONTH": return LocalDate.now().getMonthValue();
            case "DATE": {
                return LocalDate.of(toInt(arg(args, 0)), toInt(arg(args, 1)), toInt(arg(args, 2))).toString();
            }
            case "DATETIME": {
                return LocalDateTime.of(toInt(arg(args, 0)), toInt(arg(args, 1)), toInt(arg(args, 2)),
                        args.size() > 3 ? toInt(arg(args, 3)) : 0,
                        args.size() > 4 ? toInt(arg(args, 4)) : 0,
                        args.size() > 5 ? toInt(arg(args, 5)) : 0).toString();
            }
            case "DATE_FORMAT": {
                LocalDateTime d = toDateTime(arg(args, 0));
                if (d == null) return "";
                try {
                    String javaFmt = jsToJavaDatePattern(str(arg(args, 1)));
                    return d.format(DateTimeFormatter.ofPattern(javaFmt));
                } catch (Exception e) { return d.toString(); }
            }
            case "DATE_ADD": {
                LocalDateTime d = toDateTime(arg(args, 0));
                return d == null ? "" : addToDate(d, toInt(arg(args, 1)), str(arg(args, 2)).toLowerCase()).toString();
            }
            case "DATE_SUBTRACT": {
                LocalDateTime d = toDateTime(arg(args, 0));
                return d == null ? "" : addToDate(d, -toInt(arg(args, 1)), str(arg(args, 2)).toLowerCase()).toString();
            }
            case "DATE_DIFF": {
                LocalDateTime a = toDateTime(arg(args, 0));
                LocalDateTime b = toDateTime(arg(args, 1));
                if (a == null || b == null) return 0L;
                String unit = str(arg(args, 2)).toLowerCase();
                return diff(a, b, unit);
            }
            case "AGE": {
                LocalDate b = toDate(arg(args, 0));
                return b == null ? 0 : ChronoUnit.YEARS.between(b, LocalDate.now());
            }
            case "YEAR": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getYear();
            }
            case "MONTH": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getMonthValue();
            }
            case "DAY": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getDayOfMonth();
            }
            case "HOUR": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getHour();
            }
            case "MINUTE": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getMinute();
            }
            case "SECOND": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? 0 : d.getSecond();
            }
            case "WEEKDAY": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : d.getDayOfWeek().getValue();
            }
            case "WEEKDAY_NAME": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH);
            }
            case "WEEKDAY_SHORT": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH);
            }
            case "WEEK_NUMBER": case "WEEK_OF_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : d.get(WeekFields.ISO.weekOfYear());
            }
            case "QUARTER": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : ((d.getMonthValue() - 1) / 3) + 1;
            }
            case "MONTH_NAME": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.getMonth().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH);
            }
            case "MONTH_SHORT": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH);
            }
            case "DAY_OF_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : d.getDayOfYear();
            }
            case "DAYS_IN_MONTH": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : d.lengthOfMonth();
            }
            case "DAYS_IN_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? 0 : d.lengthOfYear();
            }
            case "IS_LEAP_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d != null && d.isLeapYear();
            }
            case "START_OF_DAY": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? "" : d.toLocalDate().atStartOfDay().toString();
            }
            case "END_OF_DAY": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? "" : d.toLocalDate().atTime(23, 59, 59).toString();
            }
            case "START_OF_WEEK": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.with(DayOfWeek.MONDAY).toString();
            }
            case "END_OF_WEEK": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.with(DayOfWeek.SUNDAY).toString();
            }
            case "START_OF_MONTH": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.withDayOfMonth(1).toString();
            }
            case "END_OF_MONTH": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.withDayOfMonth(d.lengthOfMonth()).toString();
            }
            case "START_OF_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.withDayOfYear(1).toString();
            }
            case "END_OF_YEAR": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                return d == null ? "" : d.withDayOfYear(d.lengthOfYear()).toString();
            }
            case "IS_WEEKEND": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                if (d == null) return false;
                DayOfWeek w = d.getDayOfWeek();
                return w == DayOfWeek.SATURDAY || w == DayOfWeek.SUNDAY;
            }
            case "IS_WEEKDAY": case "IS_WORKDAY": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                if (d == null) return false;
                DayOfWeek w = d.getDayOfWeek();
                return w != DayOfWeek.SATURDAY && w != DayOfWeek.SUNDAY;
            }
            case "IS_TODAY": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.equals(LocalDate.now());
            }
            case "IS_YESTERDAY": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.equals(LocalDate.now().minusDays(1));
            }
            case "IS_TOMORROW": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.equals(LocalDate.now().plusDays(1));
            }
            case "IS_PAST": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.isBefore(LocalDate.now());
            }
            case "IS_FUTURE": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.isAfter(LocalDate.now());
            }
            case "IS_THIS_MONTH": {
                LocalDate d = toDate(arg(args, 0)); LocalDate t = LocalDate.now();
                return d != null && d.getMonth() == t.getMonth() && d.getYear() == t.getYear();
            }
            case "IS_THIS_YEAR": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.getYear() == LocalDate.now().getYear();
            }
            case "IS_SAME_DAY": {
                LocalDate a = toDate(arg(args, 0)); LocalDate b = toDate(arg(args, 1));
                return a != null && b != null && a.equals(b);
            }
            case "IS_BEFORE": {
                LocalDate a = toDate(arg(args, 0)); LocalDate b = toDate(arg(args, 1));
                return a != null && b != null && a.isBefore(b);
            }
            case "IS_AFTER": {
                LocalDate a = toDate(arg(args, 0)); LocalDate b = toDate(arg(args, 1));
                return a != null && b != null && a.isAfter(b);
            }
            case "IS_BETWEEN_DATES": {
                LocalDate d = toDate(arg(args, 0));
                LocalDate s = toDate(arg(args, 1));
                LocalDate e = toDate(arg(args, 2));
                return d != null && s != null && e != null && !d.isBefore(s) && !d.isAfter(e);
            }
            case "BUSINESS_DAYS": {
                LocalDate s = toDate(arg(args, 0)); LocalDate e = toDate(arg(args, 1));
                if (s == null || e == null) return 0L;
                long count = 0;
                for (LocalDate cur = s; !cur.isAfter(e); cur = cur.plusDays(1)) {
                    DayOfWeek w = cur.getDayOfWeek();
                    if (w != DayOfWeek.SATURDAY && w != DayOfWeek.SUNDAY) count++;
                }
                return count;
            }
            case "ADD_BUSINESS_DAYS": {
                LocalDate d = args.isEmpty() ? LocalDate.now() : toDate(arg(args, 0));
                if (d == null) return "";
                int n = toInt(arg(args, 1));
                while (n > 0) {
                    d = d.plusDays(1);
                    if (d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY) n--;
                }
                return d.toString();
            }
            case "ISO_STRING": {
                LocalDateTime d = args.isEmpty() ? LocalDateTime.now() : toDateTime(arg(args, 0));
                return d == null ? "" : d.atZone(ZoneId.systemDefault()).toInstant().toString();
            }

            // ===== CONDITIONAL =====
            case "IF": case "IF_ELSE": case "IFELSE": {
                boolean c = toBool(arg(args, 0));
                return c ? arg(args, 1) : (args.size() > 2 ? arg(args, 2) : "");
            }
            case "IF_EMPTY": {
                Object v = arg(args, 0);
                return (v == null || str(v).trim().isEmpty()) ? arg(args, 1) : v;
            }
            case "IF_NOT_EMPTY": {
                Object v = arg(args, 0);
                return (v != null && !str(v).trim().isEmpty()) ? arg(args, 1) : (args.size() > 2 ? arg(args, 2) : "");
            }
            case "IF_EQUALS":
                return str(arg(args, 0)).equals(str(arg(args, 1))) ? arg(args, 2) : (args.size() > 3 ? arg(args, 3) : "");
            case "IF_GREATER":
                return toNum(arg(args, 0)) > toNum(arg(args, 1)) ? arg(args, 2) : (args.size() > 3 ? arg(args, 3) : "");
            case "IF_LESS":
                return toNum(arg(args, 0)) < toNum(arg(args, 1)) ? arg(args, 2) : (args.size() > 3 ? arg(args, 3) : "");
            case "IF_CONTAINS":
                return str(arg(args, 0)).toLowerCase().contains(str(arg(args, 1)).toLowerCase())
                    ? arg(args, 2) : (args.size() > 3 ? arg(args, 3) : "");
            case "IF_BETWEEN": {
                double v = toNum(arg(args, 0)); double lo = toNum(arg(args, 1)); double hi = toNum(arg(args, 2));
                return (v >= lo && v <= hi) ? arg(args, 3) : (args.size() > 4 ? arg(args, 4) : "");
            }
            case "IFS": {
                for (int i = 0; i < args.size() - 1; i += 2)
                    if (toBool(arg(args, i))) return arg(args, i + 1);
                return args.size() % 2 == 1 ? arg(args, args.size() - 1) : "";
            }
            case "SWITCH": {
                Object val = arg(args, 0);
                for (int i = 1; i < args.size() - 1; i += 2)
                    if (Objects.equals(val, arg(args, i))) return arg(args, i + 1);
                return args.size() % 2 == 0 ? arg(args, args.size() - 1) : "";
            }
            case "CHOOSE": {
                int i = toInt(arg(args, 0));
                return (i >= 1 && i < args.size()) ? arg(args, i) : "";
            }

            // ===== BOOLEAN / LOGIC =====
            case "AND": {
                for (Object a : args) if (!toBool(a)) return false;
                return true;
            }
            case "OR": {
                for (Object a : args) if (toBool(a)) return true;
                return false;
            }
            case "NOT": return !toBool(arg(args, 0));
            case "XOR": return toBool(arg(args, 0)) ^ toBool(arg(args, 1));
            case "NAND": return !(toBool(arg(args, 0)) && toBool(arg(args, 1)));
            case "NOR": return !(toBool(arg(args, 0)) || toBool(arg(args, 1)));
            case "IS_EMPTY": case "IS_BLANK": {
                Object v = arg(args, 0);
                return v == null || str(v).trim().isEmpty();
            }
            case "IS_NOT_EMPTY": {
                Object v = arg(args, 0);
                return v != null && !str(v).trim().isEmpty();
            }
            case "IS_NULL": return arg(args, 0) == null;
            case "IS_NOT_NULL": return arg(args, 0) != null;
            case "IS_TRUE": return toBool(arg(args, 0));
            case "IS_FALSE": return !toBool(arg(args, 0));
            case "TRUE": return true;
            case "FALSE": return false;
            case "EQUALS": return Objects.equals(arg(args, 0), arg(args, 1));
            case "EQUALS_IGNORE_CASE": return str(arg(args, 0)).equalsIgnoreCase(str(arg(args, 1)));
            case "NOT_EQUALS": return !Objects.equals(arg(args, 0), arg(args, 1));
            case "GREATER_THAN": return toNum(arg(args, 0)) > toNum(arg(args, 1));
            case "GREATER_THAN_OR_EQUAL": case "GREATER_OR_EQUAL":
                return toNum(arg(args, 0)) >= toNum(arg(args, 1));
            case "LESS_THAN": return toNum(arg(args, 0)) < toNum(arg(args, 1));
            case "LESS_THAN_OR_EQUAL": case "LESS_OR_EQUAL":
                return toNum(arg(args, 0)) <= toNum(arg(args, 1));
            case "BETWEEN": {
                double v = toNum(arg(args, 0));
                return v >= toNum(arg(args, 1)) && v <= toNum(arg(args, 2));
            }
            case "NOT_BETWEEN": {
                double v = toNum(arg(args, 0));
                return v < toNum(arg(args, 1)) || v > toNum(arg(args, 2));
            }
            case "IN": {
                Object v = arg(args, 0);
                for (int i = 1; i < args.size(); i++) if (Objects.equals(v, arg(args, i))) return true;
                return false;
            }
            case "NOT_IN": {
                Object v = arg(args, 0);
                for (int i = 1; i < args.size(); i++) if (Objects.equals(v, arg(args, i))) return false;
                return true;
            }
            case "IS_NUMBER": {
                try { Double.parseDouble(str(arg(args, 0))); return true; } catch (Exception e) { return false; }
            }
            case "IS_INTEGER": {
                try { Long.parseLong(str(arg(args, 0))); return true; } catch (Exception e) { return false; }
            }
            case "IS_DECIMAL": return toNum(arg(args, 0)) % 1 != 0;
            case "IS_POSITIVE": return toNum(arg(args, 0)) > 0;
            case "IS_NEGATIVE": return toNum(arg(args, 0)) < 0;
            case "IS_ZERO": return toNum(arg(args, 0)) == 0;
            case "IS_EVEN": return toInt(arg(args, 0)) % 2 == 0;
            case "IS_ODD": return toInt(arg(args, 0)) % 2 != 0;
            case "IS_TEXT": return arg(args, 0) instanceof String;
            case "IS_DATE": return toDate(arg(args, 0)) != null;
            case "IS_BOOLEAN": {
                Object v = arg(args, 0);
                return v instanceof Boolean || "true".equalsIgnoreCase(str(v)) || "false".equalsIgnoreCase(str(v));
            }
            case "IS_EMAIL": case "IS_VALID_EMAIL":
                return str(arg(args, 0)).matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
            case "IS_URL": case "IS_VALID_URL": {
                try { new java.net.URL(str(arg(args, 0))); return true; } catch (Exception e) { return false; }
            }
            case "IS_PHONE": case "IS_VALID_PHONE":
                return str(arg(args, 0)).matches("^[\\d\\s\\-+()]{7,20}$");
            case "IS_UUID":
                return str(arg(args, 0)).matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
            case "IS_ALPHANUMERIC": return str(arg(args, 0)).matches("^[a-zA-Z0-9]+$");
            case "IS_ALPHA": return str(arg(args, 0)).matches("^[a-zA-Z]+$");
            case "IS_NUMERIC": return str(arg(args, 0)).matches("^[0-9]+$");
            case "IS_UPPERCASE": {
                String s = str(arg(args, 0));
                return s.equals(s.toUpperCase());
            }
            case "IS_LOWERCASE": {
                String s = str(arg(args, 0));
                return s.equals(s.toLowerCase());
            }
            case "MATCHES_PATTERN": {
                try { return Pattern.compile(str(arg(args, 1))).matcher(str(arg(args, 0))).find(); }
                catch (Exception e) { return false; }
            }
            case "HAS_LENGTH": return str(arg(args, 0)).length() == toInt(arg(args, 1));
            case "HAS_MIN_LENGTH": return str(arg(args, 0)).length() >= toInt(arg(args, 1));
            case "HAS_MAX_LENGTH": return str(arg(args, 0)).length() <= toInt(arg(args, 1));
            case "REQUIRED": case "NOT_EMPTY": case "NOTEMPTY": {
                String v = args.isEmpty() ? "" : str(arg(args, 0));
                return !v.trim().isEmpty();
            }
            case "MIN_LENGTH": case "MINLENGTH": return str(arg(args, 0)).length() >= toInt(arg(args, 1));
            case "MAX_LENGTH": case "MAXLENGTH": return str(arg(args, 0)).length() <= toInt(arg(args, 1));
            case "LENGTH_RANGE": case "LENGTHRANGE": {
                int len = str(arg(args, 0)).length();
                return len >= toInt(arg(args, 1)) && len <= toInt(arg(args, 2));
            }
            case "ALPHA": return str(arg(args, 0)).matches("^[a-zA-Z]*$");
            case "ALPHA_NUMERIC": case "ALPHANUMERIC": return str(arg(args, 0)).matches("^[a-zA-Z0-9]*$");
            case "DIGITS": return str(arg(args, 0)).matches("^\\d*$");
            case "MIN_VALUE": return toNum(arg(args, 0)) >= toNum(arg(args, 1));
            case "MAX_VALUE": return toNum(arg(args, 0)) <= toNum(arg(args, 1));
            case "POSITIVE": return toNum(arg(args, 0)) > 0;
            case "NEGATIVE": return toNum(arg(args, 0)) < 0;
            case "INTEGER": { try { Long.parseLong(str(arg(args, 0))); return true; } catch (Exception e) { return false; } }
            case "PAST_DATE": case "PASTDATE": case "ISPAST": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.isBefore(LocalDate.now());
            }
            case "FUTURE_DATE": case "FUTUREDATE": case "ISFUTURE": {
                LocalDate d = toDate(arg(args, 0));
                return d != null && d.isAfter(LocalDate.now());
            }
            case "DATE_BEFORE": case "DATEBEFORE": {
                LocalDate d = toDate(arg(args, 0));
                LocalDate t = "today".equalsIgnoreCase(str(arg(args, 1))) ? LocalDate.now() : toDate(arg(args, 1));
                return d != null && t != null && d.isBefore(t);
            }
            case "DATE_AFTER": case "DATEAFTER": {
                LocalDate d = toDate(arg(args, 0));
                LocalDate t = "today".equalsIgnoreCase(str(arg(args, 1))) ? LocalDate.now() : toDate(arg(args, 1));
                return d != null && t != null && d.isAfter(t);
            }
            case "IS_CREDIT_CARD": case "CREDITCARD": case "CREDIT_CARD": {
                String card = str(arg(args, 0)).replaceAll("[\\s-]", "");
                if (!card.matches("^\\d{13,19}$")) return false;
                int s = 0; boolean even = false;
                for (int i = card.length() - 1; i >= 0; i--) {
                    int d = card.charAt(i) - '0';
                    if (even) { d *= 2; if (d > 9) d -= 9; }
                    s += d; even = !even;
                }
                return s % 10 == 0;
            }
            case "MATCH_FIELD": case "MATCHFIELD":
                return str(arg(args, 0)).equals(str(arg(args, 1)));

            // ===== USER / CONTEXT =====
            case "CURRENT_USER": return ctx.currentUser != null ? ctx.currentUser.getFullName() : "";
            case "CURRENT_USER_EMAIL": return ctx.currentUser != null ? str(ctx.currentUser.getEmail()) : "";
            case "CURRENT_USER_ID": return ctx.currentUser != null && ctx.currentUser.getId() != null ? ctx.currentUser.getId().toString() : "";
            case "CURRENT_USERNAME": return ctx.currentUser != null ? str(ctx.currentUser.getUsername()) : "";
            case "CURRENT_USER_PHONE": return ctx.currentUser != null ? str(ctx.currentUser.getPhoneNumber()) : "";
            case "CURRENT_USER_DEPARTMENT": case "CURRENT_USER_DEPT":
                return ctx.currentUser != null ? str(ctx.currentUser.getDepartment()) : "";
            case "CURRENT_USER_STAFFID":
                return ctx.currentUser != null ? str(ctx.currentUser.getStaffId()) : "";
            case "CURRENT_USER_SBU": {
                if (ctx.currentUser == null || ctx.currentUser.getSbus() == null || ctx.currentUser.getSbus().isEmpty()) return "";
                return ctx.currentUser.getSbus().iterator().next().getName();
            }
            case "CURRENT_USER_BRANCH": {
                if (ctx.currentUser == null || ctx.currentUser.getBranches() == null || ctx.currentUser.getBranches().isEmpty()) return "";
                return ctx.currentUser.getBranches().iterator().next().getName();
            }
            case "CURRENT_USER_ROLES": {
                if (ctx.currentUser == null || ctx.currentUser.getRoles() == null) return "";
                StringJoiner sj = new StringJoiner(",");
                ctx.currentUser.getRoles().forEach(r -> sj.add(r.getName()));
                return sj.toString();
            }

            // ===== UTILITY =====
            case "UUID": return UUID.randomUUID().toString();
            case "SHORT_UUID": {
                int len = args.isEmpty() ? 8 : Math.max(1, Math.min(32, toInt(arg(args, 0))));
                return UUID.randomUUID().toString().replace("-", "").substring(0, len);
            }
            case "NANO_ID": case "RANDOM_STRING": {
                int len = args.isEmpty() ? 21 : toInt(arg(args, 0));
                if (len <= 0) len = 21;
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                StringBuilder sb = new StringBuilder();
                Random r = new Random();
                for (int i = 0; i < len; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
                return sb.toString();
            }
            case "RANDOM_CODE": {
                int len = args.isEmpty() ? 6 : toInt(arg(args, 0));
                String charset = args.size() > 1 ? str(arg(args, 1)).toUpperCase() : "";
                String chars = "ALPHA".equals(charset) ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                             : "NUMERIC".equals(charset) ? "0123456789"
                             : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                StringBuilder sb = new StringBuilder();
                Random r = new Random();
                for (int i = 0; i < len; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
                return sb.toString();
            }
            case "SEQUENCE": {
                String prefix = args.isEmpty() ? "" : str(arg(args, 0));
                String ts = String.valueOf(System.currentTimeMillis());
                return prefix + ts.substring(Math.max(0, ts.length() - 8));
            }
            case "SEQUENCE_PADDED": {
                String prefix = args.isEmpty() ? "" : str(arg(args, 0));
                int len = args.size() > 1 ? toInt(arg(args, 1)) : 6;
                if (len < 1) len = 6;
                String ts = String.valueOf(System.currentTimeMillis());
                String tail = ts.substring(Math.max(0, ts.length() - len));
                while (tail.length() < len) tail = "0" + tail;
                return prefix + tail;
            }
            case "FORMAT_CURRENCY": {
                double n = toNum(arg(args, 0));
                String code = args.size() > 1 ? str(arg(args, 1)) : "USD";
                try {
                    java.util.Currency c = java.util.Currency.getInstance(code);
                    java.text.NumberFormat nf = java.text.NumberFormat.getCurrencyInstance(Locale.US);
                    nf.setCurrency(c);
                    return nf.format(n);
                } catch (Exception e) {
                    return code + " " + String.format("%,.2f", n);
                }
            }
            case "FIELD_VALUE": {
                String fieldName = str(arg(args, 0));
                Object v = ctx.fieldValues != null ? ctx.fieldValues.get(fieldName) : null;
                return v != null ? v : "";
            }
            case "SETVALUE": {
                // Server-side has no form control context; treat as a no-op
                // returning the resolved value. The frontend handles real field updates.
                return args.size() > 1 ? arg(args, 1) : "";
            }
            case "LOOKUP": {
                // Backend cannot access runtime table data. Document as frontend-only.
                log.debug("LOOKUP is frontend-only; backend returns empty string");
                return "";
            }
            case "HASH": {
                String s = str(arg(args, 0));
                int h = 0;
                for (int i = 0; i < s.length(); i++) h = ((h << 5) - h) + s.charAt(i);
                return Integer.toHexString(Math.abs(h));
            }
            case "COALESCE": {
                for (Object a : args) if (a != null && !str(a).isEmpty()) return a;
                return "";
            }
            case "DEFAULT": {
                Object v = arg(args, 0);
                return (v == null || str(v).isEmpty()) ? arg(args, 1) : v;
            }
            case "TO_NUMBER": return toNum(arg(args, 0));
            case "TO_TEXT": return str(arg(args, 0));
            case "TO_BOOLEAN": return toBool(arg(args, 0));
            case "TO_DATE": {
                LocalDate d = toDate(arg(args, 0));
                return d == null ? "" : d.toString();
            }
            case "TYPE_OF": {
                Object v = arg(args, 0);
                if (v == null) return "null";
                if (v instanceof Boolean) return "boolean";
                if (v instanceof Number) return "number";
                if (v instanceof List) return "array";
                return "string";
            }

            // ===== ARRAY (strings and lists) =====
            case "ARRAY_LENGTH": {
                Object a = arg(args, 0);
                if (a instanceof List) return ((List<?>) a).size();
                if (a instanceof String && str(a).startsWith("[")) try { return ((List<?>) new com.fasterxml.jackson.databind.ObjectMapper().readValue(str(a), List.class)).size(); } catch (Exception ignore) {}
                return 0;
            }

            default:
                log.debug("Unknown function: {}", name);
                return "";
        }
    }

    // ---------- Helpers ----------
    private static Object arg(List<Object> a, int i) { return i < a.size() ? a.get(i) : null; }

    public static String str(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    public static double toNum(Object v) {
        if (v == null) return 0;
        if (v instanceof Number) return ((Number) v).doubleValue();
        if (v instanceof Boolean) return ((Boolean) v) ? 1 : 0;
        try { return Double.parseDouble(str(v).trim()); } catch (Exception e) { return 0; }
    }

    public static int toInt(Object v) { return (int) toNum(v); }

    public static boolean toBool(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean) return (Boolean) v;
        if (v instanceof Number) return ((Number) v).doubleValue() != 0;
        String s = str(v).trim();
        if (s.isEmpty() || s.equalsIgnoreCase("false") || s.equals("0")) return false;
        return true;
    }

    private static LocalDate toDate(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDate) return (LocalDate) v;
        if (v instanceof LocalDateTime) return ((LocalDateTime) v).toLocalDate();
        String s = str(v).trim();
        if (s.isEmpty()) return null;
        try { return LocalDate.parse(s); } catch (Exception ignore) {}
        try { return LocalDateTime.parse(s).toLocalDate(); } catch (Exception ignore) {}
        try { return java.time.OffsetDateTime.parse(s).toLocalDate(); } catch (Exception ignore) {}
        return null;
    }

    private static LocalDateTime toDateTime(Object v) {
        if (v == null) return null;
        if (v instanceof LocalDateTime) return (LocalDateTime) v;
        if (v instanceof LocalDate) return ((LocalDate) v).atStartOfDay();
        String s = str(v).trim();
        if (s.isEmpty()) return null;
        try { return LocalDateTime.parse(s); } catch (Exception ignore) {}
        try { return LocalDate.parse(s).atStartOfDay(); } catch (Exception ignore) {}
        try { return java.time.OffsetDateTime.parse(s).toLocalDateTime(); } catch (Exception ignore) {}
        return null;
    }

    private static LocalDateTime addToDate(LocalDateTime d, int n, String unit) {
        switch (unit) {
            case "day": case "days": return d.plusDays(n);
            case "week": case "weeks": return d.plusWeeks(n);
            case "month": case "months": return d.plusMonths(n);
            case "year": case "years": return d.plusYears(n);
            case "hour": case "hours": return d.plusHours(n);
            case "minute": case "minutes": return d.plusMinutes(n);
            case "second": case "seconds": return d.plusSeconds(n);
            default: return d.plusDays(n);
        }
    }

    private static long diff(LocalDateTime a, LocalDateTime b, String unit) {
        switch (unit) {
            case "day": case "days": return ChronoUnit.DAYS.between(a, b);
            case "week": case "weeks": return ChronoUnit.WEEKS.between(a, b);
            case "month": case "months": return ChronoUnit.MONTHS.between(a, b);
            case "year": case "years": return ChronoUnit.YEARS.between(a, b);
            case "hour": case "hours": return ChronoUnit.HOURS.between(a, b);
            case "minute": case "minutes": return ChronoUnit.MINUTES.between(a, b);
            case "second": case "seconds": return ChronoUnit.SECONDS.between(a, b);
            default: return ChronoUnit.DAYS.between(a, b);
        }
    }

    private static String titleCase(String s) {
        if (s == null || s.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        boolean nextUp = true;
        for (char c : s.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                sb.append(nextUp ? Character.toUpperCase(c) : c);
                nextUp = false;
            } else {
                sb.append(c);
                nextUp = true;
            }
        }
        return sb.toString();
    }

    private static String sentenceCase(String s) {
        if (s == null || s.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        boolean nextUp = true;
        for (char c : s.toCharArray()) {
            if (Character.isLetter(c)) {
                sb.append(nextUp ? Character.toUpperCase(c) : c);
                nextUp = false;
            } else {
                sb.append(c);
                if (c == '.' || c == '!' || c == '?') nextUp = true;
            }
        }
        return sb.toString();
    }

    /** Convert common JS date patterns to Java equivalents. */
    private static String jsToJavaDatePattern(String fmt) {
        return fmt
            .replace("YYYY", "yyyy")
            .replace("DD", "dd")
            .replace("HH", "HH") // noop
            .replace("mm", "mm")
            .replace("ss", "ss");
    }
}
