package com.workflow.engine.task.repository;

import com.workflow.engine.task.entity.TaskLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskLinkRepository extends JpaRepository<TaskLink, UUID> {
    List<TaskLink> findBySourceTaskId(UUID sourceTaskId);

    List<TaskLink> findByTargetTaskId(UUID targetTaskId);

    boolean existsBySourceTaskIdAndTargetTaskIdAndLinkType(UUID sourceTaskId, UUID targetTaskId,
            com.workflow.engine.task.entity.TaskLinkType linkType);

    void deleteBySourceTaskIdAndTargetTaskId(UUID sourceTaskId, UUID targetTaskId);
}
