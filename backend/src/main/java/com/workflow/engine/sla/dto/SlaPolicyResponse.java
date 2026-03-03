package com.workflow.engine.sla.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaPolicyResponse {
    private UUID id;
    private UUID projectId;
    private UUID organizationId;
    private String name;
    private String description;
    private UUID stateId;
    private String stateName; // Enriched
    private String priority;
    private Integer durationHours;
    private String actionType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
