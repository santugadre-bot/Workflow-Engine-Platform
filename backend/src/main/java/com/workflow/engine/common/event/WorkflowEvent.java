package com.workflow.engine.common.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
public class WorkflowEvent extends ApplicationEvent {
    private final UUID sourceId;
    private final EventType type;
    private final Map<String, Object> payload;
    private final LocalDateTime occurredAt;
    private final UUID triggeredBy;
    private int automationDepth = 0;

    public WorkflowEvent(Object source, UUID sourceId, EventType type, Map<String, Object> payload, UUID triggeredBy) {
        super(source);
        this.sourceId = sourceId;
        this.type = type;
        this.payload = payload;
        this.triggeredBy = triggeredBy;
        this.occurredAt = LocalDateTime.now();
    }

    public WorkflowEvent withDepth(int depth) {
        this.automationDepth = depth;
        return this;
    }

    public UUID getSourceId() {
        return sourceId;
    }

    public EventType getType() {
        return type;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public UUID getTriggeredBy() {
        return triggeredBy;
    }

    public int getAutomationDepth() {
        return automationDepth;
    }
}
