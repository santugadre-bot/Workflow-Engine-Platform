package com.workflow.engine.sla.service;

import com.workflow.engine.analytics.entity.TaskStateHistory;
import com.workflow.engine.analytics.repository.TaskStateHistoryRepository;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.sla.entity.SlaPolicy;
import com.workflow.engine.sla.repository.SlaPolicyRepository;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SlaMonitorService {

    private static final Logger log = LoggerFactory.getLogger(SlaMonitorService.class);

    private final SlaPolicyRepository slaPolicyRepository;
    private final TaskStateHistoryRepository historyRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkSlaBreaches() {
        log.info("Starting SLA compliance check...");
        List<SlaPolicy> policies = slaPolicyRepository.findAll();

        for (SlaPolicy policy : policies) {
            checkPolicy(policy);
        }
        log.info("SLA compliance check completed.");
    }

    private void checkPolicy(SlaPolicy policy) {
        if (policy.getStateId() == null) {
            // "Any State" policies not supported in this basic iteration for simplicity
            // or we could iterate all states. Skipping for now to focus on specific state
            // limits.
            return;
        }

        LocalDateTime threshold = LocalDateTime.now().minusHours(policy.getDurationHours());

        // Find tasks in this state that entered before the threshold and haven't left
        List<TaskStateHistory> breaches = historyRepository
                .findByStateIdAndExitedAtIsNullAndEnteredAtBefore(policy.getStateId(), threshold);

        for (TaskStateHistory history : breaches) {
            handleBreach(policy, history);
        }
    }

    private void handleBreach(SlaPolicy policy, TaskStateHistory history) {
        Task task = taskRepository.findById(history.getTaskId()).orElse(null);
        if (task == null)
            return;

        // Optional: Check priority filter if set
        if (policy.getPriority() != null && !policy.getPriority().equalsIgnoreCase(task.getPriority().name())) {
            return;
        }

        log.info("SLA Breach detected for Task {} in Policy {}", task.getTitle(), policy.getName());

        // Execute Action
        switch (policy.getActionType()) {
            case "NOTIFY_ASSIGNEE":
                if (task.getAssigneeId() != null) {
                    sendNotification(task.getAssigneeId(), task, policy);
                }
                break;
            case "NOTIFY_MANAGER":
                // Future: Notify project manager or owner
                // For now, notify assignee as fallback
                if (task.getAssigneeId() != null) {
                    sendNotification(task.getAssigneeId(), task, policy);
                }
                break;
            case "ESCALATE_PRIORITY":
                if (task.getPriority() != Priority.HIGH && task.getPriority() != Priority.URGENT) {
                    task.setPriority(Priority.HIGH);
                    taskRepository.save(task);
                    log.info("Escalated task priority to HIGH");
                }
                break;
        }
    }

    private void sendNotification(UUID userId, Task task, SlaPolicy policy) {
        notificationService.createNotification(
                userId,
                "SLA Breach: " + task.getTitle(),
                String.format("Task has exceeded the %d hour limit for policy '%s'.", policy.getDurationHours(),
                        policy.getName()),
                "SLA_BREACH",
                task.getId(),
                task.getOrganizationId());
    }
}
