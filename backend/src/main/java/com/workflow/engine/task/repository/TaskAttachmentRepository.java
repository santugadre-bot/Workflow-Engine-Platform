package com.workflow.engine.task.repository;

import com.workflow.engine.task.entity.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, UUID> {
    List<TaskAttachment> findByTaskIdOrderByCreatedAtDesc(UUID taskId);

    long countByTaskId(UUID taskId);
}
