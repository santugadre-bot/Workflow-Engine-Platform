package com.workflow.engine.common.exception;

/**
 * Thrown when a user attempts an action they do not have permission to perform.
 *
 * HTTP status is controlled by {@link GlobalExceptionHandler} — do NOT add
 * {@code @ResponseStatus} here, as it conflicts with the centralized handler.
 */
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}
