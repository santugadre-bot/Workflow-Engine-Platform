package com.workflow.engine.task.dto;

import com.workflow.engine.task.entity.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {
    @NotBlank(message = "Task title is required")
    @Size(min = 1, max = 200)
    private String title;

    private String description;
    private Priority priority;
    private LocalDate dueDate;
    private java.time.LocalDateTime startDate;
    private java.time.LocalDateTime endDate;
    private UUID assigneeId;

    // Issue #1 fix: allow caller to specify target column; if null, defaults to
    // START state
    private UUID stateId;

    // Elite UI Fields
    private String coverImage;
    private java.util.List<String> tags;
    private Integer storyPoints;
}
