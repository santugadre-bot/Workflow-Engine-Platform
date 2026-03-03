package com.workflow.engine.task.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "task_links", indexes = {
        @Index(name = "idx_task_link_source", columnList = "source_task_id"),
        @Index(name = "idx_task_link_target", columnList = "target_task_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskLink extends BaseEntity {

    @Column(name = "source_task_id", nullable = false)
    private UUID sourceTaskId;

    @Column(name = "target_task_id", nullable = false)
    private UUID targetTaskId;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false)
    private TaskLinkType linkType;
}
