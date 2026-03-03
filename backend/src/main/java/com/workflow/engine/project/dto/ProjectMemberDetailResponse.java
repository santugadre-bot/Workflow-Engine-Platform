package com.workflow.engine.project.dto;

import com.workflow.engine.auth.entity.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectMemberDetailResponse {
    private String userId;
    private String name;
    private String email;
    private String avatarUrl;
    private String role;
    private UserStatus status;
    private long assignedTaskCount;
    private List<String> activeTaskTitles;
    private Integer workloadScore;
    private List<String> suggestedTaskTitles;
    private String joinedAt;
    private String lastActiveAt;
    private String lastTaskCompletedAt;
}
