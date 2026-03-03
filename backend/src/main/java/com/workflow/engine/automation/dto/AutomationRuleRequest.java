package com.workflow.engine.automation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRuleRequest {
    private String name;
    private String description;
    private String triggerEvent;
    private String conditionsJson;
    private String actionType;
    private String actionConfigJson;
    private boolean active;
}
