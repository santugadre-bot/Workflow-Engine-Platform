package com.workflow.engine.approval.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ApprovalResponse {
    private UUID id;
    private UUID taskId;
    private String taskTitle;
    private UUID projectId;
    private String projectName;
    private UUID transitionId;
    private String transitionName;
    private String fromStateName;
    private String toStateName;
    private UUID requesterId;
    private String requesterName;
    private String requesterInitials;
    private UUID approverId;
    private String approverName;
    private String status;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
