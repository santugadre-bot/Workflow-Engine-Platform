package com.workflow.engine.agile.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class BurndownResponse {

    private String sprintId;
    private String sprintName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalPoints;

    /** One entry per calendar day from startDate to today (or endDate). */
    private List<DayPoint> series;

    @Data
    @Builder
    public static class DayPoint {
        private String date; // ISO date string
        private int ideal; // ideal remaining (linear burn)
        private Integer actual; // null if day is in the future
    }
}
