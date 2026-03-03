package com.workflow.engine.organization.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.workflow.engine.rbac.entity.OrganizationRole;
import lombok.Data;

@Data
public class AddMemberRequest {
    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @NotNull(message = "Role is required")
    private OrganizationRole role;
}
