package com.workflow.engine.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyTasksResponse {
    private String id;
    private String title;
    private String projectName;
    private String currentState;
    private LocalDate dueDate;
    private boolean isOverdue;
    private Integer daysDue; // negative if overdue
    private String priority;

    // Navigation & Status fields
    private String projectId;
    private boolean isBlocked;
}
