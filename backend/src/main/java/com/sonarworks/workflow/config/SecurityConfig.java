package com.sonarworks.workflow.config;

import com.sonarworks.workflow.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/index.html"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/favicon.ico"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/error"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.js"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.css"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.map"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.woff"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.woff2"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.ttf"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.png"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.jpg"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.svg"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/**/*.gif"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/assets/**"),
            // SPA routes - allow Angular to handle these
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/login"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/dashboard"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/workflows"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/workflows/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/approvals"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/approvals/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/my-submissions"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/my-submissions/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/admin"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/admin/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/settings"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/settings/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/users"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/users/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/roles"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/roles/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/sbus"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/sbus/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/audit"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/audit/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/profile"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/profile/**"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/change-password"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/forgot-password"),
            org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/reset-password")
        );
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/password/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:8080"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
