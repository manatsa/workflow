package com.sonar.workflow.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/**
 * Provides the super user entirely in code — no database record exists.
 * This keeps the super user invisible to all queries, exports, and user lists.
 */
@Component
public class SuperUserProvider {

    public static final String SUPER_USERNAME = "super";
    private static final UUID SUPER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // Pre-computed BCrypt hash — raw password is not stored in source code
    private static final String ENCODED_PASSWORD = "$2a$12$1oG3drstmMJO1LjkowegFekp8fyR39gT7Ypk0bsMZwiH.uqtDvYb.";

    public boolean isSuperUsername(String username) {
        return SUPER_USERNAME.equalsIgnoreCase(username);
    }

    public UserDetails getSuperUserDetails() {
        Set<GrantedAuthority> authorities = Set.of(
                new SimpleGrantedAuthority("ROLE_ADMIN"),
                new SimpleGrantedAuthority("ADMIN"),
                new SimpleGrantedAuthority("SYSTEM")
        );

        return new SuperUserDetails(SUPER_ID, SUPER_USERNAME, ENCODED_PASSWORD,
                "super@sonarworks.com", "Super User", authorities);
    }

    public UUID getSuperUserId() {
        return SUPER_ID;
    }

    /**
     * A self-contained UserDetails for the super user that does not touch the database.
     */
    public static class SuperUserDetails implements UserDetails {

        private final UUID id;
        private final String username;
        private final String password;
        private final String email;
        private final String fullName;
        private final Collection<? extends GrantedAuthority> authorities;

        public SuperUserDetails(UUID id, String username, String password, String email,
                                String fullName, Collection<? extends GrantedAuthority> authorities) {
            this.id = id;
            this.username = username;
            this.password = password;
            this.email = email;
            this.fullName = fullName;
            this.authorities = authorities;
        }

        public UUID getId() { return id; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }

        @Override public String getUsername() { return username; }
        @Override public String getPassword() { return password; }
        @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
        @Override public boolean isAccountNonExpired() { return true; }
        @Override public boolean isAccountNonLocked() { return true; }
        @Override public boolean isCredentialsNonExpired() { return true; }
        @Override public boolean isEnabled() { return true; }

        public boolean isSuperUser() { return true; }

        public Set<UUID> getCorporateIds() { return Collections.emptySet(); }
        public Set<UUID> getSbuIds() { return Collections.emptySet(); }
        public Set<UUID> getBranchIds() { return Collections.emptySet(); }
        public Set<UUID> getDepartmentIds() { return Collections.emptySet(); }

        public com.sonar.workflow.entity.User.UserType getUserType() {
            return com.sonar.workflow.entity.User.UserType.SYSTEM;
        }
    }
}
