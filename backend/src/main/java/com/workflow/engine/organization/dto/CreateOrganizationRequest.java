package com.workflow.engine.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateOrganizationRequest {
    @NotBlank(message = "Organization name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 500)
    private String description;
}
