package com.workflow.engine.workflow.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a Transition (Edge) between two Workflow States.
 * <p>
 * Transitions define the allowed movements for a task. They connect a source
 * state
 * (from)
 * to a target state (to). Transitions can currently optionally require
 * approval.
 * </p>
 */
@Entity
@Table(name = "workflow_transitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTransition extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "from_state_id", nullable = false)
    private UUID fromStateId;

    @Column(name = "to_state_id", nullable = false)
    private UUID toStateId;

    /**
     * If true, moving a task through this transition creates an approval request.
     * The transition will not complete until approved by an authorized user.
     */
    @Builder.Default
    private boolean requiresApproval = false;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public boolean isRequiresApproval() {
        return requiresApproval;
    }

    public void setRequiresApproval(boolean requiresApproval) {
        this.requiresApproval = requiresApproval;
    }

    public UUID getWorkflowId() {
        return workflowId;
    }

    public void setWorkflowId(UUID workflowId) {
        this.workflowId = workflowId;
    }

}
