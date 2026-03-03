package com.workflow.engine.analytics.service;

import com.workflow.engine.analytics.dto.AnalyticsResponse;
import com.workflow.engine.analytics.entity.TaskStateHistory;
import com.workflow.engine.analytics.repository.TaskStateHistoryRepository;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

        private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

        private final TaskStateHistoryRepository historyRepository;
        private final WorkflowStateRepository stateRepository;

        @Transactional
        public void recordTaskCreation(Task task, UUID userId) {
                TaskStateHistory history = TaskStateHistory.builder()
                                .taskId(task.getId())
                                .projectId(task.getProjectId())
                                .organizationId(task.getOrganizationId())
                                .stateId(task.getCurrentStateId())
                                .enteredAt(LocalDateTime.now())
                                .changedById(userId)
                                .build();
                historyRepository.save(history);
        }

        @Transactional
        public void recordStateChange(Task task, UUID fromStateId, UUID toStateId, UUID userId) {
                LocalDateTime now = LocalDateTime.now();

                // 1. Close current state record
                historyRepository.findFirstByTaskIdAndExitedAtIsNullOrderByEnteredAtDesc(task.getId())
                                .ifPresent(history -> {
                                        history.setExitedAt(now);
                                        long seconds = Duration.between(history.getEnteredAt(), now).getSeconds();
                                        history.setDuration(seconds);
                                        historyRepository.save(history);
                                });

                // 2. Open new state record
                TaskStateHistory newHistory = TaskStateHistory.builder()
                                .taskId(task.getId())
                                .projectId(task.getProjectId())
                                .organizationId(task.getOrganizationId())
                                .stateId(toStateId)
                                .enteredAt(now)
                                .changedById(userId)
                                .build();
                historyRepository.save(newHistory);
        }

        public AnalyticsResponse getOrganizationAnalytics(UUID organizationId, int days) {
                LocalDateTime since = LocalDateTime.now().minusDays(days);
                List<TaskStateHistory> history = historyRepository.findByOrganizationIdAndEnteredAtAfter(organizationId,
                                since);
                return calculateAnalytics(history, since.toLocalDate(), LocalDate.now());
        }

        public AnalyticsResponse getProjectAnalytics(UUID projectId, int days) {
                LocalDateTime since = LocalDateTime.now().minusDays(days);
                List<TaskStateHistory> history = historyRepository.findByProjectIdAndEnteredAtAfter(projectId,
                                since);
                return calculateAnalytics(history, since.toLocalDate(), LocalDate.now());
        }

        private AnalyticsResponse calculateAnalytics(List<TaskStateHistory> history, LocalDate startDate,
                        LocalDate endDate) {
                log.info("Calculating analytics for {} history records", history.size());

                // Load all relevant states for names and types
                Set<UUID> stateIds = history.stream()
                                .map(TaskStateHistory::getStateId)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());

                Map<UUID, WorkflowState> stateMap = new HashMap<>();
                if (!stateIds.isEmpty()) {
                        stateMap = stateRepository.findAllById(stateIds).stream()
                                        .collect(Collectors.toMap(
                                                        WorkflowState::getId,
                                                        s -> s,
                                                        (s1, s2) -> s1 // Handle duplicates
                                        ));
                }

                final Map<UUID, WorkflowState> finalStateMap = stateMap;

                // 1. Cycle Time by State (Average)
                List<AnalyticsResponse.CycleTimeMetric> cycleTimeMetrics = history.stream()
                                .filter(h -> h.getDuration() != null && h.getStateId() != null)
                                .collect(Collectors.groupingBy(TaskStateHistory::getStateId,
                                                Collectors.averagingLong(TaskStateHistory::getDuration)))
                                .entrySet().stream()
                                .map(e -> {
                                        WorkflowState state = finalStateMap.get(e.getKey());
                                        return AnalyticsResponse.CycleTimeMetric.builder()
                                                        .stateName(state != null ? state.getName() : "Unknown State")
                                                        .averageDurationHours(e.getValue() / 3600.0)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                // 2. Throughput (Tasks entering DONE/END states per day)
                // Filter for completed items first
                Map<LocalDate, Long> actualCounts = history.stream()
                                .filter(h -> {
                                        if (h.getStateId() == null || h.getEnteredAt() == null)
                                                return false;
                                        WorkflowState state = finalStateMap.get(h.getStateId());
                                        return state != null && (state.getType() == StateType.DONE
                                                        || state.getType() == StateType.END);
                                })
                                .collect(Collectors.groupingBy(h -> h.getEnteredAt().toLocalDate(),
                                                Collectors.counting()));

                // Fill in all dates in the range
                List<AnalyticsResponse.ThroughputMetric> throughputMetrics = startDate.datesUntil(endDate.plusDays(1))
                                .map(date -> AnalyticsResponse.ThroughputMetric.builder()
                                                .date(date)
                                                .count(actualCounts.getOrDefault(date, 0L))
                                                .build())
                                .collect(Collectors.toList());

                // 3. State Distribution (Current distribution of active tasks)
                List<AnalyticsResponse.StateDistribution> distribution = history.stream()
                                .filter(h -> h.getExitedAt() == null && h.getStateId() != null)
                                .collect(Collectors.groupingBy(TaskStateHistory::getStateId, Collectors.counting()))
                                .entrySet().stream()
                                .map(e -> {
                                        WorkflowState state = finalStateMap.get(e.getKey());
                                        return AnalyticsResponse.StateDistribution.builder()
                                                        .stateName(state != null ? state.getName() : "Unknown State")
                                                        .count(e.getValue())
                                                        .build();
                                })
                                .collect(Collectors.toList());

                // 4. Summary
                Long totalCompleted = throughputMetrics.stream()
                                .mapToLong(AnalyticsResponse.ThroughputMetric::getCount)
                                .sum();
                Double avgCycleTime = cycleTimeMetrics.stream()
                                .mapToDouble(AnalyticsResponse.CycleTimeMetric::getAverageDurationHours)
                                .average()
                                .orElse(0.0);

                return AnalyticsResponse.builder()
                                .cycleTimeByState(cycleTimeMetrics)
                                .throughput(throughputMetrics)
                                .stateDistribution(distribution)
                                .summary(AnalyticsResponse.MetricsSummary.builder()
                                                .totalCompletedTasks(totalCompleted)
                                                .avgTotalCycleTimeHours(avgCycleTime)
                                                .efficiencyScore(75.0)
                                                .build())
                                .build();
        }

        private AnalyticsResponse createEmptyResponse() {
                return AnalyticsResponse.builder()
                                .cycleTimeByState(Collections.emptyList())
                                .throughput(Collections.emptyList())
                                .stateDistribution(Collections.emptyList())
                                .summary(AnalyticsResponse.MetricsSummary.builder()
                                                .totalCompletedTasks(0L)
                                                .avgTotalCycleTimeHours(0.0)
                                                .efficiencyScore(0.0)
                                                .build())
                                .build();
        }
}
