package com.workflow.engine.workflow.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a Workflow definition.
 * <p>
 * A workflow defines a process flow using a set of {@link WorkflowState}s and
 * {@link WorkflowTransition}s.
 * Workflows must be validated and activated before they can be assigned to
 * projects.
 * </p>
 */
@Entity
@Table(name = "workflows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workflow extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    /**
     * If true, the workflow is immutable and can be used by projects.
     * If false, it is a draft and can be edited but not assigned.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = false;
}
