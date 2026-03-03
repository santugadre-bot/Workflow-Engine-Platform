package com.workflow.engine.approval.service;

import com.workflow.engine.approval.dto.ApprovalResponse;
import com.workflow.engine.approval.entity.ApprovalRequest;
import com.workflow.engine.approval.repository.ApprovalRequestRepository;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRepository;
    private final NotificationService notificationService;
    private final PermissionService permissionService;
    private final TaskRepository taskRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final WorkflowStateRepository stateRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationMemberRepository memberRepository;

    public List<ApprovalRequest> listPendingInOrganization(UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);
        return approvalRepository.findByOrganizationIdAndStatus(organizationId, ApprovalRequest.ApprovalStatus.PENDING);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void createRequest(UUID taskId, UUID projectId, UUID organizationId, UUID transitionId, UUID requesterId) {
        // Prevent duplicate pending requests for the same move
        if (approvalRepository
                .findByTaskIdAndTransitionIdAndStatus(taskId, transitionId, ApprovalRequest.ApprovalStatus.PENDING)
                .isPresent()) {
            return;
        }

        ApprovalRequest request = ApprovalRequest.builder()
                .taskId(taskId)
                .projectId(projectId)
                .organizationId(organizationId)
                .transitionId(transitionId)
                .requesterId(requesterId)
                .status(ApprovalRequest.ApprovalStatus.PENDING)
                .build();
        approvalRepository.save(request);

        // Resolve task title for a meaningful notification message
        String taskTitle = taskRepository.findById(taskId)
                .map(t -> "'" + t.getTitle() + "'")
                .orElse("a task");
        WorkflowTransition transition = transitionRepository.findById(transitionId).orElse(null);
        String transitionDesc = transition != null
                ? " (" + transition.getName() + ")"
                : "";

        // Notify ADMIN and OWNER roles
        List<UUID> adminIds = memberRepository
                .findByOrganizationIdAndRoleIn(organizationId, List.of(OrganizationRole.ADMIN, OrganizationRole.OWNER))
                .stream()
                .map(com.workflow.engine.rbac.entity.OrganizationMember::getUserId)
                .toList();

        if (!adminIds.isEmpty()) {
            notificationService.notifyUsers(
                    adminIds,
                    "Approval Required",
                    "Task " + taskTitle + " needs your approval" + transitionDesc + ".",
                    "APPROVAL_REQUIRED", // must match frontend NOTIF_ICONS key
                    taskId,
                    organizationId);
        }
    }

    @Transactional
    public void processRequest(UUID requestId, UUID approverId, String status, String comment) {
        ApprovalRequest request = approvalRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", "id", requestId));

        permissionService.checkPermission(approverId, request.getOrganizationId(), OrganizationRole.ADMIN);

        request.setStatus(ApprovalRequest.ApprovalStatus.valueOf(status));
        request.setComment(comment);
        request.setApproverId(approverId);
        request.setProcessedAt(LocalDateTime.now());
        approvalRepository.save(request);

        notificationService.createNotification(
                request.getRequesterId(),
                status.equals("APPROVED") ? "✅ Approval Granted" : "❌ Request Rejected",
                status.equals("APPROVED")
                        ? "Your transition request has been approved."
                        : "Your transition request was rejected"
                                + (comment != null && !comment.isBlank() ? ": \"" + comment + "\"" : "."),
                "APPROVAL_PROCESSED",
                request.getTaskId(),
                request.getOrganizationId());
    }

    public boolean isApproved(UUID taskId, UUID transitionId) {
        return approvalRepository.findByTaskIdAndStatus(taskId, ApprovalRequest.ApprovalStatus.APPROVED)
                .stream()
                .anyMatch(r -> r.getTransitionId().equals(transitionId));
    }

    public List<ApprovalResponse> getPendingRequests(UUID organizationId) {
        return approvalRepository.findByOrganizationIdAndStatus(organizationId, ApprovalRequest.ApprovalStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Returns the last 200 processed (APPROVED or REJECTED) requests for the
     * history tab,
     * ordered by processedAt descending.
     */
    public List<ApprovalResponse> getHistoryRequests(UUID organizationId) {
        return approvalRepository.findByOrganizationIdAndStatusInOrderByProcessedAtDesc(
                organizationId,
                List.of(ApprovalRequest.ApprovalStatus.APPROVED, ApprovalRequest.ApprovalStatus.REJECTED))
                .stream()
                .limit(200)
                .map(this::mapToResponse)
                .toList();
    }

    private ApprovalResponse mapToResponse(ApprovalRequest request) {
        Task task = taskRepository.findById(request.getTaskId()).orElse(null);
        WorkflowTransition transition = transitionRepository.findById(request.getTransitionId()).orElse(null);
        User requester = userRepository.findById(request.getRequesterId()).orElse(null);

        // Resolve project name
        String projectName = null;
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId()).orElse(null);
            projectName = project != null ? project.getName() : null;
        }

        // Resolve from/to state names from the transition
        String fromStateName = null;
        String toStateName = null;
        if (transition != null) {
            WorkflowState fromState = stateRepository.findById(transition.getFromStateId()).orElse(null);
            WorkflowState toState = stateRepository.findById(transition.getToStateId()).orElse(null);
            fromStateName = fromState != null ? fromState.getName() : null;
            toStateName = toState != null ? toState.getName() : null;
        }

        // Resolve approver
        String approverName = null;
        if (request.getApproverId() != null) {
            User approver = userRepository.findById(request.getApproverId()).orElse(null);
            approverName = approver != null ? approver.getDisplayName() : null;
        }

        // Build initials from requester display name
        String requesterName = requester != null ? requester.getDisplayName() : "Unknown";
        String initials = buildInitials(requesterName);

        return ApprovalResponse.builder()
                .id(request.getId())
                .taskId(request.getTaskId())
                .taskTitle(task != null ? task.getTitle() : "Unknown Task")
                .projectId(request.getProjectId())
                .projectName(projectName)
                .transitionId(request.getTransitionId())
                .transitionName(transition != null ? transition.getName() : "Unknown Transition")
                .fromStateName(fromStateName)
                .toStateName(toStateName)
                .requesterId(request.getRequesterId())
                .requesterName(requesterName)
                .requesterInitials(initials)
                .approverId(request.getApproverId())
                .approverName(approverName)
                .status(request.getStatus().name())
                .comment(request.getComment())
                .createdAt(request.getCreatedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }

    private String buildInitials(String displayName) {
        if (displayName == null || displayName.isBlank())
            return "?";
        String[] parts = displayName.trim().split("\\s+");
        if (parts.length == 1)
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return (parts[0].charAt(0) + "" + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
