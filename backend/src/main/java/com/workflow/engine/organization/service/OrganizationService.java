package com.workflow.engine.organization.service;

import com.workflow.engine.audit.entity.AuditLog;
import com.workflow.engine.audit.repository.AuditLogRepository;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import com.workflow.engine.organization.dto.*;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

        private static final Logger log = LoggerFactory.getLogger(OrganizationService.class);

        private final OrganizationRepository organizationRepository;
        private final OrganizationMemberRepository memberRepository;
        private final UserRepository userRepository;
        private final PermissionService permissionService;
        private final ProjectRepository projectRepository;
        private final WorkflowRepository workflowRepository;
        private final TaskRepository taskRepository;
        private final AuditLogRepository auditLogRepository;

        @Transactional
        public OrganizationResponse create(CreateOrganizationRequest request, UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                if (user.getSystemRole() != com.workflow.engine.auth.entity.SystemRole.SUPER_ADMIN) {
                        throw new BusinessException("Only system administrators can create organizations");
                }

                Organization organization = Organization.builder()
                                .name(request.getName())
                                .description(request.getDescription())
                                .ownerId(userId)
                                .build();
                organization = organizationRepository.save(organization);

                // Creator becomes OWNER
                OrganizationMember member = OrganizationMember.builder()
                                .userId(userId)
                                .organizationId(organization.getId())
                                .role(OrganizationRole.OWNER)
                                .build();
                memberRepository.save(member);

                return toResponse(organization, OrganizationRole.OWNER);
        }

        public List<OrganizationResponse> listUserOrganizations(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                if (user.getSystemRole() == com.workflow.engine.auth.entity.SystemRole.SUPER_ADMIN) {
                        return organizationRepository.findAll().stream()
                                        .map(org -> toResponse(org, OrganizationRole.OWNER))
                                        .toList();
                }

                return organizationRepository.findAllByMemberUserId(userId).stream()
                                .map(org -> {
                                        OrganizationRole role = permissionService.getUserRole(userId, org.getId());
                                        return toResponse(org, role);
                                })
                                .toList();
        }

        public OrganizationResponse getById(UUID organizationId, UUID userId) {
                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));
                permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);
                OrganizationRole role = permissionService.getUserRole(userId, organizationId);
                return toResponse(organization, role);
        }

        @Transactional
        public MemberResponse addMember(UUID organizationId, AddMemberRequest request, UUID requestingUserId) {
                permissionService.checkPermission(requestingUserId, organizationId, OrganizationRole.ADMIN);

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

                if (memberRepository.existsByUserIdAndOrganizationId(user.getId(), organizationId)) {
                        throw new BusinessException("User is already a member of this organization");
                }

                OrganizationMember member = OrganizationMember.builder()
                                .userId(user.getId())
                                .organizationId(organizationId)
                                .role(request.getRole())
                                .build();
                memberRepository.save(member);

                return MemberResponse.builder()
                                .id(member.getId().toString())
                                .userId(user.getId().toString())
                                .email(user.getEmail())
                                .displayName(user.getDisplayName())
                                .role(member.getRole().name())
                                .status(user.getStatus())
                                .avatarUrl(user.getAvatarUrl())
                                .workloadScore(0)
                                .assignedTaskCount(0)
                                .joinedAt(member.getCreatedAt() != null ? member.getCreatedAt().toString() : null)
                                .build();
        }

        public List<MemberResponse> listMembers(UUID organizationId, UUID userId) {
                permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);

                // Fetch all members in one query, then batch-fetch all users in one query
                List<OrganizationMember> members = memberRepository.findByOrganizationId(organizationId);
                Set<UUID> userIds = members.stream()
                                .map(OrganizationMember::getUserId)
                                .collect(Collectors.toSet());
                Map<UUID, User> userMap = userRepository.findAllById(userIds).stream()
                                .collect(Collectors.toMap(User::getId, u -> u));

                // Batch-fetch all task assignments for these members within the org
                List<Object[]> assignments = taskRepository.countTasksByAssigneeInOrganization(organizationId,
                                List.copyOf(userIds));
                Map<UUID, Long> taskCounts = assignments.stream()
                                .filter(row -> row[0] != null)
                                .collect(Collectors.toMap(row -> (UUID) row[0], row -> ((Number) row[1]).longValue()));

                return members.stream()
                                .map(member -> {
                                        User user = userMap.get(member.getUserId());
                                        long assignedTaskCount = taskCounts.getOrDefault(member.getUserId(), 0L);
                                        // Workload score logic matches project scale: 10 pts per task
                                        int workloadScore = (int) (assignedTaskCount * 10);

                                        return MemberResponse.builder()
                                                        .id(member.getId().toString())
                                                        .userId(member.getUserId().toString())
                                                        .email(user != null ? user.getEmail() : "unknown")
                                                        .displayName(user != null ? user.getDisplayName() : "Unknown")
                                                        .role(member.getRole().name())
                                                        .status(user != null ? user.getStatus()
                                                                        : com.workflow.engine.auth.entity.UserStatus.OFFLINE)
                                                        .avatarUrl(user != null ? user.getAvatarUrl() : null)
                                                        .workloadScore(workloadScore)
                                                        .assignedTaskCount(assignedTaskCount)
                                                        .joinedAt(member.getCreatedAt() != null
                                                                        ? member.getCreatedAt().toString()
                                                                        : null)
                                                        .lastActiveAt(user != null && user.getLastActiveAt() != null
                                                                        ? user.getLastActiveAt().toString()
                                                                        : null)
                                                        .build();
                                })
                                .toList();
        }

        @Transactional
        public OrganizationResponse update(UUID organizationId, CreateOrganizationRequest request, UUID userId) {
                permissionService.checkPermission(userId, organizationId, OrganizationRole.ADMIN);
                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

                organization.setName(request.getName());
                organization.setDescription(request.getDescription());
                organization = organizationRepository.save(organization);

                OrganizationRole role = permissionService.getUserRole(userId, organizationId);
                return toResponse(organization, role);
        }

        @Transactional
        public void delete(UUID organizationId, UUID userId) {
                permissionService.checkPermission(userId, organizationId, OrganizationRole.OWNER);
                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

                // Note: deletion will cascade to members/projects/tasks via JPA/DB if
                // configured
                organizationRepository.delete(organization);
        }

        @Transactional
        public void removeMember(UUID organizationId, UUID memberId, UUID requestingUserId) {
                permissionService.checkPermission(requestingUserId, organizationId, OrganizationRole.ADMIN);

                OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(memberId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Member", "userId", memberId));

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

                if (organization.getOwnerId().equals(memberId)) {
                        throw new BusinessException("Cannot remove the organization owner");
                }

                memberRepository.delete(member);
        }

        @Transactional
        public void removeMembersBulk(UUID organizationId, List<UUID> memberIds, UUID requestingUserId) {
                permissionService.checkPermission(requestingUserId, organizationId, OrganizationRole.ADMIN);

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

                for (UUID memberId : memberIds) {
                        if (organization.getOwnerId().equals(memberId)) {
                                log.warn("Skipping removal of owner: {}", memberId);
                                continue;
                        }
                        memberRepository.deleteByUserIdAndOrganizationId(memberId, organizationId);
                }
        }

        @Transactional
        public MemberResponse updateMemberRole(UUID organizationId, UUID memberId, OrganizationRole newRole,
                        UUID requestingUserId) {
                permissionService.checkPermission(requestingUserId, organizationId, OrganizationRole.ADMIN);

                OrganizationMember member = memberRepository.findByUserIdAndOrganizationId(memberId, organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Member", "userId", memberId));

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

                if (organization.getOwnerId().equals(memberId) && newRole != OrganizationRole.OWNER) {
                        throw new BusinessException("Cannot change the organization owner's role to non-OWNER");
                }

                member.setRole(newRole);
                memberRepository.save(member);

                User user = userRepository.findById(memberId).orElse(null);
                return MemberResponse.builder()
                                .id(member.getId().toString())
                                .userId(member.getUserId().toString())
                                .email(user != null ? user.getEmail() : "unknown")
                                .displayName(user != null ? user.getDisplayName() : "Unknown")
                                .role(member.getRole().name())
                                .status(user != null ? user.getStatus()
                                                : com.workflow.engine.auth.entity.UserStatus.OFFLINE)
                                .avatarUrl(user != null ? user.getAvatarUrl() : null)
                                .workloadScore(0) // Role update doesn't usually care about workload, skip heavy fetch
                                .joinedAt(member.getCreatedAt() != null ? member.getCreatedAt().toString() : null)
                                .build();
        }

        private OrganizationResponse toResponse(Organization organization, OrganizationRole role) {
                return OrganizationResponse.builder()
                                .id(organization.getId().toString())
                                .name(organization.getName())
                                .description(organization.getDescription())
                                .ownerId(organization.getOwnerId().toString())
                                .role(role != null ? role.name() : null)
                                .createdAt(organization.getCreatedAt() != null ? organization.getCreatedAt().toString()
                                                : null)
                                .build();
        }

        /**
         * Get organization dashboard statistics
         */
        public OrganizationStatsResponse getStats(UUID organizationId, UUID userId) {
                // Permission check
                permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);

                // Note: repositories must be updated to support countByOrganizationId
                long projectCount = projectRepository.countByOrganizationId(organizationId);
                long workflowCount = workflowRepository.countByOrganizationId(organizationId);
                long taskCount = taskRepository.countByOrganizationId(organizationId);
                long openTasksCount = taskRepository.countOpenByOrganizationId(organizationId);
                long memberCount = memberRepository.countByOrganizationId(organizationId);
                long activeWorkflowsCount = workflowRepository.countActiveByOrganizationId(organizationId);

                // UX Enhancement Counts
                long overdueTaskCount = taskRepository.countByOrganizationIdAndDueDateBefore(organizationId,
                                LocalDate.now());
                long dueSoonTaskCount = taskRepository.countByOrganizationIdAndDueDateBetween(organizationId,
                                LocalDate.now(), LocalDate.now().plusDays(3));

                return OrganizationStatsResponse.builder()
                                .projectCount(projectCount)
                                .workflowCount(workflowCount)
                                .taskCount(taskCount)
                                .openTasksCount(openTasksCount)
                                .memberCount(memberCount)
                                .activeWorkflowsCount(activeWorkflowsCount)
                                .overdueTaskCount(overdueTaskCount)
                                .dueSoonTaskCount(dueSoonTaskCount)
                                .build();
        }

        /**
         * Get recent activity feed for organization
         */
        public List<OrganizationActivityResponse> getRecentActivity(UUID organizationId, UUID userId, int limit) {
                // Permission check
                permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);

                // Fetch recent audit logs
                Page<AuditLog> activityPage = auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(
                                organizationId, PageRequest.of(0, limit));

                List<AuditLog> logs = activityPage.getContent();

                // Batch-fetch all referenced users in a single query (fixes N+1)
                Set<UUID> userIds = logs.stream()
                                .filter(l -> l.getUserId() != null)
                                .map(AuditLog::getUserId)
                                .collect(Collectors.toSet());
                Map<UUID, String> userNameMap = userRepository.findAllById(userIds).stream()
                                .collect(Collectors.toMap(
                                                User::getId,
                                                u -> u.getDisplayName() != null ? u.getDisplayName() : u.getEmail()));

                return logs.stream()
                                .map(l -> toActivityResponse(l, userNameMap))
                                .toList();
        }

        private OrganizationActivityResponse toActivityResponse(AuditLog log, Map<UUID, String> userNameMap) {
                String userName = log.getUserId() != null
                                ? userNameMap.getOrDefault(log.getUserId(), "Unknown")
                                : "Unknown";

                return OrganizationActivityResponse.builder()
                                .id(log.getId().toString())
                                .actionType(log.getActionType())
                                .entityType(log.getEntityType())
                                .entityId(log.getEntityId() != null ? log.getEntityId().toString() : null)
                                .metadata(log.getMetadata())
                                .userId(log.getUserId() != null ? log.getUserId().toString() : null)
                                .userName(userName)
                                .createdAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null)
                                .build();
        }
}
