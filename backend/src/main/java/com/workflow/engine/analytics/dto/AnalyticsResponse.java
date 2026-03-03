package com.workflow.engine.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private List<CycleTimeMetric> cycleTimeByState;
    private List<ThroughputMetric> throughput;
    private List<StateDistribution> stateDistribution;
    private MetricsSummary summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CycleTimeMetric {
        private String stateName;
        private Double averageDurationHours;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThroughputMetric {
        private LocalDate date;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StateDistribution {
        private String stateName;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricsSummary {
        private Double avgTotalCycleTimeHours;
        private Long totalCompletedTasks;
        private Double efficiencyScore; // Placeholder for future logic
    }
}
