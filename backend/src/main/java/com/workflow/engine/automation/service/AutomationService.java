package com.workflow.engine.automation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.engine.automation.dto.AutomationRuleRequest;
import com.workflow.engine.automation.dto.AutomationRuleResponse;
import com.workflow.engine.automation.entity.AutomationRule;
import com.workflow.engine.automation.repository.AutomationRuleRepository;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutomationService {

    private static final Logger log = LoggerFactory.getLogger(AutomationService.class);

    private final AutomationRuleRepository ruleRepository;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;
    private final OrganizationRepository organizationRepository;
    private final ObjectMapper objectMapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public List<AutomationRuleResponse> listRulesByProject(UUID projectId) {
        return ruleRepository.findByProjectIdAndTriggerEventAndActiveTrue(projectId, "CREATED").stream() // Simplification:
                                                                                                         // just list
                                                                                                         // all or
                                                                                                         // filter by
                                                                                                         // project
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<AutomationRuleResponse> listAllRulesByProject(UUID projectId) {
        // We need a repository method for all rules in project regardless of event
        return ruleRepository.findAll().stream()
                .filter(r -> r.getProjectId().equals(projectId))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AutomationRuleResponse createRule(UUID projectId, AutomationRuleRequest request) {
        AutomationRule rule = AutomationRule.builder()
                .name(request.getName())
                .description(request.getDescription())
                .projectId(projectId)
                .triggerEvent(request.getTriggerEvent())
                .conditionsJson(request.getConditionsJson())
                .actionType(request.getActionType())
                .actionConfigJson(request.getActionConfigJson())
                .active(request.isActive())
                .build();
        return toResponse(ruleRepository.save(rule));
    }

    public AutomationRuleResponse updateRule(UUID ruleId, AutomationRuleRequest request) {
        AutomationRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("AutomationRule", "id", ruleId));
        rule.setName(request.getName());
        rule.setDescription(request.getDescription());
        rule.setTriggerEvent(request.getTriggerEvent());
        rule.setConditionsJson(request.getConditionsJson());
        rule.setActionType(request.getActionType());
        rule.setActionConfigJson(request.getActionConfigJson());
        rule.setActive(request.isActive());
        return toResponse(ruleRepository.save(rule));
    }

    public void deleteRule(UUID ruleId) {
        ruleRepository.deleteById(ruleId);
    }

    private AutomationRuleResponse toResponse(AutomationRule rule) {
        return AutomationRuleResponse.builder()
                .id(rule.getId().toString())
                .name(rule.getName())
                .description(rule.getDescription())
                .projectId(rule.getProjectId().toString())
                .triggerEvent(rule.getTriggerEvent())
                .conditionsJson(rule.getConditionsJson())
                .actionType(rule.getActionType())
                .actionConfigJson(rule.getActionConfigJson())
                .active(rule.isActive())
                .createdAt(rule.getCreatedAt() != null ? rule.getCreatedAt().toString() : null)
                .build();
    }

    @org.springframework.transaction.event.TransactionalEventListener(phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
    @Async
    public void processEvent(com.workflow.engine.common.event.WorkflowEvent event) {
        // Loop Protection
        if (event.getAutomationDepth() > 5) {
            log.warn("Automation recursion limit reached (Depth: {}). Stopping propagation.",
                    event.getAutomationDepth());
            return;
        }

        UUID taskId = (UUID) event.getPayload().get("taskId");
        log.info("Processing automation event. eventType={}, taskId={}, depth={}",
                event.getType(), taskId, event.getAutomationDepth());

        UUID projectId = (UUID) event.getPayload().get("projectId");
        // For transitions, we might need to fetch the task to get the project ID if not
        // in payload
        if (projectId == null && event.getPayload().containsKey("taskId")) {
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task != null) {
                projectId = task.getProjectId();
            }
        }

        if (projectId == null) {
            log.warn("Could not determine project ID for event {}, skipping automation", event.getType());
            return;
        }

        List<AutomationRule> rules = ruleRepository.findByProjectIdAndTriggerEventAndActiveTrue(
                projectId, event.getType().name());

        for (AutomationRule rule : rules) {
            try {
                if (checkConditions(rule, event)) {
                    executeAction(rule, event);
                }
            } catch (Exception e) {
                log.error("Failed to execute automation rule {}: {}", rule.getId(), e.getMessage());
            }
        }
    }

    private boolean checkConditions(AutomationRule rule, com.workflow.engine.common.event.WorkflowEvent event) {
        if (rule.getConditionsJson() == null || rule.getConditionsJson().isBlank()) {
            return true;
        }

        log.info("Checking conditions for rule {}: {}", rule.getName(), rule.getConditionsJson());

        try {
            JsonNode conditions = objectMapper.readTree(rule.getConditionsJson());
            if (conditions.isArray() && conditions.size() > 0) {
                for (JsonNode condition : conditions) {
                    if (!evaluateCondition(condition, event)) {
                        log.info("Condition failed for rule {}", rule.getName());
                        return false;
                    }
                }
            } else if (!conditions.isArray()) {
                log.warn("Conditions JSON for rule {} is not an array: {}", rule.getId(), rule.getConditionsJson());
                // If it's an object, maybe it's a single condition? For now, be strict.
                return false;
            }

            log.info("All conditions passed for rule {}", rule.getName());
            return true;
        } catch (IOException e) {
            log.error("Failed to parse conditions JSON for rule {}: {}", rule.getId(), e.getMessage());
            return false;
        }
    }

    private boolean evaluateCondition(JsonNode condition, com.workflow.engine.common.event.WorkflowEvent event) {
        String field = condition.get("field").asText();
        String operator = condition.get("operator").asText();
        String value = condition.get("value").asText();

        Object actualValue = null;
        if (event.getPayload().containsKey("task")) {
            actualValue = getFieldValueFromPayload(event.getPayload(), field);
        } else if (event.getPayload().containsKey("taskId")) {
            Object taskIdObj = event.getPayload().get("taskId");
            UUID taskId = taskIdObj instanceof UUID ? (UUID) taskIdObj : UUID.fromString(taskIdObj.toString());
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task != null) {
                actualValue = getFieldValueFromTask(task, field);
            } else {
                log.warn("Task not found for automation condition check, taskId: {}", taskId);
            }
        }

        log.info("Evaluating rule condition: field={}, operator={}, expected={}, actual={}",
                field, operator, value, actualValue);

        if (actualValue == null)
            return false;

        String actualStr = actualValue.toString();
        boolean result = false;
        switch (operator) {
            case "EQUALS":
                result = actualStr.equalsIgnoreCase(value);
                break;
            case "NOT_EQUALS":
                result = !actualStr.equalsIgnoreCase(value);
                break;
            case "CONTAINS":
                result = actualStr.toLowerCase().contains(value.toLowerCase());
                break;
        }
        log.info("Condition evaluation result: {}", result);
        return result;
    }

    private Object getFieldValueFromTask(Task task, String field) {
        switch (field) {
            case "priority":
                return task.getPriority().name();
            case "assigneeId":
                return task.getAssigneeId() != null ? task.getAssigneeId().toString() : "";
            case "title":
                return task.getTitle();
            case "description":
                return task.getDescription();
            default:
                return null;
        }
    }

    private Object getFieldValueFromPayload(java.util.Map<String, Object> payload, String field) {
        // Fallback or helper if payload has flattened fields
        return payload.get(field);
    }

    private void executeAction(AutomationRule rule, com.workflow.engine.common.event.WorkflowEvent event) {
        log.info("Executing action {} for rule {}", rule.getActionType(), rule.getName());
        UUID taskId = (UUID) event.getPayload().get("taskId");
        Task task = taskId != null ? taskRepository.findById(taskId).orElse(null) : null;

        if (task == null) {
            log.warn("Task not found for action execution, task ID: {}", taskId);
            return;
        }

        switch (rule.getActionType()) {
            case "NOTIFY":
                handleNotifyAction(rule, task);
                break;
            case "UPDATE_PRIORITY":
                handleUpdatePriorityAction(rule, task, event.getAutomationDepth());
                break;
            case "REASSIGN":
                handleReassignAction(rule, task, event.getAutomationDepth());
                break;
            case "UPDATE_STATUS":
                handleUpdateStatusAction(rule, task, event.getAutomationDepth());
                break;
            default:
                log.warn("Unknown action type: {}", rule.getActionType());
        }
    }

    private void handleReassignAction(AutomationRule rule, Task task, int currentDepth) {
        log.info("Automation: Reassigning task {}", task.getId());
        try {
            if (rule.getActionConfigJson() != null && !rule.getActionConfigJson().isBlank()) {
                JsonNode config = objectMapper.readTree(rule.getActionConfigJson());
                if (config.has("assigneeId")) {
                    String assigneeIdStr = config.get("assigneeId").asText();
                    // Validate UUID format
                    UUID assigneeId = UUID.fromString(assigneeIdStr);
                    task.setAssigneeId(assigneeId);
                    taskRepository.save(task);

                    // Publish event with incremented depth
                    eventPublisher.publishEvent(new com.workflow.engine.common.event.WorkflowEvent(
                            this,
                            task.getId(),
                            com.workflow.engine.common.event.EventType.TASK_UPDATED,
                            java.util.Map.of("taskId", task.getId(), "projectId", task.getProjectId()),
                            com.workflow.engine.common.config.SystemConstants.SYSTEM_USER_ID)
                            .withDepth(currentDepth + 1));

                    notificationService.createNotification(
                            assigneeId,
                            "Task Reassigned (Automation)",
                            "You have been assigned to task " + task.getTitle() + " by automation rule: "
                                    + rule.getName(),
                            "TASK_ASSIGNED",
                            task.getId(),
                            task.getOrganizationId());
                }
            }
        } catch (Exception e) {
            log.error("Failed to reassign task via automation {}: {}", rule.getId(), e.getMessage());
        }
    }

    // Lazy injection to avoid circular dependency (TaskTransitionService ->
    // EventPublisher, but we need it here)
    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.workflow.engine.task.service.TaskTransitionService transitionService;

    private void handleUpdateStatusAction(AutomationRule rule, Task task, int currentDepth) {
        log.info("Automation: Updating status for task {}", task.getId());
        try {
            if (rule.getActionConfigJson() != null && !rule.getActionConfigJson().isBlank()) {
                JsonNode config = objectMapper.readTree(rule.getActionConfigJson());
                if (config.has("transitionId")) {
                    String transitionIdStr = config.get("transitionId").asText();
                    UUID transitionId = UUID.fromString(transitionIdStr);

                    // Fetch Organization Owner to act as the "System" user
                    Organization organization = organizationRepository.findById(task.getOrganizationId())
                            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id",
                                    task.getOrganizationId()));

                    // Trigger transition with incremented depth
                    transitionService.transition(
                            task.getId(),
                            transitionId,
                            organization.getOwnerId(), // Use Organization Owner instead of fixed System User ID
                            currentDepth + 1);
                }
            }
        } catch (Exception e) {
            log.error("Failed to transition task via automation {}: {}", rule.getId(), e.getMessage());
        }
    }

    private void handleNotifyAction(AutomationRule rule, Task task) {
        String message = "Automation triggered for task: " + task.getTitle();
        String title = "Automation: " + rule.getName();

        try {
            if (rule.getActionConfigJson() != null && !rule.getActionConfigJson().isBlank()) {
                JsonNode config = objectMapper.readTree(rule.getActionConfigJson());
                if (config.has("message"))
                    message = config.get("message").asText();
                if (config.has("title"))
                    title = config.get("title").asText();
            }
        } catch (IOException e) {
            log.warn("Failed to parse action config for rule {}", rule.getId());
        }

        notificationService.createNotification(
                task.getAssigneeId(),
                title,
                message,
                "AUTOMATION",
                task.getId(),
                task.getOrganizationId());
    }

    private void handleUpdatePriorityAction(AutomationRule rule, Task task, int currentDepth) {
        log.info("Automation: Updating priority for task {}", task.getId());
        try {
            if (rule.getActionConfigJson() != null && !rule.getActionConfigJson().isBlank()) {
                JsonNode config = objectMapper.readTree(rule.getActionConfigJson());
                if (config.has("priority")) {
                    String priorityStr = config.get("priority").asText();
                    task.setPriority(com.workflow.engine.task.entity.Priority.valueOf(priorityStr.toUpperCase()));
                    taskRepository.save(task);

                    // Publish event with incremented depth
                    eventPublisher.publishEvent(new com.workflow.engine.common.event.WorkflowEvent(
                            this,
                            task.getId(),
                            com.workflow.engine.common.event.EventType.TASK_UPDATED,
                            java.util.Map.of("taskId", task.getId(), "projectId", task.getProjectId()),
                            com.workflow.engine.common.config.SystemConstants.SYSTEM_USER_ID)
                            .withDepth(currentDepth + 1));
                }
            }
        } catch (Exception e) {
            log.error("Failed to update priority via automation {}: {}", rule.getId(), e.getMessage());
        }
    }
}
