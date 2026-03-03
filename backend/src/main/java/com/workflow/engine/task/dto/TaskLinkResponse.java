package com.workflow.engine.task.dto;

import com.workflow.engine.task.entity.TaskLinkType;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TaskLinkResponse {
    private String id;
    private String sourceTaskId;
    private String targetTaskId;
    // We can include some basic details of the target/source task to show in the UI
    private String targetTaskTitle;
    private String targetTaskState;
    private TaskLinkType linkType;
}
