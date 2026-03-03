package com.workflow.engine.task.dto;

import com.workflow.engine.task.entity.Priority;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private Priority priority;
    private LocalDate dueDate;
    private java.time.LocalDateTime startDate;
    private java.time.LocalDateTime endDate;
    private UUID assigneeId;
    private Integer position;
    private Integer storyPoints;
}
