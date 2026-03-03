package com.workflow.engine.workflow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateStatePositionRequest {
    @NotNull(message = "State ID is required")
    private UUID stateId;

    @NotNull(message = "Position X is required")
    private Double positionX;

    @NotNull(message = "Position Y is required")
    private Double positionY;
}
