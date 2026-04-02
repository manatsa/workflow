package com.sonar.workflow.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads database and application configuration from config.sona file.
 * The file is searched in the following locations (first found wins):
 * 1. Current working directory (where the app is launched from)
 * 2. Same directory as the JAR file
 * 3. User home directory
 *
 * The config.sona file is a JSON file with the following structure:
 * {
 *   "database": { "host", "port", "name", "username", "password" },
 *   "server": { "port" },
 *   "mail": { "host", "port", "username", "password" },
 *   "app": { "baseUrl", "jwtSecret", "encryptionKey", "storagePath" }
 * }
 */
/**
 * Must run after config files are loaded so we can override them.
 * Higher order = runs later = can override earlier property sources.
 */
public class SonaConfigLoader implements EnvironmentPostProcessor, org.springframework.core.Ordered {

    @Override
    public int getOrder() {
        // Run after ConfigDataEnvironmentPostProcessor (order = -10) so we override application.yml
        return org.springframework.core.Ordered.HIGHEST_PRECEDENCE + 100;
    }

    private static final String CONFIG_FILENAME = "config.sona";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        File configFile = findConfigFile();
        if (configFile == null) {
            System.out.println("[Sona Config] No config.sona file found. Using default application.yml settings.");
            return;
        }

        System.out.println("[Sona Config] Loading configuration from: " + configFile.getAbsolutePath());

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(configFile);
            Map<String, Object> properties = new HashMap<>();

            // Database configuration
            JsonNode db = root.get("database");
            if (db != null) {
                String host = getTextOrDefault(db, "host", "localhost");
                int port = getIntOrDefault(db, "port", 5432);
                String name = getTextOrDefault(db, "name", "workflow");
                String username = getTextOrDefault(db, "username", "sonar");
                String password = getTextOrDefault(db, "password", "");

                properties.put("spring.datasource.url", "jdbc:postgresql://" + host + ":" + port + "/" + name);
                properties.put("spring.datasource.username", username);
                properties.put("spring.datasource.password", password);

                System.out.println("[Sona Config] Database: postgresql://" + host + ":" + port + "/" + name + " (user: " + username + ")");
            }

            // Server configuration
            JsonNode server = root.get("server");
            if (server != null) {
                if (server.has("port")) {
                    properties.put("server.port", server.get("port").asInt());
                    System.out.println("[Sona Config] Server port: " + server.get("port").asInt());
                }
            }

            // Mail configuration
            JsonNode mail = root.get("mail");
            if (mail != null) {
                if (mail.has("host") && !mail.get("host").asText().isBlank()) {
                    properties.put("spring.mail.host", mail.get("host").asText());
                }
                if (mail.has("port")) {
                    properties.put("spring.mail.port", mail.get("port").asInt());
                }
                if (mail.has("username") && !mail.get("username").asText().isBlank()) {
                    properties.put("spring.mail.username", mail.get("username").asText());
                }
                if (mail.has("password") && !mail.get("password").asText().isBlank()) {
                    properties.put("spring.mail.password", mail.get("password").asText());
                }
            }

            // App configuration
            JsonNode app = root.get("app");
            if (app != null) {
                if (app.has("baseUrl") && !app.get("baseUrl").asText().isBlank()) {
                    properties.put("app.base-url", app.get("baseUrl").asText());
                }
                if (app.has("jwtSecret") && !app.get("jwtSecret").asText().isBlank()) {
                    properties.put("app.jwt.secret", app.get("jwtSecret").asText());
                }
                if (app.has("encryptionKey") && !app.get("encryptionKey").asText().isBlank()) {
                    properties.put("app.encryption.key", app.get("encryptionKey").asText());
                }
                if (app.has("storagePath") && !app.get("storagePath").asText().isBlank()) {
                    String storagePath = app.get("storagePath").asText();
                    if (!storagePath.endsWith("/") && !storagePath.endsWith("\\")) {
                        storagePath += "/";
                    }
                    properties.put("app.storage.base-path", storagePath);
                    properties.put("app.storage.attachments-path", storagePath + "attachments/");
                    properties.put("app.storage.templates-path", storagePath + "templates/");
                    properties.put("app.storage.imports-path", storagePath + "imports/");
                    properties.put("app.storage.exports-path", storagePath + "exports/");
                    properties.put("app.storage.backups-path", storagePath + "backups/");
                }
            }

            if (!properties.isEmpty()) {
                // Add with high precedence (overrides application.yml but not env vars)
                environment.getPropertySources().addFirst(
                        new MapPropertySource("sonaConfig", properties)
                );
                System.out.println("[Sona Config] Applied " + properties.size() + " configuration properties.");
            }

        } catch (Exception e) {
            System.err.println("[Sona Config] ERROR: Failed to parse config.sona: " + e.getMessage());
            System.err.println("[Sona Config] Falling back to default application.yml settings.");
        }
    }

    private File findConfigFile() {
        // 1. Current working directory
        File cwd = new File(System.getProperty("user.dir"), CONFIG_FILENAME);
        if (cwd.exists() && cwd.isFile()) return cwd;

        // 2. Parent of current directory (for when running from /backend)
        File parent = new File(System.getProperty("user.dir")).getParentFile();
        if (parent != null) {
            File parentConfig = new File(parent, CONFIG_FILENAME);
            if (parentConfig.exists() && parentConfig.isFile()) return parentConfig;
        }

        // 3. Next to the JAR file
        try {
            Path jarPath = Paths.get(SonaConfigLoader.class.getProtectionDomain()
                    .getCodeSource().getLocation().toURI()).getParent();
            File jarDir = new File(jarPath.toFile(), CONFIG_FILENAME);
            if (jarDir.exists() && jarDir.isFile()) return jarDir;
        } catch (Exception ignored) {}

        // 4. User home directory
        File home = new File(System.getProperty("user.home"), CONFIG_FILENAME);
        if (home.exists() && home.isFile()) return home;

        return null;
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        return node.has(field) && !node.get(field).asText().isBlank() ? node.get(field).asText() : defaultValue;
    }

    private int getIntOrDefault(JsonNode node, String field, int defaultValue) {
        return node.has(field) ? node.get(field).asInt(defaultValue) : defaultValue;
    }
}
