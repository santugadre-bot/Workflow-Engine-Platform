package com.workflow.engine.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddTransitionRequest {
    @NotBlank(message = "Transition name is required")
    private String name;

    @NotNull(message = "From state ID is required")
    private UUID fromStateId;

    @NotNull(message = "To state ID is required")
    private UUID toStateId;

    private boolean requiresApproval;
}
