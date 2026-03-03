package com.workflow.engine.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private String id;
    private String title;
    private String message;
    private String type;
    private String referenceId;
    private String organizationId;
    private boolean read;
    private String createdAt;
}
