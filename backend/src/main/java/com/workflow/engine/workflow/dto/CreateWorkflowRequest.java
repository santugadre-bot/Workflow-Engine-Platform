package com.workflow.engine.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateWorkflowRequest {
    @NotBlank(message = "Workflow name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 500)
    private String description;
}
