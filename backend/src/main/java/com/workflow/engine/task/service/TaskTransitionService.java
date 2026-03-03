package com.workflow.engine.task.service;

import com.workflow.engine.approval.service.ApprovalService;
import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.common.exception.InvalidTransitionException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.entity.TaskHistory;
import com.workflow.engine.task.repository.TaskHistoryRepository;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * ⭐ THE ONLY CLASS ALLOWED TO CHANGE task.currentStateId ⭐
 *
 * All state transitions must go through this service.
 */
@Service
@RequiredArgsConstructor
public class TaskTransitionService {

        private static final Logger log = LoggerFactory.getLogger(TaskTransitionService.class);

        private final TaskRepository taskRepository;
        private final TaskHistoryRepository historyRepository;
        private final WorkflowTransitionRepository transitionRepository;
        private final WorkflowStateRepository stateRepository;
        private final PermissionService permissionService;
        private final AuditService auditService;
        private final ApprovalService approvalService;
        private final NotificationService notificationService;
        private final com.workflow.engine.analytics.service.AnalyticsService analyticsService;
        private final com.workflow.engine.rbac.service.ProjectPermissionService projectPermissionService;
        private final org.springframework.context.ApplicationEventPublisher eventPublisher;
        private final com.workflow.engine.task.repository.TaskLinkRepository taskLinkRepository;

        /**
         * Executes a state transition on a task.
         */
        @Transactional
        public Task transition(UUID taskId, UUID transitionId, UUID userId) {
                return transition(taskId, transitionId, userId, 0);
        }

        @Transactional
        public Task transition(UUID taskId, UUID transitionId, UUID userId, int automationDepth) {
                // 1. Load task
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

                log.info("Transitioning task. taskId={}, userId={}, organizationId={}, transitionId={}, depth={}",
                                taskId, userId, task.getOrganizationId(), transitionId, automationDepth);

                // 2. Check permission (Skip if System User)
                if (!com.workflow.engine.common.config.SystemConstants.SYSTEM_USER_ID.equals(userId)) {
                        projectPermissionService.checkPermission(userId, task.getProjectId(),
                                        com.workflow.engine.rbac.entity.ProjectPermission.TRANSITION_ISSUE);
                }

                // 3. Load and validate transition
                WorkflowTransition wfTransition = transitionRepository.findById(transitionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Transition", "id",
                                                transitionId));

                // 4. Verify state
                if (!wfTransition.getFromStateId().equals(task.getCurrentStateId())) {
                        throw new InvalidTransitionException("Invalid state for transition");
                }

                // 4.5. Check Task Dependencies (Blockers)
                java.util.List<com.workflow.engine.task.entity.TaskLink> links = taskLinkRepository
                                .findByTargetTaskId(taskId);
                for (com.workflow.engine.task.entity.TaskLink link : links) {
                        if (link.getLinkType() == com.workflow.engine.task.entity.TaskLinkType.BLOCKS) {
                                Task sourceTask = taskRepository.findById(link.getSourceTaskId()).orElse(null);
                                if (sourceTask != null) {
                                        WorkflowState sourceState = stateRepository
                                                        .findById(sourceTask.getCurrentStateId()).orElse(null);
                                        if (sourceState != null &&
                                                        sourceState.getType() != com.workflow.engine.workflow.entity.StateType.DONE
                                                        &&
                                                        sourceState.getType() != com.workflow.engine.workflow.entity.StateType.END) {
                                                throw new InvalidTransitionException(
                                                                "Task is blocked by incomplete task: "
                                                                                + sourceTask.getTitle());
                                        }
                                }
                        }
                }

                // 5. Approvals
                if (wfTransition.isRequiresApproval() && !approvalService.isApproved(taskId, transitionId)) {
                        approvalService.createRequest(taskId, task.getProjectId(), task.getOrganizationId(),
                                        transitionId, userId);
                        throw new InvalidTransitionException("Transition requires approval");
                }

                // 6. History
                TaskHistory history = TaskHistory.builder()
                                .taskId(task.getId())
                                .fromStateId(task.getCurrentStateId())
                                .toStateId(wfTransition.getToStateId())
                                .transitionId(transitionId)
                                .transitionName(wfTransition.getName())
                                .performedBy(userId)
                                .build();
                historyRepository.save(history);

                // 7. Update task
                UUID oldStateId = task.getCurrentStateId();
                task.setCurrentStateId(wfTransition.getToStateId());

                WorkflowState targetState = stateRepository.findById(wfTransition.getToStateId()).orElse(null);
                if (targetState != null &&
                                (targetState.getType() == com.workflow.engine.workflow.entity.StateType.DONE ||
                                                targetState.getType() == com.workflow.engine.workflow.entity.StateType.END)) {
                        task.setResolvedAt(java.time.LocalDateTime.now());
                } else {
                        task.setResolvedAt(null);
                }

                task = taskRepository.save(task);

                // Record for analytics
                analyticsService.recordStateChange(task, oldStateId, task.getCurrentStateId(), userId);

                // 8. Audit
                auditService.log(userId, "STATE_CHANGED", "Task", task.getId(), task.getOrganizationId(),
                                String.format("Moved from %s to %s", oldStateId, task.getCurrentStateId()));

                // 9. Publish Event (for Automation)
                eventPublisher.publishEvent(new com.workflow.engine.common.event.WorkflowEvent(
                                this,
                                task.getId(),
                                com.workflow.engine.common.event.EventType.TASK_TRANSITIONED,
                                java.util.Map.of(
                                                "taskId", task.getId(),
                                                "projectId", task.getProjectId(),
                                                "transitionId", transitionId,
                                                "newStateId", task.getCurrentStateId()),
                                userId).withDepth(automationDepth));

                return task;
        }
}
