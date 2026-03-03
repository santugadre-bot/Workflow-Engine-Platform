package com.workflow.engine.auth.security;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.rbac.entity.Permission;
import com.workflow.engine.rbac.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private static final Logger log = LoggerFactory.getLogger(CustomPermissionEvaluator.class);

    private final RolePermissionService rolePermissionService;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if ((authentication == null) || (targetDomainObject == null) || !(permission instanceof String)) {
            return false;
        }

        UUID userId = getUserId(authentication);
        if (userId == null)
            return false;

        String permissionString = (String) permission;
        Permission perm;
        try {
            perm = Permission.valueOf(permissionString);
        } catch (IllegalArgumentException e) {
            log.error("Unknown permission: " + permissionString);
            return false;
        }

        // Check if target is UUID (OrganizationId or ProjectId)
        // This is tricky because we don't know if the UUID is Org or Project.
        // Usually we pass the entity type or have separate methods.
        // But standard hasPermission takes Object targetDomainObject.

        // If targetDomainObject is UUID, we assume it's OrganizationID for generic
        // checks?
        // OR we need to know the context.

        // Better approach: hasPermission(auth, targetId, targetType, permission)
        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType,
            Object permission) {
        if ((authentication == null) || (targetId == null) || (targetType == null) || !(permission instanceof String)) {
            return false;
        }

        UUID userId = getUserId(authentication);
        if (userId == null)
            return false;

        String permissionString = (String) permission;
        Permission perm;
        try {
            perm = Permission.valueOf(permissionString);
        } catch (IllegalArgumentException e) {
            log.error("Unknown permission: " + permissionString);
            return false;
        }

        UUID targetUuid;
        try {
            if (targetId instanceof UUID) {
                targetUuid = (UUID) targetId;
            } else if (targetId instanceof String) {
                targetUuid = UUID.fromString((String) targetId);
            } else {
                return false;
            }
        } catch (Exception e) {
            return false;
        }

        if ("Organization".equalsIgnoreCase(targetType)) {
            return rolePermissionService.hasPermission(userId, targetUuid, perm);
        } else if ("Project".equalsIgnoreCase(targetType)) {
            return rolePermissionService.hasProjectPermission(userId, targetUuid, perm);
        }

        return false;
    }

    private UUID getUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof User) { // Assuming your UserDetails implementation returns your User entity or similar
            // Check your UserDetails implementation.
            // If verification shows generic UserDetails, we might need to cast or get ID
            // differently.
            // For now assuming the principal has the ID or is the User entity.
            // Usually it's a UserDetails object. Let's assume standard Spring Security User
            // types?
            // Actually, usually we use a custom UserDetails implementation.
            // Let's check JwtAuthenticationFilter to see what it puts in SecurityContext.
            try {
                // Creating a safe reflective call or cast if we are sure.
                // Inspecting User.java showed it serves as entity.
                // We need to see what `loadUserByUsername` returns.
                // Assuming standard integration:
                if (principal instanceof com.workflow.engine.auth.entity.User) {
                    return ((com.workflow.engine.auth.entity.User) principal).getId();
                }
            } catch (Exception e) {
                log.error("Error getting user ID from principal", e);
            }
        }
        return null; // Update this after checking authentication setup
    }
}
