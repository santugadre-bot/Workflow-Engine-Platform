package com.workflow.engine.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    private java.util.UUID workflowId;

    private Boolean showDueDate;
    private Boolean showStoryPoints;

    private com.workflow.engine.project.entity.ProjectStatus explicitStatus;
}
