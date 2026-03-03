package com.workflow.engine.task.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Records every state transition for audit and traceability.
 * Created exclusively by TaskTransitionService.
 */
@Entity
@Table(name = "task_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskHistory extends BaseEntity {

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "from_state_id")
    private UUID fromStateId;

    @Column(name = "to_state_id", nullable = false)
    private UUID toStateId;

    @Column(name = "transition_id")
    private UUID transitionId;

    @Column(name = "transition_name")
    private String transitionName;

    @Column(name = "performed_by", nullable = false)
    private UUID performedBy;

    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public UUID getFromStateId() {
        return fromStateId;
    }

    public void setFromStateId(UUID fromStateId) {
        this.fromStateId = fromStateId;
    }

    public UUID getToStateId() {
        return toStateId;
    }

    public void setToStateId(UUID toStateId) {
        this.toStateId = toStateId;
    }

    public UUID getTransitionId() {
        return transitionId;
    }

    public void setTransitionId(UUID transitionId) {
        this.transitionId = transitionId;
    }

    public String getTransitionName() {
        return transitionName;
    }

    public void setTransitionName(String transitionName) {
        this.transitionName = transitionName;
    }

    public UUID getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(UUID performedBy) {
        this.performedBy = performedBy;
    }
}
