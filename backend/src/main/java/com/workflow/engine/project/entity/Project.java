package com.workflow.engine.project.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "workflow_id")
    private UUID workflowId;

    @Builder.Default
    @Column(name = "show_due_date")
    private boolean showDueDate = true;

    @Builder.Default
    @Column(name = "show_story_points")
    private boolean showStoryPoints = true;

    @Builder.Default
    @Column(name = "archived")
    private boolean archived = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "explicit_status", nullable = false)
    @Builder.Default
    private ProjectStatus explicitStatus = ProjectStatus.ACTIVE;
}
