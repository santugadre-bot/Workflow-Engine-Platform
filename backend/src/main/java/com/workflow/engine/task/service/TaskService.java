package com.workflow.engine.task.service;

import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.common.event.EventType;
import com.workflow.engine.common.event.WorkflowEvent;
import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.service.ProjectService;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.task.dto.*;
import com.workflow.engine.task.entity.*;
import com.workflow.engine.task.repository.*;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import com.workflow.engine.workflow.service.WorkflowService;
import com.workflow.engine.common.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class TaskService {

        private final TaskRepository taskRepository;
        private final TaskTransitionService transitionService;
        private final WorkflowService workflowService;
        private final WorkflowStateRepository stateRepository;
        private final WorkflowTransitionRepository transitionRepository;
        private final ProjectService projectService;
        private final PermissionService permissionService;
        private final AuditService auditService;
        private final AutomationService automationService;
        private final com.workflow.engine.project.repository.ProjectRepository projectRepository;
        private final com.workflow.engine.core.user.service.UserService userService;
        private final com.workflow.engine.common.service.WebSocketService webSocketService;
        private final UserRepository userRepository;
        private final NotificationService notificationService;
        private final ApplicationEventPublisher eventPublisher;
        private final com.workflow.engine.analytics.service.AnalyticsService analyticsService;
        private final com.workflow.engine.rbac.service.ProjectPermissionService projectPermissionService;
        private final TaskCommentService taskCommentService;
        private final TaskHistoryService taskHistoryService;
        private final com.workflow.engine.task.repository.TaskAttachmentRepository attachmentRepository;
        private final TaskLinkRepository taskLinkRepository;

        @Transactional
        public TaskResponse create(UUID projectId, CreateTaskRequest request, UUID userId) {
                Project project = projectService.getProjectEntity(projectId);
                projectPermissionService.checkPermission(userId, projectId,
                                com.workflow.engine.rbac.entity.ProjectPermission.CREATE_ISSUE);

                if (project.getWorkflowId() == null) {
                        throw new BusinessException("Project has no workflow assigned. Assign a workflow first.");
                }

                // Issue #1 fix: use requested stateId if provided & valid; else default to
                // START state
                WorkflowState startState;
                if (request.getStateId() != null) {
                        startState = stateRepository.findById(request.getStateId())
                                        .filter(s -> s.getWorkflowId().equals(project.getWorkflowId()))
                                        .orElseGet(() -> workflowService.getStartState(project.getWorkflowId()));
                } else {
                        startState = workflowService.getStartState(project.getWorkflowId());
                }

                Task task = Task.builder()
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                                .dueDate(request.getDueDate())
                                .assigneeId(request.getAssigneeId())
                                .coverImage(request.getCoverImage())
                                .tags(request.getTags())
                                .storyPoints(request.getStoryPoints())
                                .currentStateId(startState.getId())
                                .projectId(projectId)
                                .organizationId(project.getOrganizationId())
                                .creatorId(userId)
                                .build();
                task = taskRepository.save(task);

                // Record for analytics
                analyticsService.recordTaskCreation(task, userId);

                // Log initial history entry
                taskHistoryService.recordHistory(
                                task.getId(),
                                null,
                                startState.getId(),
                                null,
                                "Initial",
                                userId);

                auditService.log(userId, "TASK_CREATED", "Task", task.getId(),
                                project.getOrganizationId(), "Created task: " + task.getTitle());

                // Notify assignee
                if (task.getAssigneeId() != null) {
                        notificationService.createNotification(
                                        task.getAssigneeId(),
                                        "Task Assigned",
                                        "You have been assigned to task: " + task.getTitle(),
                                        "TASK_ASSIGNED",
                                        task.getId(),
                                        task.getOrganizationId());
                }

                // Publish async event
                eventPublisher.publishEvent(new WorkflowEvent(
                                this,
                                task.getId(),
                                EventType.TASK_CREATED,
                                Map.of(
                                                "taskId", task.getId(),
                                                "projectId", task.getProjectId(),
                                                "priority", task.getPriority().name(),
                                                "title", task.getTitle(),
                                                "assigneeId",
                                                task.getAssigneeId() != null ? task.getAssigneeId().toString() : ""),
                                userId));

                TaskResponse response = toResponse(task);
                notifyProjectUpdate(task.getProjectId(), "TASK_CREATED", response);
                return response;
        }

        @Transactional(readOnly = true)
        public Page<MyTasksResponse> getMyTasks(UUID organizationId, UUID userId, int limit) {
                permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);

                Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "dueDate"));

                return taskRepository.findByAssigneeIdAndOrganizationId(userId, organizationId, pageable)
                                .map(task -> {
                                        WorkflowState currentState = stateRepository.findById(task.getCurrentStateId())
                                                        .orElse(null);
                                        Project project = projectService.getProjectEntity(task.getProjectId());

                                        LocalDate now = LocalDate.now();
                                        boolean isOverdue = task.getDueDate() != null
                                                        && task.getDueDate().isBefore(now);
                                        int daysDue = task.getDueDate() != null
                                                        ? (int) java.time.temporal.ChronoUnit.DAYS.between(now,
                                                                        task.getDueDate())
                                                        : 0;

                                        return MyTasksResponse.builder()
                                                        .id(task.getId().toString())
                                                        .title(task.getTitle())
                                                        .projectName(project.getName())
                                                        .projectId(project.getId().toString())
                                                        .currentState(currentState != null ? currentState.getName()
                                                                        : "Unknown")
                                                        .dueDate(task.getDueDate())
                                                        .isOverdue(isOverdue)
                                                        .daysDue(daysDue)
                                                        .priority(task.getPriority().name())
                                                        .isBlocked(task.isBlocked())
                                                        .build();
                                });
        }

        @Transactional(readOnly = true)
        public List<TaskResponse> listByProject(UUID projectId, UUID userId) {
                Project project = projectService.getProjectEntity(projectId);
                projectPermissionService.checkPermission(userId, projectId,
                                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);

                List<Task> tasks = taskRepository.findByProjectIdAndOrganizationIdOrderByPositionAsc(projectId,
                                project.getOrganizationId());
                if (tasks.isEmpty())
                        return List.of();

                // Pre-load all states for this workflow in one query
                Map<UUID, WorkflowState> stateMap = project.getWorkflowId() != null
                                ? stateRepository.findByWorkflowIdIn(List.of(project.getWorkflowId()))
                                                .stream()
                                                .collect(Collectors.toMap(WorkflowState::getId, s -> s))
                                : Map.of();

                // Pre-load all transitions for all current states in one query
                Set<UUID> currentStateIds = tasks.stream()
                                .map(Task::getCurrentStateId)
                                .collect(Collectors.toSet());
                Map<UUID, List<WorkflowTransition>> transitionsByFromState = transitionRepository
                                .findByFromStateIdIn(currentStateIds)
                                .stream()
                                .collect(Collectors.groupingBy(WorkflowTransition::getFromStateId));

                // Pre-load all assignees and creators in one query
                Set<UUID> userIdsToFetch = tasks.stream()
                                .flatMap(t -> java.util.stream.Stream.of(t.getAssigneeId(), t.getCreatorId()))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());
                Map<UUID, User> userMap = userRepository.findAllById(userIdsToFetch).stream()
                                .collect(Collectors.toMap(User::getId, u -> u));

                return tasks.stream()
                                .map(t -> toResponseWithCache(t, stateMap, transitionsByFromState, userMap))
                                .toList();
        }

        @Transactional(readOnly = true)
        public TaskResponse getById(UUID taskId, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
                projectPermissionService.checkPermission(userId, task.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);
                return toResponse(task);
        }

        @Transactional
        public TaskResponse transition(UUID taskId, UUID transitionId, UUID userId) {
                Task task = transitionService.transition(taskId, transitionId, userId);

                // Publish async event
                eventPublisher.publishEvent(new WorkflowEvent(
                                this,
                                task.getId(),
                                EventType.TASK_TRANSITIONED,
                                Map.of(
                                                "taskId", task.getId(),
                                                "transitionId", transitionId,
                                                "newStateId", task.getCurrentStateId()),
                                userId));

                TaskResponse response = toResponse(task);
                notifyProjectUpdate(task.getProjectId(), "TASK_MOVED", response);
                return response;
        }

        @Transactional
        public TaskResponse update(UUID taskId, UpdateTaskRequest request, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

                // Helper to check edit permission
                final UUID projectId = task.getProjectId();
                Runnable checkEdit = () -> projectPermissionService.checkPermission(userId, projectId,
                                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE);

                // Update metadata only — never state
                UUID oldAssigneeId = task.getAssigneeId();
                if (request.getTitle() != null) {
                        checkEdit.run();
                        task.setTitle(request.getTitle());
                }
                if (request.getDescription() != null) {
                        checkEdit.run();
                        task.setDescription(request.getDescription());
                }
                if (request.getPriority() != null) {
                        checkEdit.run();
                        task.setPriority(request.getPriority());
                }
                if (request.getDueDate() != null) {
                        checkEdit.run();
                        task.setDueDate(request.getDueDate());
                }
                if (request.getAssigneeId() != null && !request.getAssigneeId().equals(oldAssigneeId)) {
                        // Check ASSIGN_ISSUE permission if assignee is changing
                        projectPermissionService.checkPermission(userId, task.getProjectId(),
                                        com.workflow.engine.rbac.entity.ProjectPermission.ASSIGN_ISSUE);
                        task.setAssigneeId(request.getAssigneeId());
                }
                if (request.getPosition() != null) {
                        checkEdit.run();
                        task.setPosition(request.getPosition());
                }
                if (request.getStoryPoints() != null) {
                        checkEdit.run();
                        task.setStoryPoints(request.getStoryPoints());
                }

                task = taskRepository.save(task);

                if (task.getAssigneeId() != null && !task.getAssigneeId().equals(oldAssigneeId)) {
                        notificationService.createNotification(
                                        task.getAssigneeId(),
                                        "Task Assigned",
                                        "You have been assigned to task: " + task.getTitle(),
                                        "TASK_ASSIGNED",
                                        task.getId(),
                                        task.getOrganizationId());
                }

                auditService.log(userId, "TASK_UPDATED", "Task", task.getId(),
                                task.getOrganizationId(), "Updated task metadata");

                // Publish async event to trigger automations
                eventPublisher.publishEvent(new WorkflowEvent(
                                this,
                                task.getId(),
                                EventType.TASK_UPDATED,
                                java.util.Map.of("taskId", task.getId(), "projectId", task.getProjectId()),
                                userId));

                TaskResponse response = toResponse(task);
                notifyProjectUpdate(task.getProjectId(), "TASK_UPDATED", response);
                return response;
        }

        @Transactional
        public void delete(UUID taskId, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
                projectPermissionService.checkPermission(userId, task.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.DELETE_ISSUE);

                UUID projectId = task.getProjectId();
                taskRepository.delete(task);
                notifyProjectUpdate(projectId, "TASK_DELETED", taskId);

                auditService.log(userId, "TASK_DELETED", "Task", taskId,
                                task.getOrganizationId(), "Deleted task: " + task.getTitle());
        }

        @Transactional
        public TaskResponse toggleBlock(UUID taskId, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
                projectPermissionService.checkPermission(userId, task.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE);

                task.setBlocked(!task.isBlocked());
                task = taskRepository.save(task);

                auditService.log(userId, task.isBlocked() ? "TASK_BLOCKED" : "TASK_UNBLOCKED",
                                "Task", task.getId(), task.getOrganizationId(),
                                (task.isBlocked() ? "Blocked" : "Unblocked") + " task: " + task.getTitle());

                return toResponse(task);
        }

        private TaskResponse toResponse(Task task) {
                WorkflowState currentState = stateRepository.findById(task.getCurrentStateId()).orElse(null);
                User assignee = task.getAssigneeId() != null
                                ? userRepository.findById(task.getAssigneeId()).orElse(null)
                                : null;
                User creator = task.getCreatorId() != null
                                ? userRepository.findById(task.getCreatorId()).orElse(null)
                                : null;

                // Get available transitions from current state
                List<WorkflowTransition> transitions = transitionRepository.findByFromStateId(task.getCurrentStateId());
                List<TaskResponse.TransitionOption> transitionOptions = buildTransitionOptions(transitions,
                                id -> stateRepository.findById(id).orElse(null));

                return buildTaskResponse(task, currentState, assignee, creator, transitionOptions);
        }

        /**
         * Cache-aware variant used by listByProject to avoid N+1.
         * All lookups are O(1) map gets — no DB calls.
         */
        private TaskResponse toResponseWithCache(
                        Task task,
                        Map<UUID, WorkflowState> stateMap,
                        Map<UUID, List<WorkflowTransition>> transitionsByFromState,
                        Map<UUID, User> userMap) {

                WorkflowState currentState = stateMap.get(task.getCurrentStateId());
                User assignee = task.getAssigneeId() != null ? userMap.get(task.getAssigneeId()) : null;
                User creator = task.getCreatorId() != null ? userMap.get(task.getCreatorId()) : null;

                List<WorkflowTransition> transitions = transitionsByFromState
                                .getOrDefault(task.getCurrentStateId(), List.of());
                List<TaskResponse.TransitionOption> transitionOptions = buildTransitionOptions(transitions,
                                stateMap::get);

                return buildTaskResponse(task, currentState, assignee, creator, transitionOptions);
        }

        private List<TaskResponse.TransitionOption> buildTransitionOptions(
                        List<WorkflowTransition> transitions,
                        java.util.function.Function<UUID, WorkflowState> stateResolver) {
                return transitions.stream()
                                .map(t -> {
                                        WorkflowState targetState = stateResolver.apply(t.getToStateId());
                                        return TaskResponse.TransitionOption.builder()
                                                        .transitionId(t.getId().toString())
                                                        .transitionName(t.getName())
                                                        .targetStateId(t.getToStateId().toString())
                                                        .targetStateName(
                                                                        targetState != null ? targetState.getName()
                                                                                        : "Unknown")
                                                        .requiresApproval(t.isRequiresApproval())
                                                        .build();
                                })
                                .toList();
        }

        private TaskResponse buildTaskResponse(Task task, WorkflowState currentState, User assignee, User creator,
                        List<TaskResponse.TransitionOption> transitionOptions) {
                return TaskResponse.builder()
                                .id(task.getId().toString())
                                .title(task.getTitle())
                                .description(task.getDescription())
                                .priority(task.getPriority().name())
                                .dueDate(task.getDueDate() != null ? task.getDueDate().toString() : null)
                                .assigneeId(task.getAssigneeId() != null ? task.getAssigneeId().toString() : null)
                                .assigneeName(assignee != null ? assignee.getDisplayName() : null)
                                .creatorId(task.getCreatorId() != null ? task.getCreatorId().toString() : null)
                                .creatorName(creator != null ? creator.getDisplayName() : "System")
                                .resolvedAt(task.getResolvedAt() != null ? task.getResolvedAt().toString() : null)
                                .currentStateId(task.getCurrentStateId().toString())
                                .currentStateName(currentState != null ? currentState.getName() : "Unknown")
                                .projectId(task.getProjectId().toString())
                                .organizationId(task.getOrganizationId().toString())
                                .isBlocked(task.isBlocked())
                                .sprintId(task.getSprintId() != null ? task.getSprintId().toString() : null)
                                .position(task.getPosition())
                                .storyPoints(task.getStoryPoints())
                                .createdAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null)
                                .updatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null)
                                .availableTransitions(transitionOptions)
                                // Elite Fields
                                .coverImage(task.getCoverImage())
                                .tags(task.getTags() != null ? new java.util.ArrayList<>(task.getTags()) : List.of())
                                .subtaskCount(task.getSubtasks() != null ? task.getSubtasks().size() : 0)
                                .completedSubtaskCount(task.getSubtasks() != null
                                                ? (int) task.getSubtasks().stream().filter(Subtask::isCompleted)
                                                                .count()
                                                : 0)
                                .subtasks(task.getSubtasks() != null
                                                ? task.getSubtasks().stream()
                                                                .map(st -> TaskResponse.SubtaskResponse.builder()
                                                                                .id(st.getId().toString())
                                                                                .title(st.getTitle())
                                                                                .completed(st.isCompleted())
                                                                                .build())
                                                                .toList()
                                                : List.of())
                                .commentCount((int) taskCommentService.getCommentCount(task.getId()))
                                .attachmentCount((int) attachmentRepository.countByTaskId(task.getId()))
                                .currentStateType(currentState != null ? currentState.getType().name() : null)
                                .build();
        }

        @Transactional
        public int bulkUpdate(BulkTaskRequest request, UUID userId) {
                List<Task> tasks = taskRepository.findAllById(request.getTaskIds());
                if (tasks.isEmpty())
                        return 0;

                // Check permission once per unique project
                tasks.stream()
                                .map(Task::getProjectId)
                                .distinct()
                                .forEach(pid -> projectPermissionService.checkPermission(
                                                userId, pid,
                                                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE));

                String op = request.getOperation().toUpperCase();
                Map<String, String> payload = request.getPayload() != null ? request.getPayload() : Map.of();

                switch (op) {
                        case "ASSIGN" -> {
                                String assigneeIdStr = payload.get("assigneeId");
                                UUID assigneeId = assigneeIdStr != null && !assigneeIdStr.isBlank()
                                                ? UUID.fromString(assigneeIdStr)
                                                : null;
                                tasks.forEach(t -> t.setAssigneeId(assigneeId));
                                taskRepository.saveAll(tasks);
                        }
                        case "SET_PRIORITY" -> {
                                String priorityStr = payload.get("priority");
                                if (priorityStr == null)
                                        throw new BusinessException("priority is required for SET_PRIORITY");
                                Priority priority = Priority.valueOf(priorityStr.toUpperCase());
                                tasks.forEach(t -> t.setPriority(priority));
                                taskRepository.saveAll(tasks);
                        }
                        case "REORDER" -> {
                                // Payload expected: { taskId1: "0", taskId2: "1", ... }
                                tasks.forEach(t -> {
                                        String posStr = payload.get(t.getId().toString());
                                        if (posStr != null) {
                                                t.setPosition(Integer.parseInt(posStr));
                                        }
                                });
                                taskRepository.saveAll(tasks);
                        }
                        case "DELETE" -> taskRepository.deleteAll(tasks);
                        default -> throw new BusinessException("Unknown bulk operation: " + op);
                }

                auditService.log(userId, "BULK_" + op, "Task", null, null,
                                "Bulk " + op + " on " + tasks.size() + " tasks");
                return tasks.size();
        }

        private void notifyProjectUpdate(UUID projectId, String eventType, Object payload) {
                if (webSocketService != null) {
                        try {
                                webSocketService.notifyProjectUpdate(projectId, eventType, payload);
                        } catch (Exception e) {
                                // Log and ignore to prevent transaction rollback
                                log.warn("Failed to send WebSocket update for project {}: {}", projectId,
                                                e.getMessage());
                        }
                }
        }

        // -------------------------------------------------------------------------
        // Task Dependencies / Links
        // -------------------------------------------------------------------------

        @Transactional
        public TaskLinkResponse createLink(UUID sourceTaskId, CreateTaskLinkRequest request, UUID userId) {
                Task sourceTask = taskRepository.findById(sourceTaskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", sourceTaskId));
                Task targetTask = taskRepository.findById(request.getTargetTaskId())
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id",
                                                request.getTargetTaskId()));

                projectPermissionService.checkPermission(userId, sourceTask.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE);

                if (sourceTaskId.equals(request.getTargetTaskId())) {
                        throw new BusinessException("Cannot link a task to itself");
                }

                if (taskLinkRepository.existsBySourceTaskIdAndTargetTaskIdAndLinkType(sourceTaskId,
                                request.getTargetTaskId(), request.getLinkType())) {
                        throw new BusinessException("Link already exists");
                }

                TaskLink link = TaskLink.builder()
                                .sourceTaskId(sourceTaskId)
                                .targetTaskId(request.getTargetTaskId())
                                .linkType(request.getLinkType())
                                .build();

                link = taskLinkRepository.save(link);

                // Auto-update blocked status
                if (request.getLinkType() == com.workflow.engine.task.entity.TaskLinkType.BLOCKS) {
                        targetTask.setBlocked(true);
                        taskRepository.save(targetTask);
                } else if (request.getLinkType() == com.workflow.engine.task.entity.TaskLinkType.IS_BLOCKED_BY) {
                        sourceTask.setBlocked(true);
                        taskRepository.save(sourceTask);
                }

                return toTaskLinkResponse(link, targetTask);
        }

        @Transactional
        public void deleteLink(UUID sourceTaskId, UUID targetTaskId, UUID userId) {
                Task sourceTask = taskRepository.findById(sourceTaskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", sourceTaskId));

                projectPermissionService.checkPermission(userId, sourceTask.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE);

                taskLinkRepository.deleteBySourceTaskIdAndTargetTaskId(sourceTaskId, targetTaskId);
        }

        @Transactional(readOnly = true)
        public List<TaskLinkResponse> getLinks(UUID taskId, UUID userId) {
                Task sourceTask = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

                projectPermissionService.checkPermission(userId, sourceTask.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);

                List<TaskLink> links = taskLinkRepository.findBySourceTaskId(taskId);

                return links.stream().map(link -> {
                        Task targetTask = taskRepository.findById(link.getTargetTaskId()).orElse(null);
                        return toTaskLinkResponse(link, targetTask);
                }).toList();
        }

        private TaskLinkResponse toTaskLinkResponse(TaskLink link, Task targetTask) {
                WorkflowState state = targetTask != null
                                ? stateRepository.findById(targetTask.getCurrentStateId()).orElse(null)
                                : null;
                return TaskLinkResponse.builder()
                                .id(link.getId().toString())
                                .sourceTaskId(link.getSourceTaskId().toString())
                                .targetTaskId(link.getTargetTaskId().toString())
                                .linkType(link.getLinkType())
                                .targetTaskTitle(targetTask != null ? targetTask.getTitle() : "Unknown Task")
                                .targetTaskState(state != null ? state.getName() : "Unknown State")
                                .build();
        }
}
