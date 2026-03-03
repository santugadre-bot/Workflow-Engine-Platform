package com.workflow.engine.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private String id;
    private String userId;
    private String userName;
    private String actionType;
    private String entityType;
    private String entityId;
    private String metadata;
    private String timestamp;
}
