package com.workflow.engine.task.service;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.dto.TaskHistoryResponse;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskHistoryRepository;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.workflow.engine.task.entity.TaskHistory;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskHistoryService {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository historyRepository;
    private final ProjectPermissionService projectPermissionService;
    private final WorkflowStateRepository stateRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordHistory(UUID taskId, UUID fromStateId, UUID toStateId, UUID transitionId, String transitionName,
            UUID userId) {
        TaskHistory history = TaskHistory.builder()
                .taskId(taskId)
                .fromStateId(fromStateId)
                .toStateId(toStateId)
                .transitionId(transitionId)
                .transitionName(transitionName)
                .performedBy(userId)
                .build();
        historyRepository.save(history);
    }

    public List<TaskHistoryResponse> getHistory(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        projectPermissionService.checkPermission(userId, task.getProjectId(),
                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);

        return historyRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(h -> {
                    WorkflowState fromState = h.getFromStateId() != null
                            ? stateRepository.findById(h.getFromStateId()).orElse(null)
                            : null;
                    WorkflowState toState = stateRepository.findById(h.getToStateId()).orElse(null);
                    WorkflowTransition transition = h.getTransitionId() != null
                            ? transitionRepository.findById(h.getTransitionId())
                                    .orElse(null)
                            : null;
                    User performer = userRepository.findById(h.getPerformedBy()).orElse(null);

                    return TaskHistoryResponse.builder()
                            .id(h.getId().toString())
                            .fromStateName(fromState != null ? fromState.getName() : null)
                            .toStateName(toState != null ? toState.getName() : "Unknown")
                            .transitionName(transition != null ? transition.getName()
                                    : "Initial")
                            .performedByName(performer != null ? performer.getDisplayName()
                                    : "Unknown")
                            .timestamp(h.getCreatedAt() != null
                                    ? h.getCreatedAt().toString()
                                    : null)
                            .build();
                })
                .toList();
    }
}
