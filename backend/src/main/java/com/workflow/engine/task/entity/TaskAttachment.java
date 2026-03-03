package com.workflow.engine.task.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "task_attachments", indexes = {
        @Index(name = "idx_attachment_task", columnList = "task_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskAttachment extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "uploaded_by_id", nullable = false)
    private UUID uploadedById;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileUrl; // relative path under uploads dir

    @Column
    private String mimeType;

    @Column
    private Long fileSizeBytes;
}
