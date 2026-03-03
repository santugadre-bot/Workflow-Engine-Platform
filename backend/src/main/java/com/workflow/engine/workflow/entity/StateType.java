package com.workflow.engine.workflow.entity;

/**
 * State types for workflow validation.
 * START — entry point, exactly 1 per workflow
 * IN_PROGRESS — intermediate work states
 * DONE — completed states (also treated as END)
 * END — terminal state, at least 1 per workflow
 */
public enum StateType {
    START,
    IN_PROGRESS,
    DONE,
    END
}
