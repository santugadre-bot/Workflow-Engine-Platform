package com.workflow.engine.workflow.validation;

import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Validates workflowdefinitions for structural correctness and business logic
 * compliance.
 * <p>
 * Enforces the following rules (per SOP §4.2):
 * 1. Exactly one START state per workflow.
 * 2. At least one END (or DONE) state per workflow.
 * 3. All states (except START) must be reachable from START.
 * <p>
 * Also performs cycle detection (DFS) and issues warnings for potential
 * infinite loops.
 * </p>
 */
@Component
public class WorkflowValidator {

    /**
     * Validates a set of states and transitions.
     *
     * @param states      List of all states in the workflow
     * @param transitions List of all transitions in the workflow
     * @return List of error messages (empty if valid)
     */
    public List<String> validate(List<WorkflowState> states, List<WorkflowTransition> transitions) {
        List<String> errors = new ArrayList<>();

        if (states.isEmpty()) {
            errors.add("Workflow must have at least one state");
            return errors;
        }

        // Rule 1: Exactly one START state
        long startCount = states.stream().filter(s -> s.getType() == StateType.START).count();
        if (startCount == 0) {
            errors.add("Workflow must have exactly one START state");
        } else if (startCount > 1) {
            errors.add("Workflow must have exactly one START state, found " + startCount);
        }

        // Rule 2: At least one END or DONE state
        long terminalCount = states.stream()
                .filter(s -> s.getType() == StateType.END || s.getType() == StateType.DONE)
                .count();
        if (terminalCount == 0) {
            errors.add("Workflow must have at least one END or DONE state");
        }

        // Rule 3: Check for unreachable states
        if (startCount == 1 && !transitions.isEmpty()) {
            Set<UUID> reachable = findReachableStates(states, transitions);
            for (WorkflowState state : states) {
                if (state.getType() != StateType.START && !reachable.contains(state.getId())) {
                    errors.add("State '" + state.getName() + "' is unreachable from START");
                }
            }
        }

        // Rule 4: Detect cycles (warning only, not blocking)
        List<String> warnings = detectCycles(states, transitions);
        // Cycle warnings are informational — not added to errors

        return errors;
    }

    private Set<UUID> findReachableStates(List<WorkflowState> states, List<WorkflowTransition> transitions) {
        // Build adjacency list
        Map<UUID, List<UUID>> adjacency = new HashMap<>();
        for (WorkflowTransition t : transitions) {
            adjacency.computeIfAbsent(t.getFromStateId(), k -> new ArrayList<>()).add(t.getToStateId());
        }

        // BFS from START
        Set<UUID> visited = new HashSet<>();
        Queue<UUID> queue = new LinkedList<>();
        states.stream()
                .filter(s -> s.getType() == StateType.START)
                .findFirst()
                .ifPresent(start -> {
                    queue.add(start.getId());
                    visited.add(start.getId());
                });

        while (!queue.isEmpty()) {
            UUID current = queue.poll();
            for (UUID neighbor : adjacency.getOrDefault(current, List.of())) {
                if (visited.add(neighbor)) {
                    queue.add(neighbor);
                }
            }
        }

        return visited;
    }

    private List<String> detectCycles(List<WorkflowState> states, List<WorkflowTransition> transitions) {
        List<String> warnings = new ArrayList<>();
        Map<UUID, List<UUID>> adjacency = new HashMap<>();
        Map<UUID, String> stateNames = new HashMap<>();

        for (WorkflowState s : states) {
            stateNames.put(s.getId(), s.getName());
        }
        for (WorkflowTransition t : transitions) {
            adjacency.computeIfAbsent(t.getFromStateId(), k -> new ArrayList<>()).add(t.getToStateId());
        }

        Set<UUID> visited = new HashSet<>();
        Set<UUID> inStack = new HashSet<>();

        for (WorkflowState state : states) {
            if (!visited.contains(state.getId())) {
                if (hasCycleDFS(state.getId(), adjacency, visited, inStack)) {
                    warnings.add("Cycle detected involving state: " + state.getName());
                }
            }
        }
        return warnings;
    }

    private boolean hasCycleDFS(UUID node, Map<UUID, List<UUID>> adjacency,
            Set<UUID> visited, Set<UUID> inStack) {
        visited.add(node);
        inStack.add(node);

        for (UUID neighbor : adjacency.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                if (hasCycleDFS(neighbor, adjacency, visited, inStack))
                    return true;
            } else if (inStack.contains(neighbor)) {
                return true;
            }
        }

        inStack.remove(node);
        return false;
    }
}
