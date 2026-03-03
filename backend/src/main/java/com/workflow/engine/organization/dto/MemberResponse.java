package com.workflow.engine.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import com.workflow.engine.auth.entity.UserStatus;

public class MemberResponse {
    private String id;
    private String userId;
    private String email;
    private String displayName;
    private String role;
    private UserStatus status;
    private int workloadScore;
    private long assignedTaskCount;
    private String avatarUrl;
    private String joinedAt;
    private String lastActiveAt;

    public MemberResponse() {
    }

    public MemberResponse(String id, String userId, String email, String displayName, String role,
            UserStatus status, int workloadScore, long assignedTaskCount, String avatarUrl, String joinedAt,
            String lastActiveAt) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.status = status;
        this.workloadScore = workloadScore;
        this.assignedTaskCount = assignedTaskCount;
        this.avatarUrl = avatarUrl;
        this.joinedAt = joinedAt;
        this.lastActiveAt = lastActiveAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public int getWorkloadScore() {
        return workloadScore;
    }

    public void setWorkloadScore(int workloadScore) {
        this.workloadScore = workloadScore;
    }

    public long getAssignedTaskCount() {
        return assignedTaskCount;
    }

    public void setAssignedTaskCount(long assignedTaskCount) {
        this.assignedTaskCount = assignedTaskCount;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public String getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(String lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    public static MemberResponseBuilder builder() {
        return new MemberResponseBuilder();
    }

    public static class MemberResponseBuilder {
        private String id;
        private String userId;
        private String email;
        private String displayName;
        private String role;
        private UserStatus status;
        private int workloadScore;
        private long assignedTaskCount;
        private String avatarUrl;
        private String joinedAt;
        private String lastActiveAt;

        public MemberResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public MemberResponseBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public MemberResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public MemberResponseBuilder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }

        public MemberResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public MemberResponseBuilder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public MemberResponseBuilder workloadScore(int workloadScore) {
            this.workloadScore = workloadScore;
            return this;
        }

        public MemberResponseBuilder assignedTaskCount(long assignedTaskCount) {
            this.assignedTaskCount = assignedTaskCount;
            return this;
        }

        public MemberResponseBuilder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public MemberResponseBuilder joinedAt(String joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }

        public MemberResponseBuilder lastActiveAt(String lastActiveAt) {
            this.lastActiveAt = lastActiveAt;
            return this;
        }

        public MemberResponse build() {
            return new MemberResponse(id, userId, email, displayName, role, status, workloadScore, assignedTaskCount,
                    avatarUrl, joinedAt, lastActiveAt);
        }
    }
}
