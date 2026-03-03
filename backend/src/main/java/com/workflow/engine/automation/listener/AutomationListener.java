package com.workflow.engine.automation.listener;

import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.common.event.WorkflowEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AutomationListener {

    private static final Logger log = LoggerFactory.getLogger(AutomationListener.class);

    private final AutomationService automationService;

    @Async
    @EventListener
    public void handleWorkflowEvent(WorkflowEvent event) {
        log.info("Received workflow event: {} for source: {}", event.getType(), event.getSourceId());
        automationService.processEvent(event);
    }
}
