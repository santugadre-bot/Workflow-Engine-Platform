package com.workflow.engine.agile.service;

import com.workflow.engine.agile.entity.Sprint;
import com.workflow.engine.agile.entity.SprintStatus;
import com.workflow.engine.agile.repository.SprintRepository;
import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.rbac.entity.ProjectPermission;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final ProjectPermissionService permissionService;

    @Transactional
    public Sprint createSprint(UUID projectId, String name, String goal, LocalDate startDate, LocalDate endDate,
            UUID userId) {
        permissionService.checkPermission(userId, projectId, ProjectPermission.CREATE_SPRINT);

        Sprint sprint = Sprint.builder()
                .projectId(projectId)
                .name(name)
                .goal(goal)
                .startDate(startDate)
                .endDate(endDate)
                .status(SprintStatus.FUTURE)
                .build();
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint startSprint(UUID sprintId, String name, String goal, LocalDate startDate, LocalDate endDate,
            UUID userId) {
        Sprint sprint = getSprint(sprintId);
        permissionService.checkPermission(userId, sprint.getProjectId(), ProjectPermission.START_SPRINT);

        if (sprint.getStatus() != SprintStatus.FUTURE) {
            throw new BusinessException("Only FUTURE sprints can be started.");
        }

        // Check if there is already an ACTIVE sprint in the project
        // (Simplified rule: 1 active sprint per project for now)
        boolean hasActive = sprintRepository.findFirstByProjectIdAndStatus(sprint.getProjectId(), SprintStatus.ACTIVE)
                .isPresent();
        if (hasActive) {
            throw new BusinessException("There is already an active sprint in this project. Complete it first.");
        }

        sprint.setStatus(SprintStatus.ACTIVE);
        sprint.setStartedAt(java.time.LocalDateTime.now());
        if (name != null && !name.trim().isEmpty())
            sprint.setName(name);
        if (goal != null)
            sprint.setGoal(goal);
        if (startDate != null)
            sprint.setStartDate(startDate);
        if (endDate != null)
            sprint.setEndDate(endDate);

        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint completeSprint(UUID sprintId, UUID userId) {
        Sprint sprint = getSprint(sprintId);
        permissionService.checkPermission(userId, sprint.getProjectId(), ProjectPermission.CLOSE_SPRINT);

        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new BusinessException("Only ACTIVE sprints can be completed.");
        }

        sprint.setStatus(SprintStatus.CLOSED);
        sprint.setCompletedAt(java.time.LocalDateTime.now());

        // Handle incomplete tasks?
        // For Phase 1, we just close the sprint. Tasks remain assigned to it
        // effectively "completed" in history
        // or we should move incomplete validation to a higher level facade or next
        // iteration.
        // Usually, incomplete tasks are moved to backlog or next sprint.
        // I'll leave them for now, but in a real app we'd ask what to do.

        return sprintRepository.save(sprint);
    }

    @Transactional
    public void addTaskToSprint(UUID sprintId, UUID taskId, UUID userId) {
        Sprint sprint = getSprint(sprintId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        if (!task.getProjectId().equals(sprint.getProjectId())) {
            throw new BusinessException("Task and Sprint must belong to the same project.");
        }

        permissionService.checkPermission(userId, sprint.getProjectId(), ProjectPermission.MOVE_ISSUE_TO_SPRINT);

        task.setSprintId(sprintId);
        taskRepository.save(task);
    }

    @Transactional
    public void removeTaskFromSprint(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        if (task.getSprintId() == null)
            return;

        permissionService.checkPermission(userId, task.getProjectId(), ProjectPermission.MOVE_ISSUE_TO_SPRINT);

        task.setSprintId(null); // Move to Backlog
        taskRepository.save(task);
    }

    public List<Sprint> getSprintsByProject(UUID projectId, UUID userId) {
        permissionService.checkPermission(userId, projectId, ProjectPermission.BROWSE_PROJECT);
        return sprintRepository.findByProjectId(projectId);
    }

    public Sprint getSprint(UUID sprintId) {
        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));
    }

    public com.workflow.engine.agile.dto.SprintResponse toResponse(Sprint sprint) {
        long taskCount = taskRepository.countBySprintId(sprint.getId());
        long completedCount = taskRepository.findDoneTaskIdsBySprintId(sprint.getId()).size();

        return com.workflow.engine.agile.dto.SprintResponse.builder()
                .id(sprint.getId().toString())
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .startedAt(sprint.getStartedAt())
                .completedAt(sprint.getCompletedAt())
                .status(sprint.getStatus())
                .projectId(sprint.getProjectId().toString())
                .taskCount(taskCount)
                .completedTaskCount(completedCount)
                .build();
    }

    /**
     * Compute a burndown chart for a sprint.
     * Uses a JPQL query to find tasks in DONE-type states (same pattern as
     * velocity).
     * Since we don't store per-day completion history, actual remaining is computed
     * for each past day using updatedAt as a proxy for when a task was completed.
     */
    public com.workflow.engine.agile.dto.BurndownResponse getBurndown(UUID sprintId, UUID userId) {
        Sprint sprint = getSprint(sprintId);
        permissionService.checkPermission(userId, sprint.getProjectId(), ProjectPermission.BROWSE_PROJECT);

        List<Task> tasks = taskRepository.findBySprintId(sprintId);
        int totalPoints = tasks.stream()
                .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 1)
                .sum();

        LocalDate start = sprint.getStartDate() != null ? sprint.getStartDate() : LocalDate.now();
        LocalDate end = sprint.getEndDate() != null ? sprint.getEndDate() : start.plusWeeks(2);
        LocalDate today = LocalDate.now();
        LocalDate chartEnd = today.isBefore(end) ? today : end;

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        if (totalDays <= 0)
            totalDays = 1;

        // Get IDs of tasks currently in a DONE-type state
        java.util.Set<UUID> doneTaskIds = taskRepository.findDoneTaskIdsBySprintId(sprintId);

        java.util.List<com.workflow.engine.agile.dto.BurndownResponse.DayPoint> series = new java.util.ArrayList<>();
        LocalDate cursor = start;
        int dayIndex = 0;

        while (!cursor.isAfter(end)) {
            int ideal = (int) Math.round(totalPoints * (1.0 - (double) dayIndex / totalDays));
            Integer actual = null;

            if (!cursor.isAfter(chartEnd)) {
                final java.time.LocalDateTime endOfDay = cursor.atTime(23, 59, 59);
                // A task counts as "done by this day" if it's in a DONE state AND
                // its updatedAt is on or before end-of-day (proxy for completion time)
                int completedPoints = tasks.stream()
                        .filter(t -> doneTaskIds.contains(t.getId()))
                        .filter(t -> t.getUpdatedAt() != null && !t.getUpdatedAt().isAfter(endOfDay))
                        .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 1)
                        .sum();
                actual = totalPoints - completedPoints;
            }

            series.add(com.workflow.engine.agile.dto.BurndownResponse.DayPoint.builder()
                    .date(cursor.toString())
                    .ideal(ideal)
                    .actual(actual)
                    .build());

            cursor = cursor.plusDays(1);
            dayIndex++;
        }

        return com.workflow.engine.agile.dto.BurndownResponse.builder()
                .sprintId(sprintId.toString())
                .sprintName(sprint.getName())
                .startDate(start)
                .endDate(end)
                .totalPoints(totalPoints)
                .series(series)
                .build();
    }
}
