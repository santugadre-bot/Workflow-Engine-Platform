package com.workflow.engine.task.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request body for POST /api/tasks/bulk.
 *
 * Supported operations:
 * ASSIGN — payload: { "assigneeId": "<uuid>" }
 * SET_PRIORITY — payload: { "priority": "HIGH|MEDIUM|LOW|CRITICAL" }
 * DELETE — payload: {} (empty)
 */
@Data
public class BulkTaskRequest {

    @NotEmpty(message = "taskIds must not be empty")
    private List<UUID> taskIds;

    @NotBlank(message = "operation must not be blank")
    private String operation; // ASSIGN | SET_PRIORITY | DELETE

    private Map<String, String> payload;
}
