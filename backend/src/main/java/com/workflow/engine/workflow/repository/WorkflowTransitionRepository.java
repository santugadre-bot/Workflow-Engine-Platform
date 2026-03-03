package com.workflow.engine.workflow.repository;

import com.workflow.engine.workflow.entity.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {
    List<WorkflowTransition> findByWorkflowId(UUID workflowId);

    List<WorkflowTransition> findByFromStateId(UUID fromStateId);

    Optional<WorkflowTransition> findByIdAndWorkflowId(UUID id, UUID workflowId);

    void deleteByFromStateId(UUID fromStateId);

    void deleteByToStateId(UUID toStateId);

    /** Batch-load all transitions for multiple from-states in one query */
    @org.springframework.data.jpa.repository.Query("SELECT t FROM WorkflowTransition t WHERE t.fromStateId IN :fromStateIds")
    List<WorkflowTransition> findByFromStateIdIn(
            @org.springframework.data.repository.query.Param("fromStateIds") java.util.Collection<UUID> fromStateIds);
}
