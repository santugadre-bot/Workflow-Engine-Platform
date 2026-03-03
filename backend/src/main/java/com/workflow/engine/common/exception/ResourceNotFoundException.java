package com.workflow.engine.common.exception;

/**
 * Thrown when a requested resource does not exist in the database.
 *
 * HTTP status is controlled by {@link GlobalExceptionHandler} — do NOT add
 * {@code @ResponseStatus} here, as it conflicts with the centralized handler.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
