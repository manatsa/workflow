package com.sonar.workflow.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonar.workflow.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@RestController
@RequestMapping("/api/proxy")
@RequiredArgsConstructor
@Slf4j
public class ApiProxyController {

    private final ObjectMapper objectMapper;

    @PostMapping("/call")
    public ResponseEntity<ApiResponse<Object>> proxyApiCall(@RequestBody Map<String, Object> request) {
        try {
            String url = (String) request.get("url");
            String method = (String) request.getOrDefault("method", "GET");
            String authType = (String) request.get("authType");
            String authValue = (String) request.get("authValue");
            String body = (String) request.get("body");

            if (url == null || url.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("URL is required"));
            }

            // Build headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.ALL));

            // Apply authentication
            if (authType != null && authValue != null && !authValue.isBlank()) {
                switch (authType.toUpperCase()) {
                    case "BASIC" -> headers.set("Authorization", "Basic " + authValue);
                    case "BEARER" -> headers.set("Authorization", "Bearer " + authValue);
                    case "API_KEY" -> {
                        String[] parts = authValue.split(":", 2);
                        if (parts.length == 2) {
                            headers.set(parts[0].trim(), parts[1].trim());
                        }
                    }
                }
            }

            // Apply custom headers
            @SuppressWarnings("unchecked")
            List<Map<String, String>> customHeaders = (List<Map<String, String>>) request.get("headers");
            if (customHeaders != null) {
                for (Map<String, String> header : customHeaders) {
                    String key = header.get("key");
                    String value = header.get("value");
                    if (key != null && !key.isBlank() && value != null) {
                        headers.set(key, value);
                    }
                }
            }

            // Process parameters by type
            @SuppressWarnings("unchecked")
            List<Map<String, String>> params = (List<Map<String, String>>) request.get("params");
            Map<String, String> bodyParams = new LinkedHashMap<>();

            if (params != null && !params.isEmpty()) {
                UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(url);
                boolean hasQueryParams = false;

                for (Map<String, String> param : params) {
                    String key = param.get("key");
                    String value = param.get("value");
                    String type = param.getOrDefault("type", "QUERY");

                    if (key == null || key.isBlank()) continue;
                    if (value == null) value = "";

                    switch (type.toUpperCase()) {
                        case "PATH" -> {
                            // Replace {key} or :key in URL
                            url = url.replace("{" + key + "}", value);
                            url = url.replaceAll(":" + key + "(?=/|$|\\?)", value);
                        }
                        case "BODY" -> bodyParams.put(key, value);
                        case "HEADER" -> headers.set(key, value);
                        default -> {
                            // QUERY - append as query string
                            if (!hasQueryParams) {
                                uriBuilder = UriComponentsBuilder.fromHttpUrl(url);
                                hasQueryParams = true;
                            }
                            uriBuilder.queryParam(key, value);
                        }
                    }
                }

                if (hasQueryParams) {
                    url = uriBuilder.toUriString();
                }
            }

            // Build request body: merge explicit body with body params
            String finalBody = body;
            if (!bodyParams.isEmpty()) {
                Map<String, Object> bodyMap = new LinkedHashMap<>();
                // Parse existing body if present
                if (body != null && !body.isBlank()) {
                    try {
                        bodyMap = objectMapper.readValue(body, new TypeReference<>() {});
                    } catch (Exception e) {
                        // If body isn't valid JSON, keep it as-is and skip merging
                        log.warn("Could not parse existing body as JSON, body params will be ignored");
                    }
                }
                bodyMap.putAll(bodyParams);
                finalBody = objectMapper.writeValueAsString(bodyMap);
            }

            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<String> entity = new HttpEntity<>(finalBody, headers);

            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.valueOf(method.toUpperCase()),
                    entity,
                    Object.class
            );

            // Extract data using response path if provided
            String responsePath = (String) request.get("responsePath");
            Object data = response.getBody();

            if (responsePath != null && !responsePath.isBlank() && data != null) {
                data = extractByPath(data, responsePath);
            }

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("API proxy call failed", e);
            return ResponseEntity.ok(ApiResponse.error("API call failed: " + e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    private Object extractByPath(Object data, String path) {
        String[] parts = path.split("\\.");
        Object current = data;
        for (String part : parts) {
            if (current == null) return null;
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
            } else if (current instanceof List) {
                try {
                    int index = Integer.parseInt(part);
                    current = ((List<Object>) current).get(index);
                } catch (NumberFormatException | IndexOutOfBoundsException e) {
                    return null;
                }
            } else {
                return null;
            }
        }
        return current;
    }
}
