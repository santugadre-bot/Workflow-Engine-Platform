package com.workflow.engine.task.repository;

import com.workflow.engine.task.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
        /** Tenant-isolated queries (SOP Rule 2) */
        @EntityGraph(attributePaths = { "subtasks" })
        List<Task> findByOrganizationId(UUID organizationId);

        @EntityGraph(attributePaths = { "subtasks" })
        List<Task> findByProjectId(UUID projectId);

        @EntityGraph(attributePaths = { "subtasks" })
        List<Task> findByProjectIdAndOrganizationIdOrderByPositionAsc(UUID projectId, UUID organizationId);

        @EntityGraph(attributePaths = { "subtasks" })
        List<Task> findBySprintId(UUID sprintId);

        long countBySprintId(UUID sprintId);

        Optional<Task> findByIdAndOrganizationId(UUID id, UUID organizationId);

        List<Task> findByCurrentStateIdAndOrganizationId(UUID currentStateId, UUID organizationId);

        List<Task> findByDueDateBetween(LocalDate start, LocalDate end);

        List<Task> findByDueDateBefore(LocalDate date);

        long countByOrganizationId(UUID organizationId);

        // Count open tasks - Better logic would exclude states with "done" attribute in
        // the future
        @Query("SELECT COUNT(t) FROM Task t JOIN WorkflowState s ON t.currentStateId = s.id WHERE t.organizationId = :organizationId AND s.type != 'COMPLETED'")
        long countOpenByOrganizationId(UUID organizationId);

        @Query("SELECT t.assigneeId, COUNT(t) FROM Task t JOIN WorkflowState s ON t.currentStateId = s.id WHERE t.organizationId = :organizationId AND t.assigneeId IN :assigneeIds AND s.type != 'DONE' AND s.type != 'COMPLETED' GROUP BY t.assigneeId")
        List<Object[]> countTasksByAssigneeInOrganization(
                        @org.springframework.data.repository.query.Param("organizationId") UUID organizationId,
                        @org.springframework.data.repository.query.Param("assigneeIds") List<UUID> assigneeIds);

        // For My Tasks section - filtered by assignee (current user)
        @EntityGraph(attributePaths = { "subtasks" })
        Page<Task> findByAssigneeIdAndOrganizationId(UUID assigneeId, UUID organizationId, Pageable pageable);

        // For Risk Banner (Overdue tasks) - count tasks where due date is before today
        long countByOrganizationIdAndDueDateBefore(UUID organizationId, LocalDate date);

        // For Due Soon counts - count tasks due in specific range
        long countByOrganizationIdAndDueDateBetween(UUID organizationId, LocalDate start, LocalDate end);

        // For Needs Attention Panel (Blocked tasks)
        long countByOrganizationIdAndIsBlockedTrue(UUID organizationId);

        // For Project Stats
        long countByProjectId(UUID projectId);

        long countByProjectIdAndCurrentStateId(UUID projectId, UUID currentStateId);

        // For finding representative members (limit 3-5 in service)
        @org.springframework.data.jpa.repository.Query("SELECT DISTINCT t.assigneeId FROM Task t WHERE t.projectId = :projectId AND t.assigneeId IS NOT NULL")
        List<UUID> findDistinctAssigneeIdsByProjectId(UUID projectId);

        long countByProjectIdAndDueDateBefore(UUID projectId, LocalDate date);

        /**
         * Batch: count tasks in DONE-type states per project.
         * Returns Object[] rows: [projectId (UUID), count (Long)]
         * Used by ProjectService.listByOrganization to avoid N+1.
         */
        @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
                        "JOIN WorkflowState s ON t.currentStateId = s.id " +
                        "WHERE t.projectId IN :projectIds AND s.type = 'DONE' " +
                        "GROUP BY t.projectId")
        List<Object[]> countCompletedTasksByProjectIds(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds);

        /**
         * Batch: count tasks in IN_PROGRESS-type states per project.
         */
        @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
                        "JOIN WorkflowState s ON t.currentStateId = s.id " +
                        "WHERE t.projectId IN :projectIds AND s.type = 'IN_PROGRESS' " +
                        "GROUP BY t.projectId")
        List<Object[]> countInProgressTasksByProjectIds(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds);

        /**
         * Batch: count overdue tasks per project.
         * Returns Object[] rows: [projectId (UUID), count (Long)]
         */
        @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
                        "WHERE t.projectId IN :projectIds AND t.dueDate < :today " +
                        "GROUP BY t.projectId")
        List<Object[]> countOverdueTasksByProjectIds(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds,
                        @org.springframework.data.repository.query.Param("today") LocalDate today);

        /**
         * Batch: count total tasks per project.
         * Returns Object[] rows: [projectId (UUID), count (Long)]
         */
        @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
                        "WHERE t.projectId IN :projectIds " +
                        "GROUP BY t.projectId")
        List<Object[]> countTasksByProjectIds(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds);

        /**
         * Batch: get distinct assignee IDs for multiple projects (top assignees).
         * Returns Object[] rows: [projectId (UUID), assigneeId (UUID)]
         */
        @Query("SELECT DISTINCT t.projectId, t.assigneeId FROM Task t " +
                        "WHERE t.projectId IN :projectIds AND t.assigneeId IS NOT NULL")
        List<Object[]> findDistinctAssigneeIdsByProjectIds(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds);

        /**
         * Batch: count tasks completed (in a DONE-type state) within a rolling window,
         * grouped by project. Used to compute velocity (tasks/day or tasks/week).
         *
         * Returns Object[] rows: [projectId (UUID), count (Long)]
         *
         * Note: uses t.updatedAt as a proxy for completion time. A dedicated
         * completedAt field would be more precise but requires a schema change.
         */
        @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
                        "JOIN WorkflowState s ON t.currentStateId = s.id " +
                        "WHERE t.projectId IN :projectIds " +
                        "  AND s.type = 'DONE' " +
                        "  AND t.updatedAt >= :since " +
                        "GROUP BY t.projectId")
        List<Object[]> countCompletedTasksByProjectIdsSince(
                        @org.springframework.data.repository.query.Param("projectIds") List<UUID> projectIds,
                        @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

        @Query("SELECT t.id FROM Task t " +
                        "JOIN WorkflowState s ON t.currentStateId = s.id " +
                        "WHERE t.sprintId = :sprintId AND s.type = 'DONE'")
        java.util.Set<UUID> findDoneTaskIdsBySprintId(
                        @org.springframework.data.repository.query.Param("sprintId") UUID sprintId);

        @Query("SELECT t.priority, COUNT(t) FROM Task t WHERE t.projectId = :projectId GROUP BY t.priority")
        List<Object[]> countTasksByPriority(
                        @org.springframework.data.repository.query.Param("projectId") UUID projectId);

        @Query("SELECT t.assigneeId, COUNT(t) FROM Task t WHERE t.projectId = :projectId GROUP BY t.assigneeId")
        List<Object[]> countTasksByAssignee(
                        @org.springframework.data.repository.query.Param("projectId") UUID projectId);

        @Query("SELECT t FROM Task t WHERE t.projectId = :projectId AND t.assigneeId IN :assigneeIds")
        List<Task> findByProjectIdAndAssigneeIdIn(
                        @org.springframework.data.repository.query.Param("projectId") UUID projectId,
                        @org.springframework.data.repository.query.Param("assigneeIds") java.util.Collection<UUID> assigneeIds);

        @Query("SELECT t FROM Task t WHERE t.projectId = :projectId AND t.assigneeId IS NULL")
        List<Task> findByProjectIdAndAssigneeIdIsNull(
                        @org.springframework.data.repository.query.Param("projectId") UUID projectId);
}
