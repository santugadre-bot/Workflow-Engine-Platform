package com.workflow.engine.workflow.dto;

import com.workflow.engine.workflow.entity.StateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStateRequest {
    @NotBlank(message = "State name is required")
    private String name;

    @NotNull(message = "State type is required")
    private StateType type;
}
