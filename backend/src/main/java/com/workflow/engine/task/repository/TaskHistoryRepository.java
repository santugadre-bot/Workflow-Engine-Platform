package com.workflow.engine.task.repository;

import com.workflow.engine.task.entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {
    List<TaskHistory> findByTaskIdOrderByCreatedAtDesc(UUID taskId);
}
