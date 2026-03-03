package com.workflow.engine.workflow.repository;

import com.workflow.engine.workflow.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing {@link Workflow} entities.
 */
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {

    /**
     * Finds all workflows belonging to a specific organization.
     */
    List<Workflow> findByOrganizationId(UUID organizationId);

    /**
     * Finds a workflow by ID and Organization (security check).
     */
    Optional<Workflow> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    // Count active workflows (where active = true)
    long countByOrganizationIdAndActiveTrue(UUID organizationId);

    // Convenience method for counting active workflows
    default long countActiveByOrganizationId(UUID organizationId) {
        return countByOrganizationIdAndActiveTrue(organizationId);
    }
}
