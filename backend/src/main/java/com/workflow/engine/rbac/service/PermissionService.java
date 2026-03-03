package com.workflow.engine.rbac.service;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.common.exception.AccessDeniedException;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Central permission enforcement service.
 * Called by all module services before mutations to enforce RBAC.
 *
 * Role hierarchy: OWNER > ADMIN > MEMBER
 *
 * Performance: systemRole is read from SecurityContext (set by
 * JwtAuthenticationFilter
 * from the JWT claim) — no DB hit required for SUPER_ADMIN check.
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);

    private final OrganizationMemberRepository memberRepository;

    /**
     * Checks that the user has at least the required role in the organization.
     * Throws AccessDeniedException if insufficient permissions.
     */
    public void checkPermission(UUID userId, UUID organizationId, OrganizationRole requiredRole) {
        log.debug("Checking permission for user {} on organization {} requiredRole {}", userId, organizationId,
                requiredRole);

        // 1. Check System Role from SecurityContext (no DB hit — read from JWT claim)
        if (isSuperAdmin()) {
            log.info("System bypass for SUPER_ADMIN user {}", userId);
            return;
        }

        OrganizationMember member = memberRepository
                .findByUserIdAndOrganizationId(userId, organizationId)
                .orElseThrow(() -> {
                    log.warn("User {} is not a member of organization {}", userId, organizationId);
                    return new AccessDeniedException("You are not a member of this organization");
                });

        log.debug("Found member with role {}", member.getRole());

        if (!hasPermission(member.getRole(), requiredRole)) {
            log.warn("Insufficient permissions. Has {}, needs {}", member.getRole(), requiredRole);
            throw new AccessDeniedException(
                    String.format("Required role: %s, your role: %s", requiredRole, member.getRole()));
        }
    }

    /**
     * Returns the user's role in the organization, or null if not a member.
     * SUPER_ADMIN returns OWNER as a feature-flag bypass (full panel planned for
     * later).
     */
    public OrganizationRole getUserRole(UUID userId, UUID organizationId) {
        if (isSuperAdmin()) {
            // PLANNED: return dedicated SUPER_ADMIN sentinel when the admin panel is built
            return OrganizationRole.OWNER;
        }

        return memberRepository.findByUserIdAndOrganizationId(userId, organizationId)
                .map(OrganizationMember::getRole)
                .orElse(null);
    }

    /**
     * Reads systemRole from the SecurityContext principal (set by
     * JwtAuthenticationFilter).
     * No DB query needed — the User object is already loaded per request.
     */
    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return false;
        }
        return user.getSystemRole() == SystemRole.SUPER_ADMIN;
    }

    /**
     * Role hierarchy check: OWNER >= ADMIN >= MEMBER
     */
    private boolean hasPermission(OrganizationRole userRole, OrganizationRole requiredRole) {
        return roleLevel(userRole) >= roleLevel(requiredRole);
    }

    private int roleLevel(OrganizationRole role) {
        return switch (role) {
            case OWNER -> 3;
            case ADMIN -> 2;
            case MEMBER -> 1;
        };
    }

}
