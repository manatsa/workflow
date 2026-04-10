package com.sonar.workflow.config;

import com.sonar.workflow.security.CustomUserDetails;
import com.sonar.workflow.security.SuperUserProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("system");
            }
            Object principal = authentication.getPrincipal();
            if (principal instanceof SuperUserProvider.SuperUserDetails sud) {
                return Optional.of(sud.getEmail());
            }
            if (principal instanceof CustomUserDetails cud) {
                return Optional.of(cud.getEmail());
            }
            return Optional.of(authentication.getName());
        };
    }
}
