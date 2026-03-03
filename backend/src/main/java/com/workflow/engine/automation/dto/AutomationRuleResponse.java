package com.workflow.engine.automation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AutomationRuleResponse {
    private String id;
    private String name;
    private String description;
    private String projectId;
    private String triggerEvent;
    private String conditionsJson;
    private String actionType;
    private String actionConfigJson;
    private boolean active;
    private String createdAt;

    public AutomationRuleResponse() {
    }

    public AutomationRuleResponse(String id, String name, String description, String projectId, String triggerEvent,
            String conditionsJson, String actionType, String actionConfigJson, boolean active, String createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.projectId = projectId;
        this.triggerEvent = triggerEvent;
        this.conditionsJson = conditionsJson;
        this.actionType = actionType;
        this.actionConfigJson = actionConfigJson;
        this.active = active;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTriggerEvent() {
        return triggerEvent;
    }

    public void setTriggerEvent(String triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    public String getConditionsJson() {
        return conditionsJson;
    }

    public void setConditionsJson(String conditionsJson) {
        this.conditionsJson = conditionsJson;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getActionConfigJson() {
        return actionConfigJson;
    }

    public void setActionConfigJson(String actionConfigJson) {
        this.actionConfigJson = actionConfigJson;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public static AutomationRuleResponseBuilder builder() {
        return new AutomationRuleResponseBuilder();
    }

    public static class AutomationRuleResponseBuilder {
        private String id;
        private String name;
        private String description;
        private String projectId;
        private String triggerEvent;
        private String conditionsJson;
        private String actionType;
        private String actionConfigJson;
        private boolean active;
        private String createdAt;

        public AutomationRuleResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public AutomationRuleResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AutomationRuleResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public AutomationRuleResponseBuilder projectId(String projectId) {
            this.projectId = projectId;
            return this;
        }

        public AutomationRuleResponseBuilder triggerEvent(String triggerEvent) {
            this.triggerEvent = triggerEvent;
            return this;
        }

        public AutomationRuleResponseBuilder conditionsJson(String conditionsJson) {
            this.conditionsJson = conditionsJson;
            return this;
        }

        public AutomationRuleResponseBuilder actionType(String actionType) {
            this.actionType = actionType;
            return this;
        }

        public AutomationRuleResponseBuilder actionConfigJson(String actionConfigJson) {
            this.actionConfigJson = actionConfigJson;
            return this;
        }

        public AutomationRuleResponseBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public AutomationRuleResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AutomationRuleResponse build() {
            return new AutomationRuleResponse(id, name, description, projectId, triggerEvent, conditionsJson,
                    actionType, actionConfigJson, active, createdAt);
        }
    }
}
