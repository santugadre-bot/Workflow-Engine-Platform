package com.workflow.engine.rbac.service;

import com.workflow.engine.common.exception.AccessDeniedException;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.ProjectMember;
import com.workflow.engine.rbac.entity.ProjectPermission;
import com.workflow.engine.rbac.entity.ProjectRole;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.workflow.engine.rbac.entity.ProjectPermission.*;

@Service
@RequiredArgsConstructor
public class ProjectPermissionService {

        private static final Logger log = LoggerFactory.getLogger(ProjectPermissionService.class);

        private final ProjectMemberRepository projectMemberRepository;
        private final PermissionService organizationPermissionService;
        private final OrganizationMemberRepository organizationMemberRepository;
        private final ProjectRepository projectRepository;

        // Define Role -> Permissions Mapping
        private static final Map<ProjectRole, Set<ProjectPermission>> ROLE_PERMISSIONS = Map.of(
                        ProjectRole.PROJECT_ADMIN, EnumSet.allOf(ProjectPermission.class),

                        ProjectRole.SCRUM_MASTER, EnumSet.of(
                                        // Agile
                                        CREATE_SPRINT, START_SPRINT, CLOSE_SPRINT, MOVE_ISSUE_TO_SPRINT,
                                        REORDER_BACKLOG,
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        BROWSE_PROJECT, CREATE_ISSUE, EDIT_ISSUE, TRANSITION_ISSUE, COMMENT_ISSUE,
                                        ATTACH_FILE, LINK_ISSUE,
                                        // Additional per user request
                                        ASSIGN_ISSUE, LOG_WORK, ESTIMATE_STORY_POINTS, CLONE_ISSUE,
                                        // Config (per user request)
                                        MANAGE_PROJECT_SETTINGS, CONFIGURE_BOARD, MANAGE_WORKFLOW, MANAGE_COMPONENTS,
                                        MANAGE_VERSIONS,
                                        BULK_EDIT_ISSUES, DELETE_ISSUE),

                        ProjectRole.TEAM_LEAD, EnumSet.of(
                                        // Agile
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        BROWSE_PROJECT, CREATE_ISSUE, EDIT_ISSUE, ASSIGN_ISSUE, TRANSITION_ISSUE,
                                        COMMENT_ISSUE, ATTACH_FILE, LINK_ISSUE, LOG_WORK, ESTIMATE_STORY_POINTS),

                        ProjectRole.DEVELOPER, EnumSet.of(
                                        // Agile
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        BROWSE_PROJECT, CREATE_ISSUE, EDIT_ISSUE, TRANSITION_ISSUE, COMMENT_ISSUE,
                                        ATTACH_FILE, LINK_ISSUE, LOG_WORK),

                        ProjectRole.QA, EnumSet.of(
                                        // Agile
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        BROWSE_PROJECT, CREATE_ISSUE, TRANSITION_ISSUE, COMMENT_ISSUE,
                                        ATTACH_FILE),

                        ProjectRole.VIEWER, EnumSet.of(
                                        // Agile
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        BROWSE_PROJECT, COMMENT_ISSUE),

                        ProjectRole.REPORTER, EnumSet.of(
                                        // Browse: must be able to see the project and its tasks
                                        BROWSE_PROJECT,
                                        // Reporting: velocity, burndown, status charts
                                        VIEW_VELOCITY_REPORT,
                                        // Issue
                                        CREATE_ISSUE, COMMENT_ISSUE, ATTACH_FILE));

        /**
         * Checks if the user has the required permission in the project.
         * Throws AccessDeniedException if not.
         */
        public void checkPermission(UUID userId, UUID projectId, ProjectPermission requiredPermission) {
                if (!hasPermission(userId, projectId, requiredPermission)) {
                        throw new AccessDeniedException(
                                        "Insufficient project permissions. Required: " + requiredPermission);
                }
        }

        /**
         * Returns true if user has permission.
         * Handles Organization Admin override.
         */
        public boolean hasPermission(UUID userId, UUID projectId, ProjectPermission permission) {
                // 1. Organization Admins/Owners are implicitly Project Admins
                // We need to fetch the organizationId from the project to check this, BUT
                // to avoid circular dependencies or extra DB calls, we might rely on the
                // caller knowing orgId,
                // OR we just check Project Membership first.
                // For now, let's assume we strictly check Project Membership unless we add an
                // overload or lookup project.

                // Optimization: Check Project Member first
                return projectMemberRepository.findByUserIdAndProjectId(userId, projectId)
                                .map(member -> {
                                        Set<ProjectPermission> permissions = ROLE_PERMISSIONS
                                                        .getOrDefault(member.getRole(), Set.of());
                                        boolean has = permissions.contains(permission);
                                        log.debug("User {} Role {} Has Permission {}? {}", userId, member.getRole(),
                                                        permission, has);
                                        return has;
                                })
                                .orElseGet(() -> {
                                        // Fallback: Org Admins/Owners get full project access
                                        // Look up the project to find its organizationId, then check org role.
                                        return projectRepository.findById(projectId)
                                                        .map(project -> {
                                                                OrganizationRole orgRole = organizationMemberRepository
                                                                                .findByUserIdAndOrganizationId(userId,
                                                                                                project.getOrganizationId())
                                                                                .map(m -> m.getRole())
                                                                                .orElse(null);
                                                                if (orgRole == OrganizationRole.OWNER
                                                                                || orgRole == OrganizationRole.ADMIN) {
                                                                        log.debug("User {} is Org {} — granted full project access",
                                                                                        userId, orgRole);
                                                                        return true;
                                                                }
                                                                log.debug("User {} is not a member of project {} or its org",
                                                                                userId, projectId);
                                                                return false;
                                                        })
                                                        .orElse(false);
                                });
        }

        public Set<ProjectPermission> getPermissions(UUID userId, UUID projectId) {
                return projectMemberRepository.findByUserIdAndProjectId(userId, projectId)
                                .map(member -> ROLE_PERMISSIONS.getOrDefault(member.getRole(), Set.of()))
                                .orElse(Set.of());
        }
}
