package com.sonar.workflow.security;

import com.sonar.workflow.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
public class CustomUserDetails implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;
    private final String email;
    private final String fullName;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;
    private final User.UserType userType;
    private final Set<UUID> corporateIds;
    private final Set<UUID> sbuIds;
    private final Set<UUID> branchIds;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.enabled = user.getIsActive();
        this.accountNonLocked = !user.getIsLocked();
        this.userType = user.getUserType();
        this.corporateIds = user.getCorporates().stream().map(corporate -> corporate.getId()).collect(Collectors.toSet());
        this.sbuIds = user.getSbus().stream().map(sbu -> sbu.getId()).collect(Collectors.toSet());
        this.branchIds = user.getBranches().stream().map(branch -> branch.getId()).collect(Collectors.toSet());

        this.authorities = Stream.concat(
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName())),
                user.getRoles().stream()
                        .flatMap(role -> role.getPrivileges().stream())
                        .map(privilege -> new SimpleGrantedAuthority(privilege.getName()))
        ).collect(Collectors.toSet());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    public boolean isSuperUser() {
        return "super".equals(username);
    }

    public boolean hasPrivilege(String privilege) {
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals(privilege));
    }
}
