package com.sonar.workflow.config;

import com.sonar.workflow.entity.Setting;
import com.sonar.workflow.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class CorsConfig implements WebMvcConfigurer {

    private final SettingRepository settingRepository;

    // Default patterns that are always allowed
    private static final String[] DEFAULT_PATTERNS = {
        "http://localhost:*",
        "https://localhost:*",
        "http://127.0.0.1:*",
        "https://127.0.0.1:*",
        "http://192.168.*:*",
        "http://10.*:*",
        "http://172.*:*"
    };

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> patterns = new ArrayList<>(Arrays.asList(DEFAULT_PATTERNS));

        // Check if allow-all is enabled
        boolean allowAll = false;
        try {
            allowAll = settingRepository.findByKey("cors.allow.all")
                .map(s -> "true".equalsIgnoreCase(s.getValue()))
                .orElse(false);

            settingRepository.findByKey("cors.allowed.origins").ifPresent(setting -> {
                String value = setting.getValue();
                if (value != null && !value.isBlank()) {
                    Arrays.stream(value.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .forEach(origin -> {
                            patterns.add(origin);
                            log.info("Added CORS origin from settings: {}", origin);
                        });
                }
            });
        } catch (Exception e) {
            log.warn("Could not load CORS settings: {}", e.getMessage());
        }

        if (allowAll) {
            patterns.clear();
            patterns.add("*");
            log.warn("CORS: Allowing ALL origins - not recommended for production");
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(patterns.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type", "Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);

        log.info("CORS configured with {} origin patterns", patterns.size());
    }
}
