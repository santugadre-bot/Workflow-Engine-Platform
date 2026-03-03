package com.workflow.engine.workflow.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a State (Node) in a Workflow graph.
 * <p>
 * States represent the different stages a task can be in (e.g., To Do, In
 * Progress, Done).
 * Each state has a {@link StateType} which dictates its behavior and minimal
 * validation rules.
 * </p>
 */
@Entity
@Table(name = "workflow_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowState extends BaseEntity {

    @Column(nullable = false)
    private String name;

    /**
     * Functional type of the state (START, IN_PROGRESS, DONE, END).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StateType type;

    /**
     * Order of the state in a linear list view (Kanban column order).
     */
    @Column(nullable = false)
    private int position;

    /**
     * X coordinate for rendering in the Workflow Builder canvas.
     */
    @Column(name = "position_x", nullable = false)
    @Builder.Default
    private Double positionX = 0.0;

    /**
     * Y coordinate for rendering in the Workflow Builder canvas.
     */
    @Column(name = "position_y", nullable = false)
    @Builder.Default
    private Double positionY = 0.0;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    /**
     * Optional WIP (Work In Progress) limit for this state.
     * Null means no limit.
     */
    @Column(name = "wip_limit")
    private Integer wipLimit;
}
