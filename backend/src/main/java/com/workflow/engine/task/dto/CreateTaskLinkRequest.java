package com.workflow.engine.task.dto;

import com.workflow.engine.task.entity.TaskLinkType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateTaskLinkRequest {
    @NotNull
    private UUID targetTaskId;

    @NotNull
    private TaskLinkType linkType;
}
