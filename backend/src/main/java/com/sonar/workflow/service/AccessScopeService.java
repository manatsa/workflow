package com.sonar.workflow.service;

import com.sonar.workflow.entity.*;
import com.sonar.workflow.repository.UserRepository;
import com.sonar.workflow.security.CustomUserDetails;
import com.sonar.workflow.security.SuperUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Centralized service for determining user access scope.
 * Users with empty scope sets have unrestricted access.
 * ADMIN users always have unrestricted access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccessScopeService {

    private final UserRepository userRepository;

    /**
     * Returns the current authenticated user entity, or null.
     */
    public User getCurrentUser() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails ud) {
                return userRepository.findById(ud.getId()).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not get current user: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Returns true if the current authentication represents the super user.
     */
    public boolean isCurrentUserSuper() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                if (auth.getPrincipal() instanceof SuperUserProvider.SuperUserDetails) return true;
                if (SuperUserProvider.SUPER_USERNAME.equalsIgnoreCase(auth.getName())) return true;
            }
        } catch (Exception e) {
            // ignore
        }
        return false;
    }

    /**
     * Returns true if the user is an admin or has no scope restrictions at all.
     */
    public boolean isUnrestricted(User user) {
        if (user == null) return false;
        if (isAdmin(user)) return true;
        // User has no scope restrictions if all scope sets are empty
        return (user.getCorporates() == null || user.getCorporates().isEmpty()) &&
               (user.getSbus() == null || user.getSbus().isEmpty()) &&
               (user.getBranches() == null || user.getBranches().isEmpty()) &&
               (user.getDepartments() == null || user.getDepartments().isEmpty());
    }

    public boolean isAdmin(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream()
                .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
    }

    public Set<UUID> getUserCorporateIds(User user) {
        if (user == null || user.getCorporates() == null) return Collections.emptySet();
        return user.getCorporates().stream().map(Corporate::getId).collect(Collectors.toSet());
    }

    public Set<UUID> getUserSbuIds(User user) {
        if (user == null || user.getSbus() == null) return Collections.emptySet();
        return user.getSbus().stream().map(SBU::getId).collect(Collectors.toSet());
    }

    public Set<UUID> getUserBranchIds(User user) {
        if (user == null || user.getBranches() == null) return Collections.emptySet();
        return user.getBranches().stream().map(Branch::getId).collect(Collectors.toSet());
    }

    public Set<UUID> getUserDepartmentIds(User user) {
        if (user == null || user.getDepartments() == null) return Collections.emptySet();
        return user.getDepartments().stream().map(Department::getId).collect(Collectors.toSet());
    }

    /**
     * Check if a workflow is accessible to the given user based on scope.
     * A workflow with no scope restrictions is accessible to everyone.
     */
    /**
     * Check if a workflow is accessible to the given user based on scope.
     * A workflow with no restrictions is accessible to everyone.
     * When multiple restriction levels are defined, ALL of them must match (AND logic).
     * Within each level, the user must match at least one of the defined values (OR within level).
     */
    public boolean canAccessWorkflow(Workflow workflow, User user) {
        if (workflow == null) return false;
        // No restrictions on workflow = accessible to all
        if (workflow.getCorporates().isEmpty() &&
            workflow.getSbus().isEmpty() &&
            workflow.getBranches().isEmpty() &&
            workflow.getDepartments().isEmpty() &&
            workflow.getRoles().isEmpty() &&
            workflow.getPrivileges().isEmpty()) {
            return true;
        }
        if (user == null) {
            // Super user is code-based with no DB entity — grant full access
            if (isCurrentUserSuper()) return true;
            return false;
        }
        if (isAdmin(user)) return true;

        // AND logic: every defined restriction level must be satisfied
        // Within each level: user must match at least one value (OR)

        if (!workflow.getCorporates().isEmpty()) {
            if (user.getCorporates() == null || user.getCorporates().isEmpty()) return false;
            boolean match = workflow.getCorporates().stream().anyMatch(wc ->
                    user.getCorporates().stream().anyMatch(uc -> uc.getId().equals(wc.getId())));
            if (!match) return false;
        }

        if (!workflow.getSbus().isEmpty()) {
            if (user.getSbus() == null || user.getSbus().isEmpty()) return false;
            boolean match = workflow.getSbus().stream().anyMatch(ws ->
                    user.getSbus().stream().anyMatch(us -> us.getId().equals(ws.getId())));
            if (!match) return false;
        }

        if (!workflow.getBranches().isEmpty()) {
            if (user.getBranches() == null || user.getBranches().isEmpty()) return false;
            boolean match = workflow.getBranches().stream().anyMatch(wb ->
                    user.getBranches().stream().anyMatch(ub -> ub.getId().equals(wb.getId())));
            if (!match) return false;
        }

        if (!workflow.getDepartments().isEmpty()) {
            if (user.getDepartments() == null || user.getDepartments().isEmpty()) return false;
            boolean match = workflow.getDepartments().stream().anyMatch(wd ->
                    user.getDepartments().stream().anyMatch(ud -> ud.getId().equals(wd.getId())));
            if (!match) return false;
        }

        if (!workflow.getRoles().isEmpty()) {
            if (user.getRoles() == null || user.getRoles().isEmpty()) return false;
            boolean match = workflow.getRoles().stream().anyMatch(wr ->
                    user.getRoles().stream().anyMatch(ur -> ur.getId().equals(wr.getId())));
            if (!match) return false;
        }

        if (!workflow.getPrivileges().isEmpty()) {
            if (user.getRoles() == null || user.getRoles().isEmpty()) return false;
            Set<UUID> userPrivIds = user.getRoles().stream()
                    .flatMap(r -> r.getPrivileges().stream()).map(Privilege::getId).collect(Collectors.toSet());
            boolean match = workflow.getPrivileges().stream().anyMatch(wp -> userPrivIds.contains(wp.getId()));
            if (!match) return false;
        }

        return true;
    }

    /**
     * Check if a workflow instance is accessible to the user based on:
     * 1. The user is the initiator or current approver
     * 2. The workflow's access restrictions match the user (AND logic)
     * 3. The submitter shares organizational scope with the user (same corporate, SBU, department, role, or privilege)
     */
    public boolean canAccessInstance(WorkflowInstance instance, User user) {
        if (instance == null) return false;
        if (user == null) {
            if (isCurrentUserSuper()) return true;
            return false;
        }
        if (isAdmin(user)) return true;
        if (isUnrestricted(user)) return true;

        // User is the initiator
        if (instance.getInitiator() != null && instance.getInitiator().getId().equals(user.getId())) {
            return true;
        }
        // User is the current approver
        if (instance.getCurrentApprover() != null && instance.getCurrentApprover().getUser() != null &&
            instance.getCurrentApprover().getUser().getId().equals(user.getId())) {
            return true;
        }

        // Check workflow scope
        if (canAccessWorkflow(instance.getWorkflow(), user)) {
            return true;
        }

        // Check if submitter shares organizational scope with the current user
        // User can see submissions from people in their same corporate, SBU, branch, department, role, or privilege
        User initiator = instance.getInitiator();
        if (initiator != null) {
            if (sharesOrganizationalScope(user, initiator)) {
                return true;
            }
        }

        // Check instance SBU against user SBUs
        if (instance.getSbu() != null && user.getSbus() != null && !user.getSbus().isEmpty()) {
            if (user.getSbus().stream().anyMatch(us -> us.getId().equals(instance.getSbu().getId()))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if the submitter falls within the current user's organizational scope.
     * Uses AND logic: every scope level defined on the current user must match.
     * Only corporate, SBU, branch, and department are checked (structural scope).
     * Roles and privileges on the user do NOT narrow report visibility — they control
     * feature access, not data scope.
     *
     * Examples:
     *   User has Corporate=ABC only → sees submissions from anyone in ABC
     *   User has Corporate=ABC + SBU=Finance → sees submissions from ABC AND Finance
     *   User has no corporates/SBUs/branches/departments → unrestricted (handled by caller)
     */
    private boolean sharesOrganizationalScope(User currentUser, User submitter) {
        boolean hasAnyScope = false;

        // Corporate
        if (currentUser.getCorporates() != null && !currentUser.getCorporates().isEmpty()) {
            hasAnyScope = true;
            if (submitter.getCorporates() == null || submitter.getCorporates().isEmpty()) return false;
            boolean match = currentUser.getCorporates().stream().anyMatch(uc ->
                    submitter.getCorporates().stream().anyMatch(sc -> sc.getId().equals(uc.getId())));
            if (!match) return false;
        }

        // SBU
        if (currentUser.getSbus() != null && !currentUser.getSbus().isEmpty()) {
            hasAnyScope = true;
            if (submitter.getSbus() == null || submitter.getSbus().isEmpty()) return false;
            boolean match = currentUser.getSbus().stream().anyMatch(us ->
                    submitter.getSbus().stream().anyMatch(ss -> ss.getId().equals(us.getId())));
            if (!match) return false;
        }

        // Branch
        if (currentUser.getBranches() != null && !currentUser.getBranches().isEmpty()) {
            hasAnyScope = true;
            if (submitter.getBranches() == null || submitter.getBranches().isEmpty()) return false;
            boolean match = currentUser.getBranches().stream().anyMatch(ub ->
                    submitter.getBranches().stream().anyMatch(sb -> sb.getId().equals(ub.getId())));
            if (!match) return false;
        }

        // Department
        if (currentUser.getDepartments() != null && !currentUser.getDepartments().isEmpty()) {
            hasAnyScope = true;
            if (submitter.getDepartments() == null || submitter.getDepartments().isEmpty()) return false;
            boolean match = currentUser.getDepartments().stream().anyMatch(ud ->
                    submitter.getDepartments().stream().anyMatch(sd -> sd.getId().equals(ud.getId())));
            if (!match) return false;
        }

        // If the user has no structural scope at all, this method shouldn't grant access
        // (unrestricted users are handled by the caller via isUnrestricted check)
        return hasAnyScope;
    }
}
