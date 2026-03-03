package com.workflow.engine.project.dto;

import com.workflow.engine.workflow.dto.WorkflowResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class ProjectResponse {
    private String id;
    private String name;
    private String description;
    private String organizationId;
    private String workflowId;
    private String role;
    private String createdAt;
    private boolean showDueDate;
    private boolean showStoryPoints;
    private boolean archived;

    // Elite UI Fields
    private long totalTaskCount;
    private long completedTaskCount;
    private java.util.List<String> members; // List of member names/avatars
    private String status; // ON_TRACK, AT_RISK, COMPLETED
    private com.workflow.engine.project.entity.ProjectStatus explicitStatus;
    private long overdueTaskCount;
    private long inProgressTaskCount;
    private double velocity; // Tasks completed per week
    private java.util.Map<String, Long> priorityDistribution;
    private java.util.Map<String, Long> workloadDistribution;
    private java.util.List<ProjectMemberDetailResponse> team;
    private WorkflowResponse workflow;
}
