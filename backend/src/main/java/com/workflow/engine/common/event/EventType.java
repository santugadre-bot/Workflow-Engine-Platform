package com.workflow.engine.common.event;

public enum EventType {
    TASK_CREATED,
    TASK_TRANSITIONED,
    TASK_UPDATED,
    TASK_ASSIGNED,
    COMMENT_ADDED,
    APPROVAL_REQUESTED,
    APPROVAL_GRANTED,
    APPROVAL_REJECTED,
    TASK_OVERDUE,
    TASK_DUE_SOON
}
