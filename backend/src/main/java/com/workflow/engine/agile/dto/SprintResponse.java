package com.workflow.engine.agile.dto;

import com.workflow.engine.agile.entity.SprintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintResponse {
    private String id;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String projectId;
    private long taskCount;
    private long completedTaskCount;
    private SprintStatus status;
}
