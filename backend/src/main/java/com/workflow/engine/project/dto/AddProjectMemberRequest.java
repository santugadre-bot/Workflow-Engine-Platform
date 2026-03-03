package com.workflow.engine.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.workflow.engine.rbac.entity.ProjectRole;
import lombok.Data;

@Data
public class AddProjectMemberRequest {
    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @NotNull(message = "Role is required")
    private ProjectRole role;
}
