package com.sonar.workflow.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("priv")
public class PrivilegeChecker {

    public boolean has(String privilege) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals(privilege)
                        || auth.equals("ROLE_ADMIN")
                        || auth.equals("ADMIN"));
    }

    public boolean hasAny(String... privileges) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        var authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        if (authorities.contains("ROLE_ADMIN") || authorities.contains("ADMIN")) {
            return true;
        }
        for (String privilege : privileges) {
            if (authorities.contains(privilege)) {
                return true;
            }
        }
        return false;
    }
}
