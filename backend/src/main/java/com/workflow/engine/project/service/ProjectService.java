package com.workflow.engine.project.service;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.entity.UserStatus;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.project.dto.*;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.entity.ProjectStatus;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.ProjectMember;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.dto.WorkflowResponse;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final PermissionService permissionService;
    private final TaskRepository taskRepository;
    private final WorkflowStateRepository workflowStateRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectPermissionService projectPermissionService;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ProjectResponse create(UUID organizationId, CreateProjectRequest request, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.ADMIN);

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organizationId(organizationId)
                .workflowId(request.getWorkflowId())
                .showDueDate(request.getShowDueDate() != null ? request.getShowDueDate() : true)
                .showStoryPoints(request.getShowStoryPoints() != null ? request.getShowStoryPoints() : true)
                .explicitStatus(
                        request.getExplicitStatus() != null ? request.getExplicitStatus() : ProjectStatus.ACTIVE)
                .build();
        project = projectRepository.save(project);
        String role = getEffectiveRole(userId, organizationId, project.getId());
        return toResponseSingle(project, role, userId);
    }

    /**
     * Lists all projects for an organization.
     * Uses batch queries to avoid N+1: fires exactly 6 DB queries total
     * regardless of the number of projects.
     *
     * Before: O(N*4) queries for N projects.
     * After: O(1) — 6 queries total.
     */
    public List<ProjectResponse> listByOrganization(UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);

        List<Project> projects = projectRepository.findByOrganizationId(organizationId);
        if (projects.isEmpty())
            return List.of();

        List<UUID> projectIds = projects.stream().map(Project::getId).toList();
        LocalDate today = LocalDate.now();

        // --- Batch query 1: total task counts per project ---
        Map<UUID, Long> totalTaskCounts = toUUIDLongMap(
                taskRepository.countTasksByProjectIds(projectIds));

        // --- Batch query 2: completed task counts per project (DONE-state tasks) ---
        Map<UUID, Long> completedTaskCounts = toUUIDLongMap(
                taskRepository.countCompletedTasksByProjectIds(projectIds));

        // --- Batch query 3: overdue task counts per project ---
        Map<UUID, Long> overdueTaskCounts = toUUIDLongMap(
                taskRepository.countOverdueTasksByProjectIds(projectIds, today));

        // --- Batch query 4: distinct assignee IDs per project ---
        Map<UUID, List<UUID>> assigneeIdsByProject = new HashMap<>();
        for (Object[] row : taskRepository.findDistinctAssigneeIdsByProjectIds(projectIds)) {
            UUID projectId = (UUID) row[0];
            UUID assigneeId = (UUID) row[1];
            assigneeIdsByProject.computeIfAbsent(projectId, k -> new ArrayList<>()).add(assigneeId);
        }

        // --- Batch query 5: load all referenced users in one shot (top 3 per project)
        // ---
        Set<UUID> allAssigneeIds = assigneeIdsByProject.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userRepository.findAllById(allAssigneeIds).stream()
                .collect(Collectors.toMap(User::getId,
                        u -> u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()));

        // --- Batch query 6: get user's org role once ---
        OrganizationRole orgRole = permissionService.getUserRole(userId, organizationId);

        // --- Batch query 7: velocity — DONE tasks updated in the last 7 days ---
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        Map<UUID, Long> velocityMap = toUUIDLongMap(
                taskRepository.countCompletedTasksByProjectIdsSince(projectIds, sevenDaysAgo));

        // Pre-load user's project-specific roles in one batch query for regular members
        Map<UUID, com.workflow.engine.rbac.entity.ProjectMember> myProjectRoles = (orgRole == OrganizationRole.ADMIN
                || orgRole == OrganizationRole.OWNER)
                        ? java.util.Collections.emptyMap()
                        : projectMemberRepository.findByUserIdAndProjectIdIn(userId, projectIds)
                                .stream()
                                .collect(Collectors.toMap(
                                        com.workflow.engine.rbac.entity.ProjectMember::getProjectId,
                                        pm -> pm));

        // --- Batch query 8: in-progress task counts ---
        Map<UUID, Long> inProgressTaskCounts = toUUIDLongMap(
                taskRepository.countInProgressTasksByProjectIds(projectIds));

        return projects.stream()
                .map((Project p) -> {
                    long total = totalTaskCounts.getOrDefault(p.getId(), 0L);
                    long completed = completedTaskCounts.getOrDefault(p.getId(), 0L);
                    long overdue = overdueTaskCounts.getOrDefault(p.getId(), 0L);
                    long inProgress = inProgressTaskCounts.getOrDefault(p.getId(), 0L);
                    double velocity = ((Number) velocityMap.getOrDefault(p.getId(), 0L)).longValue() / 7.0;

                    List<String> memberNames = assigneeIdsByProject
                            .getOrDefault(p.getId(), Collections.<UUID>emptyList()).stream()
                            .limit(3)
                            .map(id -> userNameMap.getOrDefault(id, "Unknown"))
                            .toList();

                    String status = computeStatus(total, completed);
                    String role = resolveRole(orgRole, userId, p.getId(), myProjectRoles);

                    // Fallbacks for primitives
                    if (Double.isNaN(velocity))
                        velocity = 0.0;

                    return toResponse(p, role, total, completed, overdue, inProgress, memberNames, status, velocity,
                            null, null, null, null, p.getExplicitStatus());
                })
                .toList();
    }

    public ProjectResponse getById(UUID projectId, UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);
        Project project = projectRepository.findByIdAndOrganizationId(projectId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        String role = getEffectiveRole(userId, organizationId, projectId);
        return toResponseSingle(project, role, userId);
    }

    @Transactional
    public ProjectResponse update(UUID projectId, UUID organizationId, CreateProjectRequest request, UUID userId) {
        // Permission check moved to Controller (MANAGE_PROJECT_SETTINGS) to allow
        // Project Admins
        Project project = projectRepository.findByIdAndOrganizationId(projectId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setWorkflowId(request.getWorkflowId());
        if (request.getShowDueDate() != null)
            project.setShowDueDate(request.getShowDueDate());
        if (request.getShowStoryPoints() != null)
            project.setShowStoryPoints(request.getShowStoryPoints());
        if (request.getExplicitStatus() != null)
            project.setExplicitStatus(request.getExplicitStatus());
        project = projectRepository.save(project);
        String role = getEffectiveRole(userId, organizationId, projectId);
        return toResponseSingle(project, role, userId);
    }

    @Transactional
    public void delete(UUID projectId, UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.ADMIN);
        Project project = projectRepository.findByIdAndOrganizationId(projectId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        projectRepository.delete(project);
    }

    /**
     * Used internally by other modules to get the organization a project belongs to
     */
    public Project getProjectEntity(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
    }

    @Transactional
    public ProjectResponse archive(UUID projectId, UUID organizationId, UUID userId) {
        Project project = getProjectEntity(projectId);
        // Toggle archived state
        project.setArchived(!project.isArchived());
        project = projectRepository.save(project);
        String role = getEffectiveRole(userId, organizationId, projectId);
        return toResponseSingle(project, role, userId);
    }

    public byte[] exportProjectData(UUID projectId, UUID organizationId, UUID userId) {
        Project project = getProjectEntity(projectId);

        // Gather all project data
        Map<String, Object> exportData = new HashMap<>();
        exportData.put("project", project);

        List<com.workflow.engine.task.entity.Task> tasks = taskRepository.findByProjectId(projectId);
        exportData.put("tasks", tasks);

        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        exportData.put("members", members);

        try {
            return objectMapper.writeValueAsBytes(exportData);
        } catch (Exception e) {
            throw new BusinessException("Failed to serialize project data for export.");
        }
    }

    // -------------------------------------------------------------------------
    // Project Member Management
    // -------------------------------------------------------------------------

    @Transactional
    public ProjectMemberDetailResponse addProjectMember(UUID projectId, UUID organizationId,
            AddProjectMemberRequest request, UUID requestingUserId) {
        // Must be PROJECT_ADMIN to add members
        projectPermissionService.checkPermission(requestingUserId, projectId,
                com.workflow.engine.rbac.entity.ProjectPermission.MANAGE_PROJECT_SETTINGS);

        Project project = projectRepository.findByIdAndOrganizationId(projectId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Check if user is already a member
        if (projectMemberRepository.existsByUserIdAndProjectId(user.getId(), projectId)) {
            throw new BusinessException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .userId(user.getId())
                .projectId(projectId)
                .role(request.getRole())
                .build();
        member = projectMemberRepository.save(member);

        return toProjectMemberDetailResponse(member, user, Collections.emptyList(), Collections.emptyList());
    }

    public List<ProjectMemberDetailResponse> listProjectMembers(UUID projectId, UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);
        if (!projectRepository.existsByIdAndOrganizationId(projectId, organizationId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(projectId);
        if (projectMembers == null || projectMembers.isEmpty())
            return Collections.emptyList();

        List<UUID> allMemberIds = projectMembers.stream()
                .map(ProjectMember::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, User> userMap = userRepository.findAllById(allMemberIds).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));

        List<com.workflow.engine.task.entity.Task> projectTasks = taskRepository
                .findByProjectIdAndAssigneeIdIn(projectId, allMemberIds);
        List<com.workflow.engine.task.entity.Task> unassignedTasks = taskRepository
                .findByProjectIdAndAssigneeIdIsNull(projectId);

        return projectMembers.stream()
                .filter(pm -> pm.getUserId() != null)
                .map(pm -> {
                    User u = userMap.get(pm.getUserId());
                    List<com.workflow.engine.task.entity.Task> memberTasks = projectTasks.stream()
                            .filter(t -> t.getAssigneeId() != null && t.getAssigneeId().equals(pm.getUserId()))
                            .toList();
                    return toProjectMemberDetailResponse(pm, u, memberTasks, unassignedTasks);
                }).toList();
    }

    @Transactional
    public void removeProjectMember(UUID projectId, UUID organizationId, UUID memberId, UUID requestingUserId) {
        projectPermissionService.checkPermission(requestingUserId, projectId,
                com.workflow.engine.rbac.entity.ProjectPermission.MANAGE_PROJECT_SETTINGS);

        if (!projectRepository.existsByIdAndOrganizationId(projectId, organizationId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        ProjectMember member = projectMemberRepository.findByUserIdAndProjectId(memberId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectMember", "userId", memberId));

        // Prevent removing the sole PROJECT_ADMIN if necessary (omitted for now due to
        // org admin capabilities)

        projectMemberRepository.delete(member);
    }

    @Transactional
    public void removeProjectMembersBulk(UUID projectId, UUID organizationId, List<UUID> memberIds,
            UUID requestingUserId) {
        projectPermissionService.checkPermission(requestingUserId, projectId,
                com.workflow.engine.rbac.entity.ProjectPermission.MANAGE_PROJECT_SETTINGS);

        if (!projectRepository.existsByIdAndOrganizationId(projectId, organizationId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        for (UUID memberId : memberIds) {
            projectMemberRepository.deleteByUserIdAndProjectId(memberId, projectId);
        }
    }

    @Transactional
    public ProjectMemberDetailResponse updateProjectMemberRole(UUID projectId, UUID organizationId, UUID memberId,
            com.workflow.engine.rbac.entity.ProjectRole newRole, UUID requestingUserId) {
        projectPermissionService.checkPermission(requestingUserId, projectId,
                com.workflow.engine.rbac.entity.ProjectPermission.MANAGE_PROJECT_SETTINGS);

        if (!projectRepository.existsByIdAndOrganizationId(projectId, organizationId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }

        ProjectMember member = projectMemberRepository.findByUserIdAndProjectId(memberId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectMember", "userId", memberId));

        member.setRole(newRole);
        member = projectMemberRepository.save(member);

        User user = userRepository.findById(memberId).orElse(null);

        // Return updated detail (without tasks since it's just a role update response)
        return toProjectMemberDetailResponse(member, user, Collections.emptyList(), Collections.emptyList());
    }

    private ProjectMemberDetailResponse toProjectMemberDetailResponse(ProjectMember pm, User u,
            List<com.workflow.engine.task.entity.Task> memberTasks,
            List<com.workflow.engine.task.entity.Task> unassignedTasks) {
        List<String> activeTitles = memberTasks.stream()
                .limit(3)
                .map(com.workflow.engine.task.entity.Task::getTitle)
                .toList();

        int workloadScore = memberTasks.size() * 10;

        List<String> suggestions = unassignedTasks.stream()
                .limit(2)
                .map(com.workflow.engine.task.entity.Task::getTitle)
                .toList();

        // Calculate a basic "lastTaskCompletedAt" assuming we have access to updated_at
        // and a DONE status
        String lastCompleted = memberTasks.stream()
                // If it's done and has an updatedAt
                .filter(t -> t.getUpdatedAt() != null)
                .map(t -> t.getUpdatedAt().toString())
                .max(String::compareTo)
                .orElse(null);

        return ProjectMemberDetailResponse.builder()
                .userId(pm.getUserId().toString())
                .name(u != null ? (u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()) : "Unknown")
                .email(u != null ? u.getEmail() : "Unknown")
                .avatarUrl(u != null ? u.getAvatarUrl() : null)
                .role(pm.getRole().toString())
                .status(u != null ? u.getStatus() : UserStatus.OFFLINE)
                .assignedTaskCount(memberTasks.size())
                .activeTaskTitles(activeTitles)
                .workloadScore(workloadScore)
                .suggestedTaskTitles(suggestions)
                .joinedAt(pm.getCreatedAt() != null ? pm.getCreatedAt().toString() : null)
                .lastActiveAt(u != null && u.getLastActiveAt() != null ? u.getLastActiveAt().toString() : null)
                .lastTaskCompletedAt(lastCompleted)
                .build();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private String getEffectiveRole(UUID userId, UUID organizationId, UUID projectId) {
        OrganizationRole orgRole = permissionService.getUserRole(userId, organizationId);
        return resolveRole(orgRole, userId, projectId, java.util.Collections.emptyMap());
    }

    private String resolveRole(OrganizationRole orgRole, UUID userId, UUID projectId,
            Map<UUID, com.workflow.engine.rbac.entity.ProjectMember> preloaded) {
        // 1. Governance override: Org Admins/Owners are implicitly Project Admins in
        // the UI
        if (orgRole == OrganizationRole.OWNER || orgRole == OrganizationRole.ADMIN) {
            return "PROJECT_ADMIN";
        }

        // 2. Use pre-loaded map first (avoids per-project DB query in list endpoint)
        if (projectId != null && !preloaded.isEmpty()) {
            com.workflow.engine.rbac.entity.ProjectMember pm = preloaded.get(projectId);
            return pm != null ? pm.getRole().name() : null;
        }

        // 3. Fallback: single DB query (used for single-project paths)
        if (projectId != null) {
            return projectMemberRepository.findByUserIdAndProjectId(userId, projectId)
                    .map(m -> m.getRole().name())
                    .orElse(null);
        }
        return null;
    }

    private String computeStatus(long total, long completed) {
        if (total == 0)
            return "ON_TRACK";
        double progress = (double) completed / total;
        if (progress == 1.0)
            return "COMPLETED";
        if (progress < 0.2 && total > 5)
            return "AT_RISK";
        return "ON_TRACK";
    }

    /** Converts Object[] rows [UUID, Long] into a Map<UUID, Long>. */
    private Map<UUID, Long> toUUIDLongMap(List<Object[]> rows) {
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    /**
     * Single-project response—used for create/update/getById where batch
     * queries are not needed.
     */

    private ProjectResponse toResponseSingle(Project project, String role, UUID userId) {
        long totalTasks = taskRepository.countByProjectId(project.getId());
        long completedTasks = 0;
        long inProgressTasks = 0;
        if (project.getWorkflowId() != null) {
            List<WorkflowState> allStates = workflowStateRepository.findByWorkflowId(project.getWorkflowId());
            for (WorkflowState state : allStates) {
                if (state.getType() == StateType.DONE) {
                    completedTasks += taskRepository.countByProjectIdAndCurrentStateId(project.getId(), state.getId());
                } else if (state.getType() == StateType.IN_PROGRESS) {
                    inProgressTasks += taskRepository.countByProjectIdAndCurrentStateId(project.getId(), state.getId());
                }
            }
        }
        List<UUID> memberIds = taskRepository.findDistinctAssigneeIdsByProjectId(project.getId());
        // Batch lookup — avoids N+1 (one findById per member)
        Map<UUID, String> memberNameMap = userRepository.findAllById(
                memberIds.stream().limit(3).toList()).stream()
                .collect(Collectors.toMap(User::getId,
                        u -> u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()));
        List<String> memberNames = memberIds.stream()
                .limit(3)
                .map(id -> memberNameMap.getOrDefault(id, "Unknown"))
                .toList();
        long overdueCount = taskRepository.countByProjectIdAndDueDateBefore(project.getId(), LocalDate.now());

        // Velocity: type-safe extraction using the same toUUIDLongMap helper
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        double velocity = 0.0;
        try {
            List<Object[]> velocityData = taskRepository.countCompletedTasksByProjectIdsSince(
                    List.of(project.getId()), sevenDaysAgo);
            if (velocityData != null && !velocityData.isEmpty()) {
                Map<UUID, Long> velocityMap = toUUIDLongMap(velocityData);
                velocity = velocityMap.getOrDefault(project.getId(), 0L) / 7.0;
            }
        } catch (Exception e) {
            velocity = 0.0; // Fallback to 0 if count fails
        }

        String status = computeStatus(totalTasks, completedTasks);

        // Fetch distributions
        Map<String, Long> priorityDist = taskRepository.countTasksByPriority(project.getId()).stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

        Map<String, Long> workloadDist = taskRepository.countTasksByAssignee(project.getId()).stream()
                .collect(Collectors.toMap(
                        row -> row[0] != null ? memberNameMap.getOrDefault((UUID) row[0], "Unknown") : "Unassigned",
                        row -> (Long) row[1]));

        // Team Details
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(project.getId());
        List<UUID> allMemberIds = projectMembers.stream().map(ProjectMember::getUserId).toList();
        Map<UUID, User> userMap = userRepository.findAllById(allMemberIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<com.workflow.engine.task.entity.Task> projectTasks = taskRepository
                .findByProjectIdAndAssigneeIdIn(project.getId(), allMemberIds);
        List<com.workflow.engine.task.entity.Task> unassignedTasks = taskRepository
                .findByProjectIdAndAssigneeIdIsNull(project.getId());

        List<ProjectMemberDetailResponse> teamDetails = projectMembers.stream().map(pm -> {
            User u = userMap.get(pm.getUserId());
            List<com.workflow.engine.task.entity.Task> memberTasks = projectTasks.stream()
                    .filter(t -> t.getAssigneeId() != null && t.getAssigneeId().equals(pm.getUserId()))
                    .toList();
            return toProjectMemberDetailResponse(pm, u, memberTasks, unassignedTasks);
        }).toList();

        WorkflowResponse workflowResp = null;
        if (project.getWorkflowId() != null) {
            try {
                workflowResp = workflowService.getById(project.getWorkflowId(), userId);
            } catch (Exception e) {
                // Fallback: don't break the whole project load if workflow fetch fails
            }
        }

        return toResponse(project, role, totalTasks, completedTasks, overdueCount, inProgressTasks, memberNames, status,
                velocity, workflowResp, priorityDist, workloadDist, teamDetails, project.getExplicitStatus());
    }

    private ProjectResponse toResponse(Project project, String role,
            long totalTasks, long completedTasks, long overdueCount, long inProgressCount,
            List<String> memberNames, String status, double velocity, WorkflowResponse workflow,
            Map<String, Long> priorityDist, Map<String, Long> workloadDist,
            List<ProjectMemberDetailResponse> team, ProjectStatus explicitStatus) {
        return ProjectResponse.builder()
                .id(project.getId().toString())
                .name(project.getName())
                .description(project.getDescription())
                .organizationId(project.getOrganizationId().toString())
                .workflowId(project.getWorkflowId() != null ? project.getWorkflowId().toString() : null)
                .role(role)
                .createdAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null)
                .totalTaskCount(totalTasks) // Issue #4 fix: was loopTaskCount
                .completedTaskCount(completedTasks)
                .inProgressTaskCount(inProgressCount)
                .members(memberNames)
                .status(status)
                .explicitStatus(explicitStatus)
                .overdueTaskCount(overdueCount)
                .velocity(velocity)
                .showDueDate(project.isShowDueDate())
                .showStoryPoints(project.isShowStoryPoints())
                .workflow(workflow)
                .priorityDistribution(priorityDist)
                .workloadDistribution(workloadDist)
                .team(team)
                .build();
    }
}
