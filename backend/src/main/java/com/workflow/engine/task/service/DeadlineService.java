package com.workflow.engine.task.service;

import com.workflow.engine.common.event.EventType;
import com.workflow.engine.common.event.WorkflowEvent;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service to monitor task deadlines and trigger automation events.
 */
@Service
@RequiredArgsConstructor
public class DeadlineService {

    private static final Logger log = LoggerFactory.getLogger(DeadlineService.class);

    private final TaskRepository taskRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Runs every hour to check for upcoming and overdue tasks.
     * Trigger names: DUE_SOON (24h before), OVERDUE (at due date).
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkDeadlines() {
        log.info("Starting periodic deadline check...");
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        // 1. Check for tasks due tomorrow (reminders)
        List<Task> dueSoonTasks = taskRepository.findByDueDateBetween(tomorrow, tomorrow);
        for (Task task : dueSoonTasks) {
            eventPublisher.publishEvent(new WorkflowEvent(
                    this,
                    task.getId(),
                    EventType.TASK_DUE_SOON,
                    Map.of("taskId", task.getId(), "projectId", task.getProjectId()),
                    null // System triggered
            ));
        }

        // 2. Check for tasks overdue today
        List<Task> overdueTasks = taskRepository.findByDueDateBefore(today);
        for (Task task : overdueTasks) {
            eventPublisher.publishEvent(new WorkflowEvent(
                    this,
                    task.getId(),
                    EventType.TASK_OVERDUE,
                    Map.of("taskId", task.getId(), "projectId", task.getProjectId()),
                    null // System triggered
            ));
        }

        log.info("Deadline check completed. Processed {} due soon and {} overdue tasks.",
                dueSoonTasks.size(), overdueTasks.size());
    }
}
