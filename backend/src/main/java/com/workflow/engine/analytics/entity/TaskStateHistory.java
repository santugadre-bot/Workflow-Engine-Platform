package com.workflow.engine.analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "task_state_history", indexes = {
        @Index(name = "idx_history_task", columnList = "task_id"),
        @Index(name = "idx_history_project", columnList = "project_id"),
        @Index(name = "idx_history_organization", columnList = "organization_id"),
        @Index(name = "idx_history_state", columnList = "state_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStateHistory {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "state_id", nullable = false)
    private UUID stateId;

    @Column(name = "changed_by_id")
    private UUID changedById;

    @Column(name = "entered_at", nullable = false)
    private LocalDateTime enteredAt;

    @Column(name = "exited_at")
    private LocalDateTime exitedAt;

    /**
     * Duration in seconds.
     */
    private Long duration;

}
