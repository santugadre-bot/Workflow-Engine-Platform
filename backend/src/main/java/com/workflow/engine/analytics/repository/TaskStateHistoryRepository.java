package com.workflow.engine.analytics.repository;

import com.workflow.engine.analytics.entity.TaskStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskStateHistoryRepository extends JpaRepository<TaskStateHistory, UUID> {

    Optional<TaskStateHistory> findFirstByTaskIdAndExitedAtIsNullOrderByEnteredAtDesc(UUID taskId);

    List<TaskStateHistory> findByTaskIdOrderByEnteredAtAsc(UUID taskId);

    List<TaskStateHistory> findByOrganizationIdAndEnteredAtAfter(UUID organizationId, LocalDateTime since);

    List<TaskStateHistory> findByProjectIdAndEnteredAtAfter(UUID projectId, LocalDateTime since);

    // Find active history records (current state) that started before a certain
    // time
    List<TaskStateHistory> findByStateIdAndExitedAtIsNullAndEnteredAtBefore(UUID stateId, LocalDateTime threshold);
}
