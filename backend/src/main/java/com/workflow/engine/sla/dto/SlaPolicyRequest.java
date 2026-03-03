package com.workflow.engine.sla.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaPolicyRequest {
    @NotNull
    private UUID projectId;

    @NotNull
    private UUID organizationId;

    @NotBlank
    private String name;

    private String description;

    private UUID stateId; // Can be null for "Any State" effectively

    private String priority;

    @NotNull
    @Min(1)
    private Integer durationHours;

    @NotBlank
    private String actionType;
}
