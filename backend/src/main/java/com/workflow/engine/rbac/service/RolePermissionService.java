package com.workflow.engine.rbac.service;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.AccessDeniedException;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.ProjectRole;
import com.workflow.engine.rbac.entity.Permission;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

        private static final Logger log = LoggerFactory.getLogger(RolePermissionService.class);

        private final OrganizationMemberRepository organizationMemberRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final UserRepository userRepository;

        private static final Map<OrganizationRole, Set<Permission>> ORGANIZATION_ROLE_PERMISSIONS = new ConcurrentHashMap<>();
        private static final Map<ProjectRole, Set<Permission>> PROJECT_ROLE_PERMISSIONS = new ConcurrentHashMap<>();

        static {
                // Organization Role Permissions
                ORGANIZATION_ROLE_PERMISSIONS.put(OrganizationRole.OWNER, EnumSet.allOf(Permission.class));

                ORGANIZATION_ROLE_PERMISSIONS.put(OrganizationRole.ADMIN, EnumSet.of(
                                Permission.CREATE_PROJECT, Permission.EDIT_PROJECT, Permission.DELETE_PROJECT,
                                Permission.VIEW_PROJECT,
                                Permission.MANAGE_ORGANIZATION, Permission.VIEW_METRICS,
                                Permission.INVITE_MEMBER, Permission.REMOVE_MEMBER, Permission.MANAGE_ROLES,
                                Permission.MANAGE_SPRINTS, Permission.MANAGE_BOARD,
                                Permission.CREATE_ISSUE, Permission.EDIT_ISSUE, Permission.DELETE_ISSUE,
                                Permission.VIEW_ISSUE,
                                Permission.ASSIGN_ISSUE, Permission.COMMENT_ISSUE));

                ORGANIZATION_ROLE_PERMISSIONS.put(OrganizationRole.MEMBER, EnumSet.of(
                                Permission.VIEW_PROJECT, Permission.VIEW_ISSUE, Permission.COMMENT_ISSUE));

                // Project Role Permissions
                PROJECT_ROLE_PERMISSIONS.put(ProjectRole.PROJECT_ADMIN, EnumSet.of(
                                Permission.EDIT_PROJECT, Permission.VIEW_PROJECT,
                                Permission.MANAGE_SPRINTS, Permission.MANAGE_BOARD,
                                Permission.CREATE_ISSUE, Permission.EDIT_ISSUE, Permission.DELETE_ISSUE,
                                Permission.VIEW_ISSUE,
                                Permission.ASSIGN_ISSUE, Permission.COMMENT_ISSUE,
                                Permission.INVITE_MEMBER // Contextual to project
                ));

                PROJECT_ROLE_PERMISSIONS.put(ProjectRole.SCRUM_MASTER, EnumSet.of(
                                Permission.VIEW_PROJECT,
                                Permission.MANAGE_SPRINTS, Permission.MANAGE_BOARD,
                                Permission.CREATE_ISSUE, Permission.EDIT_ISSUE, Permission.DELETE_ISSUE,
                                Permission.VIEW_ISSUE,
                                Permission.ASSIGN_ISSUE, Permission.COMMENT_ISSUE));

                PROJECT_ROLE_PERMISSIONS.put(ProjectRole.DEVELOPER, EnumSet.of(
                                Permission.VIEW_PROJECT,
                                Permission.CREATE_ISSUE, Permission.EDIT_ISSUE, Permission.VIEW_ISSUE,
                                Permission.ASSIGN_ISSUE, Permission.COMMENT_ISSUE));

                PROJECT_ROLE_PERMISSIONS.put(ProjectRole.QA, EnumSet.of(
                                Permission.VIEW_PROJECT,
                                Permission.CREATE_ISSUE, Permission.EDIT_ISSUE, Permission.VIEW_ISSUE,
                                Permission.ASSIGN_ISSUE, Permission.COMMENT_ISSUE));

                PROJECT_ROLE_PERMISSIONS.put(ProjectRole.VIEWER, EnumSet.of(
                                Permission.VIEW_PROJECT, Permission.VIEW_ISSUE, Permission.COMMENT_ISSUE));
        }

        public boolean hasPermission(UUID userId, UUID organizationId, Permission permission) {
                log.debug("Checking permission {} for user {} in org {}", permission, userId, organizationId);

                // 1. Check System Role (Super Admin has all access)
                if (isSuperAdmin(userId)) {
                        return true;
                }

                // 2. Check Organization Role
                return organizationMemberRepository.findByUserIdAndOrganizationId(userId, organizationId)
                                .map(member -> {
                                        Set<Permission> permissions = ORGANIZATION_ROLE_PERMISSIONS.getOrDefault(
                                                        member.getRole(),
                                                        EnumSet.noneOf(Permission.class));
                                        return permissions.contains(permission);
                                })
                                .orElse(false);
        }

        public boolean hasProjectPermission(UUID userId, UUID projectId, Permission permission) {
                log.debug("Checking project permission {} for user {} in project {}", permission, userId, projectId);

                // 1. Check System Role
                if (isSuperAdmin(userId)) {
                        return true;
                }

                // 2. Check Project Role
                boolean hasProjectRole = projectMemberRepository.findByUserIdAndProjectId(userId, projectId)
                                .map(member -> {
                                        Set<Permission> permissions = PROJECT_ROLE_PERMISSIONS.getOrDefault(
                                                        member.getRole(),
                                                        EnumSet.noneOf(Permission.class));
                                        return permissions.contains(permission);
                                })
                                .orElse(false);

                if (hasProjectRole) {
                        return true;
                }

                // 3. Fallback: Check Organization Role (e.g. Org Owner can access all projects)
                // Here we need to fetch the project's organization ID. For simply, assuming
                // caller handles org check or we fetch it.
                // Doing a deeper check might be expensive if not careful.
                // For now, project-level permissions are strictly project-scoped unless we
                // expand this.
                // However, Org Owner/Admin generally should have access.

                return false;
        }

        // Helper to check for System Roles
        private boolean isSuperAdmin(UUID userId) {
                return userRepository.findById(userId)
                                .map(user -> user.getSystemRole() == SystemRole.SUPER_ADMIN)
                                .orElse(false);
        }
}
