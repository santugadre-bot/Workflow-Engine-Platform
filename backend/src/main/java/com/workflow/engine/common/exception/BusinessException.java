package com.workflow.engine.common.exception;

/**
 * Thrown when a business rule is violated (e.g. assigning a task to a
 * non-member, starting a sprint when one is already active).
 *
 * HTTP status is controlled by {@link GlobalExceptionHandler} — do NOT add
 * {@code @ResponseStatus} here, as it conflicts with the centralized handler.
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
