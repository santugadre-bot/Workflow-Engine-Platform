package com.workflow.engine.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

public class TaskHistoryResponse {
    private String id;
    private String fromStateName;
    private String toStateName;
    private String transitionName;
    private String performedByName;
    private String timestamp;

    public TaskHistoryResponse() {
    }

    public TaskHistoryResponse(String id, String fromStateName, String toStateName, String transitionName,
            String performedByName, String timestamp) {
        this.id = id;
        this.fromStateName = fromStateName;
        this.toStateName = toStateName;
        this.transitionName = transitionName;
        this.performedByName = performedByName;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFromStateName() {
        return fromStateName;
    }

    public void setFromStateName(String fromStateName) {
        this.fromStateName = fromStateName;
    }

    public String getToStateName() {
        return toStateName;
    }

    public void setToStateName(String toStateName) {
        this.toStateName = toStateName;
    }

    public String getTransitionName() {
        return transitionName;
    }

    public void setTransitionName(String transitionName) {
        this.transitionName = transitionName;
    }

    public String getPerformedByName() {
        return performedByName;
    }

    public void setPerformedByName(String performedByName) {
        this.performedByName = performedByName;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public static TaskHistoryResponseBuilder builder() {
        return new TaskHistoryResponseBuilder();
    }

    public static class TaskHistoryResponseBuilder {
        private String id;
        private String fromStateName;
        private String toStateName;
        private String transitionName;
        private String performedByName;
        private String timestamp;

        public TaskHistoryResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public TaskHistoryResponseBuilder fromStateName(String fromStateName) {
            this.fromStateName = fromStateName;
            return this;
        }

        public TaskHistoryResponseBuilder toStateName(String toStateName) {
            this.toStateName = toStateName;
            return this;
        }

        public TaskHistoryResponseBuilder transitionName(String transitionName) {
            this.transitionName = transitionName;
            return this;
        }

        public TaskHistoryResponseBuilder performedByName(String performedByName) {
            this.performedByName = performedByName;
            return this;
        }

        public TaskHistoryResponseBuilder timestamp(String timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public TaskHistoryResponse build() {
            return new TaskHistoryResponse(id, fromStateName, toStateName, transitionName, performedByName, timestamp);
        }
    }
}
