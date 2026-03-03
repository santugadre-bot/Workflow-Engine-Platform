package com.workflow.engine.workflow.repository;

import com.workflow.engine.workflow.entity.WorkflowState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStateRepository extends JpaRepository<WorkflowState, UUID> {
    List<WorkflowState> findByWorkflowIdOrderByPositionAsc(UUID workflowId);

    List<WorkflowState> findByWorkflowId(UUID workflowId);

    int countByWorkflowId(UUID workflowId);

    List<WorkflowState> findByWorkflowIdAndType(UUID workflowId, com.workflow.engine.workflow.entity.StateType type);

    /** Batch-load all states for multiple workflows in one query */
    @org.springframework.data.jpa.repository.Query("SELECT s FROM WorkflowState s WHERE s.workflowId IN :workflowIds")
    List<WorkflowState> findByWorkflowIdIn(
            @org.springframework.data.repository.query.Param("workflowIds") java.util.Collection<UUID> workflowIds);
}
