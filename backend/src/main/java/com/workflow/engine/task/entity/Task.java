package com.workflow.engine.task.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Task entity. The current_state_id is NEVER directly mutated.
 * Only TaskTransitionService may change it (SOP Rule 1).
 */
@Entity
@Table(name = "tasks", indexes = {
        @Index(name = "idx_task_project", columnList = "project_id"),
        @Index(name = "idx_task_organization", columnList = "organization_id"),
        @Index(name = "idx_task_state", columnList = "current_state_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    private LocalDate dueDate;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    /**
     * CRITICAL: This field is managed EXCLUSIVELY by TaskTransitionService.
     * Never set this directly from controllers, other services, or repositories.
     */
    @Column(name = "current_state_id", nullable = false)
    private UUID currentStateId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "is_blocked", nullable = false)
    @Builder.Default
    private boolean isBlocked = false;

    @Column(name = "creator_id")
    private UUID creatorId;

    @Column(name = "resolved_at")
    private java.time.LocalDateTime resolvedAt;

    @Column(name = "sprint_id")
    private UUID sprintId;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "position")
    private Integer position;

    @Column(name = "story_points")
    private Integer storyPoints;

    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag")
    @org.hibernate.annotations.BatchSize(size = 20)
    private java.util.List<String> tags;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 20)
    private java.util.List<Subtask> subtasks;
}
