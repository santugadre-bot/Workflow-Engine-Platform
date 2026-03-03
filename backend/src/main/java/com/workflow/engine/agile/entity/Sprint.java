package com.workflow.engine.agile.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sprints", indexes = {
        @Index(name = "idx_sprint_project", columnList = "project_id"),
        @Index(name = "idx_sprint_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sprint extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String goal;

    @Column(name = "start_date")
    private LocalDate startDate; // Planned start date

    @Column(name = "end_date")
    private LocalDate endDate; // Planned end date

    @Column(name = "started_at")
    private LocalDateTime startedAt; // Actual start date

    @Column(name = "completed_at")
    private LocalDateTime completedAt; // Actual completion date

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SprintStatus status = SprintStatus.FUTURE;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;
}
